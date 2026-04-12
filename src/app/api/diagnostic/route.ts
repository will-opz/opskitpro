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
    // 1. DNS Lookup (Using Cloudflare DoH) — timed independently
    const dnsPromise: Promise<[any, number]> = (() => {
      const t0 = Date.now()
      return fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=A`, {
        headers: { 'accept': 'application/dns-json' },
        signal: AbortSignal.timeout(5000)
      })
        .then(res => res.json())
        .then(data => [data, Date.now() - t0] as [any, number])
    })()

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

    const [[dnsResult, dnsLatency], [httpResRaw, httpLatency], crtData] = await Promise.all([
      dnsPromise,
      httpPromise,
      sslPromise
    ])

    const httpRes = httpResRaw as Response | { error: true; message: string }

    // Handle HTTP Fetch Error
    if ('error' in httpRes) {
      const ip = dnsResult.Answer?.[0]?.data || 'N/A'
      return NextResponse.json({
        domain,
        status: 'partial_success',
        dns: {
          resolved_ip: ip,
          latency: `${dnsLatency}ms`,
          success: dnsResult.Status === 0
        },
        http: {
          success: false,
          error: (httpRes as any).message
        },
        ssl: { valid: false, issuer: 'Unknown', expiry: 'Unknown', tls_version: 'N/A' },
        cdn: { is_provider: false, provider: 'Unknown', server: 'N/A' },
        geo: { country: 'Unknown', isp: 'Unknown' }
      })
    }

    const ip = dnsResult.Answer?.[0]?.data || 'N/A'
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
        latency: `${dnsLatency}ms`,
        success: dnsResult.Status === 0
      },
      http: {
        success: true,
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
      geo
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
