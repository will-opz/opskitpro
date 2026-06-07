import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_EVENTS = new Set([
  'error_page_to_website_check',
  'website_check_to_trace',
  'website_check_to_dns_audit',
  'dns_audit_export',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { event, page, target } = body

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json(
        { ok: false },
        {
          status: 400,
          headers: { 'Cache-Control': 'no-store' }
        }
      )
    }

    const today = new Date().toISOString().split('T')[0]
    
    // Log as the Source of Truth for Cloudflare Logpush
    console.log(JSON.stringify({
      type: 'analytics_event',
      event,
      page: page ? String(page).split('?')[0] : undefined, // only path, no query
      target: target ? String(target) : undefined,
      date: today,
      ts: Date.now()
    }))

    // Best-effort approximate KV counter (optional, not strictly consistent)
    let KV: any = (process.env as any).KV
    if (!KV) {
      try {
        const { env } = require('cloudflare:sockets')
        KV = (env as any)?.KV || (globalThis as any).KV
      } catch {
        KV = (globalThis as any).KV
      }
    }

    if (KV) {
      const key = `analytics:daily:${today}:${event}`
      // Fire and forget read/modify/write
      KV.get(key).then((val: string | null) => {
        const count = parseInt(val || '0') + 1
        return KV.put(key, count.toString())
      }).catch(() => null)
    }

    return NextResponse.json(
      { ok: true },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (err) {
    return NextResponse.json(
      { ok: false },
      {
        status: 400,
        headers: { 'Cache-Control': 'no-store' }
      }
    )
  }
}
