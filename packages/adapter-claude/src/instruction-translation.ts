/**
 * Instruction translation for Claude Code (REQ-CLD-TRN-001/002).
 *
 * Unlike Codex's `packages/adapter-codex/src/instruction-translation.ts`, which has to actively
 * rewrite Claude-native vocabulary (hook interception of Grep/Glob, WebFetch, "Read/Grep/Glob"
 * as built-ins) out of the shared instruction bundles, this is a near-identity pass-through:
 * the bundles were already written in Claude Code's own vocabulary. This was confirmed by
 * reading Codex's translator during exploration — its forbidden-terms list includes "Claude
 * Code" itself, proving the source text assumes it as the reference runner.
 */

/** Terms belonging to another runner that must never leak into materialized Claude content. */
const FORBIDDEN_TERMS = /\bOpenCode\b|\bCodex\b|adapter-opencode|adapter-codex|--opencode\b/;

/** Identity pass-through — no rewriting needed. Kept as a named function so call sites read the
 * same way as Codex's translator, and so future content changes have an obvious place to add a
 * real rewrite rule if one is ever needed. */
export function translateClaudeCapabilityInstructions(markdown: string): string {
  return markdown;
}

export type ClaudeInstructionTranslationViolation = {
  line: number;
  match: string;
};

/**
 * Fails if any foreign-runner vocabulary is present in translated content. Mirrors Codex's
 * `validateCodexInstructionTranslation` guard exactly in spirit — even though this translator is
 * an identity function today, the validator still runs on every materialized file so a future
 * content change that accidentally introduces runner-specific vocabulary is caught immediately
 * rather than silently shipped.
 */
export function validateClaudeInstructionTranslation(markdown: string): readonly ClaudeInstructionTranslationViolation[] {
  const violations: ClaudeInstructionTranslationViolation[] = [];
  const lines = markdown.split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index]!.match(FORBIDDEN_TERMS);
    if (match) violations.push({ line: index + 1, match: match[0] });
  }
  return violations;
}
