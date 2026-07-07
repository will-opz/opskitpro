import { calculateScore, createSafeDiagnosticResult, isBlockedHttpStatus, parseLatencyMs } from '../_hooks/helpers'

export const WEBSITE_CHECK_REPORT_FORMAT_VERSION = 'website-check-report.v1'

export type WebsiteCheckFindingSeverity = 'critical' | 'warning' | 'info' | 'success'
export type WebsiteCheckFindingStatus = 'error' | 'warning' | 'ok'
export type WebsiteCheckReportStatus = 'critical' | 'degraded' | 'healthy'
export type WebsiteCheckLanguage = 'en' | 'zh' | 'ja' | 'tw'
export type WebsiteCheckResult = ReturnType<typeof createSafeDiagnosticResult>

export type WebsiteCheckFinding = {
  id: string
  key: string
  severity: WebsiteCheckFindingSeverity
  status: WebsiteCheckFindingStatus
  title: string
  summary: string
  description: string
  evidence: string[]
  likelyCause: string
  recommendedFix: string
  verificationSteps: string[]
  relatedToolHref?: string
  relatedArticleHref?: string
}

export type WebsiteCheckReport = {
  formatVersion: typeof WEBSITE_CHECK_REPORT_FORMAT_VERSION
  generatedAt: string
  target: string
  score: number
  status: WebsiteCheckReportStatus
  verdict: string
  summary: string
  impact: string
  suspectedCause: string
  evidence: string[]
  nextActions: string[]
  findings: WebsiteCheckFinding[]
}

type ReportCopy = {
  verdict: Record<WebsiteCheckReportStatus, string>
  summary: Record<WebsiteCheckReportStatus, string>
  impact: Record<WebsiteCheckReportStatus, string>
  noIssueCause: string
  noIssueFix: string
  noIssueVerify: string
  labels: {
    dns: string
    http: string
    ssl: string
    headers: string
    cdn: string
    domain: string
  }
}

