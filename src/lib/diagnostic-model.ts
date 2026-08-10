import type {
  DiagnosticAssessment,
  DiagnosticEvidence,
  DiagnosticGuidance,
  DiagnosticInference,
  DiagnosticModel,
  DiagnosticVerdict,
} from "./diagnostic-types";

type WebsiteDiagnosticInput = {
  domain: string;
  isVisitor?: boolean;
  isActuallyIp?: boolean;
  dns: {
    success: boolean;
    resolved_ip: string;
    all_ips?: string[];
    latency: string | number;
  };
  http: {
    success: boolean;
    status_code: number;
    latency: string | number;
    final_url?: string;
    classification?: string;
    redirect_count?: number;
    redirect_warning?: string;
  };
  ssl: {
    valid: boolean;
    protocol?: string;
    expiry: string;
    error_reason?: string;
  };
  securityHeaders?: {
    passed: number;
    total: number;
    checks: Array<{ key: string; label: string; present: boolean; value?: string }>;
  };
  cdn: { is_provider: boolean; provider: string; server: string };
  whois?: { status?: string };
  observations?: {
    browser?: {
      source: "your_browser";
      status: string;
      precision: string;
      httpStatus?: number;
      finalUrl?: string;
      latencyMs?: number;
      checkedAt: string;
    };
    edge?: {
      source: "cloudflare_edge";
      status: string;
      precision: string;
      colo: string;
      httpStatus?: number;
      finalUrl?: string;
      latencyMs?: number;
      checkedAt: string;
    };
  };
  meta?: { checkedAt?: string };
};

const POLICY = {
  evidence: "observed",
  assessment: "rule-derived",
  inference: "confidence-bound",
  guidance: "contextual",
  aiMayAlterEvidence: false,
} as const;

const evidence = (
  input: WebsiteDiagnosticInput,
  id: string,
  area: string,
  value: unknown,
): DiagnosticEvidence => ({
  id,
  area,
  source: "opskitpro_probe",
  observationPoint: "AWS Lightsail",
  observedAt: input.meta?.checkedAt,
  value,
});

