import { afterEach, describe, expect, it, vi } from "vitest";
import { requestEdgeProbe } from "../edge-probe";

const originalUrl = process.env.EDGE_PROBE_URL;
const originalToken = process.env.EDGE_PROBE_TOKEN;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalUrl === undefined) delete process.env.EDGE_PROBE_URL;
  else process.env.EDGE_PROBE_URL = originalUrl;
  if (originalToken === undefined) delete process.env.EDGE_PROBE_TOKEN;
  else process.env.EDGE_PROBE_TOKEN = originalToken;
});

describe("requestEdgeProbe", () => {
  it("does not call the network when edge probing is not configured", async () => {
    delete process.env.EDGE_PROBE_URL;
    delete process.env.EDGE_PROBE_TOKEN;
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(requestEdgeProbe("https://example.com")).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps the token server-side and returns a safe observation", async () => {
    process.env.EDGE_PROBE_URL = "https://probe-edge.example.com/";
    process.env.EDGE_PROBE_TOKEN = "edge-secret";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({
        ok: true,
        source: "cloudflare_edge",
        precision: "full",
        colo: "NRT",
        status: "reachable",
        httpStatus: 200,
        latencyMs: 42,
        finalUrl: "https://example.com/",
        redirectChain: [
          { url: "https://example.com/", status: 200 },
        ],
        checkedAt: "2026-07-25T00:00:00.000Z",
      }),
    );

    await expect(requestEdgeProbe("https://example.com")).resolves.toMatchObject({
      source: "cloudflare_edge",
      status: "reachable",
      precision: "full",
      colo: "NRT",
      httpStatus: 200,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://probe-edge.example.com/",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer edge-secret",
        }),
        body: JSON.stringify({ url: "https://example.com" }),
      }),
    );
  });

  it("degrades to an additive network error when the Worker is unavailable", async () => {
    process.env.EDGE_PROBE_URL = "https://probe-edge.example.com/";
    process.env.EDGE_PROBE_TOKEN = "edge-secret";
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("fetch failed"));

    await expect(requestEdgeProbe("https://example.com")).resolves.toMatchObject({
      source: "cloudflare_edge",
      status: "network_error",
      precision: "full",
      colo: "Unknown",
      error: "fetch failed",
    });
  });
});
