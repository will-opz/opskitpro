// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventEmitter } from "node:events";
import dns from "node:dns/promises";
import https from "node:https";
import { requestTargetTrace } from "./trace-request";
vi.mock("node:dns/promises", () => ({ default: { lookup: vi.fn() } }));
vi.mock("node:https", () => ({ default: { request: vi.fn() } }));
describe("Trace pinned outbound connection", () => {
  beforeEach(() => vi.resetAllMocks());
  it.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "fd00::1", "::ffff:127.0.0.1"])("blocks resolved %s before connection", async address => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "1.1.1.1", family: 4 }, { address, family: address.includes(":") ? 6 : 4 }] as never);
    await expect(requestTargetTrace("example.com", new AbortController().signal)).rejects.toThrow("blocked");
    expect(https.request).not.toHaveBeenCalled();
  });
  it("pins the validated IP, preserves host/SNI, never follows redirect", async () => {
    vi.mocked(dns.lookup).mockResolvedValue([{ address: "1.1.1.1", family: 4 }] as never);
    const response = Object.assign(new EventEmitter(), { statusCode: 302, resume: vi.fn() });
    const request = Object.assign(new EventEmitter(), { end: () => callback(response), destroy: vi.fn() });
    let callback: (response: unknown) => void;
    vi.mocked(https.request).mockImplementation(((options: unknown, cb: typeof callback) => { callback = cb; return request; }) as never);
    await expect(requestTargetTrace("example.com", new AbortController().signal)).resolves.toEqual({ status: 302, text: "" });
    expect(https.request).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ hostname: "1.1.1.1", servername: "example.com", path: "/cdn-cgi/trace", headers: expect.objectContaining({ Host: "example.com" }) }), expect.any(Function));
    expect(dns.lookup).toHaveBeenCalledTimes(1);
  });
});
