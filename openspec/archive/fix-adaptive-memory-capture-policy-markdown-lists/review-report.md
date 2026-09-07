# Review Report: Adaptive Memory Capture Policy Markdown Lists

## Lifecycle and verdict

- **Change ID:** `fix-adaptive-memory-capture-policy-markdown-lists`
- **Independent reviewer:** `deck-quality`
- **Review started:** `2026-09-04T13:52:05Z`, after candidate identity was confirmed and before the reviewer emitted a judgment
- **Review completed:** `2026-09-04T14:00:25Z`
- **Verdict:** **NO-GO**
- **Phase/status:** Review / failed

Independent Review found one Required correctness and coverage defect in the `Index:` marker behavior. Tasks 4.1 through 4.3 remain incomplete. No code, test, historical Apply/Verify artifact, unrelated OpenSpec change, generated asset, or excluded worktree path was modified.

## Candidate identity and evidence boundary

- HEAD was `dd596899b649ad9a0cda00b1d85749f8a281bab5` before Review.
- The SHA-256 of the exact HEAD-to-worktree diff for the three candidate files was `a7f1fc554f59c81718c080d61143211442b0ac626104869e0f21c8896e78907f` before Review.
- Review relied on, but did not rerun, the recorded Verify evidence: 46 focused core tests and 12 adapter fake-transport tests passed with 0 failures; TypeScript and targeted OpenSpec validation passed.
- Tests were inspected before implementation. The current source, tests, exact diff, and OpenSpec artifacts were read directly because the code graph generation was stale for both production files and excluded both test files.

## Findings

### Critical

None.

### Required

#### R1 — Bare `Index:` does not satisfy CPML-002

CPML-002 requires an `Index:` marker to be rejected as `diff_or_patch` (`spec.md:26-31,35-39,84-90`). Candidate lines are trimmed in `packages/core/src/memory/capture-eligibility.ts:55-57`, while the structural predicate uses `Index:\s` at `packages/core/src/memory/capture-eligibility.ts:96`. Conventional `Index: policy.ts` matches, but exact bare `Index:` does not because trimming removes trailing whitespace. The mixed-sign fallback at lines 98-100 does not recover that case.

A durable candidate beginning with bare `Index:` can therefore pass high-signal classification at `capture-eligibility.ts:70-75`. The runtime correctly returns before ingestion for a rejected eligibility result (`packages/adapter-supermemory/src/runtime.ts:309-357`), but it has no later patch classifier that can compensate for this false-negative result.

The permanent structural test matrix omits all `Index:` cases (`packages/core/src/memory/capture-eligibility.test.ts:55-66`). Verify's direct probe covered only `Index: policy.ts` (`verify-report.md:60-69`), so the passing evidence did not expose the bare-marker defect. CPML-002 is therefore not satisfied.

**Minimum repair:**

1. In `packages/core/src/memory/capture-eligibility.ts`, recognize end-of-line as well as whitespace after the marker, for example `Index:(?:\s|$)`.
2. In `packages/core/src/memory/capture-eligibility.test.ts`, add permanent durable-vocabulary rejection cases for both exact bare `Index:` and conventional `Index: policy.ts`.

Both paths require separate future write authorization. An additional adapter test would be useful but is not required for the minimum repair because the existing fake-transport test already proves the generic failed-eligibility guard.

### Optional

#### O1 — Negative-precedence coverage is uneven

The implementation currently keeps every specified negative filter before durable high-signal classification (`capture-eligibility.ts:59-73`). Permanent tests combine durable vocabulary with secret, real-diff, and provider-result cases, but several other negative fixtures do not include high-signal wording (`capture-eligibility.test.ts:68-112`). An early eligible-return regression could therefore evade some fixtures. This is test-hardening, not a current behavior defect and not part of the minimum repair.

### FYI

- Dense Markdown lists that mix sufficiently many `+` and `-` lines remain possible false positives under the fallback at `capture-eligibility.ts:98-100`.
- Marker-free one-sided patch excerpts remain possible false negatives.
- CPML-006 expressly permits both bounded ambiguities when documented, and this change does not claim complete Markdown/diff classification.

## Review axes

