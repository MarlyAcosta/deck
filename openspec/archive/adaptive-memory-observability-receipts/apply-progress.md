# Apply Progress: Adaptive Memory Observability Receipts

## Status

Functional candidate repaired and re-verified after a bounded benchmark compatibility regression. The 2026-09-02 independent Review GO remains historical but is invalidated for the repaired candidate; fresh independent re-review is required. The change remains unarchived, and no live canary action has occurred.

## Baseline

- Investigation found a trustworthy Linux process-image source at `/proc/self/exe`.
- The prior change and Capture Policy WIP remain outside this candidate.
- The codebase-memory graph is ready but its generation predates the current working brief; excluded tests/assets were read directly.
- The skill registry is absent; bounded direct discovery was used without modifying registry files.

## Implemented

- Added provider-neutral exact UTF-8/SHA-256 receipts and project/domain-separated session and logical-turn fingerprints.
- Added capture source and exact normalized-and-redacted input receipts to attempted, skipped, succeeded, and failed capture metrics without changing Capture Policy.
- Removed provider persistence of native/provider correlation identifiers while keeping correlation ephemeral and metric-fingerprint-only.
- Added validated OpenCode turn/generation correlation, exact terminal recall receipts, bounded expected-injection state, per-push injection acknowledgments, stale-generation protection, and shutdown-race protection.
- Added host-derived correlation for direct non-loopback automatic captures.
- Added byte-backed process-image receipts, digest-backed canary classification, once-per-process caching, and lower-trust non-Linux labeling.
- Added explicit JSONL allowlisting and categorical fail-open diagnostics that do not include paths, rejected values, raw errors, or secrets.
- Kept OpenCode messages transform as a no-op and preserved compaction, replay, project isolation, and actual-push-before-ack semantics.

## TDD evidence

- Reconstructed pre-production baseline in a detached HEAD worktree with candidate tests only: 86 passed, 16 failed, 102 tests, exit 1. Failures covered missing host recall/injection receipts, sink fields, executable module, OpenCode acknowledgment/generation behavior, and capture receipts; the new core subpath was absent.
- Quality-repair RED: 37 passed, 11 failed, 48 tests, exit 1. Failures covered provider correlation persistence, OpenCode boundary validation, direct capture correlation, repeated acknowledgments, late generations, shutdown races, diagnostic leakage, and executable caching.
- Final diagnostic RED: 0 passed, 1 failed, 4 expectations, exit 1; raw observability diagnostics exposed sentinel values before categorical handling was added.

## Verification

- Final focused receipt suite: 114 passed, 0 failed, 649 expectations across 6 files.
- Affected regressions: 88 passed, 0 failed, 471 expectations across 5 files.
- `bunx tsc --noEmit` passed after the final source repair.
- `bun run verify:supermemory-compiled` passed for the host target plus all compile-only release targets.
- OpenCode source SHA-256: `31e81e932d71397b7c4177d9650c2640a31478607508b9450f087ebc9f242c59`.
- Generated and temporary-installed OpenCode asset SHA-256: `ab7a2f439494fe7c5a4c36de1f4ceb6a712d1c29f7b90ef03a6af7286aef20f1`; bytes are identical and the generated source marker matches the source digest.
- Canonical generation under local Bun 1.4.0 produced unrelated Pi minifier churn while repository CI pins Bun 1.3.12. After explicit user confirmation, only that Pi generated-file churn was restored; Pi and Codex generated assets are clean against HEAD.
- `git diff --check` and rooted OpenSpec validation passed.
- Independent Quality reviewed each repair delta read-only and returned final GO for AMOR-001 through AMOR-007.

## Residual trust limits

- Receipts prove byte equality, not confidentiality, authenticity, or publisher provenance.
- Deterministic hashes of low-entropy candidate content or IDs remain guessable.
- A same-user process holding the ephemeral loopback bearer can forge events within the existing local trust boundary.
- Non-Linux executable evidence remains path-based and lower trust.
- The codebase-memory index predates the candidate and excludes tests/assets; final conclusions use direct source and test evidence.

## Safety

No live provider call, canary rebuild/install/live rerun, commit, push, release, publication, or archive has occurred.

## Post-Review benchmark repair — 2026-09-04

### RED and cause

