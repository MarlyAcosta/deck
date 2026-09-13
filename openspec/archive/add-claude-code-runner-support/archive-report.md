# Archive Report: Add Claude Code CLI Runner Support

## Change Summary

**Change**: add-claude-code-runner-support
**Status**: ✅ Archived
**Archive Location**: `openspec/archive/add-claude-code-runner-support/`

### Lifecycle

- **Explore**: 2026-08-29 — Direct inspection of `RunnerAdapter`, `AdapterRegistry`, the Codex/OpenCode
  reference adapters, and Anthropic's headless-mode/MCP/Agent SDK documentation.
- **Proposal**: 2026-08-29 — Staged Claude Code adapter modeled on `add-first-class-codex-runner-support`;
  subprocess (not Claude Agent SDK) selected as the execution model.
- **Spec**: 2026-08-29 — 27 RFC 2119 requirements across composition, compatibility, launch safety,
  materialization, instruction translation, models, and documentation honesty.
- **Design**: 2026-08-29 — Recorded the reused (unmodified) launch contract, the output-capture
  design correction versus Codex, package layout, and config-merge strategy reuse.
- **Independent review (fresh-context, pre-implementation)**: 2026-08-29 — A separate
  general-purpose review agent, with no shared rationale with the author, verified every
  load-bearing claim in proposal/spec/design against real source line-by-line. Verdict:
  **APPROVE WITH NOTES**; three corrections applied (stub-arity requirement for Phase 1,
  explicit `--model` pass-through for new sessions, a REQ-ID citation fix).
- **Phase 0 (compatibility/safety spikes)**: 2026-08-29 — Completed with real evidence against an
  authenticated `claude` v2.1.251 install, not documentation research.
- **Phase 1 (composition/detection)**: 2026-08-29 — `@deck/adapter-claude` scaffolded and
  registered. `bun test packages/adapter-claude`: 29/29 pass. Full suite: 4648 pass, failing-set
  byte-identical to pre-change baseline (stash-diff method).
- **Phase 2 (launch)**: 2026-08-29 — `buildClaudeLaunchPlan` for all 4 modes. One real, corrected
  design gap (output-capture contract) found and fixed with a small, shared, user-approved core
  type addition. `bun test packages/adapter-claude`: 55/55 pass.
- **Phase 3 (Developer Team materialization)**: 2026-08-29 — `.mcp.json` writer, `CLAUDE.md`
  marker-span merge, 7 role + 7 skill files, instruction translation, backup/apply/rollback/verify.
  `bun test packages/adapter-claude`: 96/96 pass.
