import { LRUCache } from "lru-cache";
import crypto from "crypto";

// In-memory limiter for single-node deployment.
// Not suitable for multi-instance horizontal scaling.
// We use a generous max size to prevent memory exhaustion from random IP scans.
const rateLimitCache = new LRUCache<string, { count: number; resetAt: number }>({
  max: 50000,
  ttl: 60 * 1000 * 5, // Keys live at most 5 minutes (max window)
});

export type RateLimitCostClass = "LOW" | "MEDIUM" | "HIGH";

export interface RateLimitOptions {
  ip: string;
  route: string;
  costClass: RateLimitCostClass;
  limit: number;
  windowSeconds?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // Unix timestamp in ms
  retryAfterSeconds: number;
  ipHash: string;
}

export function checkRateLimit({
  ip,
  route,
  costClass,
  limit,
  windowSeconds = 60,
}: RateLimitOptions): RateLimitResult {
  const isEnabled = process.env.RATE_LIMIT_ENABLED !== "false";
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 8);
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (!isEnabled) {
    return {
      success: true,
      limit,
      remaining: limit,
      resetAt: now + windowMs,
      retryAfterSeconds: 0,
      ipHash,
    };
  }

  const key = `rate:${costClass}:${route}:${ipHash}`;

  let bucket = rateLimitCache.get(key);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + windowMs };
    rateLimitCache.set(key, bucket);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: bucket.resetAt,
      retryAfterSeconds: 0,
      ipHash,
    };
  }

  bucket.count += 1;
  const isAllowed = bucket.count <= limit;
  const retryAfterSeconds = isAllowed ? 0 : Math.ceil((bucket.resetAt - now) / 1000);

  return {
    success: isAllowed,
    limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds,
    ipHash,
  };
}

export function createRateLimitHeaders(result: RateLimitResult): HeadersInit {
  const headers: Record<string, string> = {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };

  if (!result.success && result.retryAfterSeconds > 0) {
    headers["Retry-After"] = String(result.retryAfterSeconds);
  }

  return headers;
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please retry later.",
        retryAfter: result.retryAfterSeconds,
      },
    },
    {
      status: 429,
      headers: {
        ...createRateLimitHeaders(result),
        "Cache-Control": "no-store",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    }
  );
}
