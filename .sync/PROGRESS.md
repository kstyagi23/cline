# Sync Progress

- [x] Phase 0: Record installation, build, typecheck, lint, and test baseline (pre-existing failures).
- [x] Phase 1: Register every meaningful fork divergence, including existing uncommitted behavior (233 committed paths).
- [x] Phases 2-3: Inspect and classify four upstream commits (five logical units).
- [x] Phase 4: Verify and commit applied batches (U5 committed externally in mixed user commit; no history rewrite).
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

Batch 2 committed: `01d23f1f5`.
Batch 3 U5 verified: focused four files 221/221; desktop typecheck/build pass; full desktop sidecar 1134 passed/16 failures, same five failing files as baseline. Concurrent typechecking caused one additional 20s timeout in unchanged remote routing; serial rerun removes it. Root types pass; lint unchanged 39 warnings/80 infos.
Batch 3 committed by external concurrent activity as `a7a09f9c8`, together with user helper/workflow/landing-page changes. Do not amend/split/revert that commit.

Final evidence comparison and report written to REPORT.md. Comparable completed suites have no observed new failures. Full CLI suite, clean native install, legacy extension, credentialed/manual registry checks, and externally changed landing-page equivalence are unresolved sign-off gaps. Phase 5 is therefore partial; no full mission-success claim.

Next action for a resumed sync: read REPORT/BASELINE/REGISTRY; obtain compatible native tooling, finish full CLI/clean install and registry manual checks, then evaluate deferred U3/U4. Do not replay already applied U1/U2/U5 or rewrite external mixed commit a7a09f9c8.

Do not run `sync:cline`: it updates `cline_source`, prohibited by this workflow.
