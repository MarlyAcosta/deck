import type { ClaudeReleaseFixture } from "../../types";

/**
 * Real excerpts captured from `claude --help` (v2.1.251, authenticated local install,
 * 2026-08-29) — not paraphrased or reconstructed from documentation. Only the lines relevant
 * to flags Deck's compatibility checks and launch code depend on are kept, mirroring the
 * condensed-but-real style of packages/adapter-codex/src/__fixtures__/codex/releases.ts.
 *
 * Full raw capture (274 lines) lives alongside this change's openspec artifacts at
 * openspec/changes/add-claude-code-runner-support/ for anyone who wants to diff future
 * captures against it.
 */
const HELP_V2_1_251 = `Usage: claude [options] [command] [prompt]

Claude Code - starts an interactive session by default, use -p/--print for
non-interactive output

Options:
  --append-system-prompt <prompt>       Append a system prompt to the default
                                        system prompt
  --bare                                Minimal mode: skip hooks, LSP, plugin
                                        sync, attribution, auto-memory,
                                        background prefetches, keychain reads,
                                        and CLAUDE.md auto-discovery. Sets
                                        CLAUDE_CODE_SIMPLE=1. Anthropic auth is
                                        strictly ANTHROPIC_API_KEY or
                                        apiKeyHelper via --settings (OAuth and
                                        keychain are never read).
  -c, --continue                        Continue the most recent conversation in
                                        the current directory
  --dangerously-skip-permissions        Bypass all permission checks.
                                        Recommended only for sandboxes with no
                                        internet access.
  --allow-dangerously-skip-permissions  Enable bypassing all permission checks
                                        as an option, without it being enabled
                                        by default. Recommended only for
                                        sandboxes with no internet access.
  --mcp-config <configs...>             Load MCP servers from JSON files or
                                        strings (space-separated)
  --model <model>                       Model for the current session. Provide
                                        an alias for the latest model (e.g.
                                        'fable', 'opus', or 'sonnet') or a
                                        model's full name.
  --output-format <format>              Output format (only works with --print):
                                        "text" (default), "json" (single
                                        result), or "stream-json" (realtime
                                        streaming) (choices: "text", "json",
                                        "stream-json")
  --permission-mode <mode>              Permission mode to use for the session
                                        (choices: "acceptEdits", "auto",
                                        "bypassPermissions", "manual",
                                        "dontAsk", "plan")
  -p, --print                           Print response and exit (useful for
                                        pipes). Note: The workspace trust dialog
                                        is skipped when Claude is run in
                                        non-interactive mode (via -p).
  --restricted                          Restricted mode: removes the built-in
                                        tools that run commands or code (Bash,
                                        PowerShell, REPL and the other
                                        command-running tools).
  -r, --resume [value]                  Resume a conversation by session ID, or
                                        open interactive picker with optional
                                        search term
  --session-id <uuid>                   Use a specific session ID for the
                                        conversation (must be a valid UUID)
  --setting-sources <sources>           Comma-separated list of setting sources
                                        to load (user, project, local).
  --settings <file-or-json>             Path to a settings JSON file or a JSON
                                        string to load additional settings from
  --strict-mcp-config                   Only use MCP servers from --mcp-config,
                                        ignoring all other MCP configurations
  --system-prompt <prompt>              System prompt to use for the session

Commands:
  auth                                  Manage authentication
  setup-token                           Set up a long-lived authentication token`;

function captured(version: string): ClaudeReleaseFixture {
  return {
    version,
    capturedFrom: [`claude --help (${version}, authenticated local install)`],
    help: HELP_V2_1_251,
  };
}

/** Indexed by version so compatibility.ts can look up an exact or closest-known fixture. */
export const CAPTURED_CLAUDE_RELEASE_FIXTURES: Readonly<Record<string, ClaudeReleaseFixture>> = Object.freeze({
  "2.1.251": captured("2.1.251"),
});
