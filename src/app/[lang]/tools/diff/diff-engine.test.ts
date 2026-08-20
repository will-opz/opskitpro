import { describe, expect, it } from "vitest";

import { createTextDiff, DIFF_CHARACTER_LIMIT, DIFF_LINE_LIMIT } from "./diff-engine";

const strict = { ignoreCase: false, ignoreTrailingWhitespace: false };

describe("createTextDiff", () => {
  it("returns line-level additions, deletions, line numbers, and change blocks", () => {
    const result = createTextDiff("alpha\nbeta\ngamma", "alpha\nBETA\ndelta\ngamma", strict);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.stats).toEqual({ additions: 2, deletions: 1, unchanged: 2, changeBlocks: 1 });
    expect(result.hunks[1]).toMatchObject({
      type: "change",
      oldLines: [{ text: "beta", lineNumber: 2 }],
      newLines: [{ text: "BETA", lineNumber: 2 }, { text: "delta", lineNumber: 3 }],
    });
  });

  it("distinguishes an added final newline", () => {
    const result = createTextDiff("alpha", "alpha\n", strict);
    expect(result.ok && result.stats).toEqual({ additions: 1, deletions: 0, unchanged: 1, changeBlocks: 1 });
    if (!result.ok) return;
    expect(result.hunks.at(-1)?.newLines[0]).toEqual({ text: "", lineNumber: 2 });
  });

  it("normalizes CRLF but keeps empty lines", () => {
    const result = createTextDiff("a\r\n\r\nb", "a\n\nb", strict);
    expect(result.ok && result.different).toBe(false);
    expect(result.ok && result.stats.unchanged).toBe(3);
  });

  it("supports explicit ignore options without replacing displayed text", () => {
    const result = createTextDiff("Hello   ", "hello", { ignoreCase: true, ignoreTrailingWhitespace: true });
    expect(result.ok && result.different).toBe(false);
    if (!result.ok) return;
    expect(result.hunks[0].oldLines[0].text).toBe("Hello   ");
    expect(result.hunks[0].newLines[0].text).toBe("hello");
  });

  it("handles empty, Chinese, emoji, and repeated lines", () => {
    expect(createTextDiff("", "", strict)).toMatchObject({ ok: true, different: false });
    const result = createTextDiff("中文\n😀\n重复\n重复", "中文\n😃\n重复", strict);
    expect(result.ok && result.stats).toEqual({ additions: 1, deletions: 2, unchanged: 2, changeBlocks: 2 });
  });

  it("rejects character and line limits before diffing", () => {
    expect(createTextDiff("x".repeat(DIFF_CHARACTER_LIMIT + 1), "", strict)).toMatchObject({ ok: false, code: "character_limit" });
    expect(createTextDiff(Array(DIFF_LINE_LIMIT + 1).fill("x").join("\n"), "", strict)).toMatchObject({ ok: false, code: "line_limit" });
  });
});
