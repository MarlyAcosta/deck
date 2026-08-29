/**
 * ClaudeRunnerAdapter — Phase 1 (minimal composition and detection).
 *
 * Implements enough of RunnerAdapter to register and detect for real. Every method the
 * interface requires but that Deck doesn't build until a later phase throws a clear,
 * phase-labeled error instead of returning fabricated data — see
 * openspec/changes/add-claude-code-runner-support/tasks.md for what replaces each stub and
 * when. This mirrors packages/adapter-codex/src/runner-adapter.ts's composition pattern at a
 * scale appropriate to Phase 1; Codex's file only reached ~1.7k lines after Phases 2-6 of its
 * own change.
 */

import { spawnSync } from "node:child_process";

import {
  findProvider,
  getModelsForProvider,
  type CapabilityInventory,
  type CapabilityInventoryInput,
  type DashboardState,
  type DeveloperTeamAdapterInstallInput,
  type DeveloperTeamApplyInput,
  type DeveloperTeamApplyResult,
  type DeveloperTeamModelAssignments,
  type DeveloperTeamThinkingAssignments,
  type FlowState,
  type InstallationPlan,
  type ModelCatalog,
  type NextScreen,
  type ReviewPlan,
  type RunnerAction,
  type RunnerActionContext,
  type RunnerActionRunResult,
  type RunnerAdapter,
  type RunnerBackupResult,
  type RunnerDeveloperTeamInstallPlan,
  type RunnerProjectInspection,
  type RunnerRollbackResult,
  type RunnerVerifyResult,
  type RuntimeDetectionInput,
  type RuntimeStatus,
  type TeamEntry,
} from "@deck/core";

import { CLAUDE_DEVELOPMENT_TEAMS } from "./team-catalog";
import { inspectClaudeProject, type ClaudePreflightEffects, type ClaudeProbeResult } from "./preflight";

export type ClaudeRunnerAdapterOptions = {
  preflight?: ClaudePreflightEffects;
};

function defaultProbe(): Promise<ClaudeProbeResult> {
  const version = spawnSync("claude", ["--version"], { encoding: "utf8", timeout: 5_000 });
  if (version.error || version.status !== 0) return Promise.resolve({ found: false });
  const help = spawnSync("claude", ["--help"], { encoding: "utf8", timeout: 5_000 });
  const match = `${version.stdout}`.match(/(\d+\.\d+\.\d+)/);
  return Promise.resolve({ found: true, version: match?.[1] ?? "0.0.0", help: `${help.stdout}` });
}

/** Throws with a phase pointer instead of returning fabricated data for not-yet-built surfaces. */
function notYetImplemented(method: string, phase: string): never {
  throw new Error(
    `ClaudeRunnerAdapter.${method}() is not implemented yet (planned for ${phase}). `
    + "See openspec/changes/add-claude-code-runner-support/tasks.md.",
  );
}

export class ClaudeRunnerAdapter implements RunnerAdapter {
  readonly runnerId = "claude";
  readonly displayName = "Claude Code";
  readonly environmentIds: readonly string[] = ["claude-development"];

  readonly #preflight: ClaudePreflightEffects;

  constructor(options: ClaudeRunnerAdapterOptions = {}) {
    this.#preflight = options.preflight ?? { probe: defaultProbe };
  }

  // -------------------------------------------------------------------------
  // Detection — Task 1.2 (real, not a stub)
  // -------------------------------------------------------------------------

