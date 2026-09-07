# Review Report: Adaptive Memory Observability Receipts

## Verdict

**GO**

Independent Quality initially returned NO-GO for provider correlation persistence, single-use injection expectations, incomplete boundary validation, diagnostic leakage, missing concurrency/cleanup coverage, and unrelated Pi generated churn. The same implementation owner repaired each confirmed code finding with demonstrated RED/GREEN evidence. A bounded re-review cleared the code-level findings, and explicit user-confirmed removal of only the accidental Pi generated churn cleared AMOR-007.

## Final assessment

- Correctness: GO. Recall, capture, injection, replay, compaction, stale generation, concurrency, and cleanup behavior match the specification.
- Privacy and security: GO. Persistence is metadata-only and allowlisted; raw/native/provider correlation and diagnostic values do not persist or leak through observability diagnostics.
- Architecture: GO. Core owns pure receipt math, adapter-supermemory owns final capture bytes, the host owns validation/joining/executable evidence, and OpenCode owns actual-push acknowledgment.
- Performance: GO. Receipt maps, retired-session state, replay state, and cached executable resolution are bounded.
- Scope: GO. Capture Policy and unrelated WIP were preserved. Pi/Codex environment-scrubbing tests remain as hermetic regressions; unrelated Pi generated body churn is absent from the final candidate.

## Residual limits

- Equality receipts are not authentication tokens and do not prove confidentiality or publisher provenance.
- Low-entropy deterministic inputs remain guessable by an auditor with candidate values.
- Same-user bearer possession remains the existing local forgery boundary.
- Non-Linux executable evidence is lower trust than Linux `/proc/self/exe` evidence.
- No live canary, provider, release, or publication verification was authorized.

---

## Independent re-review after the DeckMemoryBench repair — 2026-09-04

### Lifecycle and verdict

- **Re-review started:** `2026-09-04T17:56:28Z`, after the repaired candidate identity was confirmed and before independent judgment.
- **Re-review failed:** `2026-09-04T18:08:38Z`.
- **Independent reviewer:** `deck-quality`; the `deck-apply-deep` repair owner did not perform Review.
- **Verdict:** **NO-GO**.
- **Phase/status:** Review / failed.

This fresh verdict applies to the repaired candidate. It does not replace, delete, reorder, or alter the original Review GO, its later invalidation by the repository-wide benchmark failure, `repair.started`, `repair.resolved`, the repair RED/GREEN evidence, the resolved repair incident, or focused re-verification history.

### Repaired candidate identity and evidence boundary

- HEAD was `dd596899b649ad9a0cda00b1d85749f8a281bab5` immediately before Review.
- The canonical repaired seven-path subject digest was `sha256:3c1142abe6f14aeeb3e6ae3ad0e33141c8a9aa90ae9eede447e946ee0f9f96f8`, an exact match before `review.started`. It was computed from the path-sorted raw-byte manifest `JSON.stringify({ head, files: [{ path, digest: "sha256:<hex>" }] })` over the two benchmark files plus `apply-progress.md`, `events.yaml`, `repair-incident.md`, `state.yaml`, and `verify-report.md`.
- The preserved pre-repair digest is `sha256:c77bcebdc75fe559266f2ee61306702f5cdfeb456bc54e09e8ec62bd580c77b1`.
- The authorized lifecycle writes to `state.yaml` and `events.yaml` occurred only after the repaired subject was bound, so later manifest drift is registry-only and does not change the reviewed implementation subject.
- The permanent benchmark test was reviewed before the harness. The complete bounded observability candidate diff and only the production sources/tests needed for `customId`, metadata, receipts, and provider payloads were inspected directly.
- The codebase-memory generation dated `2026-08-20T17:25:00Z` predates the candidate; modified production metadata was stale and relevant tests/assets/scripts were excluded or untracked. Direct source and exact diff evidence therefore governed the verdict.
- Review did not rerun tests, TypeScript, benchmarks, builds, provider calls, canary or live probes, the full suite, or OpenSpec validation. The repaired Verify evidence was assessed but not substituted for inspection.

### Findings

#### Critical

None.

#### Required

##### R1 — Permanent coverage does not fail on the exact fake-transport regression

The current implementation is correct: `FakeSupermemoryTransport.add` requires and records `payload.customId` (`benchmarks/deckmemorybench.ts:154-159`), and benchmark capture no longer supplies `correlationId` (`benchmarks/deckmemorybench.ts:93-101`). The permanent test validates the public runtime identity shape and rejects the former literal identity (`benchmarks/deckmemorybench.test.ts:28-36`).

