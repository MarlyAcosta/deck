# Proposal: Add Shared Capability Registry Participation for Claude Code

## Intent

Wire Claude Code into the same shared-capability system Codex already uses, so the six
capabilities that currently report `"gap"` in `packages/adapter-claude/src/capability-catalog.ts`
(Context7, RTK, Serena, Context Mode, Codebase Memory, Web Search) become real, installable
package options in Deck's TUI for Claude — the same "Configure packages" experience the user
already gets for OpenCode and Codex. Supermemory (adaptive memory) is explicitly **excluded**
from this proposal — see "Out of scope" below.

## Current state, confirmed by direct inspection

- `packages/adapter-claude/src/capability-catalog.ts` marks `context-mode`, `codebase-memory`,
  `rtk`, `serena`, `context7`, `web-search`, and `supermemory-tool-bindings` all as `status: "gap"`
  with the identical description `"Not yet scoped for Claude."` — confirmed live in this session:
  selecting Claude in the TUI's package-selection flow shows nothing, because
  `getCapabilityInventory` never reports any of these as `isInstalled`/selectable.
- `packages/adapter-claude/src/mcp-config.ts` (`writeClaudeMcpConfig`) already exists from
  `add-claude-code-runner-support`'s Phase 3 — a generic, safe, single-server `.mcp.json`
  read/merge/write. This proposal's job is to call it with the right server definitions for each
  capability, not to build the writer itself.
- Codex's real implementation (`packages/adapter-codex/src/{capability-catalog,mcp-config}.ts`,
  `runner-adapter.ts`'s `buildReviewPlan`) is the reference precedent, read in full for this
  proposal:
  - **RTK**: `provisionMode: "reuse-shared-binary"` — a PATH check for the `rtk` command, no MCP
    entry at all. The simplest capability by a wide margin.
  - **Context7**: `provisionMode: "streamable-http-mcp"` — one static MCP server entry:
    `{ transport: "streamable-http", url: "https://mcp.context7.com/mcp", envHttpHeaders: { "X-Context7-API-Key": "CONTEXT7_API_KEY" } }`.
    No Deck secret-store involvement; the API key is an environment variable the user supplies to
    the runner's own MCP client, not something Deck persists.
  - **Context Mode**: `provisionMode: "reuse-shared-binary-plus-mcp"` — a PATH check for the
    `context-mode` binary plus an MCP server entry pointing at it.
  - **Codebase Memory**: same shape as Context Mode, plus an extra `"project index readiness"`
    check Codex's own notes flag as independently required (not detailed further in Codex's own
    capability catalog beyond the flag).
  - **Serena**: NOT a raw binary MCP entry — Codex proxies it through **Deck's own hidden
    command**, `deck internal serena-mcp` (`CODEX_SERENA_PROXY_COMMAND`/`_ARGS`/`_ENV_VARS` in
    `mcp-config.ts`), gated on an explicit-selection + bootstrap flow
    (`buildReviewPlan`'s special-cased `"codex-serena-bootstrap"`/`"codex-serena-selection-required"`
    manual steps) rather than being unconditionally available like Context7.
  - **Web Search**: its own substantial, already-shared, runner-neutral subsystem
    (`webSearchProvider`, Tavily, a profile-scoped credential written to the shell profile) —
    already used by Pi/OpenCode/Codex per `docs/runner-support.md`'s "Optional Web Search"
    section; wiring Claude in reuses that shared system, not a new one.
  - `buildReviewPlan` itself is substantial for Codex (~110 lines: blocked-capability handling,
    `"static-compatible-gap"` diagnostics for capabilities not fully first-class, Serena's special
    explicit-selection flow, per-capability `"codex-config-preview"` actions) — Claude's own
    `buildReviewPlan` (Phase 6 of `add-claude-code-runner-support`) is deliberately ~15 lines today
    specifically because nothing in its catalog is ever `"required"`/`isBlocked`/selectable yet;
    this proposal is exactly the work tasks.md flagged there as needing revisit once
    capability-driven MCP selection exists.