- Pre-repair authorized-scope candidate digest: `sha256:c77bcebdc75fe559266f2ee61306702f5cdfeb456bc54e09e8ec62bd580c77b1` at HEAD `dd596899b649ad9a0cda00b1d85749f8a281bab5`.
- The single authorized pre-edit run of `bun test "benchmarks/deckmemorybench.test.ts"` reproduced 0 passed, 1 failed, and 2 expectation calls. The aggregate passing assertion expected `true` and received `false`.
- The production change correctly removed provider-persisted `correlationId`, but the benchmark fake still preferred that metadata field and the affected scenarios still expected `bench-explicit-remember`.

### Bounded implementation

- `deck-apply-deep` remained the sole vertical implementation owner.
- The fake now requires and records `SupermemoryAddPayload.customId`; both benchmark capture inputs named `correlationId` were removed.
- Scenario expectations consume the stable identity observed at the fake provider boundary. The explicit-memory content was aligned with its existing `runtime capture` query so the fixture keeps full relevance without lowering any gate, score, or expectation.
- Permanent behavioral coverage requires the public `deck_conversation_[a-f0-9]{16}` identity, excludes `bench-explicit-remember`, and proves the MCP-primary baseline did not capture the runtime identity.

### Immediate GREEN

- `bun test "benchmarks/deckmemorybench.test.ts"`: 2 passed, 0 failed, 9 expectation calls.
- `bun run bench:memory`: 13 of 13 scenarios passed; aggregate precision 1 and recall 1; p95 local runtime overhead 0.203 ms against the 20 ms gate.
- `bunx tsc --noEmit`: passed with no diagnostics.
- Rooted focused OpenSpec validation: 1 valid active change, 0 errors, and 0 warnings. Direct `repair-incident-v1` parser validation also passed with 0 errors and 0 warnings.

### Review invalidation

The prior `review.completed` event and `review-report.md` are preserved unchanged as historical evidence. Their GO predates this repair and does not apply to the repaired candidate. No new Review GO is recorded; fresh independent re-review is the next required phase after focused re-verification.

## Required R1 permanent mutation coverage repair — 2026-09-04

### Baseline and scope

- Baseline HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`.
- Reviewed pre-repair seven-path subject digest: `sha256:3c1142abe6f14aeeb3e6ae3ad0e33141c8a9aa90ae9eede447e946ee0f9f96f8`.
- `deck-apply-deep` remained the sole implementation owner. The implementation delta is limited to `benchmarks/deckmemorybench.ts` and `benchmarks/deckmemorybench.test.ts`; lifecycle writes are limited to the five authorized OpenSpec artifacts.

### Permanent coverage design

- Added a narrow benchmark-module exercise around the existing unexported `FakeSupermemoryTransport`; the benchmark file is not a package export surface, and `runDeckMemoryBench` plus all 13 established scenarios remain unchanged.
- The same fake receives `customId: stable-custom-id` and `metadata.correlationId: conflicting-correlation-id` in one add payload.
- The permanent test observes captured IDs, a document-marker search, and a conflicting-correlation search. It requires storage/retrieval under `stable-custom-id`, requires no association with `conflicting-correlation-id`, and rejects substitution by the legacy metadata field.

### Controlled mutation proof

- Correct implementation before mutation: targeted test passed with 1 passed, 2 filtered out, 0 failed, 3 expectations, exit 0.
- Temporary old precedence `payload.metadata?.correlationId || payload.customId`: targeted test failed with 0 passed, 2 filtered out, 1 failed, 1 expectation, exit 1. Captured and document-query IDs were `conflicting-correlation-id` instead of `stable-custom-id`.
- `deck-apply-deep` restored the correct source through an explicit inverse edit, without Git discard commands. The targeted test then passed again with 1 passed, 2 filtered out, 0 failed, 3 expectations, exit 0.
- Final source inspection confirms fake capture and storage identity use only `payload.customId`; the conflicting field exists only in the regression exercise payload.

### Lifecycle

Required R1 is repaired and targeted GREEN is restored. Final focused verification passed with 3 benchmark tests, all 13 unchanged benchmark scenarios, TypeScript, rooted OpenSpec validation, and direct repair-incident validation. The latest `review.failed` event and NO-GO remain preserved; no new Review verdict is recorded. The change is in `verify/completed`, ready for another independent re-review.
