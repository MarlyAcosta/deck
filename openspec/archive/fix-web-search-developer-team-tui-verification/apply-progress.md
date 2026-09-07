# Apply evidence

Implementation owner: `deck-apply-deep`. Scope: **test-only**, one file, `apps/cli/src/tui/app.web-search-developer-team.test.tsx`. Final candidate SHA-256: `c839a24be39c7cb61be375c43c532d3a2223f38cf2409c72cb8e7ca9d96bb9b4`.

## Demonstrated root cause

The fixture supplied an empty OpenCode tools review while the dashboard enables context-mode, codebase-memory, RTK and Context7 by default (`runner-dashboard/state.ts:307–314`). The adapter consumes that review (`runner-adapter.ts:818–840`); missing tools become missing capability entries (`capability-inventory.ts:99–120`) and automatic install/configuration actions (`capability-plan.ts:211–338`). The runner processes automatic/manual actions first (`action-runner.ts:1022–1036`), then config writes, then team applications (`1111–1116`).

The diagnostic run reached Install Progress with a ready plan but unrelated automatic actions pending, `applyCalls=0` and `mcpWrites=[]`. Therefore the test's expected-file wait was downstream of unrelated tool provisioning rather than evidence of a Web Search materialization defect. This is an incomplete fixture that exposed ambient capability work, not a demonstrated production defect, role-policy bug, credential failure or shared-state race. The prior attempt's unknown-cause report remains historically correct and is not rewritten.

## Repair and retained contract

- Supply deterministic usable tool evidence for those unrelated defaults via the existing injected `toolsReview` seam.
- Assert that the real reviewed plan is ready, has no unrelated automatic installs, and includes Web Search MCP configuration and Developer Team application **before** pressing Install.
- Observe and delegate to the original adapter methods, checking exactly one real Web Search MCP write and one real Developer Team apply. No expected output files are synthesized by the fixture.
- Use fresh render boundaries and bounded render/apply/exit waits at most 5,000 ms. Original 8,000 ms helper deadlines were reduced; the 20,000 ms file timeout was not increased. No sleeps, blind retries, skipped assertions or coverage reduction.
- Preserve all provider-neutral, per-role positive/negative and unrelated standalone-skill policy assertions.

## TDD and regression proof

All logs are retained under `/tmp/opencode/release-v0.4.0-tui-20260907/` with process receipts and isolated CI-like environments.

| Evidence | Result |
|---|---|
| `red-individual.log` | Original test: exit 1, 0 pass / 1 fail, expected-file timeout |
| `diag-plan-groups-001.log` | Exit 1, 0 pass / 1 fail; ready plan, unrelated automatic actions, no MCP/apply entry |
| `green-focused-001.log` | Exit 0, 1 pass / 0 fail, 381 expectations |
| `green-file-001.log` | Exit 0, whole file 1 pass / 0 fail, 381 expectations |
| `regression-old-fixture-001.log` | Isolated mirror restores only old empty toolsReview; exit 1, 0 pass / 1 fail, 2 expectations |

The regression fails at `expect(reviewedPlan?.groups.automaticInstalls).toEqual([])` (mirror line 184), before the later Install input at line 187. This proves the new guard detects the original fixture defect before automatic effects. Mutated source SHA-256: `f4b89885ef137b1e2974e39ac977342e541248a07dae78c39fd36ddcff762ca8`; exact mutation, source and process receipts are retained outside the repository. Workspace bytes were not temporarily reverted or mutated for this proof.

## Focused verification correction

Lead's initial TypeScript check found only TS18048 on optional `result.diagnostics` in the new observation text. Apply changed that formatting to `result.diagnostics?.join("|") ?? ""`. Lead reran the affected file and TypeScript successfully. The initial type error is retained in `verify-typescript.log`; the logging-only correction does not invalidate the old-fixture guard proof or unrelated test results.

No production, generated, root metadata, lock, prior archive, foreign WIP, user installation, or Git state was modified by implementation. All pre-existing file hashes other than this test match intake.
