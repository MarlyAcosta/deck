import { describe, expect, test } from "bun:test";
import { homedir } from "node:os";

import { resolveClaudeInstallRoot } from "./install-root";

describe("resolveClaudeInstallRoot", () => {
  test("always resolves to the real home directory, no scope choice", () => {
    expect(resolveClaudeInstallRoot()).toBe(homedir());
  });

  test("is pure: calling it repeatedly returns the same output, no side effects", () => {
    expect(resolveClaudeInstallRoot()).toBe(resolveClaudeInstallRoot());
  });
});
