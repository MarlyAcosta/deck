# Working Brief: Clean-Checkout Release Verification

## Intent and authorization

Repair the clean-checkout failures in the main Release workflow after PR #2 merged. The user authorized the bounded repair and preparation of a follow-up PR. Merge, stable tagging, and publication are not authorized for this follow-up.

Base: `855ee0f3712310d4de0a3d28a84e4c0460e80cf0`.
Branch: `codex/fix-release-clean-checkout`.
Implementation worktree: `/tmp/opencode/deck-release-clean-checkout`.
The original worktree and unrelated user WIP must remain untouched.

## Observed failure

GitHub Actions run `34164817079` failed in the full test suite: 4,685 passed, one existing skip, 11 failures and three module-load errors. Builds and publication jobs were skipped. The merge tree equals the previously reviewed preparation tree; no merge discrepancy caused the failure.

- Build-info tests resolve an absent generated module in setup even for fallback cases.
- Prepare-release tests read ignored local generated metadata directly and assume it exists for stale-metadata checks.
- Core tests cannot resolve `@deck/adapter-pi`; Pi installation tests cannot resolve `@deck/adapter-supermemory` from a clean dependency installation.
- The previously repaired Web Search/Developer Team TUI test passed in CI.

## Acceptance

1. Reproduce the relevant baseline failures with pinned Bun 1.3.12, a fresh checkout, and `bun install --frozen-lockfile`.
2. Test generated, absent, and stale metadata using isolated deterministic fixtures without requiring or modifying the real checkout's generated build-info.
3. Declare required workspace test dependencies explicitly and update the lockfile canonically; preserve production dependency boundaries.
4. Preserve rejection assertions, output absence on rejected descriptors, public CLI behavior, and real fallback coverage. Do not skip tests, relax assertions, or merely generate metadata globally before tests.
5. Validate the repaired candidate in another fresh source checkout with no inherited node_modules or ignored build-info and a frozen installation. Run the affected tests, TypeScript, the full suite, and causally relevant release checks.
6. Obtain independent review before presenting the follow-up PR candidate. Preserve all earlier release/Archive history unchanged.

## Approach and boundaries

One implementation owner will handle the complete test-isolation and workspace-dependency slice. Prefer test-only fixture changes; any necessary production contract change must be surfaced before expansion. Network access is limited to dependency acquisition during explicit installs; tests use temporary HOME/XDG paths and no provider credentials or personal tools. Do not install global tools, run canary installation, regenerate tracked bundles, rewrite historical evidence, or perform destructive Git operations.

The existing GitHub CLI account has read-only repository permission. Implementation and verification can continue; creating the final PR may require the user's manual action or separately corrected authentication.

## Risks and non-goals

- Prior local success masked ignored-file and implicit workspace-resolution dependencies. A new clean-checkout proof is mandatory, not a reused local-suite result.
- Avoid module-cache and process.cwd leakage between metadata cases; fixtures must remain safe under full-suite execution.
- No release version change, no production feature expansion, no merge, no tag, and no publication.

## Progress

- Main workflow failure localized using retained remote logs and direct source.
- Isolated implementation worktree created from the exact merge commit.
- Baseline reproduced after a frozen clean install: 30 passing cases, 11 failures and three module-load errors across the six affected files.
- Core now declares its three adapter test dependencies as development-only workspace dependencies; Pi declares its Supermemory test dependency likewise. The canonical Bun lockfile delta only records these four declarations.
- Build-info tests use isolated copies of unmodified production source and temporary generated-module fixtures. Prepare-release tests provide deterministic metadata through a small optional programmatic path parameter; the CLI's default path and flags are unchanged. Real subprocess tests verify the default CLI path with matching and stale metadata.
- A new manifest regression fails all four cases against the original package manifests, independently of node_modules hoisting.
- Focused final candidate tests passed (219/0), as did implementation-worktree TypeScript. A second real Git worktree with identical source files, no node_modules and no generated build-info completed a frozen install successfully; its full suite passed with 4,836 tests, one existing skip and zero failures across 310 files.
- The first exported verification mirror lacked Git metadata and failed two repository-containment tests; its log remains retained. Final verification uses an actual detached Git worktree rather than that incomplete mirror.
- Independent review found no blocking code defect. Fresh-worktree TypeScript, benchmark 13/13, compiled smoke (native execution and three non-native compile targets), and canonical OpenSpec validation (zero errors/warnings) have now passed. The optional helper-failure temporary-directory cleanup recommendation is non-blocking.
- Independent receipt-only closure returned final GO for follow-up PR preparation, with zero Critical and zero remaining Required. The repaired candidate is ready for a follow-up PR, not for automatic merge or stable publication.
