import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";

import type {
  DeveloperTeamApplyAgentResult,
  DeveloperTeamApplyResult,
  RunnerBackupResult,
  RunnerRollbackResult,
  RunnerVerifyResult,
} from "@deck/core";
import type { DeveloperTeamInstallFile } from "@deck/core/runner-capability";

/**
 * Backup, apply, rollback, and verify for `.claude/agents/`, `.claude/skills/`, and `CLAUDE.md`
 * (REQ-CLD-MAT-004). Deliberately simpler than Codex's `transaction.ts`: no persistent,
 * crash-recoverable journal — a snapshot-then-restore backup held in memory for the duration of
 * one install operation, atomic per-file writes (temp-then-rename), and a rollback that restores
 * exact prior content or deletes what didn't exist before. This matches the scope proposal.md
 * set for the initial release (no claim of Codex-level transactional recoverability across
 * process crashes); it is real and tested, not a stub.
 */

export type ClaudeFileBackupEntry = Readonly<{ path: string; existed: boolean; content?: string }>;
export type ClaudeBackupPayload = Readonly<{ projectRoot: string; entries: readonly ClaudeFileBackupEntry[] }>;

function absolutePath(projectRoot: string, relativePath: string): string {
  return join(projectRoot, relativePath);
}

function writeAtomic(absolute: string, content: string): void {
  mkdirSync(dirname(absolute), { recursive: true });
  const temp = `${absolute}.deck-${randomUUID()}.tmp`;
  writeFileSync(temp, content, "utf-8");
  try {
    renameSync(temp, absolute);
  } catch (error) {
    rmSync(temp, { force: true });
    throw error;
  }
}

export function backupClaudeFiles(projectRoot: string, files: readonly Pick<DeveloperTeamInstallFile, "path">[]): ClaudeBackupPayload {
  const entries = files.map(({ path }): ClaudeFileBackupEntry => {
    const absolute = absolutePath(projectRoot, path);
    return existsSync(absolute) ? { path, existed: true, content: readFileSync(absolute, "utf-8") } : { path, existed: false };
  });
  return { projectRoot, entries };
}

export function applyClaudeFiles(projectRoot: string, files: readonly DeveloperTeamInstallFile[]): DeveloperTeamApplyResult {
  const results: DeveloperTeamApplyAgentResult[] = [];
  for (const file of files) {
    const absolute = absolutePath(projectRoot, file.path);
    const existing = existsSync(absolute) ? readFileSync(absolute, "utf-8") : undefined;
    if (existing === file.content) {
      results.push({ agentId: file.path, kind: file.kind ?? "other", status: "unchanged" });
      continue;
    }
    writeAtomic(absolute, file.content);
    results.push({ agentId: file.path, kind: file.kind ?? "other", status: existing === undefined ? "created" : "updated" });
  }
  return {
    results,
    changedCount: results.filter((result) => result.status !== "unchanged").length,
    unchangedCount: results.filter((result) => result.status === "unchanged").length,
  };
}

export function rollbackClaudeFiles(backup: unknown): RunnerRollbackResult {
  const payload = (backup as { payload?: ClaudeBackupPayload } | undefined)?.payload;
  if (!payload || typeof payload !== "object" || !Array.isArray(payload.entries)) {
    return { status: "nothing-to-do", conflicts: [], diagnostics: ["No valid Claude backup payload was supplied."] };
  }
  const conflicts: string[] = [];
  for (const entry of payload.entries) {
    const absolute = absolutePath(payload.projectRoot, entry.path);
    try {
      if (entry.existed && entry.content !== undefined) {
        writeAtomic(absolute, entry.content);
      } else if (!entry.existed && existsSync(absolute)) {
        rmSync(absolute);
      }
    } catch (error) {
      conflicts.push(`${entry.path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (conflicts.length > 0) return { status: "conflict", conflicts, diagnostics: [`Rollback conflicts: ${conflicts.join(", ")}`] };
  if (payload.entries.length === 0) return { status: "nothing-to-do", conflicts: [], diagnostics: [] };
  return { status: "rolled-back", conflicts: [], diagnostics: [] };
}

export function verifyClaudeFiles(projectRoot: string, files: readonly DeveloperTeamInstallFile[]): RunnerVerifyResult {
  const problems: string[] = [];
  for (const file of files) {
    const absolute = absolutePath(projectRoot, file.path);
    if (!existsSync(absolute)) {
      problems.push(`Missing: ${file.path}`);
      continue;
    }
    if (readFileSync(absolute, "utf-8") !== file.content) {
      problems.push(`Content mismatch: ${file.path}`);
    }
  }
  return { valid: problems.length === 0, diagnostics: problems };
}
