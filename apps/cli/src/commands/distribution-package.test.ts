import { spawnSync } from "node:child_process";
import {
	copyFile,
	cp,
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
	DIRECT_PUBLISH_GUARD_MESSAGE,
	shouldAllowDirectPublish,
} from "../../script/guard-direct-publish";

const cliRoot = fileURLToPath(new URL("../..", import.meta.url));
const platformTargets = [
	{ os: "darwin", arch: "arm64" },
	{ os: "darwin", arch: "x64" },
	{ os: "linux", arch: "arm64" },
	{ os: "linux", arch: "x64" },
	{ os: "win32", arch: "arm64" },
	{ os: "win32", arch: "x64" },
];

async function generatedPlatformManifests(version: string) {
	const buildScript = await readFile(join(cliRoot, "script/build.ts"), "utf8");
	// Evaluate the builder's real JSON expression without running compilation,
	// installing native variants, or clearing the developer's dist directory.
	const expression = buildScript.match(
		/\/\/ Generate platform package\.json\s+await Bun\.write\([\s\S]*?JSON\.stringify\(\s*(\{[\s\S]*?\}),\s*null,\s*2,/,
	)?.[1];
	if (!expression) throw new Error("Platform manifest expression not found");
	expect(buildScript).toContain(
		'const binaryName = item.os === "win32" ? "cline.exe" : "cline";',
	);
	return platformTargets.map((item) => {
		const displayOs = item.os === "win32" ? "windows" : item.os;
		const name = `@cline/cli-${displayOs}-${item.arch}`;
		const manifest = runInNewContext(`(${expression})`, {
			item,
			displayOs,
			name,
			version,
			binaryName: item.os === "win32" ? "cline.exe" : "cline",
			repository: undefined,
		});
		return { name, manifest };
	});
}

describe("CLI distribution package shape", () => {
	it("exposes glyph and cline source bins without changing the workspace identity", async () => {
		const pkg = JSON.parse(
			await readFile(join(cliRoot, "package.json"), "utf8"),
		);
		expect(pkg.name).toBe("@cline/cli");
		expect(pkg.displayName).toBe("Glyph");
		expect(pkg.bin).toEqual({
			glyph: "src/index.ts",
			cline: "src/index.ts",
		});
	});

	it("maps both platform commands to the existing cline binary on every target", async () => {
		for (const { name, manifest } of await generatedPlatformManifests(
			"1.2.3",
		)) {
			const binary = name.includes("windows") ? "cline.exe" : "cline";
			expect(manifest.name).toBe(name);
			expect(manifest.displayName).toBe("Glyph");
			expect(manifest.bin).toEqual({
				glyph: `bin/${binary}`,
				cline: `bin/${binary}`,
			});
		}
	});

	it("rejects direct source package publishing by default", () => {
		expect(shouldAllowDirectPublish({})).toBe(false);
		expect(shouldAllowDirectPublish({ CLINE_ALLOW_DIRECT_PUBLISH: "1" })).toBe(
			true,
		);
		expect(DIRECT_PUBLISH_GUARD_MESSAGE).toContain(
			"Direct packaging or publishing from apps/cli is disabled.",
		);
	});

	it("rejects direct source package packing by default", () => {
		const result = spawnSync("bun", ["pm", "pack", "--dry-run"], {
			cwd: cliRoot,
			encoding: "utf8",
		});

		expect(result.status).not.toBe(0);
		expect(result.stderr).toContain(DIRECT_PUBLISH_GUARD_MESSAGE);
	});

	it("packs the generated npm wrapper package", async () => {
		const root = await mkdtemp(join(tmpdir(), "cline-cli-pack-"));
		const fixtureCli = join(root, "apps/cli");
		const packageDir = join(fixtureCli, "dist/cli");
		try {
			await mkdir(join(fixtureCli, "script"), { recursive: true });
			await copyFile(
				join(cliRoot, "script/publish-npm.ts"),
				join(fixtureCli, "script/publish-npm.ts"),
			);
			await copyFile(
				join(cliRoot, "script/postinstall.mjs"),
				join(fixtureCli, "script/postinstall.mjs"),
			);
			await copyFile(join(cliRoot, "README.md"), join(fixtureCli, "README.md"));
			await cp(join(cliRoot, "bin"), join(fixtureCli, "bin"), {
				recursive: true,
			});
			const sourcePackage = JSON.parse(
				await readFile(join(cliRoot, "package.json"), "utf8"),
			);
			const version = sourcePackage.version;
			await writeFile(
				join(fixtureCli, "package.json"),
				JSON.stringify(sourcePackage),
			);
			for (const directory of ["sdk", "core", "agents", "llms", "shared"]) {
				const sdkPackageDir = join(root, "sdk/packages", directory);
				await mkdir(sdkPackageDir, { recursive: true });
				await writeFile(
					join(sdkPackageDir, "package.json"),
					JSON.stringify({ name: `@cline/${directory}`, version: "1.2.3" }),
				);
			}
			const optionalDependencies: Record<string, string> = {};
			for (const { name, manifest } of await generatedPlatformManifests(
				version,
			)) {
				const platformDir = join(
					fixtureCli,
					"dist",
					name.replace("@cline/", ""),
				);
				await mkdir(platformDir, { recursive: true });
				await writeFile(
					join(platformDir, "package.json"),
					JSON.stringify(manifest),
				);
				optionalDependencies[name] = version;
			}

			// The publisher only prepares a local wrapper under --dry-run. Never
			// invoke the publishing branch, network checks, or a global install.
			const generated = spawnSync(
				"bun",
				["script/publish-npm.ts", "--dry-run"],
				{
					cwd: fixtureCli,
					encoding: "utf8",
				},
			);
			expect(generated.error).toBeUndefined();
			expect(generated.status, generated.stderr).toBe(0);
			expect(generated.stdout).toContain("No packages were published.");
			const pkg = JSON.parse(
				await readFile(join(packageDir, "package.json"), "utf8"),
			);
			expect(pkg.name).toBe("cline");
			expect(pkg.displayName).toBe("Glyph");
			expect(pkg.bin).toEqual({ glyph: "./bin/cline", cline: "./bin/cline" });
			expect(pkg.optionalDependencies).toEqual(optionalDependencies);
			expect(pkg.scripts.postinstall).toBe("node ./postinstall.mjs || true");
			expect(await readdir(join(packageDir, "bin"))).toEqual([
				"ca-certs.cjs",
				"cline",
			]);
			expect(await readFile(join(packageDir, "README.md"), "utf8")).toContain(
				"# Glyph CLI",
			);

			const result = spawnSync("bun", ["pm", "pack"], {
				cwd: packageDir,
				encoding: "utf8",
			});

			expect(result.status).toBe(0);
			const files = await readdir(packageDir);
			expect(files.some((file) => file.endsWith(".tgz"))).toBe(true);
		} finally {
			await rm(root, { recursive: true, force: true });
		}
	});
});
