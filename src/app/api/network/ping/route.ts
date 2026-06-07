import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Minimal ping endpoint — used by client to measure round-trip latency
// GET: returns timestamp for latency measurement
// POST: accepts any body (for upload speed test), returns timestamp
export async function GET(_request: NextRequest) {
  return NextResponse.json(
    { ts: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Accel-Buffering': 'no',
      },
    }
  )
}

// Upload speed test: client sends a random Blob, we just discard it
export async function POST(request: NextRequest) {
  // Consume (drain) the request body to get accurate upload timing on client
  try {
    await request.arrayBuffer()
  } catch {
    // Ignore — body may be large; draining is best-effort
  }
  return NextResponse.json(
    { ts: Date.now() },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache',
      },
    }
  )
}
