export async function performIpLookup(ip: string) {
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,lat,lon,timezone,isp,as,hosting,proxy`,
      { signal: AbortSignal.timeout(4000) }
    )
    const data = await res.json()
    if (data.status === 'fail') throw new Error('IP API Failed to resolve: ' + data.message)
    
    return {
      ip,
      country: data.country || 'N/A',
      countryCode: data.countryCode || '',
      region: data.regionName || 'N/A',
      city: data.city || 'N/A',
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      isp: data.isp || 'N/A',
      asn: data.as ? data.as.split(' ')[0] : '',
      timezone: data.timezone || 'UTC',
      isDataCenter: !!data.hosting,
      isProxy: !!data.proxy
    }
  } catch (err: any) {
    throw new Error(`Failed to lookup IP: ${err.message}`)
  }
}
