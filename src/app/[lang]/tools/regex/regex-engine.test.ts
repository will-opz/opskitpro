import { describe, expect, it } from "vitest";
import { executeRegex, REGEX_MATCH_LIMIT, REGEX_PATTERN_LIMIT, REGEX_TEXT_LIMIT } from "./regex-engine";

describe("executeRegex", () => {
  it("collects global matches and capture groups", () => {
    const result = executeRegex("(\\w+)@(\\w+\\.\\w+)", "gi", "A a@example.com and b@test.dev");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches).toHaveLength(2);
    expect(result.matches[0]).toMatchObject({ value: "a@example.com", index: 2, end: 15 });
    expect(result.matches[0].groups.map((group) => group.value)).toEqual(["a", "example.com"]);
  });

  it("returns one match without global or sticky flags", () => {
    const result = executeRegex("a", "", "aaa");
    expect(result.ok && result.matches).toHaveLength(1);
  });

  it("handles zero-length unicode matches without looping forever", () => {
    const result = executeRegex("(?=.)", "gu", "😀a");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches.map((match) => match.index)).toEqual([0, 2]);
    expect(result.matches.every((match) => match.zeroLength)).toBe(true);
  });

  it("reports syntax and size failures", () => {
    expect(executeRegex("(", "g", "x")).toMatchObject({ ok: false, code: "syntax" });
    expect(executeRegex("a".repeat(REGEX_PATTERN_LIMIT + 1), "g", "x")).toMatchObject({ ok: false, code: "pattern_limit" });
    expect(executeRegex("a", "g", "x".repeat(REGEX_TEXT_LIMIT + 1))).toMatchObject({ ok: false, code: "text_limit" });
  });

  it("caps very large match sets", () => {
    const result = executeRegex("a", "g", "a".repeat(REGEX_MATCH_LIMIT + 1));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches).toHaveLength(REGEX_MATCH_LIMIT);
    expect(result.truncated).toBe(true);
  });

  it("preserves named capture groups", () => {
    const result = executeRegex("(?<word>\\p{L}+)", "gu", "中文 test");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.matches[0].groups).toContainEqual({ name: "word", value: "中文" });
  });
});
