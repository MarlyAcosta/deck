# Repair Incident: Post-Review DeckMemoryBench Identity Contract

```yaml
schema: repair-incident-v1
incidentId: amor-deckmemorybench-custom-id
changeId: adaptive-memory-observability-receipts
status: resolved
createdFrom:
  phase: review
  artifact: review-report.md
budgets:
  incident:
    verifyCyclesSoft: 2
    verifyCyclesHard: 3
    repairAttemptsSoft: 2
    repairAttemptsHard: 3
  fingerprint:
    repairThreshold: 2
    replanThreshold: 3
    escalationThreshold: 4
failures:
  - id: AMOR-BENCH-001
    status: resolved
    sourcePhase: review
    taskGroup: benchmark-compatibility
    ownerHint: deck-apply-deep
    failingContract: "DeckMemoryBench must consume the stable public provider identity without depending on forbidden correlation metadata."
    requirementIds:
      - AMOR-002
    scenarioIds:
      - rediscovery
      - mcp-primary-vs-runtime
    errorClass: assertion
    changedFiles:
      - benchmarks/deckmemorybench.ts
      - benchmarks/deckmemorybench.test.ts
    evidence:
      command: 'bun test "benchmarks/deckmemorybench.test.ts"'
      latestResult: pass
      artifact: verify-report.md
      excerpt: "RED reproduced 0 passed and 1 failed; repaired GREEN passed 2 tests with 9 expectation calls."
    attempts:
      count: 1
      history:
        - attempt: 1
          phase: apply
          artifact: apply-progress.md
          summary: "Replaced fake correlationId identity with the public stable customId and added behavioral regression coverage."
          verificationStage: targeted
          result: passed
    generatedArtifacts: []
    nextVerificationStage: targeted
    nextAction: continue
  - id: AMOR-BENCH-R1
    status: resolved
    sourcePhase: review
    taskGroup: benchmark-compatibility
    ownerHint: deck-apply-deep
    failingContract: "Permanent benchmark coverage must fail if conflicting legacy metadata.correlationId regains precedence over payload.customId in the fake transport."
    requirementIds:
      - AMOR-002
    scenarioIds:
      - fake-custom-id-precedence
    errorClass: assertion
    changedFiles:
      - benchmarks/deckmemorybench.ts
      - benchmarks/deckmemorybench.test.ts
    evidence:
      command: 'bun test benchmarks/deckmemorybench.test.ts --test-name-pattern "stores fake runtime captures by customId when metadata correlationId conflicts"'
      latestResult: pass
      artifact: verify-report.md
      excerpt: "Correct implementation: 1 passed, 2 filtered, 0 failed, 3 expectations. Correlation-first mutation: 0 passed, 2 filtered, 1 failed, 1 expectation, exit 1. Explicitly restored implementation: 1 passed, 2 filtered, 0 failed, 3 expectations."
    attempts:
      count: 1
      history:
        - attempt: 1
          phase: apply
          artifact: apply-progress.md
          summary: "Added permanent conflicting-identity behavior coverage, demonstrated mutation RED for correlation-first precedence, and restored customId-only identity selection through an explicit inverse edit."
          verificationStage: targeted
          result: passed
    generatedArtifacts: []
    nextVerificationStage: targeted
    nextAction: continue
lifecycle:
  - event: repair.started
    phase: review
    artifact: repair-incident.md
    at: "2026-09-04T17:18:22Z"
    summary: "Started the user-authorized bounded benchmark repair with deck-apply-deep as the vertical implementation owner."
  - event: repair.resolved
    phase: apply
    artifact: repair-incident.md
    at: "2026-09-04T17:19:12Z"
    summary: "Resolved the benchmark identity mismatch after one reproducing RED and the required focused GREEN checks."
  - event: repair.started
    phase: review
    artifact: repair-incident.md
    at: "2026-09-04T18:45:17Z"
    summary: "Started the bounded Required R1 mutation-proof repair with deck-apply-deep as the sole implementation owner while preserving the latest review.failed verdict."
  - event: repair.resolved
    phase: apply
    artifact: repair-incident.md
    at: "2026-09-04T18:53:52Z"
    summary: "Resolved Required R1 after permanent conflicting-identity coverage passed correctly, failed under the old correlation-first mutation, and passed again after an explicit inverse restoration to customId-only behavior."
```

