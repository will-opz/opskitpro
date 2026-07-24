import ipaddr from "ipaddr.js";

const MAX_REQUEST_BYTES = 2048;
const MAX_REDIRECTS = 5;
const MAX_BODY_BYTES = 16 * 1024;
const PROBE_TIMEOUT_MS = 8000;
const DNS_TIMEOUT_MS = 2500;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.aws.internal",
  "instance-data",
]);

type ProbeClassification =
  | "reachable"
  | "redirected"
  | "probe_blocked"
  | "origin_error"
  | "network_error"
  | "unknown";

type Env = {
  EDGE_PROBE_TOKEN?: string;
};

type WorkerRequest = Request & {
  cf?: {
    colo?: string;
  };
};

type DnsJsonResponse = {
  Status?: number;
  Answer?: Array<{ type?: number; data?: string }>;
};

type RedirectHop = {
  url: string;
  status: number;
  location?: string;
};

export type EdgeProbeSuccess = {
  ok: true;
  source: "cloudflare_edge";
  precision: "full";
  colo: string;
  status: ProbeClassification;
  httpStatus: number;
  latencyMs: number;
  finalUrl: string;
  redirectChain: RedirectHop[];
  challenge: boolean;
  pageTitle?: string;
  headers: {
    server?: string;
    contentType?: string;
    cfRay?: string;
  };
  checkedAt: string;
};

type ProbeErrorCode =
  | "AUTH_REQUIRED"
  | "INVALID_REQUEST"
  | "UNSAFE_TARGET"
  | "DNS_FAILED"
  | "PROBE_FAILED";

class ProbeError extends Error {
  constructor(
    readonly code: ProbeErrorCode,
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
  }
}

function jsonResponse(value: unknown, status = 200) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function digest(value: string) {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)),
  );
}

export async function tokensMatch(
  provided: string | null,
  expected: string | undefined,
) {
  if (!provided?.startsWith("Bearer ") || !expected) return false;
  const candidate = provided.slice("Bearer ".length);
  const [candidateHash, expectedHash] = await Promise.all([
    digest(candidate),
    digest(expected),
  ]);
  if (candidateHash.length !== expectedHash.length) return false;

  let difference = 0;
  for (let index = 0; index < candidateHash.length; index += 1) {
    difference |= candidateHash[index] ^ expectedHash[index];
  }
  return difference === 0;
}

function normalizeHostname(hostname: string) {
  return hostname.replace(/^\[|\]$/g, "").toLowerCase();
}

function isIpLiteral(hostname: string) {
  try {
    ipaddr.parse(normalizeHostname(hostname));
    return true;
  } catch {
    return false;
  }
}

export function isPublicAddress(value: string) {
  try {
    const address = ipaddr.process(value);
    return address.range() === "unicast";
  } catch {
    return false;
  }
}

export function validateTargetUrl(input: string) {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new ProbeError("INVALID_REQUEST", "Target URL is invalid.", 400);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new ProbeError(
      "UNSAFE_TARGET",
      "Only HTTP and HTTPS targets are allowed.",
      400,
    );
  }
  if (parsed.username || parsed.password) {
    throw new ProbeError(
      "UNSAFE_TARGET",
      "Target credentials are not allowed.",
      400,
    );
  }
  if (
    (parsed.protocol === "http:" && parsed.port && parsed.port !== "80") ||
    (parsed.protocol === "https:" && parsed.port && parsed.port !== "443")
  ) {
    throw new ProbeError(
      "UNSAFE_TARGET",
      "Only standard HTTP and HTTPS ports are allowed.",
      400,
    );
  }

  const hostname = normalizeHostname(parsed.hostname);
  if (
    !hostname ||
    BLOCKED_HOSTNAMES.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".local")
  ) {
    throw new ProbeError(
      "UNSAFE_TARGET",
      "Local and metadata targets are not allowed.",
      400,
    );
  }
  if (isIpLiteral(hostname)) {
    throw new ProbeError(
      "UNSAFE_TARGET",
      "Direct IP targets are not supported by the edge probe.",
      400,
    );
  }

  parsed.hash = "";
  return parsed;
}

async function fetchDnsJson(
  hostname: string,
  type: "A" | "AAAA",
  signal: AbortSignal = AbortSignal.timeout(DNS_TIMEOUT_MS),
) {
  const endpoint = new URL("https://cloudflare-dns.com/dns-query");
  endpoint.searchParams.set("name", hostname);
  endpoint.searchParams.set("type", type);
  const response = await fetch(endpoint, {
    headers: { Accept: "application/dns-json" },
    cache: "no-store",
    signal,
  });
  if (!response.ok) {
    throw new ProbeError(
      "DNS_FAILED",
      `DNS validation failed with HTTP ${response.status}.`,
      502,
    );
  }
  return (await response.json()) as DnsJsonResponse;
}

export async function assertPublicHostname(
  hostname: string,
  resolve = fetchDnsJson,
) {
  const [aResult, aaaaResult] = await Promise.all([
    resolve(hostname, "A"),
    resolve(hostname, "AAAA"),
  ]);
  const addresses = [aResult, aaaaResult].flatMap((result) =>
    (result.Answer || [])
      .filter((answer) => answer.type === 1 || answer.type === 28)
      .map((answer) => answer.data || "")
      .filter(Boolean),
  );

  if (addresses.length === 0) {
    throw new ProbeError(
      "DNS_FAILED",
      "Target did not resolve to a public A or AAAA address.",
      400,
    );
  }
  const unsafe = addresses.find((address) => !isPublicAddress(address));
  if (unsafe) {
    throw new ProbeError(
      "UNSAFE_TARGET",
      `Target resolves to a private or reserved address (${unsafe}).`,
      400,
    );
  }
}

