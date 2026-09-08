# Verification: Clean-Checkout Release Repair

## Subject and environment

Base: `855ee0f3712310d4de0a3d28a84e4c0460e80cf0`.
Final verification root: `/tmp/opencode/deck-release-clean-verify`, a real detached Git worktree.
Evidence root: `/tmp/opencode/deck-release-clean-checkout-evidence/`.
Bun: **1.3.12**, revision `700fc117`, matching the Release workflow.

The source snapshot was taken before installing dependencies: node_modules and the ignored generated build-info were absent. All 2,011 snapshot entries matched the implementation candidate at that point. `bun install --frozen-lockfile` completed successfully with a private cache and without changing the lockfile. Every test command uses isolated HOME/XDG/TMPDIR and an allowlisted PATH, with no inherited provider credentials or personal developer tools.

## Evidence table

| Execution | Result | Evidence under the evidence root |
|---|---|---|
| Initial frozen clean install | PASS, Bun 1.3.12 | `logs/install-red.log` |
| Original six affected files | RED: 30 pass / 11 fail / three errors | `logs/red-focused.log` |
| Declaration guard against original manifests | RED: 0 pass / 4 fail, exit 1 | `manifest-guard-red.result.json`, corresponding log |
| Final focused candidate, eight files | GREEN: 219 pass / 0 fail / 914 expectations, exit 0 | `lead-focused.result.json`, corresponding log |
| Implementation-worktree TypeScript | GREEN: exit 0, no diagnostics | `lead-typescript.result.json`, corresponding log |
| New actual-checkout frozen install | GREEN: exit 0 | `clean-frozen-install.result.json`, corresponding log |
| Final actual-checkout full suite, `bun test --timeout 30000` | **GREEN: 4,836 pass / one existing skip / 0 fail; 20,720 expectations; 4,837 tests across 310 files; exit 0** | `clean-full-suite.result.json`, corresponding log |
| Fresh-worktree TypeScript, pinned Bun executing local TypeScript `--noEmit` | GREEN: exit 0, no diagnostics | `clean-typescript.result.json`, corresponding log |
| Fresh-worktree `bun run bench:memory` | GREEN: 13/13, zero failures, exit 0 | `clean-memory-benchmark.result.json`, corresponding log |
| Fresh-worktree `bun run verify:supermemory-compiled` | GREEN: native compiled runtime/CLI/archive checks and three non-native compile-only targets, exit 0 | `clean-compiled-smoke.result.json`, corresponding log |
| Fresh-worktree canonical Supermemory OpenSpec validation | GREEN: one archived change, zero errors/warnings, exit 0 | `clean-canonical-validation.result.json`, corresponding log |

The final full suite ran from `2026-09-08T02:18:22Z` to `2026-09-08T02:21:09Z`, child PID 1011442, with a runner-reported duration of 166.41 seconds. It was not restarted after a tool timeout. Its source tree and lockfile still match the pre-install snapshot, and generated build-info remains absent after all subsequent checks. Build-info fixtures existed only in per-test temporary directories, not in the checkout.

## Binding

- `fresh-source-snapshot.json`: `3989d29439a9bb2bbd1e4f30059f5af81fb71154ed0a0a67fcb1f10c1bb9d5f8`
- `logs/clean-frozen-install.log`: `62c6b9b85510ea8166f5a56cff1c14c1ec091a552a5690b260b525dbc6caa798`
- `logs/clean-full-suite.log`: `d5356031da94a0fa5da2fe662a227a92eca132a62a83280b1285c9156b419ebf`
- `logs/clean-typescript.log`: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`
- `logs/clean-memory-benchmark.log`: `aeb8bd25d05f20af54e831768d778880afa52d0c72829a821dcffcabbfd22cda`
- `logs/clean-compiled-smoke.log`: `34a0637880d2b97c08c7b808fd9995c6474b5b72c8f68bc4b3678d0182abe54b`
- `logs/clean-canonical-validation.log`: `66bdce2a4211762bfa4e441f3ab26389f071dfbb3cfafabe83a499d573028f10`

Later edits to the working brief and verification/review reports are reporting-only and are not part of the tested code delta. All seven implementation/test/metadata files remain bound to the snapshot.

## Preserved failed attempts and limits

- The remote main run `34164817079` remains failed historical evidence; it is not relabelled as passing.
- The preliminary agent-owned full suite predates Lead's additional assertions and is not used as the final candidate proof.
- The initial exported mirror failed two repository-containment tests because it was not yet a Git repository. `logs/fresh-full-suite.log` retains that failure. The final result above comes from a different, real Git worktree with a valid HEAD and fresh frozen installation.
- The one omitted canary test is pre-existing; no skip or relaxed assertion was added.
- No release version, production loader defaults, CLI flags, tracked generated assets, prior archives, original WIP, or stable tags were changed.

## Verification disposition

**All selected verification conditions passed on the unchanged candidate.** The fresh TypeScript, benchmark, compiled smoke and canonical validation receipts close the independent review's verification condition. Compiled smoke executes only the native target; the other three targets are compile-only. Its provider fixture is local HTTP, not a live provider or TLS integration test. A separate `bun run build` and remote workflow rerun were not performed for this bounded follow-up.

The remote workflow failure remains historical fact until a later authorized merge executes a new main run. This verification prepares the follow-up PR; it does not authorize merge, tagging, or publication.
