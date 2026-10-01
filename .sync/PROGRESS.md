# Sync Progress

- [x] Phase 0: Record installation, build, typecheck, lint, and test baseline (pre-existing failures).
- [x] Phase 1: Register every meaningful fork divergence, including existing uncommitted behavior (233 committed paths).
- [x] Phases 2-3: Inspect and classify four upstream commits (five logical units).
- [ ] Phase 4: Verify and commit each applied batch before the next.
- [ ] Phase 5: Full verification, registry checks, identity audit, smoke run.
- [ ] Phase 6: Final report.

## Batch Plan

1. U1 / A: Desktop installed connector count, including zero. Verify focused settings tests, desktop typecheck/web build, root types/lint/build; commit.
2. U2 / A: SDK optional standalone session header and wire tests. Verify llms focused tests, SDK build/typecheck, root types/lint/build; commit.
3. U5 / A: Desktop prompt drafts and thread reuse. Verify focused hook/reducer/composer/session tests and full desktop sidecar against 16 baseline failures, desktop/root typecheck/lint/build; commit.

U3/U4 / E: Deferred before source editing because legacy extension proto generation/typecheck/build cannot run successfully with available Windows ARM formatter; retain explicit reasons in CHANGES/DECISIONS.

Batch 1 U1 verified: settings suite 65/65 across 11 files; root types pass; lint unchanged 39 warnings/80 infos; SDK, CLI/hub webview and desktop production builds pass separately. Clean root build exposes pre-existing grpc-tools Windows ARM download 404; dependencies restored with frozen install ignoring lifecycle scripts. No source/dependency fix for this environment failure.

Batch 1 committed: `1636a377d`.
Batch 2 U2 verified: 43/43 tests across five llms files (header/wire and Glyph Responses/native reasoning/LiteLLM); SDK build, CLI build, all workspace typechecks pass; lint unchanged 39 warnings/80 infos. Added omission cases for all four affected provider IDs and undefined/empty/whitespace IDs.

Current action: commit batch 2, then U5 desktop prompt drafts.

Do not run `sync:cline`: it updates `cline_source`, prohibited by this workflow.