async function readBoundedText(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return "";

  const decoder = new TextDecoder();
  let received = 0;
  let text = "";
  try {
    while (received < MAX_BODY_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = MAX_BODY_BYTES - received;
      const chunk = value.subarray(0, remaining);
      received += chunk.byteLength;
      text += decoder.decode(chunk, { stream: received < MAX_BODY_BYTES });
      if (chunk.byteLength < value.byteLength) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  return text;
}

function classify(status: number, redirected: boolean, challenge: boolean) {
  if (challenge || status === 401 || status === 403 || status === 429) {
    return "probe_blocked" as const;
  }
  if (status >= 200 && status < 400) {
    return redirected ? ("redirected" as const) : ("reachable" as const);
  }
  if (status >= 500) return "origin_error" as const;
  return "unknown" as const;
}

export async function runEdgeProbe(
  input: string,
  colo: string,
  requestFetch: typeof fetch = fetch,
): Promise<EdgeProbeSuccess> {
  const startedAt = Date.now();
  const probeSignal = AbortSignal.timeout(PROBE_TIMEOUT_MS);
  const redirectChain: RedirectHop[] = [];
  const seen = new Set<string>();
  let currentUrl = validateTargetUrl(input);
  let response: Response | undefined;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    const normalized = currentUrl.toString();
    if (seen.has(normalized)) {
      throw new ProbeError("PROBE_FAILED", "Redirect loop detected.", 502);
    }
    seen.add(normalized);
    await assertPublicHostname(currentUrl.hostname, (hostname, type) =>
      fetchDnsJson(hostname, type, probeSignal),
    );

    response = await requestFetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      headers: {
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
        "User-Agent": "OpsKitPro-Edge-Probe/1.0 (+https://opskitpro.com)",
      },
      signal: probeSignal,
    });

    const location = response.headers.get("location") || undefined;
    redirectChain.push({
      url: normalized,
      status: response.status,
      ...(location ? { location } : {}),
    });

    if (!REDIRECT_STATUSES.has(response.status) || !location) break;
    if (hop === MAX_REDIRECTS) {
      throw new ProbeError("PROBE_FAILED", "Too many redirects.", 502);
    }
    currentUrl = validateTargetUrl(new URL(location, currentUrl).toString());
  }

  if (!response) {
    throw new ProbeError("PROBE_FAILED", "Probe returned no response.", 502);
  }

  const contentType = response.headers.get("content-type") || "";
  let pageTitle: string | undefined;
  let challenge = response.headers.get("cf-mitigated") === "challenge";
  if (contentType.includes("text/html")) {
    const text = await readBoundedText(response);
    const titleMatch = text.match(/<title[^>]*>([^<]+)<\/title>/i);
    pageTitle = titleMatch?.[1]?.trim().replace(/\s+/g, " ");
    challenge =
      challenge ||
      /just a moment|checking your browser|cf-chl-|challenge-platform|attention required/i.test(
        text,
      );
  } else {
    await response.body?.cancel().catch(() => undefined);
  }

  const redirectCount = redirectChain.filter((hop) =>
    REDIRECT_STATUSES.has(hop.status),
  ).length;

  return {
    ok: true,
    source: "cloudflare_edge",
    precision: "full",
    colo: colo || "Unknown",
    status: classify(response.status, redirectCount > 0, challenge),
    httpStatus: response.status,
    latencyMs: Date.now() - startedAt,
    finalUrl: currentUrl.toString(),
    redirectChain,
    challenge,
    pageTitle,
    headers: {
      server: response.headers.get("server") || undefined,
      contentType: contentType || undefined,
      cfRay: response.headers.get("cf-ray") || undefined,
    },
    checkedAt: new Date().toISOString(),
  };
}

async function handleRequest(request: WorkerRequest, env: Env) {
  const authenticated = await tokensMatch(
    request.headers.get("authorization"),
    env.EDGE_PROBE_TOKEN,
  );
  if (!authenticated) {
    return jsonResponse(
      {
        ok: false,
        error: { code: "AUTH_REQUIRED", message: "Authentication required." },
      },
      401,
    );
  }
  if (request.method !== "POST") {
    return jsonResponse(
      {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "POST is required." },
      },
      405,
    );
  }

  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return jsonResponse(
      {
        ok: false,
        error: { code: "INVALID_REQUEST", message: "Request is too large." },
      },
      413,
    );
  }

  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      throw new ProbeError(
        "INVALID_REQUEST",
        "Request is too large.",
        413,
      );
    }
    let body: { url?: unknown };
    try {
      body = JSON.parse(rawBody) as { url?: unknown };
    } catch {
      throw new ProbeError(
        "INVALID_REQUEST",
        "Request body must be valid JSON.",
        400,
      );
    }
    if (typeof body.url !== "string") {
      throw new ProbeError(
        "INVALID_REQUEST",
        "A target URL is required.",
        400,
      );
    }

    const result = await runEdgeProbe(body.url, request.cf?.colo || "Unknown");
    return jsonResponse(result);
  } catch (error) {
    const known =
      error instanceof ProbeError
        ? error
        : new ProbeError(
            "PROBE_FAILED",
            error instanceof Error ? error.message : "Edge probe failed.",
            502,
          );
    return jsonResponse(
      {
        ok: false,
        source: "cloudflare_edge",
        colo: request.cf?.colo || "Unknown",
        error: { code: known.code, message: known.message },
        checkedAt: new Date().toISOString(),
      },
      known.statusCode,
    );
  }
}

const worker = {
  fetch: handleRequest,
};

export default worker;
