# Verify Report: Adaptive Memory Capture Policy Markdown Lists

## Lifecycle and result

- **Change ID:** `fix-adaptive-memory-capture-policy-markdown-lists`
- **Verify started:** `2026-09-04T13:38:03Z`, before executing any verification command
- **Verify completed:** `2026-09-04T13:41:50Z`
- **Result:** PASS
- **Phase/status:** Verify / completed

All required evidence passed. No source or test file was modified. No provider call, live test, canary, build, generated asset, full release suite, stage, commit, archive, restore, discard, clean, reset, checkout, stash, rebase, push, tag, release, or publication action occurred.

## Worktree baseline and scope comparison

- HEAD remained `dd596899b649ad9a0cda00b1d85749f8a281bab5`.
- The three candidate files were unstaged and their cached diff was empty before verification.
- The three-file candidate patch SHA-256 was `a7f1fc554f59c81718c080d61143211442b0ac626104869e0f21c8896e78907f` before verification and remained identical after every behavioral/type check.
- `git status --porcelain=v1` was captured before verification and after each focused test, the direct probe, TypeScript, and OpenSpec validation. The out-of-scope inventory did not change.
- The only authorized artifact writes were `tasks.md`, `apply-progress.md`, `state.yaml`, `events.yaml`, and this `verify-report.md` inside this change directory.

## Exact commands and results

### Baseline and repeated scope guards

```sh
rtk git status --porcelain=v1
rtk git diff --cached --name-only
git rev-parse HEAD
git diff --no-ext-diff HEAD -- "packages/core/src/memory/capture-eligibility.ts" "packages/core/src/memory/capture-eligibility.test.ts" "packages/adapter-supermemory/src/runtime.test.ts" | sha256sum
```

`rtk git status --porcelain=v1` was repeated after each verification command. The candidate-digest command was repeated after the focused tests and structural probe. No unexpected path or staged change appeared.

### Focused core policy tests

```sh
bun test "packages/core/src/memory/capture-eligibility.test.ts"
```

- 46 passed
- 0 failed
- 47 expectation calls
- 1 file

This covers the exact regression prompt; ordinary dash, numbered, nested, and prose-mixed Markdown; canonical diff markers; paired headers; hunk evidence; dense mixed signs; negative reasons; trusted sources; and durable vocabulary inside rejected content.

### Adapter fake-transport regression

```sh
bun test "packages/adapter-supermemory/src/runtime.test.ts"
```

- 12 passed
- 0 failed
- 58 expectation calls
- 1 file

All transport behavior was local and injected. The accepted Markdown-list case used `createFakeTransport`, returned `ok: true`, and recorded exactly one `add`. The pre-existing rejected raw-shape loop includes a canonical patch and ends with zero fake transport calls, proving the rejected patch did not reach provider ingestion. Tests that exercise the HTTP adapter inject `fetchImpl`; no live provider was contacted.

### Direct `Index:` and residual-ambiguity probe

```sh
bun -e 'import { evaluateAdaptiveMemoryCaptureEligibility as evaluate } from "./packages/core/src/memory/capture-eligibility.ts"; const cases = [["Index marker", "Index: policy.ts\nDecision: this architecture must remain stable."], ["dense mixed signs", "Decision: preserve this architecture.\n-old context\n-old policy\n+new context\n+new policy\nThis convention must remain."], ["one-sided marker-free excerpt", "Decision: preserve this architecture.\n-old context\n-old policy\n-old boundary\n-old adapter\nThis convention must remain."]]; for (const [name, content] of cases) console.log(JSON.stringify({ name, result: evaluate({ source: "trusted-user-prompt", content }) }));'
```

- `Index: policy.ts`: rejected with `eligible: false`, reason `diff_or_patch`.
- Dense mixed-sign candidate: rejected with `eligible: false`, reason `diff_or_patch`.
- Marker-free one-sided excerpt: admitted with `eligible: true`, reason `eligible`.
- 3 probe cases produced the expected results; this command did not write a test or source file.

### Affected type compatibility

```sh
bunx tsc --noEmit
```

- Exit code 0
- 0 diagnostics

The current policy exposes TypeScript as the available type checker, while the Verify build command is empty. No build or generated-asset check was required or run.

### Targeted OpenSpec validation

```sh
bun run deck -- openspec validate --json --change fix-adaptive-memory-capture-policy-markdown-lists --root "/home/kevin15011/deck"
```

The command was run once with Verify in progress and again after canonical completion was recorded. Both runs reported one active valid change with 0 errors and 0 warnings; the final run reported phase `verify` and status `completed`.

The repository-wide test command and the full release suite were not run. Contribution policy requires the smallest affected tests first and broader gates only when the change requires them. The two directly affected test files plus the repository type checker cover this isolated three-file candidate; the full release suite was expressly forbidden. No broad failure exists to classify against `openspec/baseline-health.yaml`.

## CPML-001 through CPML-006 matrix

