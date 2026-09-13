import { describe, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { DEVELOPER_TEAM_AGENTS } from "@deck/core/teams/developer/catalog";
import { buildClaudeDeveloperTeamInstallPlan } from "./developer-team-install";
import { applyClaudeFiles } from "./transaction";
import { isClaudeOwnedContent } from "./agent-files";
import type { DeveloperTeamAdapterInstallInput } from "@deck/core";

async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "deck-claude-install-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

function baseInput(projectRoot: string): DeveloperTeamAdapterInstallInput {
  return { projectRoot, environmentId: "claude-development", deckConfig: undefined as never };
}

describe("buildClaudeDeveloperTeamInstallPlan — fresh install", () => {
  test("materializes all 7 roles as agent files plus 7 matching skill files plus CLAUDE.md", async () => {
    await withTempDir(async (dir) => {
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(plan.blocked).toBeFalsy();
      const agentPaths = plan.files.filter((f) => f.kind === "agent").map((f) => f.path).sort();
      expect(agentPaths).toEqual(DEVELOPER_TEAM_AGENTS.map((a) => `.claude/agents/${a.id}.md`).sort());
      const skillPaths = plan.files.filter((f) => f.kind === "skill").map((f) => f.path).sort();
      expect(skillPaths.length).toBe(DEVELOPER_TEAM_AGENTS.length);
      expect(plan.files.some((f) => f.path === "CLAUDE.md")).toBe(true);
      expect(plan.files.length).toBe(DEVELOPER_TEAM_AGENTS.length * 2 + 1);
    });
  });

  test("every produced agent/skill file is recognized as Deck-owned", async () => {
    await withTempDir(async (dir) => {
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      for (const file of plan.files) {
        if (file.kind === "agent" || file.kind === "skill") expect(isClaudeOwnedContent(file.content)).toBe(true);
      }
    });
  });
});

describe("buildClaudeDeveloperTeamInstallPlan — idempotent reapply", () => {
  test("planning again after applying produces byte-identical content, not a diff", async () => {
    await withTempDir(async (dir) => {
      const first = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      applyClaudeFiles(dir, first.files);
      const second = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(second.blocked).toBeFalsy();
      expect(second.files.length).toBe(first.files.length);
      for (const file of first.files) {
        const match = second.files.find((f) => f.path === file.path);
        expect(match?.content).toBe(file.content);
      }
    });
  });
});

describe("buildClaudeDeveloperTeamInstallPlan — mutationPreview (real bug found live: apps/cli's runner-launch-command blocks apply entirely when this field is undefined)", () => {
  test("a fresh install previews one 'create' entry per file, each with preimage 'absent'", async () => {
    await withTempDir(async (dir) => {
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(plan.mutationPreview).toBeDefined();
      expect(plan.mutationPreview!.length).toBe(plan.files.length);
      for (const mutation of plan.mutationPreview!) {
        expect(mutation.action).toBe("create");
        expect(mutation.preimage).toBe("absent");
        expect(mutation.postimage).not.toBe("absent");
      }
    });
  });

  test("an idempotent reapply previews zero mutations, not a false diff", async () => {
    await withTempDir(async (dir) => {
      const first = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      applyClaudeFiles(dir, first.files);
      const second = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(second.mutationPreview).toEqual([]);
      // files[] still represents the full desired state even though nothing changed —
      // apply's own idempotency check (transaction.ts) is what skips the actual write.
      expect(second.files.length).toBe(first.files.length);
    });
  });

  test("changing one role's model previews exactly one 'update' entry, not a rebuild of everything", async () => {
    await withTempDir(async (dir) => {
      const first = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      applyClaudeFiles(dir, first.files);
      const second = buildClaudeDeveloperTeamInstallPlan({ ...baseInput(dir), modelAssignments: { "deck-lead": "anthropic/claude-opus-4" } });
      expect(second.mutationPreview!.length).toBe(1);
      expect(second.mutationPreview![0]!.action).toBe("update");
      expect(second.mutationPreview![0]!.path).toBe(".claude/agents/deck-lead.md");
      expect(second.mutationPreview![0]!.preimage).not.toBe("absent");
    });
  });
});

describe("buildClaudeDeveloperTeamInstallPlan — collision safety", () => {
  test("blocks instead of overwriting a pre-existing unowned agent file", async () => {
    await withTempDir(async (dir) => {
      const leadPath = join(dir, ".claude", "agents", "deck-lead.md");
      await mkdir(join(dir, ".claude", "agents"), { recursive: true });
      await writeFile(leadPath, "---\nname: deck-lead\n---\n\nA human wrote this, not Deck.\n", "utf-8");
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(plan.blocked).toBe(true);
      expect(plan.diagnostics!.some((d) => d.includes("deck-lead.md") && d.includes("not Deck-owned"))).toBe(true);
      expect(plan.files.some((f) => f.path === ".claude/agents/deck-lead.md")).toBe(false);
    });
  });

  test("does not block on CLAUDE.md pre-existing with unrelated human content (marker-span merge, not whole-file ownership)", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "CLAUDE.md"), "# My project notes\n\nHand-written stuff.\n", "utf-8");
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(plan.blocked).toBeFalsy();
      const claudeMd = plan.files.find((f) => f.path === "CLAUDE.md");
      expect(claudeMd?.content).toContain("Hand-written stuff.");
    });
  });

  test("blocks on malformed/duplicate CLAUDE.md markers", async () => {
    await withTempDir(async (dir) => {
      await writeFile(join(dir, "CLAUDE.md"), "<!-- deck:developer-team:start -->\nx\n<!-- deck:developer-team:start -->\ny\n<!-- deck:developer-team:end -->", "utf-8");
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(plan.blocked).toBe(true);
    });
  });
});

