import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

import robots from "./robots";

describe("robots metadata", () => {
  it("has no public file that can shadow the metadata route", () => {
    expect(existsSync(join(process.cwd(), "public", "robots.txt"))).toBe(false);
  });

  it("allows search and user-request crawlers while blocking training crawlers", () => {
    const metadata = robots();

    expect(metadata.rules).toEqual([
      {
        userAgent: [
          "OAI-SearchBot",
          "PerplexityBot",
          "Claude-SearchBot",
          "Claude-User",
          "Googlebot",
          "Google-Extended",
        ],
        allow: "/",
      },
      {
        userAgent: ["GPTBot", "ClaudeBot"],
        disallow: "/",
      },
      {
        userAgent: "*",
        allow: "/",
      },
    ]);
    expect(metadata.sitemap).toBe("https://opskitpro.com/sitemap.xml");
    expect(metadata.host).toBe("https://opskitpro.com");
  });
});
