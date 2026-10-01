import { spawnSync } from "node:child_process";
import {
	chmodSync,
	copyFileSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";

const sourceWrapperPath = fileURLToPath(
	new URL("../../bin/cline", import.meta.url),
);
const temporaryDirectories: string[] = [];

afterEach(() => {
	for (const dir of temporaryDirectories.splice(0)) {
		rmSync(dir, { recursive: true, force: true });
	}
});

function createWrapperCopy(): string {
	const dir = mkdtempSync(join(tmpdir(), "cline-bin-package-"));
	temporaryDirectories.push(dir);
	const binDir = join(dir, "bin");
	mkdirSync(binDir, { recursive: true });
	const wrapperPath = join(binDir, "cline");
	copyFileSync(sourceWrapperPath, wrapperPath);
	chmodSync(wrapperPath, 0o755);
	return wrapperPath;
}

function createExecutableScript(contents: string): string {
	const dir = mkdtempSync(join(tmpdir(), "cline-bin-wrapper-"));
	temporaryDirectories.push(dir);
	const scriptPath = join(dir, "child.cjs");
	writeFileSync(scriptPath, `#!/usr/bin/env node\n${contents}`);
	chmodSync(scriptPath, 0o755);
	return scriptPath;
}

function runWrapperScript(contents: string, args: string[] = []) {
	// Windows cannot execute a shebang script directly. Use the real Node
	// executable there rather than weakening the resolver's spawn behavior.
	const target =
		process.platform === "win32"
			? process.execPath
			: createExecutableScript(contents);
	const childArgs =
		process.platform === "win32" ? ["--eval", contents, "--", ...args] : args;
	const wrapperPath = createWrapperCopy();
	return spawnSync(process.execPath, [wrapperPath, ...childArgs], {
		env: {
			...process.env,
			CLINE_BIN_PATH: target,
		},
		encoding: "utf8",
	});
}

describe("shared glyph / cline distribution wrapper", () => {
	it("preserves the child process exit status", () => {
		const result = runWrapperScript(
			'process.exit(Number(process.argv.at(-1) ?? "0"));',
			["7"],
		);

		expect(result.error).toBeUndefined();
		expect(result.status).toBe(7);
		expect(result.signal).toBeNull();
	});

	it("passes the wrapper path to the compiled binary", () => {
		const result = runWrapperScript(
			'console.log(process.env.CLINE_WRAPPER_PATH ?? "");',
		);

		expect(result.error).toBeUndefined();
		expect(result.status).toBe(0);
		expect(result.stdout.trim()).toMatch(/bin[/\\]cline$/);
	});

	it("forwards arguments unchanged through the shared resolver", () => {
		const args = ["two words", 'quoted "value"', "dollar$bang!", "--flag=7"];
		const result = runWrapperScript(
			`console.log(JSON.stringify(process.argv.slice(-${args.length})));`,
			args,
		);

		expect(result.error).toBeUndefined();
		expect(result.status).toBe(0);
		expect(JSON.parse(result.stdout)).toEqual(args);
	});

	it("reports Glyph without changing the platform package or binary identities", () => {
		const wrapperPath = createWrapperCopy();
		const result = spawnSync(process.execPath, [wrapperPath], {
			env: { ...process.env, CLINE_BIN_PATH: "" },
			encoding: "utf8",
		});

		expect(result.error).toBeUndefined();
		expect(result.status).toBe(1);
		expect(result.stderr).toContain("Could not find the Glyph CLI binary");
		expect(result.stderr).toContain(
			`@cline/cli-${process.platform === "win32" ? "windows" : process.platform}-${process.arch}`,
		);
		expect(result.stderr).toContain("bun add --global cline");
	});

	it.skipIf(process.platform === "win32")(
		"propagates child process signal termination on POSIX",
		() => {
			const result = runWrapperScript(`
process.kill(process.pid, "SIGTERM");
setTimeout(() => {}, 1000);
`);

			expect(result.error).toBeUndefined();
			expect(result.status).toBeNull();
			expect(result.signal).toBe("SIGTERM");
		},
	);
});
