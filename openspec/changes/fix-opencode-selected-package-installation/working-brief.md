# Working Brief: OpenCode Selected Package Installation Repair

## Intent

Ensure a Deck reinstall configures Context7 when its MCP entry is missing, installs Serena when the user explicitly selects it in the current interactive runner operation, and preselects safe local package guidance in fresh TUI installs.

## Acceptance

- Bare `npx` availability does not count as usable Context7 evidence.
- A valid configured `npx -y @upstash/context7-mcp` entry remains usable Context7 evidence.
- Missing selected Context7 remains eligible for the OpenCode installation plan.
- Toggling Serena in the interactive Packages screen selects both its instruction bundle and its install capability for the current operation.
- The interactive Serena selection records current-operation authorization and clearing it removes that authorization.
- Defaults, persisted package-instruction state, and programmatic projection cannot authorize Serena installation.
- Non-Serena package-instruction toggles remain independent from runtime capability selection.
- Fresh runner package state preselects Codebase Memory, Context Mode, and RTK.
- Adaptive Memory remains off until its provider flow selects it, and Serena remains off until the current-operation explicit selection.
- Persisted explicit false values remain respected; no existing preference is silently migrated.
- Extensible runners default-enable only local packages declared in their `packageInstructionIds` metadata.
- Tests use injected state and filesystem evidence only; they do not install packages, access the network, or modify user configuration.

## Root Cause

- Context7 PATH detection used `npx` as if it were the capability executable. Any Node installation therefore promoted Context7 to usable even when no Context7 MCP entry existed, suppressing repair planning.
- The dashboard Packages screen toggled `packageInstructions.serena` only. Serena installation is correctly protected by a separate explicit current-operation capability gate, but the user-visible package selection never reached that gate.
- After selection reached the installer, the controlled official `uv` acquisition used a 30-second bound for both the redirect-aware response and installer process. A real reinstall exhausted that bound before any Serena configuration write and failed with `evidence/response-timeout`.

## Decisions

- Use the Context7 package identity for fallback executable evidence while preserving the existing configured-MCP validation path.
- Treat `toggle-package-instruction` as the user-originated Packages-screen action. For Serena only, atomically project that action into the existing explicit capability-selection gate.
- Keep `set-package-instruction` instruction-only so persisted or programmatic state cannot authorize Serena bootstrap.
- Do not change Serena bootstrap, installer, readiness, cancellation, or MCP-write safety logic.
- Increase only the still-bounded official `uv` acquisition/installer window to two minutes, matching the existing bounded Serena child-process window. Redirect, URL, credential, response-size, cancellation, owned-storage, and configuration gates remain unchanged.
- Supersede the earlier all-disabled package-instruction default for fresh state: derive defaults from canonical metadata, enabling Codebase Memory, Context Mode, and RTK while keeping provider-bound Adaptive Memory and explicitly authorized Serena disabled.
- Preserve explicit stored choices and persist a complete canonical false projection for packages unsupported by extensible runners so global defaults cannot leak unsupported instruction bundles into them.

## Non-Goals

No edits to `~/.config/opencode`, no local package installation, no network access, no canary installation, no release, no automatic Adaptive Memory provider selection, and no migration that overwrites explicit stored package preferences.

## Evidence

- RED reproduced Context7 as `usable` with only an executable `npx` on PATH.
- RED reproduced the interactive Serena row setting its instruction bundle while leaving `selectedCapabilities.serena` false.
- The focused five-file regression suite passed with 61 tests and 216 expectations.
- The composed tests prove missing Context7 reaches `buildOpenCodeInstallationPlan` and an interactive Serena toggle reaches `buildOpenCodeRunnerReviewPlan` as `capability.serena.install`.
- The full affected OpenCode adapter plus runner-dashboard suites passed with 608 tests and 2,414 expectations.
- The complete CLI TUI suite passed with 364 tests and 2,013 expectations.
- `bunx tsc --noEmit` and `git diff --check` passed.
- Independent Quality returned GO with no critical, high, or medium findings. Its low recommendation for composed detection/UI-to-plan tests was added and reverified.
- A live reinstall then reached Serena bootstrap and reproduced `evidence/response-timeout`, proving selection/planning were repaired and localizing the remaining failure to the official `uv` response bound.
- RED locked the acquisition and installer window at two minutes while production still supplied 30 seconds; GREEN passed all 18 Core Serena bootstrap tests after the bounded timeout repair.
- The Serena bootstrap, OpenCode install adapter, dashboard action runner, TUI Serena bridge, and runner install contract suite passed with 87 tests and 416 expectations; TypeScript passed again.
- Independent Quality returned GO for the timeout delta with no blocking findings. It noted only a residual cancellation-latency risk if an installer child ignores immediate termination; safety gates still prevent later work and configuration writes.
- The user confirmed the live reinstall completed successfully with all requested tools installed.
- RED showed seven fresh-default assertions failing against the prior all-disabled package state; GREEN passed 98 focused Core/dashboard tests after the default projection changed.
- Broader verification exposed and prevented two unsafe overgeneralizations: Adaptive Memory cannot default on without its provider flow, and extensible runners cannot inherit packages absent from their adapter metadata.
- Core config passed 88 tests, the OpenCode adapter passed 491 tests, and the directly affected TUI files passed 92 tests plus the changed Codex render case in isolation. TypeScript and `git diff --check` passed.
- The complete TUI run reached 364/365. Separate runs crossed different hardcoded five-second Codex waits; the affected render case passes with an isolated/relaxed runner boundary, so the timing instability remains disclosed rather than counted as a clean full-suite pass.
- Initial independent Quality returned NO-GO because Home Configure Packages treated every new default as always enabled, its baseline label selected the first default rather than the non-configurable baseline, and one Core expectation still encoded the old defaults.
- The follow-up now applies configurable bundles strictly from current toggles, labels only Code Economy as always-on, and proves that disabling a fresh default removes it from both persisted config and the immediately generated bundle. The focused Home flow, 31 instruction-bundle tests, 75 Core config tests, 92 affected TUI tests, and changed Codex render case all pass.
- Independent re-review returned GO with all prior findings resolved and no new findings. Three adaptive-memory parity hash failures remain disclosed as unrelated baseline debt in untouched source while Adaptive Memory stays default-off.

## Status

Implemented and verified. A live retry of the new default-selection behavior remains user-run. The successful external Serena installation modified `.serena/project.yml`; that user-generated file is preserved and is not part of this source delta.
