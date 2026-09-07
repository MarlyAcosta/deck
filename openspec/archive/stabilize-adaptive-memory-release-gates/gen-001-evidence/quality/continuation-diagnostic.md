# GEN-001 continuation: bounded Codex failure disposition

Candidate subject: `64a81e9e30b3d7e3139ea11e0384ea983da573a9f4e5f99dd07e531489d5a7d9`.
HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`; index empty; all nine hashes matched at final check.

The interrupted review's `focused.log` is retained unchanged: 51 pass, 2 fail, 338 expectations, five files under Bun 1.3.12. It must not be represented as an all-green execution.

## Causal check

Only the two failing tests in `packages/adapter-codex/src/runner-adapter.test.ts` were selected using `--test-name-pattern 'separates selected instructions from MCP|reuses validated Deck-owned Serena evidence and blocks a missing launcher'`, with timeout 30000 and the verified absolute Bun 1.3.12 executable.

Both runs used the same workspace source, isolated HOME/XDG/cache/TMPDIR under `/tmp/opencode/gen-001-quality`, and PATH containing the pinned Bun directory plus `/usr/bin:/bin`. No real Codex, provider, or live service was invoked.

| Only changed input | Exit | Result |
|---|---:|---|
| No Codex binary on isolated PATH | 1 | 0 pass, 2 fail, 14 expectations; 4.86 seconds |
| Prepend offline `codex-fixture/` | 0 | 2 pass, 0 fail, 28 expectations; 3.69 seconds |

The fixture accepts only four version/help invocations and rejects all other commands. Both test bodies are byte-identical to HEAD. They omit injected Codex preflight, so `runner-adapter.ts:451-458,609-614` uses the real PATH probe. Missing Codex makes `preflight.ts:29-31` return before project-config inspection; `runner-adapter.ts:790-794` consequently inspects an empty MCP configuration. This explains both failures independently of Bun emission or generated assets.

Disposition: non-blocking inherited test-environment dependency for the bounded GEN-001 candidate. Optional hardening is to inject supported Codex preflight into these two tests while retaining project-snapshot inspection. This is not proof of a universally hermetic clean-CI suite. No permanent test or source was changed and no full suite was repeated.

## Reused evidence

`lexical-review.cjs` / `lexical.log` and `runtime-review.ts` / `runtime.log` were inspected and reused without rerunning completed checks. Current closure and candidate byte hashes still match their subject. Lead's 228-pass focused evidence, four named OpenSpec validations, pinned compiled smoke, and accepted historical broad gates were assessed without rerunning them.
