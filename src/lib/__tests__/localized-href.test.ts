import { describe, expect, it } from "vitest";
import { resolveLocalizedHref } from "../localized-href";

describe("resolveLocalizedHref", () => {
  it("prefixes locale-neutral internal paths", () => {
    expect(resolveLocalizedHref("zh", "/tools/website-check")).toBe(
      "/zh/tools/website-check",
    );
    expect(resolveLocalizedHref("en", "/")).toBe("/en");
    expect(resolveLocalizedHref("zh", "/tools/dns-lookup?tab=security")).toBe(
      "/zh/tools/dns-lookup?tab=security",
    );
  });

  it("does not duplicate an existing locale prefix", () => {
    expect(resolveLocalizedHref("zh", "/zh/tools/website-check")).toBe(
      "/zh/tools/website-check",
    );
    expect(resolveLocalizedHref("en", "/en/blog")).toBe("/en/blog");
  });

  it("keeps external and anchor URLs unchanged", () => {
    expect(resolveLocalizedHref("en", "https://example.com/docs")).toBe(
      "https://example.com/docs",
    );
    expect(resolveLocalizedHref("en", "#details")).toBe("#details");
  });

  it("uses the configured fallback for empty paths", () => {
    expect(resolveLocalizedHref("en", undefined)).toBe("#");
    expect(resolveLocalizedHref("en", "", "/en/blog")).toBe("/en/blog");
  });
});
