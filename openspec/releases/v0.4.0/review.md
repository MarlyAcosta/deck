# Independent release-preparation Review

**Verdict: NO-GO / NOT PREPARED.** Independent reviewer: `deck-quality`, read-only, 2026-09-07. Findings: **0 Critical, 1 Required, no new Optional**. No test, suite, build, benchmark, typecheck, generation, or OpenSpec validation was rerun by Quality.

## Required R1 — Restore full-suite evidence after a bounded TUI repair

The Web Search TUI test `dashboard install writes provider-neutral Web Search policy only to Developer Team roles` times out before its policy assertions. Source: `apps/cli/src/tui/app.web-search-developer-team.test.tsx:54,107`, unchanged from HEAD/intake.

Evidence under `/tmp/opencode/release-v0.4.0-20260907/`:

- `gate-03-full-test.log:2160–2171,5591–5602`: TUI timeout and 4,824 pass / 1 skip / 5 fail, exit 1.
- `diagnostic-node-available.log:3–14`: TUI timeout persists with Node present. Lines 16–33 show all 11 process tests pass, reconciling the four Node-absence failures but not replacing the failed full-suite gate.
- `diagnostic-web-search-fixture-v2.log:3–18`: timeout persists with a synthetic readiness value and network-fetch-rejecting preload. Missing credentials and Codex are not established causes.
- `openspec/baseline-health.yaml:56–78`: no applicable known-failure waiver.

**One minimal next scope:** obtain authorization to diagnose and repair only this existing Web Search TUI verification path, then causally revalidate it and the invalidated full-suite gate with Node available and pinned Bun. Observe review-plan readiness/blocker and action results rather than only eventual file existence: `input-handler.ts:140–157` and `action-runner.ts:990–999` are diagnostic entrypoints, not a proven root cause. Preserve real materialization and role-isolation assertions. No production changes, live credentials/providers, sleeps, retries, or longer timeouts. No repair or rerun is authorized by this Review.

## Candidate integrity — PASS

- 162 unique inputs: 32 source/test/metadata, one generated OpenCode bundle, 125 archived evidence files (20 / 20 / 77 / 8), four release-evidence artifacts.
- Exact commit groups: 66 / 90 / 6 files; no overlaps, missing paths, ignored paths, binaries or raw logs included.
- All 158 embedded hashes match. Four self-describing artifacts match the external pre-recording Review snapshot. The 19 included `.log.txt` historical records match their excluded raw-log counterparts.
- All 2,006 Review-snapshot paths and the tracked/untracked path set match. Only CHANGELOG, package metadata and the authorized Codex test changed among 1,994 intake files. Three earlier archives, four excluded WIP paths and three old cache files remain unchanged.
- All 1,866 index entries match HEAD, staged diff is empty, and manifest-scoped `git diff --check` passes. This does not assert unchanged index metadata bytes.

## Reviewed bindings

| Pre-recording Review subject | SHA-256 |
|---|---|
| `commit-manifest.json` | `53650956aa24913a9262974130263499bb3b72db6a6747b618a06e133ae2a5d7` |
| External `review-candidate.json` | `f50bde0463232c57cd5b67ddc9550c0d1fc9503d2cf2c7adffc986b16279ab7e` |
| Sorted 162-input digest (`path<TAB>sha256<LF>`) | `94f4698dd6f4cf769039ebe28e2cb273513e85baddb6c2c8fd8dad6a66c6f0b5` |
| Codex test | `d764f79a78cf5ff65fdd8d633216dda012e1352995e6097112d696c3c84b4419` |

These bindings cover the subject reviewed before replacing the pending Review placeholder and updating preparation status. Lead's external `final.json` snapshot binds the final reporting-only delta; no product or test candidate changes follow Review.

## Gates, metadata and freshness — reviewed

Quality checked the retained results of all eight normative commands, once in order: descriptor 38/0; helper 23/0; full suite failed as above; benchmark 13/13; four-target compiled smoke with host execution; four-target build and matching archive checksums; clean typecheck; canonical archived OpenSpec validation with zero issues. Internal build benchmark/smoke dependencies are not a second Lead sequence.

Root 0.4.0, eight internal 0.0.0 versions, unchanged lock, retained Unreleased and prior changelog history all pass. No protected documentation WIP is attributed to the release. OpenCode/Pi/Codex/skill hashes and all three source-digest headers match current sources. Verified Bun ZIP/extracted/executing bytes agree with the retained official provenance.

Ignored build-info is correct for the preparation base and final target, not a future release commit; it is excluded. No root/dist release descriptor exists. Publication must regenerate build-info and release.json without a staleness bypass.

## FYI and authority

HEAD/branch/upstream remain unchanged; local and origin v0.4.0 and preparation branch are absent. Pushing main can create a draft prerelease if workflow gates pass, so any later preparation push should use the separately authorized proposed branch. No Git mutation, branch creation, publication or runtime-cohort expansion is authorized.

The closed Codex repair remains GO for its unchanged test-only candidate; its optional future test-count guard is non-blocking. Earlier findings are not reopened. Offline evidence proves neither live provider ranking/TLS behavior nor execution on non-host platforms.

Review used official artifacts, logs, direct source, byte comparisons and read-only Git queries. Adaptive memory was not used; no graph access/completeness is claimed. Quality modified no files or Git state; Lead persisted this report.

