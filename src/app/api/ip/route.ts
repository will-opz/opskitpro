import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import type { IpLookupResponse } from '@/lib/api-contracts'

// export const runtime = 'edge' // Removed to avoid 500 errors on OpenNext Node.js runtime
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetIp = searchParams.get('q')

  const buildFallbackResponse = (
    ip: string,
    provider: string,
    source: IpLookupResponse['_source']
  ) =>
    ({
      ip,
      country: 'Unknown',
      country_name: 'Unknown',
      country_code: '',
      region: 'Unknown',
      city: 'Unknown',
      latitude: '',
      longitude: '',
      lat: '0',
      lon: '0',
      org: 'Unknown',
      isp: 'Unknown',
      asn: '',
      timezone: 'UTC',
      network_type: 'Unknown',
      proxy: false,
      provider,
      _source: source,
    }) satisfies IpLookupResponse

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
      return NextResponse.json({
        ip: fallbackData.ip,
        country: fallbackData.country_name,
        country_name: fallbackData.country_name,
        country_code: fallbackData.country_code,
        region: fallbackData.region,
        city: fallbackData.city,
        latitude: fallbackData.latitude,
        longitude: fallbackData.longitude,
        lat: fallbackData.latitude || '0',
        lon: fallbackData.longitude || '0',
        org: fallbackData.org,
        isp: fallbackData.org,
        asn: fallbackData.asn,
        timezone: fallbackData.timezone,
        network_type: fallbackData.network_type,
        proxy: fallbackData.proxy,
        provider: 'External Lookup',
        _source: 'external-lookup',
      } satisfies IpLookupResponse)
    }
    return NextResponse.json(
      buildFallbackResponse(targetIp, 'External Lookup', 'external-lookup')
    )
  }

  // 2. Feature: Current User Info using Cloudflare (getCloudflareContext)
  const cfip = request.headers.get('cf-connecting-ip');
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0];
  const rip = request.headers.get('x-real-ip');
  const nextIp = (request as any).ip;
  const ip = cfip || xff || rip || nextIp || '127.0.0.1';

  const buildCloudflareResponse = (cf: any) =>
    NextResponse.json({
      ip,
      country: cf.country || 'Unknown',
      country_name: cf.country || 'N/A',
      country_code: cf.country || '',
      region: cf.region || cf.regionCode || 'N/A',
      city: cf.city || 'N/A',
      latitude: cf.latitude || '',
      longitude: cf.longitude || '',
      lat: cf.latitude || '0',
      lon: cf.longitude || '0',
      org: cf.asOrganization || 'N/A',
      isp: cf.asOrganization || 'N/A',
      asn: cf.asn || '',
      timezone: cf.timezone || 'UTC',
      // Cloudflare does not expose a direct hosting/residential flag; leave as unknown
      network_type: 'Unknown',
      proxy: false,
      provider: 'Cloudflare Edge',
      _source: 'cloudflare-context'
    } satisfies IpLookupResponse)

  const requestCf = (request as any).cf
  if (requestCf && Object.keys(requestCf).length > 0) {
    return buildCloudflareResponse(requestCf)
  }

  // Prefer request-scoped CF metadata in tests/local dev, then fall back to OpenNext context.
  try {
    const { cf: cfContext } = await getCloudflareContext()
    if (cfContext && Object.keys(cfContext).length > 0) {
      return buildCloudflareResponse(cfContext)
    }
  } catch {
    // getCloudflareContext not available (e.g., local dev without wrangler)
  }

  // Fallback for Local Development (where CF context is mostly absent)
  const fallbackData = await fetchFallbackData(ip)
  if (fallbackData) {
    return NextResponse.json({ 
      ip: fallbackData.ip,
      country: fallbackData.country_name,
      country_name: fallbackData.country_name,
      country_code: fallbackData.country_code,
      region: fallbackData.region,
      city: fallbackData.city,
      latitude: fallbackData.latitude,
      longitude: fallbackData.longitude,
      lat: fallbackData.latitude || '0',
      lon: fallbackData.longitude || '0',
      org: fallbackData.org,
      isp: fallbackData.org,
      asn: fallbackData.asn,
      timezone: fallbackData.timezone,
      network_type: fallbackData.network_type,
      proxy: fallbackData.proxy,
      provider: 'Local Fallback',
      _source: 'local-fallback' 
    } satisfies IpLookupResponse)
  }
  
  return NextResponse.json(
    buildFallbackResponse(ip, 'Cloudflare Edge', 'cloudflare-edge-default')
  )
}
