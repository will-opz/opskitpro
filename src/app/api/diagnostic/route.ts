import { NextRequest, NextResponse } from "next/server";
import tls from "tls";
import type {
  DiagnosticHealthResponse,
  DiagnosticPartialErrorResponse,
  DiagnosticPostSuccessResponse,
  DiagnosticSuccessResponse,
} from "@/lib/api-contracts";
import { getClientIp } from "@/lib/runtime-context";
import { checkRateLimit, createRateLimitHeaders, rateLimitResponse } from "@/lib/rate-limit";
import { normalizeDiagnosticTarget } from "@/lib/diagnostic-target";
import { requestEdgeProbe } from "@/lib/edge-probe";

// Removed runtime='edge' to avoid Cloudflare/Next.js edge runtime conflicts that caused 500 errors previously
export const dynamic = "force-dynamic";

const ipv4Segment = "(?:25[0-5]|2[0-4]\\d|1?\\d?\\d)";
const ipv4Regex = new RegExp(`^(?:${ipv4Segment}\\.){3}${ipv4Segment}$`);
const isIpAddress = (value: string) => {
  if (ipv4Regex.test(value)) return true;
  return (
    value.includes(":") &&
    value.split(":").length >= 3 &&
    /^[0-9a-fA-F:.]+$/.test(value)
  );
};

const isBlockedIpv4 = (value: string) => {
  if (!ipv4Regex.test(value)) return false;
  const parts = value.split(".").map(Number);
  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 192 && b === 0 && parts[2] === 2) ||
    (a === 198 && b === 51 && parts[2] === 100) ||
    (a === 203 && b === 0 && parts[2] === 113) ||
    value === "255.255.255.255"
  );
};

const isBlockedIpv6 = (value: string) => {
  if (!value.includes(":")) return false;
  const normalized = value.toLowerCase();

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fe80:") ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("ff") ||
    normalized.startsWith("2001:db8:") ||
    normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") ||
    normalized.startsWith("::ffff:192.168.") ||
    /^::ffff:172\.(1[6-9]|2\d|3[01])\./.test(normalized) ||
    normalized.startsWith("::ffff:169.254.")
  );
};

const isBlockedNetworkAddress = (value: string) =>
  isBlockedIpv4(value) || isBlockedIpv6(value);

const assertSafeHttpUrl = (url: string) => {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid diagnostic URL.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP and HTTPS targets are allowed.");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    isBlockedNetworkAddress(hostname)
  ) {
    throw new Error(
      "Private, loopback, link-local, and reserved targets are not allowed.",
    );
  }
};

const assertSafeResolvedAddresses = (addresses: string[]) => {
  const blocked = addresses.find(isBlockedNetworkAddress);
  if (blocked) {
    throw new Error(
      `Target resolves to a private or reserved address (${blocked}).`,
    );
  }
};

const assertSafeResolvedHostForUrl = async (url: string) => {
  assertSafeHttpUrl(url);
  const hostname = new URL(url).hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (isIpAddress(hostname)) {
    assertSafeResolvedAddresses([hostname]);
    return;
  }

  const [aData, aaaaData] = await Promise.all([
    fetchDnsJson(hostname, "A", 2500),
    fetchDnsJson(hostname, "AAAA", 2500),
  ]);
  const addresses = [
    ...extractDnsRecords(aData, 1),
    ...extractDnsRecords(aaaaData, 28),
  ];
  if (addresses.length === 0) {
    throw new Error("Target did not resolve to a public A or AAAA address.");
  }
  assertSafeResolvedAddresses(addresses);
};

const truncateHeaderValue = (value: string | null) => {
  if (!value) return undefined;
  return value.length > 180 ? `${value.slice(0, 177)}...` : value;
};

const dnsTypeCodes = {
  A: 1,
  NS: 2,
  CNAME: 5,
  SOA: 6,
  MX: 15,
  TXT: 16,
  AAAA: 28,
  CAA: 257,
} as const;

const extractDnsRecordsByType = (data: any, type: number): string[] =>
  (data?.Answer || [])
    .filter((answer: any) => answer?.type === type && answer?.data)
    .map((answer: any) => String(answer.data));

