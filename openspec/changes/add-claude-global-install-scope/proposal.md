# Proposal: Add Global Install Scope for Claude Code

## Intent

Make `deck claude developer` materialize Deck's Developer Team at the user level
(`~/.claude/agents/`, `~/.claude/skills/`, `~/.claude/CLAUDE.md`) always, with no scope choice —
one install, available in every project Claude Code is opened in afterward — mirroring exactly
how Deck's OpenCode adapter already behaves by default, with no flag or opt-out exposed there
either.

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
  — global is OpenCode's *only* behavior in practice: nothing in `apps/cli/src/cli-args.ts`'s
  OpenCode grammar exposes a flag to override it. This is why a user who configured OpenCode once
  continues to see the same Developer Team setup in every project without repeating the install
  step, and why the first draft of this proposal (which added a `--project` opt-in flag for
  Claude) did not actually match how OpenCode behaves — the user caught this directly and asked
  for it to be removed. See "Decision trail" below.
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

`deck claude developer` always materializes the Developer Team at the user level
(`~/.claude/agents/`, `~/.claude/skills/`, `~/.claude/CLAUDE.md`) — one install, available in every
project afterward. There is no scope flag, no per-invocation choice, and no project-scoped
alternative exposed — matching OpenCode's own CLI exactly, which never offered one either.
`add-claude-code-runner-support`'s prior project-scoped-only behavior is fully retired, not kept
as an opt-in.

## Decision trail (kept for honesty, not as active design)

Two drafts preceded this one, both revised after direct user feedback rather than assumed correct:

1. **First draft**: project-scoped remained the default; `--global` was the opt-in. Rejected by
   the user — they wanted Claude to behave like OpenCode, configure-once-everywhere, by default.
2. **Second draft**: global became the default; `--project` was added as an opt-in escape hatch
   "in case a user wants project isolation," reasoning that offering the option was safer/more
   flexible than removing it. The user rejected this too, pointing out directly that OpenCode's
   own CLI has no such flag at all — Deck never asked "project or global?" for OpenCode, so adding
   that question for Claude was inventing a choice the reference implementation doesn't have,
   not matching it.
3. **This draft**: no flag, no choice, always global. Verified against `apps/cli/src/cli-args.ts`
   that OpenCode's own grammar (`opencode developer [--yes] [--dry-run] [--install-only] [--memory=...]`)
   truly has nothing scope-related, confirming the third draft is the one that actually mirrors
   OpenCode rather than assuming it does.

## Scope

### In scope (initial release)

- `deck claude developer` (all launch modes: install-only, dry-run, interactive, exec, resume)
  always resolves its install root to the user's home directory. No flag exists to change this.
- Reuse of every existing root-parameterized function in `packages/adapter-claude/src/developer-team-install.ts`
  and `transaction.ts` unchanged — they already accept an arbitrary root and join relative paths
  against it; the global root is simply the one value the CLI now ever supplies for Claude.
- Zero changes to `packages/core`'s shared `RunnerAdapter`/`DeveloperTeamAdapterInstallInput` types,
  and zero changes to Pi/OpenCode/Codex adapters or their CLI grammars. This is additive and
  Claude-scoped only.
- A shared, runner-neutral improvement: the mutation-preview output now names the actually-resolved
  install root (`Install root: <path>`) for every runner, not only Claude — a transparency gap
  found live while verifying this change (a preview that never named its own destination), fixed
  once in the shared preview-rendering code rather than duplicated per runner.
- Doctor and capability-inventory global-root visibility (Task 4) and TUI adoption of the
  always-global root (Task 5) — both initially deferred, then completed in this same change after
  a proper investigation showed each was small (see `tasks.md` for the full account, including a
  real `CLAUDE.md`-path bug found only once Task 4/5 verification finally exercised a real
  install end-to-end).
- `diagnoseProject`'s fix (part of Task 4) is real but currently unreachable: `deck doctor` has no
  call site for it at all for Claude (a pre-existing gap from `add-claude-code-runner-support`,
  confirmed by inspection, not introduced here) — wiring one in is separately-scoped, not done
  here.

### Out of scope for the initial release

- Any project-scoped install path for Claude, in any form (flag, config setting, or otherwise).
  Retired, not offered as an opt-in — see "Decision trail" above.
- Wiring `deck doctor` to actually call `ClaudeRunnerAdapter.diagnoseProject` (mirroring Codex's
  `inspectCodex`). The method's own logic is fixed and correct (Task 4); the CLI-level wiring gap
  that makes it unreachable is a separate, pre-existing piece of work.
- Any policy for reconciling a project-local and a global install that both exist (e.g. content
  left over from `add-claude-code-runner-support`'s prior project-scoped behavior, or content a
  user placed by hand). Claude Code's own precedence rule between project- and user-level
  subagents was not verified live in this exploration pass (a real gap, recorded honestly in
  `design.md`); Deck does not attempt to detect or resolve such a conflict in the initial release.
