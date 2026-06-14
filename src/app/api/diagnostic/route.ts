import { NextRequest, NextResponse } from 'next/server'
import type {
  DiagnosticHealthResponse,
  DiagnosticPartialErrorResponse,
  DiagnosticPostSuccessResponse,
  DiagnosticSuccessResponse,
} from '@/lib/api-contracts'
import {
  getClientIp,
  getCloudflareRuntimeContext,
} from '@/lib/runtime-context'

// Removed runtime='edge' to avoid Cloudflare/Next.js edge runtime conflicts that caused 500 errors previously
export const dynamic = 'force-dynamic'

const ADMIN_COOKIE_NAME = 'opskitpro_admin'
const CLOUDFLARE_ACCESS_EMAIL_HEADER = 'cf-access-authenticated-user-email'

async function sha256(value: string) {
  const input = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

async function isAdminDiagnosticRequest(request: NextRequest) {
  const password = process.env.OPSKITPRO_ADMIN_PASSWORD || ''
  const secret = process.env.OPSKITPRO_ADMIN_SECRET || password
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  const allowedEmails = (process.env.OPSKITPRO_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const accessEmail = request.headers.get(CLOUDFLARE_ACCESS_EMAIL_HEADER)?.trim().toLowerCase() || ''

  if (accessEmail && allowedEmails.includes(accessEmail)) return true
  if (!secret || !token) return false

  const passwordToken = password ? await sha256(`${password}:${secret}`) : ''
  if (passwordToken && token === passwordToken) return true

  const accessTokens = await Promise.all(
    allowedEmails.map((email) => sha256(`cloudflare-access:${email}:${secret}`)),
  )
  if (accessTokens.some((accessToken) => accessToken === token)) return true

  const passwordEmailTokens = await Promise.all(
    allowedEmails.map((email) => sha256(`password:${email}:${secret}`)),
  )
  return passwordEmailTokens.some((passwordEmailToken) => passwordEmailToken === token)
}

const normalizeTargetInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}(?::\d+)?$/.test(trimmed)) {
    return trimmed.split(':')[0]
  }

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withScheme)
    return parsed.hostname.replace(/\.$/, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/:\d+$/, '')
      .replace(/\.$/, '')
      .trim()
  }
}

const ipv4Segment = '(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)'
const ipv4Regex = new RegExp(`^(?:${ipv4Segment}\\.){3}${ipv4Segment}$`)
const isIpAddress = (value: string) => {
  if (ipv4Regex.test(value)) return true
  return value.includes(':') && value.split(':').length >= 3 && /^[0-9a-fA-F:.]+$/.test(value)
}

const truncateHeaderValue = (value: string | null) => {
  if (!value) return undefined
  return value.length > 180 ? `${value.slice(0, 177)}...` : value
}

const dnsTypeCodes = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  CAA: 257,
} as const

const extractDnsRecordsByType = (data: any, type: number): string[] =>
  (data?.Answer || [])
    .filter((answer: any) => answer?.type === type && answer?.data)
    .map((answer: any) => String(answer.data))

const extractDnsRecords = (data: any, type: 1 | 28) => extractDnsRecordsByType(data, type)

const normalizeDnsRecordValue = (type: keyof typeof dnsTypeCodes, value: string) => {
  if (type === 'CNAME' || type === 'NS') return value.replace(/\.$/, '')
  return value
}

