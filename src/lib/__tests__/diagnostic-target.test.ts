import { describe, expect, it } from "vitest";
import { normalizeDiagnosticTarget, parseWebsiteTarget } from "@/lib/diagnostic-target";

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

describe("parseWebsiteTarget", () => {
  it.each([
    ["https://user:secret@example.com:443/private?token=secret#fragment", "example.com"],
    [" Example.COM. ", "example.com"],
    ["example.com/path?q=secret", "example.com"],
    ["https://例子.中国/path", "xn--fsqu00a.xn--fiqs8s"],
    ["https://[2001:db8::1]/path", "[2001:db8::1]"],
    ["192.0.2.1", "192.0.2.1"],
  ])("passes only the hostname from %s", (input, expected) => {
    expect(parseWebsiteTarget(input)).toBe(expected);
  });
  it.each(["", "   ", "not a domain", "https://", "javascript:alert(1)", "ftp://example.com", "-bad.example", "a..example", "999.999.999.999"])("rejects %s without navigation", (input) => {
    expect(parseWebsiteTarget(input)).toBeNull();
  });
});
