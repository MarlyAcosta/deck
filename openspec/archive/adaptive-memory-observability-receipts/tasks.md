# Tasks: Adaptive Memory Observability Receipts

## 1. Preconditions

- [x] 1.1 Review OpenSpec, source, tests, graph coverage, current WIP, and generated/install boundaries.
- [x] 1.2 Confirm a byte-backed running canary receipt is feasible without model/environment claims.
- [x] 1.3 Create a separate canonical change and preserve unrelated WIP.

## 2. TDD RED

- [x] 2.1 Add core tests for exact UTF-8 receipts and project/domain-separated fingerprints.
- [x] 2.2 Add isolated adapter tests for attempted/skipped/succeeded/failed capture receipts and privacy.
- [x] 2.3 Add host/sink tests for correlation, recall/injection matching, executable evidence, concurrency, and allowlisting.
- [x] 2.4 Add OpenCode tests for generation propagation, assistant-to-active-turn correlation, per-push acknowledgment, pending messages-transform no-op, compaction, and privacy.
- [x] 2.5 Run one combined focused command and record behavior-based failures before production edits.

## 3. Focused GREEN

- [x] 3.1 Implement and export core receipt helpers.
- [x] 3.2 Extend adapter-supermemory metrics and per-call correlation without changing Capture Policy.
- [x] 3.3 Extend runtime host correlation, bounded expected receipts, injection validation, executable enrichment, and sink serialization.
- [x] 3.4 Extend authoritative OpenCode source while retaining fail-open and existing recall/capture/compaction semantics.
- [x] 3.5 Run the canonical generator; prove deterministic source/generated/temporary-installed parity and unchanged Pi/Codex generated assets.

## 4. Verification

- [x] 4.1 Run focused and affected-area tests.
- [x] 4.2 Run `bunx tsc --noEmit`, compiled-runtime verification, `git diff --check`, and rooted OpenSpec validation.
- [x] 4.3 Inspect the diff for prohibited fields/content, raw identifiers, paths, global mutable correlation, policy changes, and unrelated WIP changes.

## 5. Independent Quality

- [x] 5.1 Run independent protected-boundary Quality review without modifying the candidate.
- [x] 5.2 Resolve only confirmed in-scope findings with the same implementation owner and rerun invalidated checks.
- [x] 5.3 Record GO/NO-GO and residual trust limits. Do not rebuild or live-test the canary before GO.

## 6. Post-Review benchmark repair and re-review

- [x] 6.1 Preserve the original Review GO, its later invalidation, repair lifecycle, RED/GREEN evidence, repair incident, and repaired verification history.
- [x] 6.2 Bind independent re-review to HEAD `dd596899b649ad9a0cda00b1d85749f8a281bab5` and repaired seven-path subject `sha256:3c1142abe6f14aeeb3e6ae3ad0e33141c8a9aa90ae9eede447e946ee0f9f96f8` before lifecycle writes.
- [x] 6.3 Review the permanent benchmark test before the harness and reassess the `customId`, metadata, provider-payload, MCP-baseline, scoring, gate, scenario, production-scope, and AMOR-001 through AMOR-007 contracts.
- [x] 6.4 Record independent NO-GO for Required R1 without modifying code, tests, Apply, Verify, or the repair incident.
- [x] 6.5 Add permanent conflicting-identity fake-transport coverage that fails if the fake prefers legacy `metadata.correlationId` over public `customId`.
- [x] 6.6 Re-verify only checks invalidated by the authorized repair and obtain a fresh independent re-review.
