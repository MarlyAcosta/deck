# Design: Global Install Scope for Claude Code

## Decision: always global, no flag — matches OpenCode exactly

`packages/adapter-claude/src/developer-team-install.ts` (`buildClaudeDeveloperTeamInstallPlan`)
and `packages/adapter-claude/src/transaction.ts` (`backupClaudeFiles`, `applyClaudeFiles`,
`rollbackClaudeFiles`, `verifyClaudeFiles`) already take a plain `projectRoot: string` and join
every relative path (`.claude/agents/<id>.md`, `.claude/skills/<id>/SKILL.md`, `CLAUDE.md`)
against it with `node:path`'s `join`. Confirmed by reading every call site in both files: there
is no logic anywhere in either module that inspects, validates, or special-cases the *meaning* of
the root — it is treated as an opaque filesystem location throughout. This means global-only
resolution requires zero new code in either module; the only new logic is what string the CLI
passes as that root, and now there is exactly one answer: `os.homedir()`, always.

```ts
// packages/adapter-claude/src/install-root.ts (new, ~5 lines, pure)
import { homedir } from "node:os";

export function resolveClaudeInstallRoot(): string {
  return homedir();
}
```

## Decision history: two rejected drafts, kept for honesty

This design went through three iterations, each one corrected by direct user feedback rather than
self-assessed as complete:

1. Project-scoped default, `--global` opt-in. Rejected: didn't match the user's actual daily
   workflow (OpenCode, configured once, always available).
2. Global default, `--project` opt-in "for flexibility." Rejected: the user pointed out this
   still didn't match OpenCode, because OpenCode's own CLI grammar has no scope flag at all —
   adding `--project` invented a choice the reference implementation (OpenCode) never offers,
   rather than mirroring it. Verified directly in `apps/cli/src/cli-args.ts`: OpenCode's grammar
   is `opencode developer [--yes] [--dry-run] [--install-only] [--memory=...]` — nothing
   scope-related exists there to mirror.
3. **This design**: no flag, no parameter, always `homedir()`. `resolveClaudeInstallRoot` takes
   zero arguments specifically because there is no longer a decision to parameterize — the
   function's whole shape reflects the final, corrected understanding of what "match OpenCode"
   actually means.

## Dispatch-site change

`apps/cli/src/main.tsx`'s `runner-launch` dispatch now reads:

```ts
if (parsed.command === "runner-launch") {
  const projectRoot = parsed.runnerId === "claude"
    ? resolveClaudeInstallRoot()
    : resolveProjectRoot() ?? process.cwd();
```

Every other `runnerId`'s resolution is byte-for-byte identical to `add-claude-code-runner-support`
and to every other runner's own behavior; only Claude's branch changed.

## Shared, runner-neutral fix found during live verification: the preview didn't name its root

While live-verifying Task 1 (`deck claude developer --dry-run` from a project directory that
already had project-scoped content installed from before this change), the mutation preview
printed only relative paths (e.g. `create .claude/agents/deck-lead.md`) with no indication of
*which* root those paths were relative to. This made the global-vs-project question genuinely
unanswerable from the CLI output alone — exactly what REQ-CGS-CLI-003 requires to never happen.

The fix lives in `apps/cli/src/runner-launch-command.ts` (shared by every runner, not
Claude-specific): the preview header now includes an `Install root: <path>` line, sourced from
`baseLaunch.projectRoot` (already in scope at that point). This is a strict, runner-neutral
transparency improvement — Codex and OpenCode's own previews benefit too — and does not change
any runner's actual resolved root, only what the existing preview names. Verified live:

```
$ deck claude developer --dry-run
Install root: /home/marly
create .claude/agents/deck-lead.md pre=absent ...
```

## Resolved risk: precedence with leftover project-scoped content (Task 2, live-verified)

