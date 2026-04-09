import { NextRequest, NextResponse } from 'next/server'

// export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Allowlist: only fetch URLs that look like public JSON endpoints
const BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,  // link-local
  /^https?:\/\/::1/,
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  // Block requests to private/internal networks (SSRF prevention)
  if (BLOCKED_PATTERNS.some(p => p.test(targetUrl))) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 403 })
  }

  // Only allow http/https
  if (!/^https?:\/\//i.test(targetUrl)) {
    return NextResponse.json({ error: 'Only http/https URLs are supported' }, { status: 400 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'User-Agent': 'OpsKitPro-Proxy/1.0',
      },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${response.status}` },
        { status: response.status }
      )
    }

    const contentType = response.headers.get('content-type') || 'text/plain'
    const text = await response.text()

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        // Prevent the proxied content from escaping its iframe/fetch context
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Proxy request failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
