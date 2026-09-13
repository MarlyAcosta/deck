# Proposal: Add Global Install Scope for Claude Code

## Intent

Let a user materialize Deck's Developer Team for Claude Code once, at the user level
(`~/.claude/agents/`, `~/.claude/skills/`, `~/.claude/CLAUDE.md`), instead of being required to
repeat `deck claude developer` installation in every project — mirroring the "configure once,
available everywhere" experience Deck's OpenCode adapter already provides by default.

## Current state

Confirmed by direct inspection, not assumed:

- `packages/adapter-claude/src/developer-team-install.ts` and `packages/adapter-claude/src/transaction.ts`
  resolve every file path as `join(projectRoot, relativePath)`, where `relativePath` is always
  one of `.claude/agents/<id>.md`, `.claude/skills/<id>/SKILL.md`, or `CLAUDE.md`. `projectRoot`
  is always `resolveProjectRoot() ?? process.cwd()`, computed once in `apps/cli/src/main.tsx:205`
  before `runRunnerLaunch` is called. There is no scope concept anywhere in the Claude adapter —
  every install is project-local, unconditionally.
- `packages/adapter-opencode/src/runner-adapter.ts:751` (and 5 other call sites) resolve OpenCode's
  Developer Team config directory as `this.#developerTeamConfigDir ?? join(homedir(), ".config", "opencode")`
  — i.e. OpenCode's *default*, unless overridden, is the user's global config directory. This is
  why a user who configured OpenCode once continues to see the same Developer Team setup in every
  project without repeating the install step.
- Live-verified in this session, not assumed from public documentation: Claude Code loads both
  user-level subagents (`~/.claude/agents/*.md`) and user-level skills (`~/.claude/skills/<id>/SKILL.md`)
  from an unrelated project directory with zero project-local `.claude/` configuration. A temporary
  probe agent (`deck-global-probe-temp`) invoked via its trigger phrase was spawned
  (`subagent_stats.by_type: {"deck-global-probe-temp": 1}`) and returned its exact expected output;
  a temporary probe skill invoked via `/deck-global-skill-probe-temp` returned its exact expected
  output (`"result":"GLOBAL_SKILL_LOADED"`). Both test files were removed immediately after
  verification; no persistent change was made to the user's real `~/.claude/` directory during
  exploration.
- `~/.claude/CLAUDE.md` global-memory loading is already implicitly proven by every session in
  this environment: the live system prompt for this conversation includes content sourced from
  the user's own `~/.claude/CLAUDE.md` (`@RTK.md` inclusion), confirming Claude Code reads
  user-level `CLAUDE.md` today, independent of this change.

## User outcome

`deck claude developer` materializes the Developer Team at the user level
(`~/.claude/agents/`, `~/.claude/skills/`, `~/.claude/CLAUDE.md`) **by default** — one install,
available in every project Claude Code is opened in afterward, exactly matching the OpenCode
workflow the user already relies on. An explicit `--project` flag opts into today's
project-scoped-only behavior for the rare case a user wants an isolated, project-specific
Developer Team instead of (or in addition to) the global one.

This is a deliberate default flip from the initial design draft, made at the user's explicit
request: parity with OpenCode's actual UX (configure once, global) matters more than minimizing
behavioral change from `add-claude-code-runner-support`'s Phase 1-7 default. Recorded here as a
conscious decision, not a silent reversal — see `design.md`'s "Decision: default flips to global"
section for the full reasoning and what it costs.

## Scope

### In scope (initial release)

- `deck claude developer` (all launch modes: install-only, dry-run, interactive, exec, resume)
  resolves its install root to the user's home directory **by default** — no flag required. A new
  `--project` flag opts into today's `add-claude-code-runner-support` behavior (install root is
  `resolveProjectRoot() ?? process.cwd()`) for a user who explicitly wants a project-isolated
  install instead. No change to `resolveProjectRoot()` itself, no change to any other runner's
  CLI grammar or default.
- Reuse of every existing root-parameterized function in `packages/adapter-claude/src/developer-team-install.ts`
  and `transaction.ts` unchanged — they already accept an arbitrary root and join relative paths
  against it; global scope is a caller-supplied root, not a new code path through those modules.
- Zero changes to `packages/core`'s shared `RunnerAdapter`/`DeveloperTeamAdapterInstallInput` types,
  and zero changes to Pi/OpenCode/Codex adapters or their CLI grammars. This is additive and
  Claude-scoped only.
- Doctor and capability-inventory visibility for the global install path (so `deck doctor` can
  report on it) is deferred to a later task within this same change, not a separate proposal —
  see Task 4 in `tasks.md`.

### Out of scope for the initial release

- A TUI menu toggle for global-vs-project scope. The interactive dashboard's install flow
  (`installTeamBundle` in `apps/cli/src/tui/app.tsx`) is unconditionally project-scoped today;
  adding a scope-selection screen there is real UI work, tracked as an explicit deferred task
  (Task 5), not silently dropped.