Before this change, `add-claude-code-runner-support` materialized the Developer Team at the
project root. After this change, the same command materializes at `homedir()` instead — leaving
any previously-installed project-local `.claude/agents/*.md` in place, untouched, alongside the
new global install.

**Live-verified, with explicit user permission (both files removed immediately after):** created
a same-named agent (`deck-precedence-probe-temp`, trigger phrase "activate precedence probe") in
both a scratch project's `.claude/agents/` (body: reply `PROJECT_WINS`) and the user's real
`~/.claude/agents/` (body: reply `GLOBAL_WINS`), then invoked `claude -p` from that project
directory. Result: `"result":"PROJECT_WINS"`, with `subagent_stats.spawned: 1` (exactly one
agent ran, not both, not an error) — **Claude Code's own subagent resolution gives project-local
content strict precedence over global (user-level) content with the same name.**

This is a reassuring answer for the leftover-content scenario, not a neutral one: any
project-local content installed before this change (by `add-claude-code-runner-support`'s prior
project-scoped default) remains fully authoritative in that specific project — the new global
install only fills in for projects that have no local override at all. Nothing silently changes
behavior in a project that already had a local install; the global default only expands coverage
to projects that previously had none.

## Real bug found live: CLAUDE.md's path is root-shaped, not root-agnostic

This module's original design (and REQ-CGS-ROOT-003) assumed every materialized path was opaque
to the root it's joined against — true for `.claude/agents/*.md` and `.claude/skills/*/SKILL.md`,
but **false for `CLAUDE.md`**. Claude Code's real convention: a project's memory file is
`<project>/CLAUDE.md`; the user-level (global) memory file is `<root>/.claude/CLAUDE.md`, not
`<root>/CLAUDE.md`.

This was not caught by any unit test (all of which used empty temp directories with no
pre-existing content to reveal the mismatch) — it was caught by the first *real* install against
the actual `~/.claude/CLAUDE.md` (which already had real, load-bearing content: an `@RTK.md`
inclusion), performed live with the user's explicit permission during Task 4/5 verification. The
result: a stray, unread `~/CLAUDE.md` was created, and the real, already-loaded
`~/.claude/CLAUDE.md` was left untouched instead of correctly merged — silently ineffective in
the worst way, not a loud failure.

**Fix:** `developer-team-install.ts` now computes `claudeMdRelativePath` via a new
`isGlobalInstallRoot(candidateRoot, knownGlobalRoot)` pure comparison (in `install-root.ts`) —
`.claude/CLAUDE.md` when the supplied root equals the known global root, `CLAUDE.md` otherwise.
This preserves correctness for both real callers that existed at the time of the fix (CLI: always
the global root; TUI, before Task 5 landed: still a real project root) without adding a `scope`
parameter or otherwise reintroducing the flag/choice concept the user explicitly rejected —
`isGlobalInstallRoot` is a plain equality check on values already being passed around, not new
caller-facing surface.

`buildClaudeDeveloperTeamInstallPlan` gained one optional, test-only parameter
(`knownGlobalRoot`, defaulting to the real `resolveClaudeInstallRoot()`) specifically so this
branch is unit-testable without either mocking `node:os` or writing real files into the actual
user's home directory during `bun test` — both rejected as worse than one small, clearly-commented
injection point.

**Re-verified live after the fix**, with explicit user permission, install → doctor → cleanup:
a real `deck claude developer --install-only --yes` now previews and applies `update
.claude/CLAUDE.md` (not `create CLAUDE.md`), correctly merging with the pre-existing `@RTK.md`
content rather than ignoring it.

## Real, honest limit found: `diagnoseProject` is not wired into `deck doctor` for Claude at all

Task 4 fixed both `diagnoseProject` and `getCapabilityInventory` to also check the global root —
but investigating where each is actually *called from* in production revealed they have very
different reach:

- **`getCapabilityInventory`** is called from `apps/cli/src/tui/app.tsx:1954`, the interactive
  dashboard's capability-status display — the fix has real, live effect: the TUI now correctly
  shows "installed" for a global-only install.
