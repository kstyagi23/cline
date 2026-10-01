#!/usr/bin/env bun

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const REPOSITORY = "https://github.com/cline/cline.git";
const INITIAL_COMMIT = "9fe17595de3b0c980d6c8291f7c42bf0b8cc94a3";
const CHECKPOINT = "clineSync.lastCommit";

function git(args: string[], cwd: string, allowFailure = false): string {
	const result = spawnSync("git", args, { cwd, encoding: "utf8" });
	if (result.error) throw result.error;
	if (result.status !== 0 && !allowFailure) {
		throw new Error(result.stderr.trim() || `git ${args.join(" ")} failed`);
	}
	return result.status === 0 ? result.stdout.trim() : "";
}

export function syncCline({
	root = path.resolve(import.meta.dir, ".."),
	repository = REPOSITORY,
	since,
}: {
	root?: string;
	repository?: string;
	since?: string;
} = {}): void {
	const destination = path.join(root, "cline_source");
	const existing = existsSync(destination);
	let previous = since ?? INITIAL_COMMIT;
	if (since && !/^[a-f0-9]{40}$/i.test(since)) {
		throw new Error("--since must be a full 40-character commit ID.");
	}
	if (existing) {
		// Do not let Git discover the parent workspace's repository by accident.
		if (!existsSync(path.join(destination, ".git"))) {
			throw new Error("cline_source exists but is not a Git checkout.");
		}
		if (git(["remote", "get-url", "origin"], destination) !== repository) {
			throw new Error("cline_source has an unexpected origin remote.");
		}
		if (git(["branch", "--show-current"], destination) !== "main") {
			throw new Error("cline_source must be on the main branch.");
		}
		if (git(["status", "--porcelain", "--untracked-files=all"], destination)) {
			throw new Error("cline_source has local changes; refusing to update it.");
		}
		previous =
			since ??
			(git(["config", "--local", "--get", CHECKPOINT], destination, true) ||
				INITIAL_COMMIT);
	}

	const remote = git(
		["ls-remote", "--exit-code", repository, "refs/heads/main"],
		root,
	).split(/\s+/)[0];
	console.log(`Previous baseline: ${previous}`);
	if (remote === previous && !existing) {
		console.log(
			`No new updates on main (${remote}). cline_source was not created.`,
		);
		return;
	}

	if (!existing) {
		git(
			[
				"clone",
				"--single-branch",
				"--branch",
				"main",
				"--no-tags",
				repository,
				destination,
			],
			root,
		);
	} else {
		git(
			[
				"fetch",
				"--no-tags",
				"origin",
				"refs/heads/main:refs/remotes/origin/main",
			],
			destination,
		);
	}
	const latest = git(["rev-parse", "refs/remotes/origin/main"], destination);
	git(["merge-base", "--is-ancestor", previous, latest], destination);
	git(["merge-base", "--is-ancestor", "HEAD", latest], destination);
	const commits = git(
		["rev-list", "--reverse", "--first-parent", `${previous}..${latest}`],
		destination,
	);
	git(["merge", "--ff-only", latest], destination);
	// Store the checkpoint inside the nested checkout, not the parent repository.
	git(["config", "--local", CHECKPOINT, latest], destination);
	if (!commits) {
		console.log(`No new updates on main (${latest}).`);
		return;
	}
	console.log(`First new main commit: ${commits.split("\n")[0]}`);
	console.log(`Latest main commit: ${latest}`);
	console.log(`New main commits: ${commits.split("\n").length}`);
	console.log(`Source checkout: ${destination}`);
	console.log(`Next run will check for updates after: ${latest}`);
}

if (import.meta.main) {
	const args = process.argv.slice(2);
	if (args.length === 1 && args[0] === "--help") {
		console.log("Usage: bun run sync:cline [--since <commit ID>]");
		console.log(`Initial baseline: ${INITIAL_COMMIT}`);
		console.log(
			"Syncs cline/cline main into cline_source and remembers each successful sync.",
		);
	} else {
		try {
			if (args.length && (args.length !== 2 || args[0] !== "--since")) {
				throw new Error("Usage: bun run sync:cline [--since <commit ID>]");
			}
			syncCline({ since: args[1] });
		} catch (error) {
			console.error(
				`Cline sync failed: ${error instanceof Error ? error.message : String(error)}`,
			);
			process.exitCode = 1;
		}
	}
}