## User outcome

Selecting Claude Code (alone or alongside other runners) in Deck's "Configure packages" or
"Start installation" flow shows real, selectable package options for RTK, Context7, Context Mode,
Codebase Memory, Serena, and Web Search — with the same honesty standard the rest of this project
has held throughout: a capability that isn't actually wired stays an explicit `"gap"`, never a
silent assumption of parity with Codex.

## Scope — six phases, each its own independently-verifiable vertical

### Phase 1 — RTK (smallest first, proves the end-to-end pattern)

- `capability-catalog.ts`: `rtk` moves from `"gap"` to `"shared"` (mirroring Codex's status
  vocabulary, not inventing a new one).
- A PATH check for the `rtk` binary (reuse `packages/core`'s existing shared-binary detection
  helper Codex/Pi/OpenCode already use — not a new detector).
- No `.mcp.json` involvement at all.
- `getCapabilityInventory`/`buildReviewPlan` updated so RTK becomes selectable and its install
  action is a real `"reuse-shared-binary"` check, not a stub.

### Phase 2 — Context7 (simplest MCP-backed capability)

- `mcp-config.ts` gains the exact Context7 server definition Codex uses (same URL, same header
  key name) — reusing the identical values, not inventing new ones, since this is the same
  physical MCP server regardless of which runner connects to it.
- Wired through the existing `writeClaudeMcpConfig`.

### Phase 3 — Context Mode (binary + MCP, the clean case)

- `reuse-shared-binary-plus-mcp`: a PATH check for the `context-mode` binary plus an MCP entry
  pointing at it, mirroring Context7's Phase 2 MCP-writing mechanics plus RTK's Phase 1 binary
  detection — no new mechanism, just their combination.
- Kept separate from Codebase Memory (below) on purpose: Context Mode has no open unknown, so it
  should not share a phase — and therefore a verification gate — with one that does.

### Phase 4 — Codebase Memory (binary + MCP, plus one unresolved unknown)

- Same shape as Phase 3, plus the "project index readiness" check Codex's own capability catalog
  flags as independently required. This phase's first task is reading Codex's actual
  index-readiness implementation (not yet located in this proposal's own exploration) before
  designing Claude's equivalent — explicitly not assumed from the one-line catalog flag.

### Phase 5 — Serena (the one genuinely different shape)

- Reuses Deck's existing `deck internal serena-mcp` proxy command unchanged (already shared
  infrastructure, not Codex-specific) — Claude's `.mcp.json` entry points at the same Deck-owned
  launcher Codex's does.
- Reuses the explicit-selection + bootstrap authorization flow Codex's `buildReviewPlan` already
  established as the correct UX for Serena specifically (it is not simply "available," it needs
  a deliberate user choice before Deck provisions it) — this is Codex's own considered design
  choice, not incidental complexity to strip out.

### Phase 6 — Web Search

