import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

function sha256Buffer(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

async function loadReceiptModule() {
  return await import("./runtime-executable-receipt") as Readonly<{
    resolveRuntimeExecutableReceipt(input: Record<string, unknown>): { ok: boolean; receipt?: Record<string, unknown>; diagnostics?: readonly string[] };
    createCachedRuntimeExecutableReceiptResolver?: (resolver: () => { ok: boolean; receipt?: Record<string, unknown>; diagnostics?: readonly string[] }) => () => { ok: boolean; receipt?: Record<string, unknown>; diagnostics?: readonly string[] };
  }>;
}

describe("runtime executable receipt", () => {
  test("hashes Linux process-image bytes through /proc/self/exe and classifies digest-backed canary payloads", async () => {
    const bytes = Buffer.from("deck canary payload bytes\n", "utf8");
    const digest = sha256Buffer(bytes);
    const api = await loadReceiptModule();
    let readPath = "";

    const result = api.resolveRuntimeExecutableReceipt({
      platform: "linux",
      execPath: "/tmp/not-authoritative",
      readFileSync: (path: string) => { readPath = path; return bytes; },
      realpathSync: () => `/private/build/.deck-canary.payload-${digest}`,
    });

    expect(readPath).toBe("/proc/self/exe");
    expect(result).toEqual({
      ok: true,
      receipt: {
        hostExecutableSha256: digest,
        hostExecutableByteCount: bytes.byteLength,
        hostExecutableSource: "proc-self-exe",
        hostExecutableKind: "deck-canary",
      },
    });
    expect(JSON.stringify(result)).not.toContain("/private/build");
    expect(JSON.stringify(result)).not.toContain("not-authoritative");
  });

  test("does not trust a canary-shaped filename when bytes do not match the suffix", async () => {
    const bytes = Buffer.from("different payload bytes\n", "utf8");
    const digest = sha256Buffer(bytes);
    const api = await loadReceiptModule();

    const result = api.resolveRuntimeExecutableReceipt({
      platform: "linux",
      readFileSync: () => bytes,
      realpathSync: () => `/tmp/.deck-canary.payload-${"0".repeat(64)}`,
    });

    expect(result.ok).toBe(true);
    expect(result.receipt).toMatchObject({
      hostExecutableSha256: digest,
      hostExecutableKind: "other",
      hostExecutableSource: "proc-self-exe",
    });
  });

  test("uses process.execPath on non-Linux with an explicit lower-trust source label", async () => {
    const bytes = Buffer.from("non linux executable bytes", "utf8");
    const api = await loadReceiptModule();
    let readPath = "";

    const result = api.resolveRuntimeExecutableReceipt({
      platform: "darwin",
      execPath: "/Applications/Deck/deck",
      readFileSync: (path: string) => { readPath = path; return bytes; },
      realpathSync: () => "/Applications/Deck/deck-real",
    });

    expect(readPath).toBe("/Applications/Deck/deck-real");
    expect(result).toEqual({
      ok: true,
      receipt: {
        hostExecutableSha256: sha256Buffer(bytes),
        hostExecutableByteCount: bytes.byteLength,
        hostExecutableSource: "process-exec-path",
        hostExecutableKind: "other",
      },
    });
  });

  test("fails open without fabricating fields or leaking unreadable executable paths", async () => {
    const api = await loadReceiptModule();

    const result = api.resolveRuntimeExecutableReceipt({
      platform: "linux",
      readFileSync: () => { throw new Error("EACCES /private/path/.deck-canary.payload-secret"); },
      realpathSync: () => "/private/path/.deck-canary.payload-secret",
    });

    expect(result.ok).toBe(false);
    expect(result.receipt).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("/private/path");
    expect(JSON.stringify(result)).not.toContain("payload-secret");
  });

  test("cached resolver evaluates the process executable receipt once per cache boundary", async () => {
    const api = await loadReceiptModule();
    expect(typeof api.createCachedRuntimeExecutableReceiptResolver).toBe("function");
    let calls = 0;
    const cached = api.createCachedRuntimeExecutableReceiptResolver!(() => {
      calls += 1;
      return { ok: true, receipt: { hostExecutableSha256: String(calls).repeat(64).slice(0, 64), hostExecutableByteCount: calls, hostExecutableSource: "proc-self-exe", hostExecutableKind: "other" } };
    });

    const first = cached();
    const second = cached();

    expect(calls).toBe(1);
    expect(second).toBe(first);
    expect(second.receipt?.hostExecutableByteCount).toBe(1);
  });
});
