# Sync Baseline

## Source Range

- Glyph starting HEAD: `8818c76cb` on `ghost_/dev`.
- Sync branch: `sync/cline-2026-10-01`.
- Verified upstream base: `9fe17595de3b0c980d6c8291f7c42bf0b8cc94a3`.
- Reference target: `0809928ab28783c0d2b41c1e56edaf0951dadcab`.
- README records `de0f74cafc7f509467f65f57dc6d784b26004db9` as the development baseline. Git shows it is the first fork-only change (OpenAI-compatible Responses support), absent from upstream; its parent is the verified common upstream base.
- Upstream ancestry check: `git merge-base --is-ancestor 9fe17595de3b0c980d6c8291f7c42bf0b8cc94a3 HEAD` in `cline_source` exited 0.
- Four upstream commits follow that base. Reference checkout is clean on `main` and will not be modified.
- CLI version before sync: `3.0.67`.

## Protected Pre-existing Work

Do not stage or undo: modified `.gitignore` and `package.json`; untracked `.workflows/`, `scripts/`, `thinking-orbs/`, and `apps/examples/desktop-app/webview/app/glyph/`.

## Toolchain and Commands

- Installed Bun: `1.4.0`; required by repository: `1.4.2`. Record compatibility failures rather than silently upgrading.
- Installed Node: `v26.5.1`; required: `>=22`.
- Install: `bun install --frozen-lockfile`.
- Typecheck: `bun run types`.
- Lint: `bun run lint`.
- Tests: `bun run test`.
- Build: `bun run build` (clean, install, SDK build, CLI build).
- SDK prerequisites: `bun run build:sdk` before typechecks/tests needing compiled exports.
- VS Code code generation: `bun run protos` in `apps/vscode`; typecheck/build scripts also invoke it where documented.
- Root clean script removes workspace build artifacts and dependencies, not the nested upstream checkout. No source changes are part of baseline execution.

## Verification

| Command | Baseline result |
| --- | --- |
| `bun install --frozen-lockfile` | PASS; 2465 installs checked across 2604 packages, no changes. |
| `bun run build` | PASS; all six SDK builds, hub webview, and CLI exit 0. Clean reports existing Windows EPERM locks in root, CLI, and desktop node_modules. |
| `bun run types` | PASS; all selected workspace typechecks finish successfully. |
| `bun run lint` | PASS; 2187 files, 39 warnings, 80 infos, no errors, no fixes. |
| `bun run test` | FAIL (exit 130); llms 2 telemetry timeouts cause Bun to cancel core, CLI, hub. |
| `bun -F @cline/core test` | FAIL; 5 failed files, 209 passed, 1 skipped; 11 failed tests, 2873 passed, 88 skipped. |
| `bun -F @cline/cli test` | INCOMPLETE; at least 10 failures recorded, then stalled after prompt tests; stopped after prolonged lack of output. No complete total claimed. |
| `bun -F @cline/cline-hub test` | PASS; 9 files, 112 tests. |

Other completed results from root test: agents 134 passed; shared 478 passed/9 skipped; UI 209 passed; example VS Code 4 passed; llms 997 passed/2 failed/4 skipped.

Pre-existing failures include llms `langfuse-telemetry.test.ts` (two 5000ms timeouts), core MCP orchestration and provider-default metadata expectations, CLI plugin install (five), update hub-owner expectation (one), doctor stale sidecar (one), and prompt file/image mentions (three). Supplemental logs/counts will be recorded before final comparison. These unrelated failures are not sync fix targets.

Baseline tooling runs; Phase 0 gate is satisfied with documented failures. Note root tests select `@cline/vscode` (the example extension), not the legacy `claude-dev` extension touched by two upstream commits; additional legacy extension baseline is required for those batches.

## Supplemental Baselines

| Command | Result |
| --- | --- |
| Desktop `bun run build:web` | PASS; production build includes existing user `/glyph` route. |
| Desktop `bun run test:sidecar` | FAIL; 304 failed/829 passed (1133), 14 failed/45 passed files. 288 failures come from Node 26 experimental webstorage shadowing jsdom. Other 16 are Windows path/cleanup, missing `sh`, and logging expectations. |
| Desktop `$env:NODE_OPTIONS='--no-experimental-webstorage'; bun run test:sidecar` | FAIL; 16 failed/1117 passed (1133). Use this explicit environment for desktop batch comparisons, without modifying source or test config. |
| CLI `bun run test:windows-installer` | PASS; 7 tests, 43 assertions. Test changes PATH in its controlled subprocesses. |
| CLI `bun run test:tui:smoke` | PASS; all seven loading/model/orb/face/onboarding checks. |
| Legacy extension `bun run check-types` | BLOCKED; no grpc-tools win32-arm64 protoc archive (404). Provisioning existing dependency's x64 protoc via `node-pre-gyp install --target_arch=x64` succeeds, but ts-proto then cannot load `dprint-node.win32-arm64-msvc.node`. No dependency/version/source edits made. |
| Legacy extension `bun run lint` | FAIL; Biome checks 1259 files without errors, then proto lint cannot find `bash`. |
| Legacy extension `bun run test:unit` | FAIL; 81 files, 676 passed/48 failed tests; 42 failing files, predominantly missing generated proto imports; serial retry confirms failures. |
| Legacy extension `bun esbuild.mjs` | FAIL; bundle cannot resolve missing generated proto/host bridge output. |

CLI supplemental `bun run test:unit -- --exclude src/runtime/prompt.test.ts` also does not yield a complete run; at least nine failures observed (plugin five, Slack stale connector one, update one, doctor one, image output one). Full CLI test totals remain unverified rather than guessed.

The x64 protoc provisioning only updates installed dependency artifacts, not project manifests or `cline_source`.
