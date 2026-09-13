# Specification: Shared Capability Registry Participation for Claude Code

## Source

- Proposal: `proposal.md`
- Related official changes: `add-claude-code-runner-support` (archived — this change extends its
  Phase 3 `.mcp.json` writer and Phase 6 `buildReviewPlan`, both reused unmodified in their
  current shape, only extended); `add-claude-global-install-scope` (the currently-active install
  scope this change's MCP writes must respect unchanged).
- Evidence base: direct inspection of `packages/adapter-codex/src/{capability-catalog,mcp-config}.ts`
  and `runner-adapter.ts`'s `buildReviewPlan` (the reference precedent for every phase below);
  `packages/adapter-claude/src/{capability-catalog,mcp-config,runner-adapter}.ts` (current state).

## Requirements

### Capability: Cross-runner non-interference (applies to every phase)

REQ-CSC-ISO-001: No file under `packages/adapter-pi/`, `packages/adapter-opencode/`, or
`packages/adapter-codex/` MUST change in any phase of this work. Confirmed by inspection: this
codebase's established convention is per-adapter constants even for the same physical service —
OpenCode's Context7 wiring (`@upstash/context7-mcp`, a local npm package) and Codex's
(`streamable-http` to `mcp.context7.com`) are two genuinely different provisioning mechanisms, not
a shared value either currently imports. Claude's own Context7/Serena/Web Search values MUST
therefore be defined independently within `packages/adapter-claude/`, matching Codex's specific
values where the mechanism is the same (remote HTTP for Context7, the Deck-owned proxy for
Serena) — not force-fit into a shared `packages/core` location that does not exist for this
purpose anywhere else in the codebase.

REQ-CSC-ISO-002: No type in `packages/core/src/runner-adapter.ts` MUST change to accommodate any
phase, unless a phase discovers a real, load-bearing gap in the shared contract (mirroring how
`add-claude-code-runner-support`'s Phase 2 found and fixed one, with user approval, for the
output-capture contract) — in which case the gap and the fix MUST be recorded with the same
rigor, not silently patched.

REQ-CSC-ISO-003: Every phase's `.mcp.json` write MUST use the existing `writeClaudeMcpConfig`
(`packages/adapter-claude/src/mcp-config.ts`) unmodified in its core read/merge/write logic —
phases add server *definitions*, never a second writer or a bypass of the existing safe-merge
guarantees.

### Capability: Phase 1 — RTK

REQ-CSC-RTK-001: `capability-catalog.ts`'s `rtk` entry MUST change from `status: "gap"` to
`status: "shared"`, matching Codex's own status vocabulary for the identical capability.

REQ-CSC-RTK-002: RTK detection MUST reuse the same shared-binary-presence helper Codex/Pi/OpenCode
already use for this exact purpose — MUST NOT introduce a second, Claude-specific PATH-checking
implementation.

REQ-CSC-RTK-003: RTK MUST NOT write any `.mcp.json` entry — it is a pure binary-reuse capability,
matching Codex's `provisionMode: "reuse-shared-binary"` (no `mcpServerName` field at all).

### Capability: Phase 2 — Context7

REQ-CSC-CTX7-001: The Context7 MCP server entry Claude writes MUST be byte-identical in shape to
Codex's (`transport: "streamable-http"`, `url: "https://mcp.context7.com/mcp"`,
`envHttpHeaders: { "X-Context7-API-Key": "CONTEXT7_API_KEY" }`) — same physical server, same
values, defined as Claude's own constant in `packages/adapter-claude/src/mcp-config.ts` (per
REQ-CSC-ISO-001, matching this codebase's established per-adapter convention), with a comment
tying it explicitly to Codex's matching definition so the two cannot silently drift apart.

REQ-CSC-CTX7-002: Context7 MUST NOT require any Deck-persisted credential — the API key remains
an environment variable the runner's own MCP client reads, matching Codex's existing model
exactly.

### Capability: Phase 3 — Context Mode

