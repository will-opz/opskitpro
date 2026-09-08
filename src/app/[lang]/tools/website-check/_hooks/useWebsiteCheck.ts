import { clearDiagnosticReturn, type DiagnosticReturn } from "../_lib/action-return";
import type { RequestFailure } from "../_lib/result-experience";
import { useState, useCallback, useRef, useEffect } from "react";
import { useAdminSession } from "@/components/AdminSessionProvider";
import { normalizeTargetInput, createSafeDiagnosticResult } from "./helpers";
import {
  readCachedDiagnosticResult,
  useDiagnosticHistory,
  writeCachedDiagnosticResult,
} from "./useDiagnosticHistory";
import { sendAnalyticsEvent } from "@/components/AnalyticsEvent";

const LOCAL_RESULT_CACHE_TTL_MS = 10 * 60 * 1000;

async function collectSameOriginBrowserObservation(domain: string) {
  if (
    typeof window === "undefined" ||
    window.location.hostname.toLowerCase() !== domain.toLowerCase()
  ) {
    return undefined;
  }

  const startedAt = performance.now();
  try {
    const response = await fetch(`${window.location.origin}/`, {
      cache: "no-store",
      redirect: "follow",
    });
    return {
      source: "your_browser" as const,
      status: response.ok ? ("reachable" as const) : ("failed" as const),
      precision: "full" as const,
      httpStatus: response.status,
      finalUrl: response.url,
      latencyMs: Math.round(performance.now() - startedAt),
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return {
      source: "your_browser" as const,
      status: "failed" as const,
      precision: "full" as const,
      latencyMs: Math.round(performance.now() - startedAt),
      checkedAt: new Date().toISOString(),
    };
  }
}

export function useWebsiteCheck() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<RequestFailure | null>(null);
  const requestId = useRef(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [localResolvers, setLocalResolvers] = useState<Record<string, any>>({});

  const { authenticated } = useAdminSession();
  const { upsertHistory } = useDiagnosticHistory();
  const domainRef = useRef(domain);

  useEffect(() => {
    domainRef.current = domain;
  }, [domain]);

  const runDiagnostic = useCallback(
    async (target?: string, skipCache: boolean = false) => {
      const d = normalizeTargetInput(
        target !== undefined ? target : domainRef.current,
      );

      if (!d) {
        setError(null);
        setLoading(false);

        return;
      }

      clearDiagnosticReturn();
      const id = ++requestId.current;
      const current = () => id === requestId.current;
      setResult(null);
      setFailure(null);
      setLoading(true);
      sendAnalyticsEvent({ event: "core_tool_run", tool: "website-check" });
      setError(null);

      setLocalResolvers({});

      if (!authenticated && !skipCache) {
        const cachedResult = await readCachedDiagnosticResult(
          d,
          LOCAL_RESULT_CACHE_TTL_MS,
        ).catch(() => null);
        if (!current()) return;
        if (cachedResult) {
          const browser = await collectSameOriginBrowserObservation(d);
          if (!current()) return;
          setResult({
            ...cachedResult,
            observations: {
              ...cachedResult.observations,
              ...(browser ? { browser } : {}),
            },
          });

          setLoading(false);
          if (cachedResult.domain) {
            await upsertHistory(cachedResult.domain, false).catch(() => null);
          }
          return;
        }
      }



      const sameOrigin =
        typeof window !== "undefined" &&
        window.location.hostname.toLowerCase() === d.toLowerCase();
      const dnsResolvers = [
        ...(sameOrigin
          ? [
              {
                id: "system",
                name: "SYSTEM DNS",
                url: `${window.location.origin}/favicon.ico`,
                type: "native",
              },
            ]
          : []),
        {
          id: "google",
          name: "GOOGLE (LOCAL)",
          url: `https://dns.google/resolve?name=${d || "google.com"}&type=A`,
          type: "doh",
        },
        {
          id: "cf",
          name: "CLOUDFLARE (LOCAL)",
          url: `https://cloudflare-dns.com/dns-query?name=${d || "google.com"}&type=A`,
          type: "doh",
        },
        {
          id: "ali",
          name: "ALIDNS (LOCAL)",
          url: `https://dns.alidns.com/resolve?name=${d || "google.com"}&type=A`,
          type: "doh",
        },
      ];

      dnsResolvers.forEach(async (r) => {
        const start = Date.now();
        try {
          if (r.type === "native") {
            const controller = new AbortController();
            const tid = setTimeout(() => controller.abort(), 3000);
            try {
              await fetch(r.url, {
                mode: "no-cors",
                signal: controller.signal,
              });
              if (!current()) return;
              setLocalResolvers((prev) => ({
                ...prev,
                [r.id]: {
                  ...r,
                  ip: "Native_OK",
                  latency: `${Date.now() - start}ms`,
                  status: "OK",
                },
              }));
            } catch {
              if (!current()) return;
              setLocalResolvers((prev) => ({
                ...prev,
                [r.id]: {
                  ...r,
                  ip: "No_Link",
                  latency: "---",
                  status: "FAILED",
                },
              }));
            } finally {
              clearTimeout(tid);
            }
            return;
          }

          const res = await fetch(r.url, {
            headers: { accept: "application/dns-json" },
            signal: AbortSignal.timeout(5000),
          });
          const data = await res.json();
          if (!current()) return;
          const ip =
            data.Answer?.find((a: any) => a.type === 1)?.data ||
            data.answer?.find((a: any) => a.type === 1)?.data ||
            null;
          if (!current()) return;
          setLocalResolvers((prev) => ({
            ...prev,
            [r.id]: {
              ...r,
              ip,
              latency: `${Date.now() - start}ms`,
              status: ip ? "OK" : "EMPTY",
            },
          }));
        } catch {
          if (!current()) return;
          setLocalResolvers((prev) => ({
            ...prev,
            [r.id]: { ...r, ip: null, latency: "ERR", status: "FAILED" },
          }));
        }
      });

      try {
        const cacheMode = authenticated && !skipCache ? "kv" : "0";
        const noCacheParam = skipCache ? `&_nocache=${Date.now()}` : "";
        const res = await fetch(
          `/api/diagnostic?domain=${encodeURIComponent(d || "")}&cache=${cacheMode}${noCacheParam}`,
          { signal: AbortSignal.timeout(30000) },
        );
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(
            `Platform error (${res.status}): Received non-JSON response from server.`,
          );
        }

        const data = await res.json();
        if (!current()) return;
        if (!res.ok)
          throw new Error(
            data.message || `Diagnostic failed with status ${res.status}`,
          );

        if (data?.status === "partial_error") {
          const safeResult = createSafeDiagnosticResult(data, d, data.error);
          const browser = await collectSameOriginBrowserObservation(d);
          if (browser) {
            safeResult.observations = {
              ...safeResult.observations,
              browser,
            };
          }
          if (!current()) return;
          setError(data.error || "Partial diagnostic failure");
          sendAnalyticsEvent({ event: "core_tool_error", tool: "website-check" });
          setResult(safeResult);
          if (safeResult.domain) {
            await upsertHistory(safeResult.domain, false).catch(() => null);
          }
          return;
        }

        const safeResult = createSafeDiagnosticResult(data, d);
        const browser = await collectSameOriginBrowserObservation(d);
        if (browser) {
          safeResult.observations = {
            ...safeResult.observations,
            browser,
          };
        }
        if (!current()) return;
        setResult(safeResult);
        sendAnalyticsEvent({ event: "core_tool_success", tool: "website-check" });
        if (!authenticated) {
          await writeCachedDiagnosticResult(
            safeResult.domain || d,
            safeResult,
          ).catch(() => null);
        }
        if (safeResult.domain) {
          await upsertHistory(safeResult.domain, false).catch(() => null);
        }
      } catch (err: any) {
        if (!current()) return;
        const message = err.message || "Unknown diagnostic request failure";
        setFailure({ target:d, kind: /did not resolve to a public A or AAAA/.test(message) ? "dns" : /timeout|timed out/i.test(message) || err.name === "TimeoutError" ? "timeout" : "request", message });
        setError(err.message || "Unknown forensic engine failure");
        sendAnalyticsEvent({ event: "core_tool_error", tool: "website-check" });
      } finally {
        if (current()) setLoading(false);
      }
    },
    [authenticated, upsertHistory],
  );

  const restoreDiagnostic = useCallback((saved: DiagnosticReturn) => {
    ++requestId.current;
    setDomain(saved.domain);
    setResult(saved.result);
    setError(saved.error);
    setFailure(saved.failure);
    setLocalResolvers(saved.localResolvers);
    setLoading(false);
  }, []);

  return {
    restoreDiagnostic,
    domain,
    setDomain,
    loading,
    failure,
    result,
    setResult,
    error,
    localResolvers,
    runDiagnostic,
  };
}