const REPORT_COPY: Record<WebsiteCheckLanguage, ReportCopy> = {
  en: {
    verdict: {
      healthy: 'All Systems Green',
      degraded: 'Reachable with warnings',
      critical: 'Action required',
    },
    summary: {
      healthy: 'The target is reachable and the main availability, TLS, CDN, and security header checks look healthy.',
      degraded: 'The target is reachable, but OpsKitPro found configuration or hardening issues worth fixing.',
      critical: 'OpsKitPro found one or more issues that can affect user-facing availability or browser trust.',
    },
    impact: {
      healthy: 'No immediate user impact detected.',
      degraded: 'Service is reachable, but configuration risk, blocked probing, or performance drift exists.',
      critical: 'User-facing availability, trust, or routing may be affected.',
    },
    noIssueCause: 'No obvious fault detected from this probe.',
    noIssueFix: 'Continue normal monitoring and keep DNS, TLS, CDN, and header policies under change control.',
    noIssueVerify: 'Run Website Check again after the next deployment or DNS/TLS change.',
    labels: {
      dns: 'DNS',
      http: 'HTTP',
      ssl: 'SSL',
      headers: 'Security Headers',
      cdn: 'CDN',
      domain: 'Domain',
    },
  },
  zh: {
    verdict: {
      healthy: '状态良好',
      degraded: '可访问但有警告',
      critical: '需要处理',
    },
    summary: {
      healthy: '目标可访问，主要可用性、TLS、CDN 与安全响应头检查表现良好。',
      degraded: '目标可访问，但 OpsKitPro 发现了需要修复的配置或安全加固问题。',
      critical: 'OpsKitPro 发现了可能影响用户访问、浏览器信任或路由解析的问题。',
    },
    impact: {
      healthy: '暂未发现直接用户影响。',
      degraded: '服务可访问，但存在配置风险、探测被拦截或性能漂移。',
      critical: '可能影响用户可用性、浏览器信任或流量路由。',
    },
    noIssueCause: '本次探测未发现明显故障。',
    noIssueFix: '继续保持监控，并将 DNS、TLS、CDN 和响应头策略纳入变更管理。',
    noIssueVerify: '下次部署或 DNS/TLS 变更后再次运行 Website Check。',
    labels: {
      dns: 'DNS',
      http: 'HTTP',
      ssl: 'SSL',
      headers: '安全响应头',
      cdn: 'CDN',
      domain: '域名',
    },
  },
  ja: {
    verdict: {
      healthy: '正常',
      degraded: '到達可能ですが警告があります',
      critical: '対応が必要です',
    },
    summary: {
      healthy: '対象は到達可能で、可用性、TLS、CDN、セキュリティヘッダーの主要チェックは良好です。',
      degraded: '対象は到達可能ですが、修正したい設定または強化ポイントがあります。',
      critical: 'ユーザー向け可用性、ブラウザー信頼、またはルーティングに影響する可能性がある問題を検出しました。',
    },
    impact: {
      healthy: '現時点で直接的なユーザー影響は見つかっていません。',
      degraded: 'サービスは到達可能ですが、設定リスク、探測ブロック、または性能のずれがあります。',
      critical: 'ユーザー向け可用性、信頼、またはルーティングに影響する可能性があります。',
    },
    noIssueCause: 'この探測では明確な障害は見つかりませんでした。',
    noIssueFix: '通常監視を続け、DNS、TLS、CDN、ヘッダー設定を変更管理してください。',
    noIssueVerify: '次回のデプロイまたは DNS/TLS 変更後に Website Check を再実行してください。',
    labels: {
      dns: 'DNS',
      http: 'HTTP',
      ssl: 'SSL',
      headers: 'セキュリティヘッダー',
      cdn: 'CDN',
      domain: 'ドメイン',
    },
  },
  tw: {
    verdict: {
      healthy: '狀態良好',
      degraded: '可存取但有警告',
      critical: '需要處理',
    },
    summary: {
      healthy: '目標可存取，主要可用性、TLS、CDN 與安全回應標頭檢查表現良好。',
      degraded: '目標可存取，但 OpsKitPro 發現了需要修復的設定或安全加固問題。',
      critical: 'OpsKitPro 發現了可能影響使用者存取、瀏覽器信任或路由解析的問題。',
    },
    impact: {
      healthy: '暫未發現直接使用者影響。',
      degraded: '服務可存取，但存在設定風險、探測被攔截或效能漂移。',
      critical: '可能影響使用者可用性、瀏覽器信任或流量路由。',
    },
    noIssueCause: '本次探測未發現明顯故障。',
    noIssueFix: '繼續保持監控，並將 DNS、TLS、CDN 和回應標頭策略納入變更管理。',
    noIssueVerify: '下次部署或 DNS/TLS 變更後再次執行 Website Check。',
    labels: {
      dns: 'DNS',
      http: 'HTTP',
      ssl: 'SSL',
      headers: '安全回應標頭',
      cdn: 'CDN',
      domain: '網域',
    },
  },
}

const statusFromSeverity = (severity: WebsiteCheckFindingSeverity): WebsiteCheckFindingStatus => {
  if (severity === 'critical') return 'error'
  if (severity === 'warning') return 'warning'
  return 'ok'
}

const makeFinding = (finding: Omit<WebsiteCheckFinding, 'status' | 'description'>): WebsiteCheckFinding => ({
  ...finding,
  status: statusFromSeverity(finding.severity),
  description: finding.summary,
})

const hasDnsAddress = (data: WebsiteCheckResult) => {
  return Boolean(data.dns.resolved_ip && data.dns.resolved_ip !== data.domain)
    || Boolean(data.dns.all_ips?.length)
    || Boolean(data.dns.records?.A?.length)
    || Boolean(data.dns.records?.AAAA?.length)
}

const isExpired = (expiry?: string) => {
  if (!expiry || expiry === 'Unknown') return false
  const time = new Date(expiry).getTime()
  return Number.isFinite(time) && time < Date.now()
}

const isExpiringSoon = (expiry?: string) => {
  if (!expiry || expiry === 'Unknown') return false
  const time = new Date(expiry).getTime()
  if (!Number.isFinite(time)) return false
  const days = (time - Date.now()) / 86_400_000
  return days >= 0 && days <= 15
}

const getCloudflareHint = (data: WebsiteCheckResult) => {
  const status = Number(data.http.status_code || 0)
  const title = String(data.http.page_title || '').toLowerCase()
  const server = String(data.cdn.server || '').toLowerCase()
  const looksCloudflare = data.cdn.provider === 'Cloudflare' || server.includes('cloudflare') || Boolean(data.http.cf_ray)

  if (!looksCloudflare && !title.includes('cloudflare')) return null
  if (status >= 520 && status <= 530) return `Cloudflare ${status}`
  if (status === 403 && (title.includes('1020') || title.includes('access denied'))) return 'Cloudflare 1020'
  if (status === 429 && (title.includes('1015') || title.includes('rate limit'))) return 'Cloudflare 1015'
  if (title.includes('error 522')) return 'Cloudflare 522'
  if (title.includes('error 525')) return 'Cloudflare 525'
  return null
}

