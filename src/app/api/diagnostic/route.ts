import { NextRequest, NextResponse } from 'next/server'

// Removed runtime='edge' to avoid Cloudflare/Next.js edge runtime conflicts that caused 500 errors previously
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('domain') || ''
  const domain = query.replace(/^https?:\/\//, '').split('/')[0]

  if (!domain) {
    return NextResponse.json({ error: 'Invalid domain' }, { status: 400 })
  }

  try {
    // 1. Multi-Resolver DNS Lookup (Cloudflare, Google, Quad9) — timed independently
    const dnsResolvers = [
      { name: 'Cloudflare', url: `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, headers: { 'accept': 'application/dns-json' } },
      { name: 'Google', url: `https://dns.google/resolve?name=${domain}&type=A`, headers: {} },
      { name: 'Quad9', url: `https://dns.quad9.net/dns-query?name=${domain}&type=A`, headers: { 'accept': 'application/dns-json' } }
    ];

    const dnsPromise: Promise<[any, number]> = (() => {
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

    // 1b. NS Lookup (Via Cloudflare)
    const nsPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=NS`, {
      headers: { 'accept': 'application/dns-json' },
      signal: AbortSignal.timeout(4000)
    }).then(r => r.json()).catch(() => null)

    // 2. HTTP Connectivity & Basic Detection — timed independently
    const targetUrl = query.startsWith('http') ? query : `https://${domain}`
    const httpPromise: Promise<[Response | { error: true; message: string }, number]> = (() => {
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

    // 3. SSL via crt.sh (public, no API key needed, Edge-compatible)
    const sslPromise = fetch(`https://crt.sh/?q=${domain}&output=json`, {
      signal: AbortSignal.timeout(6000)
    }).then(r => r.json()).catch(() => null)

    // 4. WHOIS via RDAP
    let whoisFetchError = null;
    let rawRdap = null;
    const whoisPromise = fetch(`https://rdap.org/domain/${domain}`, {
      headers: { 
        'Accept': 'application/rdap+json',
        'User-Agent': 'curl/8.4.0'
      },
      signal: AbortSignal.timeout(6000)
    })
    .then(r => {
      if (!r.ok) {
        whoisFetchError = `HTTP ${r.status} ${r.statusText}`;
        return null;
      }
      return r.json();
    })
    .catch(e => {
      whoisFetchError = e.message;
      return null;
    })

    const [[dnsResults, dnsLatency], [httpResRaw, httpLatency], crtData, rdapData, nsData] = await Promise.all([
      dnsPromise,
      httpPromise,
      sslPromise,
      whoisPromise,
      nsPromise
    ])

    const httpRes = httpResRaw as Response | { error: true; message: string }

    let whoisInfo: any = {
      registered: 'Unknown',
      expires: 'Unknown',
      registrar: 'Unknown',
      status: 'Unknown',
      nameservers: [],
      success: false,
      error: whoisFetchError
    }

    if (rdapData && rdapData.events) {
      whoisInfo.success = true
      
      const regEvent = rdapData.events.find((e: any) => e.eventAction === 'registration')
      if (regEvent) whoisInfo.registered = String(regEvent.eventDate).split('T')[0]

      const expEvent = rdapData.events.find((e: any) => e.eventAction === 'expiration')
      if (expEvent) whoisInfo.expires = String(expEvent.eventDate).split('T')[0]

      if (rdapData.entities) {
        const regEntity = rdapData.entities.find((e: any) => e.roles && e.roles.includes('registrar'))
        if (regEntity && regEntity.vcardArray && regEntity.vcardArray[1]) {
          const fn = regEntity.vcardArray[1].find((v: any) => v[0] === 'fn')
          if (fn) whoisInfo.registrar = fn[3]
        }
      }

      if (rdapData.status && Array.isArray(rdapData.status)) {
        whoisInfo.status = rdapData.status.join(', ')
      }

      if (rdapData.nameservers && Array.isArray(rdapData.nameservers)) {
        whoisInfo.nameservers = rdapData.nameservers.map((ns: any) => ns.ldhName).filter(Boolean)
      }
    }

    const dnsResult = dnsResults.find((r: any) => r.data?.Status === 0)?.data || dnsResults[0]?.data || { Status: -1 }
    const allIps = Array.from(new Set(
        dnsResults.flatMap((r: any) => r.data?.Answer?.filter((a: any) => a.type === 1 || a.type === 28).map((a: any) => a.data) || [])
    ))
    const resolverStatus = dnsResults.map((r: any) => ({ 
        name: r.resolver, 
        status: r.data?.Status === 0 ? 'OK' : 'FAIL',
        ips: r.data?.Answer?.filter((a: any) => a.type === 1).map((a: any) => a.data) || []
    }))
    const dnsNs = nsData?.Answer?.filter((a: any) => a.type === 2).map((a: any) => a.data) || []

    // Handle HTTP Fetch Error
    if ('error' in httpRes) {
      const currentIp = allIps[0] || 'N/A'
      return NextResponse.json({
        domain,
        status: 'partial_success',
        dns: {
          resolved_ip: currentIp,
          all_ips: allIps,
          latency: `${dnsLatency}ms`,
          success: dnsResult.Status === 0,
          resolvers: resolverStatus,
          ns: dnsNs
        },
        http: {
          success: false,
          error: (httpRes as any).message
        },
        ssl: { valid: false, issuer: 'Unknown', expiry: 'Unknown', tls_version: 'N/A' },
        cdn: { is_provider: false, provider: 'Unknown', server: 'N/A' },
        geo: { country: 'Unknown', isp: 'Unknown' },
        whois: whoisInfo
      })
    }

    const ip = allIps[0] || 'N/A'
    const serverHeader = httpRes.headers.get('server') || 'Unknown'
    const isHttps = httpRes.url.startsWith('https')

    // Enhanced CDN Detection
    const cfRay = httpRes.headers.get('cf-ray')
    const akamaiHeader = httpRes.headers.get('x-akamai-transformed')
    const fastlyHeader = httpRes.headers.get('x-served-by')
    const via = httpRes.headers.get('via') || ''

    let provider = 'Origin'
    let isCdn = false

    if (cfRay || serverHeader.toLowerCase().includes('cloudflare')) {
      provider = 'Cloudflare'
      isCdn = true
    } else if (akamaiHeader || via.toLowerCase().includes('akamai')) {
      provider = 'Akamai'
      isCdn = true
    } else if (fastlyHeader || via.toLowerCase().includes('fastly')) {
      provider = 'Fastly'
      isCdn = true
    } else if (serverHeader.toLowerCase().includes('cloudfront') || via.toLowerCase().includes('cloudfront')) {
      provider = 'AWS CloudFront'
      isCdn = true
    } else if (httpRes.headers.get('x-cdn') || httpRes.headers.get('x-cache')) {
      provider = 'CDN (Unknown)'
      isCdn = true
    }

    // Parse SSL info from crt.sh (most recent valid cert)
    let sslInfo = {
      valid: isHttps, // if HTTPS request succeeded, cert is valid
      issuer: 'Unknown',
      expiry: 'Unknown',
      // Edge runtime cannot inspect the underlying TLS handshake; report as unknown
      tls_version: isHttps ? 'Unknown' : 'N/A'
    }

    if (Array.isArray(crtData) && crtData.length > 0) {
      // crt.sh returns newest first; pick the most recent entry
      const latest = crtData.find((c: any) => c.not_after) || crtData[0]
      if (latest) {
        sslInfo.issuer = latest.issuer_name
          ? latest.issuer_name.match(/O=([^,]+)/)?.[1]?.trim() || latest.issuer_name
          : 'Unknown'
        // Format: "2026-06-01T12:00:00" → "2026-06-01"
        sslInfo.expiry = latest.not_after
          ? String(latest.not_after).split('T')[0]
          : 'Unknown'
      }
    }

    // IP Geolocation (supports both IPv4 and IPv6)
    let geo = { country: 'Unknown', isp: 'Unknown' }
    if (ip !== 'N/A') {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
          signal: AbortSignal.timeout(4000)
        }).then(r => r.json())
        geo = {
          country: geoRes.country_name || 'Unknown',
          isp: geoRes.org || geoRes.asn || 'Unknown'
        }
      } catch {
        // Geolocation unavailable, use defaults
      }
    }

    return NextResponse.json({
      domain,
      status: 'success',
      dns: {
        resolved_ip: ip,
        all_ips: allIps,
        latency: `${dnsLatency}ms`,
        success: dnsResult.Status === 0,
        resolvers: resolverStatus,
        ns: dnsNs
      },
      http: {
        success: httpRes.ok,
        status_code: httpRes.status,
        status_text: httpRes.statusText,
        latency: `${httpLatency}ms`,
        is_https: isHttps
      },
      ssl: sslInfo,
      cdn: {
        is_provider: isCdn,
        provider,
        server: serverHeader
      },
      geo,
      whois: whoisInfo
    }, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Response-Time': `${httpLatency}ms`
      }
    })

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Diagnostic failed'
    }, { status: 500 })
  }
}
