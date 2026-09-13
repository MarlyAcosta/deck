# Tasks: Global Install Scope for Claude Code

## Execution rule

Keep one implementation owner through Tasks 1-2 (the first launchable, fully-verified candidate).
Tasks 4-5 are explicit, tracked deferrals — do not start them without a separate go-ahead, and do
not let their absence block Tasks 1-3.

## Task 1: Root resolution and CLI default flip

- Add `packages/adapter-claude/src/install-root.ts`: `resolveClaudeInstallRoot(cwdProjectRoot, scope)`
  per `design.md`, plus `install-root.test.ts` covering both scope values and the pure-function
  no-I/O contract (no filesystem calls made by this function itself).
- Extend `parseClaudeArgs` in `apps/cli/src/cli-args.ts`: accept `--project`; default
  `scope: "global"` when absent, `"project"` when present; reject combining `--project` with
  anything that doesn't make sense (none currently — it composes with every existing flag).
- Update `apps/cli/src/main.tsx`'s `runner-launch` dispatch per `design.md`'s dispatch-site
  change, gated on `runnerId === "claude"` only.

**Verification (must actually run, not just describe):**
- `bun test packages/adapter-claude/src/install-root.test.ts` and `bun test apps/cli/src/cli-args.test.ts`
  pass, including new cases for `--project` present/absent.
- Live, through the real built binary, in a real scratch project directory (never `~/projects/deck`
  itself — confirm `resolveProjectRoot()`'s actual resolution first, mirroring the Phase 5
  near-miss lesson in `add-claude-code-runner-support`):
  - `deck claude developer --dry-run` (no flag) previews `~/.claude/...` paths.
  - `deck claude developer --project --dry-run` previews the scratch project's own `.claude/...`
    paths.
- Full `bun test`: diff the failing-test-name set against the pre-change baseline; must be
  byte-for-byte identical (zero regressions in Pi/OpenCode/Codex, matching the methodology every
  phase of `add-claude-code-runner-support` used). `bunx tsc --noEmit`: 0 new errors.

## Task 2: Full round trip at global scope, plus the precedence check

- Prove `backupClaudeFiles`/`applyClaudeFiles`/`rollbackClaudeFiles`/`verifyClaudeFiles` work
  correctly when handed a real (isolated, non-`$HOME`) directory standing in for `homedir()` —
  reuse the exact same test patterns `transaction.test.ts` already has for project scope, applied
  against a temp directory substituted as the resolved root (no production code branches on
  "is this actually `$HOME`," so a temp dir is a faithful stand-in).
- A dedicated test proves pre-existing, non-Deck-owned content at that root blocks the plan
  (`isClaudeOwnedContent` false, `blocked: true`, diagnostic names the file) — the global-scope
  analog of `add-claude-code-runner-support`'s existing project-scope collision test.
- **Live-verify the project-vs-global precedence question `design.md` flagged as open**, using the
  user's real `~/.claude/agents/` and a real scratch project's `.claude/agents/`, both holding a
  same-named agent with different, distinguishable content (e.g. different trigger phrases), with
  explicit user permission before writing anything to the real `~/.claude/agents/` (same
  permission pattern already used and granted during this change's exploration phase) —
  cleaned up immediately after, same as the exploration-phase probes.

**Verification:**
- `bun test packages/adapter-claude/src/transaction.test.ts` (extended) passes.
- The precedence question has a real, live-observed answer recorded in `design.md` (replacing the
  "not verified" note) and reflected accurately in the Task 3 documentation update — whatever the
  real answer turns out to be, not the assumed one.

## Task 3: Documentation

- Update `docs/runners.md`'s `## Claude` section: the launch-path examples change from showing
  only project-scoped commands to showing the real default (global) and the `--project` opt-in,
  plus the live-confirmed precedence answer from Task 2.
- Update `docs/runner-support.md`'s "Claude Code quick path" section correspondingly.
- Update `README.md`'s Claude Code CLI example block to match the new default command shape.
- Extend `tests/documentation-governance.test.ts`'s `isSupportedDirectCommand` allowlist with any
  new literal command forms the docs now show (e.g. `deck claude developer --project --dry-run`),
  mirroring how `add-claude-code-runner-support`'s own Phase 7 extended that allowlist.

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

## Task 5: TUI scope-selection screen — deferred, not started

- `installTeamBundle` in `apps/cli/src/tui/app.tsx` has no screen offering a global-vs-project
  choice; the interactive dashboard installs at whatever project root the dashboard session
  already captured. Bringing the new default/opt-in to the TUI (not just the direct CLI command)
  is real Ink/React work, deliberately sequenced after Tasks 1-3 land and are verified — mirroring
  how `add-claude-code-runner-support` itself shipped Phase 5 (CLI) before Phase 6 (TUI) as two
  separate, independently-verified steps rather than one combined one.
- Not started in this pass.

## Task 6: Full regression gate

- Run `bun test` (full suite), `bunx tsc --noEmit`, and `deck openspec validate` against the final
  state of Tasks 1-3.

**Verification:** No regression in existing Pi/OpenCode/Codex/Claude test counts;
`deck openspec validate` reports zero errors/warnings attributable to
`add-claude-global-install-scope`.
