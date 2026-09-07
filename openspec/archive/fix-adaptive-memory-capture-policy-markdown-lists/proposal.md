# Proposal: Adaptive Memory Capture Policy Markdown Lists

## Summary

Give independent ownership and lifecycle to the existing Capture Policy correction that prevents ordinary Markdown lists from being rejected as `diff_or_patch` while preserving the safety value of patch detection.

## Problem and outcome

Durable decisions are commonly written as bullet, numbered, nested, or prose-mixed Markdown lists. A dash-density patch heuristic can mistake those lists for removed diff lines and reject otherwise eligible knowledge. Deck should require structural patch evidence while retaining every negative eligibility filter ahead of durable-category classification.

## Scope

The intended implementation candidate is limited to the existing WIP in:

- `packages/core/src/memory/capture-eligibility.ts`
- `packages/core/src/memory/capture-eligibility.test.ts`
- `packages/adapter-supermemory/src/runtime.test.ts`

This proposal itself does not adopt, edit, stage, or validate those files. Adoption is a later Apply activity.

## Acceptance

- Ordinary dash, numbered, nested, and prose-mixed Markdown lists can remain eligible when they otherwise contain trusted durable knowledge.
- Canonical diff markers and structurally dense mixed addition/removal blocks remain rejected as `diff_or_patch`.
- All existing negative filters execute before durable high-signal classification.
- Secret, environment-dump, raw-log, stack-trace, tool-chatter, external-artifact, source-dump, and trivial-text protections are not weakened.
- Rejected patch candidates do not reach provider ingestion.
- Existing source trust, normalization, rejection reasons, and fail-open behavior remain compatible.

## Non-goals

- Changing provider APIs, transport, project scope, recall, ranking, or observability receipts.
- Moving durable classification ahead of negative filters.
- Disabling patch detection.
- Building a general Markdown or diff parser.
- Resolving every ambiguous headerless or mixed-sign text shape.
- Editing the provisional same-turn Working Brief.
- Live provider, canary, release, or publication work.

## Privacy and security

The change must preserve fail-closed rejection of high-confidence secrets and unsafe raw artifacts before durable classification. Patch rejection remains defense in depth against automatically capturing incidental source, credentials, paths, logs, and transient implementation detail. Tests use only synthetic content and fake transport; no provider credential or live call is required.

## Compatibility

The public eligibility result and existing `diff_or_patch` reason remain unchanged. Inputs with unambiguous structural patch evidence retain prior rejection behavior. The compatibility change is intentionally narrow: ordinary Markdown list syntax is no longer sufficient patch evidence by itself.

## Risks

- Dense mixed `+`/`-` lists can produce false positives.
- Marker-free one-sided patch excerpts can produce false negatives.
- Overfitting to the currently accepted examples could hide other Markdown shapes.

These risks must be reviewed explicitly rather than silently expanding the heuristic.

## Rollback

If later verification finds a candidate-caused regression, use a normal source follow-up or revert of the eventual implementation commit, preserve this lifecycle history, and restore the previous eligibility behavior through reviewed source changes. Do not hand-edit generated assets or use destructive worktree commands.
