import { describe, it, expect } from 'vitest'
import { GET, POST } from '../route'

describe('GET /api/diagnostic — health check', () => {
  it('returns status: ready', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ready')
  })
})

describe('POST /api/diagnostic — validation', () => {
  it('returns 400 when target is missing', async () => {
    const req = new Request('http://localhost/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/target is required/i)
  })

  it('returns 400 when body is empty object', async () => {
    const req = new Request('http://localhost/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: '' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('POST /api/diagnostic — success path', () => {
  it('returns 200 with success data for a valid target', async () => {
    const req = new Request('http://localhost/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.target).toBe('example.com')
    expect(body.data.status).toBe('online')
  })

  it('includes a valid ISO 8601 timestamp in data', async () => {
    const req = new Request('http://localhost/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: 'opskitpro.com' }),
    })
    const res = await POST(req)
    const body = await res.json()
    const ts = new Date(body.data.timestamp)
    expect(ts.toString()).not.toBe('Invalid Date')
  })

  it('echoes the target in the response data', async () => {
    const target = 'custom-domain.example'
    const req = new Request('http://localhost/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(body.data.target).toBe(target)
  })
})

describe('POST /api/diagnostic — error handling', () => {
  it('returns 500 for malformed JSON body', async () => {
    const req = new Request('http://localhost/api/diagnostic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-valid-json{{{',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBeDefined()
  })
})
