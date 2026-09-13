/**
 * ClaudeRunnerAdapter — every `RunnerAdapter` method is implemented for real as of Phase 6, no
 * throwing stubs remain. Built incrementally across openspec/changes/add-claude-code-runner-support/
 * Phases 1-6 — see tasks.md for what each phase added and why (including two real bugs caught
 * only by live testing, not by inspection: a model-ID mapping bug in Phase 4 and a missing
 * `mutationPreview` field in Phase 5 that would have silently blocked every real install).
 * Deliberately narrower in scope than packages/adapter-codex/src/runner-adapter.ts (~1.7k lines,
 * built over many more phases) in specific, explicitly-recorded ways — see design.md's
 * "Deferred" sections for what's intentionally not built yet and why.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import {
  findProvider,
  getModelsForProvider,
  type CapabilityCatalogEntry,
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
  type NormalizedDeckConfig,
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
  type RunnerModelDiscoveryRequest,
  type RunnerModelEntry,
  type RunnerModelInventoryResult,
  type RunnerModelProvider,
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
import { nativeClaudeModelAlias, canonicalModelIdFromNativeAlias } from "./models";
import { parseAgentFrontmatterAssignments } from "./agent-files";
import { buildClaudeDeveloperTeamInstallPlan } from "./developer-team-install";
import { applyClaudeFiles, backupClaudeFiles, rollbackClaudeFiles, verifyClaudeFiles } from "./transaction";
import { writeClaudeMcpConfig } from "./mcp-config";
import { CLAUDE_CAPABILITY_CATALOG, type ClaudeCapabilityCatalogEntry } from "./capability-catalog";
import { resolveClaudeInstallRoot } from "./install-root";

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

/**
 * Reads back per-role model/thinking assignments from the materialized `.claude/agents/*.md`
 * files (Task 4.1) — there is nowhere else project-local for Claude to persist this, so the
 * agent files serve as both the role definition and the assignment record. Returns `{}` (not a
 * throw) when nothing is materialized yet — a genuinely empty project is a real, valid state,
 * not an error.
 */
