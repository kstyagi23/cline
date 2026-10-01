# Glyph Divergence Registry

## Scope And Evidence

- Phase 1 only, for `.workflows/sync.md`; root `C:\VAULT\cline`.
- Authoritative fork comparison: `9fe17595de3b0c980d6c8291f7c42bf0b8cc94a3..8818c76cb` (original Glyph HEAD), not current moving HEAD or a newer upstream tree.
- `git diff --stat`, `--name-status`, `--numstat`, and actual textual diffs for that exact range were read. Coverage: **233 committed changed files**, 5,868 inserted and 17,365 deleted lines. Large deletions are primarily upstream repository automation/instructions and the old generated robot frame asset, not removal of the agent runtime.
- Relevant implementation/test symbols were read, including inherited `toProviderConfig` routing, which is NOT itself modified in this range. Existing dirty tracked changes and untracked sync scripts, browser orb project, and desktop `/glyph` route were read separately.
- No newer upstream changes were analyzed. `cline_source` was not inspected or modified. No source edits, Git mutations, dependency installations, builds, or tests were performed for this registry.
- All checks below are **future verification recipes, NOT passing results**. Existing baseline results remain owned by `BASELINE.md`; this document does not independently verify them.
- Classification: **additive** adds files/contracts/settings; **invasive** changes inherited implementation, presentation, or repository policy. Mixed entries require both preservation of added files and hand-merging of existing integration points.
- Identity changes, behavior changes, intentional repository removals, and incidental noise are separated below. Features merely described by the README (Plan/Act, teams, worktrees, MCP, history, connectors, approval defaults) are inherited unless an entry identifies an actual diff.

## Identity And Compatibility

### ID-01: Glyph CLI identity with retained Cline compatibility

Purpose: expose Glyph to users without migrating the SDK, providers, persistent state, or registry distribution contract. **Mixed additive/invasive; identity plus command aliases.**

- Symbols: new `APP_NAME = "Glyph"`, `CLI_COMMAND = "glyph"` in `apps/cli/src/branding.ts`; `createProgram`, `createCliCore`, `AcpAgent.initialize`, `deriveTerminalTitle`, `getCliBuildInfo`.
- `apps/cli/package.json` changes `displayName` and adds the `glyph` bin alongside `cline`, both targeting `src/index.ts`. `bun.lock` records only that bin addition, not a dependency upgrade.
- `apps/cli/script/build.ts` emits Glyph platform manifest display labels and both bins pointing at the same `bin/cline` or `bin/cline.exe`. `script/publish-npm.ts` emits a Glyph display label and both wrapper bins pointing at `./bin/cline`. `bin/cline` changes user-facing trust/startup/missing-binary diagnostics, retaining resolver paths and `CLINE_*` environment wiring.
- Display changes cover CLI help/errors, plugin/skill/MCP/config guidance, doctor/update messages, connector foreground hints and first contact, schedule prompts/client labels, session/zen client labels, exit/restore hints, mistake prompts, permissions/questions, home/onboarding, theme labels, and empty/non-chat terminal titles. Chat terminal titles still derive from user text. Theme IDs and palette values are unchanged.
- ACP adds `agentInfo.title = "Glyph"`, while `agentInfo.name` remains `cline`. Runtime/telemetry name is explicitly fixed to `cline` rather than following package `displayName`; `cline.log` and logger identity remain compatible.
- Preserve provider/account/service labels **Cline**, **ClinePass**, provider IDs including `cline`/`cline-pass`, `@cline/*`, registry wrapper `cline`, platform packages `@cline/cli-*`, compiled binary names, `CLINE_*`, `.cline` storage, Cline service URLs, copyright/author/publisher fields, protocols/client-type identifiers, and installer `ClineCLI` upgrade keys. This is not a global search-and-replace rebrand.
- Distribution caveat: updater still targets upstream Cline packages. Root README expressly warns that upstream `cline` installs and `glyph update` do not preserve this fork. Preserve that warning; do not silently introduce a Glyph package/release migration.

Files: `apps/cli/{package.json,bin/cline}`, `script/{build.ts,publish-npm.ts}`, `src/{branding.ts,main.ts}`, `src/acp/acpAgent.ts`, `src/commands/{program.ts,connect-via-hub.ts,dashboard.ts,doctor.ts,mcp.ts,plugin.ts,skill.ts,update.ts,schedule/client.ts}`, `src/connectors/adapters/{discord,gchat,linear,prompts,slack,telegram,whatsapp}.ts`, `src/runtime/{format.ts,run-interactive.ts,run-zen.ts,prompt.ts,interactive/exit-summary.ts,interactive/mistakes.ts}`, `src/session/session.ts`, `src/tui/{cline-account.ts,root.tsx,themes.ts,commands/slash-command-registry.ts}`, `src/tui/components/{inline-tool-response.tsx,dialogs/command-palette-items.ts,dialogs/help-dialog.tsx,dialogs/hub-update-required.tsx,dialogs/mcp-manager-dialog.tsx}`, `src/tui/utils/terminal-title.ts`, `src/tui/views/{config-view-helpers.ts,home-view.tsx,onboarding/screens.tsx}`, `src/utils/{common.ts,chat-commands.ts,history-format.ts}`, `src/wizards/{connect,schedule}/index.ts`, `bun.lock`.

Verification: after SDK build, `bun run --cwd apps/cli test:unit` (branding expectations in ACP, program, main, logging, session, dashboard, MCP/plugin, chat commands, themes, terminal title, palette/config, exit summary, mistakes, wrapper and distribution tests); `bun run cli --help`, `bun run cli version`; manually inspect onboarding, home, question/permission UI, provider sign-in labels, empty/chat titles, connector greeting and command hints. Inspect generated manifests and run both installed commands with identical arguments/exit status. Do NOT run the updater as a smoke check.

### ID-02: CLI-local system prompt identity

Purpose: make default agent introductions and CLI guidance use Glyph without corrupting user prompts or service identifiers. **Invasive; identity expressed through agent instructions.**

