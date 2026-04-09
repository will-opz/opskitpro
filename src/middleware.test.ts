import { describe, it, expect } from 'vitest'
import { middleware } from './middleware'
import { NextRequest } from 'next/server'

function makeRequest(pathname: string, cookieLocale?: string): NextRequest {
  const req = new NextRequest(`http://localhost${pathname}`)
  if (cookieLocale) {
    req.cookies.set('NEXT_LOCALE', cookieLocale)
  }
  return req
}

describe('middleware — locale rewriting', () => {
  it('rewrites /zh to /', async () => {
    const req = makeRequest('/zh')
    const res = middleware(req)
    // Rewrite response should have the rewritten URL pointing to /
    expect(res.status).toBe(200)
  })

  it('rewrites /zh/tools/ip-lookup to /tools/ip-lookup', async () => {
    const req = makeRequest('/zh/tools/ip-lookup')
    const res = middleware(req)
    expect(res.status).toBe(200)
    // The internal rewrite target is /tools/ip-lookup
    const rewriteHeader = res.headers.get('x-middleware-rewrite')
    expect(rewriteHeader).toContain('/tools/ip-lookup')
  })

  it('rewrites /en/services to /services', async () => {
    const req = makeRequest('/en/services')
    const res = middleware(req)
    expect(res.status).toBe(200)
    const rewriteHeader = res.headers.get('x-middleware-rewrite')
    expect(rewriteHeader).toContain('/services')
  })

  it('rewrites /en/blog to /blog', async () => {
    const req = makeRequest('/en/blog')
    const res = middleware(req)
    const rewriteHeader = res.headers.get('x-middleware-rewrite')
    expect(rewriteHeader).toContain('/blog')
  })

  it('passes through non-locale paths (no rewrite)', async () => {
    const req = makeRequest('/tools/dns-lookup')
    const res = middleware(req)
    // Should be a next() pass-through, not a rewrite
    const rewriteHeader = res.headers.get('x-middleware-rewrite')
    expect(rewriteHeader).toBeNull()
  })

  it('passes through root path /', async () => {
    const req = makeRequest('/')
    const res = middleware(req)
    const rewriteHeader = res.headers.get('x-middleware-rewrite')
    expect(rewriteHeader).toBeNull()
  })
})

describe('middleware — locale cookie', () => {
  it('sets NEXT_LOCALE cookie to zh when path starts with /zh', async () => {
    const req = makeRequest('/zh/about')
    const res = middleware(req)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('NEXT_LOCALE=zh')
  })

  it('sets NEXT_LOCALE cookie to en when path starts with /en', async () => {
    const req = makeRequest('/en/about')
    const res = middleware(req)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('NEXT_LOCALE=en')
  })

  it('does NOT set cookie again when NEXT_LOCALE is already correct', async () => {
    // Cookie already matches, so no set-cookie should be issued
    const req = makeRequest('/zh/services', 'zh')
    const res = middleware(req)
    // set-cookie should be absent or not change the value to zh again
    const setCookie = res.headers.get('set-cookie')
    // Per middleware logic: only sets if currentCookie !== locale
    expect(setCookie).toBeNull()
  })

  it('updates cookie when locale changes from en to zh', async () => {
    const req = makeRequest('/zh/services', 'en') // cookie says en, path says zh
    const res = middleware(req)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('NEXT_LOCALE=zh')
  })

  it('sets cookie with SameSite=Lax', async () => {
    const req = makeRequest('/en/tools/dns-lookup')
    const res = middleware(req)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie.toLowerCase()).toContain('samesite=lax')
  })

  it('sets cookie with long max-age (1 year)', async () => {
    const req = makeRequest('/zh/tools/ip-lookup')
    const res = middleware(req)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('31536000')
  })
})
