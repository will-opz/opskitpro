import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ADMIN_COOKIE_NAME = 'opskitpro_admin'
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
const CLOUDFLARE_ACCESS_EMAIL_HEADER = 'cf-access-authenticated-user-email'

async function sha256(value: string) {
  const input = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function getAllowedAdminEmails() {
  return (process.env.OPSKITPRO_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

async function attachCloudflareAccessAdminCookie(request: NextRequest, response: NextResponse) {
  const token = await getCloudflareAccessAdminToken(request)
  if (!token) return response

  if (request.cookies.get(ADMIN_COOKIE_NAME)?.value === token) {
    return response
  }

  response.cookies.set(
    ADMIN_COOKIE_NAME,
    token,
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ADMIN_COOKIE_MAX_AGE,
      path: '/',
    },
  )

  return response
}

async function getCloudflareAccessAdminToken(request: NextRequest) {
  const secret = process.env.OPSKITPRO_ADMIN_SECRET || process.env.OPSKITPRO_ADMIN_PASSWORD || ''
  const accessEmail = request.headers.get(CLOUDFLARE_ACCESS_EMAIL_HEADER)?.trim().toLowerCase() || ''
  const allowed = accessEmail && getAllowedAdminEmails().includes(accessEmail)

  if (!secret || !allowed) return ''
  return sha256(`cloudflare-access:${accessEmail}:${secret}`)
}

function injectCookie(headers: Headers, name: string, value: string) {
  const existingCookie = headers.get('cookie') || ''
  const withoutExisting = existingCookie
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && !part.startsWith(`${name}=`))
    .join('; ')

  headers.set('cookie', `${withoutExisting ? withoutExisting + '; ' : ''}${name}=${value}`)
}

function getForwardedHost(request: NextRequest) {
  return request.headers.get('x-forwarded-host') || request.headers.get('host') || ''
}

const LOCALES = ['zh', 'en', 'ja', 'tw']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // 0. Force HTTPS in production
  const proto = request.headers.get('x-forwarded-proto')
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    const forwardedHost = getForwardedHost(request)
    if (forwardedHost) {
      url.host = forwardedHost
      if (!forwardedHost.includes(':')) {
        url.port = ''
      }
    }
    url.protocol = 'https:'
    return attachCloudflareAccessAdminCookie(request, NextResponse.redirect(url, 301))
  }
  
  // 1. Check if the pathname already has a locale prefix
  const hasLocale = LOCALES.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )
  
  if (hasLocale || pathname.startsWith('/admin')) {
    // Already localized or is admin path. Let the Next.js page handle it natively.
    return attachCloudflareAccessAdminCookie(request, NextResponse.next())
  }

  // 2. If no locale, we REDIRECT to a localized path.
  const currentCookie = request.cookies.get('NEXT_LOCALE')?.value
  
  const country = request.headers.get('cf-ipcountry') || ''
  let defaultLocale = 'en'
  if (country === 'JP') defaultLocale = 'ja'
  else if (country === 'CN') defaultLocale = 'zh'
  else if (['TW', 'HK', 'MO'].includes(country)) defaultLocale = 'tw'

  const locale = currentCookie && LOCALES.includes(currentCookie) ? currentCookie : defaultLocale
  
  const forwardedHost = getForwardedHost(request)
  if (forwardedHost) {
    url.host = forwardedHost
    if (!forwardedHost.includes(':')) {
      url.port = ''
    }
  }

  url.pathname = `/${locale}${pathname}`
  const response = NextResponse.redirect(url, 307)
  
  // Set cookie ONLY on the redirect response to avoid busting cache on static HTML (200 OK)
  if (currentCookie !== locale) {
    response.cookies.set('NEXT_LOCALE', locale, { 
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax'
    })
  }

  return attachCloudflareAccessAdminCookie(request, response)
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static assets)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
