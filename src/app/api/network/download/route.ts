import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/runtime-context";
import {
  checkRateLimit,
  createRateLimitHeaders,
  rateLimitResponse,
} from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const ALLOWED_SIZES = new Set([1, 10, 50]);
const MB = 1_048_576; // 1 MiB
const CHUNK_SIZE = 65_536; // 64 KiB per chunk

// Build a non-compressible repeating chunk to be streamed as bandwidth filler.
// Using a deterministic pattern avoids the overhead of crypto.getRandomValues
// on large payloads while still producing incompressible data for accurate speed tests.
function buildChunk(): Uint8Array {
  const buf = new Uint8Array(CHUNK_SIZE);
  for (let i = 0; i < CHUNK_SIZE; i++) {
    buf[i] = (i * 137 + 42) & 0xff;
  }
  return buf;
}

export async function GET(request: NextRequest) {
  const rateLimit = checkRateLimit({
    ip: getClientIp(request),
    route: "/api/network/download",
    costClass: "HIGH",
    limit: 5,
    windowSeconds: 60,
  });
  if (!rateLimit.success) return rateLimitResponse(rateLimit);

  const sizeParam = parseInt(
    request.nextUrl.searchParams.get("size") ?? "1",
    10,
  );
  const sizeMb = ALLOWED_SIZES.has(sizeParam) ? sizeParam : 1;
  const totalBytes = sizeMb * MB;

  const chunk = buildChunk();

  let sent = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      const remaining = totalBytes - sent;
      if (remaining <= 0) {
        controller.close();
        return;
      }

      const nextChunk =
        remaining >= CHUNK_SIZE ? chunk : chunk.slice(0, remaining);
      controller.enqueue(nextChunk);
      sent += nextChunk.byteLength;
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(totalBytes),
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Size-MB": String(sizeMb),
      "X-Accel-Buffering": "no",
      ...createRateLimitHeaders(rateLimit),
    },
  });
}
