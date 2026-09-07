import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

import * as core from "@deck/core/memory/adaptive-memory-observability-receipts";

type ReceiptApi = Readonly<{
  createAdaptiveMemoryContentReceipt(value: string): { byteCount: number; sha256: string };
  deriveAdaptiveMemorySessionFingerprint(input: { scopeFingerprint: string; nativeSessionId: string }): string;
  deriveAdaptiveMemoryLogicalTurnFingerprint(input: { scopeFingerprint: string; nativeSessionId: string; logicalTurnId: string }): string;
}>;

const api = core as typeof core & Partial<ReceiptApi>;

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

describe("adaptive memory observability receipts", () => {
  test("computes exact UTF-8 byte count and SHA-256 without retaining raw content", () => {
    const value = "Receipt bytes cover Café 🚀 exactly.\nSecond line.";

    const receipt = api.createAdaptiveMemoryContentReceipt!(value);

    expect(receipt).toEqual({
      byteCount: Buffer.byteLength(value, "utf8"),
      sha256: sha256Hex(value),
    });
    expect(receipt.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(receipt)).not.toContain("Café");
    expect(JSON.stringify(receipt)).not.toContain("Second line");
  });

  test("derives full project-separated and domain-separated session and logical-turn fingerprints", () => {
    const nativeSessionId = "native-session-123";
    const logicalTurnId = "native-message-456";
    const scopeA = "smfp_aaaaaaaaaaaaaaaa";
    const scopeB = "smfp_bbbbbbbbbbbbbbbb";

    const sessionA = api.deriveAdaptiveMemorySessionFingerprint!({ scopeFingerprint: scopeA, nativeSessionId });
    const sessionB = api.deriveAdaptiveMemorySessionFingerprint!({ scopeFingerprint: scopeB, nativeSessionId });
    const turnA = api.deriveAdaptiveMemoryLogicalTurnFingerprint!({ scopeFingerprint: scopeA, nativeSessionId, logicalTurnId });
    const turnB = api.deriveAdaptiveMemoryLogicalTurnFingerprint!({ scopeFingerprint: scopeB, nativeSessionId, logicalTurnId });

    expect(sessionA).toBe(sha256Hex(`deck.adaptive-memory.session.v1\0${scopeA}\0${nativeSessionId}`));
    expect(turnA).toBe(sha256Hex(`deck.adaptive-memory.logical-turn.v1\0${scopeA}\0${nativeSessionId}\0${logicalTurnId}`));
    for (const value of [sessionA, sessionB, turnA, turnB]) expect(value).toMatch(/^[a-f0-9]{64}$/);
    expect(sessionA).not.toBe(sessionB);
    expect(turnA).not.toBe(turnB);
    expect(sessionA).not.toBe(turnA);
    expect(JSON.stringify({ sessionA, turnA })).not.toContain(nativeSessionId);
    expect(JSON.stringify({ sessionA, turnA })).not.toContain(logicalTurnId);
  });
});