- Global install support for Codex or Pi. Codex's own subagent/role convention
  (`.codex/agents/*.toml`) is project-scoped by Codex's own design in the current adapter; whether
  Codex supports an equivalent user-level location is unresearched and explicitly not addressed
  here.
- The Supermemory/shared-capability-registry work (Context7, Serena, RTK, Context Mode, Codebase
  Memory, Web Search, Supermemory) flagged as a known gap in `add-claude-code-runner-support`.
  That remains its own, separate, future proposal — never bundled into this one.

## Proposed architecture

1. `resolveClaudeInstallRoot(): string` — a small, pure, zero-argument, Claude-adapter-local
   helper: always returns `homedir()`. No parameter, because there is no longer a choice to
   parameterize. This is the *only* new path-resolution logic; every downstream function keeps
   taking a plain root string exactly as it does today.
2. `apps/cli/src/cli-args.ts`'s `parseClaudeArgs` gains no new flag. An unrecognized `--project`
   (or any other unknown token) is rejected exactly as any unrecognized Claude developer argument
   already is — no special-casing needed.
3. `apps/cli/src/main.tsx`'s `runner-launch` dispatch (`main.tsx:203-208`) calls
   `resolveClaudeInstallRoot()` instead of `resolveProjectRoot() ?? process.cwd()`, gated on
   `parsed.runnerId === "claude"` — every other runner's dispatch path is byte-for-byte unchanged.
4. No change to `buildClaudeDeveloperTeamInstallPlan`, `backupClaudeFiles`, `applyClaudeFiles`,
   `rollbackClaudeFiles`, or `verifyClaudeFiles` — they already accept and correctly use whatever
   root string they're given.

## Delivery strategy

1. **Task 1 — Root resolution and CLI dispatch.** `resolveClaudeInstallRoot()` (zero-argument),
   and the `main.tsx` dispatch gate. Live-verified: `deck claude developer --dry-run` from an
   arbitrary project directory previews `~/.claude/...` paths; the mutation preview names the
   resolved root explicitly (`Install root: /home/<user>`).
2. **Task 2 — Full apply/rollback/verify round trip at global scope.** Prove the existing
   transaction functions work correctly when handed `homedir()` as the root, on a real (isolated)
   filesystem — not just the dry-run preview path. Also close the project-vs-global precedence
   question live (leftover project-scoped content from before this change, or hand-authored
   content, versus the new global install).
3. **Task 3 — Documentation.** Update `docs/runners.md`'s Claude section and
   `docs/runner-support.md`'s Claude quick path to describe the always-global behavior, with the
   same honesty standard `add-claude-code-runner-support` set.
4. **Task 4 — Doctor/capability-inventory visibility.** `getCapabilityInventory` (real effect,
   used by the TUI) and `diagnoseProject` (correct but currently unreachable from `deck doctor` —
   a pre-existing gap) both now check the global root.
5. **Task 5 — TUI adoption of the always-global root.** One conditional in `runDashboardInstall`.
6. **Bug fix found during Task 4/5 verification — `CLAUDE.md`'s path.** Not a planned task; found
   by finally exercising a real install against real, pre-existing `~/.claude/CLAUDE.md` content.
   See `tasks.md` and `design.md` for the full account.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| A user's real `~/.claude/agents/`/`~/.claude/CLAUDE.md` already has unrelated, hand-authored content. | Every existing collision/ownership check in `developer-team-install.ts` (`isClaudeOwnedContent`, the marker-span merge for `CLAUDE.md`) already guards against overwriting non-Deck-owned content — this is inherited for free, not rebuilt, because the global root reuses the exact same functions. |
| Claude Code's real precedence between leftover project-local content (from before this change) and the new global install is unknown. | Documented as an explicit, honest gap (not tested live yet) in `design.md`'s Risks section and closed live in Task 2 before Task 3 writes any doc claiming a specific behavior. |
| A user who ran `deck claude developer` under `add-claude-code-runner-support` (project-scoped) expects that behavior to continue. | This adapter shipped in the same unreleased branch as this change (never in a published Deck release), so there is no external user base whose established behavior this breaks. The mutation preview always names the actual resolved root before `--yes` is required, so the destination is visible either way. |
| No escape hatch exists if a real, load-bearing need for project isolation surfaces later. | Accepted deliberately, at the user's explicit direction, in favor of matching OpenCode's simplicity exactly. If a real need surfaces, it is a new, separately-justified change — not something to speculatively build now. |

## Rollback plan

Entirely additive: a new pure function, and one conditional branch in one dispatch site. Rollback
is reverting that diff, which restores `add-claude-code-runner-support`'s original project-scoped
behavior — no other runner and no shared `packages/core` type is touched by this change or its
rollback.
