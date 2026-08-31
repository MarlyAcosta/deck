import type { RunnerProjectInspection } from "@deck/core";
import { inspectClaudeCompatibility } from "./compatibility";

export type ClaudeProbeResult = { found: false } | { found: true; version: string; help: string };

export type ClaudePreflightEffects = {
  probe(): Promise<ClaudeProbeResult>;
};

/**
 * Task 1.2: real detection beyond apps/cli/src/runtime-detection.ts's PATH-only check.
 * Distinguishes "binary present" from "binary present and launch-compatible" per
 * REQ-CLD-COMPAT-002.
 *
 * Compatibility is derived from the LIVE probed `--help` text, never from a static captured
 * fixture looked up by version number — matching Codex's `inspectCodexProject` precedent
 * exactly (`packages/adapter-codex/src/preflight.ts`), which parses `probe.help` directly. An
 * earlier draft looked up a fixture by version instead; that was wrong (caught by a failing
 * test, not by inspection) because it would report whatever a captured fixture said rather than
 * what the actually-installed binary actually does. Captured fixtures in
 * `__fixtures__/claude/releases.ts` exist only for compatibility.test.ts's offline determinism,
 * never for this runtime path.
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

  const compat = inspectClaudeCompatibility({
    version: probe.version,
    capturedFrom: [`live probe: claude --version / claude --help (${probe.version})`],
    help: probe.help,
  });

  return {
    projectRoot,
    state: "ready",
    evidence: {
      binary: true,
      version: probe.version,
      interactive: compat.launch.interactive,
      exec: compat.launch.exec,
      resumeById: compat.launch.resumeById,
      resumeLatest: compat.launch.resumeLatest,
      launchPolicySupported: compat.launchPolicy.supported,
      thinkingLevels: compat.effort.levels,
      executionClass: "static-compatible",
    },
    diagnostics: [],
  };
}
