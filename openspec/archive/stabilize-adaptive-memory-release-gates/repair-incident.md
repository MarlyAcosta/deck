# Repair Incident: Stabilize Adaptive Memory Release Gates

## Incident

- Trigger: initial independent Review reported one Required finding for REQ-STAB-005.
- Scope: `apps/cli/src/tui/app.codex-discovery.test.tsx` only, plus centralized lifecycle evidence.
- Unaffected evidence: bundle parity, managed recall/purity, and RunnerAdapter focused results remain reusable.

## Repair plan

1. Add or reuse a labeled bounded render-flush helper.
2. Replace every remaining direct mounted Ink render-flush await in this test file.
3. Retain the never-resolving render mutation proof.
4. Run the TUI focused test and `git diff --check`.
5. Reconcile focused Verify and request one independent re-review.

## Status

**Resolved.** The same `deck-apply-deep` owner added one labeled bounded render-flush helper, routed every mounted Ink flush through it, and retained the never-resolving mutation fixture.

## Evidence

- RED: independent Review's static bypass inventory identified eight direct unbounded mounted render-flush awaits.
- Static GREEN: no direct `await instance.waitUntilRenderFlush()` remains in the test; only helper/type references and the deliberate never-resolving fixture remain.
- `bun test apps/cli/src/tui/app.codex-discovery.test.tsx` — exit `0`; 4 passed, 0 failed, 19 expectations in 4.64 seconds during focused re-verification.
- Mutation proof: the never-resolving render flush still fails through the bounded diagnostic path and passes its assertion.
- `git diff --check` — exit `0`.
- Initial OpenSpec revalidation during the active repair reported no errors and one temporary phase/event warning; lifecycle reconciliation below removes that transient mismatch before re-review.
