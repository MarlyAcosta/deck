import { describe, expect, test } from "bun:test";
import { translateClaudeCapabilityInstructions, validateClaudeInstructionTranslation } from "./instruction-translation";

describe("translateClaudeCapabilityInstructions", () => {
  test("is an identity pass-through", () => {
    const markdown = "# Some heading\n\nUse Read/Grep/Glob and WebFetch as needed.\n";
    expect(translateClaudeCapabilityInstructions(markdown)).toBe(markdown);
  });
});

describe("validateClaudeInstructionTranslation", () => {
  test("passes clean, Claude-native content", () => {
    expect(validateClaudeInstructionTranslation("Use Read/Grep/Glob and WebFetch as needed.")).toEqual([]);
  });

  test("rejects a deliberately injected foreign-runner term", () => {
    const violations = validateClaudeInstructionTranslation("line one\nUse the OpenCode-specific mermaid renderer here.\nline three");
    expect(violations.length).toBe(1);
    expect(violations[0]!.line).toBe(2);
    expect(violations[0]!.match).toBe("OpenCode");
  });

  test("rejects Codex-specific package/flag references", () => {
    expect(validateClaudeInstructionTranslation("see adapter-codex for details").length).toBeGreaterThan(0);
    expect(validateClaudeInstructionTranslation("run with --opencode flag").length).toBeGreaterThan(0);
  });

  test("reports every violating line, not just the first", () => {
    const violations = validateClaudeInstructionTranslation("Codex here\nfine line\nOpenCode there");
    expect(violations.map((v) => v.line)).toEqual([1, 3]);
  });
});
