# Independent Review: Clean-Checkout Release Repair

## Code verdict

**GO for code; conditional GO for follow-up PR preparation.**

Independent `deck-quality` review found no Critical or blocking code defect. Its Required condition is to complete and bind fresh-worktree TypeScript and causal release checks before claiming final readiness. This is not merge, tag, or publication approval.

## Findings

- The optional programmatic metadata path is backward-compatible. CLI invocation still uses `main(argv)` without options. Default path, staleness comparison, override, missing-metadata behavior, help/hash bypass and rejection-before-output order are unchanged. Metadata is read as text, not executed.
- Runtime tests exercise unmodified production source in independent temporary module namespaces, with generated values, real fallback and cached object identity. No shared-cache deletion or process-CWD mutation occurs.
- Matching/stale/absent metadata is explicit in helper tests. Actual Bun CLI subprocess cases cover the unchanged CWD-relative lookup, rejection status/error and absence of a rejected output file.
- Four workspace declarations are development-only. Core gains no production adapter dependency. The lockfile adds exactly eight lines and changes no external resolution.
- The four manifest regressions catch undeclared dependencies even if a local hoisted install would otherwise mask them.

**Optional:** fixture setup in `loadIsolatedBuildInfo` can leave its private temporary directory if copying, fixture creation or dynamic import throws before returning to the caller's cleanup block. This is non-blocking test-harness hygiene, not a production effect.

## Reviewed file hashes

| File | SHA-256 |
|---|---|
| `apps/cli/src/runtime/__tests__/build-info.test.ts` | `197ea3ac1510b20c589ac8a81da1c48b20d585789853f5fd9e81b5abe40ff5a5` |
| `scripts/prepare-release.ts` | `9605192fb383d9c05186772cb4138aaae511faf3d6624fb27c1b651db06fa2eb` |
| `scripts/prepare-release.test.ts` | `b73d47d6fc26227e7261a333025d9b9f110fd5ea2783603b11a11511416ab5dc` |
| `packages/core/package.json` | `737da671312458bce85315201ef8966f971f2486ecadf318fd63488da22ab44a` |
| `packages/adapter-pi/package.json` | `e0ad38d24fb531e77ebc2b4ec832b9814b3435f550568e5d9ac19cd19b1b8382` |
| `bun.lock` | `4803d3394428c66525ace17c26acbd653bdd8b6c531fa9a7594e93cc3536626c` |
| `tests/workspace-test-dependencies.test.ts` | `1c8f8d6ade91bdcd3b0c426ff3dc63fac782c02a7151254e20cb853e9263161f` |

The reviewer independently rehashed all 2,011 snapshot entries. The verification worktree matched completely; the implementation worktree differed only in the later reporting-only working-brief update. Generated build-info remained absent in both roots. Review checked the final clean suite receipt: 4,836 pass, one existing skip, zero failures, exit 0.

## Limits

Review was read-only. No tests, installs, builds, validation, generation, providers or Git mutations were performed by Quality. Direct source, diffs and receipt/hash evidence support this verdict; stale/excluded graph coverage and adaptive memory do not supply completeness or authority.

Lead will append the final verification disposition after the remaining receipts become available, without changing the reviewed code.

## Final receipt-only closure — 2026-09-08

**GO for follow-up PR preparation. Critical: 0. Required: 0 remaining.**

The same independent reviewer inspected the four fresh-worktree terminal receipts and verified their log hashes: TypeScript exit 0 without diagnostics, memory benchmark 13/13, compiled native runtime/CLI checks and three non-native compilations successful, and canonical OpenSpec validation with one archived change and zero errors/warnings. The prior verification condition is closed.

All seven reviewed file hashes and the previously verified 4,836 pass / one existing skip / zero fail full-suite evidence remain applicable. Only reporting documents changed after the source review. The optional fixture-helper failure-cleanup recommendation remains non-blocking and was not expanded into this candidate.

This closure was receipt-only, with no renewed code review, test execution, installation, build, generation or Git mutation. There is no claim of a separate full build command, successful remote workflow, TLS verification or non-native execution. Merge, tagging and publication remain unauthorized.
