# Release verification — 2026-09-07

## Verdict

**NOT PREPARED.** Seven normative gates pass; the full suite fails. No full-suite rerun occurred and no failure is waived as baseline debt. `openspec/baseline-health.yaml` has no active known failures.

## Exact gate execution

All commands used the verified Bun `1.3.12+700fc117a` binary. `bunx` was invoked as the same absolute Bun's `x` subcommand. Full logs, exact argv, PIDs, start/end times, environment allowlists and per-gate hashes are retained in `/tmp/opencode/release-v0.4.0-20260907/final-gates-status.json` and `gate-*.log`.

| # | Normative command | Exit | Result / full log |
|---|---|---:|---|
| 1 | `bun test apps/cli/src/upgrade-command/__tests__/release-descriptor.test.ts` | 0 | 38 pass, 0 fail, 76 expectations; `gate-01-release-descriptor.log` |
| 2 | `bun test scripts/prepare-release.test.ts` | 0 | 23 pass, 0 fail, 56 expectations; `gate-02-prepare-release.log` |
| 3 | `bun test` | 1 | 4,824 pass, 1 skip, 5 fail, 20,316 expectations; 4,830 tests / 309 files / 284.43s; `gate-03-full-test.log` |
| 4 | `bun run bench:memory` | 0 | 13/13 deterministic scenarios, zero failed; precision/recall 1.0; no live ranking claim; `gate-04-memory-benchmark.log` |
| 5 | `bun run verify:supermemory-compiled` | 0 | Four targets compile; Linux x64 extracted-archive runtime, CLI, Doctor, authenticated loopback and Codex hook smoke pass using local mocks; `gate-05-compiled-runtime.log` |
| 6 | `bun run build` | 0 | Four v0.4.0 platform archives and checksums produced under ignored `dist/cli/`; includes the root script's internal benchmark/smoke dependencies; `gate-06-build.log` |
| 7 | `bunx tsc --noEmit` | 0 | No diagnostics; `gate-07-typecheck.log` |
| 8 | `bun run apps/cli/src/main.tsx openspec validate --json --root . --change canonical-supermemory-conversation-memory` | 0 | Archived canonical change, zero errors/warnings; `gate-08-canonical-openspec.log` |

The sequence started at 18:58:27Z and finished at 19:11:21Z. It paused after gate 3 for bounded diagnosis, then resumed **only the five unrun commands**. No MCP response-loss restart, repeated full suite, or live Supermemory call occurred.

## Failure disposition

The initial sanitized process PATH contained pinned Bun plus `/usr/bin:/bin`. This host's Node is under NVM, so the harness unintentionally excluded Node. Four `apps/cli/src/runtime/__tests__/process.test.ts` assertions failed because they invoke `node`. Adding only the already-installed Node directory to a new process-local PATH made all 11 process tests pass. This is a preparation-environment error, not a demonstrated production regression. Full diagnostic log and exact environment: `diagnostic-node-available.log` / `.json`. No global PATH, toolchain or installation changed. The five remaining gates used this corrected PATH, still without Codex or OpenCode binaries and with isolated HOME/XDG/TMPDIR.

One separate failure remains reproducible: `apps/cli/src/tui/app.web-search-developer-team.test.tsx`, `dashboard install writes provider-neutral Web Search policy only to Developer Team roles`, times out at lines 54/107 waiting for OpenCode Developer Team files. It fails both in the suite and in the focused Node-available run. The file is unchanged from HEAD/intake. Do not classify it as a known baseline failure, a proved ambient-Codex issue, or a proved code regression; its exact root cause remains unresolved.

A bounded diagnostic with a synthetic, non-secret Web Search readiness value also failed with the same timeout; this does **not** establish a missing-credential cause. A first network-rejection preload incorrectly blocked Yoga's local data-URI WASM load; that diagnostic failure is retained separately. The corrected guard permits local data/file fetches, rejects network fetches, and still reproduces the TUI timeout. No real credential or live provider was used. Logs: `diagnostic-web-search-fixture.log`, `diagnostic-web-search-fixture-v2.log` and their receipts. Neither diagnostic changed repository source/tests.

