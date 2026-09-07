# Archive report

Readiness: **READY**. Implementation and focused Verify: **GO**. Independent Review: **GO**, zero Critical/Required. User explicitly authorized canonical Archive of this repair before v0.4.0 version preparation.

## Accepted candidate

- Test-only path: `packages/adapter-codex/src/runner-adapter.test.ts`.
- Reviewed SHA-256: `d764f79a78cf5ff65fdd8d633216dda012e1352995e6097112d696c3c84b4419`.
- RED: 0 pass, 2 fail without Codex. GREEN: both original tests pass using offline preflight plus real temporary project inspection. Independent Lead Verify: 33 pass, 0 fail, 270 expectations, including the isolated empty-PATH child regression.
- Corrected pre-Archive validation: exit 0, zero errors/warnings. The initial missing exploration mapping was corrected only in the new change; original failed evidence remains retained separately.
- Optional future-rename guard remains non-blocking as documented in Review.

## Canonical closure

This nonempty report precedes the archive transition and move. Destination: `openspec/archive/make-codex-tests-ci-hermetic/`. Preserve the existing state/events prefix and all evidence; append `archive.completed` with phase/status `archive/archived`, then move this directory to the canonical archive location and validate the named archived change.

No delta-spec directory exists, so there is no unrelated main-spec merge. The three previously archived changes are not reopened. No Git mutation, release version edit, tag, publication, or live-provider operation accompanies this closure.

## Completed

All eight artifacts are now under `openspec/archive/make-codex-tests-ci-hermetic/`; the active directory is absent. Post-Archive named validation on 2026-09-07 exited 0 with zero errors/warnings (`/tmp/opencode/release-v0.4.0-20260907/codex-post-archive-validate.log`). State is `archive/archived`; the earlier provenance and events remain preserved. No production or test bytes changed during closure.
