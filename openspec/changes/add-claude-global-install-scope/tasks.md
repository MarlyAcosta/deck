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

## Task 2: Full round trip at global scope, plus the precedence check

- Prove `backupClaudeFiles`/`applyClaudeFiles`/`rollbackClaudeFiles`/`verifyClaudeFiles` work
  correctly when handed a real (isolated, non-`$HOME`) directory standing in for `homedir()` —
  reuse the exact same test patterns `transaction.test.ts` already has for project scope, applied
  against a temp directory substituted as the resolved root (no production code branches on
  "is this actually `$HOME`," so a temp dir is a faithful stand-in).
- A dedicated test proves pre-existing, non-Deck-owned content at that root blocks the plan
  (`isClaudeOwnedContent` false, `blocked: true`, diagnostic names the file) — the global-scope
  analog of `add-claude-code-runner-support`'s existing project-scope collision test.
- **Live-verify the precedence question `design.md` flagged as open**: what happens when a
  project has *leftover* project-scoped content (materialized by `add-claude-code-runner-support`
  before this change existed) alongside the new global install, with a same-named agent holding
  different, distinguishable content (e.g. different trigger phrases) — using the user's real
  `~/.claude/agents/` and a real scratch project's `.claude/agents/`, with explicit user
  permission before writing anything to the real `~/.claude/agents/` (same permission pattern
  already used and granted during this change's exploration phase) — cleaned up immediately
  after, same as the exploration-phase probes.

**Verification:**
- `bun test packages/adapter-claude/src/transaction.test.ts` (extended) passes.
- The precedence question has a real, live-observed answer recorded in `design.md` (replacing the
  "not verified" note) and reflected accurately in the Task 3 documentation update — whatever the
  real answer turns out to be, not the assumed one.

## Task 3: Documentation

- Update `docs/runners.md`'s `## Claude` section: the launch-path examples change from showing
  only project-scoped commands to showing the always-global default, plus the live-confirmed
  precedence answer from Task 2.
- Update `docs/runner-support.md`'s "Claude Code quick path" section correspondingly.
- Update `README.md`'s Claude Code CLI example block to match.
- Extend `tests/documentation-governance.test.ts`'s `isSupportedDirectCommand` allowlist with any
  new literal command forms the docs now show, mirroring how `add-claude-code-runner-support`'s
  own Phase 7 extended that allowlist.

**Verification:** `bun test tests/documentation-governance.test.ts` passes with the updated docs
and allowlist.

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