export function buildWebsiteCheckReport(
  data: WebsiteCheckResult,
  options: { lang?: WebsiteCheckLanguage; generatedAt?: string } = {},
): WebsiteCheckReport {
  const lang = options.lang || 'en'
  const copy = REPORT_COPY[lang] || REPORT_COPY.en
  const score = calculateScore(data)
  const isIpOrVisitor = Boolean(data.isVisitor || data.isActuallyIp)
  const blocked = !data.http.success && isBlockedHttpStatus(data.http.status_code)
  const missingHeaders = data.securityHeaders?.checks?.filter((check: any) => !check.present) || []
  const findings: WebsiteCheckFinding[] = []

  findings.push(makeFinding({
    id: data.dns.success && hasDnsAddress(data) ? 'dns.resolved' : 'dns.unresolved',
    key: 'dns',
    severity: data.dns.success && hasDnsAddress(data) ? 'success' : 'critical',
    title: copy.labels.dns,
    summary: data.dns.success && hasDnsAddress(data)
      ? `Resolved to ${data.dns.all_ips?.length ? data.dns.all_ips.join(', ') : data.dns.resolved_ip}.`
      : 'DNS resolution did not return a usable A or AAAA record.',
    evidence: [
      `Resolved IP: ${data.dns.resolved_ip || 'Unknown'}`,
      `A records: ${data.dns.records?.A?.length || 0}`,
      `AAAA records: ${data.dns.records?.AAAA?.length || 0}`,
      `Lookup latency: ${data.dns.latency}`,
    ],
    likelyCause: data.dns.success && hasDnsAddress(data)
      ? copy.noIssueCause
      : 'Missing or stale DNS records, registrar/nameserver drift, or a zone propagation issue.',
    recommendedFix: data.dns.success && hasDnsAddress(data)
      ? copy.noIssueFix
      : 'Confirm authoritative nameservers, restore A/AAAA records, and lower TTL while recovering.',
    verificationSteps: data.dns.success && hasDnsAddress(data)
      ? [copy.noIssueVerify]
      : ['Query authoritative nameservers directly.', 'Check public resolvers from multiple regions.', 'Run Website Check again after DNS propagation.'],
    relatedToolHref: `/${lang}/tools/dns`,
  }))

  const cloudflareHint = getCloudflareHint(data)
  const httpSeverity: WebsiteCheckFindingSeverity = data.http.success
    ? data.http.redirect_warning ? 'warning' : parseLatencyMs(data.http.latency) > 2000 ? 'warning' : 'success'
    : blocked ? 'warning' : 'critical'
  findings.push(makeFinding({
    id: data.http.success ? 'http.reachable' : blocked ? 'http.blocked' : 'http.unreachable',
    key: 'http',
    severity: httpSeverity,
    title: copy.labels.http,
    summary: data.http.success
      ? `HTTP returned ${data.http.status_code || 'OK'} in ${data.http.latency}.`
      : blocked
        ? `The target is reachable, but this probe was rejected with HTTP ${data.http.status_code || 'ERR'}.`
        : `HTTP did not complete successfully${data.http.status_code ? `; status ${data.http.status_code}` : ''}.`,
    evidence: [
      `HTTP status: ${data.http.status_code || 'ERR'}`,
      `Latency: ${data.http.latency}`,
      `Final URL: ${data.http.final_url || 'Unknown'}`,
      `Redirects: ${data.http.redirect_count ?? 0}${data.http.redirect_warning ? ` (${data.http.redirect_warning})` : ''}`,
      cloudflareHint ? `Edge hint: ${cloudflareHint}` : '',
    ].filter(Boolean),
    likelyCause: data.http.success
      ? data.http.redirect_warning || copy.noIssueCause
      : blocked
        ? 'WAF, access control, bot protection, IP allowlist, or origin Host/SNI policy rejected the probe.'
        : cloudflareHint
          ? `${cloudflareHint} usually points to an origin connectivity, TLS, DNS, or edge security rule problem.`
          : 'Origin service downtime, firewall policy, routing failure, or application error.',
    recommendedFix: data.http.success
      ? data.http.redirect_warning
        ? 'Review redirect rules and remove loops or unnecessary hops.'
        : copy.noIssueFix
      : blocked
        ? 'Review WAF/Access/bot rules and confirm the origin accepts the expected Host and SNI.'
        : 'Check origin health, firewall rules, listener ports, upstream logs, and CDN origin configuration.',
    verificationSteps: data.http.success
      ? ['Open the final URL from a clean browser session.', 'Re-run Website Check after redirect or application changes.']
      : ['Run curl against the origin and the public hostname.', 'Check CDN edge logs and origin access logs for the same timestamp.', 'Re-run Website Check after the origin or WAF change.'],
    relatedToolHref: `/${lang}/tools/http-headers`,
  }))

  const sslExpired = isExpired(data.ssl.expiry)
  const sslSoon = isExpiringSoon(data.ssl.expiry) || data.ssl.grade === 'C'
  findings.push(makeFinding({
    id: data.ssl.valid ? sslSoon ? 'ssl.expiring' : 'ssl.valid' : isIpOrVisitor ? 'ssl.not-applicable' : 'ssl.invalid',
    key: 'ssl',
    severity: data.ssl.valid ? sslSoon ? 'warning' : 'success' : isIpOrVisitor ? 'info' : 'critical',
    title: copy.labels.ssl,
    summary: data.ssl.valid
      ? `Certificate is valid (${data.ssl.grade || 'OK'}), expires ${data.ssl.expiry}.`
      : isIpOrVisitor
        ? 'SSL certificate grading is not applicable to this public IP probe.'
        : 'SSL/TLS validation failed or the certificate chain is incomplete.',
    evidence: [
      `Valid: ${data.ssl.valid ? 'yes' : 'no'}`,
      `Grade: ${data.ssl.grade || 'Unknown'}`,
      `Issuer: ${data.ssl.issuer || 'Unknown'}`,
      `Expiry: ${data.ssl.expiry || 'Unknown'}`,
    ],
    likelyCause: data.ssl.valid
      ? sslSoon ? 'The certificate is valid but close to renewal time.' : copy.noIssueCause
      : isIpOrVisitor ? 'A raw IP probe usually cannot match the hostname on a certificate.' : 'Expired certificate, hostname mismatch, missing intermediate, or CDN/origin TLS mode mismatch.',
    recommendedFix: data.ssl.valid
      ? sslSoon ? 'Renew the certificate and verify the CDN/origin chain before expiry.' : copy.noIssueFix
      : isIpOrVisitor ? 'Test the hostname that users visit when validating TLS.' : 'Install a valid certificate for the hostname and verify the full chain at the CDN and origin.',
    verificationSteps: data.ssl.valid
      ? ['Check the certificate expiry in your CDN or certificate manager.', 'Run Website Check after renewal.']
      : ['Inspect the certificate chain with your CDN/origin TLS tool.', 'Confirm the certificate SAN includes the hostname.', 'Re-run Website Check after replacing the certificate.'],
    relatedToolHref: `/${lang}/tools/ssl`,
  }))

  findings.push(makeFinding({
    id: blocked || isIpOrVisitor ? 'headers.not-graded' : missingHeaders.length ? 'headers.missing' : 'headers.ok',
    key: 'headers',
    severity: blocked || isIpOrVisitor ? 'info' : missingHeaders.length ? 'warning' : 'success',
    title: copy.labels.headers,
    summary: blocked || isIpOrVisitor
      ? 'Security headers could not be fully graded for this probe.'
      : missingHeaders.length
        ? `Missing or weak headers: ${missingHeaders.map((check: any) => check.label).join(', ')}.`
        : `Security headers grade is ${data.securityHeaders?.grade || 'OK'}.`,
    evidence: [
      `Score: ${data.securityHeaders?.score ?? 0}/100`,
      `Passed: ${data.securityHeaders?.passed ?? 0}/${data.securityHeaders?.total ?? 0}`,
      missingHeaders.length ? `Missing: ${missingHeaders.map((check: any) => check.label).join(', ')}` : 'Missing: none detected',
    ],
    likelyCause: missingHeaders.length
      ? 'Application or edge response policy does not emit one or more recommended security headers.'
      : copy.noIssueCause,
    recommendedFix: missingHeaders.length
      ? 'Add the missing headers at the application, reverse proxy, or CDN edge layer.'
      : copy.noIssueFix,
    verificationSteps: missingHeaders.length
      ? ['Deploy header changes in staging first.', 'Check the final public URL because redirects can change headers.', 'Re-run Website Check and confirm the header score improves.']
      : [copy.noIssueVerify],
    relatedToolHref: `/${lang}/tools/http-headers`,
  }))

  findings.push(makeFinding({
    id: data.cdn.is_provider || isIpOrVisitor ? 'cdn.detected' : 'cdn.not-detected',
    key: 'cdn',
    severity: data.cdn.is_provider || isIpOrVisitor ? 'success' : 'info',
    title: copy.labels.cdn,
    summary: data.cdn.is_provider
      ? `Detected ${data.cdn.provider}.`
      : isIpOrVisitor
        ? 'CDN detection is not applicable to a raw IP probe.'
        : 'No edge CDN provider was detected from this response.',
    evidence: [
      `Provider: ${data.cdn.provider || 'Unknown'}`,
      `Server: ${data.cdn.server || 'Unknown'}`,
      `Edge colo: ${data.meta?.edgeColo || 'Unknown'}`,
    ],
    likelyCause: data.cdn.is_provider || isIpOrVisitor ? copy.noIssueCause : 'Traffic may be served directly from the origin or through an unrecognized proxy.',
    recommendedFix: data.cdn.is_provider || isIpOrVisitor ? copy.noIssueFix : 'Consider enabling a CDN or confirming that the intended edge provider is in the request path.',
    verificationSteps: data.cdn.is_provider || isIpOrVisitor
      ? [copy.noIssueVerify]
      : ['Check DNS records and CDN proxy status.', 'Inspect response headers for edge provider markers.', 'Re-run Website Check after enabling the CDN.'],
  }))

  if (data.whois?.status?.toLowerCase().includes('hold')) {
    findings.unshift(makeFinding({
      id: 'domain.hold',
      key: 'domain',
      severity: 'critical',
      title: copy.labels.domain,
      summary: `Registrar status contains hold: ${data.whois.status}.`,
      evidence: [`WHOIS status: ${data.whois.status}`, `Registrar: ${data.whois.registrar || 'Unknown'}`],
      likelyCause: 'Registrar hold, compliance hold, or domain lifecycle issue can interrupt DNS publication.',
      recommendedFix: 'Contact the registrar, resolve the hold reason, and confirm nameserver publication is restored.',
      verificationSteps: ['Check registrar control panel status.', 'Query WHOIS/RDAP after the registrar update.', 'Re-run Website Check when DNS is published again.'],
    }))
  }

  const status: WebsiteCheckReportStatus = findings.some((finding) => finding.severity === 'critical')
    ? 'critical'
    : findings.some((finding) => finding.severity === 'warning')
      ? 'degraded'
      : 'healthy'
  const firstActionable = findings.find((finding) => finding.severity === 'critical' || finding.severity === 'warning')
  const evidence = [
    `DNS: ${data.dns.success ? 'OK' : 'FAIL'} · ${data.dns.latency} · ${data.dns.resolved_ip}`,
    `HTTP: ${data.http.success ? 'OK' : blocked ? 'BLOCKED' : 'FAIL'} · ${data.http.status_code || 'ERR'} · ${data.http.latency}`,
    `SSL: ${data.ssl.valid ? 'OK' : 'FAIL'} · ${data.ssl.grade || 'Unknown'} · expires ${data.ssl.expiry}`,
    `Security Headers: ${data.securityHeaders?.passed ?? 0}/${data.securityHeaders?.total ?? 0} · ${data.securityHeaders?.grade || 'Unknown'}`,
    `CDN: ${data.cdn.is_provider ? data.cdn.provider : 'Not detected'} · server ${data.cdn.server || 'Unknown'}`,
  ]

  return {
    formatVersion: WEBSITE_CHECK_REPORT_FORMAT_VERSION,
    generatedAt: options.generatedAt || data.meta?.checkedAt || new Date().toISOString(),
    target: data.domain,
    score,
    status,
    verdict: copy.verdict[status],
    summary: copy.summary[status],
    impact: copy.impact[status],
    suspectedCause: firstActionable?.likelyCause || copy.noIssueCause,
    evidence,
    nextActions: firstActionable?.verificationSteps || [copy.noIssueVerify],
    findings,
  }
}

