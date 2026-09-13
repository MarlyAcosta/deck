# Design: Shared Capability Registry Participation for Claude Code

## Decision: per-adapter constants, matching this codebase's actual convention

Checked before designing, not assumed: does a shared `packages/core` location already hold
Context7's URL or Serena's proxy command, that Claude could simply import? No —
`grep -rn "mcp.context7.com" packages/core/src` returns nothing. More tellingly, OpenCode's own
Context7 wiring (`packages/adapter-opencode/src/capability-catalog.ts:126`,
`source: "@upstash/context7-mcp"`, a local npm-installed MCP server) is a **completely different
provisioning mechanism** from Codex's (`packages/adapter-codex/src/mcp-config.ts:306`,
`streamable-http` to a remote URL) — for the same physical Context7 service. This codebase's
established pattern is: each adapter defines the values that match *its own runner's* actual MCP
client capabilities, even when two adapters happen to target the same underlying service the same
way. There is no existing "shared capability constants" module to extend.

Claude's `.mcp.json` format (confirmed in `add-claude-code-runner-support`'s Phase 3,
`mcp-config.ts`) supports the same `type: "remote"`/`url` shape Codex's `streamable-http` maps to
— so Claude's Context7/Serena values will match Codex's specific values (not OpenCode's, which
uses a mechanism Claude's `.mcp.json` schema doesn't need), defined as Claude's own constants with
a comment tying them to Codex's matching definition, per REQ-CSC-CTX7-001/ISO-001.

## Phase 1 — RTK: package layout — DONE

- `packages/adapter-claude/src/capability-catalog.ts`: `rtk`'s entry status changed from `"gap"`
  to `"shared"` (a new member added to `ClaudeCapabilityStatus`).
- Binary detection: confirmed the exact shared function by reading Codex's real call site
  (`packages/adapter-codex/src/runner-adapter.ts:620`) — `checkSharedBinaryUsability`, exported
  from `packages/core/src/shared-binary-usability.ts`. Reused directly, not reimplemented.
- `getCapabilityInventory`: a new `#rtkCapabilityEntry` method runs the real check for `rtk`
  specifically; `#toCatalogEntry` gained an optional `overrides` parameter so the result flows
  through the same shared entry-building path every capability uses.
- **`buildReviewPlan` needed no change** — corrected from the original plan after reading Codex's
  actual `buildReviewPlan` loop: `rtk` is not among the capability IDs that produce any
  `configWrites`/manual-step action when selected there either. A `reuse-shared-binary` capability
  that's already present needs no install-time action, only an accurate status — which
  `getCapabilityInventory` alone now provides. Claude's existing unconditional `buildReviewPlan`
  already produces the same (correct) no-action outcome Codex's does for this specific capability.

## Phase 2 — Context7: package layout

- `packages/adapter-claude/src/mcp-config.ts`: a new exported constant (e.g.
  `CLAUDE_CONTEXT7_MCP_ENTRY`) matching Codex's `mcp-config.ts:306` exactly, commented to name
  that source line as the value's origin.
- `writeClaudeMcpConfig` gains no new logic — it already accepts an arbitrary server entry; this
  phase supplies a real one instead of the capability never reaching that call at all.
- `capability-catalog.ts`: `context7` moves `"gap"` -> `"supported"` (matching Codex's status for
  this capability, not `"shared"` — it is not a binary-reuse capability).

## Phase 3 — Context Mode: package layout

- Same shape as Phase 2 plus Phase 1's binary check, combined: `capability-catalog.ts`'s
  `context-mode` moves to `"shared"` (matching Codex); a new MCP entry constant plus the existing
  binary-presence helper.
- No new mechanism versus Phases 1-2 — this phase is explicitly their composition, which is
  exactly why it's sequenced after both are proven independently.

## Phase 4 — Codebase Memory: the unresolved unknown, and how it gets resolved

**Not yet designed in detail — REQ-CSC-CBM-002 requires reading Codex's actual "project index
readiness" mechanism before any Claude-side design commitment is made here.** What's known so far
from `packages/adapter-codex/src/capability-catalog.ts:32`:
`runtimeReadiness: "binary+mcp+index"` — a third readiness dimension beyond binary-presence and
MCP-config-presence. Where and how Codex computes "index readiness" was not located during this
proposal's exploration pass. This phase's first task is that investigation; its design section
will be filled in once that's done, not before.

## Phase 5 — Serena: package layout

- `packages/adapter-claude/src/mcp-config.ts`: a Serena entry pointing at
  `command: "deck", args: ["internal", "serena-mcp"]` — the exact same Deck-owned proxy
  `packages/adapter-codex/src/mcp-config.ts:12-14` defines (`CODEX_SERENA_PROXY_COMMAND`/`_ARGS`/
  `_ENV_VARS`). Since this proxy is Deck's own (invoked via `deck internal serena-mcp`, not a
  Codex-specific binary), Claude's entry is structurally identical, not merely similar.
- `buildReviewPlan`: the explicit-selection + bootstrap branching
  (REQ-CSC-SER-002) is new logic for Claude's `buildReviewPlan` — this is the first phase that
  actually needs Phase 7-shaped machinery (a manual step, an authorization-required state) ahead
  of Phase 7 itself. Recorded here as the reason Phase 7 says "at least one of Phases 1-6" rather
  than "all of them" — Serena's own needs partially motivate it.

## Phase 6 — Web Search: package layout

- Reuses the existing shared Web Search subsystem (provider selection, Tavily, the
  profile-scoped credential) — confirmed already runner-neutral per `docs/runner-support.md`.
  Claude-specific work is limited to: (a) the MCP-materialization step for Claude's `.mcp.json`
  (following whatever native command the selected provider resolves to — same shape as
  Codex/OpenCode/Pi's own Web Search MCP materialization), and (b) `buildReviewPlan`'s early
  special-cased block (REQ-CSC-WS-002), mirroring Codex's
  `if (state.selectedCapabilities["web-search"] !== undefined) { configWrites.push(...) }`
  placed before the generic per-capability loop, not folded into it.

## Phase 7 — `buildReviewPlan` safety/honesty revisit: package layout

- `packages/adapter-claude/src/runner-adapter.ts`'s `buildReviewPlan`: add the
  `blockedCapabilityIds`/`staticCompatibleGapIds` tracking and `addStaticCompatibleGap`/
  `addBlockedCapability` helper pattern Codex's version has (`runner-adapter.ts:957-979`),
  generalized across whichever of the six capabilities from Phases 1-6 have landed by the time
  this phase starts.
- Explicitly not a redesign — Codex's pattern is reused directly, the same way every other phase
  in this proposal reuses Codex's proven shape rather than inventing a new one.

## Cross-cutting: mutation-preview and doctor visibility

Every phase's MCP writes flow through the same `writeClaudeMcpConfig` already covered by
`add-claude-code-runner-support`'s own mutation-preview and doctor-visibility work — no new
preview/doctor plumbing is anticipated. If a phase's implementation finds otherwise (mirroring how
`add-claude-global-install-scope` found the `mutationPreview`/`CLAUDE.md`-path gaps only by
exercising the real path), that finding gets recorded with the same rigor before being fixed, not
assumed away in this design document.