| Axis | Assessment |
|---|---|
| Correctness | **FAIL.** Exact bare `Index:` violates CPML-002. The other specified ordinary-list and structural-patch shapes conform by inspection. |
| Readability and simplicity | Mostly good. The local predicate is deterministic, dependency-free, and easy to follow, but `Index:\s` is narrower than the stated contract. |
| Architecture and ownership | **PASS.** Classification remains provider-neutral in Core and transport ownership remains in the adapter. The exact candidate diff is confined to the three declared files and introduces no candidate coupling to observability receipts, recall, provisional same-turn work, generated assets, or unrelated changes. |
| Privacy and security | **REQUIRED REPAIR.** Secret and other negative-filter ordering remains intact, but bare-`Index:` patch material can be misclassified and continue toward ingestion. |
| Compatibility | **PASS.** Trusted source values, normalization, result and reason shapes, fail-open runtime behavior, provider contracts, receipts, recall, and project identity remain unchanged by the candidate. |
| Performance | **PASS.** The change adds bounded linear scans over candidate content and no I/O, parser, dependency, or unbounded operation. |
| Real coverage quality | Strong for ordinary list forms, canonical markers other than `Index:`, dense mixed signs, and the fake-transport boundary. **Insufficient for `Index:`**, where the missing permanent case concealed a real contract defect. |

## CPML-001 through CPML-006 matrix

| Requirement | Review result | Evidence |
|---|---|---|
| CPML-001 — Ordinary Markdown lists | PASS | The exact prompt plus dash, numbered, nested, and prose-mixed cases are permanent (`capture-eligibility.test.ts:39-53`), and the fallback requires both signs. |
| CPML-002 — Structural patch evidence | **FAIL — Required** | `diff --git`, paired headers, `@@`, dense mixed signs, and `Index: path` are recognized, but bare `Index:` is not matched by `capture-eligibility.ts:96`; no permanent `Index:` test exists. |
| CPML-003 — Negative-filter precedence | PASS | Every specified negative filter precedes high-signal evaluation at `capture-eligibility.ts:59-73`; Optional O1 records test-hardening only. |
| CPML-004 — Provider boundary | PASS for the direct runtime guard | Failed eligibility returns before transport at `runtime.ts:309-335`; tests prove zero calls for rejected raw shapes and one fake `add` for accepted Markdown (`runtime.test.ts:87-105,141-160`). This guard cannot compensate for the CPML-002 misclassification. |
| CPML-005 — Compatibility and ownership | PASS | The exact candidate diff does not modify runtime source, public shapes, provider contracts, receipts, recall, project identity, generated assets, or provisional same-turn work. |
| CPML-006 — Residual ambiguity | PASS | Dense mixed-sign false positives and marker-free one-sided false negatives are explicitly retained and reported without a complete-classifier claim. |

## Permanent `Index:` test decision

A permanent test is **required as part of the repair**. The specification's literal `Index:` marker includes both exact bare `Index:` and conventional `Index: path`. Only the latter currently works, and it was covered only by a temporary Verify probe. Both forms must become permanent structural-patch regression rows so the test fails if either contract branch regresses.

## Scope and limitations

Review inspected the complete named OpenSpec change, the three candidate files and their exact diff, `packages/adapter-supermemory/src/runtime.ts` for the provider boundary, and bounded production composition strictly necessary to assess ownership. No broad repository completeness claim is made. Confidence is high for the bounded candidate.

Review performed no test, typecheck, build, provider, canary, live, release, publication, Archive, staging, commit, or destructive Git action. The only next action is separately authorized repair of the two named Core paths, followed by fresh Verify and independent Review.

---

## Independent re-review after R1 repair

### Lifecycle and verdict

- **Re-review started:** `2026-09-04T15:51:30Z`, after confirming candidate identity and before the independent reviewer emitted a judgment
- **Re-review completed:** `2026-09-04T15:57:17Z`
- **Independent reviewer:** `deck-quality`
- **Verdict:** **GO**
- **Phase/status:** Review / completed

This fresh verdict completes the repaired candidate's Review gate. It does not replace, delete, reorder, or alter the initial Required R1 finding, the `review.failed` event, the subsequent repair incident, or the fresh re-verification history above and in the lifecycle registry.

### Repaired candidate identity and evidence boundary

- HEAD remained `dd596899b649ad9a0cda00b1d85749f8a281bab5` before re-review.
- The SHA-256 of the raw exact HEAD-to-worktree diff for the same three candidate files was `2b78360584f10c919b7d4b3c2455283cb587c3dcad2fd7ac021ab910289a19b2`; the candidate paths were unstaged and their cached diff was empty.
- Permanent tests were inspected before implementation. The exact diff and current source were read directly because graph metadata was stale for production and excluded both test files.
- The reviewer assessed, but did not rerun, the repaired Verify evidence: 48 focused Core tests and 12 adapter fake-transport tests passed with zero failures, and TypeScript passed with no diagnostics.
- No test, typecheck, build, probe, provider, canary, live, release, publication, Archive, staging, commit, or destructive Git action was performed during re-review. No candidate or artifact file was modified by `deck-quality`.