- `apps/cli/src/runtime/prompt.ts`: `CLI_BRANDING_RULES`, `resolveSystemPrompt` merge Glyph user-facing/canonical-command rules into the shared builder and replace only the leading default `You are Cline,` introduction.
- Explicit nonblank system prompt overrides are returned without identity rewriting. Provider/service/package/env/storage names elsewhere, and caller rules, remain intact.
- `prompt.test.ts` covers act/plan/yolo default prompts and explicit override preservation. ACP also consumes this helper.

Verification: `bun run --cwd apps/cli test:unit -- src/runtime/prompt.test.ts`; manually inspect default prompt behavior in all three modes and a custom Cline-named explicit prompt. Do not rebrand shared SDK prompts globally.

### ID-03: Fork-facing documentation and honest distribution guidance

Purpose: describe a terminal-focused fork with proper upstream attribution and accurate installation/compatibility guidance. **Invasive; identity/documentation, not proof of new runtime features.**

- `README.md` replaces the multi-surface Cline landing page with Glyph setup, usage, approval/storage/worktree caveats, reasoning controls, differences, development commands, and credits/license. Protect the no-Glyph-registry and updater warnings.
- `apps/cli/README.md` changes application commands/labels while retaining upstream service/extension links and explains dual bins, protocol selection, reasoning controls, compatibility state and source setup. Some `npx` examples become `bunx`; underlying skill invocation remains inherited `npx`.
- `apps/cli/DISTRIBUTION.md` adds Windows build/setup/compiler/smoke details and filesystem-permission guidance. Its retained Cline filenames/command examples are compatibility identifiers, not evidence that Glyph identity should be reverted.
- Root README calls `de0f74cafc7f509467f65f57dc6d784b26004db9` the development baseline. The user-specified comparison base is authoritative for this registry; do not drop the first fork feature by using the README value as a merge base.

Verification: review all three docs against preserved scripts and identity boundaries; inspect relative links and command examples without installing/publishing/updating anything.

## Behavior

### BE-01: Selectable OpenAI-compatible Chat Completions / Responses

Purpose: let custom endpoints select either transport while retaining endpoint-owned identity, configuration, and conversation history. **Mixed additive/invasive; high risk.**

- `sdk/packages/core/src/services/providers/provider-config-fields.ts`: add `ProviderConfigFieldKey` `protocol`, selectable field `options`, and OpenAI-compatible API choices defaulting to `openai-chat`.
- `apps/cli/src/tui/utils/provider-config-values.ts`: `getProviderConfigProtocol` restores explicit routing first, then protocol/client; `resolveProviderConfigProtocol` saves matching triples. Responses is `openai-responses` / `openai` / `openai-native`; Chat is `openai-chat` / `openai-compatible` / `openai-compatible`. Switching back must replace stale Responses routing, not just change the label.
- Both onboarding and `ProviderConfigInputContent` render actual select controls with Tab and Up/Down guidance, initialize from saved settings and await persistence; field order includes protocol. Other credentials/base URL/headers/Azure/model settings survive.
- Inherited `sdk/packages/core/src/services/llms/provider-settings.ts` `toProviderConfig` already understands `protocol`/`client` and explicit `routingProviderId`; only its regression test changes here. Register it as a dependent symbol, NOT a fork source modification.
- `sdk/packages/llms/src/providers/compat.ts`: async and sync `resolveGatewayProviderRegistration` choose the routed builtin's `createProvider` when that builtin exists rather than nullish-falling back to the original factory. This is behavior, not formatting: lazy `loadProvider` registrations can legitimately lack `createProvider`.
- Generic endpoints routed through the OpenAI adapter send `store: false` (`openAiAdapterRule`) and the complete conversation/tool-call outputs, rather than requiring server-side item references. Existing configurations still use Chat Completions.
- New HTTP-boundary tests exercise real serializers for custom models, URLs, credentials/headers, explicit output-token limits, streaming text/usage/reasoning/function calls, prior function-call history and completion success. Docs in `sdk/DOC.md` record the setting contract.

Files: core `services/providers/provider-config-fields{,.test}.ts`, `services/llms/{provider-settings.test.ts,handler-factory.routing.test.ts}`; llms `providers/{compat.ts,routing/provider-option-rules.ts}`, new `tests/openai-compatible-responses.test.ts`; CLI `tui/utils/provider-config-values{,.test}.ts`, `components/dialogs/provider-picker.tsx`, `views/onboarding/{controller.ts,fields.ts,screens.tsx}`; `sdk/DOC.md`, CLI README.

Verification: from `sdk`, `bun -F @cline/core test:unit -- src/services/providers/provider-config-fields.test.ts src/services/llms/provider-settings.test.ts src/services/llms/handler-factory.routing.test.ts`; `bun -F @cline/llms test -- src/tests/openai-compatible-responses.test.ts`; CLI `test:unit -- src/tui/utils/provider-config-values.test.ts`. Manual: configure both APIs in onboarding and provider picker, restart, switch back, inspect persisted triples and captured request URLs/body/history. Use a disposable provider config and mock/local server, not production credentials.

### BE-02: Azure API version and keyless compatible Responses

Purpose: keep Azure deployments and unauthenticated local custom endpoints functional through the native Responses adapter. **Invasive with additive shared fetch helper.**

- `sdk/packages/llms/src/providers/http.ts` exports relocated `createAzureApiVersionFetch`; append configured trimmed `api-version` only on `/openai/deployments/` paths lacking it; retain Request/string/URL handling and optional `preconnect` behavior.
- `providers/vendors/openai-compatible.ts` uses the shared helper instead of its previous private copy. `vendors/openai.ts` now applies the helper too, covering Responses.
- Native OpenAI factory detects keyless `openai-compatible`, supplies empty API key to suppress native SDK environment fallback/check and removes only empty `Authorization: Bearer` via `createKeylessFetch`. Real custom authorization headers survive; normal OpenAI authentication is not disabled.

Verification: llms `test -- src/tests/openai-compatible-responses.test.ts` includes Azure Responses and keyless/custom-auth cases. Manual: capture Chat and Responses Azure URLs, existing query values and non-Azure URLs; verify keyless local requests do not leak `OPENAI_API_KEY` or emit an empty bearer header.

