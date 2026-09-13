# Tasks: Shared Capability Registry Participation for Claude Code

## Execution rule

One phase at a time, in order. Do not start a phase before the prior one is implemented, tested,
and (where live verification is possible) confirmed against the real binary/MCP behavior — the
same discipline `add-claude-code-runner-support` and `add-claude-global-install-scope` both used.
Phase 7 additionally requires at least one of Phases 1-6 to have landed first (REQ-CSC-RVP-002).

## Task 1: RTK — DONE

- Changed `capability-catalog.ts`'s `rtk` entry from `status: "gap"` to `status: "shared"`
  (`ClaudeCapabilityStatus` gained the `"shared"` member).
- Found and reused (not reimplemented) `checkSharedBinaryUsability` from `@deck/core`
  (`packages/core/src/shared-binary-usability.ts`) — the exact same helper Codex's own `rtk`
  entry calls via its private `#sharedBinaryUsability` field.
- `getCapabilityInventory` now runs a real `checkSharedBinaryUsability("rtk")` check for the
  `rtk` entry specifically (a new `#rtkCapabilityEntry` method), with `isInstalled`/`isBlocked`/
  diagnostics all reflecting the real result — every other catalog entry's handling is unchanged.
- `#toCatalogEntry` gained an optional `overrides` parameter (`isBlocked`, `diagnostics`) so RTK's
  real result can flow through the same entry-building path every capability uses, rather than a
  parallel one.
- **Corrected during implementation, not assumed from the original task description**: no
  `buildReviewPlan` branch was needed. Reading Codex's actual `buildReviewPlan` loop
  (`packages/adapter-codex/src/runner-adapter.ts:980-1017`) shows `rtk` is *not* in the list of
  capability IDs that produce a `configWrites`/manual-step action when selected — a
  `reuse-shared-binary` capability that's already present needs no action at all, just an
  accurate ready/not-ready status. Claude's existing `buildReviewPlan` (unconditional, ignores
  `state.selectedCapabilities` entirely today) already produces the same no-action outcome for
  RTK that Codex's does, for the same reason — nothing to correct here yet.

**Verification — actually run:**
- `bun test packages/adapter-claude`: 134/134 pass (up from 132), including 2 new RTK-specific
  tests (status is `"shared"`, `isInstalled` reflects a real boolean check, not a hardcoded
  value).
- Live, through the real adapter registry (`getAdapter("claude-development")`, the same function
  `apps/cli/src/tui/app.tsx` calls): with `rtk` genuinely on `PATH` in this environment (`rtk
  0.45.0`), `getCapabilityInventory` reports `{ supportStatus: "shared", isInstalled: true,
  isBlocked: false }` for the real capability — not through the live interactive TUI, which
  cannot be reliably driven from this environment.
- Full `bun test`: 5013 pass / 2 skip / 1 fail (same pre-existing case) across 323 files —
  zero regressions. `bunx tsc --noEmit`: 0 errors.

## Task 2: Context7

- Add `CLAUDE_CONTEXT7_MCP_ENTRY` (or equivalently named constant) to
  `packages/adapter-claude/src/mcp-config.ts`, matching Codex's `mcp-config.ts:306` value exactly,
  with a comment citing that line as the source of truth this must stay in sync with.
- `capability-catalog.ts`: `context7` moves `"gap"` -> `"supported"`.
- Wire the capability through `writeClaudeMcpConfig` and `buildReviewPlan`'s minimal
  selectable/actionable branch.

**Verification:**
- Unit test: selecting Context7 produces a `.mcp.json` entry byte-identical in shape/values to
  Codex's own (a direct comparison test against the Codex constant, not just an assertion of
  Claude's own expected shape in isolation — this is the test that would catch silent drift).
- Real filesystem round trip (mirroring `mcp-config.test.ts`'s existing pattern): a pre-existing
  unrelated server entry survives the write untouched.
- Full `bun test` + `bunx tsc --noEmit`: zero regressions.

## Task 3: Context Mode

- Combine Task 1's binary-detection pattern with Task 2's MCP-writing pattern for the
  `context-mode` binary/server name.
- `capability-catalog.ts`: `context-mode` moves `"gap"` -> `"shared"`.

**Verification:** Same shape as Tasks 1-2's combined verification (binary presence test, MCP
entry test, live reproduction script, full regression gate). No new verification approach needed
since no new mechanism was introduced.

