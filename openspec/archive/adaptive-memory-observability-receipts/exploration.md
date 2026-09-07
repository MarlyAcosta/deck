# Exploration: Adaptive Memory Observability Receipts

## Outcome

The bounded follow-up is feasible without model-supplied fields, environment-provided digest claims, provider calls, or a broad runtime redesign.

## Current gaps

- `SupermemoryRuntimeMetric` cannot correlate native sessions, logical turns, capture sources, snapshot generations, actual system-transform injection, or the executing host payload.
- Capture metrics omit the SHA-256 and UTF-8 byte count of the normalized and redacted candidate even though search metrics already carry equivalent metadata.
- Recall terminal metrics count rendered advisory bytes but do not hash the exact advisory returned to OpenCode.
- `experimental.chat.system.transform` pushes the snapshot without a metadata-only acknowledgment.
- The JSONL sink allowlist cannot persist the new receipt fields.
- Canary installation computes immutable payload digests, but runtime metrics do not hash the already-running process image.

## Trusted trace

The OpenCode plugin owns native hook IDs and snapshot generation, the authenticated loopback host validates those ephemeral values and derives persisted fingerprints, adapter-supermemory owns post-redaction capture bytes, and the CLI host owns rendered advisory bytes plus the running process image. The sink persists only allowlisted receipt metadata.

On Linux, `/proc/self/exe` identifies the executable image already mapped for the current process. Hashing those bytes avoids trusting the canary alias, an environment claim, or a model-provided field. The host may classify the image as `deck-canary` only when the resolved basename is `.deck-canary.payload-<sha256>` and the suffix equals the computed digest.

## Lifecycle decision

Create a separate canonical change. The prior `fix-opencode-automatic-memory-same-turn` working brief is functionally complete, lacks canonical registry state, and currently contains unrelated Capture Policy follow-up work. Extending it would conflate behavior repair with an independently reversible observability contract.

## Boundaries

No Capture Policy, recall/capture semantics, provider integration, project identity, interrogative-prompt handling, broad-suite baseline, `.codex` artifact, or prior missing `state.yaml` is in scope.
