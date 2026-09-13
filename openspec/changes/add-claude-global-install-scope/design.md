# Design: Global Install Scope for Claude Code

## Decision: caller-supplied root, not a new code path

`packages/adapter-claude/src/developer-team-install.ts` (`buildClaudeDeveloperTeamInstallPlan`)
and `packages/adapter-claude/src/transaction.ts` (`backupClaudeFiles`, `applyClaudeFiles`,
`rollbackClaudeFiles`, `verifyClaudeFiles`) already take a plain `projectRoot: string` and join
every relative path (`.claude/agents/<id>.md`, `.claude/skills/<id>/SKILL.md`, `CLAUDE.md`)
against it with `node:path`'s `join`. Confirmed by reading every call site in both files (not
assumed): there is no logic anywhere in either module that inspects, validates, or special-cases
the *meaning* of the root — it is treated as an opaque filesystem location throughout.

This means global scope requires zero new code in either module. The only new logic is: what
string does the CLI pass as that root. This is a materially smaller design than
`add-claude-code-runner-support`'s own Phase 2 output-capture correction (which required a real
shared-type change in `packages/core`) — here, the shared contract
(`DeveloperTeamAdapterInstallInput.projectRoot: string`) already accepts any string; Deck's own
CLI dispatch simply hasn't offered the user a way to make that string be `homedir()` for Claude.

```ts
// packages/adapter-claude/src/install-root.ts (new, small, pure)
import { homedir } from "node:os";

export type ClaudeInstallScope = "global" | "project";

export function resolveClaudeInstallRoot(cwdProjectRoot: string, scope: ClaudeInstallScope): string {
  return scope === "global" ? homedir() : cwdProjectRoot;
}
```

## Decision: default flips to global (user-directed, superseding the initial draft)

The first draft of this design kept project-scoped as Claude's unconditional default and added
`--global` as opt-in, reasoning that flipping the default would be a breaking change relative to
`add-claude-code-runner-support`'s Phase 1-7 behavior. The user explicitly overrode that choice:
Claude should behave like OpenCode — configure once, globally, available in every project — by
default, with project-scoped installs as the explicit opt-in (`--project`) for the less common
case.

This is accepted as the correct call, not merely followed: `add-claude-code-runner-support` has
never shipped in a published Deck release (it lives only in the unreleased branch this change
continues), so "breaking existing behavior" was a theoretical cost, not a real one — there is no
external user whose workflow this default flip disrupts. Matching OpenCode's actual UX (the
workflow the user already relies on daily) is the higher-value outcome. `resolveClaudeInstallRoot`
takes an explicit `scope` argument rather than a boolean specifically so the default lives in one
place (`parseClaudeArgs`'s flag parsing, `scope: "project" in deckFlagRegion ? "project" : "global"`)
and is never silently re-derived elsewhere.

## Dispatch-site change

`apps/cli/src/main.tsx:203-208` currently reads:

```ts
if (parsed.command === "runner-launch") {
  const projectRoot = resolveProjectRoot() ?? process.cwd();
  ...
  const launch = { ...parsed.launch, projectRoot, teamId: parsed.teamId, deckConfig };
```

The change gates the root computation on `runnerId === "claude"`, leaving every other runner's
resolution byte-for-byte identical:

```ts
if (parsed.command === "runner-launch") {
  const projectRoot = parsed.runnerId === "claude"
    ? resolveClaudeInstallRoot(resolveProjectRoot() ?? process.cwd(), parsed.scope)
    : resolveProjectRoot() ?? process.cwd();
```

`parsed.scope: "global" | "project"` is a new field added only to the Claude branch of the
`ParsedArgs` `runner-launch` discriminated union in `apps/cli/src/cli-args.ts`, populated by
`parseClaudeArgs`: `"project"` when `--project` appears in `deckFlagRegion`, `"global"` otherwise
— mirroring exactly how `--dry-run`/`--install-only`/`--yes` are already parsed there, except this
one carries a default value instead of being a plain boolean presence check.

## Known, honestly unresolved risk: project-vs-global precedence

Claude Code's actual behavior when a project-local `.claude/agents/deck-lead.md` and a
user-level `~/.claude/agents/deck-lead.md` both exist — with different content — was **not**
verified live in this exploration pass. Common CLI convention (and Claude Code's own published
positioning of project config as more specific) suggests project-local wins, but "suggests" is
not "confirmed," and REQ-CLD-COMPAT-003's own standard (never trust research over a live check)
applies here too. This is recorded as an open risk in `proposal.md`, not silently assumed away;
Task 2 in `tasks.md` includes a live test of this exact scenario before the change is considered
verified, and the documentation update (Task 3) will state the confirmed result plainly rather
than guessing.

## Package layout

- `packages/adapter-claude/src/install-root.ts` — new, ~10 lines, one pure function plus a test
  file.
- `apps/cli/src/cli-args.ts` — one new optional field on the Claude `ParsedArgs` variant, parsed
  alongside the existing three boolean flags in `parseClaudeArgs`.
- `apps/cli/src/main.tsx` — one conditional at the existing `projectRoot` computation site.
- No change to `packages/core`, `packages/adapter-pi`, `packages/adapter-opencode`,
  `packages/adapter-codex`, or any file inside `packages/adapter-claude/src/` other than the new
  `install-root.ts`.

## Deferred, tracked (not silently dropped)

- **Doctor visibility** (Task 4): `diagnoseProject` and `getCapabilityInventory` today check
  `.claude/agents/` existence relative to the project root they're given; they are not wired to
  also check the global root. A user running `deck doctor` in a project with only a global install
  would see "not installed" for Developer Team materialization, which is misleading once this
  change ships. Recorded as a real, user-visible gap, not an oversight to discover later.
- **TUI scope-selection screen** (Task 5): `installTeamBundle` in `apps/cli/src/tui/app.tsx` calls
  `buildDeveloperTeamInstallPlan`/`applyDeveloperTeamInstall` with the project root captured
  earlier in the dashboard flow; there is currently no screen offering global as a choice. Adding
  one is real Ink/React UI work, deliberately out of this change's first vertical (mirroring how
  `add-claude-code-runner-support` itself shipped Phase 5's CLI surface before Phase 6's TUI
  integration, as two separate, independently-verified steps).
