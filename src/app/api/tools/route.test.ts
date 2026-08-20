import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /api/tools", () => {
  it("returns the versioned public tool manifest", async () => {
    const response = GET(new Request("https://opskitpro.com/api/tools"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toContain("max-age=3600");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("etag")).toMatch(/^"[a-f0-9]{8}"$/);
    expect(body.schemaVersion).toBe("opskitpro.tools.v1");
    expect(body.version).toBe("2.0.0");
    expect(body.tools).toHaveLength(23);
    expect(body.tools[0]).toMatchObject({
      id: "website-check",
      taskCategory: "website-network",
      processingMode: "network",
      networkPath: "mixed",
      requiresLogin: false,
      urls: {
        en: "https://opskitpro.com/en/tools/website-check",
        zh: "https://opskitpro.com/zh/tools/website-check",
      },
    });
  });

  it("returns 304 for a matching ETag", () => {
    const first = GET(new Request("https://opskitpro.com/api/tools"));
    const etag = first.headers.get("etag")!;
    const cached = GET(
      new Request("https://opskitpro.com/api/tools", {
        headers: { "if-none-match": etag },
      }),
    );

    expect(cached.status).toBe(304);
    expect(cached.headers.get("etag")).toBe(etag);
  });
});
