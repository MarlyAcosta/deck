# Preconditions: Adaptive Memory Observability Receipts

- User authorization to implement this bounded change is recorded in the initiating request.
- Existing unrelated work MUST be preserved and MUST NOT be staged, discarded, normalized, or rewritten.
- `openspec/changes/fix-opencode-automatic-memory-same-turn/**`, `packages/core/src/memory/capture-eligibility.ts`, and `packages/core/src/memory/capture-eligibility.test.ts` are outside the writable implementation set.
- Existing additions in `packages/adapter-supermemory/src/runtime.test.ts` MUST be preserved; new adapter receipt tests use a separate file.
- Tests use fake transports, temporary roots, simulated executable images, and no provider credentials.
- Generated JavaScript is modified only by `bun scripts/generate-runner-execution-assets.ts`.
- If exact runtime payload evidence requires model fields, environment digest claims, raw path persistence, or Capture Policy modification, Apply MUST stop.
- No live provider call, canary rebuild/live rerun, commit, push, release, or publication is permitted.