However, the test never supplies a valid `customId` together with a conflicting legacy `metadata.correlationId`. Reverting the fake to its prior preference, `payload.metadata?.correlationId || payload.customId`, would still select `customId` because current runtime payloads correctly omit correlation metadata, so the new test would remain green. The requested regression guarantee is therefore absent even though current runtime and benchmark behavior are correct.

**Minimum repair:** add a benchmark-local behavioral test that gives the fake both a valid `customId` and a conflicting legacy `metadata.correlationId`, then proves that storage/search identity follows `customId`. A narrow test seam or export is sufficient; no Adaptive Memory production change is required.

#### Optional

None.

#### FYI

- Equality receipts remain deterministic evidence rather than authentication or confidentiality controls.
- Low-entropy candidate inputs remain guessable to an auditor holding candidate values.
- Same-user possession of the ephemeral loopback bearer remains the existing local forgery boundary.
- Non-Linux executable evidence remains lower trust than Linux `/proc/self/exe` evidence.

### Benchmark repair assessment

| Question | Assessment |
|---|---|
| Fake no longer reads `metadata.correlationId` | **PASS.** It requires and records only `payload.customId` (`benchmarks/deckmemorybench.ts:154-159`). |
| `correlationId` was not reintroduced into provider payloads, receipts, or persisted metadata | **PASS.** Provider ingest metadata omits it (`packages/adapter-supermemory/src/conversation.ts:25-30,65-90`), the HTTP payload exposes `customId` without a correlation field (`packages/adapter-supermemory/src/runtime.ts:452-459`), and sink serialization remains allowlisted (`apps/cli/src/supermemory-observability.ts:39-67`). Remaining correlation occurrences are ephemeral loopback or compatibility inputs. |
| `payload.customId` is part of the public `transport.add` contract | **PASS.** `SupermemoryRuntimeTransport.add` accepts `SupermemoryAddPayload`, whose `customId` is required (`packages/adapter-supermemory/src/runtime.ts:62-75`). |
| `customId` is stable by session/scope | **PASS.** It derives from canonical scope plus stable session identity (`packages/adapter-supermemory/src/conversation.ts:71-80,148-150`), with same-session stability covered by `packages/adapter-supermemory/src/conversation.test.ts:12-30`. |
| Benchmark does not depend on internal `bench-explicit-remember` identity | **PASS.** The harness no longer contains that value; the test retains it only as a negative legacy assertion (`benchmarks/deckmemorybench.test.ts:35`). |
| MCP baseline remains separate | **PASS.** It is computed only from immutable seed records (`benchmarks/deckmemorybench.ts:109-110,182-185`). |
| Scores, gates, expectations, and scenarios were not weakened | **PASS.** All 13 scenarios and existing gates remain intact (`benchmarks/deckmemorybench.ts:51-55,72-87,120-144`); affected expectations consume the observed public provider identity. |
| New test fails if the fake again depends on `correlationId` | **FAIL — Required R1.** Current runtime input omits the conflicting field, so the old fallback expression would still select `customId`. |
| No Adaptive Memory production source changed in the post-Review repair | **PASS within the official evidence boundary.** `repair-incident.md:86-88` and `verify-report.md:58-60` bind the repair to the benchmark pair and lifecycle artifacts, with no contradictory current evidence. A single worktree snapshot cannot independently reconstruct chronology. |
| Comparative DeckMemoryBench purpose remains intact | **PASS.** Runtime capture remains compared against a seed-only MCP baseline; the runtime identity must be retrieved through the runtime path and remain absent from the baseline (`benchmarks/deckmemorybench.ts:109-110,131,143,182-185`). The repair is not merely a green bypass. |

### AMOR-001 through AMOR-007 matrix

