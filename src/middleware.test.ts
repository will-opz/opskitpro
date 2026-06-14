import { afterEach, describe, it, expect } from 'vitest'
import { middleware } from './middleware'
import { NextRequest } from 'next/server'

const originalNodeEnv = process.env.NODE_ENV

function makeRequest(pathname: string, cookieLocale?: string): NextRequest {
  const req = new NextRequest(`http://localhost${pathname}`)
  if (cookieLocale) {
    req.cookies.set('NEXT_LOCALE', cookieLocale)
  }
  return req
}

afterEach(() => {
  delete process.env.OPSKITPRO_ADMIN_EMAILS
  delete process.env.OPSKITPRO_ADMIN_SECRET
  process.env.NODE_ENV = originalNodeEnv
})

describe('middleware — locale redirection', () => {
  it('passes through localized paths without redirecting', async () => {
    const req = makeRequest('/zh/tools/ip-lookup')
    const res = await middleware(req)
    // Next response has status 200 (pass-through)
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })

  it('redirects root path / to default locale /en', async () => {
    const req = makeRequest('/')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/en')
  })

  it('redirects /services to /en/services', async () => {
    const req = makeRequest('/services')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/en/services')
  })

  it('redirects /blog to /en/blog', async () => {
    const req = makeRequest('/blog')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/en/blog')
  })

  it('passes through admin path without redirecting', async () => {
    const req = makeRequest('/admin')
    const res = await middleware(req)
    expect(res.status).toBe(200)
    expect(res.headers.get('location')).toBeNull()
  })
})

describe('middleware — locale cookie', () => {
  it('does NOT set cookie when path already has a locale', async () => {
    const req = makeRequest('/zh/about')
    const res = await middleware(req)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toBeNull()
  })

  it('sets NEXT_LOCALE cookie to en when redirecting to /en', async () => {
    const req = makeRequest('/about')
    const res = await middleware(req)
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toContain('NEXT_LOCALE=en')
  })

  it('respects existing NEXT_LOCALE cookie when redirecting', async () => {
    const req = makeRequest('/services', 'zh')
    const res = await middleware(req)
    expect(res.status).toBe(307)
    expect(res.headers.get('location')).toBe('http://localhost/zh/services')
    // Does not re-set the cookie because it already matches
    const setCookie = res.headers.get('set-cookie')
    expect(setCookie).toBeNull()
  })

  it('sets cookie with SameSite=Lax during redirect', async () => {
    const req = makeRequest('/tools/dns-lookup')
    const res = await middleware(req)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie.toLowerCase()).toContain('samesite=lax')
  })

  it('sets cookie with long max-age (1 year) during redirect', async () => {
    const req = makeRequest('/tools/ip-lookup')
    const res = await middleware(req)
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('31536000')
  })
})

describe('middleware — Cloudflare Access admin cookie', () => {
  it('sets the admin cookie for a whitelisted Cloudflare Access email', async () => {
    process.env.OPSKITPRO_ADMIN_EMAILS = 'will@example.com'
    process.env.OPSKITPRO_ADMIN_SECRET = 'test-secret'

    const req = new NextRequest('http://localhost/admin', {
      headers: {
        'cf-access-authenticated-user-email': 'will@example.com',
      },
    })
    const res = await middleware(req)
    const setCookie = res.headers.get('set-cookie') ?? ''

    expect(setCookie).toContain('opskitpro_admin=')
    expect(setCookie.toLowerCase()).toContain('httponly')
    expect(setCookie.toLowerCase()).toContain('samesite=lax')
  })

  it('does not set the admin cookie for a non-whitelisted Cloudflare Access email', async () => {
    process.env.OPSKITPRO_ADMIN_EMAILS = 'will@example.com'
    process.env.OPSKITPRO_ADMIN_SECRET = 'test-secret'

    const req = new NextRequest('http://localhost/admin', {
      headers: {
        'cf-access-authenticated-user-email': 'other@example.com',
      },
    })
    const res = await middleware(req)
    const setCookie = res.headers.get('set-cookie') ?? ''

    expect(setCookie).not.toContain('opskitpro_admin=')
  })
})

describe('middleware — proxy redirects', () => {
  it('uses forwarded host when forcing HTTPS behind a reverse proxy', async () => {
    process.env.NODE_ENV = 'production'

    const req = new NextRequest('http://localhost:3000/tools/website-check', {
      headers: {
        host: 'localhost:3000',
        'x-forwarded-host': 'opskitpro.com',
        'x-forwarded-proto': 'http',
      },
    })
    const res = await middleware(req)

    expect(res.status).toBe(301)
    expect(res.headers.get('location')).toBe('https://opskitpro.com/tools/website-check')
  })
})
