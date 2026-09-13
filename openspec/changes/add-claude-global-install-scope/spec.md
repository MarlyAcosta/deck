# Specification: Global Install Scope for Claude Code

## Source

- Proposal: `proposal.md`
- Related official change: `add-claude-code-runner-support` (this change is a scoped delta on
  top of it — every function it built is reused unchanged, not modified).
- Evidence base: direct inspection of `packages/adapter-claude/src/developer-team-install.ts`,
  `packages/adapter-claude/src/transaction.ts`, `packages/adapter-opencode/src/runner-adapter.ts`,
  `apps/cli/src/main.tsx`, `apps/cli/src/cli-args.ts`; live-verified global subagent and global
  skill loading against the real `claude` binary in this session (see `proposal.md`
  "Current state").

## Requirements

### Capability: Root resolution

REQ-CGS-ROOT-001: Deck MUST resolve a Claude Code install root as the user's home directory
(`os.homedir()`) by default, or the caller's project root when `--project` is explicitly supplied
— the scope MUST be traceable to one explicit default value in `parseClaudeArgs`, never inferred
per-call or re-derived in more than one place.

REQ-CGS-ROOT-002: The root-resolution function MUST be pure (no filesystem access, no I/O) and
MUST NOT alter, wrap, or bypass `resolveProjectRoot()`'s existing project-detection behavior when
global scope is not requested.

REQ-CGS-ROOT-003: `packages/adapter-claude/src/developer-team-install.ts` and
`packages/adapter-claude/src/transaction.ts` MUST NOT be modified to add scope-awareness — the
existing root parameter already accepts any root; scope selection MUST happen entirely at the
caller (CLI dispatch) layer.

### Capability: CLI surface

REQ-CGS-CLI-001: `deck claude developer` MUST resolve to global scope by default (no flag
required) and MUST accept an optional `--project` flag, composable with every existing flag and
launch mode (`--install-only`, `--dry-run`, `--yes`, `exec`, `resume`), to opt into project-scoped
resolution instead.

REQ-CGS-CLI-002: `--project` MUST be recognized only by Claude's argument grammar
(`parseClaudeArgs`). `parseCodexArgs`, the Pi launch grammar, and the OpenCode grammar MUST NOT
change as part of this work. Codex's own existing `--local-only` flag (a different, pre-existing
concept) MUST NOT be conflated with or reused for this.

REQ-CGS-CLI-003: Every mutation preview, diagnostic, and applied-file report MUST show the
actually-resolved absolute (or clearly home-relative, e.g. `~/.claude/...`) paths for whichever
scope is active — global (the default) or project (`--project`) — so a user can see the real
destination before confirming an apply — no new confirmation mechanism is required beyond what
already gates `--yes`.

### Capability: Shared-type and cross-runner non-interference

REQ-CGS-ISO-001: No type in `packages/core/src/runner-adapter.ts` (including
`DeveloperTeamAdapterInstallInput`, `DeveloperTeamApplyInput`, and any other shared
`RunnerAdapter` contract type) MUST change as part of this work.

REQ-CGS-ISO-002: No file under `packages/adapter-pi/`, `packages/adapter-opencode/`, or
`packages/adapter-codex/` MUST change as part of this work.

### Capability: Verified round trip

REQ-CGS-RT-001: A full backup → apply → verify → rollback cycle MUST be proven live against a
real (isolated, non-production) filesystem root standing in for `homedir()`, not merely against
the dry-run preview path.

REQ-CGS-RT-002: The existing ownership/collision guards (`isClaudeOwnedContent`, the `CLAUDE.md`
marker-span merge) MUST continue to protect pre-existing, non-Deck-owned content at the global
root exactly as they already do at a project root — proven by a test with pre-existing unowned
content present at the global root before install.

### Capability: Honest scope boundary

REQ-CGS-DOC-001: Documentation updates MUST NOT claim Deck resolves a conflict between a
project-local and a global Deck-materialized Claude Developer Team install with the same agent
ID and different content — that resolution is left entirely to Claude Code's own native
precedence, which this change does not verify or alter.

REQ-CGS-DOC-002: Documentation updates MUST NOT claim `deck doctor` reports global-scope
Developer Team state, TUI scope selection exists, or Codex/Pi have equivalent global-scope
support — all three are explicit, tracked gaps (Tasks 4 and 5 in `tasks.md`, and Codex/Pi
exclusion in `proposal.md`), not silently implied capabilities.

## Acceptance scenarios

1. **Global-by-default dry-run from an arbitrary project.** Given a project directory with no
   `.claude/` content, when `deck claude developer --dry-run` runs with no scope flag, the
   mutation preview MUST show `~/.claude/agents/*.md`, `~/.claude/skills/*/SKILL.md`, and
   `~/.claude/CLAUDE.md` paths — MUST NOT show any path under the invoking project directory.

2. **Global apply then reuse from a second, unrelated project.** Given a successful
   `deck claude developer --install-only --yes` run (default scope, no flag), when
   `deck claude developer --dry-run` runs again from a *different* project directory, the preview
   MUST report `(no file mutations)` for every previously-installed file (idempotent, and visibly
   available regardless of which project directory the command is invoked from).

3. **Project-scoped opt-in still reaches `add-claude-code-runner-support`'s original behavior.**
   Given the same setup, when `deck claude developer --project --dry-run` runs, the preview MUST
   show project-relative `.claude/...` paths exactly as `add-claude-code-runner-support`'s
   existing tests already prove for that code path — the underlying materialization logic is
   unchanged, only the CLI default that selects which root reaches it.

4. **Pre-existing unowned content at the global root blocks, not overwrites.** Given a real,
   non-Deck-authored `~/.claude/agents/deck-lead.md` already present, when
   `deck claude developer --dry-run` runs (default global scope), the plan MUST report
   `blocked: true` with a diagnostic naming that file — mirroring REQ-CLD-MAT-003's existing
   project-scope guarantee, now proven at the global root too.

5. **Other runners are untouched.** Given the full existing Pi/OpenCode/Codex test suites, when
   this change's implementation lands, every previously-passing test in those adapters MUST still
   pass unchanged — proven by a before/after diff of the full `bun test` failing-test-name set,
   the same methodology `add-claude-code-runner-support` used at every phase.
