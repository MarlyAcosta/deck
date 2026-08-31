import { describe, expect, test } from "bun:test";
import { mergeClaudeMd, CLAUDE_MD_START, CLAUDE_MD_END } from "./claude-md";

describe("mergeClaudeMd", () => {
  test("appends a new marker block to an empty file", () => {
    const result = mergeClaudeMd("", undefined);
    expect(result.collision).toBeUndefined();
    expect(result.content).toContain(CLAUDE_MD_START);
    expect(result.content).toContain(CLAUDE_MD_END);
  });

  test("preserves existing unowned content exactly, appending after it", () => {
    const source = "# My Project\n\nSome notes I wrote by hand.\n";
    const result = mergeClaudeMd(source, undefined);
    expect(result.content!.startsWith(source)).toBe(true);
  });

  test("updates only the marker span on a second merge, leaving surrounding content untouched", () => {
    const source = "# Before\n\nuser text\n";
    const first = mergeClaudeMd(source, undefined);
    const second = mergeClaudeMd(first.content!, undefined);
    expect(second.content).toBe(first.content);
    expect(second.content).toContain("# Before");
    expect(second.content).toContain("user text");
  });

  test("preserves user content both before and after the marker span", () => {
    const withMarkers = `before\n${CLAUDE_MD_START}\nold deck content\n${CLAUDE_MD_END}\nafter`;
    const result = mergeClaudeMd(withMarkers, undefined);
    expect(result.content).toContain("before");
    expect(result.content).toContain("after");
    expect(result.content).not.toContain("old deck content");
  });

  test("blocks on duplicate markers instead of guessing", () => {
    const malformed = `${CLAUDE_MD_START}\na\n${CLAUDE_MD_END}\n${CLAUDE_MD_START}\nb\n${CLAUDE_MD_END}`;
    const result = mergeClaudeMd(malformed, undefined);
    expect(result.collision).toBeDefined();
    expect(result.content).toBeUndefined();
  });

  test("blocks on a start marker with no matching end", () => {
    const malformed = `${CLAUDE_MD_START}\nunterminated`;
    const result = mergeClaudeMd(malformed, undefined);
    expect(result.collision).toBeDefined();
  });
});
