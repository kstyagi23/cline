# Upstream Sync Report

## Outcome

Reviewed the complete upstream range `9fe17595de3b0c980d6c8291f7c42bf0b8cc94a3..0809928ab28783c0d2b41c1e56edaf0951dadcab` (four commits, 22 paths). Applied three logical units and deferred two extension units. Branch: `sync/cline-2026-10-01`. No push or merge performed; `cline_source` remains clean and unchanged.

**Qualified completion, not full workflow success:** all upstream changes are classified and verifiable batches landed, but complete CLI verification, clean native installation, legacy extension builds, credentialed/manual flows, and the externally changed landing-page customization remain unverified. Zero new failures were observed in comparable completed suites; a repo-wide zero-regression claim is not possible with these gaps.

| Class | Units | Applied |
| --- | --- | --- |
| A: Clean | 3 | 3 |
| B: Merge | 0 | 0 |
| C: Adapt | 0 | 0 |
| D: Skip | 0 | 0 |
| E: Defer | 2 | 0 |

## Applied Units

| Unit | Result | Commit |
| --- | --- | --- |
| U1: Connector installed tools | Show actual connected tool count including zero; remove misleading catalog denominator and slug display. | `1636a377d` |
| U2: Standalone session headers | Optional session ID; omit absent/blank session headers; retain provider identity and custom header precedence; generate/stream wire tests. | `01d23f1f5` |
| U5: Desktop prompt drafts | Preserve text across keyed navigation, isolate environments, reuse started session threads, prevent stale failed sends restoring over new drafts, prune deleted drafts. | External mixed commit `a7a09f9c8` |

U5 was manually merged and verified, but concurrent external activity committed it together with landing-page, workflow, and sync-helper files. That commit was not created or rewritten by this sync. Its unrelated content is not claimed as upstream work; reverting U5 requires selecting its eight desktop paths rather than reverting the entire mixed commit.

## Deferred Units

| Unit | Reason | Required follow-up |
| --- | --- | --- |
| U3: Extension approval resolver ordering | Legacy extension proto generation/typecheck/build blocked by Windows ARM tooling; cannot validate race fix through missing generated imports. | Compatible Node/native formatter environment, generation, focused coordinator tests, typecheck/lint/build, then apply. |
| U4: Extension commit-generation host headers/cancellation | Same verification blocker; depends on applied U2 and requires respecting Glyph identity hard rule when reporting host context. | Verify host identity mapping, stored headers, cancellation/concurrency, generated code, and extension package build before applying. |

No skipped units. No dependency additions, upgrades, license changes, or lockfile edits by this sync. Local x64 protoc provisioning and `--ignore-scripts` dependency restoration were tooling operations only; no manifests were changed for them.

## Verification Comparison

