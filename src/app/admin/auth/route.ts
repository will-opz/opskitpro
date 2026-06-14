import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  getCloudflareAccessAdminToken,
  getCloudflareAccessEmail,
  isAllowedAdminEmail,
} from '@/lib/admin-auth'

function normalizeNextPath(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/admin'
  if (value.startsWith('/api') || value.startsWith('/_next')) return '/admin'

  return value
}

export async function GET(request: NextRequest) {
  const nextPath = normalizeNextPath(request.nextUrl.searchParams.get('next'))
  const accessEmail = getCloudflareAccessEmail(request.headers)
  const response = NextResponse.redirect(new URL(nextPath, request.url))

  if (isAllowedAdminEmail(accessEmail)) {
    response.cookies.set(ADMIN_COOKIE_NAME, await getCloudflareAccessAdminToken(accessEmail), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: ADMIN_COOKIE_MAX_AGE,
      path: '/',
    })
  }

  return response
}