The only proposed repair scope is to diagnose and make this existing Web Search materialization test deterministic/offline without changing product behavior, weakening assertions, or increasing timeouts. That test is outside the user's authorized Codex repair; no repair or additional OpenSpec change was started. After explicit authorization and a causal repair, rerun affected checks and the invalidated full-suite gate under the corrected environment before any commit/push readiness decision.

## Generated freshness and metadata

| Artifact | Before generation | Two repetitions and after all gates |
|---|---|---|
| OpenCode execution bundle | `b82a7f07014360fe542f075bc7315b62c26d1129be6316d3c672b83455f9aa82` | Same |
| Pi execution bundle | `b64918dcc24ecec0c8c119da6ef9939c66dad7a9f71aa58910200ac0450ddb96` | Same |
| Codex execution bundle (control) | `66361f5f653ab4ea944e9c9f8b8428e2131a825eda913c3b5ae563e867498863` | Same |
| Tracked skill-content bundle | `7ca11811594bcf72751d3f9b0b1a2bbfb9aaf2cdf68d07cef75e3c35ef7c1460` | Same |

Ignored build-info was canonically regenerated from SHA-256 `5c76e7b21c156e0949d3815af2f79d56aa8dccb2da5c48478f636a27ac01496d` to `c8dc9672722f8697290dc397fb0d85afb6cb8b61b7a67c53270c9c0fe95a164a`, describing 0.4.0 / dd59689 / 2026-09-07 / darwin-arm64 / stable. This expected build-time output is excluded from commits. The workflow must regenerate it for the future release commit. No `release.json` was persisted and no staleness bypass was used.

Root package version remains **0.4.0**; its SHA-256 is `10ae1aeca86dd0b3562cb67c4c048631f9b917a9f0a6e2e3292cf209a7ff8779`. Lock SHA-256 remains `f1a82718c8d465ef23cf2c5e488ba0cdfc3a94b2dcdfd51a3805ef7196a3282f`. Global Bun remains 1.4.0.

## Preservation and release identity

Post-gate snapshots show only CHANGELOG, root package metadata and the authorized Codex test changed among the 1,994 tracked/untracked intake files. All three previously closed archives and explicitly protected WIP retain their intake bytes. Ignored build outputs are separately accounted for above. Read-only Git status may refresh index stat metadata; index **entries** remain equal to HEAD and `git diff --cached` is empty. No staging or other Git-mutating operation was executed.

HEAD remains `dd596899b649ad9a0cda00b1d85749f8a281bab5`; branch/upstream remain `main` / `origin/main`, one local commit ahead of `0bbd061313c23d9f0b9984d5fd5e9218b9d553ac`. Read-only local and origin tag queries after the gates again show no `v0.4.0`. No tag, push or publication occurred.

## Attempt 2 — Causal verification after the TUI repair, 2026-09-07

The complete prior failed attempt above remains unchanged. Its Required has now received an authorized test-only repair and fresh causal verification; the previous failed suite is not reclassified as passing.

### New execution evidence

All full logs, PID/exit receipts, mutation evidence and snapshots for this attempt are retained at `/tmp/opencode/release-v0.4.0-tui-20260907/`. The CI-like PATH exposes only pinned Bun/bunx and Node/npm/npx plus `/usr/bin:/bin`, not personal command directories. Codex, OpenCode, Deck, Serena, RTK and context-mode are absent. Every subprocess uses temporary HOME/XDG/TMPDIR without inherited credentials.

