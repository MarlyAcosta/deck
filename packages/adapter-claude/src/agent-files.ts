import {
  composeCapabilityInstructions,
  parseSkillDescriptor,
  type CapabilityInstructionBundle,
} from "@deck/core";
import type { DeveloperTeamManifestAgent, DeveloperTeamManifestSkill } from "@deck/core/runner-capability";

/**
 * Deck's ownership marker, placed as the first line of the BODY (after YAML frontmatter), never
 * before it — Claude Code's subagent/skill frontmatter parser requires `---` to be the file's
 * literal first line, so nothing may precede it (unlike Codex's TOML role files, which can carry
 * a leading `# marker` comment safely).
 */
export const CLAUDE_OWNED_MARKER = "<!-- deck-claude-v1 -->";

function yamlString(value: string): string {
  return JSON.stringify(value);
}

/** True if content is a Deck-owned file this adapter may safely overwrite/reapply. */
export function isClaudeOwnedContent(content: string): boolean {
  return content.includes(CLAUDE_OWNED_MARKER);
}

/**
 * Build `.claude/agents/<agentId>.md` content: YAML frontmatter (name, description, optional
 * model) plus the composed instruction body. Mirrors Codex's `roleContent()`
 * (packages/adapter-codex/src/developer-team-install.ts) — same
 * `composeCapabilityInstructions` call, same idea, Claude-native frontmatter shape instead of
 * TOML.
 */
export function buildAgentFileContent(
  agent: DeveloperTeamManifestAgent,
  bundle: CapabilityInstructionBundle | undefined,
): string {
  const instruction = composeCapabilityInstructions(agent.instruction, bundle, {
    surface: "agent",
    teamId: "developer-team",
    agentId: agent.agentId,
  });
  const frontmatter = [
    "---",
    `name: ${yamlString(agent.agentId)}`,
    `description: ${yamlString(agent.displayName)}`,
    ...(agent.model ? [`model: ${yamlString(agent.model)}`] : []),
    "---",
  ].join("\n");
  return [frontmatter, "", CLAUDE_OWNED_MARKER, "", instruction.trimEnd(), ""].join("\n");
}

/**
 * Build `.claude/skills/<skillId>/SKILL.md` content for an agent-bound skill. Validated against
 * the same shared `parseSkillDescriptor` contract every other runner's skill files satisfy, so
 * Claude Code's own skill discovery (`/skill-name`) sees a well-formed descriptor.
 */
export function buildSkillFileContent(
  skill: DeveloperTeamManifestSkill,
  bundle: CapabilityInstructionBundle | undefined,
): string {
  const composed = composeCapabilityInstructions(skill.body, bundle, {
    surface: "skill",
    teamId: "developer-team",
    skillId: skill.skillId,
  });

  let frontmatter = ["---", `name: ${yamlString(skill.skillId)}`, `description: ${yamlString(`Deck Developer Team skill for ${skill.agentId}`)}`, "---"].join("\n");
  let body = composed;
  if (composed.startsWith("---\n")) {
    const closing = composed.indexOf("\n---\n", 4);
    if (closing >= 0) {
      const candidateFrontmatter = composed.slice(0, closing + 5).replace(/\n$/, "");
      const candidateBody = composed.slice(closing + 5);
      if (parseSkillDescriptor(composed, skill.skillId).ok) {
        frontmatter = candidateFrontmatter;
        body = candidateBody;
      }
    }
  }
  return [frontmatter, "", CLAUDE_OWNED_MARKER, "", body.trimStart()].join("\n");
}
