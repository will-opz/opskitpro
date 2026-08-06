import { NextRequest, NextResponse } from "next/server";

const ALLOWED_EVENTS = new Set([
  "error_page_to_website_check",
  "website_check_to_trace",
  "website_check_to_dns_audit",
  "dns_audit_export",
  "core_tool_impression",
  "core_tool_open",
  "core_tool_run",
  "core_tool_success",
  "core_tool_error",
]);
const ALLOWED_TOOLS = new Set([
  "website-check",
  "network-doctor",
  "dns-security",
]);
const ALLOWED_PLACEMENTS = new Set(["home", "catalog", "referral"]);
const ALLOWED_SOURCES = new Set([
  "chatgpt",
  "perplexity",
  "claude",
  "gemini",
  "copilot",
]);
const FORBIDDEN_ATTRIBUTION_KEYS = new Set([
  "referer",
  "referrer",
  "query",
  "search",
  "search_query",
  "utm_source",
  "url",
]);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, page, target, tool, placement, source } = body;

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json(
        { ok: false },
        {
          status: 400,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }
    const isCoreFunnelEvent = String(event).startsWith("core_tool_");
    const hasForbiddenAttribution = Object.keys(body).some((key) =>
      FORBIDDEN_ATTRIBUTION_KEYS.has(key),
    );
    if (
      isCoreFunnelEvent &&
      (!ALLOWED_TOOLS.has(tool) ||
        (placement !== undefined && !ALLOWED_PLACEMENTS.has(placement)) ||
        (source !== undefined && !ALLOWED_SOURCES.has(source)) ||
        hasForbiddenAttribution)
    ) {
      return NextResponse.json(
        { ok: false },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const today = new Date().toISOString().split("T")[0];

    // Log as the Source of Truth for Cloudflare Logpush
    console.log(
      JSON.stringify({
        type: "analytics_event",
        event,
        page: page ? String(page).split("?")[0] : undefined, // only path, no query
        target:
          !isCoreFunnelEvent && target ? String(target).slice(0, 120) : undefined,
        tool: isCoreFunnelEvent ? tool : undefined,
        placement: isCoreFunnelEvent ? placement : undefined,
        source: isCoreFunnelEvent ? source : undefined,
        date: today,
        ts: Date.now(),
      }),
    );

    // Log is the source of truth.
    // KV counter intentionally disabled to avoid build/runtime coupling.

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false },
      {
        status: 400,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
