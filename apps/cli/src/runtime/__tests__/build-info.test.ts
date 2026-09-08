/**
 * Tests for apps/cli/src/runtime/build-info.ts.
 *
 * The production module reads a gitignored generated file
 * (build-info.generated.ts) that is absent in clean checkouts. To test
 * both the generated-metadata path and the dev-defaults fallback
 * deterministically — without mutating process.cwd, polluting the shared
 * module cache, or generating real build metadata — each test loads an
 * isolated copy of the unmodified production source from a fresh temp
 * directory. The temp directory optionally contains a fixture
 * generated module, so `require("./build-info.generated.js")` inside the
 * copied source resolves to the fixture (or fails, exercising fallback).
 */

import { describe, it, expect } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { BuildInfo } from "../build-info.js";

// Path to the unmodified production source (only imports node:os).
const PRODUCTION_SOURCE = join(import.meta.dir, "..", "build-info.ts");

const VALID_FIXTURE = `export const BUILD_INFO = {
  version: "1.2.3",
  commit: "abc123def",
  date: "2026-01-15",
  target: "linux-x64",
  channel: "stable",
} as const;
`;

/**
 * Load an isolated copy of the production build-info module with an
 * optional fixture generated module.
 *
 * Each call creates a fresh temp directory, copies the unmodified
 * production source into it, and (if fixtureContent is non-null) writes
 * a fixture build-info.generated.ts alongside it. The module is then
 * dynamically imported, yielding an independent module instance with
 * its own `cachedBuildInfo` — no shared module cache, no process.cwd
 * mutation.
 */
async function loadIsolatedBuildInfo(
  fixtureContent: string | null,
): Promise<{ getBuildInfo: () => BuildInfo; dir: string }> {
  const dir = mkdtempSync(join(tmpdir(), "build-info-iso-"));
  copyFileSync(PRODUCTION_SOURCE, join(dir, "build-info.ts"));
  if (fixtureContent !== null) {
    writeFileSync(join(dir, "build-info.generated.ts"), fixtureContent);
  }
  const mod = await import(join(dir, "build-info.ts"));
  return { getBuildInfo: mod.getBuildInfo, dir };
}

describe("build-info", () => {
  it("returns generated build info when the generated module is available", async () => {
    const { getBuildInfo, dir } = await loadIsolatedBuildInfo(VALID_FIXTURE);
    try {
      const info = getBuildInfo();
      expect(info.version).toBe("1.2.3");
      expect(info.commit).toBe("abc123def");
      expect(info.date).toBe("2026-01-15");
      expect(info.target).toBe("linux-x64");
      expect(info.channel).toBe("stable");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("returns dev defaults when the generated module is not available", async () => {
    const { getBuildInfo, dir } = await loadIsolatedBuildInfo(null);
    try {
      const info = getBuildInfo();
      expect(info.version).toBe("0.0.0-dev");
      expect(info.commit).toBe("unknown");
      expect(info.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(info.target).toMatch(/^.+-.+$/);
      expect(["stable", "beta", "dev"]).toContain(info.channel);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("caches build info and returns consistent values on multiple calls", async () => {
    const { getBuildInfo, dir } = await loadIsolatedBuildInfo(VALID_FIXTURE);
    try {
      const info1 = getBuildInfo();
      const info2 = getBuildInfo();
      // Same cached reference — the module-level cache returns the
      // identical object on subsequent calls.
      expect(info1).toBe(info2);
      expect(info1.version).toBe(info2.version);
      expect(info1.commit).toBe(info2.commit);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("handles missing generated module gracefully without throwing", async () => {
    const { getBuildInfo, dir } = await loadIsolatedBuildInfo(null);
    try {
      expect(() => getBuildInfo()).not.toThrow();
      const info = getBuildInfo();
      expect(info.version).not.toBe("");
      expect(info.channel).toBeDefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
