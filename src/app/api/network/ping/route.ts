import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Minimal ping endpoint — used by client to measure round-trip latency
// GET: returns timestamp for latency measurement
export async function GET() {
  return NextResponse.json(
    { ts: Date.now() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
