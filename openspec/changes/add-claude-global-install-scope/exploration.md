# Exploration: Global Install Scope for Claude Code

## Outcome

Global install scope for Claude Code requires no changes to the materialization/transaction
logic Phases 1-7 of `add-claude-code-runner-support` already built — only a caller-supplied root
string differs. The user's request to make global the *default* (not an opt-in) is accepted:
`add-claude-code-runner-support` has never shipped in a published Deck release, so there is no
real external behavior this breaks.

## Current state, confirmed by direct inspection (not inferred from docs)

- `packages/adapter-claude/src/developer-team-install.ts` and `packages/adapter-claude/src/transaction.ts`
  resolve every file path as `join(projectRoot, relativePath)` where `relativePath` is always
  `.claude/agents/<id>.md`, `.claude/skills/<id>/SKILL.md`, or `CLAUDE.md`. Neither module inspects
  or special-cases what `projectRoot` actually points at — read every call site in both files to
  confirm this, not assumed from the function names.
- `projectRoot` is computed exactly once, in `apps/cli/src/main.tsx:205`, as
  `resolveProjectRoot() ?? process.cwd()`, before `runRunnerLaunch` is invoked. This is the single
  injection point for a different root value.
- `packages/adapter-opencode/src/runner-adapter.ts:751` (and 5 more call sites in the same file)
  resolve OpenCode's own Developer Team config directory as
  `this.#developerTeamConfigDir ?? join(homedir(), ".config", "opencode")` — global is already
  OpenCode's *default*, with project-scoped as a theoretical override that nothing in the CLI
  currently exercises. This is why the user's existing OpenCode workflow persists across projects
  without a repeated install step, and is the direct UX precedent this change matches for Claude.

## Live verification, not assumed from public documentation

Performed with explicit user permission (asked before touching the real `~/.claude/` directory;
both artifacts removed immediately after each test):

1. **Global subagent loading.** Created `~/.claude/agents/deck-global-probe-TEMP.md` (trigger
   phrase "activate global probe", body instructs replying with exactly `GLOBAL_SUBAGENT_LOADED`).
   Ran `claude -p --permission-mode bypassPermissions --output-format json "activate global probe"`
   from `/tmp/unrelated-project-no-claude-config` (a fresh directory with no local `.claude/`
   content at all). Result JSON: `"subagent_stats":{"spawned":1,...,"by_type":{"deck-global-probe-temp":1}}`,
   `"result"` text confirms the subagent ran and returned exactly the expected string. File removed
   immediately after (`rm` + `rmdir` to leave zero trace).
2. **Global skill loading.** Created `~/.claude/skills/deck-global-skill-probe-temp/SKILL.md`
   (invoked via `/deck-global-skill-probe-temp`, body instructs replying with exactly
   `GLOBAL_SKILL_LOADED`). Ran `claude -p --permission-mode bypassPermissions --output-format json "/deck-global-skill-probe-temp"`
   from the same unrelated directory. Result: `"result":"GLOBAL_SKILL_LOADED"`. Files removed
   immediately after.
3. **Global `CLAUDE.md` loading** was not separately tested with a synthetic probe — it is already
   implicitly proven by this very session: the system prompt for this conversation includes
   content sourced from the user's real `~/.claude/CLAUDE.md` (an `@RTK.md` inclusion), which only
   happens if Claude Code reads user-level `CLAUDE.md` on every session start, independent of any
   project.

## What was explicitly not verified (recorded as open risk, not assumed)

Whether a project-local `.claude/agents/deck-lead.md` and a global `~/.claude/agents/deck-lead.md`
with *different* content resolve predictably (project wins, global wins, both load and conflict,
or an error) was not tested in this pass. `design.md` and `spec.md` (REQ-CGS-RT-002) both record
this as a live check that Task 2 must close before the change is considered verified — common CLI
convention is not treated as a substitute for a real observation, matching the standard
`add-claude-code-runner-support`'s own REQ-CLD-COMPAT-003 already set for this codebase.

## Scope decision trail

Three drafts, not one — each correction came from direct user feedback, not self-review:

1. The initial proposal draft kept project-scoped as the default and added `--global` as opt-in,
   to minimize behavioral delta from the existing (unreleased) adapter. Rejected: the user wanted
   global by default, matching their actual OpenCode workflow.
2. The second draft flipped the default to global and added `--project` as an opt-in escape
   hatch. Rejected too: the user pointed out, after Task 1 was already implemented and verified
   under this design, that OpenCode's own CLI grammar (`apps/cli/src/cli-args.ts`) has no
   scope-related flag at all — `--project` invented a choice the reference implementation never
   offers, rather than actually mirroring it.
3. The third and shipped design has no flag, no parameter: `resolveClaudeInstallRoot()` always
   returns `homedir()`, and an unrecognized `--project` token is rejected by the existing
   unrecognized-argument path with no special-casing. Task 1's implementation (and its tests) were
   revised in place to match, and re-verified live.

Proposal, spec, design, and tasks were all revised in place after the second correction, before
advancing further; the full reasoning for both corrections is recorded in `design.md`'s "Decision
history: two rejected drafts, kept for honesty" section — kept there deliberately rather than
scrubbed, since the corrections themselves are evidence the process caught real gaps.
