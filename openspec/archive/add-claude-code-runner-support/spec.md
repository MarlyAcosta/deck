# Specification: Claude Code CLI Runner Support

## Source

- Proposal: `proposal.md`
- Related official changes: `add-first-class-codex-runner-support` (closest architectural
  precedent — subprocess-launched, staged, `static-compatible` initial release).
- Evidence base: direct inspection of `packages/core/src/runner-adapter.ts`,
  `packages/core/src/adapter-registry.ts`, `apps/cli/src/runner-adapters.ts`,
  `apps/cli/src/runtime-detection.ts`, `packages/adapter-codex/src/*`,
  `packages/adapter-opencode/src/*`, `packages/core/src/model-catalog.ts`.

## Requirements

### Capability: Runner composition and registration

REQ-CLD-ARCH-001: Deck MUST use `RunnerAdapter` and `AdapterRegistry` as the operational path
for Claude Code inspection, installation, verification, diagnostics, and launch planning.

REQ-CLD-ARCH-002: `@deck/adapter-claude` MUST be registered only in
`apps/cli/src/runner-adapters.ts`; TUI or other core-facing modules MUST NOT import
`@deck/adapter-claude` directly.

REQ-CLD-ARCH-003: The adapter MUST declare `environmentIds` including the existing
`"claude-development"` environment id already defined in
`apps/cli/src/runtime-detection.ts` so `AdapterRegistry.resolveByEnvironment` can route to it.

REQ-CLD-ARCH-004: Deck MUST NOT modify `RunnerLaunchPlan`, `RunnerLaunchInput`, or any other
shared type in `packages/core/src/runner-adapter.ts` to accommodate Claude Code. The adapter
MUST fit the existing subprocess-plan contract unchanged.

REQ-CLD-ARCH-005: The adapter MUST own runner-native inspection, configuration effects, and
verification behind the same typed project-scoped contracts Codex and OpenCode use. The CLI
MUST own authorization, orchestration, and the actual process spawn.

### Capability: Compatibility detection

REQ-CLD-COMPAT-001: Deck MUST define a `compatibility.ts` module that inspects captured
`claude --help` / `claude -p --help` fixtures (offline, no network) to determine which launch
modes and flags are safe for the detected Claude Code version, mirroring
`packages/adapter-codex/src/compatibility.ts`.

REQ-CLD-COMPAT-002: `detectRuntimes` MUST report more than PATH presence: it MUST include
version, and MUST distinguish "binary present" from "binary present and launch-compatible."

REQ-CLD-COMPAT-003: Every flag name and permission-mode value used by the adapter MUST be
confirmed against a live `claude --help` / `claude -p --help` output during Phase 0 before
being encoded into fixtures or launch code. Prior documentation research MUST NOT be trusted
as ground truth for argv construction.

### Capability: Safe launch

REQ-CLD-RUN-001: `buildLaunchPlan` MUST support `interactive`, `exec`, `resume-by-id`, and
`resume-latest`, matching the `RunnerLaunchInput` discriminated union exactly.

REQ-CLD-RUN-002: Every Deck-launched Claude Code session MUST carry exactly one fixed,
adapter-owned permission-policy token (Deck's launch policy), which MUST NOT be assembled from
caller-controlled input (prompt text, model id, or session id) and MUST be visibly reported as
a `RunnerDiagnostic` before launch.

REQ-CLD-RUN-003: The adapter MUST validate an owned-policy invariant on the assembled argv
(mirroring `hasOwnedBypassPolicy` in `packages/adapter-codex/src/launch.ts:74-78`) and MUST
return `status: "blocked"` if the invariant is violated, rather than launching with an
uncertain policy.

REQ-CLD-RUN-004: Prompt content for `exec` mode MUST be passed via `stdinPayload`, never via
argv, and MUST be size-bounded by `MAX_RUNNER_STDIN_PAYLOAD_BYTES`.

REQ-CLD-RUN-005: `resume-by-id` session ids MUST be validated as opaque non-option values
(non-empty, not starting with `-`, free of NUL/CR/LF) before being placed in argv.

REQ-CLD-RUN-006: Per-launch role/system-prompt injection MUST use a bounded, sanitized value
passed via `--append-system-prompt` (or the Phase-0-confirmed equivalent) and MUST NOT write
to or mutate the user's global `~/.claude/settings.json`.

REQ-CLD-RUN-007: The adapter MUST define an explicit output-capture contract for `exec` mode.
If Claude Code's headless JSON result is delivered on stdout (not a file, unlike Codex's
`--output-last-message`), the adapter MUST document and implement that distinction rather than
reusing Codex's file-based `outputCapture` shape unmodified.

REQ-CLD-RUN-008: Unsupported launch modes for the detected Claude Code version MUST return
`status: "unsupported"` with a structured diagnostic, and MUST NOT guess flags.

### Capability: Safe project materialization

REQ-CLD-MAT-001: `.mcp.json` writes MUST use a safe read/merge/write strategy that preserves
existing user-authored MCP server entries, following the pattern proven for `opencode.json` in
`packages/adapter-opencode/src/config-merge.ts`. Deck MUST NOT blind-overwrite the file.

