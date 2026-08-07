import { describe, expect, it } from "vitest";

import { GET } from "./route";

describe("GET /llms.txt", () => {
  it("returns a concise catalog generated from first-party tools", async () => {
    const response = GET(new Request("https://opskitpro.com/llms.txt"));
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect(response.headers.get("cache-control")).toContain("max-age=3600");
    expect(body).toContain("# OpsKitPro");
    expect(body).toContain("https://opskitpro.com/api/tools");
    expect(body).toContain("https://opskitpro.com/mcp");
    expect(body).toContain("website_check");
    expect(body).toContain("[Website Check]");
    expect(body).toContain("[网站检测]");
    expect(body).toContain("experimental discovery aid");
    expect(body).not.toContain("guaranteed ranking");
  });

  it("returns 304 for a matching ETag", () => {
    const first = GET(new Request("https://opskitpro.com/llms.txt"));
    const etag = first.headers.get("etag")!;
    const cached = GET(
      new Request("https://opskitpro.com/llms.txt", {
        headers: { "if-none-match": etag },
      }),
    );

    expect(cached.status).toBe(304);
  });
});