| Check | Before | After |
| --- | --- | --- |
| Frozen install | PASS, no changes | PASS, no changes on restored tree |
| Truly clean install/root build | Initial root build PASS with locked node_modules retained | Clean removal exposes pre-existing grpc-tools win32-arm64 archive 404; root build blocked during install. Frozen `--ignore-scripts` restoration succeeds. |
| SDK + CLI/hub builds | PASS | PASS separately after restoration |
| Root `bun run types` | PASS | PASS after each batch, including U5 |
| Root `bun run lint` | 39 warnings, 80 infos, no errors | Same 39 warnings, 80 infos, no errors |
| Root `bun run test` | FAIL/130; 2 llms telemetry timeouts cancel remaining workers | FAIL/130; 1 same telemetry timeout cancels remaining workers |
| Complete llms, independent | 997 passed, 2 failed, 4 skipped in parallel baseline | 1007 passed, 0 failed, 4 skipped; 8 new tests. Timing-dependent telemetry timeout remains in root parallel run. |
| Complete core, independent | 2873 passed, 11 failed, 88 skipped | Same 2873 passed, 11 failed, 88 skipped |
| Shared | 478 passed, 9 skipped in parallel baseline | 482 passed, 5 skipped, no failures; platform-conditioned skips vary |
| Agents | 134 passed | 134 passed |
| Hub | 112 passed | 112 passed |
| UI / example VS Code | 209 / 4 passed | 209 / 4 passed |
| Desktop sidecar with `NODE_OPTIONS=--no-experimental-webstorage` | 1117 passed, 16 failed (1133 total) | 1134 passed, same 16 failed (1150 total); 17 added tests |
| Desktop settings | Not separately counted at baseline | 65 passed, no failures |
| U5 focused hook/reducer/composer/session | Existing checks included in baseline sidecar | 221 passed across 4 files |
| Desktop production web build | PASS, included pre-existing `/glyph` page | PASS; `/glyph` page now absent because external user activity emptied its directory; sync never edited it |
| Legacy extension unit | 676 passed, 48 failed / 81 files, missing generated imports | Untouched/deferred; no successful generated-code verification claimed |
| Legacy extension type/lint/bundle | Missing ARM native formatter; missing bash; missing generated outputs | Unresolved, untouched |
| Complete CLI unit | Stalled after prompt tests; at least 10 pre-existing failures | Root worker cancelled by llms; complete totals remain unavailable |
| Protected focused CLI | 31 passed initial identity/reasoning/animation checks | 51 passed including provider selection and compaction |
| Protected focused core | Included in broad baseline | 79 passed across 7 cache/provider/hub files |
| Glyph terminal smoke | 7 scenarios pass | Same 7 pass |
| Windows installer | 7 tests, 43 assertions pass | Same 7 tests, 43 assertions pass |
| CLI startup | Not recorded initially | `bun run cli --help` reports Glyph; `bun run cli version` reports 3.0.67 |

Desktop's extra remote-route timeout under concurrent typechecking disappeared on full-suite retry; final failure set matches the same five baseline files. Original Node 26 default webstorage caused 288 additional desktop failures, avoided with a process-local option rather than source changes.

## Preservation Audit

- Registry covers all 233 fork-changed paths: 162 surviving customization files and 71 intentional deletions.
- Independent Git blob audit confirms 162/162 customization blobs unchanged from original Glyph HEAD, including after external commit `a7a09f9c8`; 71/71 deleted files remain absent.
- `git diff 8818c76cb HEAD --name-only -- apps/cli sdk/packages/core sdk/packages/shared` returns no output.
- Original `build-cli.ps1` has local CRLF versus tracked LF; normalized content is unchanged. No literal whole-worktree byte identity claim.
- Runtime identity diff introduces no upstream extension ID, publisher, branding asset, service URL, or telemetry key. Existing provider compatibility strings remain; new identity literals in wire tests are fixtures only.
- No Glyph behavior required adaptation. U5 edits inherited desktop code, not a registered fork customization.
- Existing user work was never staged/reverted by this sync. External activity committed root dirty helper/workflow/landing-page files; `thinking-orbs/` remains untracked.

## Remaining Risks And Manual Checks

The full workflow cannot be signed off until the following checks have evidence:

- Complete CLI unit suite under supported tooling; clean install/build with Windows-compatible native dependencies.
- Legacy extension deferred units and generated-code checks.
- Credentialed main agent flow, provider switching and saved reasoning choices through restart/compaction, offline cache behavior, installed `glyph`/`cline` parity, and isolated hub fingerprint/cancellation smoke.
- Full native distribution/installer user GUI checks and interactive terminal resize/cursor/theme checks beyond passing automated smoke.
- Browser `thinking-orbs/` behavior and equivalence of the externally created `landing-page/` to the former desktop `/glyph` route. These are user work and were not repaired or inferred equivalent.

Detailed classification: `CHANGES.md`. Protected contracts/check recipes: `REGISTRY.md`. Baseline evidence: `BASELINE.md`. Resume instructions and batch boundaries: `PROGRESS.md`. Judgment calls: `DECISIONS.md`.
