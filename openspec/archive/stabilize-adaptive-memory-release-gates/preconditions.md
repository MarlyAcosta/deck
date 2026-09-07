# Preconditions: Stabilize Adaptive Memory Release Gates

## Authorization

The user authorized setup/OpenSpec work, diagnosis, TDD Apply, focused Verify, one final BROAD gate, independent Review, repair of Required findings, re-verification, one re-review, and conditional Archive for this stabilization session.

## Explicit prohibitions

- No version or changelog changes.
- No persistent `prepare-release` output.
- No staging, commit, push, tag, GitHub Release, publication, or real release.
- No canary installation or provider/live calls.
- No restore, checkout, reset, clean, rebase, stash deletion, or other discard action.
- No manual generated-asset edits.
- No edits to unrelated WIP, `.serena`, `.codex`, `.bun-cache`, or historical OpenSpec artifacts outside an authorized lifecycle move.

## Intake checks

- Reference HEAD matches the user-provided SHA.
- Candidate implementation paths are clean at intake.
- The existing completed observability and capture-policy evidence is reusable and excluded from rerun unless directly invalidated.
- Archive and release-workflow coupling were read before implementation.