### BE-03: Model-aware reasoning choice UI and complete CLI effort vocabulary

Purpose: offer real model-supported controls, including manual custom-model effort, without conflating provider default, off and enabled. **Mixed additive/invasive; high risk.**

- New `apps/cli/src/utils/reasoning-options.ts`: `getReasoningChoices`, `getCurrentReasoningChoice`, `applyReasoningChoice`, `ReasoningChoice`, `CliReasoningSelection`. Default is always distinct; advertised efforts are respected including minimal/max; off is not invented for effort-only models; toggle supports on/off; budget-only controls use SDK effort presets. Unknown compatible models allow manual choices, but explicit `reasoningOptions: []` forbids invented controls.
- `commands/program.ts`: `ReasoningEffortOption.attributeName()` shares Commander `thinking` state; visible `--reasoning-effort` alias and `--thinking` accept `none|minimal|low|medium|high|xhigh|max` via `ReasoningLevelSchema`, last occurrence wins. `utils/helpers.ts` preserves both spellings during normalization; bare alias still selects medium. `main.ts` invalid-level diagnostics include the complete vocabulary.
- `utils/reasoning.ts` restores all shared effort levels and preserves enabled-without-effort instead of forcing medium.
- New `tui/hooks/use-reasoning-selector.tsx`: `chooseModelReasoning`, `useReasoningSelector`; `ReasoningLevelContent` replaces fixed `ThinkingLevelContent`. `/reasoning`, palette action `reasoning` and `Opt+E` are wired through local command actions and root. Existing global palette shortcut dispatch provides the keyboard handling; no new root-keyboard implementation was added.
- Unified `useModelSelector` asks for reasoning after featured/browse/custom/general model selection; preserves known metadata for fetched compatible model IDs; cancelled reasoning selection restores previous model and keeps selection open. Provider changes restore that provider's persisted reasoning and clear stale budget/default state.
- Onboarding uses actual model metadata (including featured Cline/ClinePass models) instead of a set of reasoning-capable IDs; preserves current choice, skips controls when only default is supported, and exposes manual custom-model choices. Keyboard/screen/result/root plumbing carries dynamic levels and reset intent.
- `sdk/packages/shared/src/rpc/runtime.ts` `ProviderModel.reasoningOptions`; core `StoredModelEntrySchema`, `toProviderModel`, `toStoredModelInfo` preserve the control metadata through local model registration/storage/results.

Files: CLI `src/{commands/program.ts,main.ts,utils/{helpers.ts,reasoning.ts,reasoning-options.ts,types.ts}}`, `tui/{root.tsx,commands/slash-command-registry.ts}`, `tui/hooks/{local-command-actions.ts,use-local-command-actions.tsx,use-model-selector.tsx,use-reasoning-selector.tsx}`, `tui/components/{dialogs/command-palette-items.ts,dialogs/help-dialog.tsx,model-selector/model-selector.tsx}`, `tui/views/onboarding/{controller.ts,keyboard.ts,model.ts,screens.tsx,view.tsx}`; core `services/providers/local-provider-registry.ts`; shared `rpc/runtime.ts`. Associated tests: program, helpers, reasoning, reasoning-options, local-command-actions, slash registry, palette, onboarding/model, core/local-provider-service.

Verification: CLI `test:unit` for the named tests; from `sdk`, core `test:unit -- src/services/providers/local-provider-service.test.ts`; manual `/reasoning`, palette/Alt+E, cancellation/refocus, all model/provider selection routes, toggle/effort/budget/no-control/unknown models and CLI mixed-flag last-wins behavior. Do not assert every advertised effort is accepted by every remote endpoint.

### BE-04: Persistent reasoning reset, transcript continuity and compaction

Purpose: carry explicit default/off/effort selection through saved settings and current-session restart without reviving stale overrides. **Invasive plus additive config field.**

- `Config.reasoningDefault` and onboarding result distinguish explicit reset from unspecified input. `applyReasoningChoice` clears `thinkingBudgetTokens` for every new choice.
- `runtime/run-interactive.ts` `resolveReasoningForModelChange` returns undefined for reset, `{ enabled: false }` for off; `applyInteractiveModelChange` writes `reasoning` even when undefined, clearing persisted old settings, then uses inherited restart-with-current-messages behavior.
- `runtime/interactive/compaction.ts` `resolveCompactionReasoningSettings` prioritizes explicit default/off over saved effort/budget. Root onboarding assigns undefined values instead of retaining stale config.
- `run-interactive.test.ts` adds max/off/default persistence/reload tests for both compatible protocols; `compaction.test.ts` checks reset/off never restores stored high effort or 4096-token budget.

Verification: CLI `test:unit -- src/runtime/run-interactive.test.ts src/runtime/interactive/compaction.test.ts src/utils/reasoning-options.test.ts src/utils/reasoning.test.ts`; manual select max, off, default, restart CLI, retain transcript, invoke `/compact`, inspect request reasoning and provider JSON. Saved preferences are on the provider's selected model settings; no new independent per-model history store is introduced.

### BE-05: Exact requested reasoning controls on provider wire

Purpose: avoid portable AI SDK normalization reducing explicit custom or advertised extended effort values. **Invasive; high-risk serializer/routing contract.**

- `ProviderOptionMatchInput.requestedReasoning` and `composeAiSdkProviderOptions` preserve original request intent alongside normalized request. `portable-reasoning.ts` exempts `openai-compatible` from portable effort routing.
- `openAiCompatibleReasoningRule`: custom unknown models preserve explicit minimal/xhigh/max on both transports; enabled without metadata defaults to medium, explicit off emits none, omitted reasoning remains omitted. Advertised metadata is normalized, explicit no-controls respected; explicit budget bypasses the effort rule. OpenAI Responses bucket uses `forceReasoning: true`, `reasoningSummary: null`; compatible bucket/alias receives `reasoningEffort`.
- `requestsAdvertisedEffort` guards non-disabled, no-budget, explicitly advertised effort. `openAiMaxReasoningRule` preserves advertised max; `anthropicMaxReasoningRule` applies to adaptive Claude on Anthropic/Vertex with `{ effort: "max", thinking: { type: "adaptive", display: "summarized" } }`; `bedrockExtendedReasoningRule` preserves exact advertised xhigh/max through `reasoningConfig.maxReasoningEffort`.
- No override is added for unadvertised max, explicit off, or explicit token budgets. Provider wire encodings remain in named rules, not an app-side serializer hack.

