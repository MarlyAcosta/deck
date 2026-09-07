# Proposal: Adaptive Memory Observability Receipts

## Summary

Add bounded metadata-only receipts that correlate Adaptive Memory recall, capture evaluation/outcomes, actual OpenCode system-context injection, and the executing Deck host payload without persisting raw identifiers, content, reversible scope, paths, or secrets.

## Outcome

1. Core owns provider-neutral SHA-256 content receipts and project-separated session/turn fingerprints.
2. Adapter-supermemory attaches exact normalized-and-redacted input receipts and capture source to every capture outcome.
3. The runtime host propagates immutable per-event correlation, hashes exact rendered advisory bytes, validates injection acknowledgments, and enriches persisted metrics with the actual host executable receipt.
4. OpenCode acknowledges each actual `output.system.push` with generation and exact injected-byte metadata while preserving `experimental.chat.messages.transform` as a no-op.
5. Generated and temporary installed OpenCode assets remain byte-identical to the authoritative source.

## Compatibility

Metric fields are additive and optional. Existing recall, capture, fail-open, deduplication, project isolation, compaction, and provider behavior remain unchanged.

## Non-goals

- Capture Policy or interrogative-prompt behavior.
- Query rewriting, reranking, provider calls, or provider API changes.
- Persisting native IDs, provider correlation IDs, raw scope, content, prompts, responses, memory results, paths, credentials, tokens, headers, or authorization material.
- Repairing the prior change registry or unrelated broad failures and `.codex` artifacts.
- Canary rebuild, live acceptance, commit, push, release, or publication.

## Rollback

Remove the additive receipt fields and injection acknowledgment branch, regenerate the OpenCode asset with the canonical generator, and rerun focused parity tests. No provider or persisted-data migration is required.
