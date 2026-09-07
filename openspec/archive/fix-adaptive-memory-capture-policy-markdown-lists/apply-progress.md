# Apply Progress: Adaptive Memory Capture Policy Markdown Lists

## Lifecycle

- **Change ID:** `fix-adaptive-memory-capture-policy-markdown-lists`
- **Event:** `apply.started`
- **Started at:** `2026-09-03T23:37:28Z`
- **Phase/status:** Apply / in progress
- **Activity:** Read-only adoption review of pre-existing uncommitted implementation and test work.
- **Attribution boundary:** The three-path WIP, all prior RED/GREEN and live results, and the prior Quality report predate this change ID. This Apply records present-time inspection and ownership only; it does not represent that historical activity as work performed under this change.

## Authorization and execution boundary

The only writes in this Apply start are this file plus this change's `state.yaml` and `events.yaml`. Source and tests remained read-only. No test, typecheck, build, generation, canary installation, provider call, release check, stage, commit, archive, restore, discard, stash, rebase, push, tag, release, or publication command was executed.

The session-start skill registry validation reported `.atl/skill-registry.md` absent. It was not refreshed because that would exceed the authorized write boundary; bounded repository discovery continued without modifying the registry.

After the lifecycle files were written, `deck openspec validate --json --change fix-adaptive-memory-capture-policy-markdown-lists --root /home/kevin15011/deck` reported one valid active change with phase `apply`, status `in_progress`, zero errors, and zero warnings. This was a registry-format check only; it was not behavioral Verify evidence and did not execute the source or tests.

## Exact baseline and candidate identity

- **HEAD:** `dd596899b649ad9a0cda00b1d85749f8a281bab5` (`fix(opencode): repair package setup flow`)
- **HEAD parent and `origin/main`:** `0bbd061313c23d9f0b9984d5fd5e9218b9d553ac`
- **Branch relationship at inspection:** local `main` was one commit ahead of `origin/main`.
- **Index state:** all three candidate files were modified but unstaged; their cached diff was empty.
- **Combined HEAD-to-worktree diff:** 3 files, 92 insertions, 2 deletions.
- **Combined patch SHA-256:** `a7f1fc554f59c81718c080d61143211442b0ac626104869e0f21c8896e78907f` from the raw `git diff HEAD -- <three paths>` stream.

| Candidate path | HEAD blob | Worktree blob | Diff |
|---|---|---|---|
| `packages/core/src/memory/capture-eligibility.ts` | `66c9473a821d84ce53697f757c387ee19ca7507e` | `908574c436c351c059064b9bb3aaa9bb56f76028` | 12 insertions, 2 deletions |
| `packages/core/src/memory/capture-eligibility.test.ts` | `76f536fd7c6445a9adb7f32acd1b5972b3af9ed4` | `dc5176fb8c492458838eb24cb28bd1d137afdaa4` | 45 insertions |
| `packages/adapter-supermemory/src/runtime.test.ts` | `65e220e3c4178169722d0505348f71dbbec46b48` | `9ff14da5af7af67df72556725c89b8a5a2807461` | 35 insertions |

## Hunk ownership

Every HEAD-to-worktree Git hunk in the three candidate files belongs exclusively to this change. No target hunk is shared with the same-turn repair, observability receipts, generated assets, or unrelated WIP.

| Hunk | Current lines | Classification | CPML mapping | Ownership rationale |
|---|---:|---|---|---|
| `capture-eligibility.ts` patch predicate call | 62 | In scope | CPML-002, CPML-003, CPML-005 | Replaces the over-broad density expression at the same negative-filter position with the bounded structural predicate; the rejection reason and surrounding policy order remain unchanged. |
| `capture-eligibility.ts` structural predicate | 93-101 | In scope | CPML-001, CPML-002, CPML-006 | Recognizes canonical markers and paired headers, then requires both removal and addition evidence plus size/density for the marker-free fallback. Dash-only lists cannot satisfy both-sign evidence. |
| `capture-eligibility.ts` patch-line ratio | 103-106, changed line 105 | In scope | CPML-001, CPML-002, CPML-006 | Counts only unilateral added/removed content lines for fallback density and excludes paired file-header prefixes. |
| `capture-eligibility.test.ts` exact prompt fixture | 5-18 | In scope | CPML-001, CPML-005 | Preserves the exact trusted-user Markdown-list regression input as a local synthetic fixture. |
| `capture-eligibility.test.ts` acceptance and structural matrix | 39-66 | In scope | CPML-001, CPML-002, CPML-003, CPML-005 | Covers the exact prompt; dash, numbered, nested, and prose-mixed lists; canonical markers; paired headers; hunk evidence; dense mixed signs; durable wording inside a real diff; and the unchanged `diff_or_patch` result. |
| `capture-eligibility.test.ts` provider-result negative case | 76 | In scope | CPML-003, CPML-005 | Exercises the pre-existing external/official-artifact filter with durable wording. Despite its provider terminology, it changes no provider or observability contract and specifically proves negative-filter precedence. |
| `runtime.test.ts` exact prompt fixture | 11-24 | In scope | CPML-001, CPML-004, CPML-005 | Supplies the same exact trusted-user candidate at the fake-transport boundary. |
| `runtime.test.ts` accepted capture regression | 87-105 | In scope | CPML-001, CPML-004, CPML-005 | Confirms that an otherwise eligible Markdown-list candidate follows the normal fake transport path exactly once. |

