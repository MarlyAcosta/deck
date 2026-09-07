# Exploration: Adaptive Memory Capture Policy Markdown Lists

## Outcome

Deck can adopt the existing Capture Policy WIP as an independent change without rewriting its history. The current implementation and tests predate this change ID, so this lifecycle begins with present-day planning and leaves Apply, Verify, and Review for later explicit transitions.

## Problem

The prior patch heuristic treated a sufficiently dense set of lines beginning with `-` as patch evidence. Ordinary Markdown bullet lists can have that same surface shape, so durable user knowledge expressed as a list could be rejected with `diff_or_patch` before durable-category classification.

## Root cause

Line-prefix density alone did not distinguish Markdown bullets from removed diff lines. The heuristic lacked a requirement for structural patch evidence, such as canonical diff markers or a meaningful combination of added and removed lines.

## Existing WIP

The following uncommitted implementation and tests existed before this change was created:

- `packages/core/src/memory/capture-eligibility.ts`
- `packages/core/src/memory/capture-eligibility.test.ts`
- `packages/adapter-supermemory/src/runtime.test.ts`

A provisional follow-up note also exists in `openspec/changes/fix-opencode-automatic-memory-same-turn/working-brief.md`. That note is historical context, not canonical ownership for this change, and is outside this change's current writable scope.

No Setup, Apply, TDD RED, Verify, or Review activity is attributed retroactively to this change ID. Existing evidence may be inspected and adopted later, but any lifecycle event must record when that adoption actually occurs.

## Decision

Recognize a diff or patch from structural evidence rather than from dash-prefixed lines alone. Preserve all negative filters before durable-category classification so durable vocabulary cannot override secret, artifact, log, patch, or other exclusion policy.

Structural evidence includes:

- a `diff --git` marker;
- paired `---` and `+++` headers;
- a hunk marker beginning with `@@` or an `Index:` marker; or
- a sufficiently dense context-free block containing both removed (`-`) and added (`+`) lines.

## Alternatives rejected

1. **Treat every dash-prefixed line as patch evidence.** Rejected because it makes ordinary Markdown bullets false positives and suppresses durable knowledge.
2. **Move durable classification before negative filters.** Rejected because durable wording could then bypass security, privacy, provenance, and raw-artifact exclusions.
3. **Disable patch detection.** Rejected because raw diffs and patches remain unsuitable automatic-memory candidates and may contain incidental source, secrets, paths, or noisy transient content.

## Residual ambiguity

- Dense lists that intentionally mix lines beginning with `+` and `-` may still resemble a headerless patch.
- One-sided patch excerpts without structural markers may be treated as ordinary text.

These are accepted review risks for the current bounded heuristic. Any broader parser, language-aware classifier, or policy redesign requires a separate decision.

## Lifecycle decision

Create a canonical Full SDD through the Tasks phase. The next lifecycle action is a non-modifying adoption review of the existing WIP. Apply MUST NOT be marked started or completed until that review occurs under this change ID and with authority for any required out-of-directory writes.
