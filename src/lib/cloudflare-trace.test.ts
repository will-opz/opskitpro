import { describe, expect, it } from "vitest";
import { parseTraceText, buildTraceSummary, traceState } from "./cloudflare-trace";
const valid = "ip=192.0.2.10\ncolo=NRT\nts=1794193200.123\nloc=JP\nhttp=http/2\ntls=TLSv1.3\nwarp=off\nuag=private-agent=a=b\nh=secret.example\nfl=private-token";
describe("Trace validation and local sharing", () => {
  it("parses on the first equals and keeps missing state unknown", () => {
    const trace = parseTraceText(valid);
    expect(trace.uag).toBe("private-agent=a=b");
    expect(trace.gateway).toBeUndefined();
    expect(traceState(trace.gateway, false)).toBe("Unknown");
    expect(traceState(trace.warp, false)).toBe("Disabled");
  });
  it.each(["<html>ip=192.0.2.1 colo=NRT ts=123</html>", valid.replace("192.0.2.10", "999.2.1.1"), valid.replace("ts=1794193200.123", "ts=nope"), valid.replace("colo=NRT", "colo=private-target"), valid + "\nip=127.0.0.1", valid + "\n" + "a".repeat(17000)])("rejects malformed trace %#", text => expect(() => parseTraceText(text)).toThrow("invalid_response"));
  it.each(["192.0.2.10", "2001:db8::1234"])("redacts %s and every raw marker by default", ip => {
    const trace = parseTraceText(valid.replace("192.0.2.10", ip));
    const snapshot = { trace, mode: "target" as const, target: "secret.example", receivedAt: "2026-11-09T00:00:00Z" };
    const summary = buildTraceSummary(snapshot, "en");
    for (const secret of [ip, "secret.example", "private-agent", "private-token"]) expect(summary).not.toContain(secret);
    expect(summary).toContain("[hidden]"); expect(summary).toContain("UTC");
    expect(buildTraceSummary(snapshot, "en", { includeIp: true })).toContain(ip);
    expect(buildTraceSummary(snapshot, "en", { includeIp: true })).not.toContain("secret.example");
    expect(buildTraceSummary(snapshot, "en", { includeTarget: true })).toContain("secret.example");
    expect(buildTraceSummary(snapshot, "en", { includeTarget: true })).not.toContain(ip);
  });
  it("does not export arbitrary text in protocol or region fields", () => {
    const trace = parseTraceText(valid.replace("http=http/2", "http=private-leak").replace("loc=JP", "loc=private-region"));
    expect(buildTraceSummary({ trace, mode: "my", receivedAt: "" }, "zh")).not.toMatch(/private-/);
  });
});
