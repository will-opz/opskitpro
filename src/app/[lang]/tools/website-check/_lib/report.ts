import {
  calculateScore,
  createSafeDiagnosticResult,
  isBlockedHttpStatus,
  parseLatencyMs,
} from "../_hooks/helpers";
import { buildWebsiteDiagnosticModel } from "@/lib/diagnostic-model";
import type {
  DiagnosticAssessment,
  DiagnosticEvidence,
  DiagnosticGuidance,
  DiagnosticInference,
  DiagnosticVerdict,
} from "@/lib/diagnostic-types";

export const WEBSITE_CHECK_REPORT_FORMAT_VERSION = "website-check-report.v1";

export type WebsiteCheckFindingSeverity =
  "critical" | "warning" | "info" | "success";
export type WebsiteCheckFindingStatus = "error" | "warning" | "ok";
export type WebsiteCheckReportStatus = "critical" | "degraded" | "healthy";
export type WebsiteCheckLanguage = "en" | "zh";
export type WebsiteCheckResult = ReturnType<typeof createSafeDiagnosticResult>;

export type WebsiteCheckFinding = {
  id: string;
  key: string;
  severity: WebsiteCheckFindingSeverity;
  status: WebsiteCheckFindingStatus;
  title: string;
  summary: string;
  description: string;
  evidence: string[];
  likelyCause: string;
  recommendedFix: string;
  verificationSteps: string[];
  relatedToolHref?: string;
  relatedArticleHref?: string;
};

export type WebsiteCheckReport = {
  formatVersion: typeof WEBSITE_CHECK_REPORT_FORMAT_VERSION;
  generatedAt: string;
  target: string;
  /** @deprecated Compatibility only. Do not use as the overall verdict. */
  score: number;
  status: WebsiteCheckReportStatus;
  verdict: DiagnosticVerdict;
  summary: string;
  impact: string;
  /** @deprecated Use inferences. Absent when no supported abnormal inference exists. */
  suspectedCause?: string;
  evidence: string[];
  evidenceRecords: DiagnosticEvidence[];
  assessments: DiagnosticAssessment[];
  inferences: DiagnosticInference[];
  guidance: DiagnosticGuidance[];
  /** @deprecated Use guidance. */
  nextActions: string[];
  findings: WebsiteCheckFinding[];
  observations?: WebsiteCheckResult["observations"];
};

type ReportCopy = {
  verdict: Record<WebsiteCheckReportStatus, string>;
  summary: Record<WebsiteCheckReportStatus, string>;
  impact: Record<WebsiteCheckReportStatus, string>;
  noIssueCause: string;
  noIssueFix: string;
  noIssueVerify: string;
  httpBlockedSummary: (status: number | string) => string;
  httpBlockedCause: string;
  httpBlockedFix: string;
  httpFailureSummary: (status?: number) => string;
  httpFailureCause: string;
  httpFailureFix: string;
  httpFailureVerify: string[];
  labels: {
    dns: string;
    http: string;
    ssl: string;
    headers: string;
    cdn: string;
    domain: string;
  };
};

