import { describe, expect, test } from "bun:test";
import { createAdapterRegistry } from "@deck/core";
import { createClaudeRunnerAdapter, ClaudeRunnerAdapter } from "./runner-adapter";

describe("ClaudeRunnerAdapter identity and registration", () => {
  test("registers as 'claude' and resolves by the 'claude-development' environment", () => {
    const registry = createAdapterRegistry();
    registry.register("claude", createClaudeRunnerAdapter());
    expect(registry.get("claude").runnerId).toBe("claude");
    expect(registry.resolveByEnvironment("claude-development")?.runnerId).toBe("claude");
  });

  test("declares a non-empty environmentIds (registry rejects empty)", () => {
    const adapter = createClaudeRunnerAdapter();
    expect(adapter.environmentIds.length).toBeGreaterThan(0);
    expect(adapter.environmentIds).toContain("claude-development");
  });

  test("buildLaunchPlan exists as of Phase 2", () => {
    const adapter = createClaudeRunnerAdapter();
    expect(adapter.buildLaunchPlan).toBeFunction();
  });
});

const readyProbe = async () => ({
  found: true as const,
  version: "2.1.251",
  help: "Usage: claude [options] [command] [prompt]\n"
    + "  -p, --print\n"
    + "  --output-format <format> (choices: \"text\", \"json\", \"stream-json\")\n"
    + "  --permission-mode <mode> (choices: \"acceptEdits\", \"auto\", \"bypassPermissions\", \"manual\", \"dontAsk\", \"plan\")\n"
    + "  --append-system-prompt <prompt>\n"
    + "  -r, --resume\n"
    + "  -c, --continue\n"
    + "  --mcp-config\n"
    + "  --settings <file-or-json>\n"
    + "  --bare",
});

describe("ClaudeRunnerAdapter.buildLaunchPlan (Phase 2)", () => {
  test("blocks before planning when the binary is absent", async () => {
    const adapter = createClaudeRunnerAdapter({ preflight: { probe: async () => ({ found: false }) } });
    const result = await adapter.buildLaunchPlan!({ projectRoot: "/p", teamId: "developer-team", mode: "interactive", deckConfig: undefined as never });
    expect(result.status).toBe("blocked");
    if (result.status === "ready") throw new Error("expected a non-ready result");
    expect(result.code).toBe("claude-preflight-blocked");
  });

  test("plans a ready interactive launch with Deck's confirmed launch-policy token first in argv", async () => {
    const adapter = createClaudeRunnerAdapter({ preflight: { probe: readyProbe } });
    const result = await adapter.buildLaunchPlan!({ projectRoot: "/p", teamId: "developer-team", mode: "interactive", deckConfig: undefined as never });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.plan.command).toBe("claude");
    expect(result.plan.args.slice(0, 2)).toEqual(["--permission-mode", "bypassPermissions"]);
    expect(result.plan.stdio).toBe("inherit");
  });

  test("plans a ready exec launch with stdout-sourced output capture, not a file", async () => {
    const adapter = createClaudeRunnerAdapter({ preflight: { probe: readyProbe } });
    const result = await adapter.buildLaunchPlan!({
      projectRoot: "/p",
      teamId: "developer-team",
      mode: "exec",
      prompt: ["do work"],
      stdin: "closed",
      stdinPayload: { type: "utf8", content: "do work" },
      deckConfig: undefined as never,
    });
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.plan.args).toContain("-p");
    expect(result.plan.args).toEqual(expect.arrayContaining(["--output-format", "json"]));
    expect(result.plan.stdio).toBe("pipe");
    expect(result.plan.outputCapture?.finalAssistantMessage?.source).toBe("stdout");
  });

  test("blocks resume-by-id with an unsafe session id before it ever reaches argv", async () => {
    const adapter = createClaudeRunnerAdapter({ preflight: { probe: readyProbe } });
    const result = await adapter.buildLaunchPlan!({
      projectRoot: "/p",
      teamId: "developer-team",
      mode: "resume-by-id",
      sessionId: "--dangerously-skip-permissions",
      deckConfig: undefined as never,
    });
    expect(result.status).toBe("blocked");
    if (result.status === "ready") throw new Error("expected a non-ready result");
    expect(result.code).toBe("claude-invalid-session-id");
  });

  test("reports resume-latest as unsupported when the probed help text lacks --continue", async () => {
    const adapter = createClaudeRunnerAdapter({
      preflight: { probe: async () => ({ found: true, version: "2.1.251", help: "Usage: claude [options]\n  -p, --print" }) },
    });
    const result = await adapter.buildLaunchPlan!({ projectRoot: "/p", teamId: "developer-team", mode: "resume-latest", deckConfig: undefined as never });
    expect(result.status).toBe("unsupported");
  });
});

