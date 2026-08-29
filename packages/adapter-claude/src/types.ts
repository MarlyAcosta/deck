/**
 * Types for @deck/adapter-claude.
 *
 * Mirrors packages/adapter-codex/src/types.ts. Only the fixture shape is needed in Phase 1;
 * mutation/preimage types are added in Phase 3 (Developer Team materialization) alongside the
 * writers that produce them.
 */

/** A captured `claude --help` snapshot, used offline (no network) by compatibility.ts. */
export type ClaudeReleaseFixture = {
  version: string;
  capturedFrom: readonly string[];
  /** Raw excerpts of real `claude --help` output relevant to the flags Deck depends on. */
  help: string;
};
