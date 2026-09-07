# Release Readiness: Stabilize Adaptive Memory Release Gates

## Current continuation — 2026-09-07

**Archive completed:** the observability, capture-policy and stabilization changes are now at their same-named `openspec/archive/` locations with `archive/archived` registry status and zero-issue post-validation. Workflow and canonical archived dependency are unchanged. See `archive-report.md`; the paragraph below records the READY decision before that move.

**READY.** GEN-001 is resolved; focused Verify passed and independent Review returned GO with zero Critical/Required. Canonical Bun 1.3.12 outputs and a tested generator guard have complete ownership. See [gen-001-provenance.md](gen-001-provenance.md) and [gen-001-review.md](gen-001-review.md). The three related changes may proceed to authorized conditional Archive. O-GEN-001, capture-policy O1 and historical execution deviations remain explicit, non-blocking evidence. The following sections preserve the previous final-inventory decision and broad-gate results, not the current readiness verdict. Version/CHANGELOG preparation remains unexecuted.

## Final disposition

**NOT READY for release preparation. Archive was not executed.**

The five-path implementation candidate passed focused verification and independent re-review. All eight normative commands in the captured final execution exited zero. However, the integrated worktree contains generated runtime bytes not covered by the independent candidate Review. The final-inventory/unchanged-candidate condition is therefore not satisfied.

This report does not invalidate the completed source-level fixes or manufacture a historical OpenSpec gate. It prevents the narrower GO from being applied to a broader, subsequently regenerated artifact set.

## Normative command evidence

Execution environment: Bun `1.4.0` on Linux x64. The release workflow pins Bun `1.3.12`; this session did not install or run that version.

| Command | Exit | Evidence |
|---|---:|---|
| `bun test apps/cli/src/upgrade-command/__tests__/release-descriptor.test.ts` | 0 | 38 passed, 0 failed, 76 expectations. |
| `bun test scripts/prepare-release.test.ts` | 0 | 23 passed, 0 failed, 56 expectations. Deliberate negative-fixture diagnostics were expected. Temporary fixture descriptors are test effects, not a prepared release. |
| `bun test --timeout 30000` | 0 | 4,825 passed, 1 skipped, 0 failed; 20,672 expectations; 4,826 tests across 308 files; runner-reported 201.25 seconds. |
| `bun run bench:memory` | 0 | 13/13 scenarios; precision 1; recall 1; p95 local overhead 0.291 ms against the 20 ms gate. No live ranking claim. |
| `bun run verify:supermemory-compiled` | 0 | Linux x64 extracted-archive runtime/CLI/doctor/Codex-hook smoke passed. Linux arm64 and both Darwin targets compiled only. Local mock endpoint; no live provider call. |
| `bun run build` | 0 | Four targets built and packaged at existing version 0.3.0. The command necessarily repeated benchmark and compiled smoke internally. |
| `bunx tsc --noEmit` | 0 | No diagnostics. |
| `bun run apps/cli/src/main.tsx openspec validate --json --root . --change canonical-supermemory-conversation-memory` | 0 | One archived change validated; 0 errors and 0 warnings. |

Raw final command logs are retained under `/tmp/opencode/deck-broad-final/`: `release-descriptor.log`, `prepare-release-test.log`, `full-suite.log`, `memory-benchmark.log`, `compiled-smoke.log`, `build.log`, `typecheck.log`, and `canonical-openspec.log`. This durable table preserves the result if temporary logs expire.

The build emitted `dist/cli/deck_v0.3.0_{linux-x64,linux-arm64,darwin-x64,darwin-arm64}.tar.gz` and checksums through its canonical workflow. Nothing was published or installed.

## Execution deviation: BROAD response loss

The initial sequential context-mode batch timed out at the MCP response boundary. Its `bun test --timeout 30000` child was still running after response loss; Lead waited for the observed process to end. Attempts to recover the batch results returned no usable current batch evidence. Lead then launched a second normative execution with explicit per-command logs.

Consequently this was **not one physical full-suite invocation**, even though it remained one coordinated stabilization phase. The first invocation's complete results and downstream command completion cannot be claimed. The second full-suite execution was caused by lost tool evidence, not a proved candidate regression; this deviated from the user's stricter one-run constraint. No further BROAD invocation was executed. The nested benchmark/smoke repetition inside `bun run build` is separately part of the normative command, not another invented gate.

