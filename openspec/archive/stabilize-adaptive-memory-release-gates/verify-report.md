# Verify Report: Stabilize Adaptive Memory Release Gates

## Current GEN-001 Verify — 2026-09-07

**PASS** for the expanded nine-path candidate `64a81e9e30b3d7e3139ea11e0384ea983da573a9f4e5f99dd07e531489d5a7d9`: 228 focused tests, 0 failures, 1,260 expectations; four named OpenSpec validations with zero errors/warnings; clean diff checking. Canonical generation, closure, semantics, privacy and causal compiled/build checks are in [gen-001-provenance.md](gen-001-provenance.md). Independent Review subsequently returned GO; see [gen-001-review.md](gen-001-review.md), including its separate failed-run causal disposition. Everything below preserves historical stage evidence.

## Candidate

- Change: `stabilize-adaptive-memory-release-gates`
- Reference HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`
- Implementation owner: `deck-apply-deep`
- Verify owner: `deck-lead`
- Final stage: normative BROAD commands completed successfully; final generated-artifact reconciliation blocks release readiness and Archive. See `release-readiness.md` and `inventory.md`.

## Focused evidence

| Command | Result |
|---|---|
| `bun test packages/core/src/teams/developer/instruction-bundles/bundle-parity.test.ts packages/core/src/memory/managed-project-memory-recall.test.ts packages/core/src/__tests__/core-purity-audit.test.ts packages/adapter-codex/src/runner-adapter.test.ts apps/cli/src/tui/app.codex-discovery.test.tsx` | PASS, exit `0`; 51 passed, 0 failed, 338 expectations across 5 files in 74.06 seconds. |
| `bun run apps/cli/src/main.tsx openspec validate --json --root . --change stabilize-adaptive-memory-release-gates` | PASS, exit `0`; 1 active change, 0 errors, 0 warnings. |
| `git diff --check` | PASS, exit `0`; no output. |
| focused OpenSpec validation after repair reconciliation | PASS, exit `0`; 0 errors, 0 warnings. |

## Requirement disposition

| Requirement | Focused result |
|---|---|
| REQ-STAB-001 preserve unrelated work | PASS — candidate diff contains only five owned implementation/test paths plus this change's artifacts. |
| REQ-STAB-002 intentional bundle parity | PASS — 11 parity tests green after history-backed baseline refresh; no production/generated content changed. |
| REQ-STAB-003 provider-neutral secret screening | PASS — managed recall behavior and unchanged purity audit are green. |
| REQ-STAB-004 deterministic RunnerAdapter timeout coverage | PASS — injected success and timeout/signal outcomes preserve the bounded production request contract. |
| REQ-STAB-005 deterministic TUI discovery coverage | PASS — causal request synchronization and hung-render mutation proof are green. |
| REQ-STAB-006 candidate-bound quality gates | PARTIAL — focused Verify is green; independent Review and mandatory BROAD remain pending. |
| REQ-STAB-007 safe Archive | PENDING — no Archive action is permitted before Review and BROAD. |

## Reused evidence

The completed focused behavior evidence and independent GO for `adaptive-memory-observability-receipts` and `fix-adaptive-memory-capture-policy-markdown-lists` remain valid because this stabilization did not modify their production/test routes. Their focused suites and Reviews were not repeated.

## Focused Verify disposition

**PASS.** The candidate may proceed to independent Review. This is not final release readiness and does not authorize Archive.

## Repair re-verification

The initial Review invalidated only the mounted TUI focused result. The other four groups remain reusable.

| Command | Result |
|---|---|
| `bun test apps/cli/src/tui/app.codex-discovery.test.tsx` | PASS, exit `0`; 4 passed, 0 failed, 19 expectations in 4.64 seconds. |
| source search for direct `await instance.waitUntilRenderFlush()` | PASS; no direct unbounded await remains. |
| `git diff --check` | PASS, exit `0`; no output. |

The Required finding is repaired with mutation coverage. Focused Verify remains **PASS** and the candidate returns to independent re-review. Mandatory BROAD remains pending.

## Final reconciliation

The statements above retain the focused-stage history. Independent re-review subsequently returned GO, and all eight normative commands exited zero in the captured final run (4,825 full-suite passes, 1 skip, 0 failures). `release-readiness.md` records the complete results and the earlier MCP response-loss/re-execution deviation.

**Command disposition: PASS. Integrated release readiness: NOT READY.** Canonical generation changed previously reviewed OpenCode bytes and introduced a Pi generated delta outside the five-path Review subject. GEN-001 is not cleared by entry hashes alone. No Archive was performed. The earlier unconditional no-generated-change/WIP-preservation statements apply only to the implementation stage, not the final generated worktree.

All affected named memory changes were revalidated with zero OpenSpec errors and warnings; no completed behavior suite or Review was repeated as a separate focused gate.
