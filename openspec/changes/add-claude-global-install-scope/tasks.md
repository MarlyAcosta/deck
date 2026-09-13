# Tasks: Global Install Scope for Claude Code

## Execution rule

Keep one implementation owner through Tasks 1-2 (the first launchable, fully-verified candidate).
Tasks 4-5 are explicit, tracked deferrals — do not start them without a separate go-ahead, and do
not let their absence block Tasks 1-3.

## Task 1: Root resolution and CLI dispatch — DONE

- `packages/adapter-claude/src/install-root.ts`: `resolveClaudeInstallRoot()` (zero-argument,
  always `homedir()`) per `design.md`, plus `install-root.test.ts` (2 tests: returns `homedir()`,
  is pure/idempotent).
- `apps/cli/src/main.tsx`'s `runner-launch` dispatch calls `resolveClaudeInstallRoot()` when
  `runnerId === "claude"`, gated so every other runner's resolution is unchanged.
- **No flag added to `parseClaudeArgs`** — this task went through two design revisions during
  implementation, both corrected by direct user feedback: a first pass added `--global` as
  opt-in (project-scoped stayed default), rejected; a second pass flipped the default to global
  and added `--project` as opt-in "for flexibility," also rejected once the user pointed out
  OpenCode's own CLI grammar has no scope flag at all — confirmed directly in
  `apps/cli/src/cli-args.ts`. The final, shipped version added *no* flag: `--project` (or any
  other scope-shaped token) is rejected by the existing unrecognized-argument path, with no
  special-casing needed.
- **Real bug found and fixed during live verification, not assumed away:** the mutation preview
  printed only relative paths with no indication of which root they resolved against — making the
  global-vs-project destination genuinely unanswerable from CLI output alone (a direct violation
  of REQ-CGS-CLI-003, caught by actually running the command against a project that already had
  project-scoped content from before this change, not by inspection). Fixed in the shared
  `apps/cli/src/runner-launch-command.ts` preview renderer (not Claude-specific — every runner's
  preview now names its root), not worked around.

**Verification — actually run:**
- `bun test packages/adapter-claude/src/install-root.test.ts`: 2/2 pass.
- `bun test apps/cli/src/cli-args.test.ts`: 60/60 pass, including the new case proving `--project`
  is rejected like any other unrecognized argument.
- `bunx tsc --noEmit`: 0 errors.
- Live, through the real source-run binary, from `/home/marly/deck-claude-test` (a real scratch
  project already holding project-scoped content installed before this change existed):
  - `deck claude developer --dry-run` (default): preview shows `Install root: /home/marly` and
    `create ... pre=absent` for every file — proving it resolved to the (empty) home directory,
    not the project's already-installed content.
  - `deck claude developer --project --dry-run`: rejected with `Unknown Claude developer
    argument: --project`, confirmed live, not just by test.
- Full `bun test`: 5001 pass / 2 skip / 1 fail / 323 files — the 1 failure is the same
  pre-existing, environment-dependent `binary-smoke.test.tsx` case already present on
  `upstream/main` before any Claude work; zero regressions.

## Task 2: Full round trip at global scope, plus the precedence check — DONE

- Added `transaction.test.ts`'s "global scope round trip (REQ-CGS-RT-001)" describe block: a
  single integrated test proves backup → apply → verify → rollback succeeds end-to-end against a
  temp directory standing in for `homedir()` — not just piecewise reuse of the existing
  project-scope tests (confirmed by reading every call site in `transaction.ts` that neither
  `applyClaudeFiles` nor its siblings branch on whether the root is actually `$HOME`, so a temp
  dir is a faithful stand-in, not an assumption).
- Added `developer-team-install.test.ts`'s "collision safety at global scope (REQ-CGS-RT-002)"
  describe block: pre-existing, non-Deck-owned content at a root standing in for `homedir()`
  blocks the plan (`blocked: true`, diagnostic names the file) exactly as the existing
  project-scope collision test proves for a project root — the global-scope analog, not a
  duplicate assumption.
