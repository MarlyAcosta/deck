import { describe, expect, test } from "bun:test";
import { buildAgentFileContent, buildSkillFileContent, isClaudeOwnedContent, parseAgentFrontmatterAssignments, CLAUDE_OWNED_MARKER } from "./agent-files";
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

  test("includes a model line, mapped to Claude's native alias, only when a recognized canonical model is assigned", () => {
    expect(buildAgentFileContent(agent, undefined)).not.toContain("model:");
    expect(buildAgentFileContent({ ...agent, model: "anthropic/claude-opus-4" }, undefined)).toContain('model: "opus"');
  });

  test("omits the model line for an unrecognized/unmapped model rather than writing a value Claude Code would reject", () => {
    // Regression test for the real bug caught in Phase 4: writing agent.model verbatim (e.g. a
    // bare "opus" or the fully-qualified "anthropic/claude-opus-4") produced frontmatter Claude
    // Code's own model resolution rejects for anything that isn't its own alias — confirmed live
    // (404 api_error_status) before this mapping existed.
    expect(buildAgentFileContent({ ...agent, model: "opus" }, undefined)).not.toContain("model:");
    expect(buildAgentFileContent({ ...agent, model: "anthropic/claude-sonnet-99" }, undefined)).not.toContain("model:");
  });

  test("includes a # deck-effort line only when a reasoning level is assigned", () => {
    expect(buildAgentFileContent(agent, undefined)).not.toContain("deck-effort");
    expect(buildAgentFileContent({ ...agent, reasoning: "high" }, undefined)).toContain('# deck-effort: "high"');
  });

  test("is recognized as Deck-owned by isClaudeOwnedContent", () => {
    expect(isClaudeOwnedContent(buildAgentFileContent(agent, undefined))).toBe(true);
    expect(isClaudeOwnedContent("some random file a human wrote")).toBe(false);
  });
});

describe("parseAgentFrontmatterAssignments — the exact inverse of buildAgentFileContent's model/effort lines", () => {
  test("round-trips both model and effort", () => {
    const content = buildAgentFileContent({ ...agent, model: "anthropic/claude-opus-4", reasoning: "xhigh" }, undefined);
    expect(parseAgentFrontmatterAssignments(content)).toEqual({ model: "opus", effort: "xhigh" });
  });

  test("returns an empty object when neither is present", () => {
    expect(parseAgentFrontmatterAssignments(buildAgentFileContent(agent, undefined))).toEqual({});
  });

  test("is unaffected by unrelated frontmatter/body content", () => {
    const content = buildAgentFileContent({ ...agent, model: "anthropic/claude-haiku-4" }, undefined);
    expect(parseAgentFrontmatterAssignments(content).model).toBe("haiku");
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