| Requirement | Re-review disposition | Evidence |
|---|---|---|
| AMOR-001 — Provider-neutral receipts | **CONFORMS.** | Exact UTF-8 receipts and project/domain-separated SHA-256 recipes remain implemented in `packages/core/src/memory/adaptive-memory-observability-receipts.ts:24-47`. |
| AMOR-002 — Metadata-only persistence | **IMPLEMENTATION CONFORMS; REVIEW BLOCKED BY R1.** | Provider and sink persistence exclude correlation identifiers, but permanent benchmark coverage does not detect the exact fake regression. No production privacy defect was found. |
| AMOR-003 — Additive metric contract | **CONFORMS.** | Metric fields remain additive/optional and include the specified operation/channel (`packages/adapter-supermemory/src/runtime.ts:25-50`). |
| AMOR-004 — Capture correlation | **CONFORMS.** | Capture outcomes retain final/candidate receipts and immutable correlation (`packages/adapter-supermemory/src/runtime.ts:292-375`); provider metadata excludes correlation (`packages/adapter-supermemory/src/conversation.ts:25-30`). |
| AMOR-005 — Recall and injection join | **CONFORMS.** | Actual push precedes acknowledgment (`packages/adapter-opencode/assets/opencode/plugins/developer-team-execution.ts:544-558`), and the host validates bounded expected receipts before successful injection metrics (`apps/cli/src/supermemory-runtime-host.ts:519-532,729-805,838-855`). |
| AMOR-006 — Executing payload receipt | **CONFORMS.** | Linux process-image hashing, digest-backed classification, lower-trust fallback, fail-open behavior, and caching remain implemented (`apps/cli/src/runtime-executable-receipt.ts:26-98`). |
| AMOR-007 — Parity and safety | **CONFORMS BY INSPECTION AND OFFICIAL VERIFY EVIDENCE.** | The generated source marker and installed/generated equality contract remain present (`packages/adapter-opencode/assets/opencode/plugins/developer-team-execution.generated.js:1-2`; `packages/adapter-opencode/src/developer-team-execution-reachability.test.ts:252-266`). No command was rerun. |

R1 does not demonstrate a production violation of AMOR-001 through AMOR-007. It blocks Review because the repaired benchmark's permanent proof is weaker than the explicitly required regression contract for AMOR-002.

### Five review axes

| Axis | Assessment |
|---|---|
| Correctness | **REQUIRED.** Current behavior is correct, but permanent coverage cannot detect the exact fake identity-preference regression. |
| Readability and simplicity | **GO.** The implementation is localized and consumes the existing public identity without a production abstraction. |
| Architecture and ownership | **GO.** Core owns receipt math, adapter-supermemory owns provider payloads, the host owns validation/joining/executable evidence, and OpenCode owns actual-push acknowledgment. |
| Privacy and security | **GO.** Persistence is allowlisted and excludes native/provider correlation, content, raw scope, paths, credentials, headers, and diagnostic values. Existing residual trust limits remain explicit. |
| Compatibility and performance | **GO.** Metric additions remain optional, `customId` remains the public contract, state is bounded, executable resolution is cached, and the official 0.203 ms p95 evidence remains applicable. |

### Final disposition

One Required finding remains, so the repaired candidate is **NO-GO** and Review is **failed**. No code, tests, Apply evidence, Verify evidence, repair incident, generated asset, bundle parity record, baseline health, quarantine, provider/live path, or unrelated change was modified during Review.

The single minimum next step is a separately authorized benchmark-test hardening delta for R1 by the existing implementation owner, followed by only the checks invalidated by that delta and another independent re-review. The focused benchmark test and TypeScript would become newly justified after that repair; `bench:memory` need not be repeated unless benchmark logic changes.

---

## Final independent re-review after the Required R1 repair — 2026-09-04

### Lifecycle and verdict

- **Re-review started:** `2026-09-04T19:14:27Z`, after candidate identity matched and before independent judgment.
- **Re-review completed:** `2026-09-04T19:21:40Z`.
- **Independent reviewer:** `deck-quality`; `deck-apply-deep` remained only the implementation owner and did not participate in Review.
- **Verdict:** **GO**.
- **Phase/status:** Review / completed.

This final verdict appends to, and does not replace, delete, reorder, rewrite, or hide the original Review GO, the first benchmark repair, the failed repaired-candidate re-review and Required R1, the second repair, mutation proof, repair incident, or focused re-verification history.

### Candidate identity and evidence boundary

