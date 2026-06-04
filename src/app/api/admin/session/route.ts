import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  getAdminToken,
  isAdminConfigured,
  isAdminPassword,
  isAdminRequest,
} from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: await isAdminRequest(request),
    configured: isAdminConfigured(),
  })
}

export async function POST(request: NextRequest) {
  let body: { password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ authenticated: false, error: 'invalid_json' }, { status: 400 })
  }

  if (!isAdminConfigured()) {
    return NextResponse.json({ authenticated: false, error: 'not_configured' }, { status: 503 })
  }

  if (!isAdminPassword(body.password || '')) {
    return NextResponse.json({ authenticated: false, error: 'invalid_password' }, { status: 401 })
  }

  const response = NextResponse.json({ authenticated: true })
  response.cookies.set(ADMIN_COOKIE_NAME, await getAdminToken(), {
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
