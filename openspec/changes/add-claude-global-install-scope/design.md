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

## Known, honestly unresolved risk: precedence with leftover project-scoped content

Before this change, `add-claude-code-runner-support` materialized the Developer Team at the
project root. After this change, the same command materializes at `homedir()` instead — leaving
any previously-installed project-local `.claude/agents/*.md` in place, untouched, alongside the
new global install. Claude Code's actual behavior when both a project-local and a user-level
`.claude/agents/deck-lead.md` exist with different content was **not** verified live in this
exploration pass. This is recorded as an open risk, not assumed away; Task 2 in `tasks.md`
includes a live test of this exact scenario before the change is considered verified.

## Package layout

- `packages/adapter-claude/src/install-root.ts` — new, ~5 lines, one pure zero-argument function
  plus a 2-test file.
- `apps/cli/src/main.tsx` — one conditional at the existing `projectRoot` computation site.
- `apps/cli/src/runner-launch-command.ts` — one new line in the shared preview renderer (not
  Claude-specific; benefits every runner).
- No change to `packages/core`, `packages/adapter-pi`, `packages/adapter-opencode`,
  `packages/adapter-codex`, `apps/cli/src/cli-args.ts` (no new flag to parse), or any file inside
  `packages/adapter-claude/src/` other than the new `install-root.ts`.

## Deferred, tracked (not silently dropped)

- **Doctor visibility** (Task 4): `diagnoseProject` and `getCapabilityInventory` today check
  `.claude/agents/` existence relative to the project root they're given; they are not wired to
  check the global root instead. After this change ships, `deck doctor` run in any project would
  report Developer Team materialization as missing even though a real global install exists — a
  real, user-visible gap from day one, not a hypothetical one.
- **TUI adoption** (Task 5): `installTeamBundle` in `apps/cli/src/tui/app.tsx` calls
  `buildDeveloperTeamInstallPlan`/`applyDeveloperTeamInstall` with the project root the dashboard
  session already captured; it does not yet call `resolveClaudeInstallRoot()` for Claude the way
  the direct CLI command now does. This is a small, mechanical adoption once Tasks 1-3 are
  verified, not new design work — sequenced after, mirroring how `add-claude-code-runner-support`
  itself shipped Phase 5 (CLI) before Phase 6 (TUI) as two separate, independently-verified steps.
