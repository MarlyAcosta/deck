import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

import { redactSupermemoryConversationContent } from "./conversation";
import { createSupermemoryRuntime, type SupermemoryAddPayload, type SupermemoryRuntimeMetric, type SupermemoryRuntimeTransport } from "./runtime";

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function receipt(value: string): { inputByteCount: number; inputSha256: string } {
  return { inputByteCount: Buffer.byteLength(value, "utf8"), inputSha256: sha256Hex(value) };
}

function canonicalReceiptCandidate(value: string): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/[\t ]+$/gm, "").trim();
  return redactSupermemoryConversationContent(normalized).content;
}

function fakeTransport(adds: SupermemoryAddPayload[] = [], options: { failAdd?: boolean } = {}): SupermemoryRuntimeTransport {
  return {
    async add(payload) {
      if (options.failAdd) throw new Error("provider failed with token=secret");
      adds.push(payload);
    },
    async search() { return { results: [] }; },
    async profile() { return { profile: {} }; },
    async health() {},
  };
}

describe("Supermemory runtime observability receipts", () => {
  test("attempted and succeeded capture metrics hash the exact normalized and redacted provider payload", async () => {
    const adds: SupermemoryAddPayload[] = [];
    const observed: unknown[] = [];
    const correlation = Object.freeze({
      sessionFingerprint: "a".repeat(64),
      logicalTurnFingerprint: "b".repeat(64),
      snapshotGeneration: 7,
    });
    const runtime = createSupermemoryRuntime({
      canonicalScope: "sm_project_v1_kevin15011_deck",
      sessionId: "deck-session",
      transport: fakeTransport(adds),
      observe: (metric) => observed.push(metric),
    });
    const raw = "  Implemented receipt tracking for Café users.  \r\nVerified focused tests for capture receipts.   ";
    const finalContent = "Implemented receipt tracking for Café users.\nVerified focused tests for capture receipts.";

    const result = await runtime.capture(Object.freeze({
      role: "assistant",
      source: "trusted-final-assistant",
      content: raw,
      dependency: "automatic",
      correlation,
    }));

    expect(result.ok).toBe(true);
    expect(adds).toHaveLength(1);
    expect(adds[0]!.content).toBe(finalContent);
    const expectedReceipt = receipt(finalContent);
    expect(observed).toContainEqual(expect.objectContaining({
      operation: "capture",
      status: "attempted",
      captureSource: "trusted-final-assistant",
      ...expectedReceipt,
      ...correlation,
    }));
    expect(result.metrics).toMatchObject({
      operation: "capture",
      status: "succeeded",
      captureSource: "trusted-final-assistant",
      ...expectedReceipt,
      ...correlation,
    });
    expect(JSON.stringify([...observed, result.metrics])).not.toContain("Café users");
    expect(JSON.stringify([...observed, result.metrics])).not.toContain("deck-session");
    expect(JSON.stringify([...observed, result.metrics])).not.toContain("correlationId");
    expect(JSON.stringify([...observed, result.metrics])).not.toContain("sm_project_v1_kevin15011_deck");
  });

  test("capture provider payload omits native and provider correlation identifiers", async () => {
    const adds: SupermemoryAddPayload[] = [];
    const nativeCorrelation = "opencode-native-message-123";
    const runtime = createSupermemoryRuntime({
      canonicalScope: "sm_project_v1_kevin15011_deck",
      sessionId: "deck-session",
      transport: fakeTransport(adds),
    });

    const result = await runtime.capture(Object.freeze({
      role: "user",
      source: "trusted-user-prompt",
      content: "Decision: provider payloads must remain metadata-only without transport correlation identifiers.",
      dependency: "automatic",
      correlationId: nativeCorrelation,
      correlation: { sessionFingerprint: "a".repeat(64), logicalTurnFingerprint: "b".repeat(64), snapshotGeneration: 12 },
    }));

    expect(result.ok).toBe(true);
    expect(adds).toHaveLength(1);
    expect(adds[0]!.metadata).toMatchObject({
      role: "user",
      source: "trusted-user-prompt",
      dependency: "automatic",
    });
    expect(adds[0]!.metadata).not.toHaveProperty("correlationId");
    expect(JSON.stringify(adds[0])).not.toContain(nativeCorrelation);
  });

  test("skipped capture metrics use a redacted receipt-only candidate and never call the provider", async () => {
    const adds: SupermemoryAddPayload[] = [];
    const runtime = createSupermemoryRuntime({
      canonicalScope: "sm_project_v1_kevin15011_deck",
      sessionId: "deck-session",
      transport: fakeTransport(adds),
    });
    const rawSecret = "SUPERMEMORY_API_KEY=secret-value";
    const expectedReceipt = receipt(canonicalReceiptCandidate(rawSecret));

    const result = await runtime.capture(Object.freeze({
      role: "user",
      source: "trusted-user-prompt",
      content: rawSecret,
      dependency: "automatic",
      correlation: { sessionFingerprint: "c".repeat(64), logicalTurnFingerprint: "d".repeat(64), snapshotGeneration: 8 },
    }));

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected capture to be skipped");
    expect(result.reason).toBe("secret_detected");
    expect(adds).toHaveLength(0);
    expect(result.metrics).toMatchObject({
      operation: "capture",
      status: "skipped",
      captureSource: "trusted-user-prompt",
      ...expectedReceipt,
      sessionFingerprint: "c".repeat(64),
      logicalTurnFingerprint: "d".repeat(64),
      snapshotGeneration: 8,
    });
    expect(JSON.stringify(result)).not.toContain(rawSecret);
    expect(JSON.stringify(result)).not.toContain("secret-value");
  });

  test("failed capture metrics keep the same final input receipt as the attempted metric", async () => {
    const observed: SupermemoryRuntimeMetric[] = [];
    const runtime = createSupermemoryRuntime({
      canonicalScope: "sm_project_v1_kevin15011_deck",
      sessionId: "deck-session",
      transport: fakeTransport([], { failAdd: true }),
      observe: (metric) => observed.push(metric),
    });
    const content = "Implemented provider failure receipts for the supervised capture boundary.";

    const result = await runtime.capture(Object.freeze({
      role: "assistant",
      source: "trusted-final-assistant",
      content,
      dependency: "automatic",
      correlation: { sessionFingerprint: "e".repeat(64), logicalTurnFingerprint: "f".repeat(64), snapshotGeneration: 9 },
    }));

    expect(result.ok).toBe(false);
    const attempted = observed.find((metric) => metric.operation === "capture" && metric.status === "attempted")!;
    expect(attempted).toMatchObject({ captureSource: "trusted-final-assistant", ...receipt(content) });
    expect(result.metrics).toMatchObject({ operation: "capture", status: "failed", captureSource: "trusted-final-assistant", ...receipt(content) });
    expect(result.metrics.inputSha256).toBe(attempted.inputSha256);
    expect(JSON.stringify(result)).not.toContain("token=secret");
    expect(JSON.stringify(result)).not.toContain(content);
  });

  test("concurrent capture calls keep immutable per-call turn fingerprints", async () => {
    const observed: SupermemoryRuntimeMetric[] = [];
    const runtime = createSupermemoryRuntime({
      canonicalScope: "sm_project_v1_kevin15011_deck",
      sessionId: "deck-session",
      transport: fakeTransport([]),
      observe: (metric) => observed.push(metric),
    });
    const first = { sessionFingerprint: "1".repeat(64), logicalTurnFingerprint: "2".repeat(64), snapshotGeneration: 10 };
    const second = { sessionFingerprint: "3".repeat(64), logicalTurnFingerprint: "4".repeat(64), snapshotGeneration: 11 };

    await Promise.all([
      runtime.capture({ role: "assistant", source: "trusted-final-assistant", content: "Implemented first concurrent capture receipt boundary.", correlation: first }),
      runtime.capture({ role: "assistant", source: "trusted-final-assistant", content: "Implemented second concurrent capture receipt boundary.", correlation: second }),
    ]);

    expect(observed).toContainEqual(expect.objectContaining({ operation: "capture", status: "attempted", ...first }));
    expect(observed).toContainEqual(expect.objectContaining({ operation: "capture", status: "attempted", ...second }));
    expect(observed.filter((metric) => metric.operation === "capture" && metric.status === "attempted").map((metric) => metric.logicalTurnFingerprint).sort()).toEqual([first.logicalTurnFingerprint, second.logicalTurnFingerprint].sort());
  });
});
