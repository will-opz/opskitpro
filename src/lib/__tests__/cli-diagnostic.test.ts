import { describe, expect, it } from "vitest";
import {
  calculateCliScore,
  renderCliDiagnostic,
  renderCliUsage,
} from "@/lib/cli-diagnostic";
import type { DiagnosticResponse } from "@/lib/diagnostic-types";

const fixture: DiagnosticResponse = {
  domain: "example.com",
  dns: {
    resolved_ip: "93.184.216.34",
    latency: "20ms",
    success: true,
    all_ips: ["93.184.216.34"],
    ns: ["A.IANA-SERVERS.NET."],
    resolvers: [
      { name: "Cloudflare", status: "OK" },
      { resolver: "Google", status: "OK" },
    ],
  },
  http: {
    success: true,
    status_code: 200,
    latency: "100ms",
    is_https: true,
  },
  ssl: { valid: true, issuer: "Example CA", expiry: "2030-01-01" },
  cdn: { is_provider: true, provider: "Example CDN", server: "edge" },
  whois: {
    success: true,
    registrar: "Example Registrar",
    registered: "1995-01-01",
    expires: "2030-01-01",
    status: "active",
    nameservers: ["a.iana-servers.net"],
  },
};

describe("CLI diagnostic renderer", () => {
  it("keeps all public entrypoints in usage", () => {
    expect(renderCliUsage()).toContain("/chk/<domain>");
    expect(renderCliUsage()).toContain("/d/<domain>");
    expect(renderCliUsage()).toContain("/api/cli?domain=<domain>");
  });

  it("renders evidence from the shared diagnostic contract", () => {
    const output = renderCliDiagnostic("example.com", fixture);
    expect(output).toContain("EXAMPLE.COM");
    expect(output).toContain("93.184.216.34");
    expect(output).toContain("Example CA");
    expect(output).toContain("a.iana-servers.net");
    expect(output).toContain("Cloudflare:");
    expect(output).toContain("Google:");
  });

  it("retains the compatibility score calculation", () => {
    expect(calculateCliScore(fixture)).toBe(100);
    expect(calculateCliScore({
      ...fixture,
      http: { ...fixture.http, success: false, status_code: 503 },
    })).toBe(40);
  });
});