Files: llms `providers/routing/{portable-reasoning.ts,provider-option-rules.ts,provider-options-types.ts,provider-options.ts,provider-options.test.ts}`, `providers/vendors/bedrock.wire.test.ts`, new `tests/native-reasoning-effort.test.ts`, `tests/openai-compatible-responses.test.ts`.

Verification: from `sdk`, `bun -F @cline/llms test -- src/providers/routing/provider-options.test.ts src/providers/vendors/bedrock.wire.test.ts src/tests/native-reasoning-effort.test.ts src/tests/openai-compatible-responses.test.ts`; inspect captured real AI SDK HTTP bodies for all transports/provider families plus off/unadvertised/budget negative cases.

### BE-06: LiteLLM model facts, aliases and persistent offline-safe cache

Purpose: enrich model limits, capabilities, modalities, reasoning and prices without changing inference IDs or replacing endpoint inventories. **Mixed additive/invasive; high risk.**

- New llms `catalog/catalog-litellm.ts`: `LITELLM_CATALOG_URL`, `setLiteLLMModelCatalog`, `getLiteLLMModelInfo`, `enrichLiteLLMModelInfo`, `mergeLiteLLMPricing`. Validate snapshot before replacing current maps; ignore sample/non-model records and invalid numbers; normalize per-token to per-million prices and long-context tier fields, capabilities/modalities/language operation and reasoning efforts.
- Exact model IDs win; provider-qualified aliases disambiguate, Azure/OpenAI/Vertex/Gemini prefixes map to LiteLLM names; multi-slash names survive and ambiguous bare IDs are not guessed. Returned IDs/names use caller selection. Raw LiteLLM metadata is retained. Explicit defined fields/prices (including zero) override fallback facts; bundled facts can prefer fresh catalog. Flat price overrides also override inherited tier rates unless explicit tiers supplied.
- New core `initializeLiteLLMModelCatalog` caches full raw JSON at data-dir `cache/model_prices_and_context_window.json`; per-path concurrent operations, file version detection/reload, cached-only no-download mode, at most one network attempt per process/path, five-second abort, unique exclusive temp files/atomic rename and cleanup. Missing/invalid/network/persistence/data-dir failures do not block startup or discard last valid snapshot.
- CLI `runCli` refreshes once before agent/provider resolution (not lightweight command dispatch); daemon entry initializes its own snapshot. `resolveProviderConfig` loads cached-only; async/sync model/handler registries enrich known/selected models and forward raw metadata.
- `provider-defaults.ts` enriches LiteLLM proxy underlying/display aliases, but live/private/public/caller endpoint facts remain authoritative, and unrelated catalog models are not added to provider inventories. `handler-factory.ts` can supply selected model facts; explicit selected limits remain authoritative.
- Core index exports initializer; llms node/browser indexes export catalog APIs. `sdk/ARCHITECTURE.md` records refresh/offline/ID/inventory guarantees.

Files: llms `catalog/catalog-litellm{,.test}.ts`, `index{,.browser}.ts`, `providers/{compat.ts,model-registry.ts,registry.ts}`; core `index.ts`, `hub/daemon/entry.ts`, `services/llms/{litellm-catalog-cache.ts,litellm-catalog-cache.test.ts,litellm-metadata.test.ts,provider-defaults.ts,handler-factory.ts,handler-factory.test.ts}`; CLI `src/main{,.test}.ts`; SDK architecture docs.

Verification: from `sdk`, llms `test -- src/catalog/catalog-litellm.test.ts`; core `test:unit -- src/services/llms/litellm-catalog-cache.test.ts src/services/llms/litellm-metadata.test.ts src/services/llms/handler-factory.test.ts`; CLI main tests. Manual mock/offline startup: inspect cache raw JSON, second-process reload, stale/invalid external cache, five-second timeout, price overrides and ambiguous aliases, exact request model ID and endpoint-only inventory. No external catalog fetch is required for these regression tests.

### BE-07: Correct long-context usage pricing tiers

Purpose: bill fallback estimates using the applicable tier rather than a flat model price. **Invasive plus additive shared schema.**

- Shared `ModelPricingSchema.tiers` validates nonnegative `aboveInputTokens` and optional input/output/cacheRead/cacheWrite rates, preserving explicit zero.
- llms `calculateUsageCostFromPricing` selects the highest threshold strictly below **total input tokens including cache reads/writes**, regardless of tier ordering. Equal threshold uses base/lower tier; missing selected tier fields fall back to base, not another tier. Missing cache-write price uses input * 1.25. No double billing cache tokens; output count includes reasoning under inherited normalization.
- Provider-reported raw/gateway cost remains authoritative over fallback estimates. `mergeLiteLLMPricing` behavior is protected with BE-06.

Files/symbols: shared `src/llms/model-info{,.test}.ts`, llms `src/providers/ai-sdk{,.test}.ts`, `catalog/catalog-litellm.ts`.

Verification: from `sdk`, `bun -F @cline/shared test -- src/llms/model-info.test.ts`; llms `test -- src/providers/ai-sdk.test.ts src/catalog/catalog-litellm.test.ts`; check boundaries, unsorted tiers, cached-input accounting, absent fields, zero rates and reported-cost precedence.

### BE-08: Bounded hub probing and explicit cancellation identity

Purpose: prevent stalled local listeners blocking startup and distinguish a detached client's cancelled capability from real execution failure. **Invasive.**

