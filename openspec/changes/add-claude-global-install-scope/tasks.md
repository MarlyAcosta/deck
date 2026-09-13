# Tasks: Global Install Scope for Claude Code

## Execution rule

Keep one implementation owner through Tasks 1-2 (the first launchable, fully-verified candidate).
Tasks 4-5 were initially scoped as deferred, do-not-start-without-a-go-ahead work — both were
revisited and completed after the user asked why, and a proper investigation (not the original
design-time estimate) showed each was small. See their entries below for the full account,
including a real bug (`CLAUDE.md`'s path) found only once a real install was finally exercised
end-to-end.

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

## Task 4: Doctor/capability-inventory global visibility — DONE, with a discovered scope split

- Initially deferred on a design-time estimate ("touches shared doctor code") made without
  reading the real implementation. Re-investigated on direct user question ("¿por qué no la 4 y
  5?") and found genuinely small: `diagnoseProject` and `getCapabilityInventory` in
  `packages/adapter-claude/src/runner-adapter.ts` both now check `resolveClaudeInstallRoot()` in
  addition to the supplied project root — `.claude/agents/`/`CLAUDE.md` presence at *either*
  location reports as installed, with the message distinguishing "the always-global default" from
  "a leftover project-scoped install (project-local content takes precedence)."
- **Real, honest limit found while verifying, not assumed fixed:** `getCapabilityInventory` is
  called from `apps/cli/src/tui/app.tsx:1954` (the TUI's capability display) — the fix has real,
  live effect there. `diagnoseProject` has exactly one call site in the entire CLI
  (`doctor-diagnostics.ts`'s Codex-specific `inspectCodex`) — **no equivalent exists for Claude**,
  a pre-existing gap from `add-claude-code-runner-support` itself, not introduced here. The
  `diagnoseProject` fix is logically correct but currently unreachable from `deck doctor`; wiring
  it in (mirroring `inspectCodex`) is separately-scoped work, not done in this pass without an
  explicit go-ahead (asked; user redirected to Task 5 instead — see below).

**Verification — actually run:** `bun test packages/adapter-claude`: 130/130 pass before the real
end-to-end check. Live, with explicit user permission (install → verify → cleanup, real writes to
`~/.claude/`): the CLAUDE.md-path bug below was found during this exact verification.

## Task 5: TUI adoption of the always-global root — DONE, scope corrected after re-investigation

- Initially deferred on the same kind of design-time estimate as Task 4 ("real Ink/React UI
  work... 10+ call sites"), made by pattern-matching on every `localResolvedProjectRoot` mention
  in `app.tsx` without checking whether each one was actually relevant to Claude's install
  location. Re-investigated properly on direct user request ("podemos revisar lo de la tarea 5...
  hacer un plan de trabajo para hacerla bien"): traced every one of the ~10 call sites
  individually. Only one — `runDashboardInstall` (the actual install trigger, ~line 1249) — is
  relevant; the rest are Deck self-update, Web Search credential setup, generic model discovery,
  and Supermemory project scope, none of which touch Claude's Developer Team materialization (and
  Supermemory is a `"gap"` for Claude per the capability catalog, so it was never going to be
  relevant).
- Fix: one conditional in `runDashboardInstall`, mirroring `main.tsx`'s Task 1 pattern exactly —
  `adapter.runnerId === "claude" ? resolveClaudeInstallRoot() : (localResolvedProjectRoot ??
  process.cwd())`.

**Verification — actually run:** `bunx tsc --noEmit`: 0 errors. `bun test apps/cli/src/tui`:
367/367 pass (includes the synthetic-adapter Pi/OpenCode/Codex dashboard-install tests,
confirming no cross-runner regression). Live TUI keypress-driving was not attempted (same
honestly-recorded limit `add-claude-code-runner-support`'s own Phase 6 noted for Ink TUIs); the
downstream materialization logic this now correctly routes to was already live-verified multiple
times in Tasks 1, 2, and the CLAUDE.md-bug fix below.

## Real bug found live during Task 4/5 verification: CLAUDE.md materializes at the wrong path for global scope — FIXED

- **Found by finally doing a real install against the real, already-populated
  `~/.claude/CLAUDE.md`** (which had genuine content: an `@RTK.md` inclusion) — every prior test
  and live check used either empty temp directories or `--dry-run`, neither of which could reveal
  this. The real apply created a stray, unread `~/CLAUDE.md` instead of merging with the real
  `~/.claude/CLAUDE.md` Claude Code actually loads. Root cause: `developer-team-install.ts`
  assumed `CLAUDE.md`'s relative path was root-agnostic like every other materialized path; it
  is not — Claude Code's convention is `<project>/CLAUDE.md` for project scope but
  `<root>/.claude/CLAUDE.md` for the user-level (global) scope.
- Immediately cleaned up (with prior explicit user permission for the real-install verification
  pattern) — the stray file removed, the real `~/.claude/CLAUDE.md` restored from a backup taken
  before the first real install attempt.
- Fix: `install-root.ts` gained `isGlobalInstallRoot(candidateRoot, knownGlobalRoot)`, a pure
  comparison; `developer-team-install.ts` now selects `.claude/CLAUDE.md` vs `CLAUDE.md` based on
  it. `buildClaudeDeveloperTeamInstallPlan` gained one optional, test-only `knownGlobalRoot`
  parameter (default: the real `resolveClaudeInstallRoot()`) so the branch is unit-testable
  without mocking `node:os` or writing into the real home directory during `bun test`.
- **Process near-miss, recorded honestly:** a second real-install verification (proving the fix
  itself) was left uncleaned for several turns while Task 4/5 discussion continued — violating the
  explicit "install, verify, then delete it" agreement. Caught when the full `bun test` run showed
  2 new failures (both `getCapabilityInventory`/`diagnoseProject` tests, which implicitly depend
  on the real `~/.claude/agents/` being absent, per the "real, honest limit" recorded in
  `design.md`). Cleaned up immediately upon discovery; the real `~/.claude/CLAUDE.md` restored
  exactly (`diff` against the pre-test backup: identical). Recorded here as a concrete illustration
  of why the full regression gate (Task 6) matters even when individual pieces already passed in
  isolation — mirroring `add-claude-code-runner-support`'s own recorded near-miss with
  `bun run --cwd apps/cli`.

**Verification — actually run:** `bun test packages/adapter-claude`: 130/130 pass, including 6 new
tests (`isGlobalInstallRoot`'s 3 comparison tests, plus 3 integration tests proving project scope
stays bare `CLAUDE.md`, global scope uses `.claude/CLAUDE.md`, and global scope correctly merges
with real pre-existing content rather than creating a stray file). Live, with explicit user
permission, re-verified after the fix: a real `deck claude developer --install-only --yes`
previews and applies `update .claude/CLAUDE.md` (not `create CLAUDE.md`), correctly merging with
the pre-existing `@RTK.md` content. Full environment restored and confirmed byte-identical to its
pre-test state via `diff`.

## Task 6: Full regression gate

- Run `bun test` (full suite), `bunx tsc --noEmit`, and `deck openspec validate` against the final
  state of Tasks 1-5 and the CLAUDE.md path fix.

**Verification:** No regression in existing Pi/OpenCode/Codex/Claude test counts;
`deck openspec validate` reports zero errors/warnings attributable to
`add-claude-global-install-scope`.
