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

  test("buildLaunchPlan is intentionally absent until Phase 2 (optional on RunnerAdapter)", () => {
    const adapter = createClaudeRunnerAdapter();
    expect(adapter.buildLaunchPlan).toBeUndefined();
  });
});

describe("ClaudeRunnerAdapter.detectRuntimes (Task 1.2 — real detection, not PATH-only)", () => {
  test("reports unavailable when the binary is absent", async () => {
    const adapter = createClaudeRunnerAdapter({ preflight: { probe: async () => ({ found: false }) } });
    const [status] = await adapter.detectRuntimes({ projectRoot: "/nonexistent", environmentId: "claude-development" });
    expect(status.isAvailable).toBe(false);
    expect(status.version).toBeUndefined();
  });

  test("reports available with version when the binary is present and the version is a recognized fixture", async () => {
    const adapter = createClaudeRunnerAdapter({
      preflight: { probe: async () => ({ found: true, version: "2.1.251", help: "Usage: claude [options] [command] [prompt]\n  -p, --print\n  --permission-mode <mode> (choices: \"bypassPermissions\")\n  -r, --resume\n  -c, --continue" }) },
    });
    const [status] = await adapter.detectRuntimes({ projectRoot: "/nonexistent", environmentId: "claude-development" });
    expect(status.isAvailable).toBe(true);
    expect(status.version).toBe("2.1.251");
  });

  test("reports available but degraded (with a diagnostic) for an unrecognized version", async () => {
    const adapter = createClaudeRunnerAdapter({
      preflight: { probe: async () => ({ found: true, version: "99.99.99", help: "Usage: claude [options]" }) },
    });
    const inspection = await adapter.inspectProject!("/nonexistent");
    expect(inspection.state).toBe("degraded");
    expect(inspection.diagnostics[0]?.code).toBe("claude-version-unrecognized");
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
