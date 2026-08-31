import { existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import type { RunnerMcpConfigInput, RunnerMcpConfigResult } from "@deck/core";

/**
 * Safe read/merge/write for project-scoped `.mcp.json` (REQ-CLD-MAT-001). Same
 * read-merge-atomic_write-validate algorithm as OpenCode's `config-merge.ts`, scaled down to a
 * single server entry — `.mcp.json`'s `mcpServers` map is structurally closer to
 * `opencode.json` (JSON) than to Codex's TOML, so there is no need for Codex's source-range-
 * aware parser here.
 */

type McpServerEntry =
  | { type: "stdio"; command: string; args?: readonly string[] }
  | { type: "http"; url: string; headers?: Record<string, string> };

type McpConfigFile = { mcpServers?: Record<string, unknown> };

export class ClaudeMcpConfigError extends Error {
  readonly code: "READ" | "PARSE" | "WRITE" | "VALIDATION";
  constructor(code: ClaudeMcpConfigError["code"], message: string) {
    super(message);
    this.name = "ClaudeMcpConfigError";
    this.code = code;
  }
}

function readMcpConfig(path: string): McpConfigFile {
  if (!existsSync(path)) return {};
  const raw = readFileSync(path, "utf-8");
  if (raw.trim() === "") return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as McpConfigFile) : {};
  } catch {
    throw new ClaudeMcpConfigError("PARSE", `${path} contains invalid JSON; refusing to overwrite it blindly.`);
  }
}

function buildEntry(input: RunnerMcpConfigInput): McpServerEntry | undefined {
  if (input.type === "remote" || input.url) {
    if (!input.url) return undefined;
    return { type: "http", url: input.url, ...(input.headers ? { headers: input.headers } : {}) };
  }
  if (input.command && input.command.length > 0) {
    return { type: "stdio", command: input.command[0]!, ...(input.command.length > 1 ? { args: input.command.slice(1) } : {}) };
  }
  return undefined;
}

/**
 * Write one MCP server entry into `.mcp.json`, preserving every other entry and every other
 * top-level key exactly. Never a blind overwrite.
 */
export async function writeClaudeMcpConfig(input: RunnerMcpConfigInput): Promise<RunnerMcpConfigResult> {
  const projectRoot = input.projectRoot ?? process.cwd();
  const path = join(projectRoot, ".mcp.json");

  const entry = buildEntry(input);
  if (!entry) {
    return { ok: false, path, diagnostics: [`No usable command or url was provided for MCP server '${input.serverName}'.`] };
  }
  if (!input.serverName || /[\\/]/.test(input.serverName)) {
    return { ok: false, path, diagnostics: [`MCP server name '${input.serverName}' is invalid.`] };
  }

  let config: McpConfigFile;
  try {
    config = readMcpConfig(path);
  } catch (error) {
    return { ok: false, path, diagnostics: [error instanceof Error ? error.message : String(error)] };
  }

  const merged: McpConfigFile = {
    ...config,
    mcpServers: { ...(config.mcpServers ?? {}), [input.serverName]: entry },
  };

  const temp = `${path}.deck-${randomUUID()}.tmp`;
  try {
    writeFileSync(temp, `${JSON.stringify(merged, null, 2)}\n`, "utf-8");
    // Validate before committing: re-parse the temp file and confirm the entry round-trips.
    const revalidated = JSON.parse(readFileSync(temp, "utf-8")) as McpConfigFile;
    if (JSON.stringify(revalidated.mcpServers?.[input.serverName]) !== JSON.stringify(entry)) {
      throw new ClaudeMcpConfigError("VALIDATION", "Post-write validation of the MCP entry failed.");
    }
    renameSync(temp, path);
  } catch (error) {
    rmSync(temp, { force: true });
    return { ok: false, path, diagnostics: [error instanceof Error ? error.message : String(error)] };
  }

  return { ok: true, path };
}
