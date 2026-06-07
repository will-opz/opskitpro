export const normalizeTargetInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withScheme)
    return parsed.hostname.replace(/\.$/, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/\.$/, '')
      .trim()
  }
}

export const createSafeDiagnosticResult = (data: any, fallbackDomain: string, fallbackError?: string) => {
  const domain = data?.domain || fallbackDomain || 'opskitpro.com'
  const isActuallyIp = Boolean(data?.isActuallyIp)
  const isPrivate = Boolean(data?.isPrivate)

  return {
    domain,
    status: data?.status || 'partial_error',
    isActuallyIp,
    isPrivate,
    error: data?.error || fallbackError,
    dns: {
      resolved_ip: data?.dns?.resolved_ip || domain,
      latency: data?.dns?.latency || '---',
      success: Boolean(data?.dns?.success),
      all_ips: data?.dns?.all_ips || [],
      ipv4: data?.dns?.ipv4 || [],
      ipv6: data?.dns?.ipv6 || [],
      dual_stack: Boolean(data?.dns?.dual_stack),
      ns: data?.dns?.ns || [],
      records: {
        A: data?.dns?.records?.A || data?.dns?.ipv4 || [],
        AAAA: data?.dns?.records?.AAAA || data?.dns?.ipv6 || [],
        CNAME: data?.dns?.records?.CNAME || [],
        MX: data?.dns?.records?.MX || [],
        TXT: data?.dns?.records?.TXT || [],
        CAA: data?.dns?.records?.CAA || [],
        SOA: data?.dns?.records?.SOA || [],
      },
      resolvers: data?.dns?.resolvers || [],
    },
    http: {
      success: Boolean(data?.http?.success),
      status_code: data?.http?.status_code ?? 0,
      latency: data?.http?.latency || '---',
      is_https: Boolean(data?.http?.is_https),
      final_url: data?.http?.final_url || '',
      redirect_chain: data?.http?.redirect_chain || [],
      redirect_count: Number(data?.http?.redirect_count || 0),
      redirect_warning: data?.http?.redirect_warning,
    },
    securityHeaders: {
      score: Number(data?.securityHeaders?.score ?? 0),
      grade: data?.securityHeaders?.grade || '—',
      passed: Number(data?.securityHeaders?.passed ?? 0),
      total: Number(data?.securityHeaders?.total ?? 0),
      checks: data?.securityHeaders?.checks || [],
    },
    ssl: {
      valid: Boolean(data?.ssl?.valid),
      issuer: data?.ssl?.issuer || 'Unknown',
      expiry: data?.ssl?.expiry || 'Unknown',
      grade: data?.ssl?.grade || '—',
      factors: data?.ssl?.factors || [],
      tls_version: data?.ssl?.tls_version,
      chain: data?.ssl?.chain || [],
    },
    cdn: {
      is_provider: Boolean(data?.cdn?.is_provider),
      provider: data?.cdn?.provider || 'Unknown',
      server: data?.cdn?.server || 'Unknown',
    },
    geo: {
      country: data?.geo?.country || 'Unknown',
      isp: data?.geo?.isp || 'Unknown',
      city: data?.geo?.city || 'Unknown',
      asn: data?.geo?.asn || 'Unknown',
    },
    whois: {
      registered: data?.whois?.registered || 'Unknown',
      registrar: data?.whois?.registrar || 'Unknown',
      status: data?.whois?.status || 'Unknown',
      success: Boolean(data?.whois?.success),
      expires: data?.whois?.expires || 'Unknown',
      error: data?.whois?.error,
      nameservers: data?.whois?.nameservers || [],
    },
    meta: {
      checkedAt: data?.meta?.checkedAt || new Date().toISOString(),
      servedAt: data?.meta?.servedAt,
      totalMs: Number(data?.meta?.totalMs || 0),
      coreMs: Number(data?.meta?.coreMs || 0),
      enrichmentMs: Number(data?.meta?.enrichmentMs || 0),
      cacheLookupMs: Number(data?.meta?.cacheLookupMs || 0),
      cacheAgeSeconds: Number(data?.meta?.cacheAgeSeconds || 0),
      edgeColo: data?.meta?.edgeColo || 'Unknown',
      cacheStatus: data?.meta?.cacheStatus,
    },
  }
}

export type BatchDiagnosticResult = {
  target: string
  result?: ReturnType<typeof createSafeDiagnosticResult>
  error?: string
}

export function parseLatencyMs(latency: string | number): number {
  if (typeof latency === 'number') return latency
  return parseInt(String(latency).replace('ms', ''), 10) || 0
}

export function calculateScore(data: any) {
  let score = 100
  if (!data?.http?.success) score -= 40
  if ((data?.http?.status_code ?? 0) >= 400) score -= 20
  if (!data?.ssl?.valid) score -= 20
  if (parseLatencyMs(data?.dns?.latency ?? '0ms') > 300) score -= 10
  if (parseLatencyMs(data?.http?.latency ?? '0ms') > 2000) score -= 10
  else if (parseLatencyMs(data?.http?.latency ?? '0ms') > 1000) score -= 5
  if (!data?.cdn?.is_provider) score -= 5
  if ((data?.securityHeaders?.score ?? 100) < 35) score -= 20
  else if ((data?.securityHeaders?.score ?? 100) < 70) score -= 10
  
  const status = data?.whois?.status?.toLowerCase() || ''
  if (status.includes('hold')) score -= 50
  
  return Math.max(0, score)
}
