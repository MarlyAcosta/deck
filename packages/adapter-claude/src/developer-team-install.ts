import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { buildDeveloperTeamManifest, DEVELOPER_TEAM } from "@deck/core";
import type {
  DeveloperTeamAdapterInstallInput,
  DeveloperTeamModelAssignments,
  DeveloperTeamThinkingAssignments,
} from "@deck/core";
import type { DeveloperTeamInstallFile, RunnerDeveloperTeamInstallPlan } from "@deck/core/runner-capability";

import { buildAgentFileContent, buildSkillFileContent, isClaudeOwnedContent, CLAUDE_OWNED_MARKER } from "./agent-files";
import { mergeClaudeMd, CLAUDE_MD_START, CLAUDE_MD_END } from "./claude-md";
import { validateClaudeInstructionTranslation } from "./instruction-translation";
import { isGlobalInstallRoot, resolveClaudeInstallRoot } from "./install-root";

type MutationPreviewEntry = { action: "create" | "update" | "delete"; path: string; preimage: string; postimage: string; ownership: string };

function hash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

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
 *
 * @param knownGlobalRoot Test-only injection point (production never passes it — defaults to the
 * real `resolveClaudeInstallRoot()`). Lets tests prove the `CLAUDE.md` global-vs-project path
 * selection (`isGlobalInstallRoot`) without either mocking `node:os` or writing real files into
 * the actual user's home directory during `bun test` runs.
 */
export function buildClaudeDeveloperTeamInstallPlan(
  input: DeveloperTeamAdapterInstallInput,
  knownGlobalRoot: string = resolveClaudeInstallRoot(),
): RunnerDeveloperTeamInstallPlan {
  const diagnostics: string[] = [];
  let blocked = false;
  const files: DeveloperTeamInstallFile[] = [];
  const mutationPreview: MutationPreviewEntry[] = [];

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
    // files[] always represents the complete desired state (apply's own idempotency check
    // — see transaction.ts's applyClaudeFiles — skips the actual write when content already
    // matches). mutationPreview only records entries where something will actually change, so
    // a byte-identical reapply previews as "(no file mutations)" rather than a false diff.
    files.push({ path, content, kind, ...(skillId ? { skillId } : {}) });
    if (existing !== content) {
      mutationPreview.push({
        action: existing === undefined ? "create" : "update",
        path,
        preimage: existing === undefined ? "absent" : hash(existing),
        postimage: hash(content),
        ownership: `deck-file:${CLAUDE_OWNED_MARKER}`,
      });
    }
  };

  for (const agent of built.manifest.agents) {
    addOwnedFile(`.claude/agents/${agent.agentId}.md`, buildAgentFileContent(agent, bundle), "agent");
  }
  for (const skill of built.manifest.skills) {
    addOwnedFile(`.claude/skills/${skill.skillId}/SKILL.md`, buildSkillFileContent(skill, bundle), "skill", skill.skillId);
  }

  // Real bug found live (add-claude-global-install-scope, Task 4/5 verification): Claude Code's
  // own CLAUDE.md convention is root-shaped, not root-agnostic like every other materialized
  // path here. A project root's memory file is `<root>/CLAUDE.md`; the user-level (global) memory
  // file is `<root>/.claude/CLAUDE.md`, NOT `<root>/CLAUDE.md` -- confirmed live by installing for
  // real against homedir() with the bare path and finding it created a stray, unread
  // `~/CLAUDE.md` instead of merging with the real, already-loaded `~/.claude/CLAUDE.md`.
  // `resolveClaudeInstallRoot()` is a pure, deterministic function (always returns the same
  // homedir() value), so comparing the supplied root against it detects "is this actually the
  // global root" without adding a scope parameter or otherwise breaking the root-agnostic
  // contract this module otherwise keeps for every other path (REQ-CGS-ROOT-003) — the caller
  // (CLI: always homedir(); TUI, until Task 5 lands: still an actual project root) is unchanged.
  const claudeMdRelativePath = isGlobalInstallRoot(input.projectRoot, knownGlobalRoot) ? ".claude/CLAUDE.md" : "CLAUDE.md";
  const claudeMdSource = readExistingFile(input.projectRoot, claudeMdRelativePath) ?? "";
  const merge = mergeClaudeMd(claudeMdSource, bundle);
  if (merge.collision) {
    blocked = true;
    diagnostics.push(merge.collision);
  } else if (merge.content !== undefined) {
    files.push({ path: claudeMdRelativePath, content: merge.content, kind: "other" });
    if (merge.content !== claudeMdSource) {
      mutationPreview.push({
        action: existsSync(join(input.projectRoot, claudeMdRelativePath)) ? "update" : "create",
        path: claudeMdRelativePath,
        preimage: claudeMdSource === "" ? "absent" : hash(claudeMdSource),
        postimage: hash(merge.content),
        ownership: `marker-span:${CLAUDE_MD_START}|${CLAUDE_MD_END}`,
      });
    }
  }

  return { files, diagnostics, blocked, mutationPreview };
}
