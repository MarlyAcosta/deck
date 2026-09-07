# Make Codex tests CI-hermetic

## Intent and authority

Prepare Deck v0.4.0 without relying on an installed Codex CLI in the two inherited RunnerAdapter readiness tests. The user explicitly authorized test-only TDD repair, independent Review, and canonical Archive in this session. Production behavior, external installations, global environment, generated assets, unrelated WIP, staging, commits, push, tags, and publication are outside this repair.

## Acceptance

- The two readiness tests MUST pass with no Codex executable on the test process PATH.
- Tests MUST use the existing injectable preflight/process boundary and offline version/help fixtures while retaining real temporary project configuration inspection.
- Regression coverage MUST demonstrate the missing-executable environment without changing the parent process environment or invoking live providers.
- No production source, sleeps, retries, or timeout increases are permitted.
- Focused GREEN and independent Review GO are required before Archive.

## Current evidence and trace

- Base HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`; index empty.
- `.github/workflows/release.yml` installs Bun 1.3.12 and dependencies, not Codex CLI.
- `packages/adapter-codex/src/runner-adapter.test.ts` tests: `separates selected instructions from MCP, shared-binary, provider, and index readiness` and `reuses validated Deck-owned Serena evidence and blocks a missing launcher before writing MCP config`.
- `CodexRunnerAdapter` defaults to `defaultProbe`, which calls `node:child_process.spawnSync` for Codex version/help. Missing executable makes `inspectCodexProject` return before reading the temporary project's configuration. The graph incorrectly resolves the `spawnSync` edge to the CLI wrapper; direct source imports are authoritative.
- RED on 2026-09-07: pinned Bun 1.3.12, controlled PATH without Codex, isolated HOME/XDG/TMPDIR, 0 pass / 2 fail / 14 expectations, exit 1. Failures are missing installed MCP readiness at the existing assertions, not timeouts.
- Full RED log and environment receipt: `/tmp/opencode/release-v0.4.0-20260907/codex-red.log` and `codex-red.json`.

## Plan and ownership

Lead owns lifecycle writes. `deck-apply-deep` owns one test-only candidate through GREEN. `deck-quality` reviews read-only. The release's single final broad verification sequence follows this repair; focused verification is sufficient for this bounded test-only change, with no broader failure waiver inferred.

## Risks and non-goals

Do not replace project snapshot inspection with fabricated readiness that hides installation drift. Preserve all existing assertions and unrelated test WIP. Existing archived changes remain closed and untouched. No claim of live Supermemory acceptance or universal clean-CI coverage is made.
