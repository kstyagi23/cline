# Sync Decisions

| Decision | Reason |
| --- | --- |
| Use `9fe17595d` as upstream base, not README's `de0f74caf` | The latter is a fork-only Responses API commit; its parent exists in both histories and is an ancestor of the reference target. |
| Preserve all pre-existing dirty work without staging it | These changes belong to the user and are part of the baseline, not this sync. |
| Do not execute `sync:cline` | It fetches and merges inside the read-only reference checkout. |
| Use frozen installation for initial baseline | Avoid introducing dependency changes before assessing upstream needs. |
| Disable Node experimental webstorage explicitly for desktop verification | Node 26 otherwise shadows jsdom localStorage, causing 288 unrelated failures; the option restores meaningful UI verification without source changes. |
| Provision x64 protoc from the existing grpc-tools dependency | Windows ARM archive is absent; this is local tooling setup, not a dependency addition or upgrade. ts-proto remains blocked by its missing ARM native formatter. |
