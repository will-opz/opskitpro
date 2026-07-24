import { NextRequest, NextResponse } from "next/server";
import type { DiagnosticResponse } from "@/lib/diagnostic-types";
import { isDiagnosticResponse } from "@/lib/diagnostic-types";

const textHeaders = { "Content-Type": "text/plain; charset=utf-8" };
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m",
  cyan: "\x1b[36m", magenta: "\x1b[35m", blue: "\x1b[34m",
  bgRed: "\x1b[41m", bgGreen: "\x1b[42m", black: "\x1b[30m",
};

export function calculateCliScore(data: DiagnosticResponse): number {
  let score = 100;
  if (!data.http.success) score -= 40;
  if (data.http.status_code >= 400) score -= 20;
  if (!data.ssl.valid) score -= 20;
  if ((parseInt(String(data.dns.latency).replace("ms", ""), 10) || 0) > 300) score -= 10;
  if (!data.cdn.is_provider) score -= 5;
  if (data.whois?.status?.toLowerCase().includes("hold")) score -= 50;
  return Math.max(0, score);
}

export function renderCliUsage(): string {
  return `
${c.bold}${c.cyan}============================================
       OPSKITPRO CLI DIAGNOSTICS
============================================${c.reset}

${c.bold}USAGE:${c.reset}
  curl opskitpro.com/chk/<domain>
  curl opskitpro.com/d/<domain>
  curl 'opskitpro.com/api/cli?domain=<domain>'

${c.bold}EXAMPLE:${c.reset}
  curl opskitpro.com/chk/example.com

${c.dim}Automated Global Edge & Network Forensics
API & Site powered by OpsKitPro.com${c.reset}
`;
}

export function renderCliDiagnostic(domain: string, data: DiagnosticResponse): string {
  const score = calculateCliScore(data);
  const scoreColor = score >= 80 ? c.bgGreen + c.black : score >= 50 ? c.yellow : c.bgRed + c.black;
  const holds = (data.whois?.status || "").split(",").filter((s) => s.toLowerCase().includes("hold"));
  const critical = !data.http.success || holds.length > 0 || !data.ssl.valid;
  const state = critical ? `${c.red}CRITICAL${c.reset}` : score >= 80 ? `${c.green}NOMINAL${c.reset}` : `${c.yellow}DEGRADED${c.reset}`;
  const domainStatus = holds.length
    ? `${c.bgRed}${c.black} ${holds.join(", ").toUpperCase()} ${c.reset}`
    : data.whois?.status?.split(",")[0].toUpperCase() || "UNKNOWN";
  const ips = data.dns.all_ips || [];
  const ip = ips.length > 1 ? `${ips.length} ANYCAST IPs (${ips[0]}...)` : ips[0] || data.dns.resolved_ip;
  const nameservers = Array.from(new Set([...(data.dns.ns || []), ...(data.whois?.nameservers || [])]))
    .map((value) => value.toLowerCase().replace(/\.$/, ""));
  const resolvers = (data.dns.resolvers || []).map((resolver) =>
    `${resolver.name}: ${resolver.status === "OK" ? c.green + "●" : c.red + "○"}${c.reset}`,
  ).join("  ");

  return `
${c.bold}${c.cyan}[+] OPSKITPRO FORENSIC REPORT FOR: ${domain.toUpperCase()}${c.reset}
${c.dim}────────────────────────────────────────────────────────${c.reset}
${c.bold}GLOBAL SYSTEM SCORE:${c.reset} ${scoreColor} ${score}/100 ${c.reset} | STATE: ${state}
${c.dim}────────────────────────────────────────────────────────${c.reset}

${c.magenta}${c.bold}[ LAYER 00: WHOIS REGISTRY ]${c.reset}
${data.whois?.success
    ? `  Registrar: ${data.whois.registrar || "Unknown"}\n  Dates    : ${data.whois.registered || "Unknown"} -> ${data.whois.expires || "Unknown"}\n  Status   : ${domainStatus}`
    : `  EXCEPTION: ${c.red}${data.whois?.error || "RDAP NOT FOUND"}${c.reset}`}

${c.cyan}${c.bold}[ LAYER 01: DNS RESOLUTION ]${c.reset}
  Resolved IP: ${ip}
  Latency    : ${data.dns.latency}
${resolvers ? `  Resolvers  : ${resolvers}\n` : ""}  Nameservers: ${nameservers.join(", ") || "Unknown"}

${c.yellow}${c.bold}[ LAYER 02: SERVER RESPONSE ]${c.reset}
  Status Code: ${data.http.status_code < 400 ? c.green : c.red}${data.http.status_code || "Err"}${c.reset}
  Latency    : ${data.http.latency}
  Protocol   : ${data.http.is_https ? "HTTPS" : "HTTP/TCP"}

${c.green}${c.bold}[ LAYER 03: SSL SECURITY ]${c.reset}
  Cert Valid: ${data.ssl.valid ? c.green + "YES" + c.reset : c.red + "NO / FAULT" + c.reset}
  Issuer CA : ${data.ssl.issuer}
  Expires   : ${data.ssl.expiry}

${c.blue}${c.bold}[ LAYER 04: EDGE INFRASTRUCTURE ]${c.reset}
  Provider  : ${data.cdn.provider}
  Routing   : ${data.cdn.is_provider ? c.yellow + "PROXIED" + c.reset : c.dim + "ORIGIN DIRECT" + c.reset}
  Server Hdr: ${data.cdn.server}

${c.dim}────────────────────────────────────────────────────────${c.reset}
${c.dim}> Full UI Report: https://opskitpro.com/tools/website-check?target=${encodeURIComponent(domain)}${c.reset}
`;
}

export async function handleCliDiagnostic(request: NextRequest, domain?: string | null) {
  const target = domain || request.nextUrl.searchParams.get("d") || request.nextUrl.searchParams.get("domain");
  if (!target) return new NextResponse(renderCliUsage(), { headers: textHeaders });

  try {
    const response = await fetch(
      `${request.nextUrl.origin}/api/diagnostic?domain=${encodeURIComponent(target)}`,
      { headers: { "User-Agent": request.headers.get("User-Agent") || "OpsKitPro-CLI/1.0" }, cache: "no-store" },
    );
    const payload: unknown = await response.json();
    if (!response.ok || !isDiagnosticResponse(payload)) {
      const message = payload && typeof payload === "object" && "message" in payload
        ? String(payload.message) : "Unknown Error";
      return new NextResponse(`\n${c.red}${c.bold}[!] DIAGNOSTIC FAULT:${c.reset} ${message}\n\n`, {
        headers: textHeaders, status: response.ok ? 502 : response.status,
      });
    }
    return new NextResponse(renderCliDiagnostic(target, payload), { headers: textHeaders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown Error";
    return new NextResponse(`\n${c.red}${c.bold}[!] INTERNAL ERROR:${c.reset} ${message}\n\n`, {
      headers: textHeaders, status: 500,
    });
  }
}