const REPORT_COPY: Record<WebsiteCheckLanguage, ReportCopy> = {
  en: {
    verdict: {
      healthy: "All Systems Green",
      degraded: "Reachable with warnings",
      critical: "Action required",
    },
    summary: {
      healthy:
        "The target is reachable and the main availability, TLS, CDN, and security header checks look healthy.",
      degraded:
        "The target is reachable, but OpsKitPro found configuration or hardening issues worth fixing.",
      critical:
        "OpsKitPro found one or more issues that can affect user-facing availability or browser trust.",
    },
    impact: {
      healthy: "No immediate user impact detected.",
      degraded:
        "Service is reachable, but configuration risk, blocked probing, or performance drift exists.",
      critical: "User-facing availability, trust, or routing may be affected.",
    },
    noIssueCause: "No obvious fault detected from this probe.",
    noIssueFix:
      "Continue normal monitoring and keep DNS, TLS, CDN, and header policies under change control.",
    noIssueVerify:
      "Run Website Check again after the next deployment or DNS/TLS change.",
    httpBlockedSummary: (status) =>
      `The target is reachable, but this probe was rejected with HTTP ${status}.`,
    httpBlockedCause:
      "WAF, access control, bot protection, IP allowlist, or origin Host/SNI policy rejected the probe.",
    httpBlockedFix:
      "Review WAF, access, and bot rules, then confirm the origin accepts the expected Host and SNI.",
    httpFailureSummary: (status) =>
      `HTTP did not complete successfully${status ? `; status ${status}` : ""}.`,
    httpFailureCause:
      "Origin service downtime, firewall policy, routing failure, or application error.",
    httpFailureFix:
      "Check origin health, firewall rules, listener ports, upstream logs, and CDN origin configuration.",
    httpFailureVerify: [
      "Run curl against the origin and the public hostname.",
      "Check CDN edge logs and origin access logs for the same timestamp.",
      "Run Website Check again after the origin or WAF change.",
    ],
    labels: {
      dns: "DNS",
      http: "HTTP",
      ssl: "SSL",
      headers: "Security Headers",
      cdn: "CDN",
      domain: "Domain",
    },
  },
  zh: {
    verdict: {
      healthy: "状态良好",
      degraded: "可访问但有警告",
      critical: "需要处理",
    },
    summary: {
      healthy: "目标可访问，主要可用性、TLS、CDN 与安全响应头检查表现良好。",
      degraded: "目标可访问，但 OpsKitPro 发现了需要修复的配置或安全加固问题。",
      critical:
        "OpsKitPro 发现了可能影响用户访问、浏览器信任或路由解析的问题。",
    },
    impact: {
      healthy: "暂未发现直接用户影响。",
      degraded: "服务可访问，但存在配置风险、探测被拦截或性能漂移。",
      critical: "可能影响用户可用性、浏览器信任或流量路由。",
    },
    noIssueCause: "本次探测未发现明显故障。",
    noIssueFix: "继续保持监控，并将 DNS、TLS、CDN 和响应头策略纳入变更管理。",
    noIssueVerify: "下次部署或 DNS/TLS 变更后再次运行 Website Check。",
    httpBlockedSummary: (status) =>
      `目标可以访问，但本次探测被 HTTP ${status} 拒绝。`,
    httpBlockedCause:
      "WAF、访问控制、机器人防护、IP 白名单或源站 Host/SNI 策略拒绝了探测请求。",
    httpBlockedFix:
      "检查 WAF、访问控制和机器人规则，并确认源站接受预期的 Host 与 SNI。",
    httpFailureSummary: (status) =>
      `HTTP 探测未成功完成${status ? `；状态码 ${status}` : ""}。`,
    httpFailureCause: "源站服务、监听端口、防火墙、路由或应用可能发生故障。",
    httpFailureFix:
      "检查源站健康状态、防火墙、监听端口、上游日志和 CDN 源站配置。",
    httpFailureVerify: [
      "分别使用 curl 检查源站和公开域名。",
      "根据同一时间点检查 CDN 边缘日志与源站访问日志。",
      "修复源站或 WAF 后重新运行 Website Check。",
    ],
    labels: {
      dns: "DNS",
      http: "HTTP",
      ssl: "SSL",
      headers: "安全响应头",
      cdn: "CDN",
      domain: "域名",
    },
  },
};

const statusFromSeverity = (
  severity: WebsiteCheckFindingSeverity,
): WebsiteCheckFindingStatus => {
  if (severity === "critical") return "error";
  if (severity === "warning") return "warning";
  return "ok";
};

const makeFinding = (
  finding: Omit<WebsiteCheckFinding, "status" | "description">,
): WebsiteCheckFinding => ({
  ...finding,
  status: statusFromSeverity(finding.severity),
  description: finding.summary,
});

const hasDnsAddress = (data: WebsiteCheckResult) => {
  return (
    Boolean(data.dns.resolved_ip && data.dns.resolved_ip !== data.domain) ||
    Boolean(data.dns.all_ips?.length) ||
    Boolean(data.dns.records?.A?.length) ||
    Boolean(data.dns.records?.AAAA?.length)
  );
};

const isExpiringSoon = (expiry?: string) => {
  if (!expiry || expiry === "Unknown") return false;
  const time = new Date(expiry).getTime();
  if (!Number.isFinite(time)) return false;
  const days = (time - Date.now()) / 86_400_000;
  return days >= 0 && days <= 15;
};

const getCloudflareHint = (data: WebsiteCheckResult) => {
  const status = Number(data.http.status_code || 0);
  const title = String(data.http.page_title || "").toLowerCase();
  const server = String(data.cdn.server || "").toLowerCase();
  const looksCloudflare =
    data.cdn.provider === "Cloudflare" ||
    server.includes("cloudflare") ||
    Boolean(data.http.cf_ray);

  if (!looksCloudflare && !title.includes("cloudflare")) return null;
  if (status >= 520 && status <= 530) return `Cloudflare ${status}`;
  if (
    status === 403 &&
    (title.includes("1020") || title.includes("access denied"))
  )
    return "Cloudflare 1020";
  if (
    status === 429 &&
    (title.includes("1015") || title.includes("rate limit"))
  )
    return "Cloudflare 1015";
  if (title.includes("error 522")) return "Cloudflare 522";
  if (title.includes("error 525")) return "Cloudflare 525";
  return null;
};

