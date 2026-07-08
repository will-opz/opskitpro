export type DnsRecordType =
  "A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT" | "SOA" | "PTR" | "SRV" | "CAA";

export type DnsProvider = "cloudflare" | "google" | "aliyun" | "quad9";

export interface DnsAnswer {
  name: string;
  type: string | number;
  ttl: number;
  data: string;
  priority?: number;
  exchange?: string;
}

export interface DnsLookupResponse {
  domain: string;
  type: DnsRecordType;
  provider: string;
  status: string;
  statusCode: number;
  responseTime: number;
  truncated: boolean;
  recursionDesired: boolean;
  recursionAvailable: boolean;
  authenticData: boolean;
  checkingDisabled: boolean;
  question?: Array<{
    name: string;
    type: string | number;
  }>;
  answers: DnsAnswer[];
  authority?: DnsAnswer[];
  comment?: string;
  raw: unknown;
  error?: string;
}

export interface DnsBatchResultItem {
  type: DnsRecordType;
  status?: string;
  answers: DnsAnswer[];
  error?: string;
}

export interface DnsBatchResponse {
  domain: string;
  provider: string;
  responseTime: number;
  results: DnsBatchResultItem[];
}

export interface DiagnosticHealthResponse {
  status: "ready";
  service: "diagnostic";
  timestamp: string;
}

export interface DiagnosticDnsResolverResult {
  resolver: string;
  data: unknown;
  latencyMs?: number;
  status?: "OK" | "FAILED";
  records?: {
    A: string[];
    AAAA: string[];
  };
}

export interface DiagnosticDnsRecordsSummary {
  A: string[];
  AAAA: string[];
  CNAME: string[];
  MX: string[];
  TXT: string[];
  CAA: string[];
  SOA: string[];
}

export interface DiagnosticDnsSummary {
  resolved_ip: string;
  latency: string;
  success: boolean;
  all_ips?: string[];
  ipv4?: string[];
  ipv6?: string[];
  dual_stack?: boolean;
  ns?: string[];
  records?: DiagnosticDnsRecordsSummary;
  resolvers?: DiagnosticDnsResolverResult[];
}

export interface DiagnosticHttpSummary {
  success: boolean;
  status_code: number;
  latency: string;
  is_https?: boolean;
  final_url?: string;
  redirect_chain?: Array<{
    url: string;
    status: number;
    location?: string;
  }>;
  redirect_count?: number;
  redirect_warning?: string;
  cf_ray?: string;
  page_title?: string;
}

export interface DiagnosticSecurityHeaderCheck {
  key: string;
  label: string;
  present: boolean;
  value?: string;
  severity: "critical" | "warning" | "info";
  recommendation: string;
}

export interface DiagnosticSecurityHeadersSummary {
  score: number;
  grade: string;
  passed: number;
  total: number;
  checks: DiagnosticSecurityHeaderCheck[];
}

export interface DiagnosticSslSummary {
  valid: boolean;
  issuer: string;
  expiry: string;
  grade?: string;
  factors?: string[];
  tls_version?: string;
  chain?: Array<{
    level: string;
    name: string;
    status: string;
  }>;
}

export interface DiagnosticCdnSummary {
  is_provider: boolean;
  provider: string;
  server: string;
}

export interface DiagnosticGeoSummary {
  country: string;
  isp: string;
  city: string;
  asn: string | number;
}

export interface DiagnosticWhoisSummary {
  registered: string;
  registrar: string;
  status: string;
  success: boolean;
  expires: string;
  error?: string;
  nameservers?: string[];
}

export interface DiagnosticMetaSummary {
  checkedAt: string;
  servedAt?: string;
  totalMs: number;
  coreMs?: number;
  enrichmentMs?: number;
  cacheLookupMs?: number;
  cacheAgeSeconds?: number;
  edgeColo: string;
  cacheStatus?: "HIT" | "MISS" | "BYPASS" | "BROWSER";
}

export interface DiagnosticSuccessResponse {
  domain: string;
  status: "success";
  isVisitor?: boolean;
  isActuallyIp: boolean;
  isPrivate: boolean;
  dns: DiagnosticDnsSummary;
  http: DiagnosticHttpSummary;
  securityHeaders?: DiagnosticSecurityHeadersSummary;
  ssl: DiagnosticSslSummary;
  cdn: DiagnosticCdnSummary;
  geo: DiagnosticGeoSummary;
  whois: DiagnosticWhoisSummary;
  meta?: DiagnosticMetaSummary;
}

export interface DiagnosticPartialErrorResponse {
  domain: string;
  status: "partial_error";
  isVisitor?: boolean;
  isActuallyIp: boolean;
  isPrivate: boolean;
  error: string;
  dns: DiagnosticDnsSummary;
  meta?: DiagnosticMetaSummary;
}

export interface DiagnosticErrorResponse {
  status: "error";
  message: string;
}

export interface DiagnosticPostSuccessResponse {
  success: true;
  data: {
    target: string;
    status: "online";
    timestamp: string;
  };
}

export interface DiagnosticPostErrorResponse {
  error: string;
}

export type DiagnosticResponse =
  | DiagnosticHealthResponse
  | DiagnosticSuccessResponse
  | DiagnosticPartialErrorResponse
  | DiagnosticErrorResponse;

export type DiagnosticPostResponse =
  DiagnosticPostSuccessResponse | DiagnosticPostErrorResponse;

export type IpLookupSource =
  | "cloudflare-context"
  | "external-lookup"
  | "local-fallback"
  | "cloudflare-edge-default";

export interface IpLookupResponse {
  ip: string;
  country: string;
  country_name: string;
  country_code: string;
  region: string;
  city: string;
  latitude: string;
  longitude: string;
  lat: string | number;
  lon: string | number;
  org: string;
  isp: string;
  asn: string | number;
  timezone: string;
  network_type: string;
  proxy: boolean;
  provider: string;
  _source: IpLookupSource;
}

// ─── Network Check ──────────────────────────────────────────────────────────

export interface NetworkInfoResponse {
  ip: string;
  ipv6: string | null;
  asn: number | string | null;
  org: string;
  country: string;
  city: string;
  colo: string;
  timezone: string;
  ua: string;
  trace: {
    http: string;
    tls: string;
    warp: string;
    gateway?: string;
    loc?: string;
    sni?: string;
    kex?: string;
    ip: string;
    colo: string;
  } | null;
  _source: "cloudflare-context" | "fallback";
}

export interface PingResult {
  min: number;
  avg: number;
  max: number;
  jitter: number;
  samples: number[];
}

export interface SpeedResult {
  downloadMbps: number | null;
  downloadDurationMs: number;
  downloadBytes: number;
}

export interface DnsPerfResult {
  dnsMs: number | null;
  tcpMs: number | null;
  tlsMs: number | null;
  ttfbMs: number | null;
}

export interface DnsLatencyItem {
  resolver: string;
  provider: string;
  latencyMs: number | null;
  status: "ok" | "failed";
}

export interface DnsLatencyResponse {
  results: DnsLatencyItem[];
}

export interface ReachabilityItem {
  url: string;
  label: string;
  reachable: boolean;
  latencyMs: number | null;
  status: "ok" | "slow" | "failed";
}

export interface ReachabilityResponse {
  results: ReachabilityItem[];
}

export interface NetworkAnalysis {
  score: number;
  grade: "A" | "B" | "C" | "D" | "F";
  ipVersion: "dual-stack" | "ipv4-only" | "ipv6-only";
  summary: string;
  suitableFor: string[];
  potentialIssues: string[];
  recommendations: string[];
}
