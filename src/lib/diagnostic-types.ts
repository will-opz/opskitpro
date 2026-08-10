export type DiagnosticResolver = {
  name?: string;
  resolver?: string;
  status: string;
  latency?: number | string;
};

export type DiagnosticVerdict =
  | "Healthy"
  | "Degraded"
  | "Unreachable"
  | "Unknown";

export type DiagnosticAssessmentStatus =
  | "healthy"
  | "degraded"
  | "unreachable"
  | "needs_review"
  | "unknown"
  | "not_applicable";

export type DiagnosticConfidence = "High" | "Medium" | "Low";

/** An immutable projection of a value returned by a probe. */
export type DiagnosticEvidence = {
  id: string;
  area: string;
  source: "opskitpro_probe" | "cloudflare_edge" | "your_browser";
  observationPoint: string;
  observedAt?: string;
  value: unknown;
};

/** A deterministic rule evaluation over one or more evidence records. */
export type DiagnosticAssessment = {
  id: string;
  area: string;
  status: DiagnosticAssessmentStatus;
  evidenceIds: string[];
  summary: string;
};

/** A possible explanation, only emitted when evidence supports an abnormal result. */
export type DiagnosticInference = {
  id: string;
  area: string;
  confidence: DiagnosticConfidence;
  evidenceIds: string[];
  summary: string;
};

/** Contextual advice. Owner-only changes must be explicitly conditional. */
export type DiagnosticGuidance = {
  id: string;
  area: string;
  audience: "anyone" | "site_operator";
  summary: string;
};

export type DiagnosticModel = {
  schemaVersion: "opskitpro.diagnostic.v1";
  verdict: DiagnosticVerdict;
  evidence: DiagnosticEvidence[];
  assessments: DiagnosticAssessment[];
  inferences: DiagnosticInference[];
  guidance: DiagnosticGuidance[];
  policy: {
    evidence: "observed";
    assessment: "rule-derived";
    inference: "confidence-bound";
    guidance: "contextual";
    aiMayAlterEvidence: false;
  };
};

export type DiagnosticResponse = {
  domain: string;
  status?: string;
  isVisitor?: boolean;
  isActuallyIp?: boolean;
  isPrivate?: boolean;
  error?: string;
  dns: {
    resolved_ip: string;
    latency: string | number;
    success: boolean;
    all_ips: string[];
    ipv4?: string[];
    ipv6?: string[];
    dual_stack?: boolean;
    ns: string[];
    records?: Partial<
      Record<"A" | "AAAA" | "CNAME" | "MX" | "TXT" | "CAA" | "SOA", string[]>
    >;
    resolvers?: DiagnosticResolver[];
  };
  http: {
    success: boolean;
    status_code: number;
    latency: string | number;
    is_https: boolean;
    final_url?: string;
    redirect_chain?: unknown[];
    redirect_count?: number;
    redirect_warning?: string;
    cf_ray?: string;
    page_title?: string;
    classification?:
      | "reachable"
      | "redirected"
      | "probe_blocked"
      | "origin_error"
      | "network_error"
      | "unknown";
    challenge?: boolean;
    observation?: {
      source: "opskitpro_probe";
      location: string;
      precision: "full";
    };
  };
  observations?: {
    browser?: {
      source: "your_browser";
      status: "reachable" | "failed" | "not_available";
      precision: "full" | "limited" | "not_available";
      httpStatus?: number;
      finalUrl?: string;
      latencyMs?: number;
      checkedAt: string;
    };
    edge?: {
      source: "cloudflare_edge";
      status: NonNullable<DiagnosticResponse["http"]["classification"]>;
      precision: "full";
      colo: string;
      httpStatus?: number;
      latencyMs?: number;
      finalUrl?: string;
      redirectChain?: unknown[];
      challenge?: boolean;
      pageTitle?: string;
      error?: string;
      checkedAt: string;
    };
    server?: {
      source: "opskitpro_probe";
      status: DiagnosticResponse["http"]["classification"];
      precision: "full";
      location: string;
    };
  };
  securityHeaders?: {
    score: number;
    grade: string;
    passed: number;
    total: number;
    checks: Array<{
      key: string;
      label: string;
      present: boolean;
      value?: string;
    }>;
  };
  ssl: {
    valid: boolean;
    date_valid?: boolean;
    hostname_valid?: boolean;
    chain_authorized?: boolean;
    ocsp_stapled?: boolean;
    issuer: string;
    expiry: string;
    subject_alt_name?: string;
    grade?: string;
    factors?: string[];
    tls_version?: string;
    protocol?: string;
    cipher?: string;
    alpn?: string;
    legacy_tls_accepted?: boolean | string;
    error_reason?: string;
    chain?: unknown[];
  };
  cdn: {
    is_provider: boolean;
    provider: string;
    server: string;
  };
  geo?: {
    country?: string;
    isp?: string;
    city?: string;
    asn?: string;
  };
  whois?: {
    registered?: string;
    registrar?: string;
    status?: string;
    success?: boolean;
    expires?: string;
    error?: string;
    errorCode?:
      | "invalid_target"
      | "not_found"
      | "timeout"
      | "upstream_error"
      | "network_error"
      | "parse_error";
    lookupTarget?: string;
    source?: "rdap";
    httpStatus?: number;
    nameservers?: string[];
  };
  meta?: {
    checkedAt?: string;
    servedAt?: string;
    totalMs?: number;
    coreMs?: number;
    enrichmentMs?: number;
    cacheLookupMs?: number;
    cacheAgeSeconds?: number;
    edgeColo?: string;
    cacheStatus?: "HIT" | "MISS" | "BYPASS";
  };
  diagnosis?: DiagnosticModel;
};

export function isDiagnosticResponse(value: unknown): value is DiagnosticResponse {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<DiagnosticResponse>;
  return Boolean(
    typeof candidate.domain === "string" &&
      candidate.dns &&
      candidate.http &&
      candidate.ssl &&
      candidate.cdn,
  );
}
