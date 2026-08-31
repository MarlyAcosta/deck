import { describe, expect, test } from "bun:test";
import { buildAgentFileContent, buildSkillFileContent, isClaudeOwnedContent, CLAUDE_OWNED_MARKER } from "./agent-files";
import { parseSkillDescriptor } from "@deck/core";

const agent = {
  agentId: "deck-lead",
  displayName: "Lead",
  instruction: "You own the user outcome.",
};

const skill = {
  agentId: "deck-lead",
  skillId: "deck-lead",
  body: "This is the deck-lead skill body.",
};

describe("buildAgentFileContent", () => {
  test("starts with valid YAML frontmatter (Claude Code requires --- as the literal first line)", () => {
    const content = buildAgentFileContent(agent, undefined);
    expect(content.startsWith("---\n")).toBe(true);
  });

  test("frontmatter names the agent and carries the owned marker in the body, not before it", () => {
    const content = buildAgentFileContent(agent, undefined);
    expect(content).toContain('name: "deck-lead"');
    const firstClose = content.indexOf("\n---\n", 4);
    expect(content.indexOf(CLAUDE_OWNED_MARKER)).toBeGreaterThan(firstClose);
  });

  test("includes the composed instruction text", () => {
    const content = buildAgentFileContent(agent, undefined);
    expect(content).toContain("You own the user outcome.");
  });

  test("includes a model line only when a model is assigned", () => {
    expect(buildAgentFileContent(agent, undefined)).not.toContain("model:");
    expect(buildAgentFileContent({ ...agent, model: "opus" }, undefined)).toContain('model: "opus"');
  });

  test("is recognized as Deck-owned by isClaudeOwnedContent", () => {
    expect(isClaudeOwnedContent(buildAgentFileContent(agent, undefined))).toBe(true);
    expect(isClaudeOwnedContent("some random file a human wrote")).toBe(false);
  });
});

describe("buildSkillFileContent", () => {
  test("produces a descriptor that satisfies the shared skill-discovery contract", () => {
    const content = buildSkillFileContent(skill, undefined);
    expect(content.startsWith("---\n")).toBe(true);
    expect(parseSkillDescriptor(content, skill.skillId).ok).toBe(true);
  });

  test("carries the owned marker and skill body", () => {
    const content = buildSkillFileContent(skill, undefined);
    expect(isClaudeOwnedContent(content)).toBe(true);
    expect(content).toContain("This is the deck-lead skill body.");
  });
});