export function buildWebsiteCheckPlainSummary(report: WebsiteCheckReport) {
  const notableFindings = report.findings
    .filter((finding) => finding.severity === 'critical' || finding.severity === 'warning')
    .map((finding) => `- ${finding.title}: ${finding.summary}`)

  return [
    `OpsKitPro Website Check: ${report.target}`,
    `Verdict: ${report.verdict}`,
    `Score: ${report.score}/100`,
    `Checked at: ${report.generatedAt}`,
    '',
    'Impact:',
    report.impact,
    '',
    'Suspected Cause:',
    report.suspectedCause,
    '',
    'Evidence:',
    ...report.evidence.map((item) => `- ${item}`),
    '',
    'Key Findings:',
    ...(notableFindings.length ? notableFindings : ['- No immediate issues detected.']),
    '',
    'Next Action:',
    ...report.nextActions.map((item) => `- ${item}`),
  ].join('\n')
}

export function buildWebsiteCheckMarkdown(report: WebsiteCheckReport, data: WebsiteCheckResult) {
  return [
    `# OpsKitPro Diagnostic Report: ${report.target}`,
    '',
    `- Report format: ${report.formatVersion}`,
    `- Verdict: ${report.verdict}`,
    `- Status: ${report.status}`,
    `- Score: ${report.score}/100`,
    `- Checked at: ${report.generatedAt}`,
    `- Core probe: ${data.meta?.coreMs ? `${data.meta.coreMs}ms` : 'Unknown'}`,
    `- Full check: ${data.meta?.totalMs ? `${data.meta.totalMs}ms` : 'Unknown'}`,
    `- Cache: ${data.meta?.cacheStatus || 'MISS'}${data.meta?.cacheAgeSeconds ? ` (${data.meta.cacheAgeSeconds}s old)` : ''}`,
    `- Cloudflare Edge: ${data.meta?.edgeColo || 'Unknown'}`,
    '',
    '## Executive Summary',
    report.summary,
    '',
    '## Impact',
    report.impact,
    '',
    '## Prioritized Findings',
    ...report.findings.map((finding, index) => [
      `### ${index + 1}. ${finding.title} (${finding.severity.toUpperCase()})`,
      finding.summary,
      '',
      `- Evidence: ${finding.evidence.join('; ')}`,
      `- Likely cause: ${finding.likelyCause}`,
      `- Recommended fix: ${finding.recommendedFix}`,
      `- Verification: ${finding.verificationSteps.join('; ')}`,
    ].join('\n')),
    '',
    '## DNS',
    `- Resolved IP: ${data.dns.resolved_ip}`,
    `- All IPs: ${data.dns.all_ips?.length ? data.dns.all_ips.join(', ') : data.dns.resolved_ip}`,
    `- IPv4: ${data.dns.ipv4?.length ? data.dns.ipv4.join(', ') : 'None'}`,
    `- IPv6: ${data.dns.ipv6?.length ? data.dns.ipv6.join(', ') : 'None'}`,
    `- Nameservers: ${data.dns.ns?.length ? data.dns.ns.join(', ') : 'Unknown'}`,
    `- Lookup latency: ${data.dns.latency}`,
    '',
    '## HTTP',
    `- Reachable: ${data.http.success ? 'Yes' : 'No'}`,
    `- Status: ${data.http.status_code || 'Error'}`,
    `- Protocol: ${data.http.is_https ? 'HTTPS' : 'HTTP/TCP'}`,
    `- Response time: ${data.http.latency}`,
    `- Final URL: ${data.http.final_url || 'Unknown'}`,
    `- Redirects: ${data.http.redirect_count ?? 0}${data.http.redirect_warning ? ` (${data.http.redirect_warning})` : ''}`,
    '',
    '## Security Headers',
    `- Grade: ${data.securityHeaders?.grade || 'Unknown'}`,
    `- Score: ${data.securityHeaders?.score ?? 0}/100`,
    `- Enabled: ${data.securityHeaders?.passed ?? 0}/${data.securityHeaders?.total ?? 0}`,
    ...(data.securityHeaders?.checks || []).map((check: any) => `- ${check.present ? 'OK' : 'Missing'} ${check.label}${check.value ? `: ${check.value}` : ''}`),
    '',
    '## SSL',
    `- Valid: ${data.ssl.valid ? 'Yes' : 'No'}`,
    `- Grade: ${data.ssl.grade || 'Unknown'}`,
    `- Expiry: ${data.ssl.expiry}`,
    `- Issuer: ${data.ssl.issuer}`,
    '',
    '## CDN',
    `- Provider: ${data.cdn.provider}`,
    `- Server: ${data.cdn.server}`,
  ].join('\n')
}
