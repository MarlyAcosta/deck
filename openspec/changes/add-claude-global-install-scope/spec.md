# Specification: Global Install Scope for Claude Code

## Source

- Proposal: `proposal.md`
- Related official change: `add-claude-code-runner-support` (this change is a scoped delta on
  top of it — every function it built is reused unchanged, not modified).
- Evidence base: direct inspection of `packages/adapter-claude/src/developer-team-install.ts`,
  `packages/adapter-claude/src/transaction.ts`, `packages/adapter-opencode/src/runner-adapter.ts`,
  `apps/cli/src/main.tsx`, `apps/cli/src/cli-args.ts` (including confirming OpenCode's own
  grammar exposes no scope flag); live-verified global subagent and global skill loading against
  the real `claude` binary in this session (see `proposal.md` "Current state").

## Requirements

### Capability: Root resolution

REQ-CGS-ROOT-001: Deck MUST resolve every Claude Code install root as the user's home directory
(`os.homedir()`), unconditionally — no runtime input, flag, or configuration value MUST be able
to change this for the initial release.

REQ-CGS-ROOT-002: The root-resolution function MUST be pure (no filesystem access, no I/O, no
parameters) and MUST NOT alter, wrap, or bypass `resolveProjectRoot()`'s own project-detection
behavior, which remains used for every non-Claude runner unchanged.

REQ-CGS-ROOT-003: `packages/adapter-claude/src/developer-team-install.ts` and
`packages/adapter-claude/src/transaction.ts` MUST NOT be modified to add scope-awareness — the
existing root parameter already accepts any root; the CLI dispatch layer is the only place the
resolved value changes.

### Capability: CLI surface

REQ-CGS-CLI-001: `deck claude developer` MUST NOT expose any flag, environment variable, or other
mechanism to select a non-global install root. An unrecognized token such as `--project` MUST be
rejected exactly as any other unrecognized Claude developer argument already is — no
scope-specific parsing branch MUST exist.

REQ-CGS-CLI-002: No other runner's CLI grammar (`parseCodexArgs`, the Pi launch grammar, the
OpenCode grammar) MUST change as part of this work.

REQ-CGS-CLI-003: Every mutation preview, diagnostic, and applied-file report MUST show the
actually-resolved absolute install root, for every runner (not only Claude) — a user must always
be able to see the real destination before confirming an apply, regardless of whether that
destination is choosable.

### Capability: Shared-type and cross-runner non-interference

REQ-CGS-ISO-001: No type in `packages/core/src/runner-adapter.ts` (including
`DeveloperTeamAdapterInstallInput`, `DeveloperTeamApplyInput`, and any other shared
`RunnerAdapter` contract type) MUST change as part of this work.

REQ-CGS-ISO-002: No file under `packages/adapter-pi/`, `packages/adapter-opencode/`, or
`packages/adapter-codex/` MUST change as part of this work. (The one shared, runner-neutral change
this work does make — the mutation-preview root line in `apps/cli/src/runner-launch-command.ts`
— lives in `apps/cli/`, not inside any adapter package, and changes no runner's behavior, only
what the existing preview output names.)

### Capability: Verified round trip

REQ-CGS-RT-001: A full backup → apply → verify → rollback cycle MUST be proven live against a
real (isolated, non-production) filesystem root standing in for `homedir()`, not merely against
the dry-run preview path.

REQ-CGS-RT-002: The existing ownership/collision guards (`isClaudeOwnedContent`, the `CLAUDE.md`
marker-span merge) MUST continue to protect pre-existing, non-Deck-owned content at the global
root exactly as they already do at a project root — proven by a test with pre-existing unowned
content present at the global root before install.

REQ-CGS-RT-003: The precedence between leftover project-local content (materialized by
`add-claude-code-runner-support` before this change existed) and the new global install MUST be
observed live, not assumed, before Task 3 documents any specific behavior for it.

### Capability: Honest scope boundary

REQ-CGS-DOC-001: Documentation updates MUST NOT claim Deck resolves a conflict between
pre-existing project-local content and the global install with the same agent ID and different
content — that resolution is left entirely to Claude Code's own native precedence, which this
change observes (per REQ-CGS-RT-003) but does not alter.

REQ-CGS-DOC-002: Documentation updates MUST NOT claim `deck doctor` reports global-scope
Developer Team state, that a TUI-specific scope selector exists (there is no scope to select),
or that Codex/Pi have equivalent global-scope support — all are explicit, tracked gaps (Tasks 4
and 5 in `tasks.md`, and Codex/Pi exclusion in `proposal.md`), not silently implied capabilities.

## Acceptance scenarios

1. **Global-by-default dry-run from an arbitrary project, with the resolved root visible.** Given
   a project directory with no `.claude/` content, when `deck claude developer --dry-run` runs,
   the mutation preview MUST show `Install root: <home directory>` and
   `~/.claude/agents/*.md`/`~/.claude/skills/*/SKILL.md`/`~/.claude/CLAUDE.md` relative paths —
   MUST NOT show any path under the invoking project directory.

2. **Global apply then reuse from a second, unrelated project.** Given a successful
   `deck claude developer --install-only --yes` run, when `deck claude developer --dry-run` runs
   again from a *different* project directory, the preview MUST report `(no file mutations)` for
   every previously-installed file (idempotent, and visibly available regardless of which project
   directory the command is invoked from).

3. **No scope flag exists.** Given any invocation of `deck claude developer` with a `--project`
   (or similarly-intended) token, the result MUST be `command: "error"` — the same rejection path
   as any other unrecognized argument, not a recognized-but-ignored flag.

4. **Pre-existing unowned content at the global root blocks, not overwrites.** Given a real,
   non-Deck-authored `~/.claude/agents/deck-lead.md` already present, when
   `deck claude developer --dry-run` runs, the plan MUST report `blocked: true` with a diagnostic
   naming that file — mirroring REQ-CLD-MAT-003's existing project-scope guarantee, now proven at
   the global root too.

5. **Other runners are untouched, and their preview output also now names its root.** Given the
   full existing Pi/OpenCode/Codex test suites, when this change's implementation lands, every
   previously-passing test in those adapters MUST still pass unchanged, and their own mutation
   previews MUST now also show `Install root: <path>` (the one shared, runner-neutral improvement
   this change makes) — proven by a before/after diff of the full `bun test` failing-test-name
   set, the same methodology `add-claude-code-runner-support` used at every phase.
