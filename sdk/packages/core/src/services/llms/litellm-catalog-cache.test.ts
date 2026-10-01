import * as fs from "node:fs/promises";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initializeLiteLLMModelCatalog } from "./litellm-catalog-cache";

const mocks = vi.hoisted(() => ({
	resolveClineDataDir: vi.fn<() => string>(),
	setLiteLLMModelCatalog: vi.fn<(data: unknown) => void>(),
	fetch: vi.fn<typeof fetch>(),
}));

vi.mock("@cline/shared/storage", () => ({
	resolveClineDataDir: mocks.resolveClineDataDir,
}));
vi.mock("@cline/llms", () => ({
	LITELLM_CATALOG_URL: "https://catalog.example.test/model_prices.json",
	setLiteLLMModelCatalog: mocks.setLiteLLMModelCatalog,
}));
vi.mock("node:fs/promises", async (importOriginal) => {
	const actual = await importOriginal<typeof fs>();
	return { ...actual, rename: vi.fn(actual.rename) };
});

const CATALOG = {
	model: { input_cost_per_token: 0.000001, max_input_tokens: 128000 },
	alias: { reference: "model" },
	sample_spec: { unknown_metadata: "preserved" },
};
const UPDATED_CATALOG = { ...CATALOG, newer: { reference: "model" } };

