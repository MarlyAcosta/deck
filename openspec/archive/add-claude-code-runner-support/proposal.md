# Proposal: Add Claude Code CLI Runner Support

## Intent

Add Claude Code (`claude`) as a first-class Deck runner that can install, verify, diagnose,
and launch the Developer Team using Claude-native `CLAUDE.md` memory, `.claude/agents/`
subagents, `.mcp.json` MCP configuration, and models, while preserving user-owned
configuration and existing Pi/OpenCode/Codex behavior. This mirrors the staged approach used
for `add-first-class-codex-runner-support`.

## Current state

Claude Code is **detection only**: `apps/cli/src/runtime-detection.ts:28-32` checks whether
`claude` exists on `PATH` and stops there. No `packages/adapter-claude` package exists, no
entry is registered in `apps/cli/src/runner-adapters.ts`, and no prior `openspec/changes/`
proposal targets a Claude adapter. This is confirmed by direct inspection of the repository
(not inferred from documentation alone).

Using a Claude *model* inside OpenCode/Pi/Codex already works today via the existing
`anthropic` provider entries in `packages/core/src/model-catalog.ts:71,133-147` — that path
needs no new code and is out of scope here. This proposal is only about Claude Code itself
becoming a driven runner, with its own tool-use loop, permissions, hooks, and subagents.

## User outcome

A user can select Claude Code in Deck, review its capabilities, safely materialize the
Developer Team to `CLAUDE.md` + `.claude/agents/*.md`, configure supported MCP servers via
`.mcp.json`, and launch Claude Code interactively or non-interactively (`exec`, resume-by-id,
resume-latest). Unsupported capabilities are visible as gaps, never silently omitted or
represented as parity with OpenCode.

## Scope

### In scope (initial release)

- A new `@deck/adapter-claude` package implementing `RunnerAdapter`
  (`packages/core/src/runner-adapter.ts`).
- Registration in `apps/cli/src/runner-adapters.ts`, the sole composition point for concrete
  adapter packages.
- Runner-neutral launch plans (`RunnerLaunchPlan`) built by the adapter and spawned by the CLI,
  exactly as Pi/OpenCode/Codex already work — the adapter never owns the process.
- Subprocess-based launch via `claude -p` (headless mode): `interactive`, `exec`,
  `resume-by-id`, `resume-latest`.
- A single, adapter-owned, always-applied Deck launch policy (Deck's equivalent of Codex's
  `--dangerously-bypass-approvals-and-sandbox`), surfaced as a visible diagnostic, never
  caller-overridable.
- Per-launch role/system-prompt injection via `--append-system-prompt`, bounded and sanitized,
  without mutating the user's global `~/.claude/settings.json`.
- `.mcp.json` project-scoped MCP server materialization.
- `CLAUDE.md` (owned marker-span merge, never a blind overwrite) plus `.claude/agents/*.md`
  Developer Team role materialization.
- An instruction-translation module for the shared bundles
  (`packages/core/src/teams/developer/instruction-bundles/*`), expected to be close to
  identity/pass-through, since those bundles are already written in Claude-native vocabulary
  (confirmed by reading `packages/adapter-codex/src/instruction-translation.ts:1-38`, which has
  to actively strip that vocabulary for Codex).
- Reuse of the existing `anthropic` model catalog entries for model assignment.
- A `compatibility.ts` module capturing `claude --help` / `claude -p --help` fixtures (no
  network at test time), mirroring `packages/adapter-codex/src/compatibility.ts`.
- Explicit capability mapping and gaps for Claude Code, following the Codex precedent of never
  claiming parity that isn't proven.

### Out of scope for the initial release

- The Claude Agent SDK as an alternative execution path. Every existing adapter conforms to
  the "adapter plans a subprocess, CLI spawns it" shape in `RunnerLaunchPlan`
  (`packages/core/src/runner-adapter.ts:202-225,732`); the SDK runs Claude in-process instead,
  which would require reshaping a contract every other adapter depends on, for no capability
  we actually need — session resume, system-prompt injection, structured JSON output, and MCP
  config are all reachable through `claude -p` flags. See "Proposed architecture" below.
- Full capability-catalog and doctor-diagnostics parity with OpenCode on day one. Codex itself
  shipped staged, as `static-compatible` beta before broader parity; Claude follows the same
  staging.
- Persisting `ANTHROPIC_API_KEY` or any credential in project files. Deck relies on the user's
  existing `claude` authentication (subscription login or environment variable), matching how
  Deck already treats Codex/OpenCode credentials.
- Any change to global `~/.claude/settings.json`. All Deck-driven overrides are per-launch or
  project-scoped.
- Automatically trusting a project or bypassing Claude Code's own project-trust prompts beyond
  the one documented, always-visible launch policy.