| Requirement | Result | Verification evidence |
|---|---|---|
| CPML-001 — Ordinary Markdown lists | PASS | Focused core suite passed exact, dash, numbered, nested, and prose-mixed cases. The fallback requires both added and removed lines, so dash-only Markdown continues to durable classification. |
| CPML-002 — Structural patch evidence | PASS | Focused tests passed `diff --git`, paired headers, `@@`, dense mixed signs, and durable vocabulary in a real diff. Source directly recognizes `Index:` and the Verify probe confirmed `Index: policy.ts` returns `diff_or_patch`. |
| CPML-003 — Negative-filter precedence | PASS | Source order keeps secret, environment, patch, stack, raw output, tool, external/official artifact, source-dump, and trivial checks before durable high-signal classification. All focused negative cases passed; durable wording did not override patch or provider-result rejection. |
| CPML-004 — Provider boundary | PASS | Adapter fake-transport suite passed. Rejected raw shapes, including a canonical patch, produced zero transport calls; accepted durable Markdown produced exactly one fake `add`. |
| CPML-005 — Compatibility and ownership | PASS | TypeScript passed with zero diagnostics. Candidate diff leaves trusted source values, normalization, eligibility result types, reason strings, provider/runtime contracts, observability receipts, generated assets, same-turn artifacts, and fail-open runtime handling unchanged. |
| CPML-006 — Residual ambiguity | PASS with documented residual limitations | Direct probe confirms dense mixed `+`/`-` text remains a possible false positive and marker-free one-sided patch excerpts remain possible false negatives. The change makes no complete-classifier claim; independent Review must retain this assessment. |

## Dedicated `Index:` coverage decision

There is no dedicated permanent `Index:` row in `capture-eligibility.test.ts`. This is **not a blocking or verifiable CPML-002 coverage gap for this change**:

1. The implementation has an explicit `Index:` structural branch in `looksLikeDiffOrPatch`.
2. The pre-existing WIP test table covers the same canonical-marker decision path through `@@`, in addition to separate `diff --git`, paired-header, and dense mixed-sign cases.
3. The read-only Verify probe exercised a conventional `Index: policy.ts` marker through the production evaluator and received the required `diff_or_patch` result.
4. CPML-002 requires the behavior; it does not require one dedicated permanent row per marker spelling.

The missing dedicated row remains a non-blocking maintainability observation. If independent Review requires permanent regression coverage for `Index:`, adding it would need separate test-file write authorization.

## Baseline and failure classification

- Focused core: PASS, no failure fingerprint.
- Adapter fake transport: PASS, no failure fingerprint.
- Structural probes: PASS, expected residual behavior observed.
- TypeScript: PASS, zero diagnostics.
- Targeted OpenSpec validation: PASS, zero errors and zero warnings.
- Unexpected worktree mutation: none.
- Baseline-ledger classification required: none; no command failed.

## Final disposition

Verify is complete and CPML-001 through CPML-006 are satisfied within the specified bounded heuristic. Apply and Verify are complete. Independent Review has not started. The only next lifecycle step is independent Review, which must reassess scope, privacy/security, the `Index:` maintainability observation, and both CPML-006 ambiguities without claiming complete Markdown/diff classification.

## R1 repair re-verification

- **Re-verification started:** `2026-09-04T14:47:30Z`, after the authorized strict RED/GREEN repair was complete and before fresh re-verification commands were executed.
- **Repaired candidate patch SHA-256:** `2b78360584f10c919b7d4b3c2455283cb587c3dcad2fd7ac021ab910289a19b2` from the same raw three-file HEAD-to-worktree diff stream used by the original candidate.
- **Evidence boundary:** the original Verify report above remains historical evidence for the pre-Review candidate. This section records fresh evidence for the repaired candidate and corrects the earlier non-blocking classification of missing permanent `Index:` coverage.
- **Review boundary:** `review-report.md`, `review.failed`, and incomplete Tasks 4.1-4.3 remain unchanged. Re-verification does not produce a GO verdict.

### Fresh commands and results

The following commands were rerun in order after `verify.started` was recorded:

```sh
bun test "packages/core/src/memory/capture-eligibility.test.ts"
bun test "packages/adapter-supermemory/src/runtime.test.ts"
bunx tsc --noEmit
bun run deck -- openspec validate --json --change fix-adaptive-memory-capture-policy-markdown-lists --root "/home/kevin15011/deck"
```

- **Focused Core:** 48 passed, 0 failed, 49 expectation calls, 1 file.
- **Adapter fake transport:** 12 passed, 0 failed, 58 expectation calls, 1 file.
- **TypeScript:** exit code 0 with no diagnostics.
- **OpenSpec while Verify was in progress:** `ok: true`, one valid active change, 0 errors, and 1 warning. The warning is `repair_incident.artifact.missing`: the current schema treats a missing repair-incident reference as warning-first, while `repair-incident.md` was not among the user-authorized paths. No out-of-scope file was created to suppress it.

### Repaired acceptance evidence

- Exact `Index:` and `Index: policy.ts` are permanent structural-patch rows and both return `eligible: false`, `reason: "diff_or_patch"` in the passing focused suite.
- Dash, numbered, nested, and prose-mixed Markdown knowledge remains eligible in the same suite.
- `diff --git`, paired `---`/`+++` headers, `@@`, paired removed/added content, and durable vocabulary inside a real diff remain rejected in the same suite.
- The adapter suite's rejected raw-shape loop includes canonical structural patch content, all rejected cases return before ingestion, and the shared fake transport records zero calls. Accepted durable Markdown still records exactly one fake `add`.
- The production repair changed no trusted-source value, normalization, reason shape, filter order, runtime, transport, provider, observability, generated asset, or residual-ambiguity branch.

### Re-verification result

- **Completed:** `2026-09-04T14:49:17Z`
- **Result:** PASS for the repaired candidate, subject to a fresh independent Review.
- **Phase/status:** Verify / completed.
- **Candidate digest after all behavioral/type checks:** `2b78360584f10c919b7d4b3c2455283cb587c3dcad2fd7ac021ab910289a19b2`.
- **Review status:** not rerun; no GO claim is made and Tasks 4.1-4.3 remain incomplete.
- **Final targeted OpenSpec validation after completion was recorded:** `ok: true`; phase `verify`, status `completed`; 0 errors and the same 1 warning-first `repair_incident.artifact.missing` condition.
