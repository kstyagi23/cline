import type {
	ModelCapability,
	ModelInfo,
	ModelModality,
	ModelPricing,
} from "@cline/shared";

export const LITELLM_CATALOG_URL =
	"https://raw.githubusercontent.com/BerriAI/litellm/refs/heads/main/model_prices_and_context_window.json";

let catalog = new Map<string, ModelInfo>();
let aliases = new Map<string, string[]>();

function positive(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value > 0
		? Math.floor(value)
		: undefined;
}

function price(value: unknown): number | undefined {
	return typeof value === "number" && Number.isFinite(value) && value >= 0
		? value * 1_000_000
		: undefined;
}

const priceFields = {
	input: "input_cost_per_token",
	output: "output_cost_per_token",
	cacheWrite: "cache_creation_input_token_cost",
	cacheRead: "cache_read_input_token_cost",
} as const;

function normalizePricing(
	record: Record<string, unknown>,
): ModelPricing | undefined {
	const pricing: ModelPricing = {};
	for (const [key, field] of Object.entries(priceFields)) {
		const value = price(record[field]);
		if (value !== undefined) pricing[key as keyof typeof priceFields] = value;
	}
	const thresholds = new Set<number>();
	for (const field of Object.keys(record)) {
		const match = /_above_(\d+)(k)?_tokens$/.exec(field);
		if (match) thresholds.add(Number(match[1]) * (match[2] ? 1000 : 1));
	}
	const tiers = [...thresholds]
		.sort((a, b) => a - b)
		.flatMap((threshold) => {
			const rates: ModelPricing = {};
			for (const [key, field] of Object.entries(priceFields)) {
				const value = price(
					record[`${field}_above_${threshold}_tokens`] ??
						record[`${field}_above_${threshold / 1000}k_tokens`],
				);
				if (value !== undefined) rates[key as keyof typeof priceFields] = value;
			}
			return Object.keys(rates).length
				? [{ aboveInputTokens: threshold, ...rates }]
				: [];
		});
	if (tiers.length) pricing.tiers = tiers;
	return Object.keys(pricing).length ? pricing : undefined;
}

const capabilityFields: Partial<Record<ModelCapability, string>> = {
	images: "supports_vision",
	tools: "supports_function_calling",
	streaming: "supports_native_streaming",
	"prompt-cache": "supports_prompt_caching",
	reasoning: "supports_reasoning",
	"computer-use": "supports_computer_use",
	structured_output: "supports_response_schema",
	files: "supports_pdf_input",
};

function modalities(value: unknown): ModelModality[] | undefined {
	if (!Array.isArray(value)) return undefined;
	return value.filter((item): item is ModelModality =>
		["text", "image", "audio", "video", "pdf"].includes(item),
	);
}

