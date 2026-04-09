import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Helper to build a NextRequest with given search params
function makeRequest(url: string): NextRequest {
  return new NextRequest(`http://localhost/api/proxy?url=${encodeURIComponent(url)}`)
}

function makeEmptyRequest(): NextRequest {
  return new NextRequest('http://localhost/api/proxy')
}

describe('GET /api/proxy — parameter validation', () => {
  it('returns 400 when url parameter is missing', async () => {
    const req = makeEmptyRequest()
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing url/i)
  })

  it('returns 400 for non-http/https scheme (ftp)', async () => {
    const req = makeRequest('ftp://example.com/file.json')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/http\/https/i)
  })

  it('returns 400 for javascript: scheme', async () => {
    const req = makeRequest('javascript:alert(1)')
    const res = await GET(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/http\/https/i)
  })

  it('returns 400 for file: scheme', async () => {
    const req = makeRequest('file:///etc/passwd')
    const res = await GET(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/proxy — SSRF prevention', () => {
  const blockedUrls = [
    'http://localhost/internal',
    'http://localhost:8080/admin',
    'http://127.0.0.1/secret',
    'http://127.0.0.255/secret',
    'http://10.0.0.1/metadata',
    'http://10.255.255.255/metadata',
    'http://192.168.0.1/router',
    'http://192.168.255.255/router',
    'http://172.16.0.1/internal',
    'http://172.31.255.255/internal',
    'http://169.254.169.254/latest/meta-data/',  // AWS metadata endpoint
    'http://::1/loopback',
  ]

  blockedUrls.forEach(url => {
    it(`blocks SSRF target: ${url}`, async () => {
      const req = makeRequest(url)
      const res = await GET(req)
      expect(res.status).toBe(403)
      const body = await res.json()
      expect(body.error).toMatch(/not allowed/i)
    })
  })
})

describe('GET /api/proxy — upstream handling', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns 200 with body on successful upstream fetch', async () => {
    const mockBody = JSON.stringify({ data: 'ok' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(mockBody, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    ))

    const req = makeRequest('https://api.example.com/data')
    const res = await GET(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toBe(mockBody)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  it('forwards upstream non-ok status code', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('Not Found', { status: 404 })
    ))

    const req = makeRequest('https://api.example.com/missing')
    const res = await GET(req)
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/404/i)
  })

  it('returns 500 when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network timeout')))

    const req = makeRequest('https://api.example.com/slow')
    const res = await GET(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toMatch(/Network timeout/i)
  })

  it('sets X-Content-Type-Options: nosniff on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } })
    ))

    const req = makeRequest('https://api.example.com/data')
    const res = await GET(req)
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff')
  })
})