const extractDnsRecords = (data: any, type: 1 | 28) =>
  extractDnsRecordsByType(data, type);

const normalizeDnsRecordValue = (
  type: keyof typeof dnsTypeCodes,
  value: string,
) => {
  if (type === "CNAME" || type === "NS") return value.replace(/\.$/, "");
  return value;
};

const fetchDnsJson = async (
  domain: string,
  type: keyof typeof dnsTypeCodes,
  timeoutMs = 4000,
) =>
  fetch(`https://cloudflare-dns.com/dns-query?name=${domain}&type=${type}`, {
    headers: { accept: "application/dns-json" },
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
  })
    .then((response) => response.json())
    .catch(() => null);

const redirectStatuses = new Set([301, 302, 303, 307, 308]);

const traceRedirects = async (startUrl: string, maxHops = 6) => {
  const chain: Array<{ url: string; status: number; location?: string }> = [];
  const seen = new Set<string>();
  let currentUrl = startUrl;
  let warning: string | undefined;
  let terminalResponse: Response | undefined;

  for (let hop = 0; hop <= maxHops; hop += 1) {
    await assertSafeResolvedHostForUrl(currentUrl);

    if (seen.has(currentUrl)) {
      warning = "Redirect loop detected.";
      break;
    }
    seen.add(currentUrl);

    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: { "User-Agent": "OpsKitPro-Diagnostic/1.0" },
      signal: AbortSignal.timeout(5000),
    });
    terminalResponse = response;
    const location = response.headers.get("location") || undefined;
    chain.push({ url: currentUrl, status: response.status, location });

    if (!location || !redirectStatuses.has(response.status)) break;
    if (hop === maxHops) {
      warning = "Too many redirects.";
      break;
    }

    const nextUrl = new URL(location, currentUrl).toString();
    assertSafeHttpUrl(nextUrl);
    currentUrl = nextUrl;
  }

  return {
    chain,
    finalUrl: chain.length ? chain[chain.length - 1].url : startUrl,
    warning,
    terminalResponse,
  };
};

type RedirectTrace = Awaited<ReturnType<typeof traceRedirects>>;

const probeTls = async (hostname: string, port = 443, ip?: string) => {
  return new Promise<any>((resolve) => {
    const targetIp = ip || hostname;
    const connectOptions: tls.ConnectionOptions & { requestOCSP: boolean } = {
      host: targetIp,
      port,
      servername: hostname,
      rejectUnauthorized: false,
      requestOCSP: true,
      ALPNProtocols: ["h2", "http/1.1"],
      timeout: 5000,
    };
    const socket = tls.connect(connectOptions);
    
    let ocspStapled: boolean | "unknown" = "unknown";
    
    socket.on('OCSPResponse', (response: Buffer) => {
      ocspStapled = response && response.length > 0;
    });

    socket.on('secureConnect', () => {
      const cert = socket.getPeerCertificate(true);
      const authorized = socket.authorized;
      const authorizationError = socket.authorizationError;
      const protocol = socket.getProtocol();
      const cipher = socket.getCipher().name;
      const alpn = socket.alpnProtocol;
      
      resolve({
        success: true,
        authorized,
        authorizationError,
        protocol,
        cipher,
        alpn,
        cert,
        ocspStapled,
      });
      socket.end();
    });

    socket.on('error', (err: Error) => {
      resolve({ success: false, error: err.message });
    });
    
    socket.on('timeout', () => {
      resolve({ success: false, error: 'timeout' });
      socket.destroy();
    });
  });
};

const probeLegacyTls = async (hostname: string, port = 443, ip?: string) => {
  return new Promise<string | false>((resolve) => {
    const targetIp = ip || hostname;
    const socket = tls.connect({
      host: targetIp,
      port,
      servername: hostname,
      rejectUnauthorized: false,
      maxVersion: 'TLSv1.1',
      timeout: 1800,
    });

    socket.on('secureConnect', () => {
      const protocol = socket.getProtocol();
      resolve(protocol || "Unknown Protocol"); // Handshake succeeded with legacy TLS
      socket.end();
    });

    socket.on('error', (err: any) => {
      // Explicitly classify network errors as unknown
      if (err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        resolve("unknown");
        return;
      }
      
      const msg = err.message || "";
      // If error is protocol version related, the server explicitly rejected the legacy TLS handshake (Secure)
      if (
        msg.includes('protocol version') || 
        msg.includes('wrong version number') || 
        msg.includes('handshake failure') ||
        msg.includes('no protocols available') ||
        err.code === 'ERR_SSL_NO_PROTOCOLS_AVAILABLE' ||
        err.code === 'ERR_SSL_VERSION_TOO_LOW'
      ) {
        resolve(false);
      } else {
        resolve("unknown"); // Generic socket errors are unknown
      }
    });

    socket.on('timeout', () => {
      resolve("unknown");
      socket.destroy();
    });
  });
};

