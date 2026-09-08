# Apply Progress: Clean-Checkout Release Verification

## Candidate

Base: `855ee0f3712310d4de0a3d28a84e4c0460e80cf0`.
Seven implementation/test/metadata files changed; original worktree and release history untouched.

| File | Change |
|---|---|
| `apps/cli/src/runtime/__tests__/build-info.test.ts` | Isolated generated-present/absent module fixtures and real cache assertions; no checkout-generated dependency. |
| `scripts/prepare-release.test.ts` | Explicit matching/stale/absent metadata, help/hash bypass with truly stale fixtures, and actual CLI subprocess checks of the unchanged checkout-relative default path. |
| `scripts/prepare-release.ts` | Optional programmatic metadata-path argument forwarded to the existing validator; no new CLI flag or change to validation/default behavior. |
| `packages/core/package.json` | Development-only workspace declarations for Codex, OpenCode and Pi adapters used by Core tests. |
| `packages/adapter-pi/package.json` | Development-only Supermemory workspace declaration used by Pi tests. |
| `bun.lock` | Canonical pinned-Bun update for exactly those four declarations; no external version updates. |
| `tests/workspace-test-dependencies.test.ts` | Four explicit-declaration regressions that also prevent promotion to production dependencies. |

## RED and recovery evidence

Raw evidence is retained under `/tmp/opencode/deck-release-clean-checkout-evidence/`.

- `logs/install-red.log`: pinned Bun 1.3.12 frozen installation in the initially clean implementation worktree.
- `logs/red-focused.log`: the same missing generated metadata and unresolved-workspace failures as the remote run; 30 pass / 11 fail / three errors.
- `logs/manifest-guard-red.log` and its process receipt: the new declaration guard fails on all four original undeclared dependencies in a second worktree before candidate overlay.
- `logs/install-lockfile-update.log`: canonical lockfile update, confined to the four workspace test declarations.
- The first implementation owner was interrupted by provider quota after producing a candidate and preliminary logs. Lead recovered the on-disk work, inspected its exact diff, strengthened the real CLI/bypass assertions, added the dependency regression, and owns the final candidate and verification.
- `logs/fresh-full-suite.log` belongs to the initial exported mirror, not the final Git checkout: two tests failed because the mirror initially lacked Git metadata. That result is retained as failed harness evidence, not relabelled as passing.

## Final verification protocol

`fresh-source-snapshot.json` binds 2,011 identical source/evidence files in the implementation and actual detached verification worktrees before installing dependencies. It explicitly records absent node_modules and absent generated build-info. The verification worktree has the real merge commit as HEAD.

The final runner records commands, isolated HOME/XDG/TMPDIR/cache, supervisor and child PIDs, terminal exit status and log SHA-256. PATH contains only pinned Bun, Node/npm/npx and system tools; it inherits no provider credentials. Dependency installation may access the registry, but test gates do not use live providers.

Final results are recorded in `verify-report.md`: clean full suite, TypeScript, benchmark, compiled smoke and canonical validation passed. The original failed mirror remains retained; only the real clean-worktree results support the final candidate.