describe("initializeLiteLLMModelCatalog", () => {
	let dataDir: string;
	let cachePath: string;

	beforeEach(async () => {
		vi.resetAllMocks();
		dataDir = await mkdtemp(join(tmpdir(), "core-litellm-catalog-"));
		cachePath = join(dataDir, "cache", "model_prices_and_context_window.json");
		mocks.resolveClineDataDir.mockReturnValue(dataDir);
		mocks.setLiteLLMModelCatalog.mockImplementation((data) => {
			if (!data || typeof data !== "object" || !("model" in data)) {
				throw new Error("Invalid catalog");
			}
		});
		mocks.fetch.mockResolvedValue(
			new Response(JSON.stringify(UPDATED_CATALOG)),
		);
		vi.stubGlobal("fetch", mocks.fetch);
	});

	afterEach(async () => {
		vi.useRealTimers();
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
		await rm(dataDir, { recursive: true, force: true });
	});

	async function seedCache(data: unknown = CATALOG) {
		await mkdir(join(dataDir, "cache"), { recursive: true });
		await writeFile(cachePath, JSON.stringify(data));
	}

	it("does not download a missing cache in cachedOnly mode, even with refresh", async () => {
		await Promise.all([
			initializeLiteLLMModelCatalog({ cachedOnly: true }),
			initializeLiteLLMModelCatalog({ cachedOnly: true, refresh: true }),
		]);
		expect(mocks.fetch).not.toHaveBeenCalled();
		expect(mocks.setLiteLLMModelCatalog).not.toHaveBeenCalled();
		await initializeLiteLLMModelCatalog();
		expect(mocks.fetch).toHaveBeenCalledTimes(1);
	});

	it("reloads external cache changes in cachedOnly mode without downloading", async () => {
		await seedCache();
		await initializeLiteLLMModelCatalog({ cachedOnly: true });
		await writeFile(cachePath, JSON.stringify(UPDATED_CATALOG));
		await initializeLiteLLMModelCatalog({ cachedOnly: true, refresh: true });
		expect(mocks.setLiteLLMModelCatalog.mock.calls).toEqual([
			[CATALOG],
			[UPDATED_CATALOG],
		]);
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it("allows a concurrent normal caller to download after a cachedOnly caller", async () => {
		await Promise.all([
			initializeLiteLLMModelCatalog({ cachedOnly: true }),
			initializeLiteLLMModelCatalog(),
		]);
		expect(mocks.fetch).toHaveBeenCalledTimes(1);
		expect(mocks.setLiteLLMModelCatalog).toHaveBeenCalledExactlyOnceWith(
			UPDATED_CATALOG,
		);
	});

	it("loads a valid cache once without fetching by default", async () => {
		await seedCache();
		await initializeLiteLLMModelCatalog();
		await initializeLiteLLMModelCatalog();

		expect(mocks.setLiteLLMModelCatalog).toHaveBeenCalledExactlyOnceWith(
			CATALOG,
		);
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it("reloads an externally refreshed cache once across concurrent default callers", async () => {
		await seedCache();
		await initializeLiteLLMModelCatalog();
		await writeFile(cachePath, JSON.stringify(UPDATED_CATALOG));
		await Promise.all([
			initializeLiteLLMModelCatalog(),
			initializeLiteLLMModelCatalog(),
		]);
		await initializeLiteLLMModelCatalog();

		expect(mocks.setLiteLLMModelCatalog.mock.calls).toEqual([
			[CATALOG],
			[UPDATED_CATALOG],
		]);
		expect(mocks.fetch).not.toHaveBeenCalled();
	});

	it.each([
		"not json",
		"{}",
	])("preserves the last valid snapshot after an invalid external update: %s", async (contents) => {
		await seedCache();
		await initializeLiteLLMModelCatalog();
		await writeFile(cachePath, contents);
		await expect(initializeLiteLLMModelCatalog()).resolves.toBeUndefined();
		await initializeLiteLLMModelCatalog();
		expect(mocks.fetch).not.toHaveBeenCalled();
		expect(mocks.setLiteLLMModelCatalog.mock.calls).toEqual(
			contents === "{}" ? [[CATALOG], [{}]] : [[CATALOG]],
		);

		await writeFile(cachePath, JSON.stringify(UPDATED_CATALOG));
		await initializeLiteLLMModelCatalog();
		expect(mocks.setLiteLLMModelCatalog).toHaveBeenLastCalledWith(
			UPDATED_CATALOG,
		);
	});

	it("downloads an absent cache once and persists the full raw JSON", async () => {
		await Promise.all([
			initializeLiteLLMModelCatalog(),
			initializeLiteLLMModelCatalog({ refresh: true }),
			initializeLiteLLMModelCatalog(),
		]);
		await initializeLiteLLMModelCatalog({ refresh: true });

		expect(mocks.fetch).toHaveBeenCalledExactlyOnceWith(
			"https://catalog.example.test/model_prices.json",
			{ signal: expect.any(AbortSignal) },
		);
		expect(mocks.setLiteLLMModelCatalog).toHaveBeenCalledExactlyOnceWith(
			UPDATED_CATALOG,
		);
		expect(JSON.parse(await readFile(cachePath, "utf8"))).toEqual(
			UPDATED_CATALOG,
		);
		expect(await readdir(join(dataDir, "cache"))).toEqual([
			"model_prices_and_context_window.json",
		]);
	});

	it("loads the cache before refreshing once across concurrent callers", async () => {
		await seedCache();
		await Promise.all([
			initializeLiteLLMModelCatalog(),
			initializeLiteLLMModelCatalog({ refresh: true }),
			initializeLiteLLMModelCatalog({ refresh: true }),
		]);
		await initializeLiteLLMModelCatalog({ refresh: true });

		expect(mocks.fetch).toHaveBeenCalledTimes(1);
		expect(mocks.setLiteLLMModelCatalog.mock.calls).toEqual([
			[CATALOG],
			[UPDATED_CATALOG],
		]);
		expect(JSON.parse(await readFile(cachePath, "utf8"))).toEqual(
			UPDATED_CATALOG,
		);
	});

	it("permits a later explicit refresh after a cache-only initialization", async () => {
		await seedCache();
		await initializeLiteLLMModelCatalog();
		await initializeLiteLLMModelCatalog({ refresh: true });
		expect(mocks.fetch).toHaveBeenCalledTimes(1);
	});

	it("tracks loading and refreshing independently for each cache path", async () => {
		await seedCache();
		await initializeLiteLLMModelCatalog();
		mocks.resolveClineDataDir.mockReturnValue(join(dataDir, "other"));
		await initializeLiteLLMModelCatalog();
		mocks.resolveClineDataDir.mockReturnValue(dataDir);
		await initializeLiteLLMModelCatalog();

		expect(mocks.setLiteLLMModelCatalog.mock.calls).toEqual([
			[CATALOG],
			[UPDATED_CATALOG],
		]);
		expect(mocks.fetch).toHaveBeenCalledTimes(1);
	});

	it.each([
		"not json",
		JSON.stringify({ invalid: true }),
	])("replaces an invalid cache: %s", async (contents) => {
		await seedCache();
		await writeFile(cachePath, contents);
		await initializeLiteLLMModelCatalog();
		expect(mocks.fetch).toHaveBeenCalledTimes(1);
		expect(JSON.parse(await readFile(cachePath, "utf8"))).toEqual(
			UPDATED_CATALOG,
		);
	});

	it.each([
		"network",
		"http",
		"json",
		"validation",
	])("keeps the last good cache when refresh fails at %s and does not retry", async (failure) => {
		await seedCache();
		if (failure === "network")
			mocks.fetch.mockRejectedValue(new Error("offline"));
		if (failure === "http")
			mocks.fetch.mockResolvedValue(new Response("error", { status: 500 }));
		if (failure === "json")
			mocks.fetch.mockResolvedValue(new Response("not json"));
		if (failure === "validation")
			mocks.fetch.mockResolvedValue(new Response("{}"));

		await expect(
			initializeLiteLLMModelCatalog({ refresh: true }),
		).resolves.toBeUndefined();
		await initializeLiteLLMModelCatalog({ refresh: true });

		expect(mocks.fetch).toHaveBeenCalledTimes(1);
		expect(mocks.setLiteLLMModelCatalog).toHaveBeenNthCalledWith(1, CATALOG);
		expect(JSON.parse(await readFile(cachePath, "utf8"))).toEqual(CATALOG);
		expect(await readdir(join(dataDir, "cache"))).toHaveLength(1);
	});

	it("does not retry an absent cache after a failed download", async () => {
		mocks.fetch.mockRejectedValue(new Error("offline"));
		await initializeLiteLLMModelCatalog();
		await initializeLiteLLMModelCatalog();
		expect(mocks.fetch).toHaveBeenCalledTimes(1);
		expect(mocks.setLiteLLMModelCatalog).not.toHaveBeenCalled();
	});

	it("aborts a slow fetch after five seconds without failing startup", async () => {
		await seedCache();
		vi.useFakeTimers();
		let signal: AbortSignal | undefined;
		let started!: () => void;
		const fetching = new Promise<void>((resolve) => {
			started = resolve;
		});
		mocks.fetch.mockImplementation((_url, options) => {
			signal = options?.signal as AbortSignal;
			started();
			return new Promise((_resolve, reject) => {
				signal?.addEventListener("abort", () => reject(new Error("aborted")), {
					once: true,
				});
			});
		});
		const initialization = initializeLiteLLMModelCatalog({ refresh: true });
		await fetching;
		await vi.advanceTimersByTimeAsync(4_999);
		expect(signal?.aborted).toBe(false);
		await vi.advanceTimersByTimeAsync(1);
		await expect(initialization).resolves.toBeUndefined();
		expect(signal?.aborted).toBe(true);
		expect(vi.getTimerCount()).toBe(0);
		expect(JSON.parse(await readFile(cachePath, "utf8"))).toEqual(CATALOG);
	});

	it("cleans up a unique temporary file when atomic rename fails", async () => {
		await seedCache();
		const rename = vi
			.spyOn(fs, "rename")
			.mockRejectedValue(new Error("rename failed"));
		await expect(
			initializeLiteLLMModelCatalog({ refresh: true }),
		).resolves.toBeUndefined();

		expect(rename).toHaveBeenCalledWith(
			expect.stringMatching(
				/model_prices_and_context_window\.json\.[\da-f-]+\.tmp$/,
			),
			cachePath,
		);
		expect(JSON.parse(await readFile(cachePath, "utf8"))).toEqual(CATALOG);
		expect(await readdir(join(dataDir, "cache"))).toEqual([
			"model_prices_and_context_window.json",
		]);
	});

	it("tolerates data-directory resolution failures", async () => {
		mocks.resolveClineDataDir.mockImplementation(() => {
			throw new Error("unavailable");
		});
		await expect(initializeLiteLLMModelCatalog()).resolves.toBeUndefined();
		expect(mocks.fetch).not.toHaveBeenCalled();
	});
});
