import { describe, expect, test } from "bun:test";
import { existsSync, mkdtempSync, chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { checkSupermemoryObservabilitySink, createSupermemoryObservabilitySink } from "./supermemory-observability";

describe("Supermemory observability sink", () => {
  test("write failures degrade health and return diagnostics", () => {
    if (process.platform === "win32") return;
    const root = mkdtempSync(join(tmpdir(), "deck-sm-observe-"));
    try {
      const stateHome = join(root, "state");
      const sink = createSupermemoryObservabilitySink({ stateHome });
      expect(sink.healthy).toBe(true);
      writeFileSync(sink.path, "x".repeat(300 * 1024));
      chmodSync(join(stateHome, "deck"), 0o500);
      sink.observe({ provider: "supermemory", operation: "search", status: "succeeded", durationMs: 1, scopeFingerprint: "smfp_test", dependency: "unobservable-external-mcp" });
      expect(sink.healthy).toBe(false);
      const diagnostics = sink.health().diagnostics.join(" ");
      expect(diagnostics).toContain("Supermemory observability write failed");
      expect(diagnostics).not.toContain(root);
      expect(diagnostics).not.toContain("EACCES");
    } finally {
      chmodSync(join(root, "state", "deck"), 0o700);
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("create failures fail open without leaking paths, rejected values, or raw errors", () => {
    const root = mkdtempSync(join(tmpdir(), "deck-sm-observe-create-secret-sentinel-"));
    const stateHome = join(root, "state-file-secret-sentinel");
    try {
      writeFileSync(stateHome, "not a directory");

      const sink = createSupermemoryObservabilitySink({ stateHome });

      expect(sink.healthy).toBe(false);
      const diagnostics = sink.diagnostics.join(" ");
      expect(diagnostics).toContain("Supermemory observability sink is unavailable");
      for (const forbidden of [root, stateHome, "secret-sentinel", "ENOTDIR", "not a directory"]) {
        expect(diagnostics).not.toContain(forbidden);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("Doctor check failures do not echo filesystem paths or raw access errors", () => {
    const root = mkdtempSync(join(tmpdir(), "deck-sm-observe-check-secret-sentinel-"));
    const stateHome = join(root, "state");
    const blocker = join(stateHome, "deck");
    try {
      mkdirSync(stateHome, { recursive: true });
      writeFileSync(blocker, "not a directory");

      const checked = checkSupermemoryObservabilitySink({ stateHome });

      expect(checked.ok).toBe(false);
      const diagnostics = checked.diagnostics.join(" ");
      expect(diagnostics).toContain("Supermemory observability parent path exists but is not a directory");
      for (const forbidden of [root, blocker, "secret-sentinel", "EACCES", "ENOTDIR"]) {
        expect(diagnostics).not.toContain(forbidden);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("Doctor observability check is read-only and does not create sink paths", () => {
    const root = mkdtempSync(join(tmpdir(), "deck-sm-observe-check-"));
    const stateHome = join(root, "missing-state");
    try {
      const checked = checkSupermemoryObservabilitySink({ stateHome });
      expect(checked.ok).toBe(true);
      expect(checked.diagnostics.join(" ")).toContain("Doctor did not create it");
      expect(existsSync(join(stateHome, "deck"))).toBe(false);
      expect(existsSync(checked.path)).toBe(false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("records redacted channel metadata for runtime recall without fabricating external MCP metrics", async () => {
    const root = mkdtempSync(join(tmpdir(), "deck-sm-observe-channel-"));
    try {
      const sink = createSupermemoryObservabilitySink({ stateHome: join(root, "state"), now: () => "2026-08-15T00:00:00.000Z" });
      sink.observe({
        provider: "supermemory",
        operation: "runtime_recall",
        channel: "runtime-recall",
        status: "succeeded",
        durationMs: 12,
        runnerId: "opencode",
        role: "lead",
        scopeFingerprint: "smfp_0123456789abcdef",
        approximateInjectedTokens: 42,
        injectedByteCount: 256,
        resultCount: 2,
        dependency: "automatic",
        advisoryText: "raw advisory Prior context must not persist",
        memory: "raw memory credential must not persist",
      } as Parameters<typeof sink.observe>[0] & { advisoryText: string; memory: string });
      sink.observe({
        provider: "supermemory",
        operation: "search",
        status: "succeeded",
        durationMs: 7,
        runnerId: "opencode",
        role: "lead",
        scopeFingerprint: "smfp_0123456789abcdef",
        approximateInputTokens: 6,
        inputByteCount: 31,
        inputSha256: "a".repeat(64),
        approximateInjectedTokens: 9,
        injectedByteCount: 44,
        resultCount: 1,
        dependency: "automatic",
        query: "raw query credential must not persist",
      } as Parameters<typeof sink.observe>[0] & { query: string });
      const content = await Bun.file(sink.path).text();
      expect(content).toContain('"channel":"runtime-recall"');
      expect(content).toContain('"operation":"runtime_recall"');
      expect(content).toContain('"inputByteCount":31');
      expect(content).toContain(`"inputSha256":"${"a".repeat(64)}"`);
      expect(content).toContain('"injectedByteCount":256');
      expect(content).toContain('"injectedByteCount":44');
      expect(content).not.toContain('"channel":"external-unobservable-mcp"');
      expect(content).not.toContain("sm_project_v1_kevin15011_deck");
      expect(content).not.toContain("Prior context");
      expect(content).not.toContain("query");
      expect(content).not.toContain("credential");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("serializes only allowed receipt fields and drops prohibited extras", async () => {
    const root = mkdtempSync(join(tmpdir(), "deck-sm-observe-receipts-"));
    try {
      const sink = createSupermemoryObservabilitySink({ stateHome: join(root, "state"), now: () => "2026-08-15T00:00:00.000Z" });
      sink.observe({
        provider: "supermemory",
        operation: "runtime_injection",
        channel: "system-transform",
        status: "succeeded",
        durationMs: 3,
        runnerId: "opencode",
        role: "lead",
        scopeFingerprint: "smfp_0123456789abcdef",
        sessionFingerprint: "1".repeat(64),
        logicalTurnFingerprint: "2".repeat(64),
        snapshotGeneration: 4,
        injectedByteCount: 128,
        injectedSha256: "3".repeat(64),
        hostExecutableSha256: "4".repeat(64),
        hostExecutableByteCount: 4096,
        hostExecutableSource: "proc-self-exe",
        hostExecutableKind: "deck-canary",
        nativeSessionId: "native-session-sentinel",
        logicalTurnId: "native-turn-sentinel",
        correlationId: "raw-provider-correlation-sentinel",
        scope: "sm_project_v1_private_repo",
        content: "raw content sentinel",
        query: "raw query sentinel",
        advisoryText: "raw advisory sentinel",
        memory: "raw memory sentinel",
        path: "/private/path/sentinel",
        authorization: "Bearer token-sentinel",
      } as Parameters<typeof sink.observe>[0] & Record<string, unknown>);

      const [line] = (await Bun.file(sink.path).text()).trim().split("\n");
      const event = JSON.parse(line!) as Record<string, unknown>;
      expect(event).toMatchObject({
        schema: "deck.supermemory.runtime.metric.v1",
        operation: "runtime_injection",
        channel: "system-transform",
        sessionFingerprint: "1".repeat(64),
        logicalTurnFingerprint: "2".repeat(64),
        snapshotGeneration: 4,
        injectedByteCount: 128,
        injectedSha256: "3".repeat(64),
        hostExecutableSha256: "4".repeat(64),
        hostExecutableByteCount: 4096,
        hostExecutableSource: "proc-self-exe",
        hostExecutableKind: "deck-canary",
      });
      for (const key of ["nativeSessionId", "logicalTurnId", "correlationId", "scope", "content", "query", "advisoryText", "memory", "path", "authorization"]) {
        expect(event).not.toHaveProperty(key);
      }
      const content = JSON.stringify(event);
      for (const sentinel of ["native-session-sentinel", "native-turn-sentinel", "raw-provider-correlation-sentinel", "sm_project_v1_private_repo", "raw content sentinel", "raw query sentinel", "raw advisory sentinel", "raw memory sentinel", "/private/path/sentinel", "token-sentinel"]) {
        expect(content).not.toContain(sentinel);
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
