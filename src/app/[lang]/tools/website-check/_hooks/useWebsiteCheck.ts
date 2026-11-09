import { startToolRun } from "@/lib/audience-client";
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

import { parseWebsiteTarget } from "@/lib/diagnostic-target";
import { withinBudget } from "@/lib/request-budget";

const LOCAL_RESULT_CACHE_TTL_MS = 10 * 60 * 1000;

async function collectSameOriginBrowserObservation(domain: string, signal: AbortSignal) {
  if (
    typeof window === "undefined" ||
    window.location.hostname.toLowerCase() !== domain.toLowerCase()
  ) {
    return undefined;
  }

  const startedAt = performance.now();
  try {
    const response = await withinBudget(fetch(`${window.location.origin}/`, {
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]),
    }), 2000, signal);
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
    // A cancelled/timed-out auxiliary observation is not evidence of downtime.
    return undefined;

  }
}

export function useWebsiteCheck() {
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<RequestFailure | null>(null);
  const requestId = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const active = useRef<{ target: string; controller: AbortController; finish: ReturnType<typeof startToolRun>["finish"] } | null>(null);
  const [phase, setPhase] = useState<"idle" | "preparing" | "running" | "complete" | "partial" | "failed" | "cancelled">("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const stop = useCallback(() => {
    ++requestId.current;
    requestController.current?.abort();
    requestController.current = null;
    active.current?.finish("cancel");
    active.current = null;
  }, []);
  const cancel = useCallback(() => { stop(); setLoading(false); setPhase("cancelled"); }, [stop]);
  useEffect(() => stop, [stop]);
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

      if (!d || (!parseWebsiteTarget(d) && (typeof window === "undefined" || d !== window.location.hostname))) return;

      // Same-tick duplicate submits cannot create two runs. A different target replaces the old run.
      if (active.current?.target === d) return;
      stop();
      const controller = new AbortController();
      requestController.current = controller;
      const signal = controller.signal;
      clearDiagnosticReturn();
      const id = ++requestId.current;
      const current = () => id === requestId.current && !signal.aborted;
      setResult(null);
      setFailure(null);
      setLoading(true);
      const audienceRun = startToolRun("website-check");
      active.current = { target: d, controller, finish: audienceRun.finish };
      setPhase("preparing");
      setStartedAt(Date.now());
      const browserObservation = collectSameOriginBrowserObservation(d, signal);
      sendAnalyticsEvent({ event: "core_tool_run", tool: "website-check" });
      setError(null);

      setLocalResolvers({});
      const publish = (value: any) => {
        setResult(value);
        void browserObservation.then(browser => {
          if (browser && current()) setResult((previous: any) => previous ? { ...previous, observations: { ...previous.observations, browser } } : previous);
        });
      };

      try {
        if (!authenticated && !skipCache) {
          const cachedResult = await withinBudget(readCachedDiagnosticResult(d, LOCAL_RESULT_CACHE_TTL_MS), 500, signal).catch(() => null);
          if (!current()) return;
          if (cachedResult) {
            publish(cachedResult);

            audienceRun.finish("success");
            setPhase("complete");
            setLoading(false);
            if (cachedResult.domain) {
              void Promise.resolve().then(() => upsertHistory(cachedResult.domain, false)).catch(() => null);
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
                  signal: AbortSignal.any([signal, controller.signal]),
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
              signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]),
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

        setPhase("running");
        const cacheMode = authenticated && !skipCache ? "kv" : "0";
        const noCacheParam = skipCache ? `&_nocache=${Date.now()}` : "";
        const networkSignal = AbortSignal.any([signal, AbortSignal.timeout(30000)]);
        const res = await withinBudget(fetch(
          `/api/diagnostic?domain=${encodeURIComponent(d || "")}&cache=${cacheMode}${noCacheParam}`,
          { signal: networkSignal },
        ), 30000, signal);
        if (res.status === 429) throw new Error("rate_limit");
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error(
            "invalid_response",
          );
        }

        const data = await withinBudget(res.json(), 2000, networkSignal);
        if (!current()) return;
        if (!res.ok)
          throw new Error(
            data.message || `Diagnostic failed with status ${res.status}`,
          );

        if (!data || typeof data !== "object" || !["success", "partial_error"].includes(data.status)) throw new Error("invalid_response");

        if (data?.status === "partial_error") {
          const safeResult = createSafeDiagnosticResult(data, d, data.error);
          if (!current()) return;
          setPhase("partial");
          setError(data.error || "Partial diagnostic failure");
          audienceRun.finish("error");
          sendAnalyticsEvent({ event: "core_tool_error", tool: "website-check" });
          publish(safeResult);
          if (safeResult.domain) {
            void Promise.resolve().then(() => upsertHistory(safeResult.domain, false)).catch(() => null);
          }
          return;
        }

        const safeResult = createSafeDiagnosticResult(data, d);
        if (!current()) return;
        publish(safeResult);
        setPhase("complete");
        audienceRun.finish("success");
        sendAnalyticsEvent({ event: "core_tool_success", tool: "website-check" });
        if (!authenticated) {
          void Promise.resolve().then(() => writeCachedDiagnosticResult(safeResult.domain || d, safeResult)).catch(() => null);
        }
        if (safeResult.domain) {
          void Promise.resolve().then(() => upsertHistory(safeResult.domain, false)).catch(() => null);
        }
      } catch (err: any) {
        if (!current()) return;
        setPhase("failed");
        const message = err.message || "Unknown diagnostic request failure";
        setFailure({ target:d, kind: message === "rate_limit" ? "rate_limit" : message === "invalid_response" || err instanceof SyntaxError ? "invalid_response" : /did not resolve to a public A or AAAA/.test(message) ? "dns" : /timeout|timed out/i.test(message) || err.name === "TimeoutError" ? "timeout" : "request", message });
        setError(err.message || "Unknown forensic engine failure");
        audienceRun.finish("error");
        sendAnalyticsEvent({ event: "core_tool_error", tool: "website-check" });
      } finally {
        audienceRun.finish("cancel");
        if (current()) { setLoading(false); active.current = null; }
      }
    },
    [authenticated, upsertHistory, stop],
  );

  const restoreDiagnostic = useCallback((saved: DiagnosticReturn) => {
    stop();
    setPhase(saved.result ? saved.result.status === "partial_error" ? "partial" : "complete" : saved.failure ? "failed" : "idle");
    setDomain(saved.domain);
    setResult(saved.result);
    setError(saved.error);
    setFailure(saved.failure);
    setLocalResolvers(saved.localResolvers);
    setLoading(false);
  }, [stop]);

  return {
    phase, startedAt, cancel,
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
