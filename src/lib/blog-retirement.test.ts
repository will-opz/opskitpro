import { describe, expect, it } from "vitest";

import {
  getRetiredBlogDestination,
  retiredBlogSlugs,
} from "./blog-retirement";

describe("retired Blog redirects", () => {
  it("preserves all 26 published slugs", () => {
    expect(retiredBlogSlugs).toHaveLength(26);
  });

  it.each([
    ["cloudflare-522", "/tools/website-check"],
    ["network-metric-observation-point", "/tools/network-check"],
    ["ip-dns-module", "/tools/dns-lookup"],
    ["public-api-error-contract-for-diagnostic-tools", "/tools/api"],
    ["passgen-tool", "/tools/passgen"],
    ["vibe-coding-workflow", "/tools/prompt-builder"],
    ["why-opskitpro", "/tools"],
  ])("maps %s to %s", (slug, destination) => {
    expect(getRetiredBlogDestination(slug)).toBe(destination);
  });

  it("does not redirect unknown slugs", () => {
    expect(getRetiredBlogDestination("not-a-real-post")).toBeUndefined();
  });
});
