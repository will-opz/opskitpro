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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // 0. Force HTTPS in production
  const proto = request.headers.get('x-forwarded-proto')
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    url.protocol = 'https:'
    return attachCloudflareAccessAdminCookie(request, NextResponse.redirect(url, 301))
  }
  
  // 1. Handle language prefixing via REWRITE (internal routing)
  // This allows /zh/tools/ip-lookup to show /tools/ip-lookup content
  const localeMatch = pathname.match(/^\/(zh|en|ja|tw)(\/.*|$)/)
  const currentCookie = request.cookies.get('NEXT_LOCALE')?.value
  
  if (localeMatch) {
    const locale = localeMatch[1]
    const subpath = localeMatch[2] || '/'
    
    // Create the rewrite URL
    const url = request.nextUrl.clone()
    url.pathname = subpath
    
    const response = NextResponse.rewrite(url)
    
    // Set cookie so that Layout/Pages know the preferred language
    if (currentCookie !== locale) {
      response.cookies.set('NEXT_LOCALE', locale, { 
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax'
      })
    }
    
    return attachCloudflareAccessAdminCookie(request, response)
  }

  // 2. Auto-detect logic for default locale based on Cloudflare IP Country
  // If no locale prefix and no cookie exists, detect and set cookie.
  const country = request.headers.get('cf-ipcountry') || ''
  let defaultLocale = 'en'
  if (country === 'JP') defaultLocale = 'ja'
  else if (country === 'CN') defaultLocale = 'zh'
  else if (['TW', 'HK', 'MO'].includes(country)) defaultLocale = 'tw'

  const locale = currentCookie || defaultLocale
  
  // Inject headers for downstream Server Components (Layouts/Pages)
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-url', request.url)
  requestHeaders.set('x-pathname', pathname)
  requestHeaders.set('x-next-locale', locale)
  const accessAdminToken = await getCloudflareAccessAdminToken(request)
  if (accessAdminToken) {
    injectCookie(requestHeaders, ADMIN_COOKIE_NAME, accessAdminToken)
  }

  let response: NextResponse

  if (!currentCookie && !pathname.match(/^\/(api|_next|favicon\.ico)/)) {
    // Inject cookie into the request for downstream Server Components
    const existingCookie = requestHeaders.get('cookie') || ''
    requestHeaders.set('cookie', `${existingCookie ? existingCookie + '; ' : ''}NEXT_LOCALE=${locale}`)
    
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // Set the cookie on the client response to persist
    response.cookies.set('NEXT_LOCALE', locale, { 
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax'
    })
  } else {
    // Standard response with injected headers
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
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
