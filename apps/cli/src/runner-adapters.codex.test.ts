import { describe, expect, test } from "bun:test";

import { createDefaultAdapterRegistry } from "./runner-adapters";
import { existsSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("default AdapterRegistry", () => {
  test("is the authoritative composition path for Pi, OpenCode, Codex, and Claude", () => {
    const registry = createDefaultAdapterRegistry();
    expect(registry.list().map((adapter) => adapter.runnerId)).toEqual(["pi", "opencode", "codex", "claude"]);
    expect(registry.get("codex").buildLaunchPlan).toBeFunction();
    // Claude is Phase 1 (detection/composition only) as of add-claude-code-runner-support;
    // buildLaunchPlan lands in Phase 2 and is intentionally absent (optional on RunnerAdapter)
    // until then, per that change's runner-adapter.ts.
    expect(registry.get("claude").buildLaunchPlan).toBeUndefined();
  });

  test("construction and innocuous inspection do not create runner home/config paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "deck-registry-no-write-"));
    const openCodeConfig = join(root, "opencode-config");
    const piHome = join(root, "pi-home");
    const codexJournal = join(root, "codex-journal");
    try {
      const registry = createDefaultAdapterRegistry({
        pi: { homeDirectory: piHome },
        opencode: { developerTeamConfigDir: openCodeConfig, skillDiscoveryHomeDir: join(root, "skills-home") },
        codex: { journalRoot: codexJournal, preflight: { probe: async () => ({ found: false }) } },
        claude: { preflight: { probe: async () => ({ found: false }) } },
      });
      // getCapabilityIds() is not yet implemented for Claude (Phase 4 of
      // add-claude-code-runner-support) — it throws by design rather than fabricating data,
      // so it's excluded from this generic "innocuous inspection" sweep for that one adapter.
      for (const adapter of registry.list()) {
        if (adapter.runnerId === "claude") continue;
        adapter.getCapabilityIds();
      }
      await registry.get("codex").inspectProject?.(root);
      await registry.get("claude").inspectProject?.(root);
      expect(existsSync(openCodeConfig)).toBe(false);
      expect(existsSync(piHome)).toBe(false);
      expect(existsSync(codexJournal)).toBe(false);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
