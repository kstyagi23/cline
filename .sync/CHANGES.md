# Upstream Changes

Range: `9fe17595de3b0c980d6c8291f7c42bf0b8cc94a3..0809928ab28783c0d2b41c1e56edaf0951dadcab`.
All four commits and their implementation/tests were inspected. Split the cross-package commit into independently reviewable SDK foundation and extension consumer units.

| Unit | Commit | Intent and files | Registry overlap | Class | Status / ordering |
| --- | --- | --- | --- | --- | --- |
| U1: Installed connector count | `8eee168b8` | Desktop `composio-connectors-view.tsx` and its test: connected connectors show actual installed count including zero, never catalog denominator; remove slug row. | No modified files; preserve separate user `/glyph` route. | A: Clean | Planned batch 1. |
| U2: Optional standalone request session ID | SDK portion of `ce74ef091` | llms `request-headers.ts`, its test, `vendors/cline.test.ts`: omit session headers when absent/blank; test both generate and stream header transport. No new service identity values in runtime defaults. | ID-01 retained service/provider compatibility; BE-01/05/06 neighboring provider behavior, untouched. | A: Clean | Planned batch 2; foundation for U4. |
| U3: Tool approval resolver race | `07a858747` | Extension `sdk-interaction-coordinator.ts` and test: register resolver before asynchronous state post; deny only matching failed delivery; preserve unbounded user decision time. | No fork file edits; inherited approvals retained. | E: Defer | Legacy extension cannot generate required proto types or build on available ARM toolchain. Need compatible Node/native formatter and passing focused test/typecheck/build before applying. |
| U4: Standalone commit request host context and cancellation | Extension portion of `ce74ef091` | `commit-message-generator{,.test}.ts`, `cline-session-factory.ts`, `cline-request-client-context.test.ts`, `sdk-api-handler{,.test}.ts`, `cline-core-vitest-stub.ts`: shared host identity, stored headers, core version/source, omit synthetic task ID; register concurrent cancel handles before awaits. | ID-01 retained provider/service IDs, but new surface identification must be reviewed against Glyph identity hard rule. | E: Defer | Depends on U2; extension verification blocked as U3. Requires verified host identity adaptation, never unconditional upstream product identity injection. |
| U5: Preserve per-thread prompt drafts | `0809928ab` | Desktop `page.tsx`, new `use-prompt-draft{,.test}.ts(x)`, `desktop-app-state{,.test}.ts`, composer/session tests, package test script. Cache text outside keyed panes, reuse same session/environment thread, revision/mounted recovery guards, prune deleted drafts. | DW-03 separate dirty `/glyph` route; no overlapping modified files. | A: Clean | Planned batch 3; independent of U1/U2. No attachments persisted beyond upstream's existing behavior. |

## Completeness

- 22 changed upstream paths covered by five units.
- No upstream dependency additions/upgrades, releases, branding assets, CI, README, telemetry keys, or generated code changes in this range.
- New Cline header literals in U2 are test fixtures for existing provider compatibility, not new runtime identity defaults.
- Deferred consumer units are not represented as applied or verified.
