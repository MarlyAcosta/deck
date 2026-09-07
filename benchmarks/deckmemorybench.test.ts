import { describe, expect, test } from "bun:test";

import { exerciseFakeSupermemoryTransportCustomIdConflict, runDeckMemoryBench } from "./deckmemorybench";

describe("DeckMemoryBench", () => {
  test("stores fake runtime captures by customId when metadata correlationId conflicts", async () => {
    const identity = await exerciseFakeSupermemoryTransportCustomIdConflict();

    expect(identity).toEqual({
      capturedIds: ["stable-custom-id"],
      documentQueryResultIds: ["stable-custom-id"],
      conflictingCorrelationQueryResultIds: [],
    });
    expect(identity.capturedIds).not.toContain("conflicting-correlation-id");
    expect(identity.documentQueryResultIds).not.toContain("conflicting-correlation-id");
  });

  test("scores deterministic memory-quality fixtures without token-count claims", async () => {
    const results = await runDeckMemoryBench();
    expect(results).toHaveLength(13);
    expect(results.every((result) => result.passed)).toBe(true);
    expect(results.map((result) => result.name)).toEqual(expect.arrayContaining([
      "temporal-supersession",
      "stale-contradictory-dominance",
      "recurring-problems",
      "changed-decisions",
      "preferences",
      "conventions",
      "root-causes",
      "rediscovery",
      "role-budgets",
      "project-leakage",
      "secret-exclusion",
      "latency-context-size",
      "mcp-primary-vs-runtime",
    ]));
    expect(Math.max(...results.map((result) => result.byteSize))).toBeLessThanOrEqual(6000);
  });

  test("uses the stable provider identity for explicit runtime memory", async () => {
    const results = await runDeckMemoryBench();
    const scenario = results.find((result) => result.name === "mcp-primary-vs-runtime");

    expect(scenario).toBeDefined();
    expect(scenario?.passed).toBe(true);
    expect(scenario?.runtimeIds).toEqual([expect.stringMatching(/^deck_conversation_[a-f0-9]{16}$/)]);
    expect(scenario?.runtimeIds).not.toContain("bench-explicit-remember");
    expect(scenario?.baselineIds).not.toContain(scenario?.runtimeIds?.[0]);
  });
});