- core `hub/discovery/index.ts` `HUB_PROBE_TIMEOUT_MS = 2000`, `probeHubServer`: deadline applies to fetch/body and combines with caller signal via `AbortSignal.any`; preserve caller cancellation and gracefully return undefined.
- `PendingCapabilityRequest.resolve` adds `cancelled?`; `cancelPendingCapabilityRequests` resolves `{ ok: false, cancelled: true, error: reason }`; `requestCapability` rejects with `Error.name = "AbortError"` only for cancelled results. Ordinary client errors retain `Error`. Cancellation event carries the flag and pending map is cleared.
- Documentation records bounded probes; do not confuse this two-second probe deadline with inherited 15-second daemon startup allowance.

Files: core `src/hub/discovery/index{,.test}.ts`, `src/hub/server/handlers/{capability-handlers.ts,context.ts}`, `src/hub/server/hub-capability-tool-executors.test.ts`, `sdk/ARCHITECTURE.md`.

Verification: from `sdk`, core `test:unit -- src/hub/discovery/index.test.ts src/hub/server/hub-capability-tool-executors.test.ts`; manually simulate stalled HTTP listener/caller abort and client detach during delegated hook/tool request, ensuring cancellation is not shown as an ordinary fatal failure.

### BE-09: Portable native build filesystem handling and runtime fingerprints

Purpose: build Windows reliably and detect compiled CLI / daemon mismatches after rebuilding. **Invasive plus new smoke harness.**

- `apps/cli/script/build.ts` replaces Unix rm/cp/chmod commands with Node filesystem APIs, uses unique absolute OS-temp directories and try/finally to restore cwd and clean temporary output, only chmods POSIX.
- Both `apps/cli/bun.mts` and native builder compute `resolveSdkRuntimeBuildId` and inject `__CLINE_CORE_RUNTIME_BUILD_ID__` / `__CLINE_CORE_RUNTIME_BUILD_EPOCH_MS__`, because CLI tsconfig paths compile SDK source rather than consuming dist defines.
- `commands/hub.ts` adds `buildId` and `buildEpochMs` to status JSON. Host-native build smoke compiles real TUI loading views with identical options, boots an isolated hub, requires matching build ID/core version/running state and empty JSON history, then stops hub/cleans isolation.
- `script/publish-npm.ts` similarly replaces shell copy/remove/mkdir with portable filesystem APIs. Existing package identities/direct-publish guards/native variant machinery remain.
- Distribution tests inspect real build-manifest expressions and both source-bundling define paths; generated wrapper packing uses disposable copied publisher inputs and dry-run, rather than hand-authored package shape. Wrapper tests gain Windows-compatible executable fixture, argument forwarding and temp cleanup.

Files: CLI `bun.mts`, `script/{build.ts,publish-npm.ts,tui-smoke.tsx}`, `src/commands/{hub.ts,distribution-package.test.ts,bin-wrapper.test.ts}`, `DISTRIBUTION.md`, SDK architecture docs.

Verification: future `bun run --cwd apps/cli build`, `bun run --cwd apps/cli build:platforms:single`, `bun run --cwd apps/cli test:tui:smoke`, focused distribution/wrapper tests. Inspect `hub status` JSON and rebuild fingerprint on an isolated disposable daemon. Native builds delete `apps/cli/dist`, can install variants and start processes; run only in an authorized verification phase, never as part of registry generation.

### BE-10: Per-user Windows installer and conservative uninstall

Purpose: install one compiled payload with both commands without damaging user PATH, files, or running processes. **Additive; installer integration in package scripts is invasive.**

- New `script/build-windows-installer.ts`: `runInstallerCommand`, `findNSISCompiler`, `buildWindowsInstaller`; Windows x64/arm64 checks, optional skip-build, source/platform version match, required `bin/cline.exe`, deterministic payload lists, numeric version conversion, safe NSIS runtime/compiler path quoting, unique staging cleanup. NSIS 3.11 download is SHA-256 verified; `MAKENSIS_PATH` can select existing compiler.
- New `windows-installer/installer.nsi`: user-level, Unicode/DPI-aware, architecture validation, profile install folder and compatible registry upgrade key; preserve Glyph display text with Cline publisher/copyright. `CheckRunningCLI` probes actual image lock, briefly retries transient sharing locks, refuses overwrite/uninstall while running and never kills user processes.
- Create only `glyph.cmd` forwarding to existing `cline.exe`; disable delayed expansion, no CALL second expansion, retain arguments and exit code. Installer includes hub webview and plugin bootstrap. Uninstall deletes only enumerated payload files/shim/uninstaller and empty directories, preserving user-added files.
- `environment.ps1` `Normalize-PathEntry`: modify raw HKCU Registry64 PATH preserving long strings/type/unexpanded variables/empty segments; case-insensitive normalized duplicate detection; record ownership/existence so uninstall does not remove preexisting user entries or later unrelated edits, and deletes PATH value only if setup created it and it becomes empty. Broadcast environment change.
- `build-cli.ps1` shortcut, CLI build/test script additions and distribution docs integrate installer. Artifact remains `ClineCLI-<version>-windows-<arch>-setup.exe` and install folder `%USERPROFILE%\cline` by compatibility design.

Files: CLI `script/{build-windows-installer.ts,windows-installer.test.ts,windows-installer/environment.ps1,windows-installer/installer.nsi}`, `package.json`; root `build-cli.ps1`; docs.

Verification: future `bun run --cwd apps/cli test:windows-installer` (real NSIS compiled fixture, disposable registry keys/folders, long/preexisting/missing PATH, reinstall, arguments/status, user file retention and locked executable); `bun run --cwd apps/cli build:installer:windows`; manual install/new terminal glyph+cline/reinstall/uninstall on disposable Windows user. Tests/compiler builds can download tools and write registry/files: not run in Phase 1. Inspect GUI identity and no-admin behavior separately.

### BE-11: Registration-safe spinners in compiled OpenTUI

Purpose: avoid Bun stripping side-effect-only spinner registration. **Mixed additive/invasive.**

- New `tui/components/spinner.tsx` `Spinner` explicitly calls `registerSpinner()` at render, then emits the extended spinner component.
- Replace side-effect imports/raw spinner use in chat tool/text/compaction rows, loading dialogs, featured model picker, queued steer prompts and onboarding auth/provider/model/local-cli loading views. Thinking indicators themselves use BE-13's orb.
- `script/tui-smoke.tsx` deletes spinner catalogue registration before rendering actual loading dialog and model picker, asserts label and braille output, destroys renderer and uses isolated state. Builder compiles/runs this harness under the native bundle's options.

