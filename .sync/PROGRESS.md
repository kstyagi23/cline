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

Current action: batch 1 U1, after committing registry/classification docs.

Do not run `sync:cline`: it updates `cline_source`, prohibited by this workflow.
