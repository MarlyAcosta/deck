import { homedir } from "node:os";

/**
 * Where the Developer Team materializes for Claude Code (REQ-CGS-ROOT-001).
 *
 * Always `os.homedir()` — matching OpenCode's own configure-once-everywhere behavior
 * (`packages/adapter-opencode/src/runner-adapter.ts:751`) exactly: no CLI flag, no per-invocation
 * choice, no project-scoped alternative. `add-claude-code-runner-support`'s prior project-scoped
 * behavior is fully retired, not offered as an opt-in — the user explicitly rejected exposing a
 * scope choice at all, since none of the other runners expose one either.
 *
 * Pure and I/O-free by design: no filesystem access happens here, and no downstream
 * materialization/transaction code (`developer-team-install.ts`, `transaction.ts`) is modified to
 * consume this — they already accept any root string as-is.
 */
export function resolveClaudeInstallRoot(): string {
  return homedir();
}
