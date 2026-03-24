import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { match as matchLocale } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

const locales = ['zh', 'en']
const defaultLocale = 'zh'

function getLocale(request: NextRequest): string {
  if (request.cookies.has('NEXT_LOCALE')) {
    const cookieLang = request.cookies.get('NEXT_LOCALE')?.value;
    if (cookieLang && locales.includes(cookieLang)) return cookieLang;
  }
  
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  try {
    return matchLocale(languages, locales, defaultLocale)
  } catch {
    return defaultLocale
  }
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const { pathname, search } = request.nextUrl

  // 1. Permanent Domain Redirect (301)
  if (host.includes('deops.org')) {
    const newUrl = new URL(`https://opskitpro.com${pathname}${search}`)
    return NextResponse.redirect(newUrl, 301)
  }

  // 2. Language & Assets Handling
  if (
    pathname.includes('.') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next')
  ) {
    return
  }

  const locale = getLocale(request)
  const response = NextResponse.next()

  if (!request.cookies.has('NEXT_LOCALE') || request.cookies.get('NEXT_LOCALE')?.value !== locale) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production'
    })
  }

  return response
}

export const config = {
  runtime: 'experimental-edge',
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}