## Final-inventory blocker GEN-001

`scripts/build-binaries.ts:102-108,120-123` invokes the canonical runner-asset generator. `scripts/generate-runner-execution-assets.ts:21-34` rebuilds all three runner entries and prepends a digest of each entry file.

| Generated surface | Prior evidence | Current evidence |
|---|---|---|
| Pi entry TypeScript | HEAD SHA-256 `0285e8cca53df1f11cc90a255bafd6396001b91bb9426469e849c761143f7d26` | Same SHA-256; entry bytes are unchanged. |
| Pi generated JavaScript | Clean at intake; HEAD SHA-256 `b64918dcc24ecec0c8c119da6ef9939c66dad7a9f71aa58910200ac0450ddb96` | SHA-256 `5edde47a3a38b4f7a965885b0f145308df0612a5523a9f1b3dae82d30a5f6b32`; 127 additions and 127 removals. |
| OpenCode entry TypeScript | Prior observability SHA-256 `31e81e932d71397b7c4177d9650c2640a31478607508b9450f087ebc9f242c59` | Same SHA-256. |
| OpenCode generated JavaScript | Prior reviewed SHA-256 `ab7a2f439494fe7c5a4c36de1f4ceb6a712d1c29f7b90ef03a6af7286aef20f1` | SHA-256 `f1a1f06b15ad0b643c4b701117544be3d37df36b6d8620412bfd59e76b9510bf`. |

Both generated headers agree with the current entry digests. That is evidence of entry provenance only: it does **not** hash every transitive input or prove output equivalence. The observed rename-heavy diff and compiler-version difference suggest compiler-related churn, but the exact cause and semantic equivalence were not established. In particular, an unchanged entry does not prove an unchanged dependency closure or a nondeterministic minifier. No such stronger claim is used for readiness.

The earlier OpenCode input did not change relative to its recorded digest, so its new generated digest cannot be justified by claiming a later entry-source edit. Its prior generated-byte evidence must not be silently reused for the new bytes.

The canonical commands, not manual editing, produced these changes. Lead preserved the generated files rather than discarding them. No third Review cycle or extra full suite was started. GEN-001 remains a blocking integration/Archive-evidence gap, not a newly observed failing test.

## OpenSpec debt and workflow coupling

- Archive guidance requires complete candidate-bound Verify, independent Review, mandatory BROAD, and no blocker. It does not prescribe an all-history `openspec validate` invocation.
- `openspec/baseline-health.yaml` lists test and typecheck gates with no active known failures; it is not an allowance for historical registry errors and was not changed.
- No new ledger, blanket ignore, exception, bypass, or historical artifact repair was introduced.
- Focused validation passed with zero errors/warnings for this stabilization change, `adaptive-memory-observability-receipts`, `fix-adaptive-memory-capture-policy-markdown-lists`, and `expose-managed-project-memory-recall`.
- The workflow's `canonical-supermemory-conversation-memory` is already archived. Single-change validation searches active then archived directories, and its actual normative command passed against the archive location. There is no demonstrated need to change the workflow or move that change back to active storage.

## Review disposition

- Initial independent Review: NO-GO; 0 Critical, 1 Required, 1 Optional.
- Required TUI bypass repair: completed by the same implementation owner; only the invalidated TUI check was repeated.
- Single independent re-review: GO; 0 Critical, 0 Required; two optional lifecycle-readability notes reconciled by Lead.
- That GO covers the five source/test paths only. It does not clear GEN-001 introduced/discovered during the later generated-artifact reconciliation.

The historical RunnerAdapter and TUI nonzero failures did not reproduce in isolation. Source-level fragilities were repaired and the final suite is green; the exact historical timeout cause is not represented as experimentally proved. The hung-render test is a never-resolving test-double proof, not a separately recorded temporary source mutation run.

## Closure

The stabilization registry retains `review/completed` for the independently reviewed five-path candidate, with an explicit blocking next action. The two completed memory changes remain active and untouched. No change was archived, no archive report claiming success was written, and there are no new Archive paths.

The next bounded action is to resolve generated-artifact provenance/equivalence and ownership against the reviewed inputs, then bind independent evidence to the resulting bytes. Only after that may a separately authorized version/CHANGELOG preparation step begin. No version number was selected or changed here.
