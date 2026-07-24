import "server-only";

export type HttpProbeClassification =
  | "reachable"
  | "redirected"
  | "probe_blocked"
  | "origin_error"
  | "network_error"
  | "unknown";

export type EdgeProbeObservation = {
  source: "cloudflare_edge";
  status: HttpProbeClassification;
  precision: "full";
  colo: string;
  httpStatus?: number;
  latencyMs?: number;
  finalUrl?: string;
  redirectChain?: Array<{
    url: string;
    status: number;
    location?: string;
  }>;
  challenge?: boolean;
  pageTitle?: string;
  error?: string;
  checkedAt: string;
};

type EdgeProbeResponse = {
  ok?: boolean;
  source?: "cloudflare_edge";
  precision?: "full";
  colo?: string;
  status?: HttpProbeClassification;
  httpStatus?: number;
  latencyMs?: number;
  finalUrl?: string;
  redirectChain?: EdgeProbeObservation["redirectChain"];
  challenge?: boolean;
  pageTitle?: string;
  checkedAt?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

const EDGE_PROBE_TIMEOUT_MS = 9500;

function getEdgeProbeConfig() {
  const endpoint = process.env.EDGE_PROBE_URL?.trim();
  const token = process.env.EDGE_PROBE_TOKEN?.trim();
  if (!endpoint || !token) return null;

  const parsed = new URL(endpoint);
  if (parsed.protocol !== "https:") {
    throw new Error("EDGE_PROBE_URL must use HTTPS.");
  }
  return { endpoint: parsed.toString(), token };
}

export async function requestEdgeProbe(
  targetUrl: string,
): Promise<EdgeProbeObservation | undefined> {
  let config: ReturnType<typeof getEdgeProbeConfig>;
  try {
    config = getEdgeProbeConfig();
  } catch (error) {
    console.warn(
      `[EDGE_PROBE] invalid configuration: ${error instanceof Error ? error.message : "unknown error"}`,
    );
    return undefined;
  }
  if (!config) return undefined;

  const startedAt = Date.now();
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
        "User-Agent": "OpsKitPro-Orchestrator/1.0",
      },
      body: JSON.stringify({ url: targetUrl }),
      signal: AbortSignal.timeout(EDGE_PROBE_TIMEOUT_MS),
    });
    const data = (await response.json().catch(() => null)) as
      | EdgeProbeResponse
      | null;

    if (response.ok && data?.ok && data.status) {
      return {
        source: "cloudflare_edge",
        status: data.status,
        precision: "full",
        colo: data.colo || "Unknown",
        httpStatus: data.httpStatus,
        latencyMs: data.latencyMs,
        finalUrl: data.finalUrl,
        redirectChain: data.redirectChain,
        challenge: Boolean(data.challenge),
        pageTitle: data.pageTitle,
        checkedAt: data.checkedAt || new Date().toISOString(),
      };
    }

    return {
      source: "cloudflare_edge",
      status:
        response.status === 401 || response.status === 403
          ? "probe_blocked"
          : "network_error",
      precision: "full",
      colo: data?.colo || "Unknown",
      latencyMs: Date.now() - startedAt,
      error:
        data?.error?.message ||
        `Cloudflare Edge Probe returned HTTP ${response.status}.`,
      checkedAt: data?.checkedAt || new Date().toISOString(),
    };
  } catch (error) {
    return {
      source: "cloudflare_edge",
      status: "network_error",
      precision: "full",
      colo: "Unknown",
      latencyMs: Date.now() - startedAt,
      error:
        error instanceof Error ? error.message : "Cloudflare Edge Probe failed.",
      checkedAt: new Date().toISOString(),
    };
  }
}
