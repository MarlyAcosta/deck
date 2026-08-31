import { describe, expect, test } from "bun:test";
import { buildClaudeLaunchPlan, isSafeClaudeLaunchScalar } from "./launch";
import type { RunnerLaunchInput } from "@deck/core";

const allFeatures = { interactive: true, exec: true, resumeById: true, resumeLatest: true };
const noFeatures = { interactive: false, exec: false, resumeById: false, resumeLatest: false };
const base = { projectRoot: "/p", teamId: "developer-team", deckConfig: undefined as never };

describe("isSafeClaudeLaunchScalar", () => {
  test("accepts a plain bounded value", () => expect(isSafeClaudeLaunchScalar("sonnet")).toBe(true));
  test("rejects an option-like value", () => expect(isSafeClaudeLaunchScalar("--permission-mode")).toBe(false));
  test("rejects the reserved policy flag and value by name", () => {
    expect(isSafeClaudeLaunchScalar("--permission-mode")).toBe(false);
    expect(isSafeClaudeLaunchScalar("bypassPermissions")).toBe(false);
  });
  test("rejects embedded control characters", () => {
    expect(isSafeClaudeLaunchScalar("a\nb")).toBe(false);
    expect(isSafeClaudeLaunchScalar("a\rb")).toBe(false);
    expect(isSafeClaudeLaunchScalar("a\0b")).toBe(false);
  });
  test("rejects values over 1024 bytes", () => expect(isSafeClaudeLaunchScalar("a".repeat(1025))).toBe(false));
  test("rejects leading/trailing whitespace", () => expect(isSafeClaudeLaunchScalar(" sonnet ")).toBe(false));
});

describe("buildClaudeLaunchPlan — unsupported modes", () => {
  test("returns unsupported (not blocked) when the feature flag is false", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "interactive" }, noFeatures);
    expect(result.status).toBe("unsupported");
    if (result.status === "ready") throw new Error("expected a non-ready result");
    expect(result.code).toBe("claude-interactive-unsupported");
  });
});

describe("buildClaudeLaunchPlan — resume-by-id safety", () => {
  test("blocks an empty session id", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "resume-by-id", sessionId: "" }, allFeatures);
    expect(result.status).toBe("blocked");
    if (result.status === "ready") throw new Error("expected a non-ready result");
    expect(result.code).toBe("claude-invalid-session-id");
  });
  test("blocks a session id that looks like a flag", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "resume-by-id", sessionId: "-x" }, allFeatures);
    expect(result.status).toBe("blocked");
  });
  test("blocks a session id containing a newline", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "resume-by-id", sessionId: "abc\ndef" }, allFeatures);
    expect(result.status).toBe("blocked");
  });
  test("accepts an opaque session id and places it after --resume", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "resume-by-id", sessionId: "session-123" }, allFeatures);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const idx = result.plan.args.indexOf("--resume");
    expect(idx).toBeGreaterThan(-1);
    expect(result.plan.args[idx + 1]).toBe("session-123");
  });
});

describe("buildClaudeLaunchPlan — model scalar safety", () => {
  test("blocks an unsafe modelId on a new session", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "interactive", modelId: "--permission-mode" }, allFeatures);
    expect(result.status).toBe("blocked");
    if (result.status === "ready") throw new Error("expected a non-ready result");
    expect(result.code).toBe("claude-invalid-launch-scalar");
  });
  test("passes a safe modelId through as --model", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "interactive", modelId: "opus" }, allFeatures);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const idx = result.plan.args.indexOf("--model");
    expect(result.plan.args[idx + 1]).toBe("opus");
  });
  test("resume modes never receive a --model override even if modelId is set", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "resume-latest", modelId: "opus" }, allFeatures);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.plan.args).not.toContain("--model");
  });
});

const effortLevels = ["low", "medium", "high", "xhigh", "max"];