export function buildWebsiteDiagnosticModel(
  input: WebsiteDiagnosticInput,
): DiagnosticModel {
  const isIp = Boolean(input.isVisitor || input.isActuallyIp);
  const browserReachable =
    input.observations?.browser?.status === "reachable" &&
    input.observations.browser.precision === "full";
  const edgeReachable =
    ["reachable", "redirected"].includes(
      input.observations?.edge?.status || "",
    ) && input.observations?.edge?.precision === "full";
  const corroboratedReachable = browserReachable || edgeReachable;
  const probeBlocked =
    !input.http.success &&
    (input.http.classification === "probe_blocked" ||
      [401, 403, 407, 429].includes(Number(input.http.status_code)));
  const hasAddress =
    input.dns.success &&
    Boolean(input.dns.all_ips?.length || input.dns.resolved_ip);
  const missingHeaders =
    input.securityHeaders?.checks.filter((check) => !check.present) || [];
  const domainHold = Boolean(input.whois?.status?.toLowerCase().includes("hold"));

  const observed: DiagnosticEvidence[] = [
    evidence(input, "dns.result", "dns", {
      success: input.dns.success,
      resolvedIp: input.dns.resolved_ip,
      addresses: input.dns.all_ips || [],
      latency: input.dns.latency,
    }),
    evidence(input, "http.result", "http", {
      success: input.http.success,
      statusCode: input.http.status_code,
      classification: input.http.classification || "unknown",
      latency: input.http.latency,
      finalUrl: input.http.final_url,
      redirectCount: input.http.redirect_count || 0,
      redirectWarning: input.http.redirect_warning,
    }),
    evidence(input, "tls.result", "tls", {
      valid: input.ssl.valid,
      protocol: input.ssl.protocol,
      expiry: input.ssl.expiry,
      errorReason: input.ssl.error_reason,
    }),
    evidence(input, "headers.result", "headers", {
      passed: input.securityHeaders?.passed ?? 0,
      total: input.securityHeaders?.total ?? 0,
      checks: input.securityHeaders?.checks || [],
    }),
    evidence(input, "cdn.signature", "cdn", {
      matchedKnownSignature: input.cdn.is_provider,
      provider: input.cdn.is_provider ? input.cdn.provider : null,
      serverHeader: input.cdn.server,
    }),
  ];

  if (input.observations?.browser) {
    observed.push({
      id: "browser.http",
      area: "http",
      source: "your_browser",
      observationPoint: "Your browser",
      observedAt: input.observations.browser.checkedAt,
      value: { ...input.observations.browser },
    });
  }
  if (input.observations?.edge) {
    observed.push({
      id: "edge.http",
      area: "http",
      source: "cloudflare_edge",
      observationPoint: input.observations.edge.colo,
      observedAt: input.observations.edge.checkedAt,
      value: { ...input.observations.edge },
    });
  }

  const assessments: DiagnosticAssessment[] = [
    {
      id: "dns.availability",
      area: "dns",
      status: hasAddress ? "healthy" : "unreachable",
      evidenceIds: ["dns.result"],
      summary: hasAddress
        ? "DNS returned at least one usable address."
        : "DNS did not return a usable address.",
    },
    {
      id: "http.availability",
      area: "http",
      status:
        input.http.success || (corroboratedReachable && probeBlocked)
          ? "healthy"
          : probeBlocked
            ? "degraded"
            : hasAddress
              ? "unreachable"
              : "unknown",
      evidenceIds: [
        "http.result",
        ...(browserReachable ? ["browser.http"] : []),
        ...(edgeReachable ? ["edge.http"] : []),
      ],
      summary:
        input.http.success || (corroboratedReachable && probeBlocked)
          ? "The website is reachable from at least one full-precision observation point."
          : probeBlocked
            ? "The automated probe was rejected, so public availability is only partially assessed."
            : "The website did not return a reachable HTTP response.",
    },
    {
      id: "tls.public-certificate",
      area: "tls",
      status: input.ssl.valid
        ? "healthy"
        : isIp
          ? "not_applicable"
          : "degraded",
      evidenceIds: ["tls.result"],
      summary: input.ssl.valid
        ? "The observed public TLS certificate is valid."
        : isIp
          ? "Hostname certificate validation is not applicable to a raw IP target."
          : "The observed public TLS certificate could not be validated.",
    },
    {
      id: "headers.browser-hardening",
      area: "headers",
      status:
        probeBlocked || isIp || !input.securityHeaders?.total
          ? "unknown"
          : missingHeaders.length
            ? "needs_review"
            : "healthy",
      evidenceIds: ["headers.result"],
      summary:
        probeBlocked || isIp || !input.securityHeaders?.total
          ? "Browser security headers could not be fully assessed from this response."
          : missingHeaders.length
            ? `${missingHeaders.length} commonly recommended browser security header checks need review.`
            : "All configured browser security header checks passed.",
    },
    {
      id: "cdn.identification",
      area: "cdn",
      status: input.cdn.is_provider ? "healthy" : isIp ? "not_applicable" : "unknown",
      evidenceIds: ["cdn.signature"],
      summary: input.cdn.is_provider
        ? `A known CDN signature matched ${input.cdn.provider}.`
        : isIp
          ? "CDN identification is not applicable to a raw IP target."
          : "No known CDN signature identified.",
    },
  ];

  let verdict: DiagnosticVerdict;
  if (!hasAddress || domainHold) verdict = "Unreachable";
  else if (input.http.success || (corroboratedReachable && probeBlocked)) {
    verdict = input.ssl.valid || isIp ? "Healthy" : "Degraded";
  } else if (probeBlocked) verdict = "Degraded";
  else if (input.http.classification === "network_error" || input.http.status_code >= 500)
    verdict = "Unreachable";
  else verdict = "Unknown";

  const inferences: DiagnosticInference[] = [];
  if (!hasAddress) {
    inferences.push({
      id: "dns.records-or-delegation",
      area: "dns",
      confidence: "Medium",
      evidenceIds: ["dns.result"],
      summary: "DNS records or authoritative delegation may be missing or unavailable.",
    });
  } else if (probeBlocked && !corroboratedReachable) {
    inferences.push({
      id: "http.access-policy",
      area: "http",
      confidence: "Medium",
      evidenceIds: ["http.result"],
      summary: "An access-control, WAF, or bot policy may be rejecting the automated probe.",
    });
  } else if (!input.http.success && input.http.status_code >= 500) {
    inferences.push({
      id: "http.upstream-failure",
      area: "http",
      confidence: "Medium",
      evidenceIds: ["http.result"],
      summary: "The origin, an upstream dependency, or the edge-to-origin path may be failing.",
    });
  }
  if (!input.ssl.valid && !isIp) {
    inferences.push({
      id: "tls.configuration",
      area: "tls",
      confidence: input.ssl.error_reason ? "High" : "Medium",
      evidenceIds: ["tls.result"],
      summary: input.ssl.error_reason
        ? `TLS validation failed: ${input.ssl.error_reason}.`
        : "The public certificate or TLS endpoint may be misconfigured.",
    });
  }

  const guidance: DiagnosticGuidance[] = [];
  if (missingHeaders.length) {
    guidance.push({
      id: "headers.review",
      area: "headers",
      audience: "site_operator",
      summary:
        "If you operate this site, review the missing headers against the application's security and compatibility requirements.",
    });
  }
  if (!input.cdn.is_provider && !isIp) {
    guidance.push({
      id: "cdn.verify",
      area: "cdn",
      audience: "site_operator",
      summary:
        "If you operate this site and expect a CDN, verify DNS and edge configuration; absence of a known signature does not prove direct-origin delivery.",
    });
  }
  if (verdict !== "Healthy") {
    guidance.push({
      id: "availability.compare",
      area: "availability",
      audience: "anyone",
      summary: "Compare the result from another region or network before drawing a global availability conclusion.",
    });
  }

  return {
    schemaVersion: "opskitpro.diagnostic.v1",
    verdict,
    evidence: observed,
    assessments,
    inferences,
    guidance,
    policy: POLICY,
  };
}
