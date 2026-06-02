import { NextRequest, NextResponse } from 'next/server'

const COOKIE_NAME = 'opskitpro_admin'
const MAX_AGE = 60 * 60 * 24 * 30

async function sha256(value: string) {
  const input = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

function getAdminPassword() {
  return process.env.OPSKITPRO_ADMIN_PASSWORD || ''
}

function getAdminSecret() {
  return process.env.OPSKITPRO_ADMIN_SECRET || getAdminPassword()
}

async function getExpectedToken() {
  const password = getAdminPassword()
  const secret = getAdminSecret()

  if (!password || !secret) return ''

  return sha256(`${password}:${secret}`)
}

async function isAuthenticated(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value || ''
  const expectedToken = await getExpectedToken()

  return Boolean(token && expectedToken && token === expectedToken)
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: await isAuthenticated(request),
    configured: Boolean(getAdminPassword()),
  })
}

export async function POST(request: NextRequest) {
  let body: { password?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ authenticated: false, error: 'invalid_json' }, { status: 400 })
  }

  const password = getAdminPassword()

  if (!password) {
    return NextResponse.json({ authenticated: false, error: 'not_configured' }, { status: 503 })
  }

  if (body.password !== password) {
    return NextResponse.json({ authenticated: false, error: 'invalid_password' }, { status: 401 })
  }

  const response = NextResponse.json({ authenticated: true })
  response.cookies.set(COOKIE_NAME, await getExpectedToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: MAX_AGE,
    path: '/',
  })

  return response
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false })
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/',
  })

  return response
}