describe("ClaudeRunnerAdapter.detectRuntimes (Task 1.2 — real detection, not PATH-only)", () => {
  test("reports unavailable when the binary is absent", async () => {
    const adapter = createClaudeRunnerAdapter({ preflight: { probe: async () => ({ found: false }) } });
    const [status] = await adapter.detectRuntimes({ projectRoot: "/nonexistent", environmentId: "claude-development" });
    expect(status.isAvailable).toBe(false);
    expect(status.version).toBeUndefined();
  });

  test("reports available with version, derived live from the probed help text (not a fixture lookup)", async () => {
    const adapter = createClaudeRunnerAdapter({
      preflight: { probe: async () => ({ found: true, version: "2.1.251", help: "Usage: claude [options] [command] [prompt]\n  -p, --print\n  --permission-mode <mode> (choices: \"bypassPermissions\")\n  -r, --resume\n  -c, --continue" }) },
    });
    const [status] = await adapter.detectRuntimes({ projectRoot: "/nonexistent", environmentId: "claude-development" });
    expect(status.isAvailable).toBe(true);
    expect(status.version).toBe("2.1.251");
  });

  test("an unrecognized/unfamiliar version still reports ready (state), but narrows evidence to what its actual help text shows", async () => {
    // Regression test: an earlier draft looked up a static fixture by version number instead of
    // parsing the live probed help text, so an unrecognized version incorrectly fell back to a
    // "degraded" state with no evidence at all — even when the live text plainly supported
    // launch modes. Fixed to match Codex's precedent: always derive from what was actually
    // probed. A version tag existing nowhere in captured fixtures is irrelevant to this method.
    const adapter = createClaudeRunnerAdapter({
      preflight: { probe: async () => ({ found: true, version: "99.99.99", help: "Usage: claude [options]\n  -p, --print\n  -r, --resume\n  -c, --continue" }) },
    });
    const inspection = await adapter.inspectProject!("/nonexistent");
    expect(inspection.state).toBe("ready");
    expect(inspection.evidence.exec).toBe(true);
    expect(inspection.evidence.resumeById).toBe(true);
  });

  test("a help text missing a flag narrows evidence for that capability specifically, without failing everything", async () => {
    const adapter = createClaudeRunnerAdapter({
      preflight: { probe: async () => ({ found: true, version: "0.1.0", help: "Usage: claude [options]\n  -p, --print" }) },
    });
    const inspection = await adapter.inspectProject!("/nonexistent");
    expect(inspection.state).toBe("ready");
    expect(inspection.evidence.exec).toBe(true);
    expect(inspection.evidence.resumeById).toBe(false);
    expect(inspection.evidence.resumeLatest).toBe(false);
  });
});

describe("ClaudeRunnerAdapter models (real reuse of @deck/core's anthropic catalog)", () => {
  test("getModelCatalog exposes only the anthropic provider and its claude-* models", () => {
    const adapter = createClaudeRunnerAdapter();
    const catalog = adapter.getModelCatalog();
    expect(catalog.providers.map((p) => p.id)).toEqual(["anthropic"]);
    expect(catalog.models.length).toBeGreaterThan(0);
    for (const model of catalog.models) {
      expect(model.providerId).toBe("anthropic");
      expect(model.id.startsWith("anthropic/")).toBe(true);
    }
  });

  test("readModelAssignments/readThinkingAssignments honestly report empty until Phase 4 writes config", () => {
    const adapter = createClaudeRunnerAdapter();
    expect(adapter.readModelAssignments()).toEqual({});
    expect(adapter.readThinkingAssignments()).toEqual({});
  });
});

describe("ClaudeRunnerAdapter Phase 3/4 surfaces throw with a clear phase pointer instead of fabricating data", () => {
  test.each([
    ["buildReviewPlan", () => new ClaudeRunnerAdapter().buildReviewPlan(undefined as never, undefined as never)],
    ["buildInstallationPlan", () => new ClaudeRunnerAdapter().buildInstallationPlan(undefined as never)],
    ["buildDeveloperTeamInstallPlan", () => new ClaudeRunnerAdapter().buildDeveloperTeamInstallPlan(undefined as never)],
    ["getNextScreen", () => new ClaudeRunnerAdapter().getNextScreen(undefined as never)],
    ["backupDeveloperTeamFiles", () => new ClaudeRunnerAdapter().backupDeveloperTeamFiles(undefined)],
    ["verifyDeveloperTeamInstall", () => new ClaudeRunnerAdapter().verifyDeveloperTeamInstall(undefined)],
    ["getCapability", () => new ClaudeRunnerAdapter().getCapability("anything")],
    ["getCapabilityIds", () => new ClaudeRunnerAdapter().getCapabilityIds()],
    ["getSelectableTools", () => new ClaudeRunnerAdapter().getSelectableTools()],
  ])("%s throws referencing tasks.md", (name, call) => {
    expect(call).toThrow(/not implemented yet.*add-claude-code-runner-support\/tasks\.md/s);
  });

  test.each([
    ["getCapabilityInventory", () => new ClaudeRunnerAdapter().getCapabilityInventory(undefined as never)],
    ["runAction", () => new ClaudeRunnerAdapter().runAction(undefined as never, undefined as never)],
    ["applyDeveloperTeamInstall", () => new ClaudeRunnerAdapter().applyDeveloperTeamInstall(undefined as never)],
    ["inspectEnvironment", () => new ClaudeRunnerAdapter().inspectEnvironment()],
    ["reviewTools", () => new ClaudeRunnerAdapter().reviewTools()],
    ["rollbackDeveloperTeamFiles", () => new ClaudeRunnerAdapter().rollbackDeveloperTeamFiles(undefined)],
  ])("%s (async) rejects referencing tasks.md", async (name, call) => {
    await expect(call()).rejects.toThrow(/not implemented yet.*add-claude-code-runner-support\/tasks\.md/s);
  });
});