Files: CLI `tui/components/{spinner.tsx,chat-entry.tsx,chat-message-list.tsx,queued-prompts.tsx,dialogs/loading-dialog.tsx,model-selector/cline-model-picker.tsx}`, `tui/views/onboarding/screens.tsx`, `script/{tui-smoke.tsx,build.ts}`, package scripts.

Verification: future `bun run --cwd apps/cli test:tui:smoke`, native host build smoke; manually observe all listed loading states in compiled CLI, not just source/dev or a healthy daemon.

### BE-12: Glyph circular cursor-tracking face

Purpose: keep a complete aspect-correct Glyph face visible at normal and narrow terminal sizes. **Invasive visual behavior/identity plus additive geometry tests.**

- `robot-frames.ts` replaces encoded/color-run frames with procedural 24-column x 12-row half-cell circle, two enclosed eyes, 129 gaze frames and exported direction/dimension constants. `CroppedFrame.colors`, decoder and `robot-frames.generated.json` are removed intentionally.
- `robot-animation.tsx` renders fixed dimensions, no shrink/no wrapping, one row per line with terminal foreground, tracks using `FACE_HEIGHT`; per-cell palette segment rendering is replaced, not accidentally lost.
- Geometry tests assert aspect ratio, canvas, closed circular silhouette in every gaze, exactly two enclosed holes and mirrored left/right movement. Smoke checks actual complete face in dark 80-column and light 30-column render plus Glyph onboarding with retained Cline provider label.

Verification: CLI `test:unit -- src/tui/components/robot-frames.test.ts`, `test:tui:smoke`; manual cursor gaze and light/dark/narrow/short terminals. Old generated JSON deletion is **not noise** and must not be restored independently of the new renderer.

### BE-13: Animated terminal thinking orb and lifecycle

Purpose: use woven braille geometry during initial waiting and streaming reasoning instead of generic dots. **Mixed additive/invasive visual behavior.**

- New `thinking-orb-frames.ts` `getThinkingOrbFrame`: deterministic woven dual orbit projection, braille bit mapping/depth sparsity, 6x3 normal or 2x1 compact; preserve included MIT attribution/license to Jakub Antalik and Schoolees geometry source.
- New `thinking-orb.tsx` `ThinkingIndicator`: 100ms animation clock with interval cleanup, compact for width < 50 OR height < 15, mode/theme accent and customizable gray label.
- `ChatMessageList` initial streaming uses cancellation hint; `ReasoningBlock` empty/text-streaming states use orb alongside reasoning text, completed reasoning retains inherited collapse behavior. Smoke verifies normal/narrow appearance while waiting and reasoning, then no orb/label after completion. No browser canvas dependency was added.

Files: CLI `tui/components/{thinking-orb-frames.ts,thinking-orb-frames.test.ts,thinking-orb.tsx,chat-entry.tsx,chat-message-list.tsx}`, `script/tui-smoke.tsx`.

Verification: CLI frame unit test and `test:tui:smoke`; manual width/height resize, theme/accent, wait/reasoning/completion/cancel and no lingering interval after unmount. Browser orb project's reduced-motion/pointer features are NOT claimed for this terminal implementation.

## Repository Policy Removals

### RP-01: Removed upstream publish, CI and GitHub service automation

Purpose: keep original fork's repository-service/release infrastructure absent. **Invasive deletion; not application runtime noise.** Intent of each historical deletion was not independently confirmed; preserve current absence rather than silently resurrecting it in a source sync.

- Publish/signing deletion: `.github/actions/sign-windows-cli/action.yml`; workflows `cli-publish.yml`, `desktop-publish.yml`, `ext-vscode-ab-package.yml`, `ext-vscode-publish-legacy.yml`, `ext-vscode-publish-nightly.yml`, `ext-vscode-publish-stable.yml`, `ext-vscode-publish.yml`, `sdk-publish.yml`, `ui-publish.yml`. Removes upstream signing/marketplace/npm/release/notification/update-feed integration, not local build scripts.
- Test/coverage automation deletion: workflows `desktop-test.yml`, `ext-jb-test-integration.yml`, `ext-vscode-test-e2e.yml`, `ext-vscode-test.yml`, `sdk-test.yml`; `.github/scripts/coverage_check/{__init__.py,__main__.py,extraction.py,github_api.py,util.py,workflow.py}`, `.github/scripts/tests/coverage_check_test.py`. Removed helpers include branch coverage execution/comparison and GitHub comment/output handling (`extract_coverage`, `compare_coverage`, `process_coverage_workflow`, `post_comment`, branch checkout helper).
- Repo maintenance deletion: workflows `repo-delete-agent-promo-comments.yml`, `repo-label-issues.yml`, `repo-stale-issues.yml`, `repo-strip-agent-badges.yml`; CODEOWNERS; bug/config issue templates; PR template; Dependabot config. Removes upstream issue classification/stale closing/PR body cleanup/owners/dependency bot rules and upstream contribution forms.
- `.greptile/{config.json,files.json,rules.md}` removed upstream automatic review/telemetry rules and referenced-file catalogue. This does NOT remove runtime telemetry, which remains protected by ID-01.

Verification: compare proposed sync file inventory with exact original-range deletion list; manually confirm none of these paths reappear or introduce upstream release secrets/URLs/marketplace/product identity. Do not execute deleted scripts/workflows as a verification step. A new Glyph CI/release policy would need separate authorization/design.

### RP-02: Removed upstream agent instruction/host setup integrations

Purpose: preserve fork's removal of upstream repository-local agent guidance and automatic environment actions. **Invasive deletion; tooling/instruction behavior rather than product runtime.**

