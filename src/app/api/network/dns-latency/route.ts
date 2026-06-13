import { NextResponse } from 'next/server'
import type { DnsLatencyItem } from '@/lib/api-contracts'

export const dynamic = 'force-dynamic'

const RESOLVERS: Array<{
  resolver: string
  provider: string
  url: string
  headers: Record<string, string>
}> = [
  {
    resolver: '1.1.1.1',
    provider: 'Cloudflare',
    url: 'https://cloudflare-dns.com/dns-query?name=example.com&type=A',
    headers: { accept: 'application/dns-json' },
  },
  {
    resolver: '8.8.8.8',
    provider: 'Google',
    url: 'https://dns.google/resolve?name=example.com&type=A',
    headers: {},
  },
  {
    resolver: '9.9.9.9',
    provider: 'Quad9',
    url: 'https://dns.quad9.net/dns-query?name=example.com&type=A',
    headers: { accept: 'application/dns-json' },
  },
  {
    resolver: '208.67.222.222',
    provider: 'OpenDNS',
    url: 'https://doh.opendns.com/dns-query?name=example.com&type=A',
    headers: { accept: 'application/dns-json' },
  },
]

export async function GET() {
  const results: DnsLatencyItem[] = await Promise.all(
    RESOLVERS.map(async (resolver): Promise<DnsLatencyItem> => {
      const startedAt = Date.now()
      try {
        const response = await fetch(resolver.url, {
          headers: resolver.headers,
          signal: AbortSignal.timeout(3500),
        })
        const latencyMs = Date.now() - startedAt
        return {
          resolver: resolver.resolver,
          provider: resolver.provider,
          latencyMs,
          status: response.ok ? 'ok' : 'failed',
        }
      } catch {
        return {
          resolver: resolver.resolver,
          provider: resolver.provider,
          latencyMs: null,
          status: 'failed',
        }
      }
    }),
  )

  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
