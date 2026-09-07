# Specification: Adaptive Memory Capture Policy Markdown Lists

RFC 2119 terms are normative.

## CPML-001 — Ordinary Markdown lists

Capture Policy MUST NOT classify content as `diff_or_patch` solely because non-empty lines begin with Markdown dash bullets. Numbered lists, nested lists, and durable prose mixed with ordinary list items MUST remain eligible for subsequent policy evaluation.

### Scenario: Durable dash list

**Given** a trusted user prompt containing a durable project decision expressed as ordinary dash bullets
**And** no other negative filter matches
**When** capture eligibility is evaluated
**Then** the content MUST NOT be rejected as `diff_or_patch`
**And** durable-category classification MUST still determine final eligibility.

### Scenario: Other ordinary list shapes

**Given** durable knowledge expressed as a numbered list, nested list, or prose mixed with a list
**And** no other negative filter matches
**When** capture eligibility is evaluated
**Then** the list syntax alone MUST NOT make the content a patch.

## CPML-002 — Structural patch evidence

Capture Policy MUST reject content as `diff_or_patch` when it contains unambiguous structural patch evidence. Supported evidence MUST include at least one of:

- a `diff --git` marker;
- paired `---` and `+++` headers;
- a hunk marker beginning with `@@` or an `Index:` marker; or
- a sufficiently dense context-free block containing both removed and added lines.

A dense mixed-sign fallback MUST require evidence of both removal and addition; dash-prefixed lines alone MUST NOT satisfy it.

### Scenario: Canonical diff markers

**Given** content containing a canonical diff marker, paired file headers, or a hunk/index marker
**When** capture eligibility is evaluated
**Then** the content MUST be rejected with reason `diff_or_patch` even if it contains durable vocabulary.

### Scenario: Dense mixed-sign block

**Given** a context-free block with sufficient line count and density of both added and removed lines
**When** capture eligibility is evaluated
**Then** the block MUST be rejected as `diff_or_patch`.

## CPML-003 — Negative-filter precedence

All negative eligibility filters MUST execute before durable high-signal classification. Durable wording MUST NOT override rejection for secrets, environment dumps, diffs or patches, stack traces, raw logs or test output, tool chatter, external or official artifacts, source dumps, or trivial operational text.

### Scenario: Durable vocabulary inside unsafe content

**Given** content that contains durable-decision wording and also matches a negative filter
**When** capture eligibility is evaluated
**Then** the applicable negative reason MUST win
**And** the content MUST NOT become eligible because of durable vocabulary.

## CPML-004 — Provider boundary

Content rejected as `diff_or_patch` MUST NOT reach provider ingestion. Tests for accepted content MUST use fake transport and MUST NOT contact a live provider.

### Scenario: Rejected patch

**Given** a candidate rejected as `diff_or_patch`
**When** the runtime capture path handles the result
**Then** no provider ingestion call MUST occur.

### Scenario: Accepted Markdown knowledge

**Given** an otherwise eligible durable Markdown-list prompt
**When** the runtime capture path uses fake transport
**Then** the candidate MUST reach exactly the normal eligible ingestion boundary.

## CPML-005 — Compatibility and ownership

The existing eligibility result shape, trusted capture sources, normalization behavior, `diff_or_patch` reason, and fail-open runtime behavior MUST remain compatible. This change MUST NOT alter recall, project identity, provider contracts, observability receipts, generated runner assets, or the provisional same-turn Working Brief.

## CPML-006 — Residual ambiguity

Verify and Review MUST explicitly assess and report the known ambiguity around dense mixed `+`/`-` lists and marker-free one-sided patch excerpts. The change MAY retain that ambiguity when the bounded heuristic and safety tradeoff are documented; it MUST NOT claim complete Markdown/diff classification.

## Acceptance matrix

| Behavior | Expected result |
|---|---|
| Durable dash-bullet list with no other negative signal | Not `diff_or_patch`; continue policy evaluation |
| Durable numbered, nested, or prose-mixed list | Not `diff_or_patch`; continue policy evaluation |
| `diff --git` marker | Reject `diff_or_patch` |
| Paired `---` / `+++` headers | Reject `diff_or_patch` |
| `@@` hunk or `Index:` marker | Reject `diff_or_patch` |
| Dense block containing both added and removed lines | Reject `diff_or_patch` |
| Durable vocabulary plus secret or unsafe raw artifact | Applicable negative filter wins |
| Rejected patch through runtime | No provider ingestion |
