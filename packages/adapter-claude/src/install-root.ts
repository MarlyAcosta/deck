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
 * Pure and I/O-free by design: no filesystem access happens here. Almost no downstream
 * materialization code needed to change to consume this (`transaction.ts` is entirely untouched)
 * — the one exception is `developer-team-install.ts`'s `CLAUDE.md` placement, which turned out to
 * be root-shaped rather than root-agnostic like every other materialized path; see
 * `isGlobalInstallRoot` below and that module's matching comment for the real, live-caught bug
 * this correction addresses.
 */
export function resolveClaudeInstallRoot(): string {
  return homedir();
}

/**
 * Pure comparison, deliberately separated from `resolveClaudeInstallRoot()` itself so it stays
 * unit-testable without either mocking `node:os` or writing real files into the actual user's
 * home directory during `bun test` runs (both rejected as worse options — this codebase's
 * convention throughout `add-claude-code-runner-support` and this change favors live-verified,
 * un-mocked reality over test doubles). Callers pass `resolveClaudeInstallRoot()`'s live value in
 * production; tests pass two arbitrary equal/unequal strings instead.
 */
export function isGlobalInstallRoot(candidateRoot: string, knownGlobalRoot: string): boolean {
  return candidateRoot === knownGlobalRoot;
}
