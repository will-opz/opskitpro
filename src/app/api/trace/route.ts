import { NextRequest, NextResponse } from "next/server";
import { getClientIp } from "@/lib/runtime-context";
import { checkRateLimit, createRateLimitHeaders, rateLimitResponse } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Disallow SSRF attacks
const BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./, // link-local, AWS metadata
  /^https?:\/\/::1/,
];

// Allow only valid hostnames (no paths, no queries, no ports)
// We'll enforce this by parsing the hostname and enforcing standard ports for HTTPS.
const VALID_HOSTNAME_REGEX =
  /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;

const parseTraceText = (text: string) => {
  const raw = Object.fromEntries(
    text
      .trim()
      .split("\n")
      .map((line) => line.split("="))
      .filter((parts) => parts.length === 2)
      .map(([key, value]) => [key.trim(), value.trim()]),
  ) as Record<string, string>;

  return {
    raw,
    ip: raw.ip || "",
    colo: raw.colo || "",
    loc: raw.loc || "",
    warp: raw.warp || "off",
    gateway: raw.gateway || "off",
    http: raw.http || "",
    tls: raw.tls || "",
    sni: raw.sni || "",
    kex: raw.kex || "",
    postQuantum: /mlkem|kyber/i.test(raw.kex || ""),
  };
};

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);

  const rateLimit = checkRateLimit({
    ip,
    route: "/api/trace",
    costClass: "MEDIUM",
    limit: 15,
  });

  if (!rateLimit.success) {
    return rateLimitResponse(rateLimit);
  }

  const rateLimitHeaders = createRateLimitHeaders(rateLimit);

  const { searchParams } = new URL(request.url);
  const domain = searchParams.get("domain");
  const wantsJson = searchParams.get("format") === "json";

  if (!domain) {
    return NextResponse.json(
      { error: "Missing domain parameter" },
      { status: 400, headers: rateLimitHeaders },
    );
  }

  // Basic validation: Must be a pure domain/hostname
  if (!VALID_HOSTNAME_REGEX.test(domain)) {
    return NextResponse.json(
      { error: "Invalid domain: blocked pattern" },
      { status: 400, headers: rateLimitHeaders },
    );
  }

  // Construct strict HTTPS URL to /cdn-cgi/trace
  const targetUrl = `https://${domain}/cdn-cgi/trace`;

  // SSRF checks
  if (BLOCKED_PATTERNS.some((p) => p.test(targetUrl))) {
    return NextResponse.json(
      { error: "Target URL not allowed" },
      { status: 403, headers: rateLimitHeaders },
    );
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        Accept: "text/plain, */*",
        "User-Agent": "OpsKitPro-Trace-Client/1.0",
      },
      signal: AbortSignal.timeout(5000), // 5s timeout
      redirect: "manual", // Prevent SSRF via 302 redirects
    });

    if (response.status >= 300 && response.status < 400) {
      return NextResponse.json(
        {
          error:
            "Target redirected; Cloudflare Trace not available on this path",
        },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const text = await response.text();
    const parsed = parseTraceText(text);
    const isCloudflare =
      response.headers.get("server")?.toLowerCase().includes("cloudflare") ||
      false;

    // Heuristics to confirm it's actually CF trace
    const isValidTrace =
      text.includes("ip=") && text.includes("colo=") && text.includes("ts=");

    if (!response.ok || (!isValidTrace && !isCloudflare)) {
      return NextResponse.json(
        {
          error: `Could not verify Cloudflare Trace on ${domain}`,
          status: response.status,
          text: text.slice(0, 500), // just a snippet if it's not a trace
        },
        { status: 404, headers: rateLimitHeaders },
      );
    }

    if (wantsJson) {
      return NextResponse.json(parsed, {
        headers: {
          ...rateLimitHeaders,
          "Cache-Control": "no-store",
          "X-Target-Server": response.headers.get("server") || "unknown",
        },
      });
    }

    return new NextResponse(text, {
      status: 200,
      headers: {
        ...rateLimitHeaders,
        "Content-Type": "text/plain",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "X-Target-Server": response.headers.get("server") || "unknown",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Trace request failed";
    return NextResponse.json({ error: msg }, { status: 500, headers: rateLimitHeaders });
  }
}
