# Exploration: Stabilize Adaptive Memory Release Gates

## Outcome

Prepare the current Adaptive Memory candidate for release preparation by resolving only the six remaining failures in four causal groups, preserving all unrelated work in the dirty worktree, and evaluating the repository once through the normative release gates.

## Initial inventory

- Reference HEAD: `dd596899b649ad9a0cda00b1d85749f8a281bab5`.
- Upstream: `origin/main` at `0bbd061313c23d9f0b9984d5fd5e9218b9d553ac`; local `main` is one commit ahead.
- The worktree and index were inspected before modification. No staged path was reported.
- The candidate implementation paths listed below were clean at intake.
- Unrelated WIP includes `.serena/project.yml`, `docs/deck-product-reference.es.md`, `.bun-cache/**`, the completed Adaptive Memory observability/capture-policy work, and the existing automatic-memory same-turn work. These paths are excluded from this change.

## Existing ownership assessment

All active OpenSpec directories and their registry status were inspected. The nearest prior scopes do not own this complete stabilization slice:

| Prior change | Relevant history | Ownership decision |
|---|---|---|
| `deck-as-installer-runner-agnostic` | Previously refreshed Adaptive Memory bundle hashes, but uses legacy registry shape and is already in an archive-oriented state. | Do not reopen or extend. |
| `expose-managed-project-memory-recall` | Owns the completed recall feature. | Preserve its requirements; handle the newly exposed purity regression here. |
| `add-first-class-codex-runner-support` | Owns the original Codex capability implementation but remains a failed Review candidate with unrelated open materialization blockers. | Do not conflate or repair that candidate. Stabilize only the two current deterministic test gates here. |
| `fix-release-gate-general-apply-failures` | Historical release-gate repair with incomplete legacy artifacts. | Do not reuse; its prior core-purity allowlist strategy is explicitly unsuitable for the current provider-boundary defect. |
| `adaptive-memory-observability-receipts` and `fix-adaptive-memory-capture-policy-markdown-lists` | Completed, independently reviewed work with reusable evidence. | Reuse existing evidence and do not rerun focused behavior unless this change directly touches those routes. |

No existing change clearly owns all four remaining blocker groups. This single change therefore owns only the release-readiness delta below.

## Candidate routes

1. Adaptive Memory instruction bundle byte-exact baseline.
2. Provider-neutral managed recall secret screening in Core.
3. Deterministic Codex RunnerAdapter probe verification.
4. Deterministic mounted TUI Codex discovery verification.
5. Focused OpenSpec validation and the single final BROAD release gate.

## Archive and OpenSpec authority

Executable Archive guidance requires current Verify, fresh independent Review, mandatory BROAD evidence, no blocker, and candidate-bound provenance. `openspec/baseline-health.yaml` records `bun test --timeout 30000` and `bunx tsc --noEmit` as pass-only repository gates with no active known failures.

The OpenSpec validator has distinct modes: no `--change` validates all active and archived directories, while `--change` validates exactly one named change and searches `openspec/changes/` before `openspec/archive/`. Archive does not define global all-history validation as a mandatory command. The release workflow requires only `--change canonical-supermemory-conversation-memory`, which remains valid after archival because single-change lookup includes `openspec/archive/`.

Therefore historical global OpenSpec debt will not be rewritten, allowlisted, or used to invent a new Archive gate. This candidate and every affected release candidate must pass focused validation, and the workflow's canonical archived change validation must pass in the BROAD gate.

## Readiness setup note

The session-start skill registry check found `.atl/skill-registry.md` absent. Canonical refresh refused before writing because source discovery returned `partial_source_evaluation` with unsafe-frontmatter diagnostics. No setup file was changed. Per runtime fallback, work continues with bounded active-runner discovery; this does not alter product or release-gate scope.
