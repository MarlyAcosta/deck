# Deck v0.4.0 release preparation

## Intent, authority, and status

Prepare version, changelog, release-gate evidence, and an exact commit manifest. User authorization ends before staging, commits, push, tags, or publication. Status: **NOT PREPARED**; the full-suite gate failed. All eight normative commands have run once; independent `deck-quality` Review returns NO-GO with zero Critical and one Required. See `verification.md` and `review.md` rather than inferring readiness from the completed metadata and build.

- Base HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`.
- Current branch/upstream: `main` / `origin/main`.
- Existing `v0.3.0`: `010f0fd4d5a06e00d206f3eff922ddcf33e385a8`.
- Target: root `package.json` version `0.4.0`; changelog date `2026-09-07`.
- Read-only local tag listing and `git ls-remote --tags origin refs/tags/v0.4.0 refs/tags/v0.4.0^{}` returned no target tag at intake.
- Full intake hashes/diff and execution logs: `/tmp/opencode/release-v0.4.0-20260907/`.

## Closed prerequisite

The two inherited Codex readiness tests failed without a Codex binary (0 pass, 2 fail). `deck-apply-deep` repaired only the affected test file through the existing preflight seam with offline version/help and real temporary project inspection. Lead Verify: 33 pass, 0 fail, 270 expectations. Independent `deck-quality`: GO, zero Critical/Required, one non-blocking future-rename guard suggestion. The repair was validated and archived at `../../archive/make-codex-tests-ci-hermetic/` before the root version change.

The three user-designated archived changes and GEN-001 remain closed and byte-unchanged. No prior historical approval is treated as approval of this new release preparation.

## Metadata and changelog decisions

Root product metadata alone changes from 0.3.0 to 0.4.0. All eight workspace package versions remain 0.0.0. The root `bun.lock` workspace record contains no product version, and the existing core-package export delta changes neither dependencies nor workspace version; no lock update or install is required.

`CHANGELOG.md` preserves Unreleased, creates the dated 0.4.0 section, retains its existing Unreleased note, updates the comparison/tag links, and preserves prior history. Added/Changed/Fixed/Security notes cover canonical Supermemory project scoping, supported automatic capture and bounded recall, same-turn context and metadata-only acknowledgments, privacy-safe receipts and correlation, Markdown-list capture policy, credential rejection, deterministic runner assets, and runner/TUI release verification. Sources are the v0.3.0-to-final product diff and accepted memory/observability/capture/stabilization archives; unrelated documentation is excluded.

## Toolchain and generated contract

Use only `/tmp/opencode/gen-001/tools/bun-1.3.12-linux-x64/bun-linux-x64/bun`, revision `1.3.12+700fc117a`. Binary SHA-256: `92a1cd8b6185f676010bb18e767dfc65c772273e79ae9984480843261939eeaa`. The retained official release ZIP rehashes to `11dc3ee11bc1695e149737c6ca3d5619302cf4346e6b8a6ec7988967ef01ddc5`, and the executing binary matches its extracted bytes. No download, global Bun replacement, lock mutation, or installation is needed. Global Bun remains 1.4.0.

Expected OpenCode SHA-256: `b82a7f07014360fe542f075bc7315b62c26d1129be6316d3c672b83455f9aa82`.
Expected Pi SHA-256: `b64918dcc24ecec0c8c119da6ef9939c66dad7a9f71aa58910200ac0450ddb96`.

Baseline, two canonical generation repetitions, and all post-gate bundle hashes match. The build canonically generates build-info for each target; its final **ignored** build-info describes 0.4.0, base commit and the final darwin-arm64 target. `.gitignore` excludes `*.generated.ts` except the tracked skill-content bundle, so build-info is not a commit input. Skill content and Codex generated assets remain byte-identical. No unexpected generated drift occurred; no generated file was manually edited or discarded. No local release descriptor was generated; the workflow regenerates build-info and release.json at publication.

## Final gates

Execute once, in order, with absolute pinned Bun and a process-local sanitized environment:

1. `bun test apps/cli/src/upgrade-command/__tests__/release-descriptor.test.ts`
2. `bun test scripts/prepare-release.test.ts`
3. `bun test`
4. `bun run bench:memory`
5. `bun run verify:supermemory-compiled`
6. `bun run build`
7. `bunx tsc --noEmit`
8. `bun run apps/cli/src/main.tsx openspec validate --json --root . --change canonical-supermemory-conversation-memory`

The root build script internally repeats benchmark and compiled smoke as part of its canonical definition; that is not an extra Lead sequence. Keep full logs and PID/status receipts; do not restart a surviving process after an MCP response loss. No live Supermemory operations. No `--skip-staleness-check`.

## Ownership exclusions and handoff

Preserve and exclude `.serena/project.yml`, `docs/deck-product-reference.es.md`, `docs/ideas/deck-interactive-homepage.md`, the pre-existing active same-turn Working Brief follow-up, `.bun-cache/`, ignored outputs, and temporary evidence/tools. The exact 162-file release allowlist and three commit group assignments are recorded in `commit-manifest.json` and independently verified; no wildcard staging is authorized.

The final gate record has one blocking full-suite failure; independent preparation Review requires one bounded Web Search TUI verification repair and causal revalidation before readiness. That repair is not authorized or implemented here. Future push to the currently checked-out `main` branch triggers the workflow's main-branch draft prerelease path even without a v-tag if its workflow gates pass. The recommended future push target is a separate release-preparation branch, not main, to preserve the user's no-publication boundary. No branch is created or switched in this phase.

## Attempt 2 — Authorized TUI blocker repair, 2026-09-07

The preceding NOT PREPARED attempt and its Required are preserved verbatim as history. The user subsequently authorized one bounded repair, verification, conditional Archive and release-evidence update without Git mutation. **Current state: repair archived, final release Review pending.**

- Demonstrated root cause: empty OpenCode tool evidence made unrelated default-selected tools missing, scheduling provisioning before the intended Web Search/Developer Team materialization. The diagnostic reached a ready plan and Install Progress but no MCP write or team apply.
- `deck-apply-deep` changed only `apps/cli/src/tui/app.web-search-developer-team.test.tsx`: offline evidence for unrelated tools, pre-Install plan guards, observation of real MCP/team effects, bounded causal waits and unchanged per-role/standalone policy assertions.
- Original RED and isolated old-fixture regression RED are retained; the latter fails before Install. Focal original/file GREEN, 216 related tests including all 11 process tests, and TypeScript pass. One initial optional-diagnostics type error was repaired by the same owner and rechecked.
- Exactly one new full suite: **4,829 pass, one pre-existing skip, zero fail**. No duplicate invocation after the channel timeout; the original process result was recovered.
- Independent change Review: **GO**, zero Critical/Required/Optional. Canonical Archive: `openspec/archive/fix-web-search-developer-team-tui-verification/`; post-validation zero errors/warnings, active directory absent.
- Test-only delta: reuse the prior descriptor 38/38, helper 23/23, benchmark 13/13, compiled smoke PASS, four-target build PASS and canonical memory OpenSpec 0/0. No benchmark, compiled smoke, build or generation was rerun.
- Root version stays 0.4.0; CHANGELOG and its 2026-09-07 date, lock, five generated controls and all four older archives retain their intake bytes. Foreign WIP remains excluded.

The manifest adds the existing repaired test and exactly eight new Archive files to commit 2: **171 exact inputs**, grouped 66 / 99 / 6. The three proposed messages and order remain unchanged. Prior manifest SHA-256: `53650956aa24913a9262974130263499bb3b72db6a6747b618a06e133ae2a5d7`; its exact bytes are retained with the prior report copies in `/tmp/opencode/release-v0.4.0-tui-20260907/`. Final Review will bind the updated manifest and append its decision without altering this history.

### Attempt 2 final decision — PREPARED

**PREPARED — Deck v0.4.0.** Independent final read-only `deck-quality` Review after Archive confirms **zero Critical, zero Required and zero new Optional**. Historical Required R1 is resolved by the causal repair and replacement suite evidence; the earlier failed attempt remains unchanged above.

Manifest SHA-256: `2001cfe37e9e11b958aa01bb3ebc6410edb779d7e70dafbc89467e1879c9aba1`. Exact count and groups: 171 inputs, 66 / 99 / 6. All embedded hashes, exclusions, generated controls, metadata, changelog, prior archives and Git identity pass. Local and origin v0.4.0 are absent; staging is empty. No branch, commit, push, tag or publication was created.

Only reporting text was appended after final Review; `/tmp/opencode/release-v0.4.0-tui-20260907/final.json` binds that final reporting-only state. Next action is to request explicit user authorization for the proposed preparation-branch commits and push, without a tag or publication. PREPARED grants no Git or publication authority.
