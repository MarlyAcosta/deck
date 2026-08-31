import { describe, expect, test } from "bun:test";
import { nativeClaudeModelAlias, canonicalModelIdFromNativeAlias } from "./models";

describe("nativeClaudeModelAlias", () => {
  test("maps every catalog entry to its confirmed-working alias", () => {
    expect(nativeClaudeModelAlias("anthropic/claude-sonnet-4")).toBe("sonnet");
    expect(nativeClaudeModelAlias("anthropic/claude-opus-4")).toBe("opus");
    expect(nativeClaudeModelAlias("anthropic/claude-haiku-4")).toBe("haiku");
  });

  test("returns undefined for the bare catalog ID without the anthropic/ prefix (confirmed live: also 404s)", () => {
    expect(nativeClaudeModelAlias("claude-opus-4")).toBeUndefined();
  });

  test("returns undefined for an unrecognized model, never a guess", () => {
    expect(nativeClaudeModelAlias("anthropic/claude-opus-99")).toBeUndefined();
    expect(nativeClaudeModelAlias(undefined)).toBeUndefined();
  });
});

describe("canonicalModelIdFromNativeAlias — exact inverse of nativeClaudeModelAlias", () => {
  test("round-trips every catalog entry", () => {
    for (const canonical of ["anthropic/claude-sonnet-4", "anthropic/claude-opus-4", "anthropic/claude-haiku-4"]) {
      const alias = nativeClaudeModelAlias(canonical);
      expect(canonicalModelIdFromNativeAlias(alias)).toBe(canonical);
    }
  });

  test("returns undefined for an alias with no known canonical mapping", () => {
    expect(canonicalModelIdFromNativeAlias("fable")).toBeUndefined();
    expect(canonicalModelIdFromNativeAlias(undefined)).toBeUndefined();
  });
});
