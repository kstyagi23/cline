# Glyph: Upstream Cline Sync Workflow

## Context

Glyph is a fork of Cline with intentional changes on top. The latest upstream Cline source is in `./cline_source` (read-only reference). Your job is to bring Glyph up to date with upstream Cline while preserving everything that makes Glyph different and keeping it fully working.

Think of this as a careful merge, not a copy. Upstream code is a source of changes to evaluate, never something to paste over Glyph files.

## Mission and success criteria

The sync is done only when ALL of these are true:

1. Every meaningful upstream change since Glyph's baseline is classified and either applied, adapted, deliberately skipped (with a reason), or deferred (with a reason).
2. Every Glyph-specific customization still exists and behaves the same.
3. Typecheck, lint, tests, and build show no new failures compared to the baseline captured in Phase 0.
4. Everything is documented in `.sync/` so a human can review the whole sync in minutes.

## Hard rules

- NEVER modify anything inside `./cline_source`. It is read-only reference.
- NEVER overwrite a Glyph file with its upstream version. Always compare and merge.
- NEVER bring in upstream product identity: extension ID, publisher, display name, branding, icons, URLs, telemetry keys, marketplace and release config, README branding. Glyph keeps its own.
- NEVER delete or weaken a Glyph customization to make a merge easier. If it conflicts, adapt the upstream change instead.
- NEVER upgrade or add dependencies blindly. Take only what an applied change requires, and log each one.
- NEVER claim something works without running the command that proves it.
- Work on a dedicated branch (`sync/cline-<upstream-version-or-date>`). Commit after every batch. Do not push, do not merge to main.
- If the baseline is already broken, say so and do not "fix" unrelated failures. Only ensure you add none.

## Working files (your memory across the session)

Create `.sync/` at the repo root and keep these files current. Update them as you go, not at the end. If your context resets, re-read them first and resume from `PROGRESS.md`.

| File | Purpose |
|---|---|
| `BASELINE.md` | Upstream base version, Glyph build/test/lint results before any change |
| `REGISTRY.md` | Divergence Registry: every Glyph-specific customization (Phase 1) |
| `CHANGES.md` | Every upstream change found, with classification and status (Phase 2 and 3) |
| `PROGRESS.md` | Checklist of batches, current batch, next action |
| `DECISIONS.md` | Judgment calls, skips, deferrals, each with a one-line reason |
| `REPORT.md` | Final summary for the human (Phase 6) |

## Phase 0: Orient and baseline

1. Read this file fully, then the Glyph README, `package.json`, and any contributing or architecture docs.
2. Identify the **upstream base**: the Cline version or commit Glyph was forked from. Check, in order: a recorded fork point in docs or git history, `CHANGELOG.md` entries, git tags or merge-base against any upstream remote, the version in Glyph's `package.json`. Compare it with the version in `./cline_source`.
3. If you cannot determine the base with confidence, do NOT guess. Fall back to a direct tree comparison (Glyph vs `./cline_source`) and treat every difference as unknown until Phase 1 explains it. Record this in `BASELINE.md`.
4. Discover the real commands from `package.json` and project docs (install, typecheck, lint, test, build, and any code generation step such as protobuf or schema generation). Do not assume command names.
5. Create the sync branch. Run install, typecheck, lint, test, and build. Record pass/fail counts and any pre-existing failures in `BASELINE.md`.

Gate: do not continue until `BASELINE.md` has the base version (or the fallback note) and the baseline results.

## Phase 1: Map Glyph's customizations (Divergence Registry)

Before reading any upstream change, learn what must be protected.

1. Diff Glyph against the upstream base (or against `./cline_source` if the base is unknown). Group differences by feature or area, not by file.
2. For each Glyph customization, write a `REGISTRY.md` entry:
   - Name and one-line purpose
   - Files and symbols involved
   - How to verify it still works (test, command, or manual check)
   - Whether it is **additive** (new files, new settings) or **invasive** (edits inside code that also exists upstream). Invasive ones are the high-risk merge zones.
3. Separate branding and rename changes from real behavior changes. Both must be preserved, but they are handled differently.

Gate: every non-trivial Glyph difference is either in the registry or explicitly noted as noise.

## Phase 2: Analyze upstream changes