## Attempt 2 — Required R1 repair and change Review, 2026-09-07

The original **NO-GO / NOT PREPARED** decision and Required R1 above remain verbatim historical evidence. The user subsequently authorized the bounded repair; this section does not erase or retroactively change that decision.

Independent `deck-quality` change Review returned **GO, zero Critical/Required/Optional** for SHA-256 `c839a24be39c7cb61be375c43c532d3a2223f38cf2409c72cb8e7ca9d96bb9b4` of `apps/cli/src/tui/app.web-search-developer-team.test.tsx`. Full report: `openspec/archive/fix-web-search-developer-team-tui-verification/review-report.md`.

Quality confirmed the incomplete tools-review fixture and automatic-before-team action ordering, actual MCP/materializer delegation, causal wait bounds, no output fabrication or weakened assertions, valid old-fixture RED before Install, final focused/TypeScript GREEN, all 11 process tests, and the single **4,829 pass / one existing skip / zero fail** suite. The original 22-line role/standalone assertion block is byte-identical; seven plan/effect assertions supplement it.

Only the test changed among 2,006 intake paths, and all five generated controls, metadata, previous archives, release history and protected WIP matched at change Review. No production change occurred, so previous passing descriptor/helper/benchmark/compiled/build/canonical-validation evidence remains reusable. Quality reran no gates and modified no files or Git state.

The change has now been archived canonically with zero errors/warnings. **Final release Review is pending** against the appended attempt evidence and updated exact manifest; change Review alone is not the final preparation verdict. R1's repair and verification are complete, awaiting that release-wide confirmation.

### Attempt 2 final release Review — PREPARED

Independent final read-only `deck-quality` Review after Archive returns **PREPARED — Deck v0.4.0**, **0 Critical / 0 Required / 0 new Optional**. **Required R1 is resolved, not erased.** This approves preparation for a separately authorized next Git step, not a commit, branch creation, push, tag, publication or runtime rollout.

#### Final conditions verified

- Root 0.4.0, CHANGELOG section/date, and lock retain intake bytes.
- The one new suite is green: 4,829 pass, one pre-existing skip, zero fail; focused 216/0 including all 11 process tests and final affected file 1/0; TypeScript exit 0.
- Eight new Archive files, active directory absent, archive/archived with preserved lifecycle prefixes; pre/post validation exits 0 with zero errors/warnings.
- Four older archives, all four explicit foreign-WIP paths, and all five generated controls match intake.
- HEAD remains `dd596899b649ad9a0cda00b1d85749f8a281bab5`, branch/upstream `main` / `origin/main` unchanged, index entries unchanged and staging empty. Live origin main remains `0bbd061313c23d9f0b9984d5fd5e9218b9d553ac`.
- Local/origin v0.4.0 and the proposed `release/v0.4.0-preparation` branch are absent. No branch or publication action occurred.
- Prior NOT PREPARED and Required R1 text remains an exact prefix in all three release reports; the prior failed suite remains failed historical evidence.

#### Manifest and reviewed bindings

Quality verified 171 unique exact inputs: 33 source/test/metadata, one generated OpenCode bundle, 133 archived evidence and four release artifacts. The prior 162 entries and their 158 embedded hashes are unchanged. Only the repaired test and eight new Archive files were added, all in commit 2. All 167 current embedded hashes match; four self-describing artifacts match the external reviewed snapshot. Groups remain 66 / 99 / 6 with the exact previously proposed messages/order. No duplicate, missing, ignored, glob-selected, foreign-WIP or unassigned dirty input exists.

| Pre-reporting-append binding | SHA-256 |
|---|---|
| Current manifest | `2001cfe37e9e11b958aa01bb3ebc6410edb779d7e70dafbc89467e1879c9aba1` |
| Preserved previous manifest | `53650956aa24913a9262974130263499bb3b72db6a6747b618a06e133ae2a5d7` |
| External `release-review.json` | `6034edf0efd30feb55df58c950aecaee7718e12cacb5bc0b18ebae71913ced40` |
| Sorted 171-input digest (`path<TAB>sha256<LF>`) | `20275a5572361cfd5ec282bd8e3bb8cc7a7926f96621711e4226fd62125c3126` |

All 2,014 reviewed snapshot paths and their path set match. These bindings precede Lead's final reporting-only append; the external `final.json` snapshot binds that append. OpenCode remains `b82a7f07014360fe542f075bc7315b62c26d1129be6316d3c672b83455f9aa82`; Pi remains `b64918dcc24ecec0c8c119da6ef9939c66dad7a9f71aa58910200ac0450ddb96`.

#### Gate reuse and limits

Descriptor 38/38, helper 23/23, benchmark 13/13, compiled smoke PASS, four-target build PASS and canonical memory validation 0/0 are retained and reusable: no production/build-input delta followed them. Quality reran no test, validation, typecheck, benchmark, smoke, build, generation, installation or provider operation and modified no file or Git state.

The workflow can create a draft prerelease after a successful main push, so use the proposed preparation branch only after explicit user authorization. Future publication must regenerate release-commit build information and descriptor; no current tag/publication authority is granted. Conclusions use official artifacts, retained receipts, direct bytes and read-only Git—not adaptive memory or graph completeness.
