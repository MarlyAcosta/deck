# Apply evidence

Implementation owner: `deck-apply-deep`. Only `packages/adapter-codex/src/runner-adapter.test.ts` changed from intake. Existing stabilization WIP was preserved.

- RED: Lead's original two tests without Codex: 0 pass, 2 fail, 14 expectations, exit 1.
- Repair: inject an offline supported version/help fixture through `CodexPreflightEffects`; read actual temporary project configuration, roles, skills and instructions rather than fabricating installation readiness.
- Regression: child Bun test process uses an empty PATH and isolated HOME/XDG/TMPDIR, explicitly checks Codex ENOENT, then executes the two original tests using absolute `process.execPath`.
- GREEN: original pair 2 pass, 0 fail, 28 expectations; regression 1 pass, 0 fail, 2 expectations.
- Full logs: `/tmp/opencode/release-v0.4.0-20260907/codex-green-focused.log`, `codex-green-hermetic-child.log`.
- No production modifications, installations, live providers, global environment changes, new sleeps/retries, or timeout increases.
