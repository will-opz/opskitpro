// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET as tools } from "@/app/api/tools/route";
import { POST, GET, DELETE, OPTIONS } from "./route";
import { proxy } from "@/proxy";

vi.mock("@/lib/admin-auth", () => ({
  getAdminIdentity: () => { throw new Error("Public routes must not authenticate admins"); },
}));
vi.mock("@/lib/diagnostic-route", () => ({
  executeDiagnosticRequest: () => { throw new Error("Protocol tests must not run measurements"); },
}));
afterEach(() => vi.unstubAllGlobals());
const untrusted = {
  "cf-access-authenticated-user-email": "admin@example.com",
  "cf-access-jwt-assertion": "invalid-token",
  cookie: "opskitpro_admin=old-token",
  "user-agent": "curl/8.0",
};

describe("public API/MCP remain independent of administrator authentication", () => {
  it.each([{}, untrusted])("catalog stays public with headers %j", (headers) => {
    const response = tools(new Request("https://opskitpro.com/api/tools", { headers }));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
    const etag = response.headers.get("etag")!;
    expect(tools(new Request("https://opskitpro.com/api/tools", { headers: { "if-none-match": etag } })).status).toBe(304);
  });
  it.each([{}, untrusted])("MCP initialization/listing require no Cookie, Origin or JWT: %j", async (extra) => {
    const fetchSpy = vi.fn(() => { throw new Error("Unexpected external network"); });
    vi.stubGlobal("fetch", fetchSpy);
    for (const [id, method, params] of [
      [1, "initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "audit-test", version: "1" } }],
      [2, "tools/list", {}],
    ]) {
      const response = await POST(new Request("https://opskitpro.com/mcp", {
        method: "POST", headers: { accept: "application/json, text/event-stream", "content-type": "application/json", "mcp-protocol-version": "2025-11-25", ...extra },
        body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
      }));
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(response.headers.get("cache-control")).toBe("no-store");
      expect(response.headers.get("set-cookie")).toBeNull();
      expect(response.headers.get("cf-mitigated")).toBeNull();
      expect(await response.json()).toMatchObject({ jsonrpc: "2.0", id, result: expect.any(Object) });
    }
    expect(fetchSpy).not.toHaveBeenCalled();
  });
  it("keeps preflight and stateless GET/DELETE protocol responses", async () => {
    const preflight = OPTIONS(new Request("https://opskitpro.com/mcp", { method: "OPTIONS" }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("allow")).toBe("GET, POST, DELETE, OPTIONS");
    expect(preflight.headers.get("access-control-allow-headers")).toContain("MCP-Session-Id");
    const stream = await GET(new Request("https://opskitpro.com/mcp", { headers: { accept: "text/event-stream", ...untrusted } }));
    expect(stream.status).toBe(200);
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    await stream.body?.cancel();
    const rejected = await GET(new Request("https://opskitpro.com/mcp"));
    expect(rejected.status).toBe(406);
    expect(await rejected.json()).toHaveProperty("error");
    const deleted = await DELETE(new Request("https://opskitpro.com/mcp", { method: "DELETE" }));
    expect(deleted.status).toBe(200);
  });
  it("preserves Host/Origin rejection without login redirects", async () => {
    for (const headers of [new Headers({ host: "evil.example" }), new Headers({ origin: "https://evil.example" })]) {
      const response = OPTIONS(new Request("https://opskitpro.com/mcp", { headers }));
      expect(response.status).toBe(403);
      expect(response.headers.get("location")).toBeNull();
    }
  });
  it.each(["/en/tools", "/zh/tools", "/api/tools", "/mcp"])("proxy does not mint identity or challenge %s", async (path) => {
    const response = await proxy(new NextRequest(`https://opskitpro.com${path}`, { headers: untrusted }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(response.headers.get("location")).toBeNull();
  });
});