- `.claude/commands/{hotfix-release.md,release.md}` and seven `.claude/skills/{cline-sdk,desktop-whats-new,opentui,publish-cli,publish-desktop,publish-extension,tuistory}` links removed. Targets for SDK/OpenTUI under `.agents/skills` were not removed by this range.
- `.claude/settings.json` and `hooks/claude-code-for-web-setup.sh` removed automatic remote session setup: gh download/install, token guidance, install/protos invocation.
- `.codex/environments/environment.toml` removed autogen environment and actions for node_modules symlinks, VS Code, CLI, install, and fast-forward update-ref of main.
- `.cline/skills/{desktop-whats-new,publish-cli,publish-desktop,publish-extension,publish-ui,tuistory}/SKILL.md` plus `publish-ui/agents/openai.yaml` removed repository-specific release/TUI guidance. Do not interpret this as deletion of skill discovery itself.
- `.clinerules/{bun-and-node.md,cline-overview.md,debug-harness.md,general.md,network.md,protobuf-development.md,sdk-migration.md,storage.md,hooks/README.md}` and `workflows/{address-pr-comments.md,find-pr-reviewers.md,git-branch-analysis.md,hotfix-release.md,pr-review.md,release.md,writing-documentation.md}` removed inherited repository instructions; `.github/copilot-instructions.md` removed similarly. Hook runtime and backward-compatible `.clinerules` discovery are inherited and not removed.

Verification: file inventory/manual instruction discovery review, ensuring those removed configs/links are not recreated and existing `AGENTS.md`, `.agents` resources and dirty user workflow remain untouched. Historical author intent beyond deletion remains unverified.

## Protected Existing Dirty Work

### DW-01: Upstream acquisition helper, ignore rule and user workflow

Purpose: preserve user's separate upstream checkout tooling and workflow. **Additive dirty work with invasive package/ignore integration; do not stage, undo or execute.**

- Dirty `.gitignore`: adds `/cline_source/`.
- Dirty root `package.json`: adds `sync:cline = bun run scripts/sync-cline.ts`.
- Untracked `scripts/sync-cline.ts`: `syncCline`, `INITIAL_COMMIT` matches specified base, `CHECKPOINT = clineSync.lastCommit`. Queries remote main, creates main-only/no-tags nested checkout only when needed, validates existing .git/origin/main/clean state, fetches and verifies ancestry, fast-forwards and stores checkpoint in nested local Git config; reports first/latest/count. Accepts only full 40-character `--since` and validates CLI shape.
- Untracked `scripts/sync-cline.test.ts`: disposable local repository fixtures check clone/main filtering/checkpoint updates/no-change no checkout/dirty and noncheckout refusal/diverged history. Tests themselves mutate only their fixtures when run, but are NOT run here.
- `.workflows/sync.md`: full user's preservation-first six-phase workflow, registry before upstream analysis, identity/dependency/no-overwrite/read-only reference rules and documented gates. Workflow docs are not application source.
- Existing `.sync/{BASELINE.md,DECISIONS.md,PROGRESS.md}` are concurrent sync coordination records, not pre-fork behavior or noise to delete. This registry is the only file authored by this Phase 1 task.

Verification: future `bun test scripts/sync-cline.test.ts` using disposable fixtures only; manual inspect root script/ignore/workflow and original dirty diff. **Never invoke `bun run sync:cline` during this sync**, because the helper's intended action mutates `cline_source` and conflicts with this task's read-only-reference constraint.

### DW-02: Standalone browser thinking-orbs project

Purpose: preserve user's independent component project and attribution, not treat it as upstream application source. **Additive untracked nested repository; entire directory protected.**

- `thinking-orbs/` has its own `.git`, package `@schoolees/thinking-orbs`, ESM exports for controller and optional registration, no runtime dependencies and MIT provenance. Not part of root workspace dependency changes; its package-lock and npm-oriented script strings are independent project data, not permission to use npm or rewrite its toolchain.
- Actual symbols: `ThinkingOrb`, `createThinkingOrb`, `ThinkingOrbElement`, `defineThinkingOrb`, `resolvePreset`, `STATE_TO_MODE`, `MODE_DRAWS` / `CONTOUR_MODE_DRAWS`, theme helpers. Nine states, classic/contour variants, tuned 32/64/96/128 sizes, optional pointer distortion/spring recovery (works paused), auto ancestor/CoreUI/media themes, reduced-motion disabling, DPR cap 2, offscreen/hidden-tab pause, observers/events/owned-canvas cleanup.
- Files/areas: `src/{thinking-orb.ts,thinking-orb-element.ts,presets.ts,theme.ts,types.ts,index.ts,register.ts}`, `src/engine/**`, `tests/{setup.ts,thinking-orb.test.ts}`, `demo/**`, build configs/package metadata, `LICENSE`, `NOTICE.md`, README/design QA, existing dist and nested Git/GitHub state.
- Test symbols also cover woven working geometry, contour correspondence, searching contour anchor, listening contours, connecting grids, composing/responding motion and cycle seam. Terminal BE-13 adapts geometry only; do not equate the browser lifecycle/variants with terminal implementation.

Verification (future, run individual scripts with Bun, not npm-oriented aggregate): `bun run --cwd thinking-orbs typecheck`, `bun run --cwd thinking-orbs test`, `bun run --cwd thinking-orbs build`, `bun run --cwd thinking-orbs build:demo`; manually review demo all states/variants/sizes, pause/pointer, theme, reduced motion, visibility and custom-element reconnect. No nested repository history, generated assets or files are to be changed by the sync.

### DW-03: Desktop Glyph type-foundry route

Purpose: preserve user's unrelated interactive `/glyph` page, not mistake it for a completed desktop-agent rebrand. **Additive untracked route; all three files protected.**

- `apps/examples/desktop-app/webview/app/glyph/layout.tsx`: `metadata`, `GlyphLayout` title/description and pass-through children.
- `page.tsx`: `GlyphPage`, `GlyphMark`, `Wordmark`, `DotField`; independent type-foundry presentation, mobile menu closing on anchor navigation, three typeface cards selecting playground, editable text/style/size, reset, escaped SVG specimen download via blob URL and revocation, success indicator. Reset retains current typeface and restores text/size/style.
- `page.module.css`: fixed high-z-index scrollable dark full-page overlay, custom geometry/typography/focus treatment, 900/600px responsive layout and mobile menu, 1450px large layout, reduced-motion transitions/smooth-scroll suppression.

