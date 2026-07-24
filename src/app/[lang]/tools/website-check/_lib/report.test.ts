import { describe, expect, it } from "vitest";
import { createSafeDiagnosticResult } from "../_hooks/helpers";
import {
  buildWebsiteCheckMarkdown,
  buildWebsiteCheckReport,
  WEBSITE_CHECK_REPORT_FORMAT_VERSION,
} from "./report";

const healthyResult = () =>
  createSafeDiagnosticResult(
    {
      domain: "opskitpro.com",
      dns: {
        success: true,
        resolved_ip: "104.21.1.1",
        latency: "22ms",
        all_ips: ["104.21.1.1"],
        records: {
          A: ["104.21.1.1"],
          AAAA: [],
        },
      },
      http: {
        success: true,
        status_code: 200,
        latency: "180ms",
        is_https: true,
        final_url: "https://opskitpro.com/tools/website-check",
      },
      ssl: {
        valid: true,
        issuer: "Google Trust Services",
        expiry: "2099-01-01T00:00:00.000Z",
        grade: "A",
        factors: ["HSTS_ENABLED"],
      },
      securityHeaders: {
        score: 100,
        grade: "A",
        passed: 4,
        total: 4,
        checks: [
          { key: "strict-transport-security", label: "HSTS", present: true },
          {
            key: "content-security-policy",
            label: "Content-Security-Policy",
            present: true,
          },
        ],
      },
      cdn: {
        is_provider: true,
        provider: "Cloudflare",
        server: "cloudflare",
      },
      meta: {
        checkedAt: "2026-07-07T00:00:00.000Z",
        edgeColo: "NRT",
      },
    },
    "opskitpro.com",
  );

