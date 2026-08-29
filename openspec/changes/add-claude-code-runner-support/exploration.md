# Exploration: Claude Code CLI Runner Support

## Outcome

Deck can add Claude Code as an operational runner without touching any shared type in
`packages/core`. Unlike the Codex change, `RunnerAdapter` and `RunnerLaunchPlan` already exist
in their final runner-neutral shape — they were generalized specifically so a new runner is
"an adapter package plus one registration line," not a core change. The one open architectural
question — subprocess vs. Claude Agent SDK — has a clear answer: subprocess, because every
other adapter's shared contract assumes the CLI spawns an external command, and the SDK runs
Claude in-process instead.

## Current state, confirmed by direct inspection (not inferred from docs)

- `apps/cli/src/runtime-detection.ts:17-38` — Claude Code detection is exactly `commandExists("claude")`
  against `PATH`. Nothing else.
- No `packages/adapter-claude` directory exists in the repository.
- `apps/cli/src/runner-adapters.ts` — "the SOLE place that imports concrete adapter packages" —
  registers only `pi`, `opencode`, and `codex`.
- `grep -rli "claude code"` and `grep -rli "claude mcp"` across the repository found no partial
  implementation, design doc, or `openspec/changes/` proposal targeting a Claude runner adapter.
  The only Claude-related content is (a) skill markdown authored *in* Claude Code as a tool, not
  targeting it as a runner, and (b) the Codex adapter's `instruction-translation.ts`, which
  strips Claude-native vocabulary (hook interception of `Grep`/`Glob`, `WebFetch`) out of the
  shared instruction bundles — meaning those bundles were originally authored in Claude Code's
  own vocabulary, even though no adapter for it exists.
- Using a Claude *model* inside OpenCode/Pi/Codex already works today:
  `packages/core/src/model-catalog.ts:71,133-147` lists `anthropic` as a provider and
  `anthropic/claude-sonnet-4`/`claude-opus-4`/`claude-haiku-4` as selectable models, independent
  of any Claude Code runner adapter. This proposal does not touch that path.

## The `RunnerAdapter` contract (`packages/core/src/runner-adapter.ts`, read in full)

- Identity: `runnerId`, `displayName`, `environmentIds` (required); everything else on the
  interface is an optional (`?`) method — a new adapter can start narrow and grow.
- The launch surface (`RunnerLaunchInput`/`RunnerLaunchPlan`/`RunnerLaunchResult`,
  lines 196–230) is a discriminated union over `interactive | exec | resume-by-id |
  resume-latest`, and explicitly documents "The CLI remains the sole process owner" (line 732)
  — adapters only *plan* a command; they never spawn it.
- `writeMcpConfig` and `buildDeveloperTeamInstallPlan`/`applyDeveloperTeamInstall` are the
  materialization surface; `verifyDeveloperTeamInstall`/`backupDeveloperTeamFiles`/
  `rollbackDeveloperTeamFiles` are the safety net every existing adapter implements.

## Reference adapters

- **OpenCode** (`packages/adapter-opencode/src/`, 64 files) is the "fully supported" example:
  safe JSON merge into `opencode.json` (`config-merge.ts`), MCP entries with an
  own-and-verify pattern (not just declare-and-trust), `.opencode/skills/{id}/SKILL.md`
  materialization, and a deliberate no-op for OpenCode's own `sdd-*` command files (adapters may
  scope what they touch narrowly).
- **Codex** (`packages/adapter-codex/src/`, 19 files, ~7.4k lines) is the closest architectural
  precedent for Claude: subprocess-launched (`launch.ts`), with rigorous argv safety —
  bounded/sanitized scalars, a single fixed policy token
  (`--dangerously-bypass-approvals-and-sandbox`) validated by an `hasOwnedBypassPolicy`
  invariant that blocks launch rather than risk an uncertain policy, and file-based output
  capture via `--output-last-message <tmpfile>`. It shipped labeled `static-compatible`, with
  six named, explicitly tracked gaps rather than claiming parity it hadn't earned. It uses
  source-range-aware TOML editing for `.codex/config.toml`, which Claude does not need since
  `.mcp.json`/`.claude/settings.json` are JSON.

## Anthropic-side research (headless mode, Agent SDK, MCP, CLAUDE.md/subagents)

- `claude -p` (headless/print mode) supports the launch modes Deck needs: structured JSON
  output, session resume, and per-invocation system-prompt append — all without touching global
  `~/.claude/settings.json`.
- The Claude Agent SDK embeds Claude's harness as an in-process library call rather than
  spawning a subprocess. It offers real advantages (no subprocess overhead, typed config,
  dynamic per-tool-call approval callbacks) for someone building a bespoke agent host, but none
  of those advantages are needed here, and adopting it would require reshaping the shared
  `RunnerLaunchPlan` contract every other adapter depends on. Decision: subprocess.
- `.mcp.json` (project-scoped MCP servers) and `CLAUDE.md` (project memory) plus
  `.claude/agents/*.md` (subagents) are the idiomatic Claude Code equivalents of what Deck
  already materializes for OpenCode/Codex as the "Developer Team."
- One concrete open question flagged for Phase 0, not resolved here: whether Claude Code's
  headless JSON result lands on stdout directly (most likely) or via a file like Codex's
  `--output-last-message` — this determines the exact shape of the adapter's `outputCapture`
  implementation and must be confirmed against a real `claude -p --output-format json` run
  before being encoded into fixtures.
- Exact current flag spellings (`--append-system-prompt`, `--output-format`,
  `--permission-mode` values, `--resume`/`--continue`) come from documentation research and are
  explicitly flagged as needing confirmation against a live `claude --help` — not treated as
  verified ground truth by this exploration.

## Reusable Deck components

- `packages/core/src/model-catalog.ts` — existing `anthropic` provider/model entries.
- `packages/adapter-opencode/src/config-merge.ts` pattern — safe JSON merge for `.mcp.json` and
  `.claude/settings.json`.
- Codex's marker-span ownership pattern for `AGENTS.md` — reused for `CLAUDE.md`.
- Codex's `hasOwnedBypassPolicy`-style argv invariant — reused for Deck's Claude launch-policy
  token.
- The shared Developer Team instruction bundles
  (`packages/core/src/teams/developer/instruction-bundles/*`) — expected to need no rewriting
  for Claude, unlike Codex's active translation pass.

## Non-goals surfaced during exploration

- No attempt to reach the same trusted-execution-host rigor Codex's design requires
  (dossier continuity, one-use invocation authorization) — Claude's hook system is a plausible
  future candidate surface but evaluating it is explicitly out of scope for this change.
- No credential persistence of any kind — matches Deck's existing policy for Codex/OpenCode.
