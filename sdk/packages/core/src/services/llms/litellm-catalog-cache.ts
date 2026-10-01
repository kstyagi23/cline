import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { LITELLM_CATALOG_URL, setLiteLLMModelCatalog } from "@cline/llms";
import { resolveClineDataDir } from "@cline/shared/storage";

const cacheStates = new Map<
	string,
	{
		operation?: Promise<void>;
		download?: Promise<void>;
		hasCatalog: boolean;
		refreshRequested: boolean;
		allowDownload: boolean;
		fileVersion?: string;
	}
>();

async function getFileVersion(path: string): Promise<string> {
	const info = await stat(path, { bigint: true });
	return `${info.mtimeNs}:${info.size}:${info.ino}`;
}

export async function initializeLiteLLMModelCatalog(
	options: { refresh?: boolean; cachedOnly?: boolean } = {},
): Promise<void> {
	try {
		const cachePath = join(
			resolveClineDataDir(),
			"cache",
			"model_prices_and_context_window.json",
		);
		let state = cacheStates.get(cachePath);
		if (!state) {
			state = {
				hasCatalog: false,
				refreshRequested: false,
				allowDownload: false,
			};
			cacheStates.set(cachePath, state);
		}
		const cache = state;
		cache.allowDownload ||= !options.cachedOnly;
		cache.refreshRequested ||= !options.cachedOnly && options.refresh === true;
		cache.operation ??= (async () => {
			try {
				const version = await getFileVersion(cachePath);
				if (version !== cache.fileVersion) {
					cache.fileVersion = version;
					const data: unknown = JSON.parse(await readFile(cachePath, "utf8"));
					setLiteLLMModelCatalog(data);
					cache.hasCatalog = true;
				}
			} catch {
				// Missing or invalid updates leave the last valid catalog in place.
			}

			if (
				cache.allowDownload &&
				(cache.refreshRequested || !cache.hasCatalog)
			) {
				// Retain the promise after completion, including failure, so startup
				// callers pay for at most one network attempt per process/cache path.
				cache.download ??= (async () => {
					const controller = new AbortController();
					const timer = setTimeout(() => controller.abort(), 5_000);
					let tempPath: string | undefined;
					try {
						const response = await fetch(LITELLM_CATALOG_URL, {
							signal: controller.signal,
						});
						if (!response.ok) throw new Error(`HTTP ${response.status}`);
						const data: unknown = await response.json();
						setLiteLLMModelCatalog(data);
						cache.hasCatalog = true;
						await mkdir(dirname(cachePath), { recursive: true });
						tempPath = `${cachePath}.${randomUUID()}.tmp`;
						await writeFile(tempPath, JSON.stringify(data), {
							encoding: "utf8",
							flag: "wx",
						});
						const version = await getFileVersion(tempPath);
						await rename(tempPath, cachePath);
						cache.fileVersion = version;
					} catch {
						// Keep the last valid in-memory and on-disk catalogs on failure.
					} finally {
						clearTimeout(timer);
						if (tempPath) await rm(tempPath, { force: true }).catch(() => {});
					}
				})();
			}
			await cache.download;
		})().finally(() => {
			cache.operation = undefined;
			cache.allowDownload = false;
		});
		await cache.operation;
		if (
			!options.cachedOnly &&
			!cache.download &&
			(options.refresh || !cache.hasCatalog)
		) {
			await initializeLiteLLMModelCatalog(options);
		}
	} catch {
		// Catalog persistence must never prevent startup, even without a data dir.
	}
}
