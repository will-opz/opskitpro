import { describe, expect, it, vi } from "vitest";
import {
  assertPublicHostname,
  isPublicAddress,
  runEdgeProbe,
  tokensMatch,
  validateTargetUrl,
} from "./index";
import worker from "./index";

const publicDns = async (_hostname: string, type: "A" | "AAAA") => ({
  Status: 0,
  Answer:
    type === "A"
      ? [{ type: 1, data: "93.184.216.34" }]
      : [{ type: 28, data: "2606:4700:4700::1111" }],
});

describe("Cloudflare Edge Probe", () => {
  it("compares bearer tokens without accepting missing or partial values", async () => {
    await expect(tokensMatch(null, "secret")).resolves.toBe(false);
    await expect(tokensMatch("Bearer sec", "secret")).resolves.toBe(false);
    await expect(tokensMatch("Bearer secret", "secret")).resolves.toBe(true);
  });

  it("requires authentication before parsing or probing", async () => {
    const response = await worker.fetch(
      new Request("https://probe-edge.example.com", {
        method: "POST",
        body: JSON.stringify({ url: "https://example.com" }),
      }),
      { EDGE_PROBE_TOKEN: "secret" },
    );
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "AUTH_REQUIRED" },
    });
  });

  it("rejects malformed authenticated requests as client errors", async () => {
    const response = await worker.fetch(
      new Request("https://probe-edge.example.com", {
        method: "POST",
        headers: { Authorization: "Bearer secret" },
        body: "{",
      }),
      { EDGE_PROBE_TOKEN: "secret" },
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_REQUEST" },
    });
  });

  it("rejects unsafe schemes, ports, credentials, local names, and IP literals", () => {
    expect(() => validateTargetUrl("file:///etc/passwd")).toThrow(/Only HTTP/);
    expect(() => validateTargetUrl("https://user:pass@example.com")).toThrow(
      /credentials/,
    );
    expect(() => validateTargetUrl("https://example.com:8443")).toThrow(
      /standard/,
    );
    expect(() => validateTargetUrl("http://metadata.google.internal")).toThrow(
      /Local and metadata/,
    );
    expect(() => validateTargetUrl("http://127.0.0.1")).toThrow(/Direct IP/);
    expect(validateTargetUrl("https://example.com/path#fragment").toString()).toBe(
      "https://example.com/path",
    );
  });

  it("distinguishes public from private and reserved addresses", () => {
    expect(isPublicAddress("8.8.8.8")).toBe(true);
    expect(isPublicAddress("2606:4700:4700::1111")).toBe(true);
    expect(isPublicAddress("127.0.0.1")).toBe(false);
    expect(isPublicAddress("169.254.169.254")).toBe(false);
    expect(isPublicAddress("10.0.0.1")).toBe(false);
    expect(isPublicAddress("fc00::1")).toBe(false);
  });

  it("rejects hostnames resolving to private addresses", async () => {
    await expect(
      assertPublicHostname("example.com", async (_hostname, type) => ({
        Status: 0,
        Answer:
          type === "A"
            ? [{ type: 1, data: "10.0.0.1" }]
            : [{ type: 28, data: "2606:4700:4700::1111" }],
      })),
    ).rejects.toThrow(/private or reserved/);
  });

  it("returns a bounded full-precision edge observation", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response("<html><title>Example Domain</title></html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          server: "example",
        },
      });
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input) => {
      if (String(input).startsWith("https://cloudflare-dns.com/")) {
        const type = new URL(String(input)).searchParams.get("type");
        return Response.json(await publicDns("example.com", type as "A" | "AAAA"));
      }
      throw new Error("Unexpected global fetch");
    }) as typeof fetch;
    try {
      const result = await runEdgeProbe(
        "https://example.com",
        "NRT",
        fetchMock as typeof fetch,
      );
      expect(result).toMatchObject({
        ok: true,
        source: "cloudflare_edge",
        precision: "full",
        colo: "NRT",
        status: "reachable",
        httpStatus: 200,
        finalUrl: "https://example.com/",
        challenge: false,
        pageTitle: "Example Domain",
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("classifies a Cloudflare challenge as probe blocked", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response("<html><title>Just a moment...</title></html>", {
        status: 200,
        headers: {
          "content-type": "text/html",
          "cf-mitigated": "challenge",
        },
      });
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async (input) => {
      if (String(input).startsWith("https://cloudflare-dns.com/")) {
        const type = new URL(String(input)).searchParams.get("type");
        return Response.json(await publicDns("example.com", type as "A" | "AAAA"));
      }
      throw new Error("Unexpected global fetch");
    }) as typeof fetch;
    try {
      await expect(
        runEdgeProbe(
          "https://example.com",
          "LHR",
          fetchMock as typeof fetch,
        ),
      ).resolves.toMatchObject({
        status: "probe_blocked",
        challenge: true,
        colo: "LHR",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
