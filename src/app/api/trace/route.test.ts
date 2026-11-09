// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "./route";
import { requestTargetTrace } from "@/lib/trace-request";
vi.mock("@/lib/trace-request", () => ({ requestTargetTrace: vi.fn() }));
vi.mock("@/lib/runtime-context", () => ({ getClientIp: () => "192.0.2.2" }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: () => ({ success: true }), createRateLimitHeaders: () => ({}), rateLimitResponse: vi.fn() }));
const get = (query = "domain=example.com") => GET(new NextRequest(`http://localhost/api/trace?${query}`));
describe("Trace API payload contract", () => {
  beforeEach(() => vi.resetAllMocks());
  it("rejects HTML even from a target claiming Cloudflare", async () => {
    vi.mocked(requestTargetTrace).mockResolvedValue({ status: 200, text: "<html>Cloudflare challenge ip=secret</html>" });
    const res = await get(); expect(res.status).toBe(502); expect(await res.json()).toEqual({ error: "invalid_response" });
  });
  it("returns validated JSON without inventing disabled states", async () => {
    vi.mocked(requestTargetTrace).mockResolvedValue({ status: 200, text: "ip=192.0.2.10\ncolo=NRT\nts=1794193200" });
    const res = await get("domain=example.com&format=json");
    expect(res.status).toBe(200); expect(await res.json()).toMatchObject({ ip: "192.0.2.10", warp: "unknown", gateway: "unknown" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
  it.each(["127.0.0.1", "localhost", "example.com:443", "example.com/path"])("rejects non-host target %s", async target => {
    expect((await get(`domain=${encodeURIComponent(target)}`)).status).toBe(400); expect(requestTargetTrace).not.toHaveBeenCalled();
  });
  it.each([[302, "redirected"], [403, "unavailable"]] as const)("does not return upstream %s body", async (status, error) => {
    vi.mocked(requestTargetTrace).mockResolvedValue({ status, text: "secret" });
    expect(await (await get()).json()).toEqual({ error });
  });
});
