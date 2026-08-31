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
  type RunnerLaunchInput,
  type RunnerLaunchResult,
  type RunnerMcpConfigInput,
  type RunnerMcpConfigResult,
  type RunnerProjectInspection,
  type RunnerRollbackResult,
  type RunnerVerifyResult,
  type RuntimeDetectionInput,
  type RuntimeStatus,
  type TeamEntry,
} from "@deck/core";

import { CLAUDE_DEVELOPMENT_TEAMS } from "./team-catalog";
import { inspectClaudeProject, type ClaudePreflightEffects, type ClaudeProbeResult } from "./preflight";
import { buildClaudeLaunchPlan } from "./launch";
import { buildClaudeDeveloperTeamInstallPlan } from "./developer-team-install";
import { applyClaudeFiles, backupClaudeFiles, rollbackClaudeFiles, verifyClaudeFiles } from "./transaction";
import { writeClaudeMcpConfig } from "./mcp-config";

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
  /**
   * `backupDeveloperTeamFiles(plan)` and `verifyDeveloperTeamInstall(plan)` receive only the
   * plan object (no projectRoot) — mirrors Codex's `#nativePlans`/`#planOperations` WeakMaps
   * for the same reason: `applyDeveloperTeamInstall` gets `projectRoot` directly via its input,
   * but these two do not, so the exact plan object this adapter produced is the only link back
   * to where it was planned for.
   */
  readonly #planProjectRoots = new WeakMap<object, string>();

  constructor(options: ClaudeRunnerAdapterOptions = {}) {
    this.#preflight = options.preflight ?? { probe: defaultProbe };
  }

  // -------------------------------------------------------------------------
  // Detection — Task 1.2 (real, not a stub)
  // -------------------------------------------------------------------------

  async inspectProject(projectRoot: string): Promise<RunnerProjectInspection> {
    return inspectClaudeProject(projectRoot, this.#preflight);
  }

  // -------------------------------------------------------------------------
  // Launch — Phase 2
  // -------------------------------------------------------------------------

  async buildLaunchPlan(input: RunnerLaunchInput): Promise<RunnerLaunchResult> {
    const inspection = await this.inspectProject(input.projectRoot);
    if (inspection.state === "blocked") {
      return { status: "blocked", code: "claude-preflight-blocked", diagnostics: inspection.diagnostics };
    }
    // An unrecognized version (state "degraded") leaves evidence.{interactive,exec,...}
    // unset, so every feature flag below evaluates false and buildClaudeLaunchPlan naturally
    // returns "unsupported" for every mode — failing closed without special-case logic.
    const features = {
      interactive: inspection.evidence.interactive === true,
      exec: inspection.evidence.exec === true,
      resumeById: inspection.evidence.resumeById === true,
      resumeLatest: inspection.evidence.resumeLatest === true,
    };
    // No bootstrap yet: per-launch role/system-prompt content is Phase 3 (Developer Team
    // materialization) territory. Launch plans build correctly without one.
    const launch = buildClaudeLaunchPlan(input, features);
    return launch.status === "ready"
      ? { ...launch, diagnostics: [...inspection.diagnostics, ...launch.diagnostics] }
      : launch;
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
  getNextScreen(_state: FlowState): NextScreen { return notYetImplemented("getNextScreen", "Phase 4"); }
  async inspectEnvironment(): Promise<unknown> { return notYetImplemented("inspectEnvironment", "Phase 4"); }
  async reviewTools(): Promise<unknown> { return notYetImplemented("reviewTools", "Phase 4"); }
  getCapability(_capabilityId: string): unknown { return notYetImplemented("getCapability", "Phase 4"); }
  getCapabilityIds(): readonly string[] { return notYetImplemented("getCapabilityIds", "Phase 4"); }
  getSelectableTools(): unknown[] { return notYetImplemented("getSelectableTools", "Phase 4"); }

  // -------------------------------------------------------------------------
  // Developer Team materialization — Phase 3
  // -------------------------------------------------------------------------

  buildDeveloperTeamInstallPlan(input: DeveloperTeamAdapterInstallInput): RunnerDeveloperTeamInstallPlan {
    const plan = buildClaudeDeveloperTeamInstallPlan(input);
    this.#planProjectRoots.set(plan, input.projectRoot);
    return plan;
  }

  async applyDeveloperTeamInstall(input: DeveloperTeamApplyInput): Promise<DeveloperTeamApplyResult> {
    return applyClaudeFiles(input.projectRoot, input.plan.files);
  }

  backupDeveloperTeamFiles(plan: unknown): RunnerBackupResult {
    const projectRoot = plan && typeof plan === "object" ? this.#planProjectRoots.get(plan) : undefined;
    const files = (plan as RunnerDeveloperTeamInstallPlan | undefined)?.files;
    if (!projectRoot || !files) {
      return { payload: undefined, diagnostics: ["Unknown Claude installation plan; it was not produced by this adapter instance."] };
    }
    return { payload: backupClaudeFiles(projectRoot, files), diagnostics: [] };
  }

  async rollbackDeveloperTeamFiles(backup: unknown): Promise<RunnerRollbackResult> {
    return rollbackClaudeFiles(backup);
  }

  verifyDeveloperTeamInstall(plan: unknown): RunnerVerifyResult {
    const projectRoot = plan && typeof plan === "object" ? this.#planProjectRoots.get(plan) : undefined;
    const files = (plan as RunnerDeveloperTeamInstallPlan | undefined)?.files;
    if (!projectRoot || !files) {
      return { valid: false, diagnostics: ["Unknown Claude installation plan; it was not produced by this adapter instance."] };
    }
    return verifyClaudeFiles(projectRoot, files);
  }

  // -------------------------------------------------------------------------
  // MCP — Phase 3 (single-server safe writer; capability-driven selection is Phase 4)
  // -------------------------------------------------------------------------

  async writeMcpConfig(input: RunnerMcpConfigInput): Promise<RunnerMcpConfigResult> {
    return writeClaudeMcpConfig(input);
  }
}

export function createClaudeRunnerAdapter(options: ClaudeRunnerAdapterOptions = {}): RunnerAdapter {
  return new ClaudeRunnerAdapter(options);
}
