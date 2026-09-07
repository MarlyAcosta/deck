# Preconditions

- User authorization covers this exact test-only repair and its Verify, Review, Archive.
- RED reproduced under verified Bun `1.3.12+700fc117a` without Codex on process-local PATH.
- Existing injectable `CodexPreflightEffects` can replace the external probe without production changes.
- Test file already contains release-gate WIP; preserve that existing delta.
- Stop if production behavior or material scope expansion is necessary.