- CWD was `/home/kevin15011/deck` and HEAD was `dd596899b649ad9a0cda00b1d85749f8a281bab5` before Review.
- Git inventory showed no staged paths. Pre-existing modified and untracked WIP remained present and outside Review ownership, including `docs/deck-product-reference.es.md`.
- The canonical repaired seven-path subject digest was exactly `sha256:c4ef200ff3457202f58cb733484fbb6bddf94068a7a4a09a461041069d485527` before `review.started`. It used the previously recorded path-sorted raw-byte manifest method over both benchmark files plus `apply-progress.md`, `events.yaml`, `repair-incident.md`, `state.yaml`, and `verify-report.md`.
- The permanent benchmark test was inspected before the fake and module-local exercise. The graph generation predated or excluded material candidate paths, so direct source, scoped diff, and official OpenSpec chronology governed the verdict.
- Review did not repeat tests, TypeScript, the benchmark, mutation testing, builds, provider/live calls, canary checks, the full suite, or release actions. The official Verify evidence was reviewed and no technical contradiction made repetition necessary.

### Findings

#### Critical

None.

#### Required

None. Required R1 is resolved.

#### Optional

None.

#### FYI

- The empty query for `conflicting-correlation-id` is corroborative rather than independently mutation-sensitive because fake search matches content terms rather than record IDs (`benchmarks/deckmemorybench.ts:165-178`). Capture-ID and document-query assertions provide the decisive mutation kill.
- Equality receipts remain deterministic evidence rather than authentication or confidentiality controls. Low-entropy candidate inputs remain guessable, same-user bearer possession remains the existing local forgery boundary, and non-Linux executable evidence remains lower trust than Linux `/proc/self/exe` evidence.
- No live provider, canary, release, or publication acceptance was authorized or produced.

### Required R1 resolution and mutation-proof assessment

**R1 is resolved.** The permanent exercise instantiates the same unexported `FakeSupermemoryTransport` used by DeckMemoryBench and simultaneously supplies `customId: "stable-custom-id"` with `metadata.correlationId: "conflicting-correlation-id"` (`benchmarks/deckmemorybench.ts:149-190`). It observes capture identity, document-query identity, and the conflicting-value query (`benchmarks/deckmemorybench.ts:191-197`).

The permanent test requires captured and document-query IDs to be `stable-custom-id`, requires the conflicting-value query to return no results, and explicitly excludes `conflicting-correlation-id` from captured and retrieved IDs (`benchmarks/deckmemorybench.test.ts:6-16`). The final fake validates, captures, and stores exclusively through `payload.customId` (`benchmarks/deckmemorybench.ts:154-159`); no correlation-first fallback remains.

The exact old mutation `payload.metadata?.correlationId || payload.customId` necessarily selects the non-empty conflicting value. Captured and document-query IDs then become `conflicting-correlation-id`, contradicting the permanent expected object. The test therefore fails on the exact regression identified by the prior Review rather than on an adjacent behavior.

The mutation proof is strong and sufficient: it reaches the disputed fake branch directly, checks both captured identity and stored/retrieved record identity, and official evidence records correct GREEN, controlled mutation RED with the conflicting value, explicit inverse restoration, and restored GREEN (`verify-report.md:70-85`; `repair-incident.md:118-130`). Direct inspection found no contradiction requiring command repetition.

### Seam and comparative benchmark assessment

| Question | Assessment |
|---|---|
| Seam is minimal and benchmark-local | **PASS.** Only `exerciseFakeSupermemoryTransportCustomIdConflict` is exported from the benchmark module; the fake remains unexported and the adjacent benchmark test is the sole consumer (`benchmarks/deckmemorybench.ts:149,182-197`; `benchmarks/deckmemorybench.test.ts:3,7`). |
| No product or package-public API was introduced | **PASS.** Benchmarks remain outside package export surfaces; no productive transport or package contract was expanded. |
| Final fake identity is customId-only | **PASS.** Validation, capture, and record storage use only `payload.customId`; `metadata.correlationId` appears only in the deliberate conflicting regression fixture (`benchmarks/deckmemorybench.ts:154-159,185-190`). |
| Production remained outside the second repair | **PASS by official chronology and current evidence.** The second repair is bound to the benchmark pair and lifecycle artifacts (`apply-progress.md:81-100`; `verify-report.md:87-90`; `events.yaml:128-170`), with no contradictory production delta found. |
| Correlation did not reappear in provider or persistence payloads | **PASS.** Provider ingest metadata excludes it (`packages/adapter-supermemory/src/conversation.ts:25-30,65-90`), HTTP provider serialization exposes `customId` without a correlation field (`packages/adapter-supermemory/src/runtime.ts:452-459`), and JSONL sink serialization remains allowlisted (`apps/cli/src/supermemory-observability.ts:39-67`). |
| customId remains the public stable scope/session identity | **PASS.** `SupermemoryAddPayload.customId` remains required and is derived from canonical scope plus stable session identity (`packages/adapter-supermemory/src/runtime.ts:62-77`; `packages/adapter-supermemory/src/conversation.ts:71-80,148-150`). |
| No positive dependence on `bench-explicit-remember` | **PASS.** The harness no longer contains that internal identity; its occurrence remains only a negative legacy assertion in the test. |
| MCP baseline remains separate | **PASS.** It is computed only from immutable seeds (`benchmarks/deckmemorybench.ts:109-110,200-203`). |
| Scenarios, scores, gates, expectations, and fixture quality remain intact | **PASS.** All 13 scenarios, precision/recall scoring, byte and latency gates, and comparative expectations remain (`benchmarks/deckmemorybench.ts:51-55,72-87,120-144,218-241`). |
| Comparative purpose remains intact | **PASS.** Runtime capture identity must be rediscovered through the runtime path while remaining absent from the seed-only MCP baseline. |

