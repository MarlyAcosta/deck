# Specification: Adaptive Memory Observability Receipts

RFC 2119 terms are normative.

## AMOR-001 — Provider-neutral receipts

Core MUST expose exact UTF-8 byte-count/SHA-256 receipts and full project-separated session and logical-turn fingerprints.

The recipes MUST be:

```text
sessionFingerprint = sha256("deck.adaptive-memory.session.v1\0" + scopeFingerprint + "\0" + nativeSessionId)
logicalTurnFingerprint = sha256("deck.adaptive-memory.logical-turn.v1\0" + scopeFingerprint + "\0" + nativeSessionId + "\0" + logicalTurnId)
```

Digests MUST be lowercase 64-character hexadecimal SHA-256 values.

### Scenario: Project separation

**Given** identical native IDs under different scope fingerprints
**When** receipts are derived
**Then** session and logical-turn fingerprints MUST differ.

### Scenario: Exact UTF-8 bytes

**Given** normalized and redacted multibyte content
**When** its receipt is computed
**Then** byte count and SHA-256 MUST cover those exact UTF-8 bytes.

## AMOR-002 — Metadata-only persistence

Metrics and the sink MUST NOT persist native session/message IDs, provider correlation IDs, raw scope, content, queries, advisory text, memory results, prompts, responses, paths, credentials, tokens, or headers. The host MUST derive persisted fingerprints from validated ephemeral loopback IDs.

### Scenario: Prohibited extra properties

**Given** a metric-like value containing allowed receipts plus prohibited sentinel properties
**When** the sink serializes it
**Then** allowed receipts MUST persist
**And** prohibited keys and values MUST be absent.

## AMOR-003 — Additive metric contract

`SupermemoryRuntimeMetric` MUST add optional session/turn fingerprints, capture source, injected SHA-256, snapshot generation, and host executable receipt fields. It MUST add a `runtime_injection` operation and `system-transform` channel. Legacy metrics without these fields MUST remain valid.

## AMOR-004 — Capture correlation

Every capture metric with status `attempted`, `skipped`, `succeeded`, or `failed` MUST include `captureSource`, `inputByteCount`, and `inputSha256`.

Attempted ingest, provider success, and provider failure MUST describe the exact final normalized and redacted content supplied to ingest. Pre-ingest skips MUST describe only a canonical normalized and redacted receipt candidate, and calculating it MUST NOT affect Capture Policy ordering, decisions, reasons, or provider calls.

Automatic capture metrics MUST correlate to the active logical user turn. Provider correlation MUST remain transport-local and MUST NOT be persisted.

### Scenario: Successful capture

**Given** eligible content
**When** capture reaches the provider boundary
**Then** attempted and terminal metrics MUST share the exact final input receipt and turn fingerprints.

### Scenario: Skipped capture

**Given** ineligible content
**When** capture is skipped
**Then** the skip metric MUST contain only the normalized and redacted candidate receipt
**And** the provider MUST NOT be called.

## AMOR-005 — Recall and injection join

OpenCode MUST send the active logical turn and positive safe-integer snapshot generation with automatic recall. The host MUST derive fingerprints and propagate them without mutable global correlation state.

The terminal `runtime_recall` metric MUST include the exact rendered advisory byte count and SHA-256 plus session fingerprint, logical-turn fingerprint, and generation.

After and only after an actual `output.system.push(snapshot)`, OpenCode MUST send a fail-open metadata-only acknowledgment containing ephemeral IDs, generation, and the exact pushed byte receipt. The host MUST validate it against a bounded expected recall receipt before emitting `runtime_injection` / `system-transform` / `succeeded`.

### Scenario: Actual injection

**Given** a normal model request with a retained snapshot
**When** system transform pushes the snapshot
**Then** the host MUST emit a matching receipt joinable by session, turn, generation, byte count, and SHA-256.

### Scenario: Compaction

**Given** the latest request is compaction
**When** system transform runs
**Then** no snapshot or acknowledgment MUST be emitted.

### Scenario: Messages transform

**Given** a snapshot is pending
**When** `experimental.chat.messages.transform` runs
**Then** it MUST remain a no-op
**And** the subsequent matching system transform MUST still inject and acknowledge the snapshot.

## AMOR-006 — Executing payload receipt

On Linux the host MUST hash bytes through `/proc/self/exe`, persist no path, and cache the receipt once per process. It MUST classify `hostExecutableKind: deck-canary` only when the resolved process-image basename is `.deck-canary.payload-<64hex>` and the suffix equals the byte digest. Otherwise it MUST classify the image as `other`.

On non-Linux the host MAY hash the realpath target of `process.execPath` and MUST label that lower-trust source. An unreadable image MUST fail open without a fabricated digest.

### Scenario: Byte-backed canary

**Given** a canary-shaped process-image basename and matching bytes
**When** the executable receipt is derived
**Then** kind MUST be `deck-canary`.

### Scenario: Filename-only mismatch

**Given** a canary-shaped basename whose suffix does not match its bytes
**When** the receipt is derived
**Then** kind MUST be `other`.

## AMOR-007 — Parity and safety

The TypeScript OpenCode asset MUST remain authoritative. Generation MUST use `scripts/generate-runner-execution-assets.ts`; temporary installation MUST match generated bytes. Tests MUST use fake transports and temporary roots only. No live provider call, canary rebuild/live rerun, commit, push, release, or publication is authorized.