- A full formal trusted-execution-host bridge equivalent to Codex's Phase 0.4 spike (dossier
  continuity, one-use invocation authorization, controlled effects, centralized registry). Claude
  Code's hook surface should be evaluated for this in a later change once the base adapter is
  proven; the initial release is explicitly classified `static-compatible`, not first-class in
  the parity-registry sense, matching Codex's own honesty about this gap.

## Proposed architecture

1. `RunnerAdapter` remains the single operational runner port; `AdapterRegistry`
   (`packages/core/src/adapter-registry.ts`) remains the only runtime composition registry.
2. Claude Code is driven as a **subprocess** (`claude -p ...`), not via the Claude Agent SDK.
   Rationale: the SDK embeds Claude's harness in-process as a library call, which does not fit
   the "adapter plans a command, CLI spawns it, adapter never owns the process" invariant shared
   by Pi/OpenCode/Codex. Adopting subprocess keeps this a pure additive package with zero
   changes to `packages/core`.
3. `@deck/adapter-claude` owns runner-native inspection, `.mcp.json`/`CLAUDE.md`/`.claude/agents`
   materialization, semantic verification, backup, and rollback, behind the same typed
   project-scoped contracts Codex uses. The CLI owns authorization, orchestration, and the
   actual launch/spawn.
4. Deck's launch-policy token (permission bypass) is a single, fixed, adapter-owned value —
   never assembled from caller input — with an argv-invariant check that blocks launch if
   violated, mirroring Codex's `hasOwnedBypassPolicy` (`packages/adapter-codex/src/launch.ts:74-78`).
5. Config file writes reuse the safe JSON merge-not-overwrite approach already proven for
   OpenCode's `opencode.json` (`packages/adapter-opencode/src/config-merge.ts`), since
   `.mcp.json` and `.claude/settings.json` are JSON like `opencode.json`. `CLAUDE.md` is free
   text and needs an owned marker-span merge like Codex's `AGENTS.md` handling — never a blind
   overwrite of user content.

## Delivery strategy

Each phase produces a usable, independently verifiable vertical. Claude support does not wait
for full OpenCode-level parity before anything ships — the same principle used for Codex.

1. **Phase 0 — Compatibility and safety spikes.** Capture `claude --help`/`claude -p --help`
   fixtures; confirm exact current flag names (`--append-system-prompt`, `--output-format`,
   `--permission-mode` values, `--resume`/`--continue`, `.mcp.json` schema) against a live
   install; decide Deck's fixed launch-policy token; decide the output-capture contract for
   `-p --output-format json` (stdout JSON, not a tmpfile like Codex's
   `--output-last-message`).
2. **Phase 1 — Minimal composition and detection.** Scaffold `@deck/adapter-claude`, register
   it in `runner-adapters.ts`, implement `detectRuntimes`/`inspectProject` beyond today's
   PATH-only check.
3. **Phase 2 — Launch.** `buildLaunchPlan` for all four modes over subprocess, with the same
   bounded-scalar/no-argv-injection safety rigor as Codex's `launch.ts`.
4. **Phase 3 — Developer Team materialization.** `.mcp.json` writer, `CLAUDE.md` +
   `.claude/agents/*.md` generation, instruction translation (expected near-identity),
   backup/rollback, verification.
5. **Phase 4 — Models, capability catalog, doctor.** Wire the existing Anthropic model catalog
   entries, build the capability inventory, add `diagnoseProject` for `deck doctor`.
6. **Phase 5 — Documentation and hardening.** Update `docs/runners.md`,
   `docs/runner-support.md`, `docs/reference/support-matrix.md` to move Claude from
   "Detection only" to its earned status; add release-gate coverage.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Exact CLI flag names/behavior may have drifted from what documentation research surfaced. | Phase 0 requires confirming every flag against a live `claude --help`/`claude -p --help` before `compatibility.ts` locks them into fixtures — never trust research output as ground truth for argv construction. |
| A caller-controlled or malformed launch input could inject extra argv/permission changes. | Reuse Codex's bounded-scalar validation and single-owned-policy-token invariant pattern exactly; add contract tests for the negative cases (malformed session id, oversized prompt, injected flags). |
| `.mcp.json`/`CLAUDE.md` writes could clobber user-authored content. | Reuse OpenCode's safe JSON merge for `.mcp.json`/`settings.json`; use an owned marker-span merge for `CLAUDE.md`, never a full overwrite. |
| Claiming more parity than is proven (same failure mode Codex explicitly avoided). | Classify the initial release `static-compatible`, document exact gaps in the capability catalog, and do not update `docs/reference/support-matrix.md` to claim more than what Phase 0-4 actually deliver. |

## Rollback plan

The entire change is additive: a new package plus a small registration diff in
`runner-adapters.ts` (one import, one registry-options field, one `register()` call). Rollback
is reverting that diff and deleting `packages/adapter-claude/`; no other adapter, no shared
`packages/core` type, and no existing runner's behavior is modified by this change.
