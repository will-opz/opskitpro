import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod/v4";

import type { DiagnosticSuccessResponse } from "@/lib/api-contracts";
import { executeDiagnosticRequest } from "@/lib/diagnostic-route";
import { buildWebsiteDiagnosticModel } from "@/lib/diagnostic-model";

const DEFAULT_CHECKS = ["dns", "tls", "http", "cdn", "headers"] as const;

const checkSchema = z.enum(DEFAULT_CHECKS);

const outputSchema = {
  schemaVersion: z.literal("opskitpro-mcp.website-check.v1"),
  target: z.string(),
  status: z.enum(["healthy", "degraded", "critical"]),
  verdict: z.enum(["Healthy", "Degraded", "Unreachable", "Unknown"]),
  observationPoints: z.array(
    z.object({
      source: z.enum(["cloudflare_edge", "opskitpro_probe"]),
      location: z.string(),
      status: z.string(),
    }),
  ),
  summary: z.string(),
  findings: z.array(
    z.object({
      area: z.enum(["dns", "http", "tls", "cdn", "headers"]),
      severity: z.enum(["info", "warning", "critical"]),
      message: z.string(),
    }),
  ),
  evidence: z.array(z.string()),
  evidenceRecords: z.array(z.record(z.string(), z.unknown())),
  assessments: z.array(z.record(z.string(), z.unknown())),
  inferences: z.array(z.record(z.string(), z.unknown())),
  guidance: z.array(z.record(z.string(), z.unknown())),
  limitations: z.array(z.string()),
  nextActions: z.array(z.string()),
  diagnostic: z.object({
    dns: z.record(z.string(), z.unknown()),
    http: z.record(z.string(), z.unknown()),
    tls: z.record(z.string(), z.unknown()),
    cdn: z.record(z.string(), z.unknown()),
    securityHeaders: z.record(z.string(), z.unknown()).optional(),
  }),
};

type Finding = {
  area: "dns" | "http" | "tls" | "cdn" | "headers";
  severity: "info" | "warning" | "critical";
  message: string;
};

function buildMcpResult(
  result: DiagnosticSuccessResponse,
  requestedChecks: readonly string[],
) {
  const diagnosis = buildWebsiteDiagnosticModel(result);
  const findings: Finding[] = [];

  if (!result.dns.success) {
    findings.push({
      area: "dns",
      severity: "critical",
      message: "DNS did not return a usable public A or AAAA address.",
    });
  }

  if (!result.http.success) {
    const blocked = result.http.classification === "probe_blocked";
    findings.push({
      area: "http",
      severity: blocked ? "warning" : "critical",
      message: blocked
        ? `The OpsKitPro probe was rejected with HTTP ${result.http.status_code || "ERR"}.`
        : `HTTP probing did not complete successfully (${result.http.status_code || "network error"}).`,
    });
  } else if ((result.http.redirect_count || 0) > 2) {
    findings.push({
      area: "http",
      severity: "warning",
      message: `The request followed ${result.http.redirect_count} redirects before reaching the final URL.`,
    });
  }

  if (result.http.is_https && !result.ssl.valid) {
    findings.push({
      area: "tls",
      severity: "critical",
      message: `TLS validation failed${result.ssl.error_reason ? `: ${result.ssl.error_reason}` : "."}`,
    });
  } else if (
    result.ssl.expiry !== "Unknown" &&
    new Date(result.ssl.expiry).getTime() - Date.now() <= 15 * 86_400_000
  ) {
    findings.push({
      area: "tls",
      severity: "warning",
      message: `The TLS certificate expires on ${result.ssl.expiry}.`,
    });
  }

  const missingHeaders =
    result.securityHeaders?.checks.filter((check) => !check.present) || [];
  if (missingHeaders.length > 0) {
    findings.push({
      area: "headers",
      severity: "warning",
      message: `Missing or incomplete security headers: ${missingHeaders.map((item) => item.label).join(", ")}.`,
    });
  }

  if (!result.cdn.is_provider) {
    findings.push({
      area: "cdn",
      severity: "info",
      message: "Unknown · No known CDN signature identified.",
    });
  }

  const observationPoints = [
    ...(result.observations?.edge
      ? [
          {
            source: "cloudflare_edge" as const,
            location: result.observations.edge.colo,
            status: result.observations.edge.status,
          },
        ]
      : []),
    {
      source: "opskitpro_probe" as const,
      location: result.observations?.server?.location || "AWS Lightsail",
      status: result.observations?.server?.status || "unknown",
    },
  ];

  const nextActions = diagnosis.guidance.map((item) => item.summary);

  const structuredContent = {
    schemaVersion: "opskitpro-mcp.website-check.v1" as const,
    target: result.domain,
    status:
      diagnosis.verdict === "Healthy"
        ? ("healthy" as const)
        : diagnosis.verdict === "Degraded"
          ? ("degraded" as const)
          : ("critical" as const),
    verdict: diagnosis.verdict,
    observationPoints,
    summary:
      diagnosis.verdict === "Healthy"
        ? "The target is reachable and no critical issue was detected by the available probes."
        : diagnosis.verdict === "Degraded"
          ? "The target is reachable or partially observable, but configuration warnings require review."
          : diagnosis.verdict === "Unreachable"
            ? "The available evidence indicates that the target is unreachable from the observed probe path."
            : "The available evidence is insufficient for a reliable availability verdict.",
    findings,
    evidence: [
      `DNS addresses: ${result.dns.all_ips?.join(", ") || result.dns.resolved_ip || "none"}`,
      `HTTP: ${result.http.status_code || "ERR"} · ${result.http.classification || "unknown"} · ${result.http.latency}`,
      `Final URL: ${result.http.final_url || "unknown"}`,
      `TLS: ${result.ssl.valid ? "valid" : "invalid or unavailable"} · ${result.ssl.protocol || "unknown protocol"} · expires ${result.ssl.expiry}`,
      `CDN: ${result.cdn.is_provider ? result.cdn.provider : "Unknown · No known CDN signature identified"}`,
      `Security headers: ${result.securityHeaders?.passed ?? 0}/${result.securityHeaders?.total ?? 0} observed`,
    ],
    evidenceRecords: diagnosis.evidence,
    assessments: diagnosis.assessments,
    inferences: diagnosis.inferences,
    guidance: diagnosis.guidance,
    limitations: [
      "Results describe the named observation points and do not prove global availability.",
      "No measurement from the MCP user's browser or private network is included.",
      "Security-header and CDN signals are evidence, not a complete security assessment.",
      ...(requestedChecks.length !== DEFAULT_CHECKS.length
        ? ["The current MCP version performs the complete bounded check even when a subset is requested."]
        : []),
    ],
    nextActions: Array.from(new Set(nextActions)),
    diagnostic: {
      dns: {
        resolvedIp: result.dns.resolved_ip,
        addresses: result.dns.all_ips || [],
        dualStack: result.dns.dual_stack || false,
        nameservers: result.dns.ns || [],
        records: result.dns.records || {},
        latency: result.dns.latency,
      },
      http: {
        statusCode: result.http.status_code,
        success: result.http.success,
        classification: result.http.classification,
        latency: result.http.latency,
        finalUrl: result.http.final_url,
        redirectChain: result.http.redirect_chain || [],
        challenge: result.http.challenge || false,
      },
      tls: {
        valid: result.ssl.valid,
        issuer: result.ssl.issuer,
        expiry: result.ssl.expiry,
        protocol: result.ssl.protocol,
        cipher: result.ssl.cipher,
        hostnameValid: result.ssl.hostname_valid,
        chainAuthorized: result.ssl.chain_authorized,
        errorReason: result.ssl.error_reason,
      },
      cdn: {
        detected: result.cdn.is_provider,
        provider: result.cdn.provider,
        server: result.cdn.server,
      },
      securityHeaders: result.securityHeaders
        ? {
            score: result.securityHeaders.score,
            grade: result.securityHeaders.grade,
            passed: result.securityHeaders.passed,
            total: result.securityHeaders.total,
            checks: result.securityHeaders.checks.map((check) => ({
              name: check.label,
              present: check.present,
              value: check.value,
            })),
          }
        : undefined,
    },
  };

  return structuredContent;
}