describe("website check report builder", () => {
  it("builds a stable healthy report object", () => {
    const report = buildWebsiteCheckReport(healthyResult(), {
      generatedAt: "2026-07-07T00:00:00.000Z",
    });

    expect(report.formatVersion).toBe(WEBSITE_CHECK_REPORT_FORMAT_VERSION);
    expect(report.status).toBe("healthy");
    expect(report.score).toBe(100);
    expect(
      report.findings.every((finding) => finding.severity !== "critical"),
    ).toBe(true);
    expect(
      report.findings.find((finding) => finding.key === "dns")?.recommendedFix,
    ).toContain("Continue normal monitoring");
  });

  it("prioritizes HTTP reachability failures with actionable repair fields", () => {
    const result = createSafeDiagnosticResult(
      {
        ...healthyResult(),
        http: {
          success: false,
          status_code: 522,
          latency: "5000ms",
          cf_ray: "abc-NRT",
          page_title: "Error 522",
        },
        cdn: {
          is_provider: true,
          provider: "Cloudflare",
          server: "cloudflare",
        },
      },
      "down.example.com",
    );

    const report = buildWebsiteCheckReport(result);
    const httpFinding = report.findings.find(
      (finding) => finding.key === "http",
    );

    expect(report.status).toBe("critical");
    expect(report.suspectedCause).toContain("Cloudflare 522");
    expect(httpFinding?.severity).toBe("critical");
    expect(httpFinding?.evidence.join(" ")).toContain("Cloudflare 522");
    expect(httpFinding?.recommendedFix).toContain("origin");
    expect(httpFinding?.verificationSteps.length).toBeGreaterThan(1);
  });

  it("reports missing security headers as warnings without overclaiming availability impact", () => {
    const result = createSafeDiagnosticResult(
      {
        ...healthyResult(),
        securityHeaders: {
          score: 60,
          grade: "C",
          passed: 1,
          total: 3,
          checks: [
            { key: "strict-transport-security", label: "HSTS", present: true },
            {
              key: "content-security-policy",
              label: "Content-Security-Policy",
              present: false,
            },
            {
              key: "x-frame-options",
              label: "X-Frame-Options",
              present: false,
            },
          ],
        },
      },
      "headers.example.com",
    );

    const report = buildWebsiteCheckReport(result);
    const headersFinding = report.findings.find(
      (finding) => finding.key === "headers",
    );

    expect(report.status).toBe("degraded");
    expect(headersFinding?.severity).toBe("warning");
    expect(headersFinding?.likelyCause).toContain("response policy");
    expect(headersFinding?.summary).toContain("Content-Security-Policy");
  });

  it("reports a blocked probe coherently in Chinese without broken tool links", () => {
    const result = createSafeDiagnosticResult(
      {
        ...healthyResult(),
        http: {
          success: false,
          status_code: 403,
          latency: "166ms",
          final_url: "https://opskitpro.com",
          redirect_chain: [
            { url: "https://opskitpro.com", status: 403 },
          ],
          redirect_count: 0,
        },
      },
      "opskitpro.com",
    );

    const report = buildWebsiteCheckReport(result, { lang: "zh" });
    const httpFinding = report.findings.find(
      (finding) => finding.key === "http",
    );
    const dnsFinding = report.findings.find(
      (finding) => finding.key === "dns",
    );

    expect(report.status).toBe("degraded");
    expect(httpFinding).toMatchObject({
      id: "http.blocked",
      severity: "warning",
    });
    expect(httpFinding?.relatedToolHref).toBeUndefined();
    expect(httpFinding?.summary).toContain("探测被 HTTP 403 拒绝");
    expect(httpFinding?.likelyCause).toContain("机器人防护");
    expect(report.suspectedCause).toContain("机器人防护");
    expect(report.nextActions.join(" ")).toContain("公开域名");
    expect(dnsFinding?.relatedToolHref).toBe("/zh/tools/dns-lookup");
    expect(
      report.findings.some((finding) =>
        /\/tools\/(?:dns|http-headers|ssl)$/.test(
          finding.relatedToolHref || "",
        ),
      ),
    ).toBe(false);
  });

  it("keeps the site healthy when the browser is reachable but the server probe is blocked", () => {
    const result = createSafeDiagnosticResult(
      {
        ...healthyResult(),
        http: {
          success: false,
          status_code: 403,
          latency: "38ms",
          classification: "probe_blocked",
          challenge: true,
          observation: {
            source: "opskitpro_probe",
            location: "AWS Lightsail",
            precision: "full",
          },
        },
        observations: {
          browser: {
            source: "your_browser",
            status: "reachable",
            precision: "full",
            httpStatus: 200,
            finalUrl: "https://opskitpro.com/en",
            latencyMs: 82,
            checkedAt: "2026-07-24T00:00:00.000Z",
          },
          server: {
            source: "opskitpro_probe",
            status: "probe_blocked",
            precision: "full",
            location: "AWS Lightsail",
          },
        },
      },
      "opskitpro.com",
    );

    const report = buildWebsiteCheckReport(result, { lang: "zh" });
    const httpFinding = report.findings.find(
      (finding) => finding.key === "http",
    );

    expect(report.status).toBe("healthy");
    expect(report.score).toBe(100);
    expect(report.summary).toContain("用户浏览器正常访问");
    expect(httpFinding).toMatchObject({
      id: "http.browser-reachable-probe-blocked",
      severity: "info",
    });
    expect(httpFinding?.summary).toContain("用户浏览器访问正常");
    expect(report.observations?.browser?.httpStatus).toBe(200);

    const markdown = buildWebsiteCheckMarkdown(report, result);
    expect(markdown).toContain("Your Browser: reachable");
    expect(markdown).toContain("OpsKitPro Probe: probe_blocked");
  });

  it("renders markdown with report summary and prioritized findings", () => {
    const result = healthyResult();
    const report = buildWebsiteCheckReport(result, {
      generatedAt: "2026-07-07T00:00:00.000Z",
    });
    const markdown = buildWebsiteCheckMarkdown(report, result);

    expect(markdown).toContain(
      `Report format: ${WEBSITE_CHECK_REPORT_FORMAT_VERSION}`,
    );
    expect(markdown).toContain("## Executive Summary");
    expect(markdown).toContain("## Prioritized Findings");
    expect(markdown).toContain("Recommended fix");
  });
});
