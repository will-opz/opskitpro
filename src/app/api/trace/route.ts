import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/runtime-context";
import { checkRateLimit, createRateLimitHeaders, rateLimitResponse } from "@/lib/rate-limit";
import { parseTraceText } from "@/lib/cloudflare-trace";
import { requestTargetTrace } from "@/lib/trace-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const HOST = /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export async function GET(request: NextRequest) {
  const limit = checkRateLimit({ ip: getClientIp(request), route: "/api/trace", costClass: "MEDIUM", limit: 15 });
  if (!limit.success) return rateLimitResponse(limit);
  const headers = { ...createRateLimitHeaders(limit), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  const fail = (error: string, status: number) => NextResponse.json({ error }, { status, headers });
  const params = new URL(request.url).searchParams;
  const domain = params.get("domain") ?? "";
  if (!HOST.test(domain)) return fail("invalid_target", 400);
  const timeout = AbortSignal.timeout(5000);
  const signal = AbortSignal.any([timeout, request.signal]);
  try {
    const response = await requestTargetTrace(domain, signal);
    if (response.status >= 300 && response.status < 400) return fail("redirected", 422);
    if (response.status !== 200) return fail("unavailable", 422);
    const raw = parseTraceText(response.text);
    if (params.get("format") === "json") return NextResponse.json({
      raw, ip: raw.ip, colo: raw.colo, loc: raw.loc ?? "", warp: raw.warp ?? "unknown", gateway: raw.gateway ?? "unknown",
      http: raw.http ?? "", tls: raw.tls ?? "", sni: raw.sni ?? "", kex: raw.kex ?? "", postQuantum: /mlkem|kyber/i.test(raw.kex ?? ""),
    }, { headers });
    return new NextResponse(response.text, { headers: { ...headers, "Content-Type": "text/plain; charset=utf-8" } });
  } catch (error) {
    if (timeout.aborted) return fail("timeout", 504);
    if (request.signal.aborted) return fail("cancelled", 499);
    const code = error instanceof Error ? error.message : "";
    return fail(code === "blocked" ? "blocked" : code === "invalid_response" ? "invalid_response" : "unreachable", code === "blocked" ? 403 : 502);
  }
}
