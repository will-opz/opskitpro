import { describe, it, expect } from 'vitest'
import { GET } from '../route'

function makeRequest(headers: Record<string, string> = {}, cf?: Record<string, any>): Request {
  const req = new Request('http://localhost/api/ip', { headers })
  // Attach Cloudflare-specific `cf` object to simulate edge runtime data
  ;(req as any).cf = cf || {}
  return req
}

describe('GET /api/ip — IP detection', () => {
  it('uses cf-connecting-ip header as primary IP source', async () => {
    const req = makeRequest({ 'cf-connecting-ip': '1.2.3.4' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ip).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when cf-connecting-ip is absent', async () => {
    const req = makeRequest({ 'x-real-ip': '5.6.7.8' })
    const res = await GET(req)
    const body = await res.json()
    expect(body.ip).toBe('5.6.7.8')
  })

  it('falls back to 127.0.0.1 when no IP headers are present', async () => {
    const req = makeRequest()
    const res = await GET(req)
    const body = await res.json()
    expect(body.ip).toBe('127.0.0.1')
  })

  it('prefers cf-connecting-ip over x-real-ip', async () => {
    const req = makeRequest({
      'cf-connecting-ip': '11.22.33.44',
      'x-real-ip': '99.88.77.66',
    })
    const res = await GET(req)
    const body = await res.json()
    expect(body.ip).toBe('11.22.33.44')
  })

  it('returns a graceful fallback contract for target IP lookups when the upstream service fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('upstream unavailable')
    }))

    const res = await GET(new Request('http://localhost/api/ip?q=172.67.176.41'))
    expect(res.status).toBe(200)

    const body = await res.json()
    expect(body).toMatchObject({
      ip: '172.67.176.41',
      country_name: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      provider: 'External Lookup',
      _source: 'external-lookup',
    })
  })
})

describe('GET /api/ip — Cloudflare geo data', () => {
  it('returns geo data from the cf object', async () => {
    const req = makeRequest(
      { 'cf-connecting-ip': '1.2.3.4' },
      {
        country: 'JP',
        city: 'Tokyo',
        latitude: '35.6895',
        longitude: '139.6917',
        region: 'Tokyo',
        asn: 2516,
        asOrganization: 'KDDI',
      }
    )
    const res = await GET(req)
    const body = await res.json()
    expect(body.country).toBe('JP')
    expect(body.city).toBe('Tokyo')
    expect(body.lat).toBe('35.6895')
    expect(body.lon).toBe('139.6917')
    expect(body.region).toBe('Tokyo')
    expect(body.asn).toBe(2516)
    expect(body.isp).toBe('KDDI')
  })

  it('returns Unknown defaults when cf object is empty', async () => {
    const req = makeRequest({ 'cf-connecting-ip': '1.2.3.4' }, {})
    const res = await GET(req)
    const body = await res.json()
    expect(body.country).toBe('Unknown')
    expect(body.city).toBe('Unknown')
    expect(body.region).toBe('Unknown')
    expect(body.isp).toBe('Unknown')
  })

  it('always reports provider as Cloudflare Edge', async () => {
    const req = makeRequest()
    const res = await GET(req)
    const body = await res.json()
    expect(body.provider).toBe('Cloudflare Edge')
  })

  it('returns 0 for lat/lon when missing from cf object', async () => {
    const req = makeRequest({ 'cf-connecting-ip': '1.2.3.4' }, {})
    const res = await GET(req)
    const body = await res.json()
    expect(body.lat).toBe('0')
    expect(body.lon).toBe('0')
  })
})

describe('GET /api/ip — response shape', () => {
  it('response contains all expected fields', async () => {
    const req = makeRequest({ 'cf-connecting-ip': '8.8.8.8' })
    const res = await GET(req)
    const body = await res.json()
    const requiredFields = ['ip', 'country', 'city', 'lat', 'lon', 'region', 'asn', 'isp', 'provider']
    requiredFields.forEach(field => {
      expect(body).toHaveProperty(field)
    })
  })
})
