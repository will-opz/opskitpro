import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const targetIp = searchParams.get('q')

  const fetchFallbackData = async (queryIp: string) => {
    try {
      const res = await fetch(`http://ip-api.com/json/${queryIp}`, { signal: AbortSignal.timeout(4000) })
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
        network_type: (data.isp || '').toLowerCase().includes('cloud') ? 'Data Center' : 'Residential',
        proxy: false
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

  // 2. Feature: Current User Info using Cloudflare Edge (request.cf)
  const cfip = request.headers.get('cf-connecting-ip');
  const xff = request.headers.get('x-forwarded-for')?.split(',')[0];
  const rip = request.headers.get('x-real-ip');
  const nextIp = (request as any).ip;
  const ip = cfip || xff || rip || nextIp || '127.0.0.1';

  // Cloudflare injects the CF object in edge runtime
  const cf = (request as any).cf;

  if (cf && Object.keys(cf).length > 0) {
    return NextResponse.json({
      ip,
      country_name: cf.country || 'N/A', // CF returns ISO 3166-1 Alpha 2 code
      country_code: cf.country || '',
      region: cf.region || cf.regionCode || 'N/A',
      city: cf.city || 'N/A',
      latitude: cf.latitude || '',
      longitude: cf.longitude || '',
      org: cf.asOrganization || 'N/A',
      asn: cf.asn ? `AS${cf.asn}` : '',
      timezone: cf.timezone || 'UTC',
      network_type: (cf.asOrganization || '').toLowerCase().includes('cloud') ? 'Data Center' : 'Residential',
      proxy: false, 
      _source: 'cloudflare-edge'
    })
  }

  // Fallback for Local Development (where CF object is mostly absent)
  const fallbackData = await fetchFallbackData(ip)
  if (fallbackData) {
    return NextResponse.json({ ...fallbackData, _source: 'local-fallback' })
  }
  
  return NextResponse.json({ ip, _source: 'unknown-fallback' })
}