### Out-of-scope classification

- **Out-of-scope hunks inside the three candidate diffs:** none.
- **Shared hunks inside the three candidate diffs:** none.
- `packages/adapter-supermemory/src/runtime.ts` was read only to confirm the provider boundary and is not owned by this change. Its separate worktree diff remains excluded.
- The provisional same-turn Working Brief, observability receipts, generated assets, Serena files, `.codex`, `.bun-cache`, build information, shared registries, other OpenSpec changes, and all unrelated WIP remain excluded and untouched.

## CPML adoption matrix

| Requirement | Apply adoption disposition | Static evidence |
|---|---|---|
| CPML-001 — Ordinary Markdown lists | Conforming by inspection | `looksLikeDiffOrPatch` requires both removed and added lines for its fallback (`capture-eligibility.ts:93-101`). Added tests cover the exact regression prompt plus dash, numbered, nested, and prose-mixed durable content (`capture-eligibility.test.ts:39-53`). |
| CPML-002 — Structural patch evidence | Conforming by inspection | Source recognizes `diff --git`, paired `---`/`+++`, `@@`/`Index:` markers, and dense mixed signs (`capture-eligibility.ts:93-106`). Added tests cover `diff --git`, paired headers, a hunk marker, a dense mixed-sign candidate, and durable vocabulary inside a diff (`capture-eligibility.test.ts:55-66`). |
| CPML-003 — Negative-filter precedence | Conforming by inspection | Trusted-source and normalization checks are followed by every negative filter before `hasHighSignalCategory` (`capture-eligibility.ts:44-75`). Added patch and provider-result cases include durable vocabulary yet retain negative outcomes (`capture-eligibility.test.ts:55-66,76`). |
| CPML-004 — Provider boundary | Conforming by inspection | Runtime capture returns immediately on failed raw or redacted eligibility before `input.transport.add` (`runtime.ts:309-357`). The pre-existing runtime test already includes a real diff in its rejected raw-shape loop and asserts zero fake calls (`runtime.test.ts:141-160`); the new accepted Markdown regression asserts one fake `add` (`runtime.test.ts:87-105`). |
| CPML-005 — Compatibility and ownership | Conforming by diff inspection | The candidate does not modify capture-source types, result types, normalization, reason strings, runtime source, recall, project identity, provider contracts, observability receipts, generated assets, or the same-turn brief. The exact `diff_or_patch` reason remains at `capture-eligibility.ts:63`; accepted content still returns normalized `content`, `reason: "eligible"`, and the existing result shape at lines 75 and 18-20. |
| CPML-006 — Residual ambiguity | Conforming for Apply; Verify/Review obligations remain pending | The fallback intentionally rejects sufficiently dense mixed `+`/`-` text and can admit marker-free one-sided excerpts. `spec.md`, `design.md`, and this record state both limitations without claiming complete classification. Verify and Review have not started and must reassess them later. |

## Missing, excessive, duplicated, or unrelated change

- **Missing behavior requiring a code change:** none identified by static inspection.
- **Missing mandatory test change:** none identified for Apply adoption. The source recognizes `Index:` but the added table has no dedicated `Index:` row; this is a focused Verify specificity to assess, not evidence of an implementation defect. Any decision to add permanent test coverage would require separate path-specific write authority.
- **Excessive change:** none. The structural helper and ratio adjustment are local to patch classification.
- **Duplication:** the exact regression prompt is intentionally duplicated in two test packages to prove both the core policy and fake-transport boundary without adding a production fixture or cross-package test dependency.
- **Unrelated change:** none among the eight Git hunks. The provider-result row is CPML-003 evidence, not observability-receipt work.

## Historical supporting evidence only

`openspec/changes/fix-opencode-automatic-memory-same-turn/working-brief.md:66-75` reports prior RED/GREEN, broad, live, validation, and Quality outcomes for this WIP. Those reports were not rerun, verified, produced, or claimed under this change ID. They remain historical support only and do not replace future Verify and Review evidence.

## Files inspected

### Adoption evidence

