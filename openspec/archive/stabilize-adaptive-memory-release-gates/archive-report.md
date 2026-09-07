# Archive Report: Stabilize Adaptive Memory Release Gates

## Completed Archive — 2026-09-07

**Archived. Readiness READY.** Final location: `openspec/archive/stabilize-adaptive-memory-release-gates/`. The active directory is absent. All 68 pre-move files arrived byte-identically through an atomic same-filesystem rename; see `archive-evidence/move-proof.json`. Original ready-state registry bytes and all prior provenance/event entries remain preserved.

Post-Archive validation passed for all three archived changes and the workflow's canonical archived change: **0 errors, 0 warnings each**. Workflow, canonical archive and baseline ledger are unchanged. A first post-validation attempt exposed the just-authored event spelling `archive.archived`; current executable validation requires `archive.completed` while phase/status remain `archive/archived`. Only that new event name was corrected. Initial event bytes, warning output and correction rationale are preserved in `archive-evidence/`; no prior history or validator was modified.

The sections below record the pre-move decision and traceability. No Git staging/commit/tag/push or release-preparation action occurred.

Archived command logs also have byte-identical `.log.txt` copies because the repository ignores `*.log`. `archive-evidence/log-retention.json` binds every copy; no ignore rule or original log was changed. `archive-evidence/final-inventory.json` is the final HEAD/index/WIP/version/tag receipt, including these trackable evidence additions.

## Pre-move disposition

**Readiness: READY. Quality: passed_with_warnings. Blockers: 0.**

This nonempty report was created in the active change before any archive registry transition or move. Planned canonical destination: `openspec/archive/stabilize-adaptive-memory-release-gates/`. Actual completion and integrity evidence will be appended after the move.

HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`; expanded nine-path subject: `sha256:64a81e9e30b3d7e3139ea11e0384ea983da573a9f4e5f99dd07e531489d5a7d9`. Verify: 228 pass, zero failures, current closure/semantics/determinism/privacy, focused strict TypeScript and causal pinned compiled/build-tooling checks. Independent Review: GO, zero Critical/Required. See `gen-001-provenance.md`, `gen-001-review.md` and `gen-001-evidence/`.

## Traceability

| Requirement | Tasks / implementation | Bound result |
|---|---|---|
| REQ-STAB-001 | 1.1, GEN.1; exact baseline inventory and explicit bundle/tooling ownership | PASS; unrelated inventoried WIP unchanged |
| REQ-STAB-002 | 2.1; instruction-bundle parity test | Prior focused and accepted BROAD PASS; source unchanged |
| REQ-STAB-003 | 2.2; provider-neutral managed recall screening | Current source/generated coverage PASS |
| REQ-STAB-004 | 2.3; deterministic Codex probe tests | Prior candidate GO/BROAD retained; optional unrelated ambient-Codex test dependency separately disclosed |
| REQ-STAB-005 | 2.4, prior Required repair; bounded mounted render/discovery | Prior repaired Verify/GO and BROAD retained; candidate hashes unchanged |
| REQ-STAB-006 | 3.x, 4.x, GEN.2–GEN.5; expanded candidate verification and independent Review | PASS with preserved historical execution-count deviation and Optional warning |
| REQ-STAB-007 | GEN.6; report-before-move, lossless move, appended registry history, focused post-validation | Preconditions passed; completion verified after move |

Seven original requirements are covered. GEN.1–GEN.5 are complete; GEN.6 is the authorized closure operation. Historical task 4.2 is an admitted prior full-suite count deviation, not erased or falsely completed. The user accepted existing broad results and requested only causally affected reruns.

## Lifecycle and evidence

- Planning/implementation/focused repair/independent source-level GO: 2026-09-04.
- Captured normative BROAD successes and GEN-001 inventory blocker: 2026-09-07; all original command results and response-loss deviation retained.
- GEN-001: canonical 1.3.12 adoption, full closure and toolchain comparison, drift guard with TDD, 228-pass Verify, independent nine-path GO: 2026-09-07.
- Root version remains 0.3.0; no release preparation or publication occurred.

No delta-spec directory is present; this change uses a standalone `spec.md`. No unrelated main spec or historical artifact is merged or repaired.

## Warnings and follow-ups retained

- **Optional O-GEN-001:** two HEAD-identical Codex tests depend on ambient Codex preflight. Interrupted review run: 51 pass / 2 fail. Bounded offline fixture proof explains the difference. Preserve raw failed attempt and diagnosis; optional test hardening is not a release blocker for this candidate.
- Prior full-suite MCP response loss led to a second historical invocation. No full suite was repeated during GEN-001. No global-green or universally hermetic clean-CI claim is made.
- Historical OpenCode `ab7a...` bytes remain unavailable; the new complete current-source/generated subject supersedes them without claiming equivalence to unknown bytes.
- Non-host targets are compile-only; provider-neutral screening remains heuristic; default subprocess cleanup has the previously recorded test boundary. No provider/live or canary acceptance claim.

Only this change and the two related ready memory changes are being archived. Workflow dependency `canonical-supermemory-conversation-memory` is already archived and remains unchanged, with successful named validation. Version 0.4.0 and CHANGELOG preparation require the next separately authorized step. No commit/tag/push/publication is authorized.
