import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // 0. Force HTTPS in production
  const proto = request.headers.get('x-forwarded-proto')
  if (process.env.NODE_ENV === 'production' && proto === 'http') {
    url.protocol = 'https:'
    return NextResponse.redirect(url, 301)
  }
  
  // 1. Handle language prefixing via REWRITE (internal routing)
  // This allows /zh/tools/ip-lookup to show /tools/ip-lookup content
  const localeMatch = pathname.match(/^\/(zh|en|ja|tw)(\/.*|$)/)
  
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

  // 2. Auto-detect logic for default locale based on Cloudflare IP Country
  // If no locale prefix and no cookie exists, detect and set cookie.
  let response = NextResponse.next()
  const currentCookie = request.cookies.get('NEXT_LOCALE')?.value
  
  if (!currentCookie && !pathname.match(/^\/(api|_next|favicon\.ico)/)) {
    const country = request.headers.get('cf-ipcountry') || ''
    
    // Default logic
    let defaultLocale = 'en'
    if (country === 'JP') defaultLocale = 'ja'
    else if (country === 'CN') defaultLocale = 'zh'
    else if (['TW', 'HK', 'MO'].includes(country)) defaultLocale = 'tw'
    
    // Inject cookie into the request for downstream Server Components
    const requestHeaders = new Headers(request.headers)
    const existingCookie = requestHeaders.get('cookie') || ''
    requestHeaders.set('cookie', `${existingCookie ? existingCookie + '; ' : ''}NEXT_LOCALE=${defaultLocale}`)
    
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    
    // Set the cookie on the client response to persist
    response.cookies.set('NEXT_LOCALE', defaultLocale, { 
      path: '/',
      maxAge: 31536000,
      sameSite: 'lax'
    })
  }

  return response
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, api, static assets)
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