Verification: future existing desktop web dev command `bun run --cwd apps/examples/desktop-app dev:web`, inspect `/glyph` on desktop and mobile widths, keyboard focus/menu anchors/cards/size/style/reset/SVG XML escaping and download, reduced-motion rendering. Do not start desktop/hub or execute builds for this registry. No inference/session integration is claimed by this standalone route.

## Noise And Non-Differences

- Import ordering/wrapping and comments within otherwise meaningful files (for example MCP imports, type import formatting and test descriptions) are incidental; preserve semantic changes, no need to replay formatting verbatim.
- Wrapper fixture `.cjs`, Windows fixture execution and temp cleanup are supporting test portability, not user-facing features; retain with BE-09 regression coverage.
- CLI e2e expected help syntax changes (`--auto-approve <boolean>`, `--thinking <level>`, visible effort alias) are test/help alignment; not a new auto-approval policy.
- `bun.lock`'s one-line `glyph` workspace bin update is ID-01 supporting metadata, **not** a dependency bump. No fork-range dependency additions/upgrades are present in changed manifests.
- SDK docs are behavior evidence/documentation, not a separate implementation. Inherited `provider-settings.ts`, shared reasoning schemas/normalizers, root keyboard/palette shortcut machinery, runtime fingerprint helper and restart-with-current-transcript machinery are read dependencies, not counted changed files.
- Deleted upstream automation/instructions and deleted generated face JSON are explicitly registered in RP-01/RP-02/BE-12, **not** blanket noise. Untracked independent browser assets/nested repository are protected wholesale, not disposable generated clutter.
- No committed VS Code or desktop app application-source fork changes occur in this exact range. Desktop `/glyph` is dirty work only. Do not infer extension publisher/ID/icon changes from the CLI rebrand; existing inherited extension identity is outside this registry's actual fork modifications.

## Coverage And Gate

Coverage maps every original-range changed path to the feature groups above; tests follow their feature's source entry, even when one file covers multiple features.

| Changed Path Family | Coverage |
| --- | --- |
| `.claude/**`, `.cline/skills/**`, `.clinerules/**`, `.codex/environments/environment.toml`, `.github/copilot-instructions.md` | RP-02 enumerates every removed file/link family |
| Remaining changed `.github/**`, `.greptile/**` | RP-01 enumerates release/test/service/coverage/removal paths |
| Root `README.md`, CLI README/distribution docs | ID-03 plus behavior references |
| `apps/cli/bin/cline`, CLI package, `bun.lock` | ID-01, BE-09/10/11 integration |
| `apps/cli/bun.mts`, `script/build.ts`, `script/publish-npm.ts` | ID-01 and BE-09 |
| Added installer builder/test/environment/template, `build-cli.ps1` | BE-10 |
| Added `script/tui-smoke.tsx` | BE-09, BE-11/12/13 |
| ACP source/test, main source/test, CLI e2e, logging test, commands source/tests | ID-01/02, BE-01/03/06/09 and explicit noise notes |
| Connector adapters, session source/tests, connect/schedule wizards | ID-01 |
| Runtime format/exit/mistakes/zen/prompt source/tests | ID-01/02 |
| Runtime interactive compaction and run-interactive source/tests | BE-04 and ID-01 |
| TUI cline-account, themes, terminal-title/config helpers/tests, home | ID-01 |
| Slash registry/local command actions/palette/help/root source/tests | BE-03/04 plus ID-01 |
| Provider picker/config values and onboarding controller/fields/keyboard/model/screens/view/tests | BE-01/03/04/11 plus ID-01 |
| Model selector and use-model-selector, new use-reasoning-selector | BE-03 |
| Chat entry/list, loading/model/queue spinners, inline tool response | BE-11/13 plus ID-01 |
| Robot animation/frames/tests/deleted JSON | BE-12 |
| New thinking orb frame/component/tests | BE-13 |
| CLI utils chat/common/history and tests | ID-01 |
| CLI utils helpers/reasoning/options/types and tests | BE-03/04 |
| `sdk/ARCHITECTURE.md`, `sdk/DOC.md` | BE-01/06/08/09 supporting docs |
| Core hub daemon/discovery/capability/context/test files | BE-06/08 |
| Core index, LLM handler/provider-default/cache/metadata/tests | BE-01/06 |
| Core provider fields/local registry/service tests; shared RPC | BE-01/03 |
| LLM catalog/index/compat/model and gateway registries | BE-01/06 |
| LLM HTTP/OpenAI/compatible vendor factories | BE-02 |
| LLM portable/provider-option routing/types/tests, Bedrock wire and native/compatible request tests | BE-01/05 |
| LLM AI SDK usage source/tests; shared model-info source/tests | BE-07 |
| Dirty `.gitignore`, root package, `scripts/**`, `.workflows/**`, `.sync` coordination docs | DW-01 |
| Dirty `thinking-orbs/**`, including nested repository/generated/demo data | DW-02, wholesale protection |
| Dirty desktop `webview/app/glyph/{layout.tsx,page.tsx,page.module.css}` | DW-03 |

**Phase 1 completeness:** all 233 committed changed files are accounted for by grouped entries, supporting tests/docs, policy removals or explicit incidental-noise notes. All meaningful observed dirty-work areas are separately registered. This is a static preservation inventory, not a claim that tests pass, every browser engine was audited, or historical removal motives were confirmed.

**Protected areas:** Glyph display/prompt/command identity AND retained Cline compatibility; provider API persistence/transport; reasoning metadata/UI/reset/compaction/wire controls; LiteLLM cache/facts/price precedence/tiers; hub deadlines/cancel identity/build fingerprints; Windows payload/PATH/user-file safety; compiled spinners/circular face/orb/license; removed upstream repository automation; every pre-existing dirty area above. Only `.sync/REGISTRY.md` may be changed by this task. `cline_source` remains read-only and unexamined for Phase 1.