const buildSecurityHeadersSummary = (headers: Headers) => {
  const hsts = headers.get("strict-transport-security");
  const csp = headers.get("content-security-policy");
  const xFrameOptions = headers.get("x-frame-options");
  const xContentTypeOptions = headers.get("x-content-type-options");
  const referrerPolicy = headers.get("referrer-policy");
  const permissionsPolicy = headers.get("permissions-policy");

  const checks = [
    {
      key: "strict-transport-security",
      label: "HSTS",
      present: Boolean(hsts),
      value: truncateHeaderValue(hsts),
      severity: "critical" as const,
      recommendation:
        "Enable Strict-Transport-Security after confirming HTTPS is stable.",
    },
    {
      key: "content-security-policy",
      label: "Content-Security-Policy",
      present: Boolean(csp),
      value: truncateHeaderValue(csp),
      severity: "critical" as const,
      recommendation:
        "Add a Content-Security-Policy to reduce XSS and content injection risk.",
    },
    {
      key: "x-frame-options",
      label: "X-Frame-Options",
      present: Boolean(xFrameOptions),
      value: truncateHeaderValue(xFrameOptions),
      severity: "warning" as const,
      recommendation:
        "Set DENY or SAMEORIGIN unless the site must be embedded.",
    },
    {
      key: "x-content-type-options",
      label: "X-Content-Type-Options",
      present: xContentTypeOptions?.toLowerCase() === "nosniff",
      value: truncateHeaderValue(xContentTypeOptions),
      severity: "warning" as const,
      recommendation: "Set X-Content-Type-Options: nosniff.",
    },
    {
      key: "referrer-policy",
      label: "Referrer-Policy",
      present: Boolean(referrerPolicy),
      value: truncateHeaderValue(referrerPolicy),
      severity: "info" as const,
      recommendation:
        "Set a Referrer-Policy such as strict-origin-when-cross-origin.",
    },
    {
      key: "permissions-policy",
      label: "Permissions-Policy",
      present: Boolean(permissionsPolicy),
      value: truncateHeaderValue(permissionsPolicy),
      severity: "info" as const,
      recommendation: "Limit browser features with Permissions-Policy.",
    },
  ];

  const weights = { critical: 22, warning: 16, info: 12 };
  const penalty = checks.reduce(
    (sum, check) => sum + (check.present ? 0 : weights[check.severity]),
    0,
  );
  const score = Math.max(0, Math.min(100, 100 - penalty));
  const grade =
    score >= 90
      ? "A"
      : score >= 75
        ? "B"
        : score >= 55
          ? "C"
          : score >= 35
            ? "D"
            : "F";

  return {
    score,
    grade,
    passed: checks.filter((check) => check.present).length,
    total: checks.length,
    checks,
  };
};

