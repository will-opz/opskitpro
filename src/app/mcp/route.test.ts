import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeDiagnosticRequest } = vi.hoisted(() => ({
  executeDiagnosticRequest: vi.fn(),
}));

vi.mock("@/lib/diagnostic-route", () => ({
  executeDiagnosticRequest,
}));

import { POST } from "./route";

function mcpRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://opskitpro.com/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

describe("OpsKitPro MCP", () => {
  beforeEach(() => {
    executeDiagnosticRequest.mockReset();
  });

  it("negotiates a stateless MCP connection", async () => {
    const response = await POST(
      mcpRequest({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "vitest", version: "1.0.0" },
        },
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.result.serverInfo.name).toBe("opskitpro-website-check");
    expect(body.result.capabilities.tools).toBeDefined();
  });

  it("lists only the bounded website_check tool", async () => {
    const response = await POST(
      mcpRequest({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }, {
        "mcp-protocol-version": "2025-11-25",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.tools).toHaveLength(1);
    expect(body.result.tools[0].name).toBe("website_check");
    expect(body.result.tools[0].annotations.readOnlyHint).toBe(true);
  });

  it("returns structured evidence for website_check", async () => {
    executeDiagnosticRequest.mockResolvedValue(
      Response.json({
        domain: "example.com",
        status: "success",
        isActuallyIp: false,
        isPrivate: false,
        dns: {
          resolved_ip: "93.184.216.34",
          all_ips: ["93.184.216.34"],
          latency: "12ms",
          success: true,
        },
        http: {
          success: true,
          status_code: 200,
          latency: "180ms",
          is_https: true,
          final_url: "https://example.com/",
          classification: "reachable",
          redirect_count: 0,
        },
        observations: {
          edge: {
            source: "cloudflare_edge",
            status: "reachable",
            precision: "full",
            colo: "NRT",
            checkedAt: new Date().toISOString(),
          },
          server: {
            source: "opskitpro_probe",
            status: "reachable",
            precision: "full",
            location: "AWS Lightsail",
          },
        },
        securityHeaders: { score: 100, grade: "A", passed: 2, total: 2, checks: [] },
        ssl: { valid: true, issuer: "Test CA", expiry: "2099-01-01", protocol: "TLSv1.3" },
        cdn: { is_provider: true, provider: "Cloudflare", server: "cloudflare" },
        geo: { country: "Unknown", isp: "Unknown", city: "Unknown", asn: "Unknown" },
        whois: { registered: "Unknown", registrar: "Unknown", status: "Unknown", success: false, expires: "Unknown" },
      }),
    );

    const response = await POST(
      mcpRequest({
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "website_check", arguments: { domain: "example.com" } },
      }, {
        "mcp-protocol-version": "2025-11-25",
        "cf-connecting-ip": "203.0.113.10",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.result.isError).not.toBe(true);
    expect(body.result.structuredContent.schemaVersion).toBe(
      "opskitpro-mcp.website-check.v1",
    );
    expect(body.result.structuredContent.target).toBe("example.com");
    expect(body.result.structuredContent.observationPoints).toHaveLength(2);
    expect(executeDiagnosticRequest).toHaveBeenCalledWith(
      expect.any(Request),
      { rateLimitRoute: "/mcp:website_check", rateLimit: 2 },
    );
  });

  it("rejects cross-origin browser requests", async () => {
    const response = await POST(
      mcpRequest(
        { jsonrpc: "2.0", id: 4, method: "tools/list", params: {} },
        { origin: "https://attacker.example" },
      ),
    );

    expect(response.status).toBe(403);
  });
});
