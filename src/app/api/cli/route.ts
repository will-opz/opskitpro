import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  black: '\x1b[30m',
}

function calculateScore(data: any): number {
  let score = 100
  if (!data.http.success) score -= 40
  if (data.http.status_code >= 400) score -= 20
  if (!data.ssl.valid) score -= 20
  let latencyStr = data.dns?.latency || '0ms'
  let dnsLatency = parseInt(String(latencyStr).replace('ms', ''), 10) || 0
  if (dnsLatency > 300) score -= 10
  if (!data.cdn.is_provider) score -= 5
  
  // NEW: Domain status penalty
  const status = data.whois?.status?.toLowerCase() || ''
  if (status.includes('hold')) score -= 50
  
  return Math.max(0, score)
}

export async function GET(request: NextRequest) {
  const domain = request.nextUrl.searchParams.get('d') || request.nextUrl.searchParams.get('domain')
  
  if (!domain) {
    const usage = `
${c.bold}${c.cyan}============================================
       OPSKITPRO CLI DIAGNOSTICS
============================================${c.reset}

${c.bold}USAGE:${c.reset}
  curl opskitpro.com/chk/<domain>
  curl opskitpro.com/d/<domain>

${c.bold}EXAMPLES:${c.reset}
  curl opskitpro.com/chk/google.com
  curl opskitpro.com/d/115n.top

${c.dim}Automated Global Edge & Network Forensics
API & Site powered by OpsKitPro.com${c.reset}
`
    return new NextResponse(usage, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }

  try {
    const origin = request.nextUrl.origin
    // Internal fetch to our diagnostic API
    const res = await fetch(`${origin}/api/diagnostic?domain=${encodeURIComponent(domain)}`, {
      // Pass a User-Agent to ensure the diagnostic API correctly processes the request
      headers: { 'User-Agent': request.headers.get('User-Agent') || 'OpsKitPro-CLI/1.0' }
    })
    
    const data = await res.json()

    if (!res.ok) {
        return new NextResponse(`\n${c.red}${c.bold}[!] DIAGNOSTIC FAULT:${c.reset} ${data.message || 'Unknown Error'}\n\n`, {
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        })
    }

    const score = calculateScore(data)
    const scoreColor = score >= 80 ? c.bgGreen + c.black : score >= 50 ? c.yellow : c.bgRed + c.black
    
    const currentHolds = data.whois?.status ? data.whois.status.split(',').filter((s:string) => s.toLowerCase().includes('hold')) : []
    const isCritical = !data.http.success || currentHolds.length > 0 || !data.ssl.valid

    const stateStr = isCritical ? `${c.red}CRITICAL${c.reset}` : (score >= 80 ? `${c.green}NOMINAL${c.reset}` : `${c.yellow}DEGRADED${c.reset}`)
    const domainStatusStr = currentHolds.length > 0 
        ? `${c.bgRed}${c.black} ${currentHolds.join(', ').toUpperCase()} ${c.reset}` 
        : (data.whois?.status ? data.whois.status.split(',')[0].toUpperCase() : 'UNKNOWN')

    let out = `\n`
    out += `${c.bold}${c.cyan}[+] OPSKITPRO FORENSIC REPORT FOR: ${domain.toUpperCase()}${c.reset}\n`
    out += `${c.dim}────────────────────────────────────────────────────────${c.reset}\n`
    out += `${c.bold}GLOBAL SYSTEM SCORE:${c.reset} ${scoreColor} ${score}/100 ${c.reset} | STATE: ${stateStr}\n`
    out += `${c.dim}────────────────────────────────────────────────────────${c.reset}\n\n`

    // WHOIS
    out += `${c.magenta}${c.bold}[ LAYER 00: WHOIS REGISTRY ]${c.reset}\n`
    if (!data.whois?.success) {
       out += `  EXCEPTION: ${c.red}${data.whois?.error || 'RDAP NOT FOUND'}${c.reset}\n`
    } else {
       out += `  Registrar: ${data.whois.registrar}\n`
       out += `  Dates    : ${data.whois.registered} -> ${data.whois.expires}\n`
       out += `  Status   : ${domainStatusStr}\n`
    }
    out += `\n`

    // DNS
    out += `${c.cyan}${c.bold}[ LAYER 01: DNS RESOLUTION ]${c.reset}\n`
    const ipStr = data.dns.all_ips && data.dns.all_ips.length > 1 
        ? `${data.dns.all_ips.length} ANYCAST IPs (${data.dns.all_ips[0]}...)` 
        : data.dns.resolved_ip
    out += `  Resolved IP: ${ipStr}\n`
    out += `  Latency    : ${data.dns.latency}\n`
    const nsCount = data.whois?.nameservers?.length || 0
    out += `  Nameservers: ${nsCount > 0 ? (nsCount > 1 ? nsCount + " NS Records (" + data.whois.nameservers[0] + ")" : data.whois.nameservers[0]) : 'Unknown'}\n`
    out += `\n`

    // HTTP
    out += `${c.yellow}${c.bold}[ LAYER 02: SERVER RESPONSE ]${c.reset}\n`
    const codeColor = data.http.status_code < 400 ? c.green : c.red
    out += `  Status Code: ${codeColor}${data.http.status_code || 'Err'}${c.reset}\n`
    out += `  Latency    : ${data.http.latency}\n`
    out += `  Protocol   : ${data.http.is_https ? 'HTTPS' : 'HTTP/TCP'}\n`
    out += `\n`

    // SSL
    out += `${c.green}${c.bold}[ LAYER 03: SSL SECURITY ]${c.reset}\n`
    out += `  Cert Valid: ${data.ssl.valid ? c.green + 'YES' + c.reset : c.red + 'NO / FAULT' + c.reset}\n`
    out += `  Issuer CA : ${data.ssl.issuer}\n`
    out += `  Expires   : ${data.ssl.expiry}\n`
    out += `\n`

    // EDGE CDN
    out += `${c.blue}${c.bold}[ LAYER 04: EDGE INFRASTRUCTURE ]${c.reset}\n`
    out += `  Provider  : ${data.cdn.provider}\n`
    out += `  Routing   : ${data.cdn.is_provider ? c.yellow + 'PROXIED' + c.reset : c.dim + 'ORIGIN DIRECT' + c.reset}\n`
    out += `  Server Hdr: ${data.cdn.server}\n`
    out += `\n`
    out += `${c.dim}────────────────────────────────────────────────────────${c.reset}\n`
    out += `${c.dim}> Full UI Report: https://opskitpro.com/tools/website-check?target=${domain}${c.reset}\n\n`

    return new NextResponse(out, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  } catch (error: any) {
    return new NextResponse(`\n${c.red}${c.bold}[!] INTERNAL ERROR:${c.reset} ${error.message}\n\n`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      status: 500
    })
  }
}