- **Live-verified the precedence question `design.md` flagged as open**, with explicit user
  permission (granted again, separately from the exploration-phase grant): created a same-named
  agent (`deck-precedence-probe-temp`, trigger phrase "activate precedence probe") with
  distinguishable bodies in both a scratch project's `.claude/agents/` (`PROJECT_WINS`) and the
  user's real `~/.claude/agents/` (`GLOBAL_WINS`), then ran `claude -p` from that project
  directory. Result: `"result":"PROJECT_WINS"`, `subagent_stats.spawned: 1` (exactly one agent
  ran — no duplicate execution, no error). **Project-local content takes strict precedence over
  global content with the same name.** Both probe files removed immediately after verification.

**Verification — actually run:**
- `bun test packages/adapter-claude/src/transaction.test.ts`: 11/11 pass (up from 10).
- `bun test packages/adapter-claude/src/developer-team-install.test.ts`: 10/10 pass (up from 9).
- The precedence question has a real, live-observed answer (`PROJECT_WINS`, project-local strict
  precedence) recorded in `design.md`'s "Resolved risk" section, replacing the prior "not
  verified" note — ready for Task 3's documentation update to state this specific, confirmed
  behavior rather than an assumption.

## Task 3: Documentation — DONE

- Updated `docs/runners.md`'s `## Claude` section (bullet list, status table row) to state the
  always-global default explicitly (`~/.claude/agents/*.md`, `~/.claude/skills/*/SKILL.md`,
  `~/.claude/CLAUDE.md`, no project-scoped flag) and the live-confirmed precedence answer from
  Task 2 (project-local content, if present, strictly wins).
- Updated `docs/runner-support.md`'s "Claude Code quick path" section, its capability matrix row,
  and its root-Lead-startup paragraph correspondingly — the prior wording ("Deck writes
  project-local content only") was flatly false after this change and is now corrected.
- Updated `README.md`'s Claude Code CLI section (prose + status table row) to match.
- Found and fixed, via a full grep sweep of every doc mentioning `.claude/agents` or `CLAUDE.md`
  (not assumed clean from the three files above): `docs/reference/support-matrix.md`'s Developer
  Team materialization row still implied project-scoped materialization. Also added an honest
  Task 4 forward-reference in three places (`docs/runners.md`, `docs/runner-support.md`,
  `docs/reference/support-matrix.md`): `deck doctor` still checks only the project root, not
  `~/.claude/`, so a global-only install currently reports as "not installed" in Doctor — a real
  gap, not hidden by the docs update.
- No new literal command forms were introduced (no `--project`/`--global` examples exist to
  document, since no such flag exists), so `tests/documentation-governance.test.ts`'s command
  allowlist needed no changes.

**Verification — actually run:** `bun test tests/documentation-governance.test.ts`: 16/16 pass,
first try, including the forbidden-claim regexes that block overclaiming Claude parity or
capability. Full `bun test`: 5003 pass / 1 fail (same pre-existing failure) across 323 files.
`bunx tsc --noEmit`: 0 errors.

## Task 4: Doctor/capability-inventory global visibility — deferred, not started

- `diagnoseProject` and `getCapabilityInventory` currently check `.claude/agents/` existence
  relative to whatever project root they're given; neither is wired to also check the global root.
  After this change ships, a user with only a global install would see Developer Team
  materialization reported as missing when running `deck doctor` in a project — a real,
  user-visible gap from day one of this change, not a hypothetical one.
- Not started in this pass. Tracked here so it is not silently forgotten, matching how
  `add-claude-code-runner-support`'s own Task 3.6 recorded its deferred standalone-skill work.

## Task 5: TUI adoption of the always-global root — deferred, not started

- `installTeamBundle` in `apps/cli/src/tui/app.tsx` calls
  `buildDeveloperTeamInstallPlan`/`applyDeveloperTeamInstall` with whatever project root the
  dashboard session already captured; it does not yet call `resolveClaudeInstallRoot()` for
  Claude the way the direct CLI command now does. This is a small, mechanical adoption once Tasks
  1-3 are verified — not new design work — deliberately sequenced after, mirroring how
  `add-claude-code-runner-support` itself shipped Phase 5 (CLI) before Phase 6 (TUI) as two
  separate, independently-verified steps rather than one combined one.
- Not started in this pass.

## Task 6: Full regression gate

- Run `bun test` (full suite), `bunx tsc --noEmit`, and `deck openspec validate` against the final
  state of Tasks 1-3.

**Verification:** No regression in existing Pi/OpenCode/Codex/Claude test counts;
`deck openspec validate` reports zero errors/warnings attributable to
`add-claude-global-install-scope`.
