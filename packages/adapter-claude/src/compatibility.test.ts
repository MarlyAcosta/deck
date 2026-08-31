import { describe, expect, test } from "bun:test";
import { inspectClaudeCompatibility, findClaudeFixture, CLAUDE_LAUNCH_POLICY_FLAG, CLAUDE_LAUNCH_POLICY_VALUE } from "./compatibility";
import { CAPTURED_CLAUDE_RELEASE_FIXTURES } from "./__fixtures__/claude/releases";

describe("inspectClaudeCompatibility", () => {
  const fixture = CAPTURED_CLAUDE_RELEASE_FIXTURES["2.1.251"];

  test("finds the captured fixture by exact version", () => {
    expect(findClaudeFixture("2.1.251")).toBe(fixture);
    expect(findClaudeFixture("0.0.0")).toBeUndefined();
  });

  test("detects every launch mode confirmed live in Phase 0", () => {
    const compat = inspectClaudeCompatibility(fixture);
    expect(compat.launch.interactive).toBe(true);
    expect(compat.launch.exec).toBe(true);
    expect(compat.launch.resumeById).toBe(true);
    expect(compat.launch.resumeLatest).toBe(true);
  });

  test("detects both structured output formats", () => {
    const compat = inspectClaudeCompatibility(fixture);
    expect(compat.outputFormats.json).toBe(true);
    expect(compat.outputFormats.streamJson).toBe(true);
  });

  test("detects the confirmed-working launch-policy mechanism (--permission-mode bypassPermissions)", () => {
    const compat = inspectClaudeCompatibility(fixture);
    expect(compat.launchPolicy.supported).toBe(true);
    // Sanity check the constants match what design.md records as the live-tested decision.
    expect(CLAUDE_LAUNCH_POLICY_FLAG).toBe("--permission-mode");
    expect(CLAUDE_LAUNCH_POLICY_VALUE).toBe("bypassPermissions");
  });

  test("detects append-system-prompt, inline MCP config, settings override, and --bare", () => {
    const compat = inspectClaudeCompatibility(fixture);
    expect(compat.appendSystemPrompt).toBe(true);
    expect(compat.mcp.inlineConfig).toBe(true);
    expect(compat.settings.override).toBe(true);
    expect(compat.bare).toBe(true);
  });

  test("reports nothing supported for a help text with none of the required flags", () => {
    const compat = inspectClaudeCompatibility({
      version: "0.0.0",
      capturedFrom: ["synthetic empty fixture for negative-path testing"],
      help: "Usage: claude [options]\n\nOptions:\n  --help  Display help",
    });
    expect(compat.launch.exec).toBe(false);
    expect(compat.launch.resumeById).toBe(false);
    expect(compat.launch.resumeLatest).toBe(false);
    expect(compat.outputFormats.json).toBe(false);
    expect(compat.launchPolicy.supported).toBe(false);
    expect(compat.mcp.inlineConfig).toBe(false);
    expect(compat.bare).toBe(false);
    expect(compat.effort.supported).toBe(false);
    expect(compat.effort.levels).toEqual([]);
  });

  test("parses --effort levels from the live help text (Phase 4 — confirmed against a real install; missed in the original Phase 0 excerpt)", () => {
    const compat = inspectClaudeCompatibility(fixture);
    expect(compat.effort.supported).toBe(true);
    expect(compat.effort.levels).toEqual(["low", "medium", "high", "xhigh", "max"]);
  });
});