1. Enumerate everything new upstream since the base: commits or release notes if history exists, otherwise the diff between the base and `./cline_source`.
2. Group changes into logical units (feature, fix, refactor, dependency bump, build/CI, docs, tests). One unit = one row in `CHANGES.md`.
3. For each unit, record: what it does and why (read the code and tests, not just the message), files touched, and whether it touches an area listed in `REGISTRY.md`.
4. Note ordering dependencies. A refactor may need to land before the features built on it.

## Phase 3: Classify and plan

Assign every unit exactly one class:

| Class | Meaning | Action |
|---|---|---|
| **A: Clean** | Touches files Glyph never changed | Apply directly |
| **B: Merge** | Both Glyph and upstream changed the same files | Merge by hand, keep both intents |
| **C: Adapt** | Upstream changed something Glyph renamed, moved, or replaced | Re-implement the intent against Glyph's structure |
| **D: Skip** | Branding, telemetry, release infra, or contradicts a Glyph decision | Do not apply, log the reason |
| **E: Defer** | Large, risky, or ambiguous without a human decision | Do not apply, log what is needed |

Then build the batch plan in `PROGRESS.md`:

- Order: foundations and refactors first, then fixes, then features, then dependency and build changes last (or earlier if required by the others).
- Keep batches small and cohesive (one feature or one subsystem). A batch should be reviewable and revertable on its own.
- Put Class B and C units in their own batches, never mixed with clean applies.

## Phase 4: Apply in batches (repeat per batch)

For each batch:

1. **Re-read** the relevant `REGISTRY.md` entries and the upstream diff for this batch.
2. **Apply** the changes following the class rules. For B and C, state your merge approach in `DECISIONS.md` before editing.
3. **Regenerate** any generated code the batch affects (protos, schemas, types) using the project's own generator. Never hand-edit generated output.
4. **Verify** with the commands from Phase 0: typecheck, lint, relevant tests, and build. Then check each registry entry the batch could affect.
5. **Fix or revert.** If verification shows a new failure, fix it within the batch. If it is not fixable quickly, revert the batch, mark it Deferred with the failure details, and move on.
6. **Commit** with a message like `sync(cline): <unit name> [class B]`, then update `PROGRESS.md` and `CHANGES.md` status.

Do not start the next batch until the current one is green and committed.

## Conflict decision rules

When upstream and Glyph disagree, decide in this order:

1. Glyph's intentional behavior wins. Preserve it.
2. Upstream bug fixes and security fixes should still land, adapted to fit Glyph.
3. If upstream replaced the whole approach Glyph customized, do not merge by guesswork. Mark Deferred and explain both options.
4. Prefer the smallest change that achieves the upstream intent.
5. When two options remain equal, pick the one easier to revert and note it in `DECISIONS.md`.

## Stop and ask the human only when

- The upstream base cannot be determined and a direct diff is too noisy to trust.
- A change requires removing or substantially altering a registered Glyph customization.
- A dependency change would require a major version bump or a new license.
- Baseline tooling does not run at all, so nothing can be verified.

For everything else, make the call, log it in `DECISIONS.md`, and keep going.

## Phase 5: Final verification

1. Run the full suite: install from clean, typecheck, lint, test, build.
2. Compare results against `BASELINE.md`. There must be zero new failures.
3. Walk the entire `REGISTRY.md` and confirm each customization with its recorded check.
4. Search the codebase for leaked upstream identity (extension ID, publisher, telemetry keys, Cline-only URLs) and confirm none were introduced.
5. If the project can be launched or packaged, do a smoke run of the main user flow.

## Phase 6: Report

Write `.sync/REPORT.md` with:

- Upstream range synced (from version or commit, to version or commit)
- Counts per class (applied, merged, adapted, skipped, deferred)
- Table of skipped and deferred units with reasons and what a human must decide
- Dependency changes made
- Before and after verification results
- Any Glyph customization that needed adaptation, and how
- Known risks and anything worth manual testing

Finish by replying with a short summary and a pointer to `REPORT.md`.

## Working style

- Work in small, verifiable steps. Prefer reading the real code over assuming.
- Keep your context lean: load only the files for the current batch, and rely on the `.sync/` files for everything else.
- Be explicit about uncertainty. "Unverified" is an acceptable status. Silent guessing is not.
- Show evidence for every claim of success (command and result).
