# Verify report

Verdict: **Verify GO**, pending independent Review. Focused checks, TypeScript and the single new full suite are green. This does not substitute for independent Review or Archive.

Candidate: `apps/cli/src/tui/app.web-search-developer-team.test.tsx`, SHA-256 `c839a24be39c7cb61be375c43c532d3a2223f38cf2409c72cb8e7ca9d96bb9b4`.

## Environment

Verified Bun `1.3.12+700fc117a`, Node `24.19.0`, PATH `/tmp/opencode/release-v0.4.0-tui-20260907/ci-bin:/usr/bin:/bin`. The dedicated bin directory exposes only Bun/bunx and Node/npm/npx; no personal directories or Codex/OpenCode/Deck/Serena/context-mode/RTK binaries are available. Every command has temporary HOME, XDG data/config/cache/state and TMPDIR with no inherited credentials. No global PATH or installation changes.

## Lead focused checks

| Check | Result | Full log |
|---|---|---|
| Exact affected test | PASS, exit 0, 1/0 | `verify-individual.log` |
| Complete affected file | PASS, exit 0, 1/0 | `verify-file.log` |
| Directly related dashboard/roles/Web Search/process checks | PASS, exit 0, 216/0, 995 expectations, 10 files | `verify-related.log` |
| Initial TypeScript | FAIL, exit 2, one optional-diagnostics TS18048 | `verify-typescript.log` |
| Affected file after diagnostic typing fix | PASS, exit 0, 1/0, 381 expectations | `verify-file-final.log` |
| `bunx tsc --noEmit` after typing fix | PASS, exit 0, no diagnostics | `verify-typescript-final.log` |

All logs and exact argv/exit/PID receipts are under `/tmp/opencode/release-v0.4.0-tui-20260907/`. The related batch covers runner-install contracts, action runner, input handler, install E2E-like checks, Web Search dashboard contract, OpenCode Developer Team materialization, capability plan, adapter Web Search, Core Web Search policy, and all **11 process tests**, including the four previously affected by missing Node.

Only the diagnostic formatter changed after the related batch; rechecking that file and TypeScript was sufficient. No production dependency changed.

## Single broad execution

After all focused checks passed, Lead launched exactly one new `bun test`, recorded as `broad-once`. The channel timed out without returning stdout, but both the existing supervisor and child were confirmed alive from retained PID receipts; no second suite was launched. Full log/result are `broad-once.log` and `broad-once.result.json` when complete. Pre-execution binding: `pre-broad.json`.

## Gate reuse and protected bytes

This test-only delta does not invalidate the prior passing release descriptor (38/38), prepare helper (23/23), DeckMemoryBench (13/13), compiled smoke, four-target build, or canonical archived OpenSpec 0/0 validation. They are reused, not rerun. Their exact prior receipts remain under `/tmp/opencode/release-v0.4.0-20260907/` and are documented in the release attempt history.

OpenCode remains `b82a7f07014360fe542f075bc7315b62c26d1129be6316d3c672b83455f9aa82`; Pi remains `b64918dcc24ecec0c8c119da6ef9939c66dad7a9f71aa58910200ac0450ddb96`. Other generated controls, root 0.4.0 metadata, CHANGELOG date/history, lock, four closed archives and foreign WIP match intake. No generator or build has been run in this repair.

## Broad completion

The existing `broad-once` process completed with **exit 0: 4,829 pass, 1 skip, 0 fail, 20,699 expectations; 4,830 tests across 309 files in 204.99 seconds**. Start: 2026-09-07T20:38:46.122588Z; end: 2026-09-07T20:42:11.253751Z. The affected TUI test passed in 922.43 ms. The one skip is the existing real temporary-directory canary compile/install smoke, not introduced by this repair.

Exactly one new complete suite was executed; its log, PID receipt and terminal result survived the channel timeout. Post-run hash comparison confirms the target test is the only changed intake file; prior release history has not yet been appended, and all four old archives, generated outputs, metadata and foreign WIP remain intact. `git diff --check` and empty staged-diff checks pass.