## Task 4: Codebase Memory

- **First sub-task, before any implementation**: locate and read Codex's actual "project index
  readiness" mechanism (referenced but not found during this proposal's exploration —
  `runtimeReadiness: "binary+mcp+index"` in Codex's capability catalog is the only lead so far).
  Record what it actually does in this task's own notes before writing Claude's equivalent.
- Implement Claude's equivalent readiness check once understood, following whatever pattern
  Codex's turns out to use — not assumed in advance.
- `capability-catalog.ts`: `codebase-memory` moves `"gap"` -> `"shared"`.

**Verification:** A test that would fail if the index-readiness check were silently skipped
(REQ-CSC's acceptance scenario 3) — the exact shape of this test depends on what the
investigation sub-task finds, so it cannot be fully specified until that's done. Full regression
gate as with every prior task.

## Task 5: Serena

- Add Claude's Serena MCP entry pointing at `deck internal serena-mcp` (same command/args/env-var
  forwarding as Codex's `CODEX_SERENA_PROXY_COMMAND`/`_ARGS`/`_ENV_VARS`).
- Extend `buildReviewPlan` with the explicit-selection + bootstrap/authorization branching
  (mirroring Codex's `"codex-serena-bootstrap"`/`"codex-serena-selection-required"` manual steps)
  — this is new machinery for Claude's `buildReviewPlan`, not yet present even in minimal form.
- `capability-catalog.ts`: `serena` moves `"gap"` -> `"shared"`.

**Verification:**
- Unit test: Serena selected but not explicitly authorized produces a blocked/manual-step result,
  never an automatic MCP write (REQ-CSC-SER-002, acceptance scenario 4).
- Unit test: the proxy command/args/env-vars in Claude's entry match Codex's exactly (same
  drift-detection approach as Task 2's Context7 test).
- Full regression gate.

## Task 6: Web Search

- Wire Claude into the existing shared Web Search subsystem's MCP-materialization step (following
  whatever native command the selected provider resolves to, same shape as the other three
  runners' own Web Search MCP materialization).
- Extend `buildReviewPlan` with the early, special-cased `state.selectedCapabilities["web-search"]`
  block (a config-write action before the generic per-capability loop), mirroring Codex's exact
  placement — verified against Codex's real code, not assumed to fit the generic loop pattern
  Tasks 1-5 established.
- `capability-catalog.ts`: `web-search` moves `"gap"` -> whatever status Codex uses for it
  (confirm exact value from Codex's own catalog before writing Claude's).

**Verification:**
- Repo-wide grep confirms no second provider-selection/credential-storage implementation was
  introduced (REQ-CSC-WS-001, acceptance scenario 5).
- Unit test: the early special-cased block fires correctly, matching Codex's placement (not
  inside the generic loop).
- Full regression gate.

## Task 7: `buildReviewPlan` safety/honesty revisit

- Only starts once at least one of Tasks 1-6 has landed (REQ-CSC-RVP-002).
- Add the `blockedCapabilityIds`/`staticCompatibleGapIds` tracking and
  `addStaticCompatibleGap`/`addBlockedCapability` helpers, generalized across whichever
  capabilities exist by this point — reusing Codex's exact pattern
  (`packages/adapter-codex/src/runner-adapter.ts:957-979`), not a new design.

**Verification:**
- Unit test: a required-and-blocked capability produces either an approved
  `"static-compatible-gap"` diagnostic or a real blocking manual step — never silently dropped
  from the plan (REQ-CSC-RVP-001).
- Full regression gate.

## Task 8: Full regression gate and documentation

- Run `bun test` (full suite), `bunx tsc --noEmit`, and `deck openspec validate` against the
  final state of Tasks 1-7.
- Update `docs/runners.md`, `docs/runner-support.md`, and `docs/reference/support-matrix.md` to
  name, per capability, which moved from `"gap"` to a real status — not a blanket "parity with
  Codex" claim (REQ-CSC-DOC-002), and explicitly still excluding Supermemory (REQ-CSC-DOC-001).

**Verification:** No regression in existing Pi/OpenCode/Codex/Claude test counts;
`deck openspec validate` reports zero errors/warnings attributable to
`add-claude-shared-capability-registry`; `tests/documentation-governance.test.ts` passes with the
updated docs.