/** Install a validated snapshot; a failed download never clears the current catalog. */
export function setLiteLLMModelCatalog(data: unknown): void {
	if (!data || typeof data !== "object" || Array.isArray(data)) {
		throw new Error("Invalid LiteLLM model catalog");
	}
	const next = new Map<string, ModelInfo>();
	const nextAliases = new Map<string, string[]>();
	for (const [id, value] of Object.entries(data)) {
		if (!value || typeof value !== "object" || Array.isArray(value)) continue;
		const record = value as Record<string, unknown>;
		// The upstream file includes sample_spec, which is documentation, not a model.
		if (id === "sample_spec" || typeof record.litellm_provider !== "string")
			continue;
		const capabilities = Object.entries(capabilityFields).flatMap(
			([capability, field]) =>
				record[field] === true ? [capability as ModelCapability] : [],
		);
		const effortValues = [
			"none",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max",
		] as const;
		const efforts = effortValues.filter(
			(effort) =>
				record[`supports_${effort}_reasoning_effort`] === true ||
				(record.supports_reasoning === true &&
					["low", "medium", "high"].includes(effort) &&
					record[`supports_${effort}_reasoning_effort`] !== false),
		);
		if (efforts.length) capabilities.push("reasoning-effort");
		const input = modalities(record.supported_modalities);
		const output = modalities(record.supported_output_modalities);
		const maxInputTokens = positive(record.max_input_tokens);
		next.set(id, {
			id,
			name: id,
			maxTokens:
				positive(record.max_output_tokens) ?? positive(record.max_tokens),
			maxInputTokens,
			contextWindow: maxInputTokens,
			...(Object.values(capabilityFields).some(
				(field) => typeof record[field] === "boolean",
			)
				? { capabilities }
				: {}),
			...(input && output ? { modalities: { input, output } } : {}),
			...(record.mode === "chat" || record.mode === "completion"
				? { operation: "language" as const }
				: {}),
			...(efforts.length
				? {
						reasoningOptions: [
							{ type: "effort" as const, values: [...efforts] },
						],
					}
				: {}),
			pricing: normalizePricing(record),
			metadata: { litellm: record },
		});
		const slash = id.indexOf("/");
		if (slash >= 0) {
			const bare = id.slice(slash + 1);
			nextAliases.set(bare, [...(nextAliases.get(bare) ?? []), id]);
		}
	}
	if (!next.size) throw new Error("LiteLLM model catalog contains no models");
	catalog = next;
	aliases = nextAliases;
}

/** Exact IDs win; provider-qualified aliases disambiguate bare IDs without guessing prices. */
export function getLiteLLMModelInfo(
	modelId: string,
	providerId?: string,
): ModelInfo | undefined {
	let match = catalog.get(modelId);
	const bare = modelId.includes("/")
		? modelId.slice(modelId.indexOf("/") + 1)
		: modelId;
	const candidates = aliases.get(modelId) ?? aliases.get(bare) ?? [];
	if (!match && providerId) {
		const prefixes =
			providerId === "azure"
				? ["azure", "azure_ai"]
				: providerId === "openai-native"
					? ["openai"]
					: providerId === "vertex"
						? ["vertex_ai", "vertex_ai-anthropic"]
						: providerId === "gemini"
							? ["gemini", "vertex_ai"]
							: [providerId];
		for (const prefix of prefixes) {
			match =
				catalog.get(`${prefix}/${modelId}`) ?? catalog.get(`${prefix}/${bare}`);
			if (match) break;
		}
	}
	if (!match && modelId.includes("/")) match = catalog.get(bare);
	if (!match && candidates.length === 1) match = catalog.get(candidates[0]);
	return match ? { ...match, id: modelId, name: modelId } : undefined;
}

/** Refresh bundled facts when requested, but keep explicit settings authoritative. */
export function enrichLiteLLMModelInfo(
	model: ModelInfo,
	providerId?: string,
	preferCatalog = false,
): ModelInfo {
	const facts = getLiteLLMModelInfo(model.id, providerId);
	if (!facts) return model;
	const defined = (value: ModelInfo) =>
		Object.fromEntries(
			Object.entries(value).filter(([, entry]) => entry !== undefined),
		);
	return {
		...(preferCatalog ? defined(model) : defined(facts)),
		...(preferCatalog ? defined(facts) : defined(model)),
		id: model.id,
		name: model.name ?? model.id,
		pricing: preferCatalog
			? mergeLiteLLMPricing(model.pricing, facts.pricing)
			: mergeLiteLLMPricing(facts.pricing, model.pricing),
		metadata: { ...facts.metadata, ...model.metadata },
	};
}

export function mergeLiteLLMPricing(
	base?: ModelPricing,
	override?: ModelPricing,
): ModelPricing | undefined {
	if (!base && !override) return undefined;
	const result = { ...base, ...override };
	if (base?.tiers && !override?.tiers) {
		result.tiers = base.tiers.map((tier) => {
			const rates = { ...tier };
			for (const key of Object.keys(
				priceFields,
			) as (keyof typeof priceFields)[]) {
				if (override?.[key] !== undefined) rates[key] = override[key];
			}
			return rates;
		});
	}
	return result;
}
