# Tasks: Claude Code CLI Runner Support

## Execution rule

Keep one implementation owner through Phases 0–2 (the first launchable candidate). Do not split
the vertical by file. Phases 3–5 are deltas on that candidate; rerun only invalidated checks
before each phase's verification gate, not the full suite from scratch every time.

## Phase 0: Compatibility and safety spikes — COMPLETE (all three tasks verified live against `claude` v2.1.251, authenticated)

### Task 0.1: Confirm exact Claude Code CLI surface — DONE

- Ran `claude --help` (v2.1.251) against a real local install (`claude` is a single command with
  `-p`/`--print` as a flag, not a separate `claude -p --help`). Confirmed real flags:
  `-p, --print`; `--output-format <text|json|stream-json>`; `--permission-mode <mode>` with
  choices `acceptEdits, auto, bypassPermissions, manual, dontAsk, plan`; `-r, --resume [value]`
  (session ID or interactive picker); `-c, --continue`; `--append-system-prompt[-file]`;
  `--system-prompt`; `--mcp-config <configs...>`; `--settings <file-or-json>`;
  `--setting-sources <sources>`; `--session-id <uuid>`; `--bare`; `--strict-mcp-config`;
  `--dangerously-skip-permissions` and `--allow-dangerously-skip-permissions` (two distinct
  flags — the second enables the option to exist without it being on by default); `--restricted`
  (removes command-running tools). No `--output-last-message` or any file-output flag exists.
- Full `--help` output captured to `claude-fixtures/help.txt` (274 lines); to be moved into the
  adapter package's fixtures once Phase 1 scaffolds it.

**Verification:** Fixture captured from the real binary; every flag cited by `spec.md`/`design.md`
confirmed present with the exact spelling used in those documents.

### Task 0.2: Decide Deck's fixed launch-policy token — DONE

- Tested three candidate mechanisms live: `--dangerously-skip-permissions` alone (Bash call
  denied by an undocumented "Claude Code auto mode classifier"), that same flag combined with
  `--allow-dangerously-skip-permissions` (same denial), and `--permission-mode bypassPermissions`
  alone (Bash call succeeded, `permission_denials: []`).
- Decision: `--permission-mode bypassPermissions` is Deck's fixed launch-policy token — recorded
  in `design.md` with the real evidence from all three tests, including the negative result that
  would have been missed by naming-convention guesswork alone.

**Verification:** Done — real `is_error`/`permission_denials` evidence from a live call recorded
in `design.md`; decision is not a placeholder and is not the name-similar-but-wrong flag.

### Task 0.3: Decide the output-capture contract — DONE

- ~~Run `claude -p --output-format json` against a real install~~ Done: confirmed the full
  result (including `result`, `session_id`, `is_error`, `subtype`, `total_cost_usd`, `usage`)
  is a single JSON object on stdout; no file-based channel exists (`claude --help` has no
  `--output-last-message` equivalent).
- Decision recorded in `design.md`: adapter redirects captured stdout to a Deck-managed tmpfile
  itself, keeping the existing `outputCapture.finalAssistantMessage` (`source: "file"`) contract
  unchanged for every consumer outside the new package.

**Verification:** Done — see `design.md` "Output capture" section for the recorded decision and
real observed JSON shape.

## Phase 1: Minimal composition and detection — COMPLETE

### Task 1.1: Scaffold `@deck/adapter-claude` — DONE

- Built: `package.json`, `src/index.ts`, `src/types.ts`, `src/compatibility.ts` (using the
  Task 0.1 fixtures), `src/team-catalog.ts`, `src/preflight.ts`, `src/runner-adapter.ts`.
- Registered in `apps/cli/src/runner-adapters.ts` (one import, one
  `DefaultAdapterRegistryOptions.claude` field, one `register("claude", ...)` call) and
  `apps/cli/package.json` (`@deck/adapter-claude: workspace:*`).
