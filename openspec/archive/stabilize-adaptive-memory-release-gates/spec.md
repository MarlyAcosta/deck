# Specification: Stabilize Adaptive Memory Release Gates

## Requirements

### REQ-STAB-001 — Preserve unrelated work

The stabilization MUST modify only evidence-backed candidate routes and MUST preserve all pre-existing tracked, untracked, ignored, generated, Serena, documentation, and other-owner work.

**Scenario:** Given a dirty multi-owner worktree, when stabilization completes, then no unrelated path or byte is discarded, staged, committed, or rewritten.

### REQ-STAB-002 — Intentional bundle parity

The canonical Adaptive Memory agent, session, and skill fragments MUST remain byte-identical when their surface contract is equivalent. A stale inline hash baseline MAY be refreshed only after confirming the current content and history are intentional; production content MUST NOT be changed merely to recover an obsolete hash.

**Scenario:** Given intentional equivalent fragments and a stale baseline, when the canonical parity test runs, then all three surfaces match the justified current hash.

### REQ-STAB-003 — Provider-neutral secret screening

Core MUST reject high-confidence credential material without naming or translating a concrete Adaptive Memory provider protocol. Provider-specific transport identifiers MUST remain in an adapter or injected provider dependency.

**Scenario:** Given generic authorization, API-key header, token, password, connection URI, and private-key forms, when a managed recall query is parsed, then secret-like material is rejected without a concrete provider literal in Core.

### REQ-STAB-004 — Deterministic RunnerAdapter timeout coverage

The Codex RunnerAdapter probe test MUST verify bounded startup and hung-process semantics without relying on an uncontrolled real child process whose cleanup can exceed the test budget. Production timeout semantics MUST remain bounded and observable.

**Scenario:** Given injected delayed-success and timeout outcomes, when the probe is evaluated, then readiness and indeterminate results are deterministic and no orphan process can hold the test open.

### REQ-STAB-005 — Deterministic TUI discovery coverage

Mounted Codex discovery verification MUST synchronize on observable render/discovery progress rather than a fixed five-second wall-clock deadline. It MUST still fail with bounded diagnostics when progress cannot occur.

**Scenario:** Given controlled Codex inventory responses and Ink render events, when the user navigates, retries, and opens model selection, then the test waits on causal state transitions and preserves degraded/live discovery semantics.

### REQ-STAB-006 — Candidate-bound quality gates

Each blocker group MUST have focused RED and GREEN evidence. After all focused checks are green, the candidate MUST receive focused Verify, independent Review, and one final normative BROAD gate including release tests, full tests, benchmark, compiled smoke, build, typecheck, and the workflow's canonical OpenSpec validation.

**Scenario:** Given a green focused candidate and independent GO, when BROAD executes, then every mandatory command exits zero or the candidate remains blocked with a causal disposition.

### REQ-STAB-007 — Safe Archive

Archive MAY run only for release-related candidates in Review/completed state with current candidate-bound Verify, independent GO, mandatory BROAD green, focused OpenSpec validation, no Critical or Required findings, and no unexpected final inventory delta.

**Scenario:** Given the release workflow validates an already archived named change, when eligible candidates are archived, then `--change canonical-supermemory-conversation-memory` remains valid and no workflow command depends on a candidate staying under `openspec/changes/`.