export function buildWebsiteCheckReport(
  data: WebsiteCheckResult,
  options: { lang?: WebsiteCheckLanguage; generatedAt?: string } = {},
): WebsiteCheckReport {
  const lang = options.lang || "en";
  const copy = REPORT_COPY[lang] || REPORT_COPY.en;
  const score = calculateScore(data);
  const diagnosis = buildWebsiteDiagnosticModel(data);
  const isIpOrVisitor = Boolean(data.isVisitor || data.isActuallyIp);
  const blocked =
    !data.http.success &&
    (data.http.classification === "probe_blocked" ||
      isBlockedHttpStatus(data.http.status_code));
  const browserReachable =
    data.observations?.browser?.status === "reachable" &&
    data.observations.browser.precision === "full";
  const edgeReachable =
    (data.observations?.edge?.status === "reachable" ||
      data.observations?.edge?.status === "redirected") &&
    data.observations.edge.precision === "full";
  const corroboratedReachable = browserReachable || edgeReachable;
  const missingHeaders =
    data.securityHeaders?.checks?.filter((check: any) => !check.present) || [];
  const findings: WebsiteCheckFinding[] = [];

  findings.push(
    makeFinding({
      id:
        data.dns.success && hasDnsAddress(data)
          ? "dns.resolved"
          : "dns.unresolved",
      key: "dns",
      severity:
        data.dns.success && hasDnsAddress(data) ? "success" : "critical",
      title: copy.labels.dns,
      summary:
        data.dns.success && hasDnsAddress(data)
          ? `Resolved to ${data.dns.all_ips?.length ? data.dns.all_ips.join(", ") : data.dns.resolved_ip}.`
          : "DNS resolution did not return a usable A or AAAA record.",
      evidence: [
        `Resolved IP: ${data.dns.resolved_ip || "Unknown"}`,
        `A records: ${data.dns.records?.A?.length || 0}`,
        `AAAA records: ${data.dns.records?.AAAA?.length || 0}`,
        `Lookup latency: ${data.dns.latency}`,
      ],
      likelyCause:
        data.dns.success && hasDnsAddress(data)
          ? copy.noIssueCause
          : "Missing or stale DNS records, registrar/nameserver drift, or a zone propagation issue.",
      recommendedFix:
        data.dns.success && hasDnsAddress(data)
          ? copy.noIssueFix
          : "Confirm authoritative nameservers, restore A/AAAA records, and lower TTL while recovering.",
      verificationSteps:
        data.dns.success && hasDnsAddress(data)
          ? [copy.noIssueVerify]
          : [
              "Query authoritative nameservers directly.",
              "Check public resolvers from multiple regions.",
              "Run Website Check again after DNS propagation.",
            ],
      relatedToolHref: `/${lang}/tools/dns-lookup`,
    }),
  );

  const cloudflareHint = getCloudflareHint(data);
  const httpSeverity: WebsiteCheckFindingSeverity =
    corroboratedReachable && blocked
      ? "info"
      : data.http.success
    ? data.http.redirect_warning
      ? "warning"
      : parseLatencyMs(data.http.latency) > 2000
        ? "warning"
        : "success"
    : blocked
      ? "warning"
      : "critical";
  findings.push(
    makeFinding({
      id: data.http.success
        ? "http.reachable"
        : corroboratedReachable && blocked
          ? browserReachable
            ? "http.browser-reachable-probe-blocked"
            : "http.edge-reachable-probe-blocked"
        : blocked
          ? "http.blocked"
          : "http.unreachable",
      key: "http",
      severity: httpSeverity,
      title: copy.labels.http,
      summary: data.http.success
        ? `HTTP returned ${data.http.status_code || "OK"} in ${data.http.latency}.`
        : corroboratedReachable && blocked
          ? lang === "zh"
            ? `${browserReachable ? "用户浏览器" : "Cloudflare Edge"}访问正常，但 OpsKitPro Probe 被 HTTP ${data.http.status_code || "ERR"} 拒绝。`
            : `${browserReachable ? "Your browser" : "Cloudflare Edge"} can reach the site, but OpsKitPro Probe was rejected with HTTP ${data.http.status_code || "ERR"}.`
        : blocked
          ? copy.httpBlockedSummary(data.http.status_code || "ERR")
          : copy.httpFailureSummary(data.http.status_code),
      evidence: [
        browserReachable
          ? `Your Browser: HTTP ${data.observations?.browser?.httpStatus || "OK"} · ${data.observations?.browser?.latencyMs ?? "—"}ms`
          : "",
        data.observations?.edge
          ? `Cloudflare Edge Probe (${data.observations.edge.colo}): ${data.observations.edge.status} · HTTP ${data.observations.edge.httpStatus || "—"} · ${data.observations.edge.latencyMs ?? "—"}ms`
          : "",
        `OpsKitPro Probe: HTTP ${data.http.status_code || "ERR"} · ${data.http.latency}`,
        `HTTP status: ${data.http.status_code || "ERR"}`,
        `Latency: ${data.http.latency}`,
        `Final URL: ${data.http.final_url || "Unknown"}`,
        `Redirects: ${data.http.redirect_count ?? 0}${data.http.redirect_warning ? ` (${data.http.redirect_warning})` : ""}`,
        cloudflareHint ? `Edge hint: ${cloudflareHint}` : "",
      ].filter(Boolean),
      likelyCause: data.http.success
        ? data.http.redirect_warning || copy.noIssueCause
        : corroboratedReachable && blocked
          ? lang === "zh"
            ? `${browserReachable ? "用户浏览器" : "Cloudflare Edge"}确认网站可访问，但安全策略限制了来自 Lightsail 的自动化探测。`
            : `${browserReachable ? "The user browser" : "Cloudflare Edge"} confirms the site is reachable, while security policy limits the automated Lightsail probe.`
        : blocked
          ? copy.httpBlockedCause
          : cloudflareHint
            ? `${cloudflareHint} usually points to an origin connectivity, TLS, DNS, or edge security rule problem.`
            : copy.httpFailureCause,
      recommendedFix: data.http.success
        ? data.http.redirect_warning
          ? "Review redirect rules and remove loops or unnecessary hops."
          : copy.noIssueFix
        : corroboratedReachable && blocked
          ? lang === "zh"
            ? "无需按站点宕机处理；如需完整服务端监控，可选择放行已知探针。"
            : "Do not treat this as downtime; optionally allowlist the known probe for full server-side monitoring."
        : blocked
          ? copy.httpBlockedFix
          : copy.httpFailureFix,
      verificationSteps: data.http.success
        ? [
            "Open the final URL from a clean browser session.",
            "Re-run Website Check after redirect or application changes.",
          ]
        : corroboratedReachable && blocked
          ? [
              lang === "zh"
                ? "继续从用户浏览器确认公开页面可访问。"
                : "Continue verifying the public page from the user browser.",
            ]
          : copy.httpFailureVerify,
    }),
  );

  const sslSoon = isExpiringSoon(data.ssl.expiry) || data.ssl.grade === "C";
  const sslValid = data.ssl.valid;
  const isCdn = data.cdn.is_provider;

  findings.push(
    makeFinding({
      id: sslValid
        ? sslSoon
          ? "ssl.expiring"
          : "ssl.valid"
        : isIpOrVisitor
          ? "ssl.not-applicable"
          : "ssl.invalid",
      key: "ssl",
      severity: sslValid
        ? sslSoon
          ? "warning"
          : "success"
        : isIpOrVisitor
          ? "info"
          : "critical",
      title: copy.labels.ssl,
      summary: sslValid
        ? `Certificate is valid and matches hostname, expires ${data.ssl.expiry}.`
        : isIpOrVisitor
          ? "TLS certificate validation is not applicable to this public IP probe."
          : `TLS validation failed: ${
              data.ssl.date_valid === false ? "Certificate has expired." :
              data.ssl.hostname_valid === false ? "Hostname mismatch." :
              data.ssl.chain_authorized === false ? "Untrusted issuer." :
              data.ssl.error_reason || "Unknown error."
            }`,
      evidence: [
        `Valid: ${sslValid ? "yes" : "no"}`,
        `Protocol: ${data.ssl.protocol || "Unknown"}`,
        `Issuer: ${data.ssl.issuer || "Unknown"}`,
        `Expiry: ${data.ssl.expiry || "Unknown"}`,
        `OCSP Stapled: ${data.ssl.ocsp_stapled === true ? "yes" : data.ssl.ocsp_stapled === false ? "no" : "unknown"}`,
        data.ssl.subject_alt_name ? `SANs: ${data.ssl.subject_alt_name}` : "",
        !sslValid && data.ssl.error_reason ? `Error: ${data.ssl.error_reason}` : "",
      ].filter(Boolean),
      likelyCause: sslValid
        ? sslSoon
          ? "The certificate is valid but close to renewal time."
          : copy.noIssueCause
        : isIpOrVisitor
          ? "A raw IP probe usually cannot match the hostname on a certificate."
          : data.ssl.date_valid === false
            ? "The certificate has expired or its start date is in the future."
          : data.ssl.hostname_valid === false
            ? "The server returned a certificate that does not cover the requested hostname."
          : data.ssl.chain_authorized === false
            ? "The certificate is self-signed or missing intermediate certificates."
          : "TLS handshake failed due to a network reset, protocol mismatch, or firewall block.",
      recommendedFix: sslValid
        ? sslSoon
          ? "Renew the certificate before expiry."
          : copy.noIssueFix
        : isIpOrVisitor
          ? "Test the hostname that users visit when validating TLS."
          : data.ssl.date_valid === false
            ? "Renew and install the updated certificate on your server or CDN."
          : data.ssl.hostname_valid === false
            ? "Ensure the server is configured to serve the correct certificate for this hostname (SNI)."
          : data.ssl.chain_authorized === false
            ? "Install a trusted certificate and ensure all intermediate certificates are included."
          : "Review server access logs and check if the origin allows traffic from OpsKitPro.",
      verificationSteps: sslValid
        ? [
            "Check the certificate expiry in your CDN or certificate manager.",
            "Run Website Check after renewal.",
          ]
        : [
            "Inspect the certificate chain with your CDN/origin TLS tool.",
            "Confirm the certificate SAN includes the hostname.",
            "Re-run Website Check after replacing the certificate.",
          ],
    }),
  );

  if (data.ssl.legacy_tls_accepted && data.ssl.legacy_tls_accepted !== "unknown") {
    const protoName = typeof data.ssl.legacy_tls_accepted === "string" ? data.ssl.legacy_tls_accepted : "Unknown Legacy";
    findings.push(
      makeFinding({
        id: "ssl.legacy-supported",
        key: "ssl",
        severity: "warning",
        title: "Legacy TLS Support",
        summary: "A handshake allowing up to TLS 1.1 succeeded.",
        evidence: [
          `Legacy Handshake (TLSv1.1 max): Accepted`,
          `Negotiated Protocol: ${protoName}`
        ],
        likelyCause: "The server or edge proxy is configured to allow outdated TLS protocols for legacy client compatibility.",
        recommendedFix: "Disable TLS 1.0 and TLS 1.1 in your web server or CDN SSL/TLS settings.",
        verificationSteps: [
          "Update your web server configuration (e.g., ssl_protocols TLSv1.2 TLSv1.3 in Nginx).",
          "Re-run Website Check after deploying the config.",
        ],
      })
    );
  }

  if (isCdn) {
    findings.push(
      makeFinding({
        id: "ssl.cdn-termination",
        key: "ssl",
        severity: "info",
        title: "Edge TLS Termination",
        summary: `TLS appears terminated by ${data.cdn.provider} edge. Findings describe the public edge certificate, not necessarily the origin certificate.`,
        evidence: [
          `CDN detected: ${data.cdn.provider}`,
          `Server header: ${data.cdn.server || "Unknown"}`,
        ],
        likelyCause: copy.noIssueCause,
        recommendedFix: "Ensure your origin server also has a valid certificate installed (e.g., Full Strict mode in Cloudflare) to encrypt traffic between the edge and origin.",
        verificationSteps: [
          "Check origin certificate status manually via server IP.",
        ],
      })
    );
  }

  findings.push(
    makeFinding({
      id:
        blocked || isIpOrVisitor
          ? "headers.not-graded"
          : missingHeaders.length
            ? "headers.missing"
            : "headers.ok",
      key: "headers",
      severity:
        blocked || isIpOrVisitor
          ? "info"
          : missingHeaders.length
            ? "warning"
            : "success",
      title: copy.labels.headers,
      summary:
        blocked || isIpOrVisitor
          ? "Security headers could not be fully graded for this probe."
          : missingHeaders.length
            ? `Missing or weak headers: ${missingHeaders.map((check: any) => check.label).join(", ")}.`
            : `Security headers grade is ${data.securityHeaders?.grade || "OK"}.`,
      evidence: [
        `Score: ${data.securityHeaders?.score ?? 0}/100`,
        `Passed: ${data.securityHeaders?.passed ?? 0}/${data.securityHeaders?.total ?? 0}`,
        missingHeaders.length
          ? `Missing: ${missingHeaders.map((check: any) => check.label).join(", ")}`
          : "Missing: none detected",
      ],
      likelyCause: missingHeaders.length
        ? ""
        : copy.noIssueCause,
      recommendedFix: missingHeaders.length
        ? "If you operate this site, review the missing headers against the application's security and compatibility requirements."
        : copy.noIssueFix,
      verificationSteps: missingHeaders.length
        ? [
            "Deploy header changes in staging first.",
            "Check the final public URL because redirects can change headers.",
            "Re-run Website Check and confirm the header score improves.",
          ]
        : [copy.noIssueVerify],
    }),
  );

  findings.push(
    makeFinding({
      id:
        data.cdn.is_provider || isIpOrVisitor
          ? "cdn.detected"
          : "cdn.not-detected",
      key: "cdn",
      severity: data.cdn.is_provider || isIpOrVisitor ? "success" : "info",
      title: copy.labels.cdn,
      summary: data.cdn.is_provider
        ? `Detected ${data.cdn.provider}.`
        : isIpOrVisitor
          ? "CDN detection is not applicable to a raw IP probe."
          : "Unknown · No known CDN signature identified.",
      evidence: [
        `Provider: ${data.cdn.provider || "Unknown"}`,
        `Server: ${data.cdn.server || "Unknown"}`,
        `Edge colo: ${data.meta?.edgeColo || "Unknown"}`,
      ],
      likelyCause:
        data.cdn.is_provider || isIpOrVisitor
          ? copy.noIssueCause
          : "",
      recommendedFix:
        data.cdn.is_provider || isIpOrVisitor
          ? copy.noIssueFix
          : "If you operate this site and expect a CDN, verify DNS and edge configuration; an unmatched signature does not prove direct-origin delivery.",
      verificationSteps:
        data.cdn.is_provider || isIpOrVisitor
          ? [copy.noIssueVerify]
          : [
              "Check DNS records and CDN proxy status.",
              "Inspect response headers for edge provider markers.",
              "Re-run Website Check after enabling the CDN.",
            ],
    }),
  );

  if (data.whois?.status?.toLowerCase().includes("hold")) {
    findings.unshift(
      makeFinding({
        id: "domain.hold",
        key: "domain",
        severity: "critical",
        title: copy.labels.domain,
        summary: `Registrar status contains hold: ${data.whois.status}.`,
        evidence: [
          `WHOIS status: ${data.whois.status}`,
          `Registrar: ${data.whois.registrar || "Unknown"}`,
        ],
        likelyCause:
          "Registrar hold, compliance hold, or domain lifecycle issue can interrupt DNS publication.",
        recommendedFix:
          "Contact the registrar, resolve the hold reason, and confirm nameserver publication is restored.",
        verificationSteps: [
          "Check registrar control panel status.",
          "Query WHOIS/RDAP after the registrar update.",
          "Re-run Website Check when DNS is published again.",
        ],
      }),
    );
  }

  const status: WebsiteCheckReportStatus =
    diagnosis.verdict === "Healthy"
      ? "healthy"
      : diagnosis.verdict === "Degraded"
        ? "degraded"
        : "critical";
  const evidence = [
    `DNS: ${data.dns.success ? "OK" : "FAIL"} · ${data.dns.latency} · ${data.dns.resolved_ip}`,
    `HTTP: ${data.http.success ? "OK" : blocked ? "BLOCKED" : "FAIL"} · ${data.http.status_code || "ERR"} · ${data.http.latency}`,
    `SSL: ${data.ssl.valid ? "OK" : "FAIL"} · ${data.ssl.protocol || "Unknown"} · expires ${data.ssl.expiry}`,
    `Security Headers: ${data.securityHeaders?.passed ?? 0}/${data.securityHeaders?.total ?? 0} · ${data.securityHeaders?.grade || "Unknown"}`,
    `CDN: ${data.cdn.is_provider ? data.cdn.provider : "Unknown · No known CDN signature identified"} · server ${data.cdn.server || "Unknown"}`,
    `Observation Point: TLS probe executed from OpsKitPro Probe`,
    browserReachable
      ? `Browser Observation: reachable · HTTP ${data.observations?.browser?.httpStatus || "OK"}`
      : "",
    data.observations?.edge
      ? `Edge Observation: ${data.observations.edge.status} · ${data.observations.edge.colo} · HTTP ${data.observations.edge.httpStatus || "—"}`
      : "",
  ].filter(Boolean);

  return {
    formatVersion: WEBSITE_CHECK_REPORT_FORMAT_VERSION,
    generatedAt:
      options.generatedAt || data.meta?.checkedAt || new Date().toISOString(),
    target: data.domain,
    score,
    status,
    verdict: diagnosis.verdict,
    summary:
      corroboratedReachable && blocked
        ? lang === "zh"
          ? `网站可从${browserReachable ? "用户浏览器" : " Cloudflare Edge"}正常访问，但 OpsKitPro 服务端探针受到安全策略限制。`
          : `The site is reachable from ${browserReachable ? "your browser" : "Cloudflare Edge"}, but security policy limits the OpsKitPro server probe.`
        : diagnosis.verdict === "Healthy"
          ? lang === "zh"
            ? "网站可访问；DNS、HTTP 与公开 TLS 检查已从当前观察点完成。其他发现不会单独改变可用性结论。"
            : "The website is reachable; DNS, HTTP, and public TLS checks completed from the current observation point. Other findings do not independently change the availability verdict."
          : copy.summary[status],
    impact: copy.impact[status],
    suspectedCause: diagnosis.inferences[0]?.summary,
    evidence,
    evidenceRecords: diagnosis.evidence,
    assessments: diagnosis.assessments,
    inferences: diagnosis.inferences,
    guidance: diagnosis.guidance,
    nextActions: diagnosis.guidance.map((item) => item.summary),
    findings,
    observations: data.observations,
  };
}

