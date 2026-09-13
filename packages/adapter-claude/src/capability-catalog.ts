/**
 * Task 4.2: capability catalog with honest gaps (REQ-CLD-DOC-002).
 *
 * Deliberately simpler than Codex's `capability-catalog.ts`: it does not wire into the shared
 * cross-runner `defineRunnerCapabilityContribution`/`RunnerCapabilityMapping` registry that
 * Codex participates in — that's a bigger decision (does Claude participate in cross-runner
 * capability-parity tracking at all?) than "finish Phase 4's checklist," and deserves its own
 * review rather than being smuggled in here. This catalog only has to satisfy
 * `RunnerAdapter.getCapabilityInventory`/`getCapability`/`getCapabilityIds` honestly.
 *
 * Every "Out of scope" item from proposal.md, plus Task 3.6's deferred standalone/bootstrap
 * skills, has an explicit `"gap"` entry here — REQ-CLD-DOC-002 requires this list to be checked
 * against that section whenever either changes.
 */

export type ClaudeCapabilityStatus = "supported" | "shared" | "gap";

export type ClaudeCapabilityCatalogEntry = {
  capabilityId: string;
  label: string;
  description: string;
  status: ClaudeCapabilityStatus;
};

export const CLAUDE_CAPABILITY_CATALOG: readonly ClaudeCapabilityCatalogEntry[] = Object.freeze([
  { capabilityId: "native-agent-roles", label: "Developer Team roles", description: "7 canonical roles materialized as .claude/agents/*.md subagents.", status: "supported" },
  { capabilityId: "agent-bound-skills", label: "Agent-bound skills", description: "Matching .claude/skills/*/SKILL.md per role.", status: "supported" },
  { capabilityId: "interactive-launch", label: "Interactive launch", description: "claude with Deck's launch-policy token.", status: "supported" },
  { capabilityId: "exec-launch", label: "Non-interactive (exec) launch", description: "claude -p --output-format json.", status: "supported" },
  { capabilityId: "resume-launch", label: "Resume launch", description: "Resume by session ID or latest.", status: "supported" },
  { capabilityId: "mcp-config", label: "MCP server configuration", description: "Generic single-server safe writer for .mcp.json.", status: "supported" },
  { capabilityId: "model-assignment", label: "Per-role model assignment", description: "Canonical anthropic/claude-* model IDs mapped to Claude's native aliases.", status: "supported" },
  { capabilityId: "thinking-effort-assignment", label: "Per-role thinking effort", description: "--effort levels confirmed live against the installed version.", status: "supported" },
  { capabilityId: "external-standalone-skills", label: "Standalone skill bundles", description: "The 29 bundled external skills are not yet materialized for Claude.", status: "gap" },
  { capabilityId: "bootstrap-skills", label: "Bootstrap skills", description: "deck-onboard/deck-archive are not yet materialized for Claude.", status: "gap" },
  { capabilityId: "trusted-runner-host-bridge", label: "Trusted runner-host bridge", description: "No dossier continuity, one-use invocation authorization, or controlled-effects enforcement; static-compatible only.", status: "gap" },
  { capabilityId: "context-mode", label: "Context Mode", description: "Not yet scoped for Claude.", status: "gap" },
  { capabilityId: "codebase-memory", label: "Codebase Memory", description: "Not yet scoped for Claude.", status: "gap" },
  { capabilityId: "rtk", label: "RTK", description: "Reuses the shared rtk binary on PATH; no MCP entry (add-claude-shared-capability-registry Phase 1).", status: "shared" },
  { capabilityId: "serena", label: "Serena", description: "Not yet scoped for Claude.", status: "gap" },
  { capabilityId: "context7", label: "Context7", description: "Not yet scoped for Claude.", status: "gap" },
  { capabilityId: "web-search", label: "Web Search", description: "Not yet scoped for Claude.", status: "gap" },
  { capabilityId: "supermemory-tool-bindings", label: "Supermemory", description: "Not yet scoped for Claude.", status: "gap" },
] as const);
