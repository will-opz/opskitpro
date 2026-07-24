import { describe, expect, it } from "vitest";
import { normalizeDiagnosticTarget } from "@/lib/diagnostic-target";

describe("normalizeDiagnosticTarget", () => {
  it.each([
    [" example.com. ", "example.com"],
    ["https://example.com/path?q=1", "example.com"],
    ["http://sub.example.com:8080/a", "sub.example.com"],
    ["192.0.2.10:443", "192.0.2.10"],
    ["", ""],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeDiagnosticTarget(input)).toBe(expected);
  });
});