function readAgentFrontmatterAssignments(projectRoot: string): { model: DeveloperTeamModelAssignments; thinking: DeveloperTeamThinkingAssignments } {
  const agentsDir = join(projectRoot, ".claude", "agents");
  const model: Record<string, string> = {};
  const thinking: Record<string, string> = {};
  if (!existsSync(agentsDir)) return { model, thinking };
  for (const entry of readdirSync(agentsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const agentId = entry.name.slice(0, -3);
    const content = readFileSync(join(agentsDir, entry.name), "utf-8");
    const { model: nativeModel, effort } = parseAgentFrontmatterAssignments(content);
    const canonicalModel = canonicalModelIdFromNativeAlias(nativeModel);
    if (canonicalModel) model[agentId] = canonicalModel;
    if (effort) thinking[agentId] = effort;
  }
  return { model, thinking };
}

export class ClaudeRunnerAdapter implements RunnerAdapter {
  readonly runnerId = "claude";
  readonly displayName = "Claude Code";
  readonly environmentIds: readonly string[] = ["claude-development"];
  /**
   * Real bug found live testing the TUI, not by inspection: without a `ui.model` here, the TUI's
   * model-provider/model-selection/no-providers screens (`apps/cli/src/tui/screens/developer-team-screens.tsx`'s
   * `modelUiMetadata()`) fall back to `DEFAULT_MODEL_UI` — Pi's own guidance text
   * ("~/.pi/agent/settings.json", "pi --list-models") — shown for Claude, which has nothing to
   * do with Pi. `defaultThinkingLevels` mirrors the `--effort` levels confirmed live against a
   * real install in `add-claude-code-runner-support`'s Phase 4 (`low`/`medium`/`high`/`xhigh`/`max`);
   * the adapter's own `getThinkingLevels()` refines this once `inspectProject` has actually run,
   * but this static list is what the UI needs before that live probe exists.
   */
  readonly ui = {
    environmentLabels: { "claude-development": "Claude Code Development" },
    model: {
      providerSource: "Providers and models come from Deck's bundled anthropic catalog (Deck's canonical catalog IDs are mapped to Claude's own sonnet/opus/haiku aliases at launch).",
      missingChecks: ["claude --version (binary on PATH)", "claude auth status (subscription login or ANTHROPIC_API_KEY)"],
      remediation: "Run `claude --version` and `claude doctor` to confirm the Claude Code CLI is installed and authenticated.",
      defaultThinkingLevels: ["low", "medium", "high", "xhigh", "max"] as const,
      usesNativeCompatibilityChecks: true,
    },
  } as const;

  readonly #preflight: ClaudePreflightEffects;
  /**
   * `backupDeveloperTeamFiles(plan)` and `verifyDeveloperTeamInstall(plan)` receive only the
   * plan object (no projectRoot) — mirrors Codex's `#nativePlans`/`#planOperations` WeakMaps
   * for the same reason: `applyDeveloperTeamInstall` gets `projectRoot` directly via its input,
   * but these two do not, so the exact plan object this adapter produced is the only link back
   * to where it was planned for.
   */
  readonly #planProjectRoots = new WeakMap<object, string>();
  /**
   * `getThinkingLevels`/`supportsThinking`/`resolveThinking`/`getDefaultThinking` take no
   * `projectRoot` and must be synchronous, so they cannot themselves probe `claude --help`.
   * Populated opportunistically by `inspectProject` (which every code path that has a
   * projectRoot already calls) — genuinely unknown (`[]`) until some async call has run once on
   * this adapter instance, never a guessed/hardcoded list.
   */
  #lastKnownThinkingLevels: readonly string[] = [];

  constructor(options: ClaudeRunnerAdapterOptions = {}) {
    this.#preflight = options.preflight ?? { probe: defaultProbe };
  }

  // -------------------------------------------------------------------------
  // Detection — Task 1.2 (real, not a stub)
  // -------------------------------------------------------------------------

  async inspectProject(projectRoot: string): Promise<RunnerProjectInspection> {
    const inspection = await inspectClaudeProject(projectRoot, this.#preflight);
    if (Array.isArray(inspection.evidence.thinkingLevels)) {
      this.#lastKnownThinkingLevels = inspection.evidence.thinkingLevels as readonly string[];
    }
    return inspection;
  }

  /** Task 4.3: real `deck doctor` diagnostics, not `unknown`-typed placeholders. */
  async diagnoseProject(projectRoot: string, _deckConfig: NormalizedDeckConfig): Promise<ReadonlyArray<{ category: string; status: "ok" | "warning" | "error"; message: string; suggestion?: string }>> {
    const inspection = await this.inspectProject(projectRoot);
    const checks: Array<{ category: string; status: "ok" | "warning" | "error"; message: string; suggestion?: string }> = [];

    if (inspection.state === "blocked") {
      checks.push({ category: "binary", status: "error", message: "Claude Code CLI was not found on PATH.", suggestion: "Install Claude Code: https://code.claude.com" });
      return checks;
    }
    checks.push({ category: "binary", status: "ok", message: `Claude Code ${typeof inspection.evidence.version === "string" ? inspection.evidence.version : "(version unknown)"} detected on PATH.` });

    checks.push(inspection.evidence.launchPolicySupported === true
      ? { category: "launch-policy", status: "ok", message: "--permission-mode bypassPermissions is supported by this version." }
      : { category: "launch-policy", status: "warning", message: "--permission-mode bypassPermissions was not detected for this version; Deck-launched sessions may prompt for permissions.", suggestion: "Update Claude Code to a version confirmed to support it." });

    // deck claude developer always installs at the user level (add-claude-global-install-scope);
    // Doctor checks both that global root and, honestly, any leftover project-local install too,
    // rather than only the location the current default actually writes to.
    const globalRoot = resolveClaudeInstallRoot();
    const agentsInstalledGlobally = existsSync(join(globalRoot, ".claude", "agents"));
    const agentsInstalledInProject = existsSync(join(projectRoot, ".claude", "agents"));
    checks.push(agentsInstalledGlobally || agentsInstalledInProject
      ? { category: "developer-team", status: "ok", message: agentsInstalledGlobally
          ? "Developer Team roles are materialized in ~/.claude/agents/ (the always-global default)."
          : "Developer Team roles are materialized in this project's .claude/agents/ (a leftover project-scoped install; project-local content takes precedence over the global one)." }
      : { category: "developer-team", status: "warning", message: "Developer Team roles are not materialized yet.", suggestion: "Run `deck claude developer` to install (always at the user level)." });

    // Claude Code's CLAUDE.md convention is root-shaped: the global (user-level) memory file is
    // `~/.claude/CLAUDE.md`, not `~/CLAUDE.md` — see developer-team-install.ts's matching fix,
    // found by the same live-verification bug this task's own real install surfaced.
    const globalClaudeMdPath = join(globalRoot, ".claude", "CLAUDE.md");
    const projectClaudeMdPath = join(projectRoot, "CLAUDE.md");
    const claudeMdOwnedGlobally = existsSync(globalClaudeMdPath) && readFileSync(globalClaudeMdPath, "utf-8").includes("<!-- deck:developer-team:start -->");
    const claudeMdOwnedInProject = existsSync(projectClaudeMdPath) && readFileSync(projectClaudeMdPath, "utf-8").includes("<!-- deck:developer-team:start -->");
    checks.push(claudeMdOwnedGlobally || claudeMdOwnedInProject
      ? { category: "claude-md", status: "ok", message: claudeMdOwnedGlobally
          ? "~/.claude/CLAUDE.md carries Deck's Developer Team marker span."
          : "This project's CLAUDE.md carries Deck's Developer Team marker span (a leftover project-scoped install)." }
      : { category: "claude-md", status: "warning", message: "No CLAUDE.md carries a Deck-owned marker span yet." });

    return checks;
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
    const effortLevels = Array.isArray(inspection.evidence.thinkingLevels)
      ? (inspection.evidence.thinkingLevels as readonly string[])
      : [];
    // REQ-CLD-MDL-002 / real bug fixed in Phase 4: Deck's canonical catalog IDs
    // (e.g. "anthropic/claude-opus-4") do not resolve as Claude Code --model values — confirmed
    // live (404 api_error_status for both the bare and fully-qualified catalog ID). Only
    // Claude's own aliases (sonnet/opus/haiku) work, so the requested model is mapped before
    // reaching buildClaudeLaunchPlan; an unmapped model is omitted, never passed through raw.
    const nativeModelId = nativeClaudeModelAlias(input.modelId);
    const launch = buildClaudeLaunchPlan({ ...input, modelId: nativeModelId }, features, undefined, effortLevels);
    if (launch.status !== "ready") return launch;
    return {
      ...launch,
      diagnostics: [
        ...inspection.diagnostics,
        ...(input.modelId && !nativeModelId
          ? [{ code: "claude-model-omitted", severity: "warning" as const, message: `Model '${input.modelId}' has no confirmed Claude Code alias and was omitted from the launch.` }]
          : []),
        ...launch.diagnostics,
      ],
    };
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

  /**
   * Real bug found live testing the TUI model-assignment screen, not by inspection: without this
   * method, `apps/cli/src/tui/app.tsx`'s model-config dispatch (OpenCode -> its own discovery,
   * Codex -> its own discovery, `getModelInventory` if present, else Pi's own
   * `detectPiModelInventoryForTui()`) silently fell through to the *Pi-specific* fallback branch
   * for Claude too — showing Pi's settings-file/`pi --list-models` guidance text and "no
   * providers detected" for a runner that has nothing to do with Pi. Claude's catalog is static
   * (`getModelCatalog()`, the same `anthropic` provider/model entries every other runner reuses),
   * not runner-discovered, but wrapping it here — rather than adding Claude-specific branching to
   * the shared TUI dispatch — is the smaller, already-designed-for fix: the TUI branch for
   * `adapter.getModelInventory` already exists, just unreached by any adapter until now.
   */
  async getModelInventory(_request: RunnerModelDiscoveryRequest): Promise<RunnerModelInventoryResult> {
    const catalog = this.getModelCatalog();
    const providers: RunnerModelProvider[] = catalog.providers.map((entry) => ({
      id: entry.id,
      displayName: entry.displayName,
      source: "runner-bundled",
    }));
    const modelsByProvider: Record<string, RunnerModelEntry[]> = {};
    for (const model of catalog.models) {
      (modelsByProvider[model.providerId] ??= []).push({
        id: model.id,
        providerId: model.providerId,
        displayName: model.displayName,
        supportsReasoning: model.capabilities.includes("reasoning"),
        source: "runner-bundled",
      });
    }
    return {
      state: "ready",
      inventory: { providers, modelsByProvider },
      source: "memory",
      discoveredAt: Date.now(),
      fingerprint: "claude-static-anthropic-catalog-v1",
    };
  }

  /** Task 4.1: reads real persisted assignments from `.claude/agents/*.md` frontmatter. */
  readModelAssignments(projectRoot?: string): DeveloperTeamModelAssignments {
    return readAgentFrontmatterAssignments(projectRoot ?? process.cwd()).model;
  }
  readThinkingAssignments(projectRoot?: string): DeveloperTeamThinkingAssignments {
    return readAgentFrontmatterAssignments(projectRoot ?? process.cwd()).thinking;
  }

  /**
   * `--effort <level>` (REQ-CLD-MDL-002 territory), confirmed live in Phase 4. Unlike Codex's
   * per-model reasoning variants, Claude's effort levels are a session-level flag, not scoped to
   * a specific model — `modelId` is accepted for interface compatibility but genuinely
   * irrelevant here, so it's intentionally unused rather than pretending to filter by it.
   */
  getThinkingLevels(_modelId?: string): readonly string[] { return this.#lastKnownThinkingLevels; }
  supportsThinking(_modelId: string): boolean { return this.#lastKnownThinkingLevels.length > 0; }
  resolveThinking(_modelId: string, existingAssignment?: string): string | undefined {
    return existingAssignment && this.#lastKnownThinkingLevels.includes(existingAssignment) ? existingAssignment : undefined;
  }
  /**
   * No confirmed default from Anthropic's own docs or `claude --help` (an invalid --effort value
   * degrades with a stderr warning naming the fallback as "the default" without saying which
   * level that is). Falls back to the first advertised level, same pragmatic choice Codex's
   * `getDefaultThinking` makes for its own unconfirmed-default case — not asserted as Claude's
   * true default.
   */
  getDefaultThinking(_modelId: string): string { return this.#lastKnownThinkingLevels[0] ?? ""; }

  // -------------------------------------------------------------------------
  // Everything else required by RunnerAdapter — not built until a later phase
  // -------------------------------------------------------------------------

  /**
   * Phase 6 (interactive TUI dashboard): confirmed by directly reading `app.tsx`'s actual
   * dashboard-composition and action-runner code that this is the ONLY one of the five
   * "TUI-flow" RunnerAdapter methods with real, exercised logic — `buildInstallationPlan`,
   * `runAction` (outside `capabilityId === "serena"`, which Claude's catalog never selects
   * since it's `status: "gap"`), and `getNextScreen` are never called by production code at
   * all (confirmed by repo-wide grep), and `reviewTools()`'s return value is stored but never
   * rendered. Deliberately simpler than Codex's `buildReviewPlan`: nothing in
   * `CLAUDE_CAPABILITY_CATALOG` is ever `requirementLevel: "required"` or `isBlocked: true`
   * (see capability-catalog.ts), so none of Codex's manual-step/blocked-capability/MCP-config-
   * preview branching applies yet — `ready` is unconditionally true today. This must be
   * revisited once Phase 4's deferred MCP capability-driven selection (context-mode,
   * codebase-memory, Serena, Context7, Supermemory, web-search) is actually built.
   */
  buildReviewPlan(_state: DashboardState, _inventory: CapabilityInventory): ReviewPlan {
    return {
      groups: {
        automaticInstalls: [],
        manualSteps: [],
        configWrites: [],
        teamApplications: [{ id: "claude-developer-team", kind: "apply-team-bundle", title: "Apply and verify Claude Developer Team content", capabilityId: "developer-team", status: "ready", required: true }],
        validations: [{ id: "claude-verify", kind: "validate", title: "Verify Claude Developer Team content", status: "ready", required: true }],
      },
      diagnostics: [],
      ready: true,
    };
  }

  /** Not called by any production code path (confirmed by repo-wide grep) — implemented only to satisfy the interface, mirroring Codex's own equally-unused version. */
  buildInstallationPlan(_state: DashboardState): InstallationPlan {
    return { steps: [{ action: "configure", tool: "claude", capabilityId: "developer-team", reason: "Materialize project-scoped Developer Team roles and skills" }] };
  }

  /** Only ever invoked for `capabilityId === "serena"` in the real action-runner, which Claude's review plan never emits (serena is `status: "gap"`) — real Developer Team effects apply through `applyDeveloperTeamInstall`, called generically by the TUI's own `installTeamBundle`, not through this method. */
  async runAction(action: RunnerAction, _context: RunnerActionContext): Promise<RunnerActionRunResult> {
    return { actionId: action.id, status: "informational", message: "Claude Code project effects are applied through the confirmed Developer Team plan.", diagnostics: [] };
  }

  /** Not called by any production code path (confirmed by repo-wide grep) — mirrors Codex's equally-unused version. */
  getNextScreen(state: FlowState): NextScreen { return state.currentScreen === "preflight-checking" ? "team-selection" : state.currentScreen; }

  /** Return value is stored in TUI state but never rendered anywhere (confirmed by repo-wide grep for its consumer) — mirrors Codex's/OpenCode's equally-inert contract. */
  async reviewTools(): Promise<unknown> { return { runnerId: this.runnerId, staticCompatible: true }; }

  // -------------------------------------------------------------------------
  // Capability catalog — Task 4.2 (honest gaps, REQ-CLD-DOC-002)
  // -------------------------------------------------------------------------

  #toCatalogEntry(entry: ClaudeCapabilityCatalogEntry, isInstalled: boolean): CapabilityCatalogEntry {
    return {
      capabilityId: entry.capabilityId,
      label: entry.label,
      description: entry.description,
      section: entry.status === "gap" ? "gaps" : "claude",
      requirementLevel: "optional",
      installKind: "runner-native",
      supportStatus: entry.status,
      isInstalled,
      isBlocked: false,
      ...(entry.status === "gap" ? { diagnostics: ["Not yet implemented — see proposal.md \"Out of scope\" / tasks.md Task 3.6."] } : {}),
    };
  }

  async getCapabilityInventory(input: CapabilityInventoryInput): Promise<CapabilityInventory> {
    const agentsInstalled = existsSync(join(resolveClaudeInstallRoot(), ".claude", "agents"))
      || existsSync(join(input.projectRoot, ".claude", "agents"));
    return {
      runnerId: this.runnerId,
      environmentId: input.environmentId,
      capabilities: CLAUDE_CAPABILITY_CATALOG.map((entry) => this.#toCatalogEntry(
        entry,
        entry.status === "supported" && ["native-agent-roles", "agent-bound-skills"].includes(entry.capabilityId) ? agentsInstalled : false,
      )),
    };
  }

  async inspectEnvironment(): Promise<unknown> { return this.inspectProject(process.cwd()); }

  getCapability(capabilityId: string): unknown {
    const entry = CLAUDE_CAPABILITY_CATALOG.find((candidate) => candidate.capabilityId === capabilityId);
    return entry ? this.#toCatalogEntry(entry, false) : undefined;
  }

  getCapabilityIds(): readonly string[] { return CLAUDE_CAPABILITY_CATALOG.map((entry) => entry.capabilityId); }
  getSelectableTools(): unknown[] { return []; }

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