REQ-CSC-CM-001: Context Mode MUST follow the same `reuse-shared-binary-plus-mcp` shape Codex uses
— a PATH check for the `context-mode` binary (reusing Phase 1's detection helper) plus an MCP
entry pointing at it (reusing Phase 2's MCP-writing mechanics).

REQ-CSC-CM-002: This phase MUST NOT be combined with Codebase Memory (Phase 4) in implementation
or in a single verification gate, even though their shapes are similar — Codebase Memory's open
unknown (REQ-CSC-CBM-002) must never block or delay Context Mode's clean, fully-understood case.

### Capability: Phase 4 — Codebase Memory

REQ-CSC-CBM-001: Codebase Memory MUST follow the same `reuse-shared-binary-plus-mcp` shape as
Context Mode, targeting the `codebase-memory-mcp` binary and `codebase-memory` server name.

REQ-CSC-CBM-002: Before any code is written for this phase, Codex's actual "project index
readiness" mechanism (flagged in its own capability catalog as independently required, but not
yet located or read in this proposal's exploration) MUST be read and understood from Codex's real
implementation. Design and tasks for this phase MUST NOT proceed from the one-line catalog flag
alone.

### Capability: Phase 5 — Serena

REQ-CSC-SER-001: Claude's Serena MCP entry MUST point at the same Deck-owned proxy command Codex's
does (`deck internal serena-mcp`, with the same argv/env-var forwarding), not a raw `serena`
binary invocation — reusing existing shared infrastructure, never a parallel launcher.

REQ-CSC-SER-002: Serena MUST require explicit user selection and a bootstrap/authorization step
before Deck provisions it, mirroring Codex's `buildReviewPlan` branching
(`"codex-serena-bootstrap"` / `"codex-serena-selection-required"`) — Serena MUST NOT become
available to Claude simply by being installed/detected, unlike RTK/Context7/Context Mode/Codebase
Memory.

### Capability: Phase 6 — Web Search

REQ-CSC-WS-001: Claude's Web Search wiring MUST reuse the existing, already-shared, runner-neutral
Web Search subsystem described in `docs/runner-support.md`'s "Optional Web Search" section
(provider selection, Tavily, the profile-scoped credential write) — MUST NOT introduce a
Claude-specific provider system, credential path, or config surface.

REQ-CSC-WS-002: `buildReviewPlan`'s Web Search handling MUST mirror Codex's early, special-cased
`state.selectedCapabilities["web-search"]` check (a config-write action emitted before the generic
per-capability loop, not inside it) — an attempt to fit Web Search into the same generic loop
Phases 1-4 use MUST be treated as a design error if it doesn't match Codex's actual observed
behavior, not silently forced to fit.

### Capability: Phase 7 — `buildReviewPlan` safety and honesty revisit

REQ-CSC-RVP-001: After Phases 1-6, `buildReviewPlan` MUST handle a required-and-blocked capability
the same way Codex's does: either an approved `"static-compatible-gap"` diagnostic (capability
label named, no first-class control claimed) or a genuine blocking manual step — never silently
omitted from the plan.

REQ-CSC-RVP-002: This phase MUST NOT be started before at least one of Phases 1-6 has landed and
been verified — there must be a real capability to exercise this machinery against, not a
speculative implementation built ahead of need.

### Capability: Honest scope boundary (applies to every phase)

REQ-CSC-DOC-001: Documentation updates for any phase MUST NOT claim Supermemory/adaptive-memory
participation — explicitly out of scope for this entire change (see `proposal.md`).

REQ-CSC-DOC-002: Documentation updates MUST name, per phase, exactly which capability moved from
`"gap"` to a real status — MUST NOT describe this change as achieving blanket "capability parity
with Codex" at any point before Phase 7 actually closes the safety/honesty gap.

## Acceptance scenarios

1. **RTK becomes selectable.** Given the `rtk` binary is on `PATH`, when a user selects Claude in
   the TUI's package-selection flow, RTK MUST appear as a selectable, real (not stubbed) package
   option, matching what OpenCode/Codex already show for the same binary.

2. **Context7 MCP entry matches Codex's exactly.** Given Context7 is selected for Claude, the
   resulting `.mcp.json` entry MUST be identical in shape and values to the entry Codex's own
   `.mcp.json` writer would produce for the same capability.

3. **Codebase Memory's index-readiness check is real, not assumed.** Given Codex's actual
   mechanism has been read and understood (per REQ-CSC-CBM-002), Claude's equivalent check MUST
   be provably equivalent, not a guess — verified by a test that would fail if the readiness
   check were silently skipped.

4. **Serena requires explicit selection.** Given Serena is available but not yet explicitly
   selected, `buildReviewPlan` MUST NOT provision it automatically — matching REQ-CSC-SER-002.

5. **Web Search reuses the shared subsystem, verified by no duplicated code.** Given Claude's Web
   Search wiring, a repo-wide check MUST confirm no second provider-selection, credential-storage,
   or MCP-materialization implementation exists outside the already-shared subsystem.

6. **Other runners are untouched throughout.** Given the full existing Pi/OpenCode/Codex test
   suites, after every phase, every previously-passing test in those adapters MUST still pass
   unchanged — the same before/after failing-test-name diff methodology this project has used at
   every phase since `add-claude-code-runner-support`.
