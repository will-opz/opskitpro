import { NextRequest, NextResponse } from 'next/server'
import type { NetworkInfoResponse } from '@/lib/api-contracts'
import {
  getClientIp,
  getCloudflareRuntimeContext,
  getRequestCloudflareMetadata,
} from '@/lib/runtime-context'

// Removed runtime='edge' to avoid 500 errors on OpenNext Node.js runtime
export const dynamic = 'force-dynamic'

async function fetchCfTrace(origin: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${origin}/cdn-cgi/trace`, {
      signal: AbortSignal.timeout(2500),
      headers: { 'User-Agent': 'OpsKitPro-NetworkCheck/1.0' },
    })
    const text = await res.text()
    return Object.fromEntries(
      text
        .trim()
        .split('\n')
        .map((line) => line.split('='))
        .filter((parts) => parts.length === 2)
        .map(([k, v]) => [k.trim(), v.trim()])
    )
  } catch {
    return {}
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)

  const ua = request.headers.get('user-agent') || 'Unknown'

  // --- CF metadata with 3-level fallback ---
  let cfData: any = getRequestCloudflareMetadata(request)

  if (!cfData || Object.keys(cfData).length === 0) {
    const { cf } = await getCloudflareRuntimeContext()
    cfData = cf && Object.keys(cf).length > 0 ? cf : (globalThis as any).__cf || null
  }

  // Cloudflare Trace
  const origin = request.nextUrl.origin
  const trace = await fetchCfTrace(origin)

  const response: NetworkInfoResponse = {
    ip,
    ipv6: ip.includes(':') ? ip : null,
    asn: cfData?.asn ?? null,
    org: cfData?.asOrganization || 'Unknown',
    country: cfData?.country || trace.loc || 'Unknown',
    city: cfData?.city || 'Unknown',
    colo: cfData?.colo || trace.colo || 'Unknown',
    timezone: cfData?.timezone || 'UTC',
    ua,
    trace:
      Object.keys(trace).length > 0
        ? {
            http: trace.http || 'Unknown',
            tls: trace.tls || 'Unknown',
            warp: trace.warp || 'off',
            gateway: trace.gateway || 'off',
            loc: trace.loc || cfData?.country || 'Unknown',
            sni: trace.sni || 'Unknown',
            kex: trace.kex || 'Unknown',
            ip: trace.ip || ip,
            colo: trace.colo || 'Unknown',
          }
        : null,
    _source: cfData ? 'cloudflare-context' : 'fallback',
  }

  return NextResponse.json(response, {
    headers: { 'Cache-Control': 'no-store, no-cache' },
  })
}
