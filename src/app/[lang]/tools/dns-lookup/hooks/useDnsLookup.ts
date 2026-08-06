"use client";

import { useState, useCallback } from "react";
import type {
  DnsRecordType,
  DnsProvider,
  DnsLookupResponse,
  DnsBatchResponse,
} from "@/lib/api-contracts";
import { sendAnalyticsEvent } from "@/components/AnalyticsEvent";

export type {
  DnsRecordType,
  DnsProvider,
  DnsAnswer,
  DnsLookupResponse as DnsResult,
  DnsBatchResponse as BatchResult,
} from "@/lib/api-contracts";

export interface LookupHistory {
  id: string;
  domain: string;
  type: DnsRecordType;
  provider: DnsProvider;
  timestamp: number;
  result?: DnsLookupResponse;
  error?: string;
}

export function useDnsLookup() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DnsLookupResponse | null>(null);
  const [batchResult, setBatchResult] = useState<DnsBatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<LookupHistory[]>([]);

  const lookup = useCallback(
    async (
      domain: string,
      type: DnsRecordType = "A",
      provider: DnsProvider = "cloudflare",
    ): Promise<DnsLookupResponse | null> => {
      setLoading(true);
      sendAnalyticsEvent({ event: "core_tool_run", tool: "dns-security" });
      setError(null);
      setResult(null);

      try {
        const params = new URLSearchParams({
          domain: domain.trim().toLowerCase(),
          type,
          provider,
        });

        const response = await fetch(`/api/dns?${params}`);
        const data = await response.json();

        if (data.error) {
          setError(data.error);
          sendAnalyticsEvent({ event: "core_tool_error", tool: "dns-security" });
          // Add to history with error
          addToHistory(domain, type, provider, undefined, data.error);
          return null;
        }

        setResult(data);
        sendAnalyticsEvent({ event: "core_tool_success", tool: "dns-security" });
        addToHistory(domain, type, provider, data);
        return data;
      } catch (e: any) {
        const errorMsg = e.message || "DNS lookup failed";
        setError(errorMsg);
        sendAnalyticsEvent({ event: "core_tool_error", tool: "dns-security" });
        addToHistory(domain, type, provider, undefined, errorMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const batchLookup = useCallback(
    async (
      domain: string,
      types: DnsRecordType[] = ["A", "AAAA", "CNAME", "MX", "NS", "TXT"],
      provider: DnsProvider = "cloudflare",
    ): Promise<DnsBatchResponse | null> => {
      setLoading(true);
      sendAnalyticsEvent({ event: "core_tool_run", tool: "dns-security" });
      setError(null);
      setBatchResult(null);

      try {
        const response = await fetch("/api/dns", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            domain: domain.trim().toLowerCase(),
            types,
            provider,
          }),
        });

        const data = await response.json();

        if (data.error) {
          setError(data.error);
          sendAnalyticsEvent({ event: "core_tool_error", tool: "dns-security" });
          return null;
        }

        setBatchResult(data);
        sendAnalyticsEvent({ event: "core_tool_success", tool: "dns-security" });
        return data;
      } catch (e: any) {
        setError(e.message || "Batch lookup failed");
        sendAnalyticsEvent({ event: "core_tool_error", tool: "dns-security" });
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const addToHistory = useCallback(
    (
      domain: string,
      type: DnsRecordType,
      provider: DnsProvider,
      result?: DnsLookupResponse,
      error?: string,
    ) => {
      const entry: LookupHistory = {
        id: Date.now().toString(36),
        domain,
        type,
        provider,
        timestamp: Date.now(),
        result,
        error,
      };
      setHistory((prev) => [entry, ...prev.slice(0, 49)]); // Keep last 50
    },
    [],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setBatchResult(null);
    setError(null);
  }, []);

  return {
    loading,
    result,
    batchResult,
    error,
    history,
    lookup,
    batchLookup,
    clearHistory,
    clearResult,
  };
}