describe("buildClaudeDeveloperTeamInstallPlan — CLAUDE.md path is root-shaped, not root-agnostic (real bug found live installing against the real ~/.claude/CLAUDE.md)", () => {
  test("project root (default): CLAUDE.md materializes bare at the root, matching Claude Code's project-memory convention", async () => {
    await withTempDir(async (dir) => {
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir));
      expect(plan.files.some((f) => f.path === "CLAUDE.md")).toBe(true);
      expect(plan.files.some((f) => f.path === ".claude/CLAUDE.md")).toBe(false);
    });
  });

  test("global root (root === the known global root): CLAUDE.md materializes at .claude/CLAUDE.md, matching Claude Code's real user-memory convention — not the bare path a naive root-agnostic treatment would have used", async () => {
    await withTempDir(async (dir) => {
      // dir stands in for the known global root by being passed as both projectRoot and
      // knownGlobalRoot — isGlobalInstallRoot's plain string comparison then treats it exactly
      // as production treats a real resolveClaudeInstallRoot() === input.projectRoot match.
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir), dir);
      expect(plan.files.some((f) => f.path === ".claude/CLAUDE.md")).toBe(true);
      expect(plan.files.some((f) => f.path === "CLAUDE.md")).toBe(false);
    });
  });

  test("global root: merges with pre-existing content at .claude/CLAUDE.md, not a stray bare CLAUDE.md (the exact real bug: a fresh install ignored real ~/.claude/CLAUDE.md content and created an unread ~/CLAUDE.md instead)", async () => {
    await withTempDir(async (dir) => {
      await mkdir(join(dir, ".claude"), { recursive: true });
      await writeFile(join(dir, ".claude", "CLAUDE.md"), "# Real pre-existing global memory\n\nDo not lose this.\n", "utf-8");
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(dir), dir);
      const claudeMd = plan.files.find((f) => f.path === ".claude/CLAUDE.md");
      expect(claudeMd?.content).toContain("Do not lose this.");
      expect(plan.files.some((f) => f.path === "CLAUDE.md")).toBe(false);
    });
  });
});

describe("buildClaudeDeveloperTeamInstallPlan — collision safety at global scope (REQ-CGS-RT-002: add-claude-global-install-scope)", () => {
  // Same collision guard, same code path, exercised against a root standing in for the real
  // homedir() resolveClaudeInstallRoot() now always returns — proves the ownership check that
  // already protects a project root protects the global root identically, not just by inference.
  test("blocks instead of overwriting pre-existing unowned content at a root standing in for homedir()", async () => {
    await withTempDir(async (globalRoot) => {
      const leadPath = join(globalRoot, ".claude", "agents", "deck-lead.md");
      await mkdir(join(globalRoot, ".claude", "agents"), { recursive: true });
      await writeFile(leadPath, "---\nname: deck-lead\n---\n\nA human wrote this directly into their real ~/.claude/agents/, not Deck.\n", "utf-8");
      const plan = buildClaudeDeveloperTeamInstallPlan(baseInput(globalRoot));
      expect(plan.blocked).toBe(true);
      expect(plan.diagnostics!.some((d) => d.includes("deck-lead.md") && d.includes("not Deck-owned"))).toBe(true);
      expect(plan.files.some((f) => f.path === ".claude/agents/deck-lead.md")).toBe(false);
    });
  });
});

describe("buildClaudeDeveloperTeamInstallPlan — instruction translation is actually wired in", () => {
  test("blocks materialization if a capability instruction fragment leaks foreign-runner vocabulary", async () => {
    await withTempDir(async (dir) => {
      const input: DeveloperTeamAdapterInstallInput = {
        ...baseInput(dir),
        capabilityInstructions: {
          instructions: [
            { packageId: "context-mode", surface: "agent", markdown: "Use the OpenCode-specific renderer.", teamId: "developer-team", agentIds: ["deck-lead"] },
          ],
        },
      };
      const plan = buildClaudeDeveloperTeamInstallPlan(input);
      expect(plan.blocked).toBe(true);
      expect(plan.diagnostics!.some((d) => d.includes("foreign-runner vocabulary"))).toBe(true);
    });
  });
});
