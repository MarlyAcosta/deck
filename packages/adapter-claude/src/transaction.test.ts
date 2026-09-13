import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { applyClaudeFiles, backupClaudeFiles, rollbackClaudeFiles, verifyClaudeFiles } from "./transaction";
import type { DeveloperTeamInstallFile } from "@deck/core/runner-capability";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "deck-claude-tx-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const files: readonly DeveloperTeamInstallFile[] = [
  { path: ".claude/agents/deck-lead.md", content: "lead content", kind: "agent" },
  { path: ".claude/skills/deck-lead/SKILL.md", content: "skill content", kind: "skill" },
];

describe("applyClaudeFiles", () => {
  test("creates files that did not exist, marking them created", async () => {
    await withTempDir(async (dir) => {
      const result = applyClaudeFiles(dir, files);
      expect(result.changedCount).toBe(2);
      expect(result.unchangedCount).toBe(0);
      expect(result.results.every((r) => r.status === "created")).toBe(true);
      expect(await readFile(join(dir, ".claude/agents/deck-lead.md"), "utf-8")).toBe("lead content");
    });
  });

  test("reapplying identical content reports unchanged and does not rewrite", async () => {
    await withTempDir(async (dir) => {
      applyClaudeFiles(dir, files);
      const second = applyClaudeFiles(dir, files);
      expect(second.changedCount).toBe(0);
      expect(second.unchangedCount).toBe(2);
      expect(second.results.every((r) => r.status === "unchanged")).toBe(true);
    });
  });

  test("applying different content over an existing file reports updated", async () => {
    await withTempDir(async (dir) => {
      applyClaudeFiles(dir, files);
      const changed = applyClaudeFiles(dir, [{ ...files[0]!, content: "new lead content" }]);
      expect(changed.results[0]!.status).toBe("updated");
      expect(await readFile(join(dir, ".claude/agents/deck-lead.md"), "utf-8")).toBe("new lead content");
    });
  });
});

describe("backupClaudeFiles / rollbackClaudeFiles", () => {
  test("round-trips: backup before apply, apply, rollback restores exact prior absence", async () => {
    await withTempDir(async (dir) => {
      const backup = backupClaudeFiles(dir, files);
      expect(backup.entries.every((e) => e.existed === false)).toBe(true);
      applyClaudeFiles(dir, files);
      expect(existsSync(join(dir, ".claude/agents/deck-lead.md"))).toBe(true);
      const rollback = await rollbackClaudeFiles({ payload: backup, diagnostics: [] });
      expect(rollback.status).toBe("rolled-back");
      expect(existsSync(join(dir, ".claude/agents/deck-lead.md"))).toBe(false);
    });
  });

  test("round-trips: backup captures prior content, rollback restores it exactly (not deletes it)", async () => {
    await withTempDir(async (dir) => {
      await mkdir(join(dir, ".claude", "agents"), { recursive: true });
      await writeFile(join(dir, ".claude/agents/deck-lead.md"), "old content", "utf-8");
      const backup = backupClaudeFiles(dir, [files[0]!]);
      expect(backup.entries[0]!.existed).toBe(true);
      expect(backup.entries[0]!.content).toBe("old content");
      applyClaudeFiles(dir, [files[0]!]);
      expect(await readFile(join(dir, ".claude/agents/deck-lead.md"), "utf-8")).toBe("lead content");
      const rollback = await rollbackClaudeFiles({ payload: backup, diagnostics: [] });
      expect(rollback.status).toBe("rolled-back");
      expect(await readFile(join(dir, ".claude/agents/deck-lead.md"), "utf-8")).toBe("old content");
    });
  });

  test("reports nothing-to-do for an invalid/missing backup payload", async () => {
    const rollback = await rollbackClaudeFiles(undefined);
    expect(rollback.status).toBe("nothing-to-do");
  });
});

describe("global scope round trip (REQ-CGS-RT-001: add-claude-global-install-scope)", () => {
  // None of applyClaudeFiles/backupClaudeFiles/rollbackClaudeFiles/verifyClaudeFiles branch on
  // whether the supplied root is actually $HOME (confirmed by reading every call site in this
  // file — see design.md's "Decision" section) — a temp dir is therefore a faithful stand-in for
  // resolveClaudeInstallRoot()'s real homedir() return value. This test proves the full
  // backup -> apply -> verify -> rollback cycle end-to-end at that root, not just piecewise.
  test("full backup -> apply -> verify -> rollback cycle succeeds at a root standing in for homedir()", async () => {
    await withTempDir(async (globalRoot) => {
      const backup = backupClaudeFiles(globalRoot, files);
      expect(backup.entries.every((e) => e.existed === false)).toBe(true);

      const applied = applyClaudeFiles(globalRoot, files);
      expect(applied.changedCount).toBe(2);

      const verified = verifyClaudeFiles(globalRoot, files);
      expect(verified.valid).toBe(true);

      const rolledBack = await rollbackClaudeFiles({ payload: backup, diagnostics: [] });
      expect(rolledBack.status).toBe("rolled-back");
      expect(existsSync(join(globalRoot, ".claude/agents/deck-lead.md"))).toBe(false);
      expect(existsSync(join(globalRoot, ".claude/skills/deck-lead/SKILL.md"))).toBe(false);
    });
  });
});

describe("verifyClaudeFiles", () => {
  test("valid after a clean apply", async () => {
    await withTempDir(async (dir) => {
      applyClaudeFiles(dir, files);
      const result = verifyClaudeFiles(dir, files);
      expect(result.valid).toBe(true);
      expect(result.diagnostics).toEqual([]);
    });
  });

  test("invalid, with a specific diagnostic, when a file is missing", async () => {
    await withTempDir(async (dir) => {
      const result = verifyClaudeFiles(dir, files);
      expect(result.valid).toBe(false);
      expect(result.diagnostics.some((d) => d.includes("Missing"))).toBe(true);
    });
  });

  test("invalid when on-disk content diverges from the plan", async () => {
    await withTempDir(async (dir) => {
      applyClaudeFiles(dir, files);
      await writeFile(join(dir, ".claude/agents/deck-lead.md"), "someone edited this by hand", "utf-8");
      const result = verifyClaudeFiles(dir, files);
      expect(result.valid).toBe(false);
      expect(result.diagnostics.some((d) => d.includes("Content mismatch"))).toBe(true);
    });
  });
});