## Cause and RED

The observability change correctly removed native `correlationId` values from provider metadata. `FakeSupermemoryTransport.add` still selected `payload.metadata.correlationId` before `payload.customId`, while the benchmark scenarios expected the former value `bench-explicit-remember`. The one authorized pre-edit RED command produced 0 passed, 1 failed, and 2 expectation calls; the aggregate passing assertion received `false`.

## Repair

`deck-apply-deep` removed both benchmark capture inputs named `correlationId`, made the fake require and record `SupermemoryAddPayload.customId`, and bound the affected scenario expectations to the identity actually received by the fake. Permanent behavioral coverage requires the runtime result ID to match `deck_conversation_[a-f0-9]{16}`, rejects the former native ID, and proves the MCP-primary baseline did not capture the runtime identity.

The identity is contractual because `buildSupermemoryConversationIngest` derives `customId` from canonical scope plus stable session identity, `runtime.capture` supplies that request to `transport.add`, and existing production contract tests prove both its public shape and same-scope/session stability. Existing observability tests separately prove that provider metadata and serialized provider payloads omit native correlation identifiers.

## Required R1 mutation-proof follow-up

The preserved `review.failed` finding R1 identified a coverage gap rather than an implementation defect: the correct fake used `payload.customId`, but no test supplied a simultaneous valid legacy `metadata.correlationId`. `deck-apply-deep`, as the sole implementation owner, added a narrow benchmark-module exercise around the existing unexported fake and a permanent behavioral test. The benchmark module is not part of a package export surface; the seam preserves `runDeckMemoryBench` and all 13 established scenarios.

The exercise gives the same fake `customId: stable-custom-id` and `metadata.correlationId: conflicting-correlation-id`, searches by a document marker and by the conflicting value, and exposes only the observed captured/search IDs. The test requires captured and document-query IDs to equal `stable-custom-id`, requires the conflicting-value query to return no result, and explicitly excludes `conflicting-correlation-id` from captured and retrieved IDs.

- Correct implementation before mutation: 1 passed, 2 filtered out, 0 failed, 3 expectations, exit 0.
- Controlled old-precedence mutation `payload.metadata?.correlationId || payload.customId`: 0 passed, 2 filtered out, 1 failed, 1 expectation, exit 1. The equality failure received `conflicting-correlation-id` for both captured and document-query IDs instead of `stable-custom-id`.
- Explicit inverse restoration, without Git discard commands: 1 passed, 2 filtered out, 0 failed, 3 expectations, exit 0.

Final inspection confirms `FakeSupermemoryTransport.add` validates, captures, and stores exclusively with `payload.customId`; `metadata.correlationId` remains only in the deliberate conflict payload for the regression exercise.

Focused post-restoration verification passed: the complete benchmark test file reported 3 passed, 0 failed, and 12 expectations; DeckMemoryBench retained all 13 scenarios with 13 passed, precision 1, recall 1, and 0.352 ms p95 local overhead against the 20 ms gate; TypeScript emitted no diagnostics; rooted OpenSpec validation reported 1 valid active change with 0 errors and 0 warnings; direct `repair-incident-v1` validation reported 0 errors and 0 warnings.

## GREEN and lifecycle effect

- `bun test "benchmarks/deckmemorybench.test.ts"`: 2 passed, 0 failed, 9 expectation calls.
- `bun run bench:memory`: 13 of 13 scenarios passed; aggregate precision 1, recall 1; local p95 overhead 0.203 ms against the 20 ms gate.
- `bunx tsc --noEmit`: passed with no diagnostics.
- Rooted focused OpenSpec validation passed with 1 valid active change, 0 errors, and 0 warnings. Direct `repair-incident-v1` parser validation also passed with 0 errors and 0 warnings.

The Review completed on 2026-09-02 remains immutable historical evidence, but its GO does not cover the repaired candidate. This incident does not record or imply a new Review verdict. Fresh independent re-review is required after re-verification.

## Scope and safety

Only the two authorized benchmark files and the authorized repair lifecycle artifacts were changed. No Adaptive Memory production source, Capture Policy, generated asset, bundle parity, baseline health, quarantined artifact, provider, canary, live test, full suite, Git staging, commit, archive, push, tag, release, or publication action was used.