  async inspectProject(projectRoot: string): Promise<RunnerProjectInspection> {
    return inspectClaudeProject(projectRoot, this.#preflight);
  }

  async detectRuntimes(input?: RuntimeDetectionInput): Promise<readonly RuntimeStatus[]> {
    const inspection = await this.inspectProject(input?.projectRoot ?? process.cwd());
    return [{
      runtimeId: "claude",
      displayName: this.displayName,
      isAvailable: inspection.evidence.binary === true,
      version: typeof inspection.evidence.version === "string" ? inspection.evidence.version : undefined,
      diagnostics: inspection.diagnostics.map((diagnostic) => diagnostic.message),
    }];
  }

  // -------------------------------------------------------------------------
  // Teams and models — real (trivial reuse of shared @deck/core catalogs)
  // -------------------------------------------------------------------------

  getTeams(): readonly TeamEntry[] {
    return CLAUDE_DEVELOPMENT_TEAMS;
  }

  /** REQ-CLD-MDL-001: reuse the existing `anthropic` provider/model entries; never a parallel list. */
  getModelCatalog(): ModelCatalog {
    const provider = findProvider("anthropic");
    return {
      providers: provider ? [provider] : [],
      models: getModelsForProvider("anthropic"),
      developerTeamDefaults: [],
    };
  }

  // No project config writer exists yet (Phase 3) — honestly reports "nothing assigned yet",
  // not a stub standing in for missing behavior.
  readModelAssignments(): DeveloperTeamModelAssignments { return {}; }
  readThinkingAssignments(): DeveloperTeamThinkingAssignments { return {}; }

  // TODO(phase-4): wire real thinking/reasoning-level mapping once models.ts lands.
  getThinkingLevels(): readonly string[] { return []; }
  supportsThinking(): boolean { return false; }
  resolveThinking(): string | undefined { return undefined; }
  getDefaultThinking(): string { return ""; }

  // -------------------------------------------------------------------------
  // Everything else required by RunnerAdapter — not built until a later phase
  // -------------------------------------------------------------------------

  async getCapabilityInventory(_input: CapabilityInventoryInput): Promise<CapabilityInventory> { return notYetImplemented("getCapabilityInventory", "Phase 4"); }
  buildReviewPlan(_state: DashboardState, _inventory: CapabilityInventory): ReviewPlan { return notYetImplemented("buildReviewPlan", "Phase 3/4"); }
  buildInstallationPlan(_state: DashboardState): InstallationPlan { return notYetImplemented("buildInstallationPlan", "Phase 3/4"); }
  async runAction(_action: RunnerAction, _context: RunnerActionContext): Promise<RunnerActionRunResult> { return notYetImplemented("runAction", "Phase 3/4"); }
  buildDeveloperTeamInstallPlan(_input: DeveloperTeamAdapterInstallInput): RunnerDeveloperTeamInstallPlan { return notYetImplemented("buildDeveloperTeamInstallPlan", "Phase 3"); }
  async applyDeveloperTeamInstall(_input: DeveloperTeamApplyInput): Promise<DeveloperTeamApplyResult> { return notYetImplemented("applyDeveloperTeamInstall", "Phase 3"); }
  getNextScreen(_state: FlowState): NextScreen { return notYetImplemented("getNextScreen", "Phase 4"); }
  async inspectEnvironment(): Promise<unknown> { return notYetImplemented("inspectEnvironment", "Phase 4"); }
  async reviewTools(): Promise<unknown> { return notYetImplemented("reviewTools", "Phase 4"); }
  backupDeveloperTeamFiles(_plan: unknown): RunnerBackupResult { return notYetImplemented("backupDeveloperTeamFiles", "Phase 3"); }
  async rollbackDeveloperTeamFiles(_backup: unknown): Promise<RunnerRollbackResult> { return notYetImplemented("rollbackDeveloperTeamFiles", "Phase 3"); }
  verifyDeveloperTeamInstall(_plan: unknown): RunnerVerifyResult { return notYetImplemented("verifyDeveloperTeamInstall", "Phase 3"); }
  getCapability(_capabilityId: string): unknown { return notYetImplemented("getCapability", "Phase 4"); }
  getCapabilityIds(): readonly string[] { return notYetImplemented("getCapabilityIds", "Phase 4"); }
  getSelectableTools(): unknown[] { return notYetImplemented("getSelectableTools", "Phase 4"); }

  // buildLaunchPlan is intentionally omitted (optional on RunnerAdapter) until Phase 2 —
  // omitting an optional method is a more honest signal than stubbing one the type system
  // doesn't even require yet.
}

export function createClaudeRunnerAdapter(options: ClaudeRunnerAdapterOptions = {}): RunnerAdapter {
  return new ClaudeRunnerAdapter(options);
}