export async function GET(request: NextRequest | Request) {
  const requestStartedAt = Date.now();
  const requestUrl = (request as Request | undefined)?.url;

  if (!requestUrl) {
    const health: DiagnosticHealthResponse = {
      status: "ready",
      service: "diagnostic",
      timestamp: new Date().toISOString(),
    };
    return NextResponse.json(health);
  }

  const ip = getClientIp(request as NextRequest);
  const rateLimit = checkRateLimit({
    ip,
    route: "/api/diagnostic",
    costClass: "HIGH",
    limit: 3,
  });

  if (!rateLimit.success) {
    // Log abuse patterns (IP hash, route, status) specifically for denied requests
    console.warn(`[RATE_LIMIT] denied ${rateLimit.ipHash} on /api/diagnostic (HIGH). Retry in ${rateLimit.retryAfterSeconds}s.`);
    return rateLimitResponse(rateLimit);
  }

  const rateLimitHeaders = createRateLimitHeaders(rateLimit);

  const { searchParams } = new URL(requestUrl);
  const query = normalizeDiagnosticTarget(
    searchParams.get("domain") || searchParams.get("target") || "",
  );
  const cfRay = request.headers.get("cf-ray") || "";
  const edgeColo = cfRay.includes("-")
    ? cfRay.split("-").pop()?.toUpperCase() || "Unknown"
    : "Unknown";
  const buildMeta = (
    cacheStatus: "HIT" | "MISS" | "BYPASS" = "BYPASS",
    timings: { coreMs?: number; enrichmentMs?: number } = {},
  ) => ({
    checkedAt: new Date().toISOString(),
    servedAt: new Date().toISOString(),
    totalMs: Date.now() - requestStartedAt,
    ...timings,
    edgeColo,
    cacheStatus,
  });

  const isVisitor = !query;
  let domain = query.replace(/^https?:\/\//, "").split("/")[0];

  // If no query, default to visitor's own IP
  if (!query) {
    domain = getClientIp(request as NextRequest);
  }

  if (!domain) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  try {
    const isActuallyIp = isIpAddress(domain);
    const privateIpRegex =
      /^(?:10\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|127\.)/;
    const isPrivateIp = isActuallyIp && privateIpRegex.test(domain);

    // DNS Lookup Logic
    const dnsResolvers = [
      {
        name: "Cloudflare",
        url: `https://cloudflare-dns.com/dns-query?name=${domain}&type=A`,
        headers: { accept: "application/dns-json" },
      },
      {
        name: "Google",
        url: `https://dns.google/resolve?name=${domain}&type=A`,
        headers: {} as Record<string, string>,
      },
      {
        name: "AliDNS",
        url: `https://dns.alidns.com/resolve?name=${domain}&type=A`,
        headers: {} as Record<string, string>,
      },
    ];

    const dnsPromise: Promise<[any, number]> = isActuallyIp
      ? Promise.resolve([
          [
            {
              resolver: "Direct",
              data: { Status: 0, Answer: [{ type: 1, data: domain }] },
            },
          ],
          0,
        ])
      : (() => {
          const t0 = Date.now();
          return Promise.all(
            dnsResolvers.map(async (r) => {
              const resolverStartedAt = Date.now();
              const [aData, aaaaData] = await Promise.all([
                fetch(r.url, {
                  headers: r.headers,
                  cache: "no-store",
                  signal: AbortSignal.timeout(3000),
                })
                  .then((res) => res.json())
                  .catch(() => null),
                fetch(r.url.replace("type=A", "type=AAAA"), {
                  headers: r.headers,
                  cache: "no-store",
                  signal: AbortSignal.timeout(3000),
                })
                  .then((res) => res.json())
                  .catch(() => null),
              ]);
              const ipv4 = extractDnsRecords(aData, 1);
              const ipv6 = extractDnsRecords(aaaaData, 28);
              return {
                resolver: r.name,
                data: aData,
                latencyMs: Date.now() - resolverStartedAt,
                status: aData || aaaaData ? "OK" : "FAILED",
                records: { A: ipv4, AAAA: ipv6 },
              };
            }),
          ).then((results) => {
            const successfulLatencies = results
              .filter((result) => result.status === "OK")
              .map((result) => result.latencyMs);
            const fastestLatency =
              successfulLatencies.length > 0
                ? Math.min(...successfulLatencies)
                : Date.now() - t0;
            return [results, fastestLatency] as [any, number];
          });
        })();

    // 1b. DNS record overview from a stable edge resolver.
    const dnsRecordTypes = [
      "A",
      "AAAA",
      "CNAME",
      "MX",
      "TXT",
      "CAA",
      "SOA",
      "NS",
    ] as const;
    const recordsPromise = isActuallyIp
      ? Promise.resolve(null)
      : Promise.all(
          dnsRecordTypes.map(async (type) => {
            const data = await fetchDnsJson(domain, type);
            const records = extractDnsRecordsByType(
              data,
              dnsTypeCodes[type],
            ).map((value) => normalizeDnsRecordValue(type, value));
            return [type, Array.from(new Set(records))] as const;
          }),
        ).then(
          (entries) =>
            Object.fromEntries(entries) as Record<
              (typeof dnsRecordTypes)[number],
              string[]
            >,
        );

    const [[dnsResults, dnsLatency], dnsRecordsData] = await Promise.all([
      dnsPromise,
      recordsPromise,
    ]);
    const dnsMatch = dnsResults.find((r: any) => r.data?.Answer);
    const ipv4: string[] =
      isActuallyIp && !domain.includes(":")
        ? [domain]
        : Array.from(
            new Set<string>(
              dnsResults.flatMap((result: any) => result.records?.A || []),
            ),
          );
    const ipv6: string[] =
      isActuallyIp && domain.includes(":")
        ? [domain]
        : Array.from(
            new Set<string>(
              dnsResults.flatMap((result: any) => result.records?.AAAA || []),
            ),
          );
    const allIps: string[] = isActuallyIp ? [domain] : [...ipv4, ...ipv6];
    if (!isActuallyIp && allIps.length === 0) {
      throw new Error("Target did not resolve to a public A or AAAA address.");
    }
    assertSafeResolvedAddresses(allIps);

    // HTTP, SSL, and WHOIS Promises
    const ipHost =
      isActuallyIp && domain.includes(":") ? `[${domain}]` : domain;
    const targetUrl = query.startsWith("http")
      ? query
      : isActuallyIp
        ? `http://${ipHost}`
        : `https://${domain}`;
    assertSafeHttpUrl(targetUrl);
    const isHttps = targetUrl.startsWith("https");

    const httpPromise: Promise<
      [
        Response | { error: true; message: string },
        number,
        RedirectTrace | undefined,
        string?,
        boolean?,
      ]
    > = (() => {
      const t0 = Date.now();
      return traceRedirects(targetUrl)
        .then(async (redirectTrace) => {
          const res = redirectTrace.terminalResponse;
          if (!res) {
            throw new Error("HTTP probe completed without a response.");
          }

          let title: string | undefined;
          let challenge = res.headers.get("cf-mitigated") === "challenge";
          try {
            const clone = res.clone();
            const contentType = clone.headers.get("content-type") || "";
            if (contentType.includes("text/html")) {
              const text = await clone
                .text()
                .then((value) => value.slice(0, 8192))
                .catch(() => "");
              const match = text.match(/<title[^>]*>([^<]+)<\/title>/i);
              if (match?.[1]) {
                title = match[1].trim().replace(/\s+/g, " ");
              }
              challenge =
                challenge ||
                /just a moment|checking your browser|cf-chl-|challenge-platform|attention required/i.test(
                  text,
                );
            }
          } catch {}

          return [res, redirectTrace, title, challenge] as const;
        })
        .then(
          ([res, redirectTrace, title, challenge]) =>
            [res, Date.now() - t0, redirectTrace, title, challenge] as [
              Response,
              number,
              RedirectTrace,
              string?,
              boolean?,
            ],
        )
        .catch(
          (e: Error) =>
            [
              { error: true as const, message: e.message },
              Date.now() - t0,
              undefined,
              undefined,
              false,
            ] as [
              { error: true; message: string },
              number,
              undefined,
              undefined,
              boolean,
            ],
        );
    })();
    const edgeProbePromise = requestEdgeProbe(targetUrl);

    const targetPort = 443; // Assume 443 for now
    const sslPromise =
      isActuallyIp || !isHttps
        ? Promise.resolve(null)
        : probeTls(domain, targetPort, ipHost);

    const legacyTlsPromise = 
      isActuallyIp || !isHttps
        ? Promise.resolve("unknown" as const)
        : probeLegacyTls(domain, targetPort, ipHost);

    const whoisPromise = (() => {
      const rdapUrl = isActuallyIp
        ? `https://rdap.org/ip/${domain}`
        : `https://rdap.org/domain/${domain}`;
      return fetch(rdapUrl, {
        headers: {
          Accept: "application/rdap+json",
          "User-Agent": "OpsKitPro-Diagnostic/1.0",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
    })();

    const [
      [httpResRaw, httpLatency, redirectTrace, pageTitle, challenge],
      edgeObservation,
    ] = await Promise.all([httpPromise, edgeProbePromise]);
    const coreMs = Date.now() - requestStartedAt;
    const [tlsData, legacyTlsData, rdapData] = await Promise.all([sslPromise, legacyTlsPromise, whoisPromise]);

    const httpRes = httpResRaw as Response | { error: true; message: string };
    const whoisInfo: any = {
      registered: "Unknown",
      registrar: "Unknown",
      status: "Unknown",
      success: false,
      expires: "Unknown",
    };

    if (rdapData) {
      whoisInfo.success = true;

      // Parse Organization/Registrar
      const entity =
        rdapData.entities?.find(
          (e: any) =>
            e.roles?.includes("registrar") || e.roles?.includes("registrant"),
        ) || rdapData.entities?.[0];
      if (entity?.vcardArray?.[1]) {
        whoisInfo.registrar =
          entity.vcardArray[1].find((v: any) => v[0] === "fn")?.[3] ||
          "Unknown";
      }

      // Parse Events (Registration/Expiration)
      whoisInfo.registered =
        rdapData.events
          ?.find((e: any) => e.eventAction === "registration")
          ?.eventDate?.split("T")[0] || "Unknown";
      whoisInfo.expires =
        rdapData.events
          ?.find((e: any) => e.eventAction === "expiration")
          ?.eventDate?.split("T")[0] || "Unknown";

      whoisInfo.status = isActuallyIp
        ? `Network: ${rdapData.name || "OK"}`
        : rdapData.status?.join(", ") || "OK";
    }

    // We no longer bail out on HTTP error, so we can display TLS and DNS findings even if HTTP fails (e.g. due to bad SSL or timeout).
    const nsRecords: string[] = dnsRecordsData?.NS || [];
    const dnsRecords = {
      A: dnsRecordsData?.A?.length ? dnsRecordsData.A : ipv4,
      AAAA: dnsRecordsData?.AAAA?.length ? dnsRecordsData.AAAA : ipv6,
      CNAME: dnsRecordsData?.CNAME || [],
      MX: dnsRecordsData?.MX || [],
      TXT: dnsRecordsData?.TXT || [],
      CAA: dnsRecordsData?.CAA || [],
      SOA: dnsRecordsData?.SOA || [],
    };
    const ip = isActuallyIp
      ? domain
      : allIps[0] || dnsMatch?.data?.Answer?.[0]?.data || domain;
      
    const hasHttpError = "error" in httpRes;
    const redirectCount =
      redirectTrace?.chain.filter((hop) => redirectStatuses.has(hop.status))
        .length || 0;
    const httpStatus = hasHttpError ? 0 : httpRes.status;
    const httpClassification = hasHttpError
      ? "network_error"
      : challenge ||
          httpStatus === 401 ||
          httpStatus === 403 ||
          httpStatus === 429
        ? "probe_blocked"
        : httpRes.ok
          ? redirectCount > 0
            ? "redirected"
            : "reachable"
          : httpStatus >= 500
            ? "origin_error"
            : "unknown";
    const serverHeader = hasHttpError ? "Unknown" : httpRes.headers.get("server") || "Unknown";
    const hstsEnabled = hasHttpError ? false : Boolean(
      httpRes.headers.get("strict-transport-security"),
    );
    const securityHeaders = hasHttpError ? buildSecurityHeadersSummary(new Headers()) : buildSecurityHeadersSummary(httpRes.headers);

    // Enhanced CDN Logic
    let provider = "Origin";
    let isCdn = false;
    if (!isPrivateIp) {
      const serverValue = serverHeader.toLowerCase();
      if (!hasHttpError && (httpRes.headers.get("cf-ray") || serverValue.includes("cloudflare"))) {
        provider = "Cloudflare";
        isCdn = true;
      } else if (serverValue.includes("akamai")) {
        provider = "Akamai";
        isCdn = true;
      }
    } else {
      provider = "Internal Gateway";
    }

    // IP Geolocation
    let geo = {
      country: "Unknown",
      isp: "Unknown",
      city: "Unknown",
      asn: "Unknown",
    };
    if (isPrivateIp) {
      geo = {
        country: "Local Network",
        isp: "Private Intranet",
        city: "Intranet",
        asn: "N/A",
      };
    } else {
      try {
        const geoRes = await fetch(`https://ipapi.co/${ip}/json/`, {
          cache: "no-store",
          signal: AbortSignal.timeout(1800),
        }).then((r) => r.json());
        geo = {
          country: geoRes.country_name || "Unknown",
          city: geoRes.city || "Unknown",
          isp: geoRes.org || "Unknown",
          asn: geoRes.asn || "Unknown",
        };
      } catch {}
    }

    let certValid = false;
    let dateValid = false;
    let hostnameValid = false;
    let chainAuthorized = false;
    let ocspStapled: boolean | "unknown" = "unknown";
    
    let sslExpiry = "Unknown";
    let sslIssuer = "Unknown";
    let subjectAltName = undefined;
    let protocol = undefined;
    let cipher = undefined;
    let alpn = undefined;
    let errorReason = undefined;
    let authorized = false;

    if (tlsData && tlsData.success) {
      const { cert } = tlsData;
      sslExpiry = cert?.valid_to ? new Date(cert.valid_to).toISOString().split('T')[0] : "Unknown";
      sslIssuer = cert?.issuer?.O || cert?.issuer?.CN || "Unknown";
      subjectAltName = cert?.subjectaltname;
      protocol = tlsData.protocol;
      cipher = tlsData.cipher;
      alpn = tlsData.alpn;
      authorized = tlsData.authorized;

      ocspStapled = tlsData.ocspStapled;

      // Check dates
      const now = Date.now();
      const validFrom = cert?.valid_from ? new Date(cert.valid_from).getTime() : 0;
      const validTo = cert?.valid_to ? new Date(cert.valid_to).getTime() : 0;
      if (validFrom && validTo && now >= validFrom && now <= validTo) {
        dateValid = true;
      }

      // Check hostname
      if (cert) {
        try {
          const identityError = tls.checkServerIdentity(domain, cert);
          hostnameValid = !identityError;
        } catch {
          hostnameValid = false;
        }
      }

      // Check chain authorization
      chainAuthorized = authorized;

      // Calculate aggregated valid flag
      if (authorized && hostnameValid && dateValid) {
        certValid = true;
      } else {
        errorReason = tlsData.authorizationError;
        
        if (!dateValid) {
           if (validTo && now > validTo) {
              errorReason = "CERT_EXPIRED";
           } else if (validFrom && now < validFrom) {
              errorReason = "CERT_NOT_YET_VALID";
           }
        } else if (!hostnameValid) {
           errorReason = "HOSTNAME_MISMATCH";
        } else if (!chainAuthorized) {
           errorReason = errorReason || "UNTRUSTED_ISSUER";
        }
      }
    } else if (tlsData && !tlsData.success) {
      errorReason = tlsData.error;
    }

    const expiryDate = sslExpiry !== "Unknown" ? new Date(sslExpiry) : null;
    const daysToExpiry = expiryDate
      ? Math.ceil((expiryDate.getTime() - Date.now()) / 86_400_000)
      : null;
    
    // Fallback valid flag if not fully rejected
    if (isHttps && certValid === false && !errorReason && daysToExpiry !== null && daysToExpiry >= 0) {
       certValid = true; 
    }

    const sslFactors = [
      isHttps ? "HTTPS_ENABLED" : null,
      certValid ? "CERT_VALID" : null,
      hstsEnabled ? "HSTS_ENABLED" : null,
      isCdn ? "CDN_PRESENT" : null,
    ].filter(Boolean) as string[];
    
    const sslGrade =
      !isHttps || !certValid
        ? "F"
        : daysToExpiry !== null && daysToExpiry <= 15
          ? "C"
          : hstsEnabled
            ? "A+"
            : "B";

    const certChain = [
      { level: "Leaf", name: domain, status: certValid ? "Active" : "Invalid" },
      ...(sslIssuer !== "Unknown"
        ? [{ level: "Issuer", name: sslIssuer, status: "Trusted" }]
        : []),
    ];

    const responseData: DiagnosticSuccessResponse = {
      domain,
      status: "success",
      isVisitor,
      isActuallyIp,
      isPrivate: isPrivateIp,
      dns: {
        resolved_ip: ip,
        all_ips: allIps,
        ipv4,
        ipv6,
        dual_stack: ipv4.length > 0 && ipv6.length > 0,
        ns: nsRecords,
        records: dnsRecords,
        latency: `${dnsLatency}ms`,
        success: allIps.length > 0,
        resolvers: dnsResults,
      },
      http: {
        success: !hasHttpError && httpRes.ok && !challenge,
        status_code: httpStatus,
        latency: `${httpLatency}ms`,
        is_https: isHttps,
        final_url: redirectTrace?.finalUrl || (hasHttpError ? targetUrl : httpRes.url) || targetUrl,
        redirect_chain: redirectTrace?.chain || [],
        redirect_count: redirectCount,
        redirect_warning: redirectTrace?.warning || (hasHttpError ? httpRes.message : undefined),
        cf_ray: hasHttpError ? undefined : httpRes.headers.get("cf-ray") || undefined,
        page_title: pageTitle,
        classification: httpClassification,
        challenge: Boolean(challenge),
        observation: {
          source: "opskitpro_probe",
          location: "AWS Lightsail",
          precision: "full",
        },
      },
      observations: {
        ...(edgeObservation ? { edge: edgeObservation } : {}),
        server: {
          source: "opskitpro_probe",
          status: httpClassification,
          precision: "full",
          location: "AWS Lightsail",
        },
      },
      securityHeaders,
      ssl: {
        valid: certValid,
        date_valid: dateValid,
        hostname_valid: hostnameValid,
        chain_authorized: chainAuthorized,
        ocsp_stapled: ocspStapled,
        issuer: sslIssuer,
        expiry: sslExpiry,
        subject_alt_name: subjectAltName,
        protocol,
        cipher,
        alpn,
        legacy_tls_accepted: legacyTlsData,
        authorized,
        error_reason: errorReason,
        grade: sslGrade,
        factors: sslFactors,
        tls_version: isHttps ? "TLS" : "HTTP",
        chain: certChain,
      },
      cdn: { is_provider: isCdn, provider, server: serverHeader },
      geo,
      whois: whoisInfo,
      meta: buildMeta("BYPASS", {
        coreMs,
        enrichmentMs: Math.max(0, Date.now() - requestStartedAt - coreMs),
      }),
    };

    return NextResponse.json(responseData, {
      headers: {
        "X-Cache": "BYPASS",
        "Cache-Control": "no-store",
        ...rateLimitHeaders,
      },
    });
  } catch (error: any) {
    const message = error?.message || "Diagnostic request failed";
    const blockedTarget =
      /private|loopback|link-local|reserved|not allowed|Invalid diagnostic URL|Only HTTP|public A or AAAA/.test(
        message,
      );
    return NextResponse.json(
      { status: "error", message },
      { status: blockedTarget ? 400 : 500, headers: rateLimitHeaders },
    );
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request as NextRequest);
  const rateLimit = checkRateLimit({
    ip,
    route: "/api/diagnostic",
    costClass: "HIGH",
    limit: 3,
  });

  if (!rateLimit.success) {
    console.warn(`[RATE_LIMIT] denied ${rateLimit.ipHash} on /api/diagnostic POST (HIGH). Retry in ${rateLimit.retryAfterSeconds}s.`);
    return rateLimitResponse(rateLimit);
  }

  const rateLimitHeaders = createRateLimitHeaders(rateLimit);

  try {
    const body = await request.json();
    const target =
      typeof body?.target === "string"
        ? normalizeDiagnosticTarget(body.target)
        : "";

    if (!target) {
      return NextResponse.json(
        { error: "target is required" },
        { status: 400, headers: rateLimitHeaders },
      );
    }

    const response: DiagnosticPostSuccessResponse = {
      success: true,
      data: {
        target,
        status: "online",
        timestamp: new Date().toISOString(),
      },
    };
    return NextResponse.json(response, { headers: rateLimitHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Invalid request body" },
      { status: 500, headers: rateLimitHeaders },
    );
  }
}
