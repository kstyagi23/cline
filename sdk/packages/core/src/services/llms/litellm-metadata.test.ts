import { setLiteLLMModelCatalog } from "@cline/llms";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	clearLiveModelsCatalogCache,
	clearPrivateModelsCatalogCache,
	resolveProviderConfig,
} from "./provider-defaults";

vi.mock("./litellm-catalog-cache", () => ({
	initializeLiteLLMModelCatalog: vi.fn(async () => {}),
}));

afterEach(() => {
	clearLiveModelsCatalogCache();
	clearPrivateModelsCatalogCache();
	vi.unstubAllGlobals();
});

describe("LiteLLM metadata integration", () => {
	it("preserves live provider prices over upstream catalog prices", async () => {
		setLiteLLMModelCatalog({
			"vendor/live": {
				litellm_provider: "openrouter",
				input_cost_per_token: 5e-6,
				output_cost_per_token: 10e-6,
				max_input_tokens: 100000,
			},
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					openrouter: {
						models: {
							"vendor/live": {
								id: "vendor/live",
								name: "Live",
								tool_call: true,
								limit: { context: 50000, output: 1000 },
								cost: { input: 0, output: 0 },
							},
						},
					},
				}),
			),
		);
		const result = await resolveProviderConfig("openrouter", {
			loadLatestOnInit: true,
		});
		expect(result?.knownModels?.["vendor/live"]).toMatchObject({
			contextWindow: 50000,
			pricing: { input: 0, output: 0 },
		});
	});

	it("enriches proxy display aliases from the underlying model without expanding inventory", async () => {
		setLiteLLMModelCatalog({
			"azure_ai/catalog-model": {
				litellm_provider: "azure_ai",
				input_cost_per_token: 2e-6,
				output_cost_per_token: 10e-6,
				max_input_tokens: 922000,
			},
			unrelated: { litellm_provider: "openai" },
		});
		vi.stubGlobal(
			"fetch",
			vi.fn(async () =>
				Response.json({
					data: [
						{
							model_name: "my-deployment",
							litellm_params: { model: "azure_ai/catalog-model" },
							model_info: { max_input_tokens: 50000 },
						},
					],
				}),
			),
		);
		const result = await resolveProviderConfig(
			"litellm",
			{ loadPrivateOnAuth: true },
			{ providerId: "litellm", modelId: "my-deployment", apiKey: "test" },
		);
		expect(Object.keys(result?.knownModels ?? {}).sort()).toEqual([
			"azure_ai/catalog-model",
			"my-deployment",
		]);
		expect(result?.knownModels?.["my-deployment"]).toMatchObject({
			id: "my-deployment",
			maxInputTokens: 50000,
			pricing: { input: 2, output: 10 },
		});
	});
});