const fetchDnsJson = async (domain: string, type: keyof typeof dnsTypeCodes, timeoutMs = 4000) =>
  fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`, {
    headers: { accept: 'application/dns-json' },
    signal: AbortSignal.timeout(timeoutMs),
  })
    .then((response) => response.json())
    .catch(() => null)

const redirectStatuses = new Set([301, 302, 303, 307, 308])

const traceRedirects = async (startUrl: string, maxHops = 6) => {
  const chain: Array<{ url: string; status: number; location?: string }> = []
  const seen = new Set<string>()
  let currentUrl = startUrl
  let warning: string | undefined

  for (let hop = 0; hop <= maxHops; hop += 1) {
    if (seen.has(currentUrl)) {
      warning = 'Redirect loop detected.'
      break
    }
    seen.add(currentUrl)

    const response = await fetch(currentUrl, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': 'OpsKitPro-Diagnostic/1.0' },
      signal: AbortSignal.timeout(5000),
    })
    const location = response.headers.get('location') || undefined
    chain.push({ url: currentUrl, status: response.status, location })

    if (!location || !redirectStatuses.has(response.status)) break
    if (hop === maxHops) {
      warning = 'Too many redirects.'
      break
    }

    currentUrl = new URL(location, currentUrl).toString()
  }

  return {
    chain,
    finalUrl: chain.length ? chain[chain.length - 1].url : startUrl,
    warning,
  }
}

type RedirectTrace = Awaited<ReturnType<typeof traceRedirects>>

const buildSecurityHeadersSummary = (headers: Headers) => {
  const hsts = headers.get('strict-transport-security')
  const csp = headers.get('content-security-policy')
  const xFrameOptions = headers.get('x-frame-options')
  const xContentTypeOptions = headers.get('x-content-type-options')
  const referrerPolicy = headers.get('referrer-policy')
  const permissionsPolicy = headers.get('permissions-policy')

  const checks = [
    {
      key: 'strict-transport-security',
      label: 'HSTS',
      present: Boolean(hsts),
      value: truncateHeaderValue(hsts),
      severity: 'critical' as const,
      recommendation: 'Enable Strict-Transport-Security after confirming HTTPS is stable.',
    },
    {
      key: 'content-security-policy',
      label: 'Content-Security-Policy',
      present: Boolean(csp),
      value: truncateHeaderValue(csp),
      severity: 'critical' as const,
      recommendation: 'Add a Content-Security-Policy to reduce XSS and content injection risk.',
    },
    {
      key: 'x-frame-options',
      label: 'X-Frame-Options',
      present: Boolean(xFrameOptions),
      value: truncateHeaderValue(xFrameOptions),
      severity: 'warning' as const,
      recommendation: 'Set DENY or SAMEORIGIN unless the site must be embedded.',
    },
    {
      key: 'x-content-type-options',
      label: 'X-Content-Type-Options',
      present: xContentTypeOptions?.toLowerCase() === 'nosniff',
      value: truncateHeaderValue(xContentTypeOptions),
      severity: 'warning' as const,
      recommendation: 'Set X-Content-Type-Options: nosniff.',
    },
    {
      key: 'referrer-policy',
      label: 'Referrer-Policy',
      present: Boolean(referrerPolicy),
      value: truncateHeaderValue(referrerPolicy),
      severity: 'info' as const,
      recommendation: 'Set a Referrer-Policy such as strict-origin-when-cross-origin.',
    },
    {
      key: 'permissions-policy',
      label: 'Permissions-Policy',
      present: Boolean(permissionsPolicy),
      value: truncateHeaderValue(permissionsPolicy),
      severity: 'info' as const,
      recommendation: 'Limit browser features with Permissions-Policy.',
    },
  ]

  const weights = { critical: 22, warning: 16, info: 12 }
  const penalty = checks.reduce((sum, check) => sum + (check.present ? 0 : weights[check.severity]), 0)
  const score = Math.max(0, Math.min(100, 100 - penalty))
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 55 ? 'C' : score >= 35 ? 'D' : 'F'

  return {
    score,
    grade,
    passed: checks.filter((check) => check.present).length,
    total: checks.length,
    checks,
  }
}

export async function GET(request: NextRequest | Request) {
  const requestStartedAt = Date.now()
  const requestUrl = (request as Request | undefined)?.url

  if (!requestUrl) {
    const health: DiagnosticHealthResponse = {
      status: 'ready',
      service: 'diagnostic',
      timestamp: new Date().toISOString(),
    }
    return NextResponse.json(health)
  }

  const { searchParams } = new URL(requestUrl)
  const query = normalizeTargetInput(searchParams.get('domain') || searchParams.get('target') || '')
  const cfRay = request.headers.get('cf-ray') || ''
  const edgeColo = cfRay.includes('-') ? cfRay.split('-').pop()?.toUpperCase() || 'Unknown' : 'Unknown'
  const buildMeta = (
    cacheStatus: 'HIT' | 'MISS' | 'BYPASS' = 'BYPASS',
    timings: { coreMs?: number; enrichmentMs?: number } = {},
  ) => ({
    checkedAt: new Date().toISOString(),
    servedAt: new Date().toISOString(),
    totalMs: Date.now() - requestStartedAt,
    ...timings,
    edgeColo,
    cacheStatus,
  })
  
  const isVisitor = !query
  let domain = query.replace(/^https?:\/\//, '').split('/')[0]
  
  // If no query, default to visitor's own IP
  if (!query) {
    domain = getClientIp(request as NextRequest)
  }

  const wantsKvCache = searchParams.get('cache') === 'kv' && !searchParams.has('_nocache')
  const useKvCache = wantsKvCache && 'cookies' in request && await isAdminDiagnosticRequest(request as NextRequest)
  const cacheKey = `diag:v2:${domain}`
  
  // --- Robust KV Discovery ---
  let KV: any = null;
  if (useKvCache) {
    KV = (process.env as any).KV;
  }
  if (useKvCache && !KV) {
    try {
      const { env } = await getCloudflareRuntimeContext();
      KV = (env as any)?.KV || (globalThis as any).KV;
    } catch (e) {
      KV = (globalThis as any).KV;
    }
  }

  // 1. Global KV Cache Lookup
  if (KV && useKvCache) {
    try {
      const cached = await KV.get(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        const servedAt = new Date().toISOString()
        const checkedAt = parsed.meta?.checkedAt || servedAt
        const checkedAtMs = new Date(checkedAt).getTime()
        const cacheAgeSeconds = Number.isFinite(checkedAtMs)
          ? Math.max(0, Math.floor((Date.now() - checkedAtMs) / 1000))
          : 0
        return NextResponse.json({
          ...parsed,
          meta: {
            ...parsed.meta,
            checkedAt,
            servedAt,
            cacheStatus: 'HIT',
            cacheLookupMs: Date.now() - requestStartedAt,
            cacheAgeSeconds,
            edgeColo,
          },
        }, {
          headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=60' }
        })
      }
    } catch (e) {
      console.error('KV Read Error:', e)
    }
  }

  if (!domain) {
    return NextResponse.json({ error: 'Invalid target' }, { status: 400 })
  }

  try {
    const isActuallyIp = isIpAddress(domain)
    const privateIpRegex = /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|127\.)/
    const isPrivateIp = isActuallyIp && privateIpRegex.test(domain)
    
    // DNS Lookup Logic
    const dnsResolvers = [
      { name: 'Cloudflare', url: `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, headers: { 'accept': 'application/dns-json' } },
      { name: 'Google', url: `https://dns.google/resolve?name=${domain}&type=A`, headers: {} as Record<string, string> },
      { name: 'AliDNS', url: `https://dns.alidns.com/resolve?name=${domain}&type=A`, headers: {} as Record<string, string> }
    ];

    const dnsPromise: Promise<[any, number]> = isActuallyIp 
      ? Promise.resolve([[ { resolver: 'Direct', data: { Status: 0, Answer: [{ type: 1, data: domain }] }} ], 0])
      : (() => {
          const t0 = Date.now()
          return Promise.all(
            dnsResolvers.map(async (r) => {
              const resolverStartedAt = Date.now()
              const [aData, aaaaData] = await Promise.all([
                fetch(r.url, { headers: r.headers, signal: AbortSignal.timeout(3000) })
                  .then(res => res.json())
                  .catch(() => null),
                fetch(r.url.replace('type=A', 'type=AAAA'), { headers: r.headers, signal: AbortSignal.timeout(3000) })
                  .then(res => res.json())
                  .catch(() => null),
              ])
              const ipv4 = extractDnsRecords(aData, 1)
              const ipv6 = extractDnsRecords(aaaaData, 28)
              return {
                resolver: r.name,
                data: aData,
                latencyMs: Date.now() - resolverStartedAt,
                status: aData || aaaaData ? 'OK' : 'FAILED',
                records: { A: ipv4, AAAA: ipv6 },
              }
            })
          ).then(results => {
            const successfulLatencies = results
              .filter(result => result.status === 'OK')
              .map(result => result.latencyMs)
            const fastestLatency = successfulLatencies.length > 0 ? Math.min(...successfulLatencies) : Date.now() - t0
            return [results, fastestLatency] as [any, number]
          })
        })()

    // 1b. DNS record overview from a stable edge resolver.
    const dnsRecordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'CAA', 'SOA', 'NS'] as const
    const recordsPromise = isActuallyIp
      ? Promise.resolve(null)
      : Promise.all(
          dnsRecordTypes.map(async (type) => {
            const data = await fetchDnsJson(domain, type)
            const records = extractDnsRecordsByType(data, dnsTypeCodes[type])
              .map((value) => normalizeDnsRecordValue(type, value))
            return [type, Array.from(new Set(records))] as const
          }),
        ).then((entries) => Object.fromEntries(entries) as Record<typeof dnsRecordTypes[number], string[]>)

    // HTTP, SSL, and WHOIS Promises
    const ipHost = isActuallyIp && domain.includes(':') ? `[${domain}]` : domain
    const targetUrl = query.startsWith('http') ? query : (isActuallyIp ? `http://${ipHost}` : `https://${domain}`)
    const isHttps = targetUrl.startsWith('https')

    const httpPromise: Promise<[Response | { error: true; message: string }, number, RedirectTrace | undefined, string?]> = (() => {
      const t0 = Date.now()
      return Promise.all([
        fetch(targetUrl, {
          method: 'GET',
          redirect: 'follow',
          headers: { 'User-Agent': 'OpsKitPro-Diagnostic/1.0' },
          signal: AbortSignal.timeout(8000)
        }).then(async (res) => {
          let title: string | undefined = undefined
          try {
            const clone = res.clone()
            const contentType = clone.headers.get('content-type') || ''
            if (contentType.includes('text/html')) {
              const text = await clone.text().then(t => t.slice(0, 8192)).catch(() => '')
              const match = text.match(/<title[^>]*>([^<]+)<\/title>/i)
              if (match && match[1]) {
                title = match[1].trim().replace(/\s+/g, ' ')
              }
            }
          } catch (e) {}
          // @ts-ignore attach title to response object temporarily
          res._page_title = title
          return res
        }),
        traceRedirects(targetUrl).catch(() => ({
          chain: [],
          finalUrl: targetUrl,
          warning: 'Redirect trace unavailable.',
        })),
      ])
        .then(([res, redirectTrace]) => [res, Date.now() - t0, redirectTrace, (res as any)._page_title] as [Response, number, RedirectTrace, string?])
        .catch((e: Error) => [{ error: true as const, message: e.message }, Date.now() - t0, undefined, undefined] as [{ error: true; message: string }, number, undefined, undefined])
    })()

    const sslPromise = (isActuallyIp || !isHttps) ? Promise.resolve(null) : fetch(`https://crt.sh/?q=${domain}&output=json`, {
      signal: AbortSignal.timeout(3000)
    }).then(r => r.json()).catch(() => null)

    const whoisPromise = (() => {
      const rdapUrl = isActuallyIp ? `https://rdap.org/ip/${domain}` : `https://rdap.org/domain/${domain}`
      return fetch(rdapUrl, {
        headers: { 'Accept': 'application/rdap+json', 'User-Agent': 'OpsKitPro-Diagnostic/1.0' },
        signal: AbortSignal.timeout(3000)
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    })()

    const [[dnsResults, dnsLatency], [httpResRaw, httpLatency, redirectTrace, pageTitle], dnsRecordsData] = await Promise.all([
      dnsPromise,
      httpPromise,
      recordsPromise
    ])
    const coreMs = Date.now() - requestStartedAt
    const [crtData, rdapData] = await Promise.all([sslPromise, whoisPromise])

    const httpRes = httpResRaw as Response | { error: true; message: string }
    let whoisInfo: any = {
      registered: 'Unknown', registrar: 'Unknown', status: 'Unknown', success: false, expires: 'Unknown'
    }

    if (rdapData) {
      whoisInfo.success = true
      
      // Parse Organization/Registrar
      const entity = rdapData.entities?.find((e: any) => e.roles?.includes('registrar') || e.roles?.includes('registrant')) || rdapData.entities?.[0]
      if (entity?.vcardArray?.[1]) {
        whoisInfo.registrar = entity.vcardArray[1].find((v: any) => v[0] === 'fn')?.[3] || 'Unknown'
      }
      
      // Parse Events (Registration/Expiration)
      whoisInfo.registered = rdapData.events?.find((e: any) => e.eventAction === 'registration')?.eventDate?.split('T')[0] || 'Unknown'
      whoisInfo.expires = rdapData.events?.find((e: any) => e.eventAction === 'expiration')?.eventDate?.split('T')[0] || 'Unknown'
      
      whoisInfo.status = isActuallyIp ? `Network: ${rdapData.name || 'OK'}` : rdapData.status?.join(', ') || 'OK'
    }

    if ('error' in httpRes) {
      const partialError: DiagnosticPartialErrorResponse = {
        domain,
        status: 'partial_error',
        isVisitor,
        isActuallyIp,
        isPrivate: isPrivateIp,
        error: httpRes.message,
        dns: { resolved_ip: domain, latency: `${dnsLatency}ms`, success: true },
        meta: buildMeta(useKvCache ? 'MISS' : 'BYPASS'),
      }
      return NextResponse.json(partialError)
    }

    const dnsMatch = dnsResults.find((r: any) => r.data?.Answer)
    const ipv4: string[] = isActuallyIp && !domain.includes(':')
      ? [domain]
      : Array.from(new Set<string>(dnsResults.flatMap((result: any) => result.records?.A || [])))
    const ipv6: string[] = isActuallyIp && domain.includes(':')
      ? [domain]
      : Array.from(new Set<string>(dnsResults.flatMap((result: any) => result.records?.AAAA || [])))
    const allIps: string[] = isActuallyIp
      ? [domain]
      : [...ipv4, ...ipv6]
    const nsRecords: string[] = dnsRecordsData?.NS || []
    const dnsRecords = {
      A: dnsRecordsData?.A?.length ? dnsRecordsData.A : ipv4,
      AAAA: dnsRecordsData?.AAAA?.length ? dnsRecordsData.AAAA : ipv6,
      CNAME: dnsRecordsData?.CNAME || [],
      MX: dnsRecordsData?.MX || [],
      TXT: dnsRecordsData?.TXT || [],
      CAA: dnsRecordsData?.CAA || [],
      SOA: dnsRecordsData?.SOA || [],
    }
    const ip = isActuallyIp ? domain : (allIps[0] || dnsMatch?.data?.Answer?.[0]?.data || domain)
    const serverHeader = httpRes.headers.get('server') || 'Unknown'
    const hstsEnabled = Boolean(httpRes.headers.get('strict-transport-security'))
    const securityHeaders = buildSecurityHeadersSummary(httpRes.headers)

    // Enhanced CDN Logic
    let provider = 'Origin'
    let isCdn = false
    if (!isPrivateIp) {
      const serverValue = serverHeader.toLowerCase()
      if (httpRes.headers.get('cf-ray') || serverValue.includes('cloudflare')) {
        provider = 'Cloudflare'; isCdn = true
      } else if (serverValue.includes('akamai')) {
        provider = 'Akamai'; isCdn = true
      }
    } else {
      provider = 'Internal Gateway'
    }

    // IP Geolocation
    let geo = { country: 'Unknown', isp: 'Unknown', city: 'Unknown', asn: 'Unknown' }
    if (isPrivateIp) {
      geo = { country: 'Local Network', isp: 'Private Intranet', city: 'Intranet', asn: 'N/A' }
    } else {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(1800) }).then(r => r.json())
        geo = {
          country: geoRes.country_name || 'Unknown',
          city: geoRes.city || 'Unknown',
          isp: geoRes.org || 'Unknown',
          asn: geoRes.asn || 'Unknown'
        }
      } catch {}
    }

    const certEntries = Array.isArray(crtData) ? crtData : []
    const latestCert = certEntries
      .filter((entry: any) => entry?.not_after)
      .sort((a: any, b: any) => String(b.not_after).localeCompare(String(a.not_after)))[0]
    const sslExpiry = latestCert?.not_after ? String(latestCert.not_after).split('T')[0].split(' ')[0] : 'Unknown'
    const sslIssuer = latestCert?.issuer_name || 'Unknown'
    const expiryDate = sslExpiry !== 'Unknown' ? new Date(sslExpiry) : null
    const daysToExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000) : null
    const certValid = isHttps && (daysToExpiry === null || daysToExpiry >= 0)
    const sslFactors = [
      isHttps ? 'HTTPS_ENABLED' : null,
      certValid ? 'CERT_VALID' : null,
      hstsEnabled ? 'HSTS_ENABLED' : null,
      isCdn ? 'CDN_PRESENT' : null,
    ].filter(Boolean) as string[]
    const sslGrade = !isHttps || !certValid
      ? 'F'
      : daysToExpiry !== null && daysToExpiry <= 15
        ? 'C'
        : hstsEnabled
          ? 'A+'
          : 'B'
    const certChain = [
      { level: 'Leaf', name: domain, status: certValid ? 'Active' : 'Invalid' },
      ...(sslIssuer !== 'Unknown' ? [{ level: 'Issuer', name: sslIssuer, status: 'Trusted' }] : []),
    ]

    const responseData: DiagnosticSuccessResponse = {
      domain,
      status: 'success',
      isVisitor,
      isActuallyIp,
      isPrivate: isPrivateIp,
      dns: {
        resolved_ip: ip,
        all_ips: allIps,
        ipv4,
        ipv6,
        dual_stack: ipv4.length > 0 && ipv6.length > 0,
        ns: nsRecords,
        records: dnsRecords,
        latency: `${dnsLatency}ms`,
        success: allIps.length > 0,
        resolvers: dnsResults,
      },
      http: {
        success: httpRes.ok,
        status_code: httpRes.status,
        latency: `${httpLatency}ms`,
        is_https: isHttps,
        final_url: redirectTrace?.finalUrl || httpRes.url || targetUrl,
        redirect_chain: redirectTrace?.chain || [],
        redirect_count: Math.max(0, (redirectTrace?.chain?.length || 1) - 1),
        redirect_warning: redirectTrace?.warning,
        cf_ray: httpRes.headers.get('cf-ray') || undefined,
        page_title: pageTitle,
      },
      securityHeaders,
      ssl: { valid: certValid, issuer: sslIssuer, expiry: sslExpiry, grade: sslGrade, factors: sslFactors, tls_version: isHttps ? 'TLS' : 'HTTP', chain: certChain },
      cdn: { is_provider: isCdn, provider, server: serverHeader },
      geo,
      whois: whoisInfo,
      meta: buildMeta(useKvCache ? 'MISS' : 'BYPASS', {
        coreMs,
        enrichmentMs: Math.max(0, Date.now() - requestStartedAt - coreMs),
      }),
    }

    if (KV && useKvCache) {
      await KV.put(cacheKey, JSON.stringify(responseData), { expirationTtl: 3600 }).catch(() => null)
    }
    return NextResponse.json(responseData, {
      headers: useKvCache
        ? { 'X-Cache': 'MISS', 'Cache-Control': 'no-store' }
        : { 'X-Cache': 'BYPASS', 'Cache-Control': 'no-store' },
    })

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const target = typeof body?.target === 'string' ? normalizeTargetInput(body.target) : ''

    if (!target) {
      return NextResponse.json({ error: 'target is required' }, { status: 400 })
    }

    const response: DiagnosticPostSuccessResponse = {
      success: true,
      data: {
        target,
        status: 'online',
        timestamp: new Date().toISOString(),
      },
    }
    return NextResponse.json(response)
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Invalid request body' },
      { status: 500 }
    )
  }
}
