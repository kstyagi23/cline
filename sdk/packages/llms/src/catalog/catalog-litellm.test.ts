import { describe, expect, it } from "vitest";
import { GatewayRegistry } from "../providers/registry";
import {
	enrichLiteLLMModelInfo,
	getLiteLLMModelInfo,
	setLiteLLMModelCatalog,
} from "./catalog-litellm";

const record = {
	litellm_provider: "azure_ai",
	mode: "chat",
	max_input_tokens: 922000,
	max_output_tokens: 128000,
	input_cost_per_token: 2e-6,
	output_cost_per_token: 1e-5,
	cache_read_input_token_cost: 0,
	cache_creation_input_token_cost: 2.5e-6,
	input_cost_per_token_above_272k_tokens: 4e-6,
	output_cost_per_token_above_272k_tokens: 1.5e-5,
	supports_vision: true,
	supports_function_calling: true,
	supports_reasoning: true,
	supports_none_reasoning_effort: true,
	supports_minimal_reasoning_effort: false,
	supports_xhigh_reasoning_effort: true,
	supported_modalities: ["text", "image"],
	supported_output_modalities: ["text"],
};

describe("LiteLLM catalog", () => {
	it("resolves bare and qualified IDs and converts pricing and limits", () => {
		setLiteLLMModelCatalog({ "azure_ai/gpt-6.1-sol": record });
		const model = getLiteLLMModelInfo("gpt-6.1-sol");
		expect(model).toMatchObject({
			id: "gpt-6.1-sol",
			contextWindow: 922000,
			maxTokens: 128000,
			pricing: {
				input: 2,
				output: 10,
				cacheRead: 0,
				cacheWrite: 2.5,
				tiers: [{ aboveInputTokens: 272000, input: 4, output: 15 }],
			},
			capabilities: ["images", "tools", "reasoning", "reasoning-effort"],
			reasoningOptions: [
				{ type: "effort", values: ["none", "low", "medium", "high", "xhigh"] },
			],
		});
		expect(getLiteLLMModelInfo("azure_ai/gpt-6.1-sol")?.pricing).toEqual(
			model?.pricing,
		);
		expect(getLiteLLMModelInfo("azure/gpt-6.1-sol", "azure")?.maxTokens).toBe(
			128000,
		);
	});

	it("prefers exact IDs and disambiguates provider pricing without guessing", () => {
		setLiteLLMModelCatalog({
			"azure_ai/model": record,
			"other/model": { ...record, input_cost_per_token: 9e-6 },
		});
		expect(getLiteLLMModelInfo("model")).toBeUndefined();
		expect(getLiteLLMModelInfo("model", "azure")?.pricing?.input).toBe(2);
		setLiteLLMModelCatalog({
			model: { ...record, input_cost_per_token: 1e-6 },
			"azure_ai/model": record,
		});
		expect(getLiteLLMModelInfo("model", "azure")?.pricing?.input).toBe(1);
		expect(getLiteLLMModelInfo("proxy/model")?.pricing?.input).toBe(1);
	});

	it("preserves multi-slash model names and handles unknown IDs", () => {
		setLiteLLMModelCatalog({ "openrouter/vendor/model": record });
		expect(
			getLiteLLMModelInfo("vendor/model", "openrouter")?.pricing?.input,
		).toBe(2);
		expect(getLiteLLMModelInfo("vendor/model")?.pricing?.input).toBe(2);
		setLiteLLMModelCatalog({
			model: { ...record, input_cost_per_token: 9e-6 },
			"openrouter/vendor/model": record,
		});
		expect(
			getLiteLLMModelInfo("vendor/model", "openrouter")?.pricing?.input,
		).toBe(2);
		expect(getLiteLLMModelInfo("missing")).toBeUndefined();
	});

	it("ignores invalid numbers and keeps the snapshot on invalid updates", () => {
		setLiteLLMModelCatalog({
			sample_spec: record,
			valid: {
				...record,
				max_input_tokens: -1,
				input_cost_per_token: "unknown",
				output_cost_per_token: Infinity,
			},
		});
		expect(getLiteLLMModelInfo("sample_spec")).toBeUndefined();
		expect(getLiteLLMModelInfo("valid")?.maxInputTokens).toBeUndefined();
		expect(getLiteLLMModelInfo("valid")?.pricing?.input).toBeUndefined();
		expect(getLiteLLMModelInfo("valid")?.pricing?.output).toBeUndefined();
		expect(() => setLiteLLMModelCatalog({})).toThrow();
		expect(getLiteLLMModelInfo("valid")).toBeDefined();
	});

	it("refreshes bundled facts while preserving explicit override fields", () => {
		setLiteLLMModelCatalog({ model: record });
		const configured = {
			id: "model",
			contextWindow: 100,
			pricing: { input: 99 },
		};
		expect(enrichLiteLLMModelInfo(configured)).toMatchObject({
			contextWindow: 100,
			pricing: { input: 99, output: 10 },
		});
		expect(enrichLiteLLMModelInfo(configured).pricing?.tiers?.[0].input).toBe(
			99,
		);
		expect(enrichLiteLLMModelInfo(configured, undefined, true)).toMatchObject({
			contextWindow: 922000,
			pricing: { input: 2 },
		});
	});

	it("supplies gateway metadata without changing request IDs or adding inventory", () => {
		setLiteLLMModelCatalog({ "azure_ai/model": record });
		const registry = new GatewayRegistry();
		registry.registerProvider({
			manifest: {
				id: "azure",
				name: "Azure",
				defaultModelId: "model",
				models: [],
			},
			createProvider: () => {
				throw new Error("not called");
			},
		});
		expect(registry.listModels("azure")).toEqual([]);
		expect(
			registry.resolveModel({ providerId: "azure", modelId: "model" }).model,
		).toMatchObject({
			id: "model",
			contextWindow: 922000,
			maxOutputTokens: 128000,
			metadata: { pricing: { input: 2, output: 10 } },
		});
		registry.configureProvider({
			providerId: "azure",
			models: [
				{
					id: "model",
					name: "Custom",
					contextWindow: 100,
					metadata: { pricing: { input: 99 } },
				},
			],
		});
		expect(registry.resolveModel({ providerId: "azure" }).model).toMatchObject({
			contextWindow: 100,
			metadata: { pricing: { input: 99, output: 10 } },
		});
	});
});
