import { describe, expect, it } from "vitest";

import { formatYaml, validateYaml } from "./yaml-engine";

describe("YAML engine", () => {
  it("formats valid YAML", () => {
    const result = formatYaml("a: 1\nb:\n  - c: 2\n");

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.formatted).toContain("a: 1");
    expect(result.formatted).toContain("- c: 2");
  });

  it("flags duplicate keys as invalid by default", () => {
    const result = validateYaml("a: 1\na: 2\n");

    expect(result.valid).toBe(false);
    expect(result.error?.reason).toContain("duplicated mapping key");
  });

  it("returns parser error with line and column", () => {
    const result = validateYaml("a: [1,\n");

    expect(result.valid).toBe(false);
    expect(result.error?.line).toBeGreaterThan(0);
    expect(result.error?.column).toBeGreaterThan(0);
    expect(result.error?.reason).toBeTruthy();
  });

  it("rejects empty input", () => {
    expect(validateYaml("   ").valid).toBe(false);
  });

  it("rejects oversized input", () => {
    const large = "a: 1\n".repeat(30_000);
    expect(large.length).toBeGreaterThan(50_000);
    expect(formatYaml(large).valid).toBe(false);
  });
});