- **`diagnoseProject`** has exactly one real call site in the entire CLI, in
  `apps/cli/src/doctor-command/doctor-diagnostics.ts` — and it is Codex-specific
  (`inspectCodex`, a named dependency function). No equivalent `inspectClaude` exists. This is a
  **pre-existing gap from `add-claude-code-runner-support` itself**, not introduced by this
  change: `deck doctor` has never actually called `ClaudeRunnerAdapter.diagnoseProject` for
  Claude. The Task 4 fix to that method's internal logic is correct but currently unreachable —
  wiring `deck doctor` to call it (mirroring `inspectCodex`) is real, additional, separately-scoped
  work, deliberately not bundled into this change without an explicit go-ahead.

## Real, honest limit found: doctor/capability-inventory tests are coupled to real `$HOME` state

Because `resolveClaudeInstallRoot()` is deliberately a zero-argument function with no injection
point (the user's own simplicity requirement), `getCapabilityInventory`'s and `diagnoseProject`'s
existing unit tests (which assert "before: not installed, after: installed" against a temp
project directory) implicitly also depend on the *real* `~/.claude/agents/` being absent at test
time — they do not mock or override `os.homedir()`. This is a real fragility, demonstrated live
during this change's own verification: a real install left in place by an incomplete cleanup step
caused these exact tests to fail in the full suite (passing in isolation, since the isolated run
happened before the real install existed) until the real install was removed. Not fixed in this
change (would require either dependency injection for `resolveClaudeInstallRoot` — rejected for
adding a parameter back — or `mock.module`-based test isolation, a pattern with no precedent
elsewhere in `packages/adapter-claude`); recorded here as a known, accepted risk for future
maintainers running this suite on a machine with a real global Claude install present.

## Package layout

- `packages/adapter-claude/src/install-root.ts` — `resolveClaudeInstallRoot()` (unchanged) plus
  the new `isGlobalInstallRoot()` pure comparison, with tests for both.
- `packages/adapter-claude/src/developer-team-install.ts` — the `CLAUDE.md` path-selection fix
  described above; the one exception to this change's original "root-agnostic, no changes needed"
  premise.
- `packages/adapter-claude/src/runner-adapter.ts` — `diagnoseProject` and `getCapabilityInventory`
  now check both the project root and the global root (Task 4).
- `apps/cli/src/main.tsx` — one conditional at the existing `projectRoot` computation site
  (Task 1).
- `apps/cli/src/runner-launch-command.ts` — one new line in the shared preview renderer (not
  Claude-specific; benefits every runner) (Task 1).
- `apps/cli/src/tui/app.tsx` — one conditional in `runDashboardInstall`, the single real
  install-triggering call site out of the ~10 places `localResolvedProjectRoot` appears in this
  file (Task 5) — every other appearance was traced individually and found unrelated to Claude's
  Developer Team materialization (Deck self-update, Web Search credential setup, generic model
  discovery, Supermemory project scope — none of which Claude participates in).
- No change to `packages/core`, `packages/adapter-pi`, `packages/adapter-opencode`,
  `packages/adapter-codex`, or `apps/cli/src/cli-args.ts` (no new flag to parse).

## Tasks 4 and 5: initially deferred, then completed after re-investigation

Both were originally scoped out of this change's first vertical, based on a design-time estimate
("real Ink/React UI work," "touches shared doctor code") made without reading the actual
implementation. When the user asked why, a closer read of the real code — not the earlier
estimate — showed both were small: Task 4 was two `existsSync` checks in one file; Task 5, once
every `localResolvedProjectRoot` call site in `app.tsx` was individually traced rather than
pattern-matched on, turned out to be one conditional in one function
(`runDashboardInstall`), not a sweep across the file. Both were completed in this same pass,
with the CLAUDE.md bug above found as a direct result of finally exercising the real install path
end-to-end rather than only against temp directories.
