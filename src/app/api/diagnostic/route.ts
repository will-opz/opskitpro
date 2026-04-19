import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type {
  DiagnosticHealthResponse,
  DiagnosticPartialErrorResponse,
  DiagnosticPostSuccessResponse,
  DiagnosticSuccessResponse,
} from '@/lib/api-contracts'

// Removed runtime='edge' to avoid Cloudflare/Next.js edge runtime conflicts that caused 500 errors previously
export const dynamic = 'force-dynamic'

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

export async function GET(request: NextRequest | Request) {
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
  
  // IP vs Domain distinction
  const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/
  let domain = query.replace(/^https?:\/\//, '').split('/')[0]
  
  // If no query, default to visitor's own IP
  if (!query) {
    domain = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
  }

  const cacheKey = `diag:${domain}`
  
  // --- Robust KV Discovery ---
  let KV: any = (process.env as any).KV;
  if (!KV) {
    try {
      const { env } = await getCloudflareContext();
      KV = (env as any)?.KV || (globalThis as any).KV;
    } catch (e) {
      KV = (globalThis as any).KV;
    }
  }

  // 1. Global KV Cache Lookup
  if (KV && !searchParams.has('_nocache')) {
    try {
      const cached = await KV.get(cacheKey)
      if (cached) {
      return NextResponse.json(JSON.parse(cached), {
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
    const isActuallyIp = ipRegex.test(domain)
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
            dnsResolvers.map(r => 
              fetch(r.url, { headers: r.headers, signal: AbortSignal.timeout(4000) })
                .then(res => res.json())
                .then(data => ({ resolver: r.name, data }))
                .catch(() => ({ resolver: r.name, data: null }))
            )
          ).then(results => [results, Date.now() - t0] as [any, number])
        })()

    // 1b. NS Lookup
    const nsPromise = isActuallyIp ? Promise.resolve(null) : fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=NS`, {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(4000)
    }).then(r => r.json()).catch(() => null)

    // HTTP, SSL, and WHOIS Promises
    const targetUrl = query.startsWith('http') ? query : (isActuallyIp ? `http://${domain}` : `https://${domain}`)
    const isHttps = targetUrl.startsWith('https')

    const httpPromise = (() => {
      const t0 = Date.now()
      return fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': 'OpsKitPro-Diagnostic/1.0' },
        signal: AbortSignal.timeout(8000)
      })
        .then(res => [res, Date.now() - t0] as [Response, number])
        .catch((e: Error) => [{ error: true as const, message: e.message }, Date.now() - t0])
    })()

    const sslPromise = (isActuallyIp || !isHttps) ? Promise.resolve(null) : fetch(`https://crt.sh/?q=${domain}&output=json`, {
      signal: AbortSignal.timeout(6000)
    }).then(r => r.json()).catch(() => null)

    const whoisPromise = (() => {
      const rdapUrl = isActuallyIp ? `https://rdap.org/ip/${domain}` : `https://rdap.org/domain/${domain}`
      return fetch(rdapUrl, {
        headers: { 'Accept': 'application/rdap+json', 'User-Agent': 'OpsKitPro-Diagnostic/1.0' },
        signal: AbortSignal.timeout(6000)
      }).then(r => r.ok ? r.json() : null).catch(() => null)
    })()

    const [[dnsResults, dnsLatency], [httpResRaw, httpLatency], crtData, rdapData, nsData] = await Promise.all([
      dnsPromise,
      httpPromise,
      sslPromise,
      whoisPromise,
      nsPromise
    ])

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
        isActuallyIp,
        isPrivate: isPrivateIp,
        error: httpRes.message,
        dns: { resolved_ip: domain, latency: `${dnsLatency}ms`, success: true }
      }
      return NextResponse.json(partialError)
    }

    const dnsMatch = dnsResults.find((r: any) => r.data?.Answer)
    const ip = isActuallyIp ? domain : (dnsMatch?.data?.Answer?.[0]?.data || domain)
    const serverHeader = httpRes.headers.get('server') || 'Unknown'

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
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, { signal: AbortSignal.timeout(4000) }).then(r => r.json())
        geo = {
          country: geoRes.country_name || 'Unknown',
          city: geoRes.city || 'Unknown',
          isp: geoRes.org || 'Unknown',
          asn: geoRes.asn || 'Unknown'
        }
      } catch {}
    }

    const responseData: DiagnosticSuccessResponse = {
      domain,
      status: 'success',
      isActuallyIp,
      isPrivate: isPrivateIp,
      dns: { resolved_ip: ip, latency: `${dnsLatency}ms`, success: true, resolvers: dnsResults },
      http: { success: httpRes.ok, status_code: httpRes.status, latency: `${httpLatency}ms` },
      ssl: { valid: isHttps, issuer: 'Unknown', expiry: 'Unknown' },
      cdn: { is_provider: isCdn, provider, server: serverHeader },
      geo,
      whois: whoisInfo
    }

    if (KV) await KV.put(cacheKey, JSON.stringify(responseData), { expirationTtl: 3600 }).catch(() => null)
    return NextResponse.json(responseData)

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