export function buildWebsiteCheckPlainSummary(report: WebsiteCheckReport) {
  const notableFindings = report.findings
    .filter(
      (finding) =>
        finding.severity === "critical" || finding.severity === "warning",
    )
    .map((finding) => `- ${finding.title}: ${finding.summary}`);

  return [
    `OpsKitPro Website Check: ${report.target}`,
    `Verdict: ${report.verdict}`,
    `Checked at: ${report.generatedAt}`,
    "",
    "Impact:",
    report.impact,
    "",
    "Evidence:",
    ...report.evidence.map((item) => `- ${item}`),
    "",
    "Assessment:",
    ...(notableFindings.length
      ? notableFindings
      : ["- No immediate issues detected."]),
    "",
    ...(report.inferences.length
      ? [
          "",
          "Possible Cause:",
          ...report.inferences.map(
            (item) => `- [${item.confidence}] ${item.summary}`,
          ),
        ]
      : []),
    "",
    "Guidance:",
    ...(report.guidance.length
      ? report.guidance.map((item) => `- ${item.summary}`)
      : ["- No contextual guidance is required for this result."]),
  ].join("\n");
}

export function buildWebsiteCheckMarkdown(
  report: WebsiteCheckReport,
  data: WebsiteCheckResult,
) {
  return [
    `# OpsKitPro Diagnostic Report: ${report.target}`,
    "",
    `- Report format: ${report.formatVersion}`,
    `- Verdict: ${report.verdict}`,
    `- Status: ${report.status}`,
    `- Checked at: ${report.generatedAt}`,
    `- Core probe: ${data.meta?.coreMs ? `${data.meta.coreMs}ms` : "Unknown"}`,
    `- Full check: ${data.meta?.totalMs ? `${data.meta.totalMs}ms` : "Unknown"}`,
    `- Cache: ${data.meta?.cacheStatus || "MISS"}${data.meta?.cacheAgeSeconds ? ` (${data.meta.cacheAgeSeconds}s old)` : ""}`,
    `- Cloudflare Edge: ${data.meta?.edgeColo || "Unknown"}`,
    `- Observation Point: TLS probe executed from OpsKitPro Probe`,
    report.observations?.browser
      ? `- Your Browser: ${report.observations.browser.status} · ${report.observations.browser.precision} precision · HTTP ${report.observations.browser.httpStatus || "Unknown"}`
      : "- Your Browser: not available",
    report.observations?.edge
      ? `- Cloudflare Edge Probe: ${report.observations.edge.status} · ${report.observations.edge.colo} · full precision · HTTP ${report.observations.edge.httpStatus || "Unknown"}`
      : "- Cloudflare Edge Probe: not configured",
    report.observations?.server
      ? `- OpsKitPro Probe: ${report.observations.server.status} · ${report.observations.server.location}`
      : "- OpsKitPro Probe: not available",
    "",
    "## Executive Summary",
    report.summary,
    "",
    "## Impact",
    report.impact,
    "",
    "## Evidence",
    ...report.evidence.map((item) => `- ${item}`),
    "",
    "## Assessment",
    ...report.assessments.map(
      (item) => `- ${item.area}: ${item.status} — ${item.summary}`,
    ),
    ...(report.inferences.length
      ? [
          "",
          "## Possible Cause",
          ...report.inferences.map(
            (item) => `- ${item.summary} (Confidence: ${item.confidence})`,
          ),
        ]
      : []),
    "",
    "## Guidance",
    ...(report.guidance.length
      ? report.guidance.map((item) => `- ${item.summary}`)
      : ["- No contextual guidance is required for this result."]),
    "",
    "## Prioritized Findings",
    ...report.findings.map((finding, index) =>
      [
        `### ${index + 1}. ${finding.title} (${finding.severity.toUpperCase()})`,
        finding.summary,
        "",
        `- Evidence: ${finding.evidence.join("; ")}`,
        ...(finding.likelyCause
          ? [`- Possible cause: ${finding.likelyCause}`]
          : []),
        `- Recommended fix: ${finding.recommendedFix}`,
        `- Verification: ${finding.verificationSteps.join("; ")}`,
      ].join("\n"),
    ),
    "",
    "## DNS",
    `- Resolved IP: ${data.dns.resolved_ip}`,
    `- All IPs: ${data.dns.all_ips?.length ? data.dns.all_ips.join(", ") : data.dns.resolved_ip}`,
    `- IPv4: ${data.dns.ipv4?.length ? data.dns.ipv4.join(", ") : "None"}`,
    `- IPv6: ${data.dns.ipv6?.length ? data.dns.ipv6.join(", ") : "None"}`,
    `- Nameservers: ${data.dns.ns?.length ? data.dns.ns.join(", ") : "Unknown"}`,
    `- Lookup latency: ${data.dns.latency}`,
    "",
    "## HTTP",
    `- Reachable: ${data.http.success ? "Yes" : "No"}`,
    `- Status: ${data.http.status_code || "Error"}`,
    `- Classification: ${data.http.classification || "unknown"}`,
    `- Challenge detected: ${data.http.challenge ? "Yes" : "No"}`,
    `- Protocol: ${data.http.is_https ? "HTTPS" : "HTTP/TCP"}`,
    `- Response time: ${data.http.latency}`,
    `- Final URL: ${data.http.final_url || "Unknown"}`,
    `- Redirects: ${data.http.redirect_count ?? 0}${data.http.redirect_warning ? ` (${data.http.redirect_warning})` : ""}`,
    "",
    "## Security Headers",
    `- Grade: ${data.securityHeaders?.grade || "Unknown"}`,
    `- Score: ${data.securityHeaders?.score ?? 0}/100`,
    `- Enabled: ${data.securityHeaders?.passed ?? 0}/${data.securityHeaders?.total ?? 0}`,
    ...(data.securityHeaders?.checks || []).map(
      (check: any) =>
        `- ${check.present ? "OK" : "Missing"} ${check.label}${check.value ? `: ${check.value}` : ""}`,
    ),
    "",
    "## SSL",
    `- Valid: ${data.ssl.valid ? "Yes" : "No"}`,
    `- Protocol: ${data.ssl.protocol || "Unknown"}`,
    `- Cipher: ${data.ssl.cipher || "Unknown"}`,
    `- ALPN: ${data.ssl.alpn || "None"}`,
    `- OCSP Stapled: ${data.ssl.ocsp_stapled === true ? "Yes" : data.ssl.ocsp_stapled === false ? "No" : "Unknown"}`,
    `- Expiry: ${data.ssl.expiry}`,
    `- Issuer: ${data.ssl.issuer}`,
    data.ssl.subject_alt_name ? `- SANs: ${data.ssl.subject_alt_name}` : "",
    `- Legacy TLS Accepted: ${data.ssl.legacy_tls_accepted && data.ssl.legacy_tls_accepted !== "unknown" ? `Yes (${data.ssl.legacy_tls_accepted}) (Warning)` : data.ssl.legacy_tls_accepted === false ? "No (Secure)" : "Unknown"}`,
    "",
    "## CDN",
    `- Identification: ${data.cdn.is_provider ? "Known signature matched" : "Unknown · No known CDN signature identified"}`,
    `- Provider: ${data.cdn.is_provider ? data.cdn.provider : "Unknown"}`,
    `- Server: ${data.cdn.server}`,
  ].join("\n");
}
