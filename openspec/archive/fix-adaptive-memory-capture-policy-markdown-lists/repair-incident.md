# Repair Incident: CPML R1 Bare Index Marker

## Identity and lifecycle

- **Schema:** `repair-incident-v1`
- **Change ID:** `fix-adaptive-memory-capture-policy-markdown-lists`
- **Finding:** Required R1 from the independent Review; CPML-002 was not satisfied for an exact bare `Index:` line.
- **Review artifact:** `review-report.md`, verdict `NO-GO`.
- **Repair started:** `2026-09-04T14:18:09Z`.
- **Repair resolved:** `2026-09-04T14:47:30Z`.
- **State:** resolved and re-verified; fresh independent Review remains required.
- **Lifecycle effect:** `repair.started` and `repair.resolved` are auxiliary repair events. They did not replace, delete, reorder, or change the meaning of the failed Review or any phase transition.

## Failure manifest and RED reproduction

- Candidate lines were normalized with `trim()` before structural patch detection.
- The predicate `Index:\s` recognized `Index: policy.ts` but not a line whose complete normalized content was `Index:` because no trailing whitespace remained.
- Permanent cases for exact `Index:` and `Index: policy.ts` were added before production changed. Both require `eligible: false` with `reason: "diff_or_patch"`.
- The focused RED run produced 47 passed and 1 failed out of 48 tests, with 49 expectation calls.
- The only RED failure was the exact bare `Index:` case, which returned `eligible: true`, `reason: "eligible"` instead of the required rejection.
- `Index: policy.ts` already passed in the same RED run.

## Bounded repair

- The existing marker alternative changed minimally from `Index:\s` to `Index:(?:\s|$)`.
- No other heuristic branch was refactored or changed by the R1 repair.
- Permanent regression coverage now includes both exact bare and path-form `Index:` markers.
- Optional O1 concerning uneven coverage of other negative filters remained expressly out of scope.

## Verification evidence

- Capture eligibility: 48 of 48 tests passed, with 49 expectation calls.
- Adapter Supermemory: 12 of 12 tests passed, with 58 expectation calls.
- TypeScript: `bunx tsc --noEmit` passed with no diagnostics.
- Pre-repair three-file candidate patch SHA-256: `a7f1fc554f59c81718c080d61143211442b0ac626104869e0f21c8896e78907f`.
- Repaired three-file candidate patch SHA-256: `2b78360584f10c919b7d4b3c2455283cb587c3dcad2fd7ac021ab910289a19b2`.

## Scope and safety record

- No provider call or live test occurred.
- No commit, Archive, release, publication, staging, push, or tag occurred.
- `review.failed` and `review-report.md` remain authoritative historical records for the failed independent Review.
- Tasks 4.1 through 4.3 remain pending; this incident record does not claim Review GO.
