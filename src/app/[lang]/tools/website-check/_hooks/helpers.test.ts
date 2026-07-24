import { describe, expect, it } from "vitest";
import {
  calculateScore,
  createSafeDiagnosticResult,
  isBlockedHttpStatus,
} from "./helpers";

describe("website check helpers", () => {
  it("treats blocked visitor IP probes as degraded instead of fully failed", () => {
    const result = createSafeDiagnosticResult(
      {
        domain: "2404:7a80:8120:1400:68fd:29b8:2abb:5bc1",
        isVisitor: true,
        isActuallyIp: true,
        dns: {
          resolved_ip: "2404:7a80:8120:1400:68fd:29b8:2abb:5bc1",
          latency: "0ms",
          success: true,
        },
        http: {
          success: false,
          status_code: 403,
          latency: "561ms",
        },
        ssl: {
          valid: false,
          grade: "F",
        },
        securityHeaders: {
          score: 0,
          grade: "F",
        },
        cdn: {
          is_provider: false,
          provider: "Unknown",
        },
      },
      "",
    );

    expect(isBlockedHttpStatus(result.http.status_code)).toBe(true);
    expect(calculateScore(result)).toBe(85);
  });

  it("does not deduct availability points when the browser succeeds and only the probe is blocked", () => {
    const result = createSafeDiagnosticResult(
      {
        domain: "opskitpro.com",
        dns: { success: true, latency: "20ms" },
        http: {
          success: false,
          status_code: 403,
          latency: "300ms",
          classification: "probe_blocked",
          challenge: true,
        },
        observations: {
          browser: {
            source: "your_browser",
            status: "reachable",
            precision: "full",
            httpStatus: 200,
            checkedAt: "2026-07-24T00:00:00.000Z",
          },
        },
        ssl: { valid: true, grade: "A" },
        securityHeaders: { score: 100, grade: "A" },
        cdn: { is_provider: true, provider: "Cloudflare" },
      },
      "",
    );

    expect(calculateScore(result)).toBe(100);
  });

  it("accepts a full Cloudflare Edge observation as corroborating reachability", () => {
    const result = createSafeDiagnosticResult(
      {
        domain: "example.com",
        dns: { success: true, latency: "20ms" },
        http: {
          success: false,
          status_code: 403,
          latency: "300ms",
          classification: "probe_blocked",
        },
        observations: {
          edge: {
            source: "cloudflare_edge",
            status: "reachable",
            precision: "full",
            colo: "NRT",
            httpStatus: 200,
            checkedAt: "2026-07-25T00:00:00.000Z",
          },
        },
        ssl: { valid: true, grade: "A" },
        securityHeaders: { score: 100, grade: "A" },
        cdn: { is_provider: true, provider: "Cloudflare" },
      },
      "",
    );

    expect(calculateScore(result)).toBe(100);
  });
});
