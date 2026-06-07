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

    // Log is the source of truth.
    // KV counter intentionally disabled to avoid build/runtime coupling.

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
