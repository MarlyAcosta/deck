import type { CapabilityInstructionBundle } from "@deck/core";
import { composeCapabilityInstructions } from "@deck/core";

/**
 * Marker-span merge for CLAUDE.md, mirroring Codex's AGENTS.md handling
 * (packages/adapter-codex/src/developer-team-install.ts `mergeAgents`/`instructionBlock`)
 * exactly — same marker text (HTML comments are valid, invisible Markdown in both files), same
 * single-owned-span invariant. REQ-CLD-MAT-002.
 */
export const CLAUDE_MD_START = "<!-- deck:developer-team:start -->";
export const CLAUDE_MD_END = "<!-- deck:developer-team:end -->";

function instructionBlock(bundle: CapabilityInstructionBundle | undefined): string {
  const base = [
    CLAUDE_MD_START,
    "## Deck Developer Team (static-compatible)",
    "Deck-managed roles live in `.claude/agents/` and are invoked by Claude Code as subagents.",
    "Protected invocation authorization, controlled effects, centralized registry writes, and",
    "bound verification are not host-enforced on this launch route.",
  ].join("\n");
  return [
    composeCapabilityInstructions(base, bundle, { surface: "session", teamId: "developer-team" }).trimEnd(),
    CLAUDE_MD_END,
  ].join("\n");
}

export type ClaudeMdMergeResult = { content?: string; collision?: string };

/**
 * Merge Deck's owned marker span into existing CLAUDE.md content. All bytes outside the marker
 * span are preserved exactly. A malformed/duplicated marker pair blocks instead of guessing.
 */
export function mergeClaudeMd(source: string, bundle: CapabilityInstructionBundle | undefined): ClaudeMdMergeResult {
  const starts = source.split(CLAUDE_MD_START).length - 1;
  const ends = source.split(CLAUDE_MD_END).length - 1;
  if (starts !== ends || starts > 1) {
    return { collision: "CLAUDE.md contains duplicate or malformed Deck markers." };
  }
  const block = instructionBlock(bundle);
  if (starts === 0) {
    const separator = source.length === 0 || source.endsWith("\n") ? "" : "\n";
    return { content: `${source}${separator}${block}\n` };
  }
  const start = source.indexOf(CLAUDE_MD_START);
  const end = source.indexOf(CLAUDE_MD_END, start) + CLAUDE_MD_END.length;
  return { content: source.slice(0, start) + block + source.slice(end) };
}
