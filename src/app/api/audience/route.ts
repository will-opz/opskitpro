import { NextRequest, NextResponse } from "next/server";
import { validAudiencePayload } from "@/lib/audience-schema";
// A bounded single-process budget; no untrusted forwarded IP or persistent identity.
let windowStart = 0; let count = 0;
export async function POST(request: NextRequest) {
  const reply = (status: number) => NextResponse.json({ ok: status < 400 }, { status, headers: { "Cache-Control": "no-store" } });
  if (process.env.AUDIENCE_ENABLED !== "true") return reply(202);
  const allowed = (process.env.AUDIENCE_ORIGINS || "https://opskitpro.com").split(",");
  if (!allowed.includes(request.headers.get("origin") || "") || request.headers.get("sec-fetch-site") === "cross-site") return reply(403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return reply(415);
  if (Date.now() - windowStart > 60_000) { windowStart = Date.now(); count = 0; }
  if (++count > 600) return reply(429);
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400);
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 1024) { await reader.cancel(); return reply(413); }
      chunks.push(value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!validAudiencePayload(body)) return reply(400);
    const ua = request.headers.get("user-agent") || "";
    const bot = /bot|spider|crawl|headless|lightpanda|python|curl|wget|httpclient|go-http|selenium|playwright|puppeteer|monitor|uptime|preview/i.test(ua);
    const classification = bot ? "known_automation" : body.automation ? "suspected_automation" : /Mozilla\/5\.0.*(?:Chrome\/|Firefox\/|Safari\/|Edg\/)/.test(ua) ? "candidate_browser" : "unknown";
    const { automation: _automation, ...metadata } = body;
    console.log(JSON.stringify({ type: "audience_event", ...metadata, ts: Date.now(), classification, reason: bot ? "ua" : _automation ? "webdriver" : classification === "unknown" ? "unknown_ua" : "" }));
    return reply(202);
  } catch { return reply(400); }
}