- Wires Claude into the already-shared, runner-neutral Web Search subsystem
  (`docs/runner-support.md`'s "Optional Web Search" section) exactly as Pi/OpenCode/Codex already
  are — no new provider system, no new credential path. Kept last among the five real
  capabilities because Codex's `buildReviewPlan` special-cases it with its own early
  `state.selectedCapabilities["web-search"]` block (a `"write-deck-config"` action *before* the
  generic per-capability loop, not inside it) — the phase with the most `buildReviewPlan`-shaped
  work goes last, once the simpler generic-loop pattern is proven by Phases 1-5.

### Phase 7 — `buildReviewPlan` safety/honesty revisit

**Not "make capabilities work" — each of Phases 1-6 already includes the minimal
`buildReviewPlan` extension needed to make that specific capability selectable and actionable, the
same way Phase 6 of `add-claude-code-runner-support` built the original bare-minimum version.**
This final phase is specifically the safety/honesty machinery Codex's ~110-line `buildReviewPlan`
has and Claude's ~15-line one does not: blocked-capability handling, `"static-compatible-gap"`
diagnostics for anything not fully first-class, and the manual-step/authorization-required
branching Serena's Phase 5 needs a real (not stubbed) version of. Doing this last, once real
capabilities exist to exercise it against, is deliberate — building this machinery before Phase 1
even ships would be exactly the kind of premature abstraction this project has avoided
throughout.

## Out of scope for this proposal

- **Supermemory / adaptive memory.** Requires a validated credential in Deck's secret store and a
  Deck-supervised runtime bridge — a materially different, larger piece of work than the other
  five (Codex's own equivalent required multiple dedicated, now-archived OpenSpec changes:
  `add-supermemory-mcp-memory-provider`, `canonical-supermemory-conversation-memory`,
  `redesign-supermemory-mcp-memory`, among others). Stays its own, separate, future proposal —
  never bundled here, matching every prior decision in this session to keep that scope apart.
- Any project-scoped vs. global-scoped distinction for these capabilities' MCP writes — they
  follow whatever `.mcp.json` location `add-claude-global-install-scope` already established
  (project-local, per that change's own scope; the generic MCP writer was never made global).
- Changing Codex's or OpenCode's own capability wiring — every phase above reuses their existing
  shared infrastructure (the binary detectors, the Context7 URL, the Serena proxy command, the
  Web Search subsystem) unchanged, never modifies it.

## Delivery strategy

One phase at a time, in the order above — RTK (1) -> Context7 (2) -> Context Mode (3) ->
Codebase Memory (4) -> Serena (5) -> Web Search (6) -> `buildReviewPlan` safety revisit (7) —
smallest/most-isolated risk first, each independently verified (real binary/MCP checks, live
where possible, matching this session's established standard) before starting the next —
mirroring `add-claude-code-runner-support`'s own phasing discipline and
`add-claude-global-install-scope`'s corrected size estimates (verify the real scope by reading
Codex's actual code before estimating, not after finding out the estimate was wrong).

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Assuming a capability's complexity from its one-line capability-catalog description, the same mistake `add-claude-global-install-scope`'s Task 4/5 estimates made initially. | Each phase's design step reads Codex's actual implementation for that specific capability first (already done for this proposal's Phase 1-6 descriptions above), not just the catalog row. |
| Codebase Memory's "project index readiness" mechanism is referenced but not yet understood in detail. | Phase 4 explicitly scopes investigating it as its own first task, not assumed from the one-line flag, and is kept separate from Phase 3 (Context Mode) specifically so this unknown never blocks the clean case. |
| Serena's bootstrap/authorization flow is real UX complexity, not just a binary+MCP pair like Context Mode. | Phase 5 is its own phase, not grouped with the simpler binary+MCP capabilities, exactly because it isn't structurally the same. |
| Web Search's `buildReviewPlan` shape (an early special-cased block, not the generic per-capability loop) gets underestimated the way Task 4/5 originally were. | Sequenced last among the six real capabilities specifically because it's the most `buildReviewPlan`-shaped of them — the generic-loop pattern is proven by Phases 1-5 first. |
| `buildReviewPlan`'s safety/honesty revisit (Phase 7) could be skipped/forgotten once the "fun part" (Phases 1-6) ships. | Made its own explicit phase with its own verification, not a footnote — mirroring how this session has repeatedly found that "small, deferred" work needs its own real investigation, not an assumption it's simple. |

## Rollback plan

Each phase is additive to `packages/adapter-claude/` (capability catalog entries, MCP server
definitions, review-plan branches) plus reused shared infrastructure already proven for other
runners. Rolling back any single phase means reverting that phase's diff and the capability
reverts to `"gap"` — no other runner and no shared `packages/core` type is touched by any phase.
