import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// export const runtime = 'edge' // Removed to avoid 500 errors on OpenNext Node.js runtime
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetIp = searchParams.get('q')

  const fetchFallbackData = async (queryIp: string) => {
    try {
      // Request `hosting` and `proxy` fields explicitly; free tier supports `hosting`
      const res = await fetch(
        `https://ip-api.com/json/${queryIp}?fields=status,country,countryCode,regionName,city,lat,lon,timezone,isp,as,hosting,proxy`,
        { signal: AbortSignal.timeout(4000) }
      )
      const data = await res.json()
      if (data.status === 'fail') throw new Error('API Fail')
      return {
        ip: queryIp,
        country_name: data.country || 'N/A',
        country_code: data.countryCode || '',
        region: data.regionName || 'N/A',
        city: data.city || 'N/A',
        latitude: data.lat || '',
        longitude: data.lon || '',
        org: data.isp || 'N/A',
        asn: data.as ? data.as.split(' ')[0] : '',
        timezone: data.timezone || 'UTC',
        // ip-api returns `hosting: true` for data-center/hosting IPs (more reliable than ISP name heuristic)
        network_type: data.hosting ? 'Data Center' : 'Residential',
        proxy: data.proxy || false
      }
    } catch {
      return null
    }
  }

  // 1. Feature: Support querying a specified IP
  if (targetIp) {
    const fallbackData = await fetchFallbackData(targetIp)
    if (fallbackData) {
      return NextResponse.json({ ...fallbackData, _source: 'external-lookup' })
    }
    return NextResponse.json({ ip: targetIp, error: 'External API failure' }, { status: 500 })
  }

  // 2. Feature: Current User Info using Cloudflare (getCloudflareContext)
  const cfip = request.headers.get('cf-connecting-ip');
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0];
  const rip = request.headers.get('x-real-ip');
  const nextIp = (request as any).ip;
  const ip = cfip || xff || rip || nextIp || '127.0.0.1';

  // Use getCloudflareContext to access CF metadata
  try {
    const { cf } = await getCloudflareContext();

    if (cf && Object.keys(cf).length > 0) {
      return NextResponse.json({
        ip,
        country_name: cf.country || 'N/A',
        country_code: cf.country || '',
        region: cf.region || cf.regionCode || 'N/A',
        city: cf.city || 'N/A',
        latitude: cf.latitude || '',
        longitude: cf.longitude || '',
        org: cf.asOrganization || 'N/A',
        asn: cf.asn ? `AS${cf.asn}` : '',
        timezone: cf.timezone || 'UTC',
        // Cloudflare does not expose a direct hosting/residential flag; leave as unknown
        network_type: 'Unknown',
        proxy: false,
        _source: 'cloudflare-context'
      })
    }
  } catch {
    // getCloudflareContext not available (e.g., local dev without wrangler)
  }

  // Fallback for Local Development (where CF context is mostly absent)
  const fallbackData = await fetchFallbackData(ip)
  if (fallbackData) {
    return NextResponse.json({ ...fallbackData, _source: 'local-fallback' })
  }
  
  return NextResponse.json({ ip, _source: 'unknown-fallback' })
}
