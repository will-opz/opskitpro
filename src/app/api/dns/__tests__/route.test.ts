import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

function makeRequest(params: Record<string, string>): NextRequest {
  const url = new URL('http://localhost/api/dns')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new NextRequest(url.toString())
}

// Standard mock DNS response from Cloudflare DoH
function mockDnsResponse(answers: any[] = [], status = 0) {
  return new Response(
    JSON.stringify({ Status: status, Answer: answers }),
    { status: 200, headers: { 'Content-Type': 'application/dns-json' } }
  )
}

describe('GET /api/dns — parameter validation', () => {
  it('returns 400 when domain is missing', async () => {
    const req = makeRequest({ type: 'A' })
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = JSON.parse(await res.text())
    expect(body.error).toMatch(/missing domain/i)
  })
})

describe('GET /api/dns — successful resolution', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 200 with A record answers', async () => {
    const answers = [
      { name: 'example.com', type: 1, TTL: 300, data: '93.184.216.34' }
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse(answers)))

    const req = makeRequest({ domain: 'example.com', type: 'A' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = JSON.parse(await res.text())
    expect(body.domain).toBe('example.com')
    expect(body.type).toBe('A')
    expect(body.status).toBe('NOERROR')
    expect(body.answers).toHaveLength(1)
    expect(body.answers[0].data).toBe('93.184.216.34')
    expect(body.provider).toBe('Cloudflare')
  })

  it('returns correct status for NXDOMAIN (non-existent domain)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse([], 3)))

    const req = makeRequest({ domain: 'this-domain-does-not-exist-xyz.com', type: 'A' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const body = JSON.parse(await res.text())
    expect(body.status).toBe('NXDOMAIN')
    expect(body.answers).toHaveLength(0)
  })

  it('returns correct status for SERVFAIL', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse([], 2)))

    const req = makeRequest({ domain: 'example.com', type: 'A' })
    const res = await GET(req)
    const body = JSON.parse(await res.text())
    expect(body.status).toBe('SERVFAIL')
  })

  it('handles unknown DNS status codes gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse([], 99)))

    const req = makeRequest({ domain: 'example.com', type: 'A' })
    const res = await GET(req)
    const body = JSON.parse(await res.text())
    expect(body.status).toMatch(/UNKNOWN\(99\)/)
  })

  it('defaults to A record type when type is not specified', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse([])))

    const req = makeRequest({ domain: 'example.com' })
    const res = await GET(req)
    const body = JSON.parse(await res.text())
    expect(body.type).toBe('A')
  })

  it('handles MX record queries', async () => {
    const answers = [
      { name: 'example.com', type: 15, TTL: 300, data: '10 mail.example.com' }
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse(answers)))

    const req = makeRequest({ domain: 'example.com', type: 'MX' })
    const res = await GET(req)
    const body = JSON.parse(await res.text())
    expect(body.type).toBe('MX')
    expect(body.answers[0].data).toContain('mail.example.com')
  })

  it('handles TXT record queries', async () => {
    const answers = [
      { name: 'example.com', type: 16, TTL: 300, data: 'v=spf1 include:_spf.example.com ~all' }
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse(answers)))

    const req = makeRequest({ domain: 'example.com', type: 'TXT' })
    const res = await GET(req)
    const body = JSON.parse(await res.text())
    expect(body.answers[0].data).toContain('spf1')
  })

  it('includes X-Response-Time header in response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse([])))

    const req = makeRequest({ domain: 'example.com', type: 'A' })
    const res = await GET(req)
    expect(res.headers.get('X-Response-Time')).toMatch(/^\d+ms$/)
  })

  it('includes responseTime field in body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockDnsResponse([])))

    const req = makeRequest({ domain: 'example.com', type: 'A' })
    const res = await GET(req)
    const body = JSON.parse(await res.text())
    expect(typeof body.responseTime).toBe('number')
    expect(body.responseTime).toBeGreaterThanOrEqual(0)
  })
})

describe('GET /api/dns — error handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 500 when upstream fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('DNS resolver unreachable')))

    const req = makeRequest({ domain: 'example.com', type: 'A' })
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = JSON.parse(await res.text())
    expect(body.error).toMatch(/DNS resolver unreachable/i)
  })
})
