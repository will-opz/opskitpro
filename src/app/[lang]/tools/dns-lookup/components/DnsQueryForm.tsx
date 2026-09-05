"use client";

import { useState } from "react";
import { Search, Server, ChevronDown, Zap, Layers } from "lucide-react";
import type { DnsRecordType, DnsProvider } from "../hooks";

interface DnsQueryFormProps {
  onQuery: (domain: string, type: DnsRecordType, provider: DnsProvider) => void;
  onBatchQuery: (domain: string, provider: DnsProvider) => void;
  loading: boolean;
}

const RECORD_TYPES: { value: DnsRecordType; label: string; desc: string }[] = [
  { value: "A", label: "A", desc: "IPv4 Address" },
  { value: "AAAA", label: "AAAA", desc: "IPv6 Address" },
  { value: "CNAME", label: "CNAME", desc: "Canonical Name" },
  { value: "MX", label: "MX", desc: "Mail Exchange" },
  { value: "NS", label: "NS", desc: "Name Server" },
  { value: "TXT", label: "TXT", desc: "Text Record" },
  { value: "SOA", label: "SOA", desc: "Start of Authority" },
  { value: "PTR", label: "PTR", desc: "Pointer Record" },
  { value: "SRV", label: "SRV", desc: "Service Record" },
  { value: "CAA", label: "CAA", desc: "CA Authorization" },
];

const DNS_PROVIDERS: { value: DnsProvider; label: string; ip: string }[] = [
  { value: "cloudflare", label: "Cloudflare", ip: "1.1.1.1" },
  { value: "google", label: "Google", ip: "8.8.8.8" },
  { value: "quad9", label: "Quad9", ip: "9.9.9.9" },
];

export function DnsQueryForm({
  onQuery,
  onBatchQuery,
  loading,
}: DnsQueryFormProps) {
  const [domain, setDomain] = useState("");
  const [recordType, setRecordType] = useState<DnsRecordType>("A");
  const [provider, setProvider] = useState<DnsProvider>("cloudflare");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain.trim()) return;
    onQuery(domain, recordType, provider);
  };

  const handleBatchQuery = () => {
    if (!domain.trim()) return;
    onBatchQuery(domain, provider);
  };

  const selectedType = RECORD_TYPES.find((t) => t.value === recordType);
  const selectedProvider = DNS_PROVIDERS.find((p) => p.value === provider);

  return (
    <form
      onSubmit={handleSubmit}
      className="glass-card p-6 rounded-2xl border border-black/5 bg-[var(--surface-primary)] backdrop-blur-xl"
    >
      {/* Domain Input */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
          Domain Name
        </label>
        <div className="relative">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="example.com"
            className="w-full px-4 py-3 pr-12 bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 transition-all"
            disabled={loading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]">
            <Search className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Options Row */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Record Type Dropdown */}
        <div className="relative flex-1 min-w-[140px]">
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
            Record Type
          </label>
          <button
            type="button"
            onClick={() => {
              setShowTypeDropdown(!showTypeDropdown);
              setShowProviderDropdown(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-xl text-sm font-medium hover:bg-[var(--surface-secondary)] transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[var(--info-soft)] text-cyan-700 rounded font-bold text-xs">
                {selectedType?.value}
              </span>
              <span className="text-[var(--text-muted)] text-xs hidden sm:inline">
                {selectedType?.desc}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${showTypeDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showTypeDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-primary)] rounded-xl shadow-sm border border-[var(--border-strong)] z-50 max-h-64 overflow-auto">
              {RECORD_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    setRecordType(type.value);
                    setShowTypeDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--info-soft)] transition-colors ${
                    recordType === type.value ? "bg-[var(--info-soft)]" : ""
                  }`}
                >
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-xs ${
                      recordType === type.value
                        ? "bg-cyan-600 text-white"
                        : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {type.value}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{type.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DNS Provider Dropdown */}
        <div className="relative flex-1 min-w-[140px]">
          <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest mb-2">
            DNS Server
          </label>
          <button
            type="button"
            onClick={() => {
              setShowProviderDropdown(!showProviderDropdown);
              setShowTypeDropdown(false);
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--surface-primary)] border border-[var(--border-strong)] rounded-xl text-sm font-medium hover:bg-[var(--surface-secondary)] transition-all"
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--text-muted)]" />
              <span>{selectedProvider?.label}</span>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {selectedProvider?.ip}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${showProviderDropdown ? "rotate-180" : ""}`}
            />
          </button>

          {showProviderDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface-primary)] rounded-xl shadow-sm border border-[var(--border-strong)] z-50">
              {DNS_PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setProvider(p.value);
                    setShowProviderDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--info-soft)] transition-colors ${
                    provider === p.value ? "bg-[var(--info-soft)]" : ""
                  }`}
                >
                  <Server
                    className={`w-4 h-4 ${provider === p.value ? "text-cyan-600" : "text-[var(--text-muted)]"}`}
                  />
                  <span className="font-medium">{p.label}</span>
                  <span className="text-xs text-[var(--text-muted)] font-mono ml-auto">
                    {p.ip}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !domain.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-bold hover:from-orange-400 hover:to-rose-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-500/30"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Zap className="w-5 h-5" />
          )}
          Query
        </button>

        <button
          type="button"
          onClick={handleBatchQuery}
          disabled={loading || !domain.trim()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-200"
          title="Query all record types at once"
        >
          <Layers className="w-5 h-5" />
          <span className="hidden sm:inline">All Types</span>
        </button>
      </div>

      {/* Quick domains */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[var(--text-muted)]">Try:</span>
        {["google.com", "cloudflare.com", "github.com", "example.com"].map(
          (d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDomain(d)}
              className="text-xs px-2 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--info-soft)] hover:text-cyan-700 rounded-lg transition-colors font-mono"
            >
              {d}
            </button>
          ),
        )}
      </div>
    </form>
  );
}
