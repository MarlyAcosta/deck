# Exploration: Shared Capability Registry Participation for Claude Code

## Outcome

Six capabilities report `"gap"` in Claude's capability catalog today (Context7, RTK, Serena,
Context Mode, Codebase Memory, Web Search) — confirmed live in this session by selecting Claude
in the TUI's package-selection flow and seeing nothing selectable. Codex already has a real,
working implementation of all six, making Codex's actual source the reference precedent for every
phase in this proposal, rather than a from-scratch design.

## Current state, confirmed by direct inspection

- `packages/adapter-claude/src/capability-catalog.ts`: all six entries carry the identical
  description `"Not yet scoped for Claude."` and `status: "gap"`.
- `packages/adapter-codex/src/capability-catalog.ts` (the reference): each capability has a real
  `provisionMode` (`reuse-shared-binary`, `reuse-shared-binary-plus-mcp`, `streamable-http-mcp`,
  `streamable-http-mcp-native-oauth`) and real detectors (`commands`, `mcpServerNames`).
- `packages/adapter-codex/src/mcp-config.ts`: real server definitions — Context7's exact
  streamable-HTTP URL and header, Serena's proxy command pointing at Deck's own
  `deck internal serena-mcp`, RTK's total absence of any MCP entry (binary-only).
- `packages/adapter-codex/src/runner-adapter.ts`'s `buildReviewPlan` (~110 lines): blocked-capability
  handling, `"static-compatible-gap"` diagnostics, Serena's own explicit-selection/bootstrap
  branching, and an early special-cased Web Search block before the generic per-capability loop.
- **Checked, not assumed:** whether a shared `packages/core` location already holds these values
  for cross-adapter reuse. It does not — `grep -rn "mcp.context7.com" packages/core/src` returns
  nothing. More tellingly, OpenCode's own Context7 wiring
  (`packages/adapter-opencode/src/capability-catalog.ts:126`, a local npm package
  `@upstash/context7-mcp`) is a completely different mechanism from Codex's (remote
  `streamable-http`) for the *same* physical service — confirming this codebase's real convention
  is per-adapter constants, not a shared registry, even where two adapters target the same
  service. This directly shaped `design.md`'s decision to define Claude's values independently
  (matching Codex's specific mechanism, since Claude's `.mcp.json` schema supports the same
  `type: "remote"`/`url` shape) rather than inventing a shared-core location that doesn't exist
  anywhere else in the codebase.
- **Not yet located**: Codex's actual "project index readiness" mechanism for Codebase Memory
  (`runtimeReadiness: "binary+mcp+index"` in its capability catalog is the only lead). Recorded
  honestly in `design.md`/`tasks.md` as Task 4's own first sub-task, not guessed at here.

## Scope decision trail

The user asked to see the full plan for all six capabilities before any code, then asked for
order/scope to be reviewed as part of writing spec/design/tasks — not assumed final from the
first proposal draft. Two corrections were made during that review, before advancing to `tasks.md`:

1. The first proposal draft grouped Context Mode and Codebase Memory into one phase (both
   `reuse-shared-binary-plus-mcp`). Split into separate phases (3 and 4) once it was clear
   Codebase Memory carries a real, unresolved unknown (the index-readiness mechanism) that should
   never be allowed to block or delay Context Mode's fully-understood, clean case.
2. The first draft deferred all `buildReviewPlan` work to a single final phase. Corrected: each
   of Phases 1-6 needs its own *minimal* `buildReviewPlan` extension to become selectable/actionable
   at all (the same way `add-claude-code-runner-support`'s own Phase 6 built the original bare
   version); the final phase is specifically about the safety/honesty machinery (blocked-capability
   handling, `static-compatible-gap` diagnostics) that isn't needed for basic function.

Supermemory was excluded from the very first draft and stayed excluded through both review
passes — it is materially larger than the other six combined (Codex's own equivalent needed
several dedicated, now-archived OpenSpec changes) and remains its own future proposal.
