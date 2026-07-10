import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const checkRateLimitMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/rate-limit", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/rate-limit")>();
  return {
    ...actual,
    checkRateLimit: checkRateLimitMock,
  };
});

import { GET as getDnsLatency } from "./dns-latency/route";
import { GET as getDownload } from "./download/route";
import { GET as getReachability } from "./reachability/route";

const allowedResult = {
  success: true,
  limit: 5,
  remaining: 4,
  resetAt: Date.now() + 60_000,
  retryAfterSeconds: 0,
  ipHash: "test-ip",
};

const deniedResult = {
  ...allowedResult,
  success: false,
  remaining: 0,
  retryAfterSeconds: 30,
};

function makeRequest(path: string) {
  return new NextRequest(`https://opskitpro.com${path}`, {
    headers: { "x-forwarded-for": "203.0.113.10" },
  });
}

describe("Network Doctor API protection", () => {
  beforeEach(() => {
    checkRateLimitMock.mockReset();
    checkRateLimitMock.mockReturnValue(allowedResult);
    vi.restoreAllMocks();
  });

  it("streams the requested download size with high-cost rate headers", async () => {
    const response = await getDownload(
      makeRequest("/api/network/download?size=1"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Length")).toBe("1048576");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
    expect((await response.arrayBuffer()).byteLength).toBe(1_048_576);
    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/network/download",
        costClass: "HIGH",
        limit: 5,
      }),
    );
  });

  it.each([
    ["download", getDownload, "/api/network/download?size=1"],
    ["reachability", getReachability, "/api/network/reachability"],
    ["dns latency", getDnsLatency, "/api/network/dns-latency"],
  ])("returns the shared 429 contract for %s", async (_name, handler, path) => {
    checkRateLimitMock.mockReturnValue(deniedResult);

    const response = await handler(makeRequest(path));
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    expect(body.error.code).toBe("RATE_LIMITED");
  });

  it("classifies reachability as high cost", async () => {
    checkRateLimitMock.mockReturnValue(deniedResult);
    await getReachability(makeRequest("/api/network/reachability"));

    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/network/reachability",
        costClass: "HIGH",
        limit: 10,
      }),
    );
  });

  it("classifies resolver latency as medium cost", async () => {
    checkRateLimitMock.mockReturnValue(deniedResult);
    await getDnsLatency(makeRequest("/api/network/dns-latency"));

    expect(checkRateLimitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        route: "/api/network/dns-latency",
        costClass: "MEDIUM",
        limit: 15,
      }),
    );
  });
});