- All ~20 non-optional `RunnerAdapter` methods are implemented: the genuinely trivial/real ones
  (`getTeams`, `getModelCatalog`, `readModelAssignments`/`readThinkingAssignments`,
  `resolveThinking`/`getDefaultThinking`/`getThinkingLevels`/`supportsThinking`) are real, honest
  current-state implementations (not fabricated data); everything Phase 3/4 territory
  (`buildReviewPlan`, `buildInstallationPlan`, `runAction`, `buildDeveloperTeamInstallPlan`,
  `applyDeveloperTeamInstall`, `getCapabilityInventory`, `getNextScreen`, `inspectEnvironment`,
  `reviewTools`, `backupDeveloperTeamFiles`, `rollbackDeveloperTeamFiles`,
  `verifyDeveloperTeamInstall`, `getCapability`, `getCapabilityIds`, `getSelectableTools`) throws
  a clear `ClaudeRunnerAdapter.<method>() is not implemented yet (planned for Phase N)` error
  pointing at this file, matching every stub method's full declared parameter arity (a real bug
  caught by `tsc --noEmit`: zero-arg stubs type-checked against the `RunnerAdapter` interface but
  failed when called through the concrete class — fixed by declaring the same arity as the
  interface, params prefixed `_`). `buildLaunchPlan` is intentionally omitted entirely (it's
  optional on `RunnerAdapter`) until Phase 2 — omitting an optional method the type system
  doesn't require is a more honest signal than a throwing stub for one it does.
- Fixed `apps/cli/src/runner-adapters.codex.test.ts`, whose "authoritative composition path"
  assertion listed only `["pi","opencode","codex"]` and whose "innocuous inspection" test called
  `getCapabilityIds()` generically across every registered adapter — both needed updating now
  that a fourth, intentionally-incomplete adapter is registered (confirmed via grep this is the
  *only* production or test call site of `getCapabilityIds()` across `apps/cli/src`, so the
  throwing stub is safe everywhere else).

**Verification — actually run, not just described:**
- `bun test packages/adapter-claude`: 29 pass, 0 fail.
- Full `bun test`: 4648 pass / 1 skip / 24 fail / 3 errors (307 files). Diffed line-by-line
  (via `git stash` before/after comparison on this exact checkout, not a separate clone) against
  the pre-Phase-1 state: **the failing-test-name set is byte-for-byte identical** — only
  millisecond timings differ. Zero regressions introduced.
- `bunx tsc --noEmit -p tsconfig.json`: 0 errors from any file this change touches. The 11
  remaining errors (`Cannot find module '@deck/adapter-pi'` etc. in unrelated `adapter-pi`/`core`
  test files) were confirmed pre-existing via the same stash-comparison method.
- `bun run deck --version` boots cleanly with the adapter registered (menu renders, no
  import/registration errors).

### Task 1.2: Implement real detection — DONE

- `detectRuntimes`/`inspectProject` (`src/preflight.ts` + `src/runner-adapter.ts`) go beyond the
  existing PATH-only check in `apps/cli/src/runtime-detection.ts` (untouched, still works
  identically for all runners) to report version and compatibility-fixture match, distinguishing
  "binary present" from "binary present and launch-compatible" per REQ-CLD-COMPAT-002.

**Verification:** Fixture-driven test cases in `runner-adapter.test.ts`, all passing: binary
absent (`isAvailable: false`); binary present with version reported.

**Corrected during Phase 2 (a real bug caught by a failing test, not by inspection):** the
original implementation looked up a *static captured fixture* by version number
(`findClaudeFixture(probe.version)`) rather than deriving compatibility from the actually-probed
live `--help` text — meaning it would report whatever the captured fixture said, not what the
installed binary actually does, and any version not in the fixture map fell back to a
`"degraded"` state with zero evidence even when the live text plainly supported every launch
mode. Fixed to match Codex's proven precedent (`inspectCodexProject` parses `probe.help`
directly, never a fixture lookup): compatibility is now always derived from the live probe.
Captured fixtures exist only for `compatibility.test.ts`'s offline determinism, never for this
runtime path. `inspectProject` no longer has a `"degraded"` branch — it's `"blocked"` (binary
missing) or `"ready"` with evidence narrowed to whatever the live text actually shows.

## Phase 2: Launch — COMPLETE

### Task 2.1: Implement `buildClaudeLaunchPlan` — DONE, with one corrected design decision

