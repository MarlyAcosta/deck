import type { RunnerProjectInspection } from "@deck/core";
import { inspectClaudeCompatibility, findClaudeFixture } from "./compatibility";

export type ClaudeProbeResult = { found: false } | { found: true; version: string; help: string };

export type ClaudePreflightEffects = {
  probe(): Promise<ClaudeProbeResult>;
};

/**
 * Task 1.2: real detection beyond apps/cli/src/runtime-detection.ts's PATH-only check.
 * Distinguishes "binary present" from "binary present and launch-compatible" per
 * REQ-CLD-COMPAT-002 by matching the probed version against a captured compatibility fixture.
 */
export async function inspectClaudeProject(
  projectRoot: string,
  effects: ClaudePreflightEffects,
): Promise<RunnerProjectInspection> {
  const probe = await effects.probe();
  if (!probe.found) {
    return {
      projectRoot,
      state: "blocked",
      evidence: { binary: false },
      diagnostics: [{ code: "claude-binary-missing", severity: "error", message: "Claude Code CLI was not found on PATH." }],
    };
  }

  const fixture = findClaudeFixture(probe.version);
  if (!fixture) {
    return {
      projectRoot,
      state: "degraded",
      evidence: { binary: true, version: probe.version, recognizedVersion: false },
      diagnostics: [{
        code: "claude-version-unrecognized",
        severity: "warning",
        message: `Claude Code ${probe.version} has no captured compatibility fixture; launch-mode support is unverified for this exact version.`,
      }],
    };
  }

  const compat = inspectClaudeCompatibility(fixture);
  return {
    projectRoot,
    state: "ready",
    evidence: {
      binary: true,
      version: probe.version,
      recognizedVersion: true,
      interactive: compat.launch.interactive,
      exec: compat.launch.exec,
      resumeById: compat.launch.resumeById,
      resumeLatest: compat.launch.resumeLatest,
      launchPolicySupported: compat.launchPolicy.supported,
      executionClass: "static-compatible",
    },
    diagnostics: [],
  };
}
