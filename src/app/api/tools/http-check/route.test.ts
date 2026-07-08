import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";

function makeRequest(ip: string) {
  return new NextRequest("https://opskitpro.com/api/tools/http-check", {
    headers: {
      "x-forwarded-for": ip,
    },
  });
}

describe("GET /api/tools/http-check rate limit contract", () => {
  it("returns the public 429 contract with rate-limit headers", async () => {
    const ip = `203.0.113.${Math.floor(Math.random() * 100) + 1}`;

    for (let i = 0; i < 15; i += 1) {
      const response = await GET(makeRequest(ip));
      expect(response.status).toBe(400);
    }

    const limited = await GET(makeRequest(ip));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("X-RateLimit-Limit")).toBe("15");
    expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(limited.headers.get("X-RateLimit-Reset")).toBeTruthy();
    expect(limited.headers.get("Retry-After")).toBeTruthy();

    const body = await limited.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("RATE_LIMITED");
    expect(body.error.retryAfter).toBeGreaterThan(0);
  });
});