- Any policy for reconciling a project-local and a global install that both exist and conflict
  (e.g. a same-named agent with different content in both places). Claude Code's own precedence
  rule between project- and user-level subagents was not verified live in this exploration pass
  (a real gap, recorded honestly in `design.md`, not assumed); Deck does not attempt to detect or
  resolve such a conflict in the initial release — it materializes each scope independently and
  trusts Claude Code's own resolution.
- Global install support for Codex or Pi. Codex's own subagent/role convention
  (`.codex/agents/*.toml`) is project-scoped by Codex's own design in the current adapter; whether
  Codex supports an equivalent user-level location is unresearched and explicitly not addressed
  here.
- The Supermemory/shared-capability-registry work (Context7, Serena, RTK, Context Mode, Codebase
  Memory, Web Search, Supermemory) flagged as a known gap in `add-claude-code-runner-support`.
  That remains its own, separate, future proposal — never bundled into this one.

## Proposed architecture

1. `resolveClaudeInstallRoot(cwdProjectRoot: string, scope: "global" | "project"): string` — a
   small, pure, Claude-adapter-local helper: returns `homedir()` when `scope` is `"global"`
   (the new default), or `cwdProjectRoot` unchanged when `scope` is `"project"` (today's only
   prior behavior, now opt-in). This is the *only* new path-resolution logic; every downstream
   function keeps taking a plain root string exactly as it does today.
2. `apps/cli/src/cli-args.ts`'s `parseClaudeArgs` gains a `--project` flag (composes with
   `--install-only`, `--dry-run`, `--yes`, and every launch mode), parsed into a new
   `scope: "global" | "project"` field on the Claude branch of `ParsedArgs`, defaulting to
   `"global"` when `--project` is absent.
3. `apps/cli/src/main.tsx`'s `runner-launch` dispatch (`main.tsx:203-208`) calls
   `resolveClaudeInstallRoot` instead of using `resolveProjectRoot() ?? process.cwd()` directly,
   gated on `parsed.runnerId === "claude"` — every other runner's dispatch path is byte-for-byte
   unchanged.
4. No change to `buildClaudeDeveloperTeamInstallPlan`, `backupClaudeFiles`, `applyClaudeFiles`,
   `rollbackClaudeFiles`, or `verifyClaudeFiles` — they already accept and correctly use whatever
   root string they're given.

## Delivery strategy

1. **Task 1 — Root resolution and CLI flag.** `resolveClaudeInstallRoot`, `--project` parsing
   (default `"global"`), and the `main.tsx` dispatch gate. Live-verified: `deck claude developer --dry-run`
   with no flag, from an arbitrary project directory, previews `~/.claude/...` paths by default;
   `deck claude developer --project --dry-run` previews the project's own paths, unchanged from
   `add-claude-code-runner-support`'s existing behavior.
2. **Task 2 — Full apply/rollback/verify round trip at global scope.** Prove the existing
   transaction functions work correctly when handed `homedir()` as the root, on a real (isolated)
   filesystem — not just the dry-run preview path.
3. **Task 3 — Documentation.** Update `docs/runners.md`'s Claude section and `docs/runner-support.md`'s
   Claude quick path to describe the new global-by-default behavior and the `--project` opt-in,
   with the same honesty standard `add-claude-code-runner-support` set (explicit note on the
   project-vs-global precedence gap, resolved live by Task 2 before this task writes anything).
4. **Task 4 — Doctor/capability-inventory visibility (deferred within this change).**
5. **Task 5 — TUI scope-selection screen (deferred within this change).**

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| A user's real `~/.claude/agents/`/`~/.claude/CLAUDE.md` already has unrelated, hand-authored content. | Every existing collision/ownership check in `developer-team-install.ts` (`isClaudeOwnedContent`, the marker-span merge for `CLAUDE.md`) already guards against overwriting non-Deck-owned content — this is inherited for free, not rebuilt, because global scope reuses the exact same functions. |
| Claude Code's real precedence between a project-local and a global same-named agent is unknown. | Documented as an explicit, honest gap (not tested live in this pass) in `design.md`'s Risks section and in the user-facing docs update (Task 3) — Deck does not claim a resolution it hasn't verified. |
| Default flip surprises anyone who already ran `deck claude developer` under `add-claude-code-runner-support` expecting project-scoped output. | This adapter shipped in the same unreleased branch as this change (never in a published Deck release), so there is no external user base whose established behavior this breaks — recorded here for honesty, not because a real regression exists today. The launch preview always shows the actual resolved paths before `--yes` is required, so even a surprised user sees the real destination before anything is written. |
| A user runs `deck claude developer --yes` (no `--dry-run`) out of habit from before the default flip, not realizing it now writes to `$HOME` instead of the project. | Every diagnostic and mutation-preview line already names the actual resolved paths; `--install-only`/apply output is not silent about destination. No additional confirmation gate is added beyond what already exists, since the existing preview mechanism already carries this information. |

## Rollback plan

Entirely additive: a new pure function, a new CLI flag, and one conditional branch in one dispatch
site. Rollback is reverting that diff, which restores project-scoped-only behavior (this change's
own default flip is what would be undone) — no other runner and no shared `packages/core` type is
touched by this change or its rollback.