REQ-CLD-MAT-002: `CLAUDE.md` writes MUST be confined to an exact Deck-owned marker span,
mirroring Codex's ownership of a marker-delimited section of `AGENTS.md`. All unowned bytes
MUST be preserved byte-for-byte.

REQ-CLD-MAT-003: Each selected Developer Team role MUST materialize to a Deck-owned file under
`.claude/agents/` using a collision-safe name; a same-name unowned existing file MUST block
that item instead of overwriting it.

REQ-CLD-MAT-004: Installation MUST support immutable planning, preview, backup, atomic apply,
verification, and rollback, consistent with the shared `RunnerBackupResult`/`RunnerRollbackResult`
contracts in `packages/core/src/runner-adapter.ts`.

REQ-CLD-MAT-005: The initial release MUST NOT persist `ANTHROPIC_API_KEY` or any other Claude
credential in project files, global Deck config, or generated MCP/settings content.

### Capability: Instruction translation

REQ-CLD-TRN-001: Deck MUST provide `validateClaudeInstructionTranslation()` (or equivalent)
that fails if any runner-specific vocabulary belonging to another runner (e.g. Codex- or
OpenCode-specific terms) leaks into materialized Claude content, mirroring the forbidden-terms
guard in `packages/adapter-codex/src/instruction-translation.ts:33-38`.

REQ-CLD-TRN-002: If the shared instruction bundles require no rewriting for Claude Code (as
expected, since they are already written in Claude-native vocabulary), the translation function
MAY be an identity pass-through, but the validator from REQ-CLD-TRN-001 MUST still run.

### Capability: Models

REQ-CLD-MDL-001: `getModelCatalog` MUST reuse the existing `anthropic` provider and
`anthropic/claude-*` entries from `packages/core/src/model-catalog.ts` rather than
redefining a parallel model list.

REQ-CLD-MDL-002: Unknown or unconfirmed reasoning/thinking support for a given model MUST
result in omission, never a fabricated default — matching REQ-CDX-INT-002's precedent.

### Capability: Honest capability reporting

REQ-CLD-DOC-001: `docs/reference/support-matrix.md` and `docs/runner-support.md` MUST NOT
describe Claude Code as parity with OpenCode until the corresponding capability is actually
implemented and verified; the initial release MUST be documented as `static-compatible` with
explicit gaps, following the same discipline applied to Codex.

REQ-CLD-DOC-002: Every capability gap deferred out of the initial release (see proposal.md
"Out of scope") MUST appear in the adapter's capability catalog as an explicit gap entry, not
be silently omitted.

## Acceptance scenarios

### Scenario: Claude Code is composed through the existing registry

**Given** the CLI starts with Pi, OpenCode, Codex, and Claude support
**When** it resolves the runner for the `"claude-development"` environment
**Then** it obtains the Claude implementation from `AdapterRegistry`, not from any
runtime-detection-only path.

### Scenario: Detection distinguishes present-and-compatible from merely-present

**Given** `claude` is on `PATH` but reports a version whose `--help` output does not match any
captured compatibility fixture
**When** Deck runs `detectRuntimes`
**Then** the result reports the binary as present but launch-incompatible, rather than
silently treating it as ready.

### Scenario: Launch policy cannot be overridden by caller input

**Given** a Developer Team launch input whose prompt text or model id contains strings that
resemble Deck's permission-policy flag
**When** `buildLaunchPlan` assembles argv
**Then** the owned-policy invariant check still finds exactly one Deck-inserted policy token
and the launch proceeds normally; a manipulated or duplicated token blocks the launch.

### Scenario: Resume with a malformed session id is blocked

**Given** a `resume-by-id` launch input whose `sessionId` contains a newline or starts with `-`
**When** `buildLaunchPlan` validates the input
**Then** it returns `status: "blocked"` with a diagnostic, and no process is spawned.

### Scenario: Existing user `.mcp.json` entries survive an install

**Given** a project's `.mcp.json` already contains a user-authored MCP server entry unrelated
to Deck
**When** Deck writes its own MCP server entry during Developer Team installation
**Then** the user's existing entry is unchanged and both entries are present afterward.

### Scenario: `CLAUDE.md` user content survives an install

**Given** a project's `CLAUDE.md` contains user-authored content outside any Deck marker span
**When** Deck materializes or updates the Developer Team section
**Then** only the Deck-owned marker span changes; all other bytes are preserved exactly.

### Scenario: A role-name collision blocks instead of overwriting

**Given** `.claude/agents/deck-architect.md` already exists and is not Deck-owned
**When** Deck plans installation of the `architect` Developer Team role
**Then** the conflict is reported as a collision and that file is not overwritten.

### Scenario: Credentials are never written to disk by Deck

**Given** a user has `ANTHROPIC_API_KEY` set in their shell environment
**When** Deck writes `.mcp.json`, `.claude/settings.json`, or any generated file
**Then** no generated file contains the credential value.

### Scenario: Unsupported resume mode reports a gap honestly

**Given** the detected Claude Code version's captured fixture does not advertise resume support
**When** a user requests `resume-latest`
**Then** Deck returns `status: "unsupported"` with a structured diagnostic instead of
attempting an unverified flag combination.
