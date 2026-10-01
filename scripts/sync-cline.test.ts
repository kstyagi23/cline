import { afterEach, expect, test } from "bun:test";
import { spawnSync } from "node:child_process";
import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	rmSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { syncCline } from "./sync-cline";

const directories: string[] = [];
afterEach(() => {
	for (const directory of directories.splice(0)) {
		rmSync(directory, { recursive: true, force: true });
	}
});

function git(cwd: string, ...args: string[]): string {
	const result = spawnSync("git", args, { cwd, encoding: "utf8" });
	if (result.status !== 0) throw new Error(result.stderr);
	return result.stdout.trim();
}

function fixture() {
	const directory = mkdtempSync(path.join(tmpdir(), "cline-sync-test-"));
	directories.push(directory);
	const repository = path.join(directory, "upstream");
	const root = path.join(directory, "workspace");
	mkdirSync(repository);
	mkdirSync(root);
	git(repository, "init", "--initial-branch=main");
	const commit = (content: string) => {
		writeFileSync(path.join(repository, "source.txt"), content);
		git(repository, "add", "source.txt");
		git(
			repository,
			"-c",
			"user.name=Sync Test",
			"-c",
			"user.email=sync@example.invalid",
			"-c",
			"commit.gpgsign=false",
			"commit",
			"-m",
			content,
		);
		return git(repository, "rev-parse", "HEAD");
	};
	return {
		repository,
		root,
		commit,
		destination: path.join(root, "cline_source"),
	};
}

test("clones only main, reports the first update, and tracks subsequent syncs", () => {
	const { repository, root, commit, destination } = fixture();
	const baseline = commit("baseline");
	const first = commit("first update");
	const latest = commit("second update");
	git(repository, "branch", "other");
	const output: string[] = [];
	const original = console.log;
	console.log = (message: string) => {
		output.push(message);
	};
	try {
		syncCline({ root, repository, since: baseline });
		expect(output).toContain(`First new main commit: ${first}`);
		expect(git(destination, "rev-parse", "HEAD")).toBe(latest);
		expect(git(destination, "branch", "--remotes")).not.toContain(
			"origin/other",
		);
		output.length = 0;
		syncCline({ root, repository });
		expect(output).toContain(`No new updates on main (${latest}).`);
		const next = commit("third update");
		output.length = 0;
		syncCline({ root, repository });
		expect(output).toContain(`Previous baseline: ${latest}`);
		expect(output).toContain(`First new main commit: ${next}`);
		expect(
			git(destination, "config", "--local", "--get", "clineSync.lastCommit"),
		).toBe(next);
	} finally {
		console.log = original;
	}
});

test("does not create a checkout when main matches the baseline", () => {
	const { repository, root, commit, destination } = fixture();
	syncCline({ root, repository, since: commit("baseline") });
	expect(existsSync(destination)).toBe(false);
});

test("preserves dirty checkouts and rejects non-checkout folders", () => {
	const { repository, root, commit, destination } = fixture();
	const baseline = commit("baseline");
	const latest = commit("update");
	syncCline({ root, repository, since: baseline });
	writeFileSync(path.join(destination, "untracked.txt"), "local work");
	commit("another update");
	expect(() => syncCline({ root, repository })).toThrow("local changes");
	expect(git(destination, "rev-parse", "HEAD")).toBe(latest);
	const otherRoot = path.join(root, "other");
	mkdirSync(path.join(otherRoot, "cline_source"), { recursive: true });
	expect(() => syncCline({ root: otherRoot, repository })).toThrow(
		"not a Git checkout",
	);
});

test("rejects diverged upstream history without changing the checkpoint", () => {
	const { repository, root, commit, destination } = fixture();
	const baseline = commit("baseline");
	const latest = commit("update");
	syncCline({ root, repository, since: baseline });
	git(repository, "checkout", "--orphan", "replacement");
	commit("replacement history");
	git(repository, "branch", "-M", "main");
	expect(() => syncCline({ root, repository })).toThrow();
	expect(git(destination, "rev-parse", "HEAD")).toBe(latest);
	expect(
		git(destination, "config", "--local", "--get", "clineSync.lastCommit"),
	).toBe(latest);
});