### Findings

#### Critical

None.

#### Required

None.

#### Optional

##### O1 — Negative-precedence coverage remains uneven and non-blocking

The permanent tests still do not combine durable vocabulary with every individual negative filter. This remains test-hardening rather than a demonstrated contract defect: direct inspection confirms every negative check precedes durable high-signal classification in `packages/core/src/memory/capture-eligibility.ts:59-73`. No new technical evidence justifies promoting O1.

#### FYI

- Dense Markdown lists that mix enough `+` and `-` lines can still be false positives.
- Marker-free one-sided patch excerpts can still be false negatives.
- CPML-006 expressly admits both bounded limitations, and the candidate makes no complete-classifier claim.

### Resolution of Required R1

**Resolved.** Permanent structural-patch rows now cover exact `Index:` and `Index: policy.ts` through the production evaluator and require `{ eligible: false, reason: "diff_or_patch" }` (`packages/core/src/memory/capture-eligibility.test.ts:55-67`). Candidate content is normalized and inspected as trimmed non-empty lines (`packages/core/src/memory/capture-eligibility.ts:52-57,82-90`), and the marker predicate now uses the required whitespace-or-end-of-line semantics, `Index:(?:\s|$)` (`capture-eligibility.ts:93-100`). The repair changed only that marker alternative and added the two permanent rows; no other heuristic branch changed.

The tests materially capture the original regression rather than merely restating Verify evidence: the exact bare form would fail under the preserved pre-repair `Index:\s` predicate, while the path form confirms conventional marker compatibility. Both now produce `diff_or_patch` in permanent coverage.

### CPML-001 through CPML-006 matrix

| Requirement | Re-review result | Evidence |
|---|---|---|
| CPML-001 — Ordinary Markdown lists | PASS | Permanent exact-prompt, dash, numbered, nested, and prose-mixed cases remain eligible (`capture-eligibility.test.ts:39-53`); the fallback still requires both signs. |
| CPML-002 — Structural patch evidence | PASS | Permanent tests cover both exact `Index:` forms plus the required canonical and dense mixed-sign shapes; the predicate implements `Index:(?:\s|$)`. |
| CPML-003 — Negative-filter precedence | PASS | Secret, environment, patch, stack, raw-output, tool, external/official-artifact, source-dump, and trivial checks all precede durable classification (`capture-eligibility.ts:59-73`). O1 remains optional test-hardening only. |
| CPML-004 — Provider boundary | PASS | Failed eligibility returns before ingestion in `runtime.ts:309-357`; fake-transport tests prove rejected raw patches produce zero calls and accepted Markdown produces exactly one `add` (`runtime.test.ts:87-105,141-160`). |
| CPML-005 — Compatibility and ownership | PASS | Provider-neutral Core retains classification ownership. The candidate does not change runtime source, public result shapes, normalization, trusted sources, reasons, provider contracts, recall, project identity, observability, or generated assets. |
| CPML-006 — Residual ambiguity | PASS | Dense mixed-sign false positives and marker-free one-sided false negatives remain explicitly admitted without a complete-classifier claim. |

### Five review axes

| Axis | Assessment |
|---|---|
| Correctness | **PASS.** Permanent tests now reproduce the exact semantic boundary that caused R1 and cover both bare and path-form `Index:` markers. |
| Readability and simplicity | **PASS.** The repair is a localized, deterministic one-alternative correction with no new abstraction or dependency. |
| Architecture and ownership | **PASS.** Eligibility remains in provider-neutral Core, while the adapter owns and enforces the transport boundary. Scope remains isolated to the three declared candidate files. |
| Privacy and security | **PASS.** Negative filters retain precedence, structural patches are rejected, and failed eligibility returns before provider ingestion. |
| Compatibility and performance | **PASS.** Public shapes and provider behavior are unchanged; processing remains bounded linear scanning with no new I/O, parser, dependency, or unbounded operation. |

### Final disposition

There are no Critical or Required findings. Tasks 4.1 through 4.3 are complete, and the repaired candidate is **GO**. The single minimum next lifecycle action is closure assessment for Task 5.1; Archive requires separate authorization and was not performed.