describe("buildClaudeLaunchPlan — --effort (Phase 4, confirmed live)", () => {
  test("passes a recognized reasoningLevel through as --effort when it's in the advertised list", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "interactive", reasoningLevel: "high" }, allFeatures, undefined, effortLevels);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    const idx = result.plan.args.indexOf("--effort");
    expect(result.plan.args[idx + 1]).toBe("high");
  });

  test("blocks a reasoningLevel that is not in the advertised list, rather than passing it through and relying on the binary's own fallback", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "interactive", reasoningLevel: "bogus-level" }, allFeatures, undefined, effortLevels);
    expect(result.status).toBe("blocked");
    if (result.status === "ready") throw new Error("expected a non-ready result");
    expect(result.code).toBe("claude-invalid-launch-scalar");
  });

  test("omits --effort when no levels were advertised (unknown compatibility), never guessing", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "interactive", reasoningLevel: "high" }, allFeatures, undefined, []);
    expect(result.status).toBe("blocked");
  });

  test("resume modes never receive a --effort override even if reasoningLevel is set", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "resume-latest", reasoningLevel: "high" }, allFeatures, undefined, effortLevels);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.plan.args).not.toContain("--effort");
  });
});

describe("buildClaudeLaunchPlan — exec prompt delivery", () => {
  const execInput = (overrides: Partial<Extract<RunnerLaunchInput, { mode: "exec" }>> = {}): RunnerLaunchInput => ({
    ...base,
    mode: "exec",
    prompt: ["hello"],
    stdin: "closed",
    ...overrides,
  });

  test("never places the prompt in argv", () => {
    const result = buildClaudeLaunchPlan(execInput({ stdinPayload: { type: "utf8", content: "sensitive prompt text" } }), allFeatures);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.plan.args.join(" ")).not.toContain("sensitive prompt text");
    expect(result.plan.stdinPayload?.content).toBe("sensitive prompt text");
  });

  test("blocks an oversized stdin payload", () => {
    const oversized = "a".repeat(64 * 1024 + 1);
    const result = buildClaudeLaunchPlan(execInput({ stdinPayload: { type: "utf8", content: oversized } }), allFeatures);
    expect(result.status).toBe("blocked");
    if (result.status === "ready") throw new Error("expected a non-ready result");
    expect(result.code).toBe("claude-invalid-exec-prompt");
  });

  test("uses -p --output-format json and pipes stdio", () => {
    const result = buildClaudeLaunchPlan(execInput({ stdinPayload: { type: "utf8", content: "x" } }), allFeatures);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.plan.args).toEqual(expect.arrayContaining(["-p", "--output-format", "json"]));
    expect(result.plan.stdio).toBe("pipe");
    expect(result.plan.stdin).toBe("closed");
  });
});

describe("buildClaudeLaunchPlan — the owned launch-policy token", () => {
  test("is always the first two argv tokens, exactly once", () => {
    for (const mode of ["interactive", "resume-latest"] as const) {
      const result = buildClaudeLaunchPlan({ ...base, mode }, allFeatures);
      expect(result.status).toBe("ready");
      if (result.status !== "ready") continue;
      expect(result.plan.args[0]).toBe("--permission-mode");
      expect(result.plan.args[1]).toBe("bypassPermissions");
      expect(result.plan.args.filter((a) => a === "--permission-mode").length).toBe(1);
    }
  });

  test("surfaces the always-on policy as a visible diagnostic", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "interactive" }, allFeatures);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.diagnostics.some((d) => d.code === "claude-launch-policy-bypass")).toBe(true);
  });
});

describe("buildClaudeLaunchPlan — resume preserves history", () => {
  test("resume-by-id gets an informational diagnostic that bootstrap/model apply only to new sessions", () => {
    const result = buildClaudeLaunchPlan({ ...base, mode: "resume-by-id", sessionId: "s1" }, allFeatures);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.diagnostics.some((d) => d.code === "claude-resume-existing-history")).toBe(true);
  });
});
