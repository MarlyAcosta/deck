import {
  MAX_RUNNER_STDIN_PAYLOAD_BYTES,
  type RunnerLaunchInput,
  type RunnerLaunchResult,
  type RunnerDiagnostic,
  type RunnerStdinPayload,
} from "@deck/core";

import { CLAUDE_LAUNCH_POLICY_FLAG, CLAUDE_LAUNCH_POLICY_VALUE } from "./compatibility";

export type ClaudeLaunchFeatures = {
  interactive: boolean;
  /** `-p`/`--print` headless mode. */
  exec: boolean;
  resumeById: boolean;
  resumeLatest: boolean;
};

/**
 * A short, bounded pointer/override appended via `--append-system-prompt` for a new session.
 * This is NOT where full Developer Team role content lives — that's materialized to
 * `.claude/agents/*.md` files in Phase 3. This is Deck's equivalent of Codex's
 * `-c developer_instructions=...` bootstrap: a small nudge, not the whole prompt.
 */
export type ClaudeNewSessionBootstrap = Readonly<{
  systemPromptAppend: string;
}>;

const MAX_CLAUDE_BOOTSTRAP_BYTES = 4096;

/**
 * Deck's fixed launch-policy token, confirmed live in Phase 0 (design.md "Deck's fixed
 * launch-policy token"): `--permission-mode bypassPermissions` works; the name-similar
 * `--dangerously-skip-permissions` (with or without `--allow-dangerously-skip-permissions`) is
 * blocked by an undocumented "Claude Code auto mode classifier" and does not work.
 */
export const CLAUDE_LAUNCH_POLICY_DIAGNOSTIC: Readonly<RunnerDiagnostic> = {
  code: "claude-launch-policy-bypass",
  severity: "warning",
  message: `Deck always launches Claude Code Developer Team sessions with ${CLAUDE_LAUNCH_POLICY_FLAG} ${CLAUDE_LAUNCH_POLICY_VALUE}; tool-use permission prompts are skipped for that session. Confirmed live in Phase 0 (openspec/changes/add-claude-code-runner-support/design.md) — the name-similar --dangerously-skip-permissions does not work.`,
};

function safeBoundedString(value: string, limit: number): string | undefined {
  if (!value || value.includes("\0") || Buffer.byteLength(value, "utf8") > limit) return undefined;
  return value;
}

function safeStdinContent(value: string): string | undefined {
  if (value.includes("\0") || Buffer.byteLength(value, "utf8") > MAX_RUNNER_STDIN_PAYLOAD_BYTES) return undefined;
  return value;
}

function isReservedPolicyAlias(value: string): boolean {
  return value === CLAUDE_LAUNCH_POLICY_FLAG || value === CLAUDE_LAUNCH_POLICY_VALUE;
}

/** Bounded, non-option, single-line scalar safe to place directly in argv. */
export function isSafeClaudeLaunchScalar(value: string | undefined): value is string {
  return Boolean(
    value
    && value.trim() === value
    && !value.startsWith("-")
    && !isReservedPolicyAlias(value)
    && !value.includes("\0")
    && !value.includes("\r")
    && !value.includes("\n")
    && Buffer.byteLength(value, "utf8") <= 1024,
  );
}

function safeClaudeScalar(value: string | undefined): string | undefined {
  return isSafeClaudeLaunchScalar(value) ? value : undefined;
}

function invalidLaunchScalar(field: "model" | "reasoning"): RunnerLaunchResult {
  return {
    status: "blocked",
    code: "claude-invalid-launch-scalar",
    diagnostics: [{
      code: "invalid-launch-scalar",
      severity: "error",
      message: `Claude ${field} values must be bounded non-option scalars and cannot override Deck's reserved launch policy token.`,
    }],
  };
}

/** Deck's launch-policy token must be present, first, and exactly once — never assembled from caller input. */
function hasOwnedLaunchPolicy(args: readonly string[]): boolean {
  return args[0] === CLAUDE_LAUNCH_POLICY_FLAG
    && args[1] === CLAUDE_LAUNCH_POLICY_VALUE
    && args.filter((arg) => arg === CLAUDE_LAUNCH_POLICY_FLAG).length === 1;
}

function isValidSessionId(sessionId: string): boolean {
  return sessionId.length > 0 && !sessionId.startsWith("-") && !/[\0\r\n]/.test(sessionId);
}

function execPayload(input: Extract<RunnerLaunchInput, { mode: "exec" }>): RunnerStdinPayload | undefined {
  const payload = input.stdinPayload ?? { type: "utf8" as const, content: input.prompt.join(" ") };
  if (payload.type !== "utf8" || safeStdinContent(payload.content) === undefined) return undefined;
  return payload;
}

