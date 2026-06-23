import ipaddr from 'ipaddr.js'
import dns from 'dns/promises'

// A simple in-memory rate limiter using Map. 
// For production scale, replace with Redis or Cloudflare edge rate limiting.
const rateLimitCache = new Map<string, { count: number, resetTime: number }>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60 // 60 requests per minute

export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitCache.get(ip)

  if (!record) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (now > record.resetTime) {
    rateLimitCache.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
    return true
  }

  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false
  }

  record.count += 1
  return true
}

export function isValidUrl(urlStr: string): boolean {
  try {
    const url = new URL(urlStr)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Checks if an IP is a private/local IP address.
 */
export function isPrivateIp(ip: string): boolean {
  try {
    const addr = ipaddr.parse(ip)
    const range = addr.range()
    
    // Unicast range means it's a normal public IP.
    if (range === 'unicast') return false
    
    // Everything else (private, loopback, linkLocal, multicast, etc.) is blocked.
    return true
  } catch {
    // If it can't be parsed, assume it's unsafe.
    return true
  }
}

/**
 * Validates a URL against SSRF attacks. 
 * Resolves the domain to ensure it doesn't point to a local/private IP.
 */
export async function validateSSRF(urlStr: string): Promise<{ safe: boolean, ip?: string, error?: string }> {
  try {
    const url = new URL(urlStr)
    const hostname = url.hostname

    // First check if the hostname itself is a private IP.
    if (ipaddr.isValid(hostname)) {
      if (isPrivateIp(hostname)) {
        return { safe: false, error: 'Private IP addresses are not allowed.' }
      }
      return { safe: true, ip: hostname }
    }

    // Resolve domain to IP
    const records = await dns.resolve(hostname)
    if (!records || records.length === 0) {
      return { safe: false, error: 'Could not resolve domain.' }
    }

    // Check all resolved IPs to ensure none are private.
    for (const ip of records) {
      if (isPrivateIp(ip)) {
        return { safe: false, error: 'Domain resolves to a private IP address.' }
      }
    }

    return { safe: true, ip: records[0] }
  } catch (err: any) {
    return { safe: false, error: err.message || 'Invalid URL or DNS resolution failed.' }
  }
}
