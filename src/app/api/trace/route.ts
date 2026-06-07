import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Disallow SSRF attacks
const BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,  // link-local, AWS metadata
  /^https?:\/\/::1/,
]

// Allow only valid hostnames (no paths, no queries, no ports)
// We'll enforce this by parsing the hostname and enforcing standard ports for HTTPS.
const VALID_HOSTNAME_REGEX = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')

  if (!domain) {
    return NextResponse.json({ error: 'Missing domain parameter' }, { status: 400 })
  }

  // Basic validation: Must be a pure domain/hostname
  if (!VALID_HOSTNAME_REGEX.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 })
  }

  // Construct strict HTTPS URL to /cdn-cgi/trace
  const targetUrl = `https://${domain}/cdn-cgi/trace`

  // SSRF checks
  if (BLOCKED_PATTERNS.some(p => p.test(targetUrl))) {
    return NextResponse.json({ error: 'Target URL not allowed' }, { status: 403 })
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'text/plain, */*',
        'User-Agent': 'OpsKitPro-Trace-Client/1.0',
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
    })

    const text = await response.text()
    const isCloudflare = response.headers.get('server')?.toLowerCase().includes('cloudflare') || false

    // Heuristics to confirm it's actually CF trace
    const isValidTrace = text.includes('ip=') && text.includes('colo=') && text.includes('ts=')

    if (!response.ok || (!isValidTrace && !isCloudflare)) {
      return NextResponse.json({ 
        error: `Could not verify Cloudflare Trace on ${domain}`, 
        status: response.status,
        text: text.slice(0, 500) // just a snippet if it's not a trace
      }, { status: 404 })
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Target-Server': response.headers.get('server') || 'unknown'
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Trace request failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
