import { getDomain } from "tldts";

export type RdapErrorCode =
  | "invalid_target"
  | "not_found"
  | "timeout"
  | "upstream_error"
  | "network_error"
  | "parse_error";

export type RdapLookupResult =
  | {
      ok: true;
      data: any;
      lookupTarget: string;
      source: "rdap";
      httpStatus: number;
    }
  | {
      ok: false;
      lookupTarget: string;
      source: "rdap";
      errorCode: RdapErrorCode;
      error: string;
      httpStatus?: number;
    };

export function getRdapLookupTarget(hostname: string, isIp: boolean) {
  const normalized = hostname.trim().replace(/^\[|\]$/g, "").replace(/\.$/, "").toLowerCase();
  if (!normalized) return null;
  if (isIp) return normalized;
  return getDomain(normalized, { allowPrivateDomains: false }) || null;
}

export async function lookupRdap(
  hostname: string,
  isIp: boolean,
  options: {
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  } = {},
): Promise<RdapLookupResult> {
  const lookupTarget = getRdapLookupTarget(hostname, isIp);
  if (!lookupTarget) {
    return {
      ok: false,
      lookupTarget: hostname,
      source: "rdap",
      errorCode: "invalid_target",
      error: "No registrable domain could be derived from this hostname.",
    };
  }

  const rdapUrl = isIp
    ? `https://rdap.org/ip/${lookupTarget}`
    : `https://rdap.org/domain/${lookupTarget}`;

  try {
    const response = await (options.fetchImpl || fetch)(rdapUrl, {
      headers: {
        Accept: "application/rdap+json",
        "User-Agent": "OpsKitPro-Diagnostic/1.0",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? 3000),
    });

    if (!response.ok) {
      const notFound = response.status === 404;
      return {
        ok: false,
        lookupTarget,
        source: "rdap",
        errorCode: notFound ? "not_found" : "upstream_error",
        error: notFound
          ? "No RDAP registration record was found for this target."
          : `The RDAP service returned HTTP ${response.status}.`,
        httpStatus: response.status,
      };
    }

    try {
      return {
        ok: true,
        data: await response.json(),
        lookupTarget,
        source: "rdap",
        httpStatus: response.status,
      };
    } catch {
      return {
        ok: false,
        lookupTarget,
        source: "rdap",
        errorCode: "parse_error",
        error: "The RDAP service returned an unreadable response.",
        httpStatus: response.status,
      };
    }
  } catch (error) {
    const errorName =
      typeof error === "object" && error !== null && "name" in error
        ? String(error.name)
        : "";
    const timedOut = errorName === "TimeoutError" || errorName === "AbortError";
    return {
      ok: false,
      lookupTarget,
      source: "rdap",
      errorCode: timedOut ? "timeout" : "network_error",
      error: timedOut
        ? "The RDAP lookup timed out."
        : "The RDAP service could not be reached.",
    };
  }
}
