import { NextResponse } from 'next/server'

// export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const cf = (request as any).cf || {}
    const headers = request.headers
    
    // Cloudflare specific headers for real IP
    const ip = headers.get('cf-connecting-ip') || 
               headers.get('x-real-ip') || 
               '127.0.0.1'
               
    return NextResponse.json({
      ip,
      country: cf.country || 'Unknown',
      city: cf.city || 'Unknown',
      lat: cf.latitude || '0',
      lon: cf.longitude || '0',
      region: cf.region || 'Unknown',
      asn: cf.asn || '0',
      isp: cf.asOrganization || 'Unknown',
      provider: 'Cloudflare Edge'
    })
  } catch (error) {
    console.error('IP API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