| Check | Result | Evidence |
|---|---|---|
| Original individual reproduction | RED: exit 1, 0/1, downstream file timeout | `red-individual.log` |
| Plan/effect diagnostic | Ready plan includes unrelated automatic provisioning; MCP writes and team apply not reached | `diag-plan-groups-001.log` |
| Old-fixture regression in isolated mirror | RED: exit 1, 0/1, two expectations; new plan guard fails before Install | `regression-old-fixture-001.log` |
| Affected individual and complete file | GREEN: 1/0 and 381 expectations each | `verify-individual.log`, `verify-file.log` |
| Dashboard install, roles, Web Search and process checks | GREEN: 216/0, 995 expectations, 10 files; all 11 process tests pass | `verify-related.log` |
| Final file after optional diagnostic typing correction | GREEN: 1/0, 381 expectations | `verify-file-final.log` |
| `bunx tsc --noEmit` | GREEN: exit 0, no diagnostics | `verify-typescript-final.log` |
| **One new `bun test`** | **GREEN: 4,829 pass, one existing skip, zero fail; 20,699 expectations; 4,830 tests / 309 files / 204.99s** | `broad-once.log`, `.result.json` |
| New change before Archive | Exit 0, zero errors/warnings; review/completed | `pre-archive-validate.log` |
| New change after Archive | Exit 0, zero errors/warnings; archive/archived, active directory absent | `post-archive-validate.log` |

The initial TypeScript check reported one TS18048 on optional diagnostic formatting; the same implementation owner corrected it without changing assertions or runtime behavior. Its failed log remains retained, followed by the explicit green recheck. The old-fixture mutation guard proof remains valid because that formatting-only change does not alter the guard.

The broad process ran from **20:38:46Z to 20:42:11Z**, child PID 973340. The channel timed out without stdout; Lead checked the existing supervisor/child and recovered their terminal receipt rather than restarting. The affected TUI test passed in 922.43 ms. The one real canary smoke skip matches the prior suite and was not added by this repair. Exactly one new full suite was invoked.

### Prior gates reused, not rerun

| Prior gate | Preserved result | Causal reuse basis |
|---|---|---|
| Release descriptor | 38/38 | No descriptor/runtime/metadata delta |
| Prepare-release helper | 23/23 | No helper/version/changelog/lock change |
| DeckMemoryBench | 13/13 | No memory runtime or benchmark change |
| Compiled smoke | PASS | No production code or bundle closure change |
| Four-target build | PASS | No build inputs or toolchain change |
| Canonical memory OpenSpec | Zero errors/warnings | Canonical archived change remains byte-identical |

There was no benchmark, compiled smoke, build, generation or live-provider call in this continuation. The old failed full-suite gate is superseded only by the new successful causal execution, not silently reused.

### Freshness and preservation

Before and after this attempt, OpenCode is `b82a7f07014360fe542f075bc7315b62c26d1129be6316d3c672b83455f9aa82` and Pi is `b64918dcc24ecec0c8c119da6ef9939c66dad7a9f71aa58910200ac0450ddb96`. Codex, tracked skill content and ignored build-info also remain unchanged from intake. No generated output was edited or regenerated.

The reviewed test SHA-256 is `c839a24be39c7cb61be375c43c532d3a2223f38cf2409c72cb8e7ca9d96bb9b4`. Of 2,006 original paths, it is the only implementation/source change; this attempt subsequently appends the three release reports and updates the manifest. Prior report bytes are preserved as exact prefixes and as external copies. The four older archives and all foreign WIP remain intact. Version is still 0.4.0; CHANGELOG is byte-identical to intake. Staging remains empty, HEAD unchanged; no branch, commit, push, tag or publication occurred.

### Attempt 2 final verification disposition

Final independent release Review confirms **PREPARED**, with every current Required resolved. It verified the retained execution receipts, current candidate hashes, successful Archive and zero-warning validation, exact 171-file manifest, append-only history and live read-only tag/branch absence. No tests or previous release gates were rerun by Quality.

Current manifest SHA-256: `2001cfe37e9e11b958aa01bb3ebc6410edb779d7e70dafbc89467e1879c9aba1`. The final reporting-only append does not alter the implementation, tests, generated files, metadata or embedded manifest hashes and invalidates no test evidence. External final snapshot: `/tmp/opencode/release-v0.4.0-tui-20260907/final.json`. All raw earlier failures and the original NOT PREPARED verdict remain retained.
