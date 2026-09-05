"use client";

import { useState } from "react";
import {
  Copy,
  Check,
  Clock,
  Server,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileJson,
} from "lucide-react";
import type { DnsResult } from "../hooks";

interface DnsResultTableProps {
  result: DnsResult | null;
  loading: boolean;
}

export function DnsResultTable({ result, loading }: DnsResultTableProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAllAnswers = () => {
    if (!result?.answers) return;
    const text = result.answers.map((a) => a.data).join("\n");
    copyToClipboard(text, "all");
  };

  if (loading) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-black/5 bg-[var(--surface-primary)] backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-[var(--text-muted)]">Querying DNS servers...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const isError = result.statusCode !== 0;
  const hasAnswers = result.answers && result.answers.length > 0;

  return (
    <div className="glass-card rounded-2xl border border-black/5 bg-[var(--surface-primary)] backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div
        className={`px-6 py-4 border-b flex items-center justify-between ${
          isError
            ? "bg-[var(--danger-soft)] border-red-100"
            : "bg-[var(--accent-soft)] border-emerald-100"
        }`}
      >
        <div className="flex items-center gap-3">
          {isError ? (
            <XCircle className="w-5 h-5 text-red-500" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-primary)]">
                {result.domain}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  isError
                    ? "bg-[var(--danger-soft)] text-[var(--danger-text)]"
                    : "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                }`}
              >
                {result.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.responseTime}ms
              </span>
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3" />
                {result.provider}
              </span>
              <span className="px-1.5 py-0.5 bg-zinc-200 rounded font-bold">
                {result.type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasAnswers && (
            <button
              onClick={copyAllAnswers}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-lg text-xs font-medium hover:bg-[var(--surface-secondary)] transition-all"
            >
              {copiedField === "all" ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
              Copy All
            </button>
          )}
          <button
            onClick={() => setShowRaw(!showRaw)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showRaw
                ? "bg-[var(--warning-soft)] text-[var(--warning-text)]"
                : "bg-[var(--surface-primary)] border border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]"
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            Raw JSON
          </button>
        </div>
      </div>

      {/* Results Table */}
      {hasAnswers ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--surface-secondary)] text-left text-xs font-semibold text-[var(--text-muted)] tracking-[0.18em]">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">TTL</th>
                <th className="px-6 py-3">Value</th>
                <th className="px-6 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {result.answers.map((answer, idx) => (
                <tr key={idx} className="hover:bg-[var(--surface-secondary)] transition-colors">
                  <td className="px-6 py-3 text-sm text-[var(--text-secondary)]">
                    {answer.name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="px-2 py-0.5 bg-[var(--info-soft)] text-cyan-700 rounded text-xs font-bold">
                      {answer.type}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span className="text-sm text-[var(--text-muted)]">
                      {formatTTL(answer.ttl)}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-[var(--text-primary)] break-all max-w-md">
                    {answer.priority !== undefined && (
                      <span className="text-purple-600 mr-2">
                        [{answer.priority}]
                      </span>
                    )}
                    {answer.exchange || answer.data}
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() =>
                        copyToClipboard(answer.data, `answer-${idx}`)
                      }
                      className="p-1.5 text-[var(--text-faint)] hover:text-[var(--text-secondary)] rounded transition-colors"
                    >
                      {copiedField === `answer-${idx}` ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="px-6 py-12 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--text-faint)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">No records found for this query</p>
          {result.comment && (
            <p className="text-sm text-[var(--text-muted)] mt-2">{result.comment}</p>
          )}
        </div>
      )}

      {/* Authority Section (if no answers but has authority) */}
      {!hasAnswers && result.authority && result.authority.length > 0 && (
        <div className="px-6 py-4 bg-[var(--warning-soft)] border-t border-amber-100">
          <div className="text-xs font-semibold text-[var(--warning-text)] tracking-[0.18em] mb-2">
            Authority Section
          </div>
          <div className="space-y-1">
            {result.authority.map((auth, idx) => (
              <div key={idx} className="text-xs text-[var(--warning-text)]">
                {auth.name} → {auth.data}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw JSON */}
      {showRaw && (
        <div className="border-t border-[var(--border-subtle)]">
          <div className="px-6 py-3 bg-zinc-900 flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-muted)] tracking-[0.18em]">
              Raw Response
            </span>
            <button
              onClick={() =>
                copyToClipboard(JSON.stringify(result.raw, null, 2), "raw")
              }
              className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-xs text-[var(--text-faint)] transition-colors"
            >
              {copiedField === "raw" ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy
            </button>
          </div>
          <pre className="px-6 py-4 bg-zinc-950 text-xs text-emerald-400 font-mono overflow-x-auto max-h-64">
            {JSON.stringify(result.raw, null, 2)}
          </pre>
        </div>
      )}

      {/* Flags */}
      <div className="px-6 py-3 bg-[var(--surface-secondary)] border-t border-[var(--border-subtle)] flex flex-wrap gap-2">
        {[
          {
            flag: "RD",
            active: result.recursionDesired,
            label: "Recursion Desired",
          },
          {
            flag: "RA",
            active: result.recursionAvailable,
            label: "Recursion Available",
          },
          { flag: "AD", active: result.authenticData, label: "Authentic Data" },
          { flag: "TC", active: result.truncated, label: "Truncated" },
        ].map(({ flag, active, label }) => (
          <span
            key={flag}
            className={`px-2 py-0.5 rounded text-xs font-semibold tracking-[0.18em] ${
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent-text)]"
                : "bg-zinc-200 text-[var(--text-muted)]"
            }`}
            title={label}
          >
            {flag}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatTTL(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}