- `packages/core/src/memory/capture-eligibility.ts`
- `packages/core/src/memory/capture-eligibility.test.ts`
- `packages/adapter-supermemory/src/runtime.test.ts`
- `packages/adapter-supermemory/src/runtime.ts` (provider-boundary context only)
- `openspec/changes/fix-opencode-automatic-memory-same-turn/working-brief.md`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/exploration.md`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/proposal.md`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/spec.md`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/design.md`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/tasks.md`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/preconditions.md`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/state.yaml`
- `openspec/changes/fix-adaptive-memory-capture-policy-markdown-lists/events.yaml`

### Lifecycle-format references

- `openspec/registry-schema.md`
- `openspec/changes/add-first-class-codex-runner-support/state.yaml`
- `openspec/changes/add-first-class-codex-runner-support/events.yaml`
- `packages/core/src/spec-registry/validator.test.ts`
- `package.json`

## Current result and minimum next step

The pre-existing three-file WIP was adopted as the exclusive implementation candidate for CPML-001 through CPML-006 based on the read-only inspection. Tasks 2.1-2.5 are complete. No source or test file was modified during adoption.

- **Apply completed at:** `2026-09-04T13:38:03Z`
- **Apply result:** completed
- **Next phase:** Verify started under the user's subsequent explicit authorization. Verify evidence is recorded separately in `verify-report.md` and is not attributed retroactively to Apply.

## Authorized R1 repair cycle

- **Repair started:** `2026-09-04T14:18:09Z`
- **Authorized finding:** Required R1 from the failed independent Review: exact bare `Index:` does not satisfy CPML-002 after line trimming, while `Index: policy.ts` does.
- **Vertical implementation owner:** `deck-apply-deep`; `deck-quality` is not an implementation owner.
- **Registry writer:** `deck-lead`, limited to this change's authorized lifecycle and evidence files.
- **HEAD at repair start:** `dd596899b649ad9a0cda00b1d85749f8a281bab5`.
- **Candidate patch SHA-256 at repair start:** `a7f1fc554f59c81718c080d61143211442b0ac626104869e0f21c8896e78907f`, computed from the raw `git diff --no-ext-diff HEAD -- <three candidate paths>` stream.
- **Index state:** no candidate path was staged; `git diff --cached --name-only` was empty.
- **Worktree boundary:** the complete pre-repair `git status --porcelain=v1` inventory was captured. Existing unrelated modifications and untracked files remain outside this repair and must not be touched.
- **Authorized source/test writes:** only `packages/core/src/memory/capture-eligibility.ts` and `packages/core/src/memory/capture-eligibility.test.ts`.
- **Required method:** strict RED/GREEN. Add permanent descriptive coverage for exact bare `Index:` and `Index: policy.ts`, prove the bare case fails in the focused core test before production changes, then make only the semantic `Index:(?:\s|$)` correction.
- **Excluded work:** Optional O1, adapter test edits, runtime, observability, same-turn, generated assets, live/provider activity, broad suites, release work, and all Git history or discard operations.
- **Historical preservation:** `review-report.md`, the `review.failed` event, and incomplete Tasks 4.1-4.3 remain unchanged.

### Strict TDD evidence

`deck-apply-deep` completed the authorized repair as the sole vertical implementation owner.

#### RED

Only the two permanent structural-patch rows were added before the production predicate changed:

- exact bare marker line: `Index:`;
- path marker line: `Index: policy.ts`.

Both cases use durable architecture/policy wording and require `eligible: false` with `reason: "diff_or_patch"`.

```sh
bun test "packages/core/src/memory/capture-eligibility.test.ts"
```

- 48 tests: 47 passed, 1 failed.
- 49 expectation calls.
- The only failure was `rejects structural patch evidence from a bare Index marker line`.
- Expected: `{ eligible: false, reason: "diff_or_patch" }`.
- Received: `{ eligible: true, reason: "eligible" }`.
- The `Index: policy.ts` row passed in the same RED run.
- Production still contained `Index:\s` when this failure was observed.

#### GREEN

The sole production repair changed the existing marker alternative from:

```ts
Index:\s
```

to:

```ts
Index:(?:\s|$)
```

No other heuristic branch was refactored or changed by this repair. The implementation owner then obtained these immediate post-change results:

- focused Core: 48 passed, 0 failed, 49 expectation calls;
- adapter fake transport: 12 passed, 0 failed, 58 expectation calls;
- `bunx tsc --noEmit`: exit code 0 with no diagnostics;
- targeted OpenSpec validation: valid with 0 errors and the one expected warning-first `repair_incident.artifact.missing` condition because `repair-incident.md` was outside the user's authorized paths.

The three-file candidate patch SHA-256 became `2b78360584f10c919b7d4b3c2455283cb587c3dcad2fd7ac021ab910289a19b2`. Only the two authorized Core paths were written by the implementation owner. No path was staged.

- **Repair resolved:** `2026-09-04T14:47:30Z`
- **Repair result:** R1 corrected; fresh re-verification started without changing the failed Review record or Tasks 4.1-4.3.
