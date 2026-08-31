import type { ClaudeReleaseFixture } from "./types";
import { CAPTURED_CLAUDE_RELEASE_FIXTURES } from "./__fixtures__/claude/releases";

/** Captured from a real authenticated local install; tests consume these without network access. */
export const CLAUDE_RELEASE_FIXTURES = CAPTURED_CLAUDE_RELEASE_FIXTURES;

/**
 * Deck's fixed launch-policy token, confirmed live in Phase 0 (see
 * openspec/changes/add-claude-code-runner-support/design.md "Deck's fixed launch-policy
 * token"). `--dangerously-skip-permissions` (with or without
 * `--allow-dangerously-skip-permissions`) was tested and is blocked by an undocumented
 * "Claude Code auto mode classifier" even with the flag present; `--permission-mode
 * bypassPermissions` was tested and works.
 */
export const CLAUDE_LAUNCH_POLICY_FLAG = "--permission-mode";
export const CLAUDE_LAUNCH_POLICY_VALUE = "bypassPermissions";

export type ClaudeCompatibility = {
  version: string;
  launch: {
    interactive: boolean;
    /** `-p`/`--print` headless mode. */
    exec: boolean;
    resumeById: boolean;
    resumeLatest: boolean;
  };
  outputFormats: {
    json: boolean;
    streamJson: boolean;
  };
  appendSystemPrompt: boolean;
  launchPolicy: {
    /** True only if the confirmed-working mechanism (--permission-mode bypassPermissions) is present. */
    supported: boolean;
  };
  mcp: {
    /** `--mcp-config` — inline/file MCP server loading for a single launch. */
    inlineConfig: boolean;
  };
  settings: {
    /** `--settings <file-or-json>` — project-local or ephemeral settings, distinct from ~/.claude/settings.json. */
    override: boolean;
  };
  bare: boolean;
  /**
   * `--effort <level>` — Claude Code's thinking/reasoning-effort control (added in Phase 4;
   * missed in the original Phase 0 excerpt). Levels are parsed from the live help text, not
   * hardcoded, matching the same "derive from what was actually probed" discipline as every
   * other field here — if a future release renames or reorders the choices, this reflects it
   * automatically instead of silently going stale.
   */
  effort: {
    supported: boolean;
    levels: readonly string[];
  };
};

function has(help: string, needle: string | RegExp): boolean {
  return typeof needle === "string" ? help.includes(needle) : needle.test(help);
}

/** Parses `--effort <level> ... (low, medium, high, xhigh, max)` into an ordered level list. */
function parseEffortLevels(help: string): readonly string[] {
  const match = help.match(/--effort <level>[\s\S]{0,120}\(([a-z, ]+)\)/);
  if (!match) return [];
  return match[1]!.split(",").map((level) => level.trim()).filter(Boolean);
}

/**
 * Inspect a captured `claude --help` fixture and report which launch modes and flags are
 * actually present in that release. Deterministic and offline — no subprocess spawn, no
 * network. `packages/core/src/runner-adapter.ts` requires this before any launch code trusts a
 * flag exists for the detected version.
 */
export function inspectClaudeCompatibility(release: ClaudeReleaseFixture): ClaudeCompatibility {
  const { help } = release;
  return {
    version: release.version,
    launch: {
      interactive: /^Usage: claude /m.test(help),
      exec: has(help, /-p, --print/),
      resumeById: has(help, /-r, --resume/),
      resumeLatest: has(help, /-c, --continue/),
    },
    outputFormats: {
      json: /--output-format <format>[\s\S]{0,200}"json"/.test(help),
      streamJson: /--output-format <format>[\s\S]{0,200}"stream-json"/.test(help),
    },
    appendSystemPrompt: has(help, "--append-system-prompt"),
    launchPolicy: {
      supported: /--permission-mode <mode>[\s\S]{0,200}"bypassPermissions"/.test(help),
    },
    mcp: {
      inlineConfig: has(help, "--mcp-config"),
    },
    settings: {
      override: has(help, /--settings <file-or-json>/),
    },
    bare: has(help, "--bare"),
    effort: (() => {
      const levels = parseEffortLevels(help);
      return { supported: levels.length > 0, levels };
    })(),
  };
}

/** Look up a captured fixture for an exact detected version; undefined if never captured. */
export function findClaudeFixture(version: string): ClaudeReleaseFixture | undefined {
  return CLAUDE_RELEASE_FIXTURES[version];
}