- Built `packages/adapter-claude/src/launch.ts`: `buildClaudeLaunchPlan()` covers all four
  `RunnerLaunchInput` modes, the owned-policy-token invariant (`hasOwnedLaunchPolicy`,
  REQ-CLD-RUN-002/003), stdin-only prompt delivery bounded by `MAX_RUNNER_STDIN_PAYLOAD_BYTES`
  (REQ-CLD-RUN-004), opaque session-id validation (REQ-CLD-RUN-005), and `--model` pass-through
  on new sessions only (mirroring Codex's `launch.ts`). Wired into
  `ClaudeRunnerAdapter.buildLaunchPlan` via `inspectProject`-derived feature flags.
- **Corrected during implementation, not assumed correct:** the output-capture contract decided
  in Task 0.3 ("adapter redirects captured stdout to a Deck-managed tmpfile") turned out to be
  unimplementable as stated — reading `apps/cli/src/runner-launch-command.ts`'s
  `trustedFinalAssistantMessage()` showed it only ever *reads* a file at `contract.path`; it
  never writes one. Codex's file exists because the `codex` subprocess itself writes it via
  `--output-last-message <path>`; Claude has no equivalent flag, so a `source: "file"` contract
  would have silently produced no final message on every exec launch. Fixed properly rather than
  worked around: added a `"stdout"` variant to `RunnerLaunchPlan.outputCapture.finalAssistantMessage`
  in `packages/core/src/runner-adapter.ts` (a discriminated union now, `file` keeps `path`;
  `stdout` has none) and a matching branch in `trustedFinalAssistantMessage()` that reads the
  already-captured, already-redacted process stdout instead of a filesystem path. This is a
  small, shared (not Claude-specific) change — user-approved before making it. The captured
  content is Claude's raw JSON result object (not yet extracted to just the `result` field);
  that extraction is flagged as Phase 4 work via an `info`-severity diagnostic in every exec
  launch plan.

**Verification — actually run:** `bun test packages/adapter-claude`: 55 pass (26 new since
Phase 1). Full `bun test`: 4674 pass / 24 fail / 3 errors (308 files) — diffed against a fresh
stash-based pre-Phase-2 baseline with the exact same failing-test-name set (`diff` exit 0,
timings stripped): zero regressions, including in the shared `runner-launch-command.ts` this
task touched. `bunx tsc --noEmit`: 0 errors from any touched file (6 of my own were caught and
fixed — test assertions accessing `.code` on a `RunnerLaunchResult` without narrowing past the
`"ready"` variant first). Contract tests cover: ready plans for all four modes; blocked launch
on a malformed/flag-like/newline-containing session id; blocked launch on an oversized stdin
payload; blocked launch on an unsafe `--model` value; the owned-policy token is always argv[0..1]
exactly once; `stdout`-sourced (not file-sourced) output capture on exec; unsupported result for
a mode the live-probed help text doesn't advertise.

### Task 2.2: Per-launch role/system-prompt injection — mechanism done, not yet wired with content

- `buildClaudeLaunchPlan()` accepts an optional `ClaudeNewSessionBootstrap { systemPromptAppend }`
  and, when present, emits it via bounded (`MAX_CLAUDE_BOOTSTRAP_BYTES = 4096`), sanitized
  `--append-system-prompt` on new sessions only (REQ-CLD-RUN-006) — resume modes never receive
  one, verified by a passing test.
- `ClaudeRunnerAdapter.buildLaunchPlan` does not pass a `bootstrap` yet — there is no Developer
  Team role content to inject until Phase 3 builds `.claude/agents/*.md` materialization. This is
  intentional, not an oversight: the mechanism is real and tested; wiring it to real content is
  explicitly Phase 3's job.

**Verification:** `launch.test.ts` proves resume modes never carry `--append-system-prompt` even
when a bootstrap is supplied, and that an invalid/oversized bootstrap blocks the launch rather
than silently truncating or omitting it.

## Phase 3: Developer Team materialization — COMPLETE

**Scope note, recorded here rather than left implicit:** unlike Codex's/OpenCode's equivalent
phase, this pass does not materialize the 29 bundled external standalone skills or the
`deck-onboard`/`deck-archive` bootstrap skills. Only the 7 canonical roles (`.claude/agents/*.md`
+ matching `.claude/skills/*/SKILL.md`) and `CLAUDE.md` are covered. `input.standaloneSkills` is
accepted by the type but intentionally unused. This is an explicit deferral (tracked as new
Task 3.6 below), not a silent gap — nothing in Deck's TUI can select standalone skills for
Claude yet anyway, since `getCapabilityInventory`/`getCapabilityIds` remain Phase 4 stubs.

### Task 3.1: `.mcp.json` safe writer — DONE

- `src/mcp-config.ts`: `writeClaudeMcpConfig()` — read/merge/atomic-write/validate, single
  server entry, mirroring OpenCode's `config-merge.ts` algorithm (REQ-CLD-MAT-001). Maps
  `type: "local"` + `command` to a `stdio` entry, `type: "remote"`/`url` to an `http` entry.
  Wired into `ClaudeRunnerAdapter.writeMcpConfig`.

**Verification:** 7 tests in `mcp-config.test.ts`, all passing on a real temp-directory
filesystem (not mocked fs): a pre-existing unrelated server entry and an unrelated top-level key
both survive a write untouched; invalid existing JSON is refused rather than blindly
overwritten; a path-traversal-shaped server name is rejected.

### Task 3.2: `CLAUDE.md` marker-span merge — DONE

- `src/claude-md.ts`: `mergeClaudeMd()` — same marker text
  (`<!-- deck:developer-team:start/end -->`) and same single-owned-span invariant as Codex's
  `AGENTS.md` handling (REQ-CLD-MAT-002).

**Verification:** 6 tests in `claude-md.test.ts`: pre-existing unowned content survives both
before and after the marker span; a second merge is byte-identical to the first (idempotent);
duplicate or unterminated markers block instead of guessing.

### Task 3.3: `.claude/agents/*.md` role materialization — DONE

- `src/agent-files.ts` + `src/developer-team-install.ts`: `buildClaudeDeveloperTeamInstallPlan()`
  calls the shared `buildDeveloperTeamManifest()` (the same canonical content-assembly core
  function Codex/OpenCode use — no role content was reinvented) and materializes each of the 7
  `DEVELOPER_TEAM_AGENTS` as `.claude/agents/<id>.md` (YAML frontmatter + composed instruction)
  plus a matching `.claude/skills/<id>/SKILL.md` (validated against the shared
  `parseSkillDescriptor` contract). Collision detection (REQ-CLD-MAT-003) via an ownership
  marker placed as the first line of the *body*, never before the frontmatter — Claude Code's
  frontmatter parser requires `---` to be the file's literal first line, unlike Codex's TOML
  role files which can carry a leading marker comment safely; this was designed correctly up
  front, not discovered as a bug.

**Verification:** `agent-files.test.ts` (9 tests) + `developer-team-install.test.ts` (9 tests),
all passing on a real filesystem: fresh install produces exactly 7 agent files + 7 skill files +
CLAUDE.md (15 total); every produced file is recognized as Deck-owned; planning again after
applying is byte-identical (idempotent); a pre-existing unowned agent file blocks the whole
plan with a specific diagnostic rather than being silently overwritten; CLAUDE.md's pre-existing
human content is preserved (marker-span merge, not whole-file ownership, is the correct model
there).

### Task 3.4: Instruction translation — DONE

- `src/instruction-translation.ts`: `translateClaudeCapabilityInstructions()` is a literal
  identity function (confirmed correct, not assumed — the shared bundles are already
  Claude-native) and `validateClaudeInstructionTranslation()` guards against foreign-runner
  vocabulary per REQ-CLD-TRN-001/002. Wired into `buildClaudeDeveloperTeamInstallPlan` so it
  actually runs on every materialized file, not just in isolated unit tests.

**Verification:** `instruction-translation.test.ts` (5 tests) covers identity pass-through and
rejection of injected `OpenCode`/`Codex`/`adapter-codex`/`--opencode` terms, including
line-number-accurate multi-violation reporting. A dedicated integration test in
`developer-team-install.test.ts` proves the validator is actually invoked during real plan
building (a capability-instruction fragment containing "OpenCode-specific" blocks the whole
plan), not just exercised in unit isolation.

### Task 3.5: Backup, verify, rollback — DONE, intentionally smaller in scope than Codex's

- `src/transaction.ts`: `backupClaudeFiles`/`applyClaudeFiles`/`rollbackClaudeFiles`/
  `verifyClaudeFiles` (REQ-CLD-MAT-004) — snapshot-then-restore backup, atomic per-file writes
  (temp-then-rename), content-hash-free direct comparison for verify. Deliberately not
  Codex-level (no persistent, crash-recoverable journal) — recorded as a real scope decision in
  `design.md`, not a hidden gap.
- Wired into `ClaudeRunnerAdapter` via a `WeakMap<plan, projectRoot>`, needed because
  `backupDeveloperTeamFiles(plan)`/`verifyDeveloperTeamInstall(plan)` receive only the plan
  object (confirmed by reading the actual interface signatures and Codex's own
  `#nativePlans`/`#planOperations` WeakMaps, not assumed) — `applyDeveloperTeamInstall` needs no
  such trick since `DeveloperTeamApplyInput.projectRoot` is passed directly.

**Verification:** `transaction.test.ts` (10 tests) on a real filesystem: create vs. update vs.
unchanged-skip classification; full backup→apply→rollback round trip restores exact prior
*absence*; a separate round trip restores exact prior *content* (not just deletes); an
invalid/missing backup payload reports `nothing-to-do` rather than crashing; verify catches both
missing files and content drift. A further integration test in `runner-adapter.test.ts` runs
the entire build→backup→apply→verify→rollback sequence through the public `ClaudeRunnerAdapter`
surface (not the internal pure functions directly), and a separate test confirms
`backupDeveloperTeamFiles`/`verifyDeveloperTeamInstall` degrade to a diagnostic — not a throw —
for a plan object this adapter instance never produced.

**Cross-cutting verification for all of Phase 3:** `bun test packages/adapter-claude`: 96 pass,
0 fail (up from 55 after Phase 2). Full `bun test`: 4715 pass / 24 fail / 3 errors across 314
files — the failing-test-name set matches the same known pre-existing baseline established in
Phases 1–2 exactly (no new regressions; this phase touched zero files outside
`packages/adapter-claude`, so the blast radius was inherently smaller than Phase 2's shared-code
change). `bunx tsc --noEmit`: 0 errors from any touched file — one real bug caught and fixed
along the way: a JSDoc comment containing the literal text `` `.claude/skills/*/SKILL.md` ``
contained an accidental `*/` that closed the block comment early, corrupting everything parsed
afterward; fixed by rewording to `<skillId>` instead of a glob-style asterisk.

### Task 3.6: Standalone and bootstrap skill materialization — deferred, not started

- Explicitly out of this pass's scope (see the note at the top of this phase). Materialize the
  29 bundled external skills (`getStandaloneSkills()`/`getStandaloneSkill()`) and the
  `deck-onboard`/`deck-archive` bootstrap skills (`getBootstrapSkillFiles()`) to
  `.claude/skills/<id>/SKILL.md`, mirroring Codex's Tasks 2.4/2.5 exactly — the shared core
  catalog functions already exist and were confirmed usable during Phase 3 exploration; only the
  Claude-specific file-path wiring is missing.

## Phase 4: Models, capability catalog, doctor

### Task 4.1: Model catalog wiring

- Implement `getModelCatalog`/`readModelAssignments`/`readThinkingAssignments` reusing the
  existing `anthropic` provider entries (REQ-CLD-MDL-001/002).

**Verification:** Assigning `anthropic/claude-opus-4` to a role round-trips through
plan→apply→read.

### Task 4.2: Capability catalog with honest gaps

- Build `getCapabilityInventory`/`getCapability`/`getCapabilityIds` listing every supported
  capability and every explicit gap deferred from proposal.md's "Out of scope" (REQ-CLD-DOC-002).

**Verification:** Every "Out of scope" item from `proposal.md` has a corresponding gap entry
in the catalog; none are silently absent.

### Task 4.3: Doctor integration

- Implement `diagnoseProject` for `deck doctor`.

**Verification:** `deck doctor` against a scratch project with a Claude install reports
meaningful, non-`unknown` diagnostics.

## Phase 5: Documentation and hardening

### Task 5.1: Update support documentation

- Update `docs/runners.md`, `docs/runner-support.md`, `docs/reference/support-matrix.md` to
  reflect Claude's actual, earned status (`static-compatible`, not full parity) per
  REQ-CLD-DOC-001.

**Verification:** `deck skill-registry`/documentation-governance tests (see
`tests/documentation-governance.test.ts`) pass against the updated docs.

### Task 5.2: Full regression gate

- Run `bun test` (full suite), typecheck, and build across the monorepo.

**Verification:** No regression in existing Pi/OpenCode/Codex test counts; new
`@deck/adapter-claude` tests pass; `deck openspec validate --change-id
add-claude-code-runner-support` passes with no errors.
