import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildDeveloperTeamManifest, DEVELOPER_TEAM } from "@deck/core";
import type {
  DeveloperTeamAdapterInstallInput,
  DeveloperTeamModelAssignments,
  DeveloperTeamThinkingAssignments,
} from "@deck/core";
import type { DeveloperTeamInstallFile, RunnerDeveloperTeamInstallPlan } from "@deck/core/runner-capability";

import { buildAgentFileContent, buildSkillFileContent, isClaudeOwnedContent } from "./agent-files";
import { mergeClaudeMd } from "./claude-md";
import { validateClaudeInstructionTranslation } from "./instruction-translation";

function readExistingFile(projectRoot: string, relativePath: string): string | undefined {
  const absolute = join(projectRoot, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf-8") : undefined;
}

function toModelAssignmentOverrides(
  modelAssignments: DeveloperTeamModelAssignments | undefined,
  thinkingAssignments: DeveloperTeamThinkingAssignments | undefined,
): readonly { agentId: string; modelId: string; reasoning?: string }[] {
  if (!modelAssignments) return [];
  return Object.entries(modelAssignments).map(([agentId, modelId]) => ({
    agentId,
    modelId,
    ...(thinkingAssignments?.[agentId] ? { reasoning: thinkingAssignments[agentId] } : {}),
  }));
}

/**
 * Build the Developer Team install plan: 7 role files (`.claude/agents/*.md`), 7 matching
 * agent-bound skill files (`.claude/skills/<skillId>/SKILL.md`), and a `CLAUDE.md` marker-span update.
 *
 * Deliberately narrower than Codex's/OpenCode's equivalent for this phase: the 29 bundled
 * external standalone skills and the `deck-onboard`/`deck-archive` bootstrap skills are not yet
 * materialized (proposal.md scoped the initial release to role + agent-bound-skill
 * materialization; standalone/bootstrap skill support is explicit deferred follow-up work, not
 * a silent omission — `input.standaloneSkills`, when supplied, is intentionally unused here).
 */
export function buildClaudeDeveloperTeamInstallPlan(input: DeveloperTeamAdapterInstallInput): RunnerDeveloperTeamInstallPlan {
  const diagnostics: string[] = [];
  let blocked = false;
  const files: DeveloperTeamInstallFile[] = [];

  const built = buildDeveloperTeamManifest({
    team: DEVELOPER_TEAM,
    modelAssignments: toModelAssignmentOverrides(input.modelAssignments, input.thinkingAssignments),
    capabilityInstructions: input.capabilityInstructions,
  });
  diagnostics.push(...built.warnings, ...built.errors);
  if (built.errors.length > 0) blocked = true;

  const bundle = input.capabilityInstructions;

  const addOwnedFile = (path: string, content: string, kind: DeveloperTeamInstallFile["kind"], skillId?: string): void => {
    const violations = validateClaudeInstructionTranslation(content);
    if (violations.length > 0) {
      blocked = true;
      const first = violations[0]!;
      diagnostics.push(`${path}: foreign-runner vocabulary leaked in at line ${first.line} ("${first.match}").`);
      return;
    }
    const existing = readExistingFile(input.projectRoot, path);
    if (existing !== undefined && !isClaudeOwnedContent(existing)) {
      blocked = true;
      diagnostics.push(`${path} already exists and is not Deck-owned; refusing to overwrite it.`);
      return;
    }
    files.push({ path, content, kind, ...(skillId ? { skillId } : {}) });
  };

  for (const agent of built.manifest.agents) {
    addOwnedFile(`.claude/agents/${agent.agentId}.md`, buildAgentFileContent(agent, bundle), "agent");
  }
  for (const skill of built.manifest.skills) {
    addOwnedFile(`.claude/skills/${skill.skillId}/SKILL.md`, buildSkillFileContent(skill, bundle), "skill", skill.skillId);
  }

  const claudeMdSource = readExistingFile(input.projectRoot, "CLAUDE.md") ?? "";
  const merge = mergeClaudeMd(claudeMdSource, bundle);
  if (merge.collision) {
    blocked = true;
    diagnostics.push(merge.collision);
  } else if (merge.content !== undefined) {
    files.push({ path: "CLAUDE.md", content: merge.content, kind: "other" });
  }

  return { files, diagnostics, blocked };
}
