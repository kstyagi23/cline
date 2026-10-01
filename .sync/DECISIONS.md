# Sync Decisions

| Decision | Reason |
| --- | --- |
| Use `9fe17595d` as upstream base, not README's `de0f74caf` | The latter is a fork-only Responses API commit; its parent exists in both histories and is an ancestor of the reference target. |
| Preserve all pre-existing dirty work without staging it | These changes belong to the user and are part of the baseline, not this sync. |
| Do not execute `sync:cline` | It fetches and merges inside the read-only reference checkout. |
| Use frozen installation for initial baseline | Avoid introducing dependency changes before assessing upstream needs. |
| Disable Node experimental webstorage explicitly for desktop verification | Node 26 otherwise shadows jsdom localStorage, causing 288 unrelated failures; the option restores meaningful UI verification without source changes. |
| Provision x64 protoc from the existing grpc-tools dependency | Windows ARM archive is absent; this is local tooling setup, not a dependency addition or upgrade. ts-proto remains blocked by its missing ARM native formatter. |
| Defer U3 tool approval ordering and U4 extension commit request changes | Required extension generation/typecheck/build cannot verify these units; avoid source changes masked by missing generated imports. A compatible native Node/formatter environment and host identity review are needed. |
| Split ce74ef091 into SDK foundation U2 and extension consumer U4 | Optional session headers and wire tests are independently useful and verifiable; they introduce no new runtime branding literals and preserve existing authenticated provider compatibility. |
| Treat desktop fixes as A despite dirty /glyph route | The user route is a separate additive page; neither upstream fix modifies it. Preserve it and confirm build route output. |
| Verify component builds after clean-install failure | Full removal exposes trusted grpc-tools install script requesting missing win32-arm64 archive; frozen install --ignore-scripts restores dependencies, SDK/CLI/desktop builds pass. Do not change package scripts or dependency versions for unrelated platform setup. |
| Leave newly observed landing-page/ and empty desktop glyph directory untouched | Concurrent user activity changed untracked files after baseline; not a sync edit. Later desktop build omits /glyph, while sync never edited that directory. |
| Keep external mixed commit a7a09f9c8 intact | Concurrent activity committed U5 plus user files before sync could create its own batch commit; rewriting user history is not authorized. Record the review/revert boundary exception explicitly. |
| Retry desktop suite serially after an extra remote routing timeout | The unchanged test timed out under simultaneous full typechecks, then passed on full-suite retry; the resulting failure set exactly matches the 16 baseline failures. |
