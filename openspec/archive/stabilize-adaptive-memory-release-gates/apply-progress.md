# Apply Progress: Stabilize Adaptive Memory Release Gates

## Status

Implementation and the Review-required mounted TUI bounded-wait repair are complete with the same `deck-apply-deep` owner.

## Initial evidence

- HEAD/upstream and multi-owner worktree inventory recorded before modification.
- Candidate implementation paths were clean.
- Existing completed observability and capture-policy evidence will be reused rather than rerun.
- `.atl/skill-registry.md` refresh attempted through the canonical command but rejected before writes due incomplete source evaluation; no setup path changed.
- Archive requires candidate-bound Verify, independent Review, mandatory BROAD, and no blocker.
- The release workflow validates archived `canonical-supermemory-conversation-memory`; validator single-change mode searches active then archive paths.

## TDD evidence

### Group 1 — Adaptive Memory bundle parity

- RED: `bun test packages/core/src/teams/developer/instruction-bundles/bundle-parity.test.ts` exited `1`: 8 passed, 3 failed, 22 expectations. Agent, session, and skill expected `-1572652701` and rendered `-1094390567`.
- Cause: commit `5e8d48f` intentionally added managed-project recall guidance to the shared Adaptive Memory fragment, but the inline byte snapshot was not refreshed.
- Repair: update only the three source-owned inline hashes to `-1094390567` with a history-backed justification. Production and generated content were unchanged.
- GREEN: the same command exited `0`: 11 passed, 0 failed, 22 expectations.

### Group 2 — Core provider neutrality

- RED: `bun test packages/core/src/__tests__/core-purity-audit.test.ts` exited `1`: the concrete `x-supermemory-api-key` protocol literal remained in Core.
- Added behavior RED: `bun test packages/core/src/memory/managed-project-memory-recall.test.ts` exited `1` because a generic JSON credential header, `x-deck-api-key`, was accepted.
- Cause: high-confidence secret screening encoded one concrete provider header rather than a provider-neutral credential-header category.
- Repair: replace the concrete literal with a generic JSON credential-header pattern covering authorization, API-key, token, secret, and credential header forms; add rejection and safe non-secret mention cases.
- GREEN: managed recall tests exited `0` with 3 passed, 0 failed, 28 expectations; core purity exited `0` with 1 passed, 0 failed.

### Group 3 — Codex RunnerAdapter probe timeout

- Baseline: `bun test packages/adapter-codex/src/runner-adapter.test.ts` exited `0` with 32 passed, 0 failed, 268 expectations, but required 69.19 seconds. The prior nonzero timeout did not reproduce on this host.
- Cause: the bounded probe contract test spawned a real delayed shell and a CPU-bound hung shell even though production already exposes an injected process runner. Runtime/cleanup behavior therefore remained host-dependent.
- Repair: drive success and `ETIMEDOUT`/signal outcomes through the existing injected runner while asserting fixed argv, floored timeout, and output bound. Production semantics were unchanged.
- GREEN: the same focused file exited `0` with 32 passed, 0 failed, 268 expectations. An intermediate missing shared `chmod` import was caught and restored before final GREEN.

### Group 4 — Mounted TUI Codex discovery

- Baseline: `bun test apps/cli/src/tui/app.codex-discovery.test.tsx` exited `0` with 3 passed, 0 failed, 18 expectations in 4.38 seconds. The prior nonzero deadline failure did not reproduce on this host.
- Cause: the helper checked its deadline only before awaiting Ink render flush, allowing a stalled flush to outlive the deadline; request progress was also inferred by polling shared counters.
- Repair: bound each render flush with diagnostics, synchronize bundled and retry discovery on causal deferred signals, bound Ink cleanup, and add a mutation-proof hung-render test.
- Mutation proof: the new helper test supplies a render flush that never resolves and proves bounded diagnostic failure.
- GREEN: the focused file exited `0` with 4 passed, 0 failed, 19 expectations.

### Implementation inventory

Only these implementation/test paths changed:

- `packages/core/src/teams/developer/instruction-bundles/bundle-parity.test.ts`
- `packages/core/src/memory/managed-project-memory-recall.ts`
- `packages/core/src/memory/managed-project-memory-recall.test.ts`
- `packages/adapter-codex/src/runner-adapter.test.ts`
- `apps/cli/src/tui/app.codex-discovery.test.tsx`

`git diff --check` passed. No production Codex source, generated asset, historical OpenSpec artifact, existing WIP, staging, commit, or publication state was changed.

## Review-required repair

Initial independent Review found eight mounted TUI navigation points that still awaited Ink render flush directly. `deck-apply-deep` added a labeled `waitForRenderFlush` boundary using the existing timeout, routed every mounted flush through it, and retained the hung-render mutation proof. Focused re-verification passed 4 tests with 19 expectations; no production path changed.

## GEN-001 continuation — 2026-09-07

The user authorized canonical ownership of the two generated bundles and necessary toolchain stabilization. `deck-apply-deep` remained the implementation owner. It reproduced both Bun versions twice, adopted workflow-authoritative 1.3.12 bytes without manual editing, identified the full dependency closure, and added a TDD-tested generator guard against future PATH/version drift. See [gen-001-provenance.md](gen-001-provenance.md) and its persisted manifests/full diffs. No runtime TypeScript or unrelated WIP changed in this continuation. The new nine-path subject requires fresh independent Review; the original five-path GO does not cover it.
