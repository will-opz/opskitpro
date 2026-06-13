import 'server-only'

import type { NextRequest } from 'next/server'

export const ADMIN_COOKIE_NAME = 'opskitpro_admin'
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30
export const CLOUDFLARE_ACCESS_EMAIL_HEADER = 'cf-access-authenticated-user-email'

type HeaderReader = {
  get(name: string): string | null
}

async function sha256(value: string) {
  const input = new TextEncoder().encode(value)
  const hash = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export function isAdminConfigured() {
  return Boolean(process.env.OPSKITPRO_ADMIN_PASSWORD || (getAdminSecret() && getAllowedAdminEmails().length > 0))
}

export function isAdminPassword(password: string) {
  const expected = process.env.OPSKITPRO_ADMIN_PASSWORD || ''
  return Boolean(expected && password === expected)
}

export async function getAdminToken() {
  const password = process.env.OPSKITPRO_ADMIN_PASSWORD || ''
  const secret = getAdminSecret()

  if (!password || !secret) return ''
  return sha256(`${password}:${secret}`)
}

export function getAdminSecret() {
  return process.env.OPSKITPRO_ADMIN_SECRET || process.env.OPSKITPRO_ADMIN_PASSWORD || ''
}

export async function getCloudflareAccessAdminToken(email: string) {
  const secret = getAdminSecret()
  const normalizedEmail = email.trim().toLowerCase()

  if (!secret || !isAllowedAdminEmail(normalizedEmail)) return ''
  return sha256(`cloudflare-access:${normalizedEmail}:${secret}`)
}

export async function isAdminToken(token?: string) {
  const expected = await getAdminToken()
  if (token && expected && token === expected) return true

  const accessTokens = await Promise.all(
    getAllowedAdminEmails().map((email) => getCloudflareAccessAdminToken(email)),
  )
  return Boolean(token && accessTokens.some((accessToken) => accessToken && token === accessToken))
}

export function getAllowedAdminEmails() {
  return (process.env.OPSKITPRO_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

export function getCloudflareAccessEmail(headers: HeaderReader) {
  return headers.get(CLOUDFLARE_ACCESS_EMAIL_HEADER)?.trim().toLowerCase() || ''
}

export function isAllowedAdminEmail(email?: string) {
  if (!email) return false
  return getAllowedAdminEmails().includes(email.trim().toLowerCase())
}

export async function isAdminIdentity(token?: string, accessEmail?: string) {
  return await isAdminToken(token) || isAllowedAdminEmail(accessEmail)
}

export async function isAdminRequest(request: NextRequest) {
  return isAdminIdentity(
    request.cookies.get(ADMIN_COOKIE_NAME)?.value,
    getCloudflareAccessEmail(request.headers),
  )
}