function diagnosticRequestFor(target: string, sourceRequest: Request) {
  const headers = new Headers();
  for (const name of [
    "cf-connecting-ip",
    "x-forwarded-for",
    "x-real-ip",
    "cf-ray",
  ]) {
    const value = sourceRequest.headers.get(name);
    if (value) headers.set(name, value);
  }

  const url = new URL("https://opskitpro.com/api/diagnostic");
  url.searchParams.set("domain", target);
  return new Request(url, { headers });
}

export function createOpsKitMcpServer(sourceRequest: Request) {
  const server = new McpServer(
    {
      name: "opskitpro-website-check",
      title: "OpsKitPro Website Check",
      version: "1.0.0",
      description:
        "Evidence-led DNS, HTTP, TLS, CDN and security-header diagnostics.",
      websiteUrl: "https://opskitpro.com/en/mcp",
    },
    { capabilities: { tools: {} } },
  );

  server.registerTool(
    "website_check",
    {
      title: "Website Check",
      description:
        "Run a bounded public website diagnostic from OpsKitPro probes. Returns observation points, evidence, findings, limitations and next actions. Public targets only; no browser-local or private-network measurement.",
      inputSchema: {
        domain: z
          .string()
          .trim()
          .min(1)
          .max(253)
          .describe("Public domain or hostname to diagnose, for example example.com"),
        checks: z
          .array(checkSchema)
          .min(1)
          .max(DEFAULT_CHECKS.length)
          .optional()
          .describe("Requested diagnostic areas. The current version runs the full bounded check."),
      },
      outputSchema,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ domain, checks }) => {
      const normalizedChecks = checks || [...DEFAULT_CHECKS];
      const response = await executeDiagnosticRequest(
        diagnosticRequestFor(domain, sourceRequest),
        { rateLimitRoute: "/mcp:website_check", rateLimit: 2 },
      );
      const body = await response.json();

      if (!response.ok || body?.status !== "success") {
        const message =
          response.status === 429
            ? "OpsKitPro MCP rate limit reached. Retry after the interval in the response metadata."
            : body?.message || body?.error?.message || "Website Check failed.";
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }

      const structuredContent = buildMcpResult(
        body as DiagnosticSuccessResponse,
        normalizedChecks,
      );

      return {
        content: [
          {
            type: "text",
            text: `${structuredContent.summary}\n\n${structuredContent.assessments.map((item) => `${item.area}: ${item.status}`).join("\n")}`,
          },
        ],
        structuredContent,
      };
    },
  );

  return server;
}
