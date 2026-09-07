# Independent change Review

Verdict: **GO** for Lead-owned conditional Archive. Independent reviewer: `deck-quality`, 2026-09-07. **Critical: 0; Required: 0; Optional: 0.** Final release approval remains separate, after Archive and release-evidence/manifest updates.

## Reviewed subject

- `apps/cli/src/tui/app.web-search-developer-team.test.tsx`
- SHA-256: `c839a24be39c7cb61be375c43c532d3a2223f38cf2409c72cb8e7ca9d96bb9b4`
- HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`; branch/upstream `main` / `origin/main`; index entries unchanged and staging empty.
- External review snapshot: `/tmp/opencode/release-v0.4.0-tui-20260907/repair-review.json`.

Quality independently checked all 2,006 intake files: only the target test changed. All 2,012 review-snapshot paths match; the six additions are this change's artifacts. Five generated controls, production code, 0.4.0 metadata, CHANGELOG, lock, all four prior archives, prior release history and protected foreign WIP remain intact.

## Root cause and scope

The incomplete-fixture diagnosis is supported by defaults, strict capability detection, action ordering and retained process/render diagnostics—not inferred only from GREEN. Missing unrelated default-selected tools create automatic work ahead of Web Search configuration and team application. The test reached Install Progress with a ready plan but did not enter the real materializer during its wait. The precise reason an unrelated installer did not finish is not established, nor is a production Web Search defect claimed; neither is needed to repair this fixture's unintended scope.

The fix supplies usable evidence only for unrelated defaults. It does not synthesize Web Search readiness, replace the reviewed plan, bypass guards or create expected output files. Bound observation wrappers call the original methods, and production code performs actual filesystem materialization.

## Synchronization and assertions

Fresh render boundaries prevent stale matches. Condition waits observe render progress, real apply entry and actual files; installed Ink's flush implementation yields to its scheduler. Native team materialization writes synchronously, so the final-file observation does not interleave midway through that batch. New waits and cleanup are bounded at 5,000 ms; file timeout remains 20,000 ms. No sleeps, blind action retries, skips or fabricated successes.

The original 22-line role/standalone assertion block is byte-identical. Provider neutrality, own-role policy, other-role exclusion, provider-literal exclusion and standalone non-leakage assertions remain. Seven plan/effect assertions supplement them.

## Evidence independently assessed

- Original focal RED: exit 1, expected-file timeout, 0/1.
- Apply focal/file GREEN: 1/0 and 381 expectations each.
- Isolated old-fixture mutation: only empty review restored, guard fails before Install, 0/1 and two expectations. Mutated source hash matches; no other source differences in the mirror. Workspace candidate was preserved.
- Optional-diagnostics typing correction is logging-only; earlier source bytes reconstruct to the recorded hash and do not invalidate the regression guard proof.
- Final affected file: 1/0, 381 expectations. Final TypeScript: exit 0, no diagnostics. Initial TS18048 remains retained.
- Related checks: 216/0, 995 expectations, 10 files, including all 11 process tests.
- One new complete suite: 4,829 pass, one pre-existing canary skip, zero failures, 20,699 expectations; 4,830 tests/309 files/204.99 seconds. Affected TUI test: 922.43 ms.
- Consistent started/running/result receipts identify child 973340 and supervisor 973337 with terminal exit 0. Only one unfiltered full-suite receipt exists in the new evidence directory.

The allowlisted CI environment exposes only Bun/bunx and Node/npm/npx, with personal tools absent and temporary HOME/XDG/TMPDIR. It does not inherit credentials. Prior passing descriptor/helper/benchmark/compiled/build/canonical-validation gates remain reusable for this test-only delta.

Quality reran no tests, gates, generation or validation and modified no files or Git state. Graph coverage is partly excluded/stale; exact source, retained logs and byte comparisons ground the findings. Adaptive project memory was not used.