export function buildClaudeLaunchPlan(
  input: RunnerLaunchInput,
  features: ClaudeLaunchFeatures,
  bootstrap?: ClaudeNewSessionBootstrap,
  /**
   * Confirmed live in Phase 4 against a real install: `--effort <level>` (choices `low`,
   * `medium`, `high`, `xhigh`, `max`, parsed dynamically by compatibility.ts, never hardcoded
   * here). An unrecognized value is validated and rejected by Deck itself rather than relying
   * on the binary's own graceful-degrade-with-a-stderr-warning behavior (also confirmed live) —
   * Deck fails closed on its own terms instead of depending on that fallback.
   */
  availableEffortLevels: readonly string[] = [],
): RunnerLaunchResult {
  const capability = input.mode === "resume-by-id" ? "resumeById" : input.mode === "resume-latest" ? "resumeLatest" : input.mode;
  if (!features[capability]) {
    return {
      status: "unsupported",
      code: `claude-${input.mode}-unsupported`,
      diagnostics: [{ code: "unsupported-launch-mode", severity: "error", message: `The inspected Claude Code release does not support ${input.mode}.` }],
    };
  }

  if (input.mode === "resume-by-id" && !isValidSessionId(input.sessionId)) {
    return {
      status: "blocked",
      code: "claude-invalid-session-id",
      diagnostics: [{ code: "invalid-session-id", severity: "error", message: "Resume session IDs must be opaque non-option values." }],
    };
  }

  const newSession = input.mode === "interactive" || input.mode === "exec";
  if (newSession && input.modelId !== undefined && !safeClaudeScalar(input.modelId)) return invalidLaunchScalar("model");
  if (newSession && input.reasoningLevel !== undefined
    && (!safeClaudeScalar(input.reasoningLevel) || !availableEffortLevels.includes(input.reasoningLevel))) {
    return invalidLaunchScalar("reasoning");
  }

  const args: string[] = [CLAUDE_LAUNCH_POLICY_FLAG, CLAUDE_LAUNCH_POLICY_VALUE];

  if (newSession && bootstrap) {
    const systemPromptAppend = safeBoundedString(bootstrap.systemPromptAppend, MAX_CLAUDE_BOOTSTRAP_BYTES);
    if (!systemPromptAppend) {
      return {
        status: "blocked",
        code: "claude-invalid-bootstrap",
        diagnostics: [{ code: "invalid-bootstrap", severity: "error", message: "Deck's per-launch system-prompt override is invalid and was not launched." }],
      };
    }
    args.push("--append-system-prompt", systemPromptAppend);
  }

  if (newSession) {
    const modelId = safeClaudeScalar(input.modelId);
    if (modelId) args.push("--model", modelId);
    const reasoningLevel = safeClaudeScalar(input.reasoningLevel);
    if (reasoningLevel && availableEffortLevels.includes(reasoningLevel)) args.push("--effort", reasoningLevel);
  }

  let stdinPayload: RunnerStdinPayload | undefined;

  if (input.mode === "exec") {
    stdinPayload = execPayload(input);
    if (!stdinPayload) {
      return {
        status: "blocked",
        code: "claude-invalid-exec-prompt",
        diagnostics: [{ code: "invalid-exec-prompt", severity: "error", message: "Claude exec prompt is invalid or exceeds the supported stdin payload limit." }],
      };
    }
    // Confirmed live in Phase 0: -p --output-format json prints the full result object
    // (including `result`, `session_id`, `is_error`, `total_cost_usd`, `usage`) to stdout —
    // there is no --output-last-message-style file flag, unlike Codex.
    args.push("-p", "--output-format", "json");
  }
  if (input.mode === "resume-by-id") args.push("--resume", input.sessionId);
  if (input.mode === "resume-latest") args.push("--continue");

  if (!hasOwnedLaunchPolicy(args)) {
    return {
      status: "blocked",
      code: "claude-launch-policy-invariant",
      diagnostics: [{
        code: "launch-policy-invariant",
        severity: "error",
        message: "Deck rejected the Claude launch because argv violates its reserved launch-policy invariant.",
      }],
    };
  }

  return {
    status: "ready",
    plan: {
      command: "claude",
      args,
      cwd: input.projectRoot,
      stdio: input.mode === "exec" ? "pipe" : "inherit",
      stdin: input.mode === "exec" ? "closed" : "inherit",
      ...(stdinPayload ? { stdinPayload } : {}),
      executionClass: "static-compatible",
      ...(input.mode === "exec" ? { captureLimitBytes: 1024 * 1024 } : {}),
      ...(input.mode === "exec"
        ? {
            // "stdout", not "file": Claude has no flag to write its own result to a path Deck
            // gives it (unlike Codex's --output-last-message), so the CLI reads the already-
            // captured, already-redacted process stdout instead of a filesystem path. See
            // design.md "Output capture" for why the original file-based plan was corrected.
            outputCapture: {
              finalAssistantMessage: {
                source: "stdout" as const,
                trust: "runner-native-final-assistant" as const,
                route: "claude-exec-stdout-json",
                maxBytes: 256 * 1024,
              },
            },
          }
        : {}),
    },
    diagnostics: [
      CLAUDE_LAUNCH_POLICY_DIAGNOSTIC,
      ...(newSession ? [] : [{
        code: "claude-resume-existing-history",
        severity: "info" as const,
        message: "Resume preserves existing Claude Code history; Deck's per-launch system-prompt override and model selection apply only to Deck-created new sessions.",
      }]),
      {
        code: "claude-static-compatible",
        severity: "warning" as const,
        message: "Claude Code content and launch are available, but protected Developer Team execution controls are not bridge-enforced in this route.",
      },
      ...(input.mode === "exec" ? [{
        code: "claude-output-capture-raw-json" as const,
        severity: "info" as const,
        message: "The captured final-assistant content is Claude's raw JSON result object, not extracted plain text; a Phase 4 follow-up should parse `result`/`is_error` for verification consumers.",
      }] : []),
    ],
  };
}
