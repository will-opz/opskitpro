import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  getAdminIdentity,
  getAdminToken,
  getAdminSecret,
  getAllowedAdminEmails,
  isAdminConfigured,
  isAllowedAdminEmail,
  isAdminPassword,
} from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const passwordConfigured = Boolean(process.env.OPSKITPRO_ADMIN_PASSWORD)
  const accessConfigured = Boolean(getAdminSecret() && getAllowedAdminEmails().length > 0)
  const identity = await getAdminIdentity(
    request.cookies.get(ADMIN_COOKIE_NAME)?.value,
    request.headers.get('cf-access-authenticated-user-email') || '',
  )

  return NextResponse.json({
    authenticated: identity.authenticated,
    email: identity.email,
    provider: identity.provider,
    configured: isAdminConfigured(),
    passwordConfigured,
    accessConfigured,
  })
}

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ authenticated: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ authenticated: false, error: 'not_configured' }, { status: 503 })
  }

  const email = (body.email || '').trim().toLowerCase()
  const allowedEmails = getAllowedAdminEmails()

  if (!email || (allowedEmails.length > 0 && !isAllowedAdminEmail(email)) || !isAdminPassword(body.password || '')) {
    return NextResponse.json({ authenticated: false, error: 'invalid_password' }, { status: 401 })
  }

  const response = NextResponse.json({ authenticated: true, email, provider: 'password' })
  response.cookies.set(ADMIN_COOKIE_NAME, await getAdminToken(email), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_COOKIE_MAX_AGE,
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set(ADMIN_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  return response
}
