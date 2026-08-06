import { describe, expect, it } from "vitest";
import { analyzePasswordStrength } from "../password-security";

describe("analyzePasswordStrength", () => {
  it("flags common, sequential, and keyboard-like passwords", () => {
    expect(analyzePasswordStrength("password")).toMatchObject({ score: 1, findings: expect.arrayContaining(["common", "short"]) });
    expect(analyzePasswordStrength("12345678").findings).toContain("sequence");
    expect(analyzePasswordStrength("qwerty123").findings).toContain("keyboard");
  });

  it("recognizes long diverse generated passwords without claiming safety", () => {
    expect(analyzePasswordStrength("A9!very-long-random-secret-Z7")).toMatchObject({ score: 5, findings: expect.arrayContaining(["long", "diverse"]) });
  });
});
