/**
 * Maps Deck's canonical model catalog IDs (`packages/core/src/model-catalog.ts`) to Claude
 * Code's own native `--model` aliases.
 *
 * REAL BUG this fixes, caught in Phase 4 by testing live rather than assumed correct in Phase 2:
 * `buildClaudeLaunchPlan` originally passed `input.modelId` straight through to `--model`
 * unmapped. Tested live: neither the bare catalog ID (`claude-opus-4`) nor the fully-qualified
 * one (`anthropic/claude-opus-4`) resolves — both return `is_error: true, api_error_status:
 * 404`. Only Claude Code's own bare aliases (`sonnet`, `opus`, `haiku`) work. This slipped past
 * Phase 2 verification because that phase's own live smoke test happened to pass a bare alias
 * (`"haiku"`) directly rather than exercising the real catalog-ID path a caller going through
 * `getModelCatalog()` would actually use.
 */
const CANONICAL_TO_NATIVE_ALIAS: Readonly<Record<string, string>> = Object.freeze({
  "anthropic/claude-sonnet-4": "sonnet",
  "anthropic/claude-opus-4": "opus",
  "anthropic/claude-haiku-4": "haiku",
});

/**
 * Resolve a Deck canonical model ID to Claude Code's native `--model` alias. Returns undefined
 * for anything unrecognized — REQ-CLD-MDL-002: unknown/unconfirmed values are omitted, never
 * passed through and never fabricated as a guess.
 */
export function nativeClaudeModelAlias(catalogModelId: string | undefined): string | undefined {
  if (!catalogModelId) return undefined;
  return CANONICAL_TO_NATIVE_ALIAS[catalogModelId];
}

const NATIVE_ALIAS_TO_CANONICAL: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(Object.entries(CANONICAL_TO_NATIVE_ALIAS).map(([canonical, alias]) => [alias, canonical])),
);

/** The reverse of `nativeClaudeModelAlias` — used to read a materialized agent file's `model:` back into Deck's canonical catalog ID. */
export function canonicalModelIdFromNativeAlias(nativeAlias: string | undefined): string | undefined {
  if (!nativeAlias) return undefined;
  return NATIVE_ALIAS_TO_CANONICAL[nativeAlias];
}
