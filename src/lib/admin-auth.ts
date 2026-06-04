import 'server-only'

import type { NextRequest } from 'next/server'

export const ADMIN_COOKIE_NAME = 'opskitpro_admin'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

async function sha256(value: string) {
  const input = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function isAdminConfigured() {
  return Boolean(process.env.OPSKITPRO_ADMIN_PASSWORD)
}

export function isAdminPassword(password: string) {
  const expected = process.env.OPSKITPRO_ADMIN_PASSWORD || ''
  return Boolean(expected && password === expected)
}

export async function getAdminToken() {
  const password = process.env.OPSKITPRO_ADMIN_PASSWORD || ''
  const secret = process.env.OPSKITPRO_ADMIN_SECRET || password

  if (!password || !secret) return ''
  return sha256(`${password}:${secret}`)
}

export async function isAdminToken(token?: string) {
  const expected = await getAdminToken()
  return Boolean(token && expected && token === expected)
}

export async function isAdminRequest(request: NextRequest) {
  return isAdminToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value)
}
