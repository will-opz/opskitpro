import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 1. Handle language prefixing via REWRITE (internal routing)
  // This allows /zh/tools/ip-lookup to show /tools/ip-lookup content
  const localeMatch = pathname.match(/^\/(zh|en)(\/.*|$)/)
  
  if (localeMatch) {
    const locale = localeMatch[1]
    const subpath = localeMatch[2] || '/'
    
    // Create the rewrite URL
    const url = request.nextUrl.clone()
    url.pathname = subpath
    
    const response = NextResponse.rewrite(url)
    
    // Set cookie so that Layout/Pages know the preferred language
    const currentCookie = request.cookies.get('NEXT_LOCALE')?.value
    if (currentCookie !== locale) {
      response.cookies.set('NEXT_LOCALE', locale, { 
        path: '/',
        maxAge: 31536000, // 1 year
        sameSite: 'lax'
      })
    }
    
    return response
  }

  // 2. Default pass-through
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static assets)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