### AMOR-001 through AMOR-007 matrix

| Requirement | Final disposition | Evidence |
|---|---|---|
| AMOR-001 — Provider-neutral receipts | **GO / CONFORMS.** | Exact UTF-8 byte receipts and domain-separated SHA-256 formulas remain intact (`packages/core/src/memory/adaptive-memory-observability-receipts.ts:24-47`). |
| AMOR-002 — Metadata-only persistence | **GO / CONFORMS; R1 CLOSED.** | Production ingest and JSONL persistence exclude correlation, while permanent fake-precedence coverage now kills the exact conflicting-correlation regression. |
| AMOR-003 — Additive metric contract | **GO / CONFORMS.** | Metric additions remain optional and retain the required operation and channel vocabulary (`packages/adapter-supermemory/src/runtime.ts:25-50`). |
| AMOR-004 — Capture correlation | **GO / CONFORMS.** | Capture outcomes retain final/candidate receipts and immutable fingerprint correlation, while provider construction omits native correlation (`packages/adapter-supermemory/src/runtime.ts:292-375`). |
| AMOR-005 — Recall and injection join | **GO / CONFORMS.** | Actual system push precedes acknowledgment, and the host validates bounded expected receipts before successful injection metrics (`packages/adapter-opencode/assets/opencode/plugins/developer-team-execution.ts:543-558`; `apps/cli/src/supermemory-runtime-host.ts:519-529,729-805,838-855`). |
| AMOR-006 — Executing payload receipt | **GO / CONFORMS.** | Process-image hashing, digest-backed classification, lower-trust fallback, fail-open behavior, and cache-once semantics remain intact (`apps/cli/src/runtime-executable-receipt.ts:26-98`). |
| AMOR-007 — Parity and safety | **GO / CONFORMS.** | Generated-source marker and install parity contract remain present; official focused verification passed without a contradictory final diff (`packages/adapter-opencode/assets/opencode/plugins/developer-team-execution.generated.js:1-2`; `packages/adapter-opencode/src/developer-team-execution-reachability.test.ts:252-270`; `verify-report.md:79-89`). |

### Five review axes

| Axis | Assessment |
|---|---|
| Correctness | **GO.** The permanent test directly kills the exact old correlation-first precedence mutation; established benchmark behavior remains intact. |
| Readability and simplicity | **GO.** The exercise is narrow, the fake remains private, and no production abstraction was added. |
| Architecture and ownership | **GO.** Regression proof remains benchmark-local; production provider identity continues through the existing required `customId` contract. |
| Privacy and security | **GO.** The conflicting correlation value exists only in the deliberate test fixture; productive provider payloads, receipts, persisted metadata, and JSONL remain correlation-free. |
| Compatibility and performance | **GO.** Public/additive contracts, seed-only MCP baseline, scenarios, scoring, and gates remain unchanged. Official Verify evidence reports 13/13 scenarios and 0.352 ms p95 against the 20 ms gate. |

### Final disposition

No Critical or Required finding remains. The candidate is **GO** and Review is **completed**. All earlier Review, repair, mutation, incident, and Verify evidence remains preserved. No candidate code, test, Apply artifact, Verify artifact, repair incident, generated asset, unrelated WIP, provider/live path, quarantine, staging area, release state, or publication state was modified during independent Review.

The single minimum next step is Archive readiness assessment under a separately authorized lifecycle action; do not execute Archive as part of this Review.
