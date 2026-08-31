import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { writeClaudeMcpConfig } from "./mcp-config";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "deck-claude-mcp-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("writeClaudeMcpConfig", () => {
  test("creates .mcp.json when none exists, for a stdio server", async () => {
    await withTempDir(async (dir) => {
      const result = await writeClaudeMcpConfig({ serverName: "context7", projectRoot: dir, type: "local", command: ["npx", "-y", "context7-mcp"] });
      expect(result.ok).toBe(true);
      const written = JSON.parse(await readFile(join(dir, ".mcp.json"), "utf-8"));
      expect(written.mcpServers.context7).toEqual({ type: "stdio", command: "npx", args: ["-y", "context7-mcp"] });
    });
  });

  test("creates .mcp.json for a remote/http server", async () => {
    await withTempDir(async (dir) => {
      const result = await writeClaudeMcpConfig({ serverName: "remote-x", projectRoot: dir, type: "remote", url: "https://example.com/mcp", headers: { Authorization: "Bearer x" } });
      expect(result.ok).toBe(true);
      const written = JSON.parse(await readFile(join(dir, ".mcp.json"), "utf-8"));
      expect(written.mcpServers["remote-x"]).toEqual({ type: "http", url: "https://example.com/mcp", headers: { Authorization: "Bearer x" } });
    });
  });

  test("preserves an existing unrelated server entry untouched", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, ".mcp.json"), JSON.stringify({ mcpServers: { "user-owned": { type: "stdio", command: "some-other-tool" } } }), "utf-8");
      const result = await writeClaudeMcpConfig({ serverName: "context7", projectRoot: dir, type: "local", command: ["npx", "context7-mcp"] });
      expect(result.ok).toBe(true);
      const written = JSON.parse(await readFile(join(dir, ".mcp.json"), "utf-8"));
      expect(written.mcpServers["user-owned"]).toEqual({ type: "stdio", command: "some-other-tool" });
      expect(written.mcpServers.context7).toBeDefined();
    });
  });

  test("preserves unrelated top-level keys untouched", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, ".mcp.json"), JSON.stringify({ someOtherTopLevelKey: "value", mcpServers: {} }), "utf-8");
      await writeClaudeMcpConfig({ serverName: "context7", projectRoot: dir, type: "local", command: ["npx", "context7-mcp"] });
      const written = JSON.parse(await readFile(join(dir, ".mcp.json"), "utf-8"));
      expect(written.someOtherTopLevelKey).toBe("value");
    });
  });

  test("refuses to blindly overwrite invalid JSON", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, ".mcp.json"), "{ not valid json", "utf-8");
      const result = await writeClaudeMcpConfig({ serverName: "context7", projectRoot: dir, type: "local", command: ["npx", "context7-mcp"] });
      expect(result.ok).toBe(false);
      expect(await readFile(join(dir, ".mcp.json"), "utf-8")).toBe("{ not valid json");
    });
  });

  test("rejects a server name containing a path separator", async () => {
    await withTempDir(async (dir) => {
      const result = await writeClaudeMcpConfig({ serverName: "../escape", projectRoot: dir, type: "local", command: ["x"] });
      expect(result.ok).toBe(false);
    });
  });

  test("reports failure when neither command nor url is usable", async () => {
    await withTempDir(async (dir) => {
      const result = await writeClaudeMcpConfig({ serverName: "empty", projectRoot: dir });
      expect(result.ok).toBe(false);
    });
  });
});