- **Phase 4 (models, capability catalog, doctor)**: 2026-08-29 — Found and fixed a real,
  load-bearing bug (Deck's canonical model catalog IDs don't resolve as `--model` values; only
  Claude's own `sonnet`/`opus`/`haiku` aliases work) via live testing, not assumption.
  `bun test packages/adapter-claude`: 117/117 pass.
- **Phase 5 (CLI command surface, unplanned — added after live testing surfaced it was needed)**:
  2026-08-29 — `deck claude developer`. Found and fixed a real, would-have-blocked-every-apply-forever
  bug (`mutationPreview` never populated). `bun test packages/adapter-claude`: 120/120 pass.
- **Phase 6 (interactive TUI dashboard, unplanned — added on explicit user request)**: 2026-08-29 —
  `buildReviewPlan` and 4 other TUI-exercised methods implemented for real; the `notYetImplemented()`
  throwing stub is fully dead code, confirmed by grep. `bun test packages/adapter-claude`: 120/120 pass.
- **Phase 7 (documentation and hardening)**: 2026-09-12 — Rebased the branch onto 9 commits that
  had landed on `upstream/main` (v0.4.0 release) in the interim; verified zero content drift via a
  `git merge-tree` probe and a diff-of-diffs before force-pushing. Updated 8 documentation surfaces
  (3 originally scoped, 5 more found by a full `productSurfaces`/`maintainedSurfaces` grep sweep)
  that still falsely claimed "Claude is detection-only." Extended
  `tests/documentation-governance.test.ts`'s command allowlist.
- **Archive**: 2026-09-12 — Archived after user review flagged unrelated SDD-process hygiene items
  on a sibling change (`add-claude-global-install-scope`), prompting this deferred archive step to
  be completed.

## Traceability Matrix

| REQ-ID | Phase | Implementation | Live Verification |
|---|---|---|---|
| REQ-CLD-ARCH-001 | 1 | `RunnerAdapter`/`AdapterRegistry` used exclusively | ✅ `packages/adapter-claude/src/runner-adapter.ts` implements the full interface |
| REQ-CLD-ARCH-002 | 1 | Registered only in `apps/cli/src/runner-adapters.ts` | ✅ grep-confirmed sole import site |
| REQ-CLD-ARCH-003 | 1 | `environmentIds: ["claude-development"]` | ✅ matches pre-existing `runtime-detection.ts` id |
| REQ-CLD-ARCH-004 | 1-2 | Zero changes to `RunnerLaunchPlan`/`RunnerLaunchInput` shape | ✅ only an additive `outputCapture` union variant, user-approved, shared-safe (Phase 2) |
| REQ-CLD-ARCH-005 | 1-6 | Adapter owns inspection/config/verify; CLI owns spawn | ✅ `runner-launch-command.ts` unchanged dispatch confirmed in Phase 5 |
| REQ-CLD-COMPAT-001 | 0 | `compatibility.ts` + captured `--help` fixtures | ✅ live `claude --help` v2.1.251 capture |
| REQ-CLD-COMPAT-002 | 1 | `inspectProject` distinguishes present vs. launch-compatible | ✅ fixture-driven tests + live-probe correction mid-Phase-2 |
| REQ-CLD-COMPAT-003 | 0 | Every flag confirmed live before encoding | ✅ 3 launch-policy candidates tested live; one negative result recorded |
| REQ-CLD-RUN-001 | 2 | All 4 `RunnerLaunchInput` modes covered | ✅ `launch.test.ts`, 174 lines of contract tests |
| REQ-CLD-RUN-002/003 | 2 | Fixed owned-policy token, argv-invariant checked | ✅ `hasOwnedLaunchPolicy` + live 3-way negative test (Phase 0) |
| REQ-CLD-RUN-004 | 2 | `exec` prompt via bounded `stdinPayload` only | ✅ oversized/invalid-payload block tests |
| REQ-CLD-RUN-005 | 2 | Session ids validated as opaque scalars | ✅ malformed/flag-like/newline session-id block tests |
| REQ-CLD-RUN-006 | 2 | Bounded `--append-system-prompt`, new sessions only | ✅ resume-mode-never-carries-it test |
| REQ-CLD-RUN-007 | 2 | `stdout`-sourced output capture (not Codex's `file`) | ✅ corrected mid-Phase-2 after reading `trustedFinalAssistantMessage()`; live end-to-end confirmed in Phase 5 |
| REQ-CLD-RUN-008 | 1-2 | Unsupported modes report `"unsupported"`, not a guess | ✅ live-probed-text-derived, not fixture-keyed (Phase 1 correction) |
| REQ-CLD-MAT-001 | 3 | `.mcp.json` safe read/merge/write | ✅ 7 tests incl. path-traversal rejection |
| REQ-CLD-MAT-002 | 3 | `CLAUDE.md` marker-span merge only | ✅ 6 tests incl. idempotent-reapply |
| REQ-CLD-MAT-003 | 3 | Collision detection via body-first ownership marker | ✅ pre-existing-unowned-file blocks-whole-plan test |
| REQ-CLD-MAT-004 | 3 | Backup/apply/rollback/verify | ✅ 10 tests + full build→backup→apply→verify→rollback integration test |
| REQ-CLD-MAT-005 | (scope) | No credential persistence | ✅ confirmed by design — no code path writes `ANTHROPIC_API_KEY` anywhere |
| REQ-CLD-TRN-001/002 | 3 | Near-identity translation + forbidden-vocabulary validator | ✅ 5 unit tests + an integration test proving the validator runs during real plan-building, not just in isolation |
| REQ-CLD-MDL-001 | 4 | `getModelCatalog` reuses `anthropic` provider | ✅ real since Phase 1 |
| REQ-CLD-MDL-002 | 4 | Unconfirmed reasoning defaults flagged, not guessed | ✅ matches Codex's own pragmatic precedent |
| REQ-CLD-DOC-001 | 7 | No parity claim beyond proven capability | ✅ `docs/reference/support-matrix.md` explicit gap list, not a blanket parity claim |
| REQ-CLD-DOC-002 | 4, 7 | Every deferred item has an explicit `"gap"` catalog entry | ✅ test enumerates `proposal.md`'s "Out of scope" + Task 3.6 and confirms a matching gap entry for each |

## Verification

**Result**: ✅ PASS
**Critical findings**: 0
**Final regression gate (Phase 7, post-rebase onto upstream/main v0.4.0)**:
- `bun test` (full monorepo): 4998 pass / 2 skip / 1 fail / 21310 expect() calls across 322 files
  — the 1 failure (`binary-smoke.test.tsx > doctor runs and reports diagnostics`) is pre-existing
  and environment-dependent, confirmed to also fail on bare `upstream/main` with zero Claude
  commits applied (side-by-side check in the same sandbox).
- `bunx tsc --noEmit`: 0 errors monorepo-wide.
- `bun test tests/documentation-governance.test.ts`: 16/16 pass.
- `deck openspec validate`: 0 errors/warnings attributable to this change.
- End-to-end live verification through the real, authenticated `claude` binary (not mocks):
  install preview → apply → `exec` launch → real Anthropic API round trip
  (`is_error: false, result: "OK"`).

## Known, honestly deferred gaps (not silently dropped — each is real and user-visible today)

- Task 3.6: the 29 bundled standalone skills and `deck-onboard`/`deck-archive` bootstrap skills
  are not materialized for Claude.
- No participation in the shared cross-runner capability registry (Context7, Serena, RTK, Context
  Mode, Codebase Memory, Web Search, Supermemory all report `"gap"` in
  `packages/adapter-claude/src/capability-catalog.ts`).
- No Deck-supervised adaptive-memory bridge for Claude (Codex has one via its hook surface;
  Claude's hook surface was confirmed to exist during later exploration but was never evaluated
  for this purpose).
- Dynamic model discovery: a static 3-entry alias mapping (`sonnet`/`opus`/`haiku`) stands in for
  Codex-style live model discovery.
- MCP capability-driven selection: only the generic single-server `.mcp.json` writer exists.
- `buildReviewPlan`'s simplicity (Phase 6) needs revisit once capability-driven MCP selection
  exists.
- Global (user-level, `~/.claude/`) install scope does not exist — every install is project-scoped
  only. This is the subject of the immediately-following change,
  `add-claude-global-install-scope`.

## Follow-ups

- **In progress**: `add-claude-global-install-scope` — global install scope, addressing the last
  bullet above.
- **Future, unscoped**: shared-capability-registry participation and the Deck-supervised
  adaptive-memory bridge, both explicitly deferred to their own future proposals per this change's
  own `proposal.md` "Out of scope" section.

> No blockers. This change is fully closed for this cycle.
