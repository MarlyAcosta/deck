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

**Verification:** Three fixture-driven test cases in `runner-adapter.test.ts`, all passing:
binary absent (`isAvailable: false`), binary present with a version matching a captured fixture
(`isAvailable: true`, version reported), and binary present with an unrecognized version
(`state: "degraded"`, `claude-version-unrecognized` diagnostic — not silently treated as ready).

## Phase 2: Launch

### Task 2.1: Implement `buildClaudeLaunchPlan`

- Implement all four `RunnerLaunchInput` modes per `design.md`'s launch contract section.
- Implement the owned-policy-token invariant check (REQ-CLD-RUN-002/003).
- Implement stdin-only prompt delivery with `MAX_RUNNER_STDIN_PAYLOAD_BYTES` bounding
  (REQ-CLD-RUN-004) and opaque session-id validation (REQ-CLD-RUN-005).
- Implement the output-capture contract decided in Task 0.3.
- For `interactive` and `exec` (new-session modes), pass `input.modelId` through as a `--model`
  flag (Phase 0 confirms the exact flag name) when present, using the same bounded-scalar
  validation as the policy token — mirroring Codex's `launch.ts` handling of `input.modelId`.
  Resume modes MUST NOT reinject a model override (same precedent as Codex's resume behavior).

**Verification:** Contract tests cover: ready plans for all four modes, blocked launch on a
malformed session id, blocked launch on an oversized/invalid stdin payload, blocked launch if
the owned-policy invariant is violated, unsupported result for a mode the compatibility fixture
doesn't advertise.

### Task 2.2: Per-launch role/system-prompt injection

- Implement bounded, sanitized system-prompt injection for new sessions (REQ-CLD-RUN-006).
- Confirm resume modes do not reinject a system-prompt override (matching Codex's "resume
  preserves existing history" behavior).

**Verification:** A test proves no write occurs to `~/.claude/settings.json` (mocked home
directory) during any launch mode.

## Phase 3: Developer Team materialization

### Task 3.1: `.mcp.json` safe writer

- Implement `writeMcpConfig` using the OpenCode-style safe JSON merge (REQ-CLD-MAT-001).

**Verification:** A test with a pre-existing unrelated MCP entry proves it survives a Deck
write untouched.

### Task 3.2: `CLAUDE.md` marker-span merge

- Implement the owned marker-span merge (REQ-CLD-MAT-002).

**Verification:** A test with pre-existing unowned `CLAUDE.md` content proves only the marker
span changes, byte-for-byte elsewhere.

### Task 3.3: `.claude/agents/*.md` role materialization

- Implement per-role subagent file generation with collision detection (REQ-CLD-MAT-003).

**Verification:** Fresh install, unchanged-reapply (idempotent), and unowned-collision-blocks
tests all pass.

### Task 3.4: Instruction translation

- Implement `translateClaudeCapabilityInstructions()` (expected near-identity) and
  `validateClaudeInstructionTranslation()` per REQ-CLD-TRN-001/002.

**Verification:** The validator rejects a deliberately injected foreign-runner term in a test
fixture; it passes on the real shared instruction bundles unmodified.

### Task 3.5: Backup, verify, rollback

- Implement `backupDeveloperTeamFiles`, `verifyDeveloperTeamInstall`,
  `rollbackDeveloperTeamFiles` per REQ-CLD-MAT-004.

**Verification:** An interrupted-apply-then-rollback test restores prior state exactly.

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
