"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Globe,
  Zap,
  Activity,
  Database,
  Clock,
  Copy,
  Check,
  ChevronDown,
  Server,
  AlertCircle,
  Filter,
  History,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Cpu,
  Monitor,
} from "lucide-react";
import {
  useDnsLookup,
  useSecurityAudit,
  type DnsRecordType,
  type DnsProvider,
} from "./hooks";
import { SecurityAuditPanel } from "./components/SecurityAuditPanel";

export default function DnsClient({
  dict,
  lang,
}: {
  dict: any;
  lang: "zh" | "en";
}) {
  const { loading, result, error, lookup, history } = useDnsLookup();

  const searchParams = useSearchParams();
  const isZh = lang === "zh";

  const [domain, setDomain] = useState("");
  const [selectedType, setSelectedType] = useState<DnsRecordType>("A");
  const [selectedProvider, setSelectedProvider] =
    useState<DnsProvider>("cloudflare");
  const [activeTab, setActiveTab] = useState<"standard" | "security">(
    "standard",
  );

  // dict passed via props
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [localResolvers, setLocalResolvers] = useState<Record<string, any>>({});

  const {
    loading: auditLoading,
    result: auditResult,
    error: auditError,
    runAudit,
  } = useSecurityAudit();

  const recordTypes: DnsRecordType[] = [
    "A",
    "AAAA",
    "CNAME",
    "MX",
    "NS",
    "TXT",
    "CAA",
  ];
  const providers: { id: DnsProvider; name: string }[] = [
    { id: "cloudflare", name: "Cloudflare (Global)" },
    { id: "google", name: "Google (Global)" },
    { id: "aliyun", name: "AliDNS (Domestic)" },
    { id: "quad9", name: "Quad9 (Privacy)" },
  ];

  useEffect(() => {
    const q = searchParams.get("q") || searchParams.get("domain");
    const tabParam = searchParams.get("tab");

    if (tabParam === "security") {
      setActiveTab("security");
    }

    if (q) {
      setDomain(q);
      if (tabParam === "security") {
        runAudit(q);
      } else {
        lookup(q, selectedType, selectedProvider);
        runLocalAudit(q);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // intentionally run only on URL param change

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!domain) return;
    if (activeTab === "standard") {
      lookup(domain, selectedType, selectedProvider);
      runLocalAudit(domain);
    } else {
      runAudit(domain);
    }
  };

  const runLocalAudit = async (d: string) => {
    setLocalResolvers({});
    const dnsResolvers = [
      {
        id: "system",
        name: "SYSTEM DNS",
        url: `https://${d}/favicon.ico`,
        type: "native",
      },
      {
        id: "google",
        name: "GOOGLE (LOCAL)",
        url: `https://dns.google/resolve?name=${d}&type=${selectedType}`,
        type: "doh",
      },
      {
        id: "cf",
        name: "CLOUDFLARE (LOCAL)",
        url: `https://cloudflare-dns.com/dns-query?name=${d}&type=${selectedType}`,
        type: "doh",
      },
      {
        id: "ali",
        name: "ALIDNS (LOCAL)",
        url: `https://dns.alidns.com/resolve?name=${d}&type=${selectedType}`,
        type: "doh",
      },
      {
        id: "quad9",
        name: "QUAD9 (LOCAL)",
        url: `https://dns.quad9.net/dns-query?name=${d}&type=${selectedType}`,
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
            await fetch(r.url, { mode: "no-cors", signal: controller.signal });
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
            setLocalResolvers((prev) => ({
              ...prev,
              [r.id]: { ...r, ip: "No_Link", latency: "---", status: "FAILED" },
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
        const ans = data.Answer || data.answer || [];
        const ip =
          ans.find((a: any) => a.type === 1 || a.type === 28)?.data ||
          ans[0]?.data ||
          null;
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
        setLocalResolvers((prev) => ({
          ...prev,
          [r.id]: { ...r, ip: null, latency: "ERR", status: "FAILED" },
        }));
      }
    });
  };

  const copyData = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!dict)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
        <Activity className="w-10 h-10 text-orange-500 animate-pulse mb-6" />
        <p className="text-[var(--text-muted)] tracking-[0.24em] text-xs">
          {"Loading DNS environment..."}
        </p>
      </div>
    );

  return (
    <div className="tool-page max-w-6xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 mb-4 text-xs tracking-[0.24em] text-[var(--text-muted)]">
        <Link
          href={`/${lang}`}
          className="hover:text-[var(--text-primary)] transition-colors"
        >
          {lang === "zh"
              ? "首页"
              : "Home"}
        </Link>
        <span>/</span>
        <span className="text-[var(--text-primary)] border-b border-emerald-500/30 font-semibold">
          {dict.tools.dns_lookup_title}
        </span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 mb-5">
        <div className="text-left">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 justify-center md:justify-start">
            <h1 className="text-2xl sm:text-3xl md:text-3xl font-semibold text-[var(--text-primary)] tracking-tighter leading-none break-words">
              {dict.tools.dns_lookup_title}
            </h1>
            <Link
              href={`/${lang}/tools/api`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[var(--accent-text)] hover:bg-emerald-500/20 text-xs font-semibold tracking-wide transition-colors border border-emerald-500/20 w-max mx-auto sm:mx-0"
            >
              <Terminal className="w-3.5 h-3.5" />
              JSON API
            </Link>
          </div>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl">
            {dict.tools.dns_lookup_desc}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex rounded-xl bg-[var(--bg-tertiary)] p-1 mb-4 border border-[var(--border-strong)]">
        <button
          onClick={() => setActiveTab("standard")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            activeTab === "standard"
              ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          {isZh
              ? "标准查询"
              : "Standard Lookup"}
        </button>
        <button
          onClick={() => setActiveTab("security")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${
            activeTab === "security"
              ? "bg-[var(--surface-primary)] text-[var(--accent-text)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          {isZh
              ? "安全审计"
              : "Security Audit"}
        </button>
      </div>

      {/* Control Center */}
      <div className="bg-[var(--surface-primary)] border border-black/5 rounded-2xl p-4 shadow-sm mb-6 relative group">
        <label htmlFor="dns-domain" className="mb-2 block text-sm font-semibold">{isZh ? "域名" : "Domain"}</label>
        <form
          onSubmit={handleSearch}
          className="flex flex-col md:flex-row items-stretch md:items-center gap-3"
        >
          <div className="min-w-0 flex-grow flex items-center px-3 py-3 border border-[var(--border-strong)] rounded-xl">
            <Globe className="w-5 h-5 text-[var(--text-muted)] mr-4 group-focus-within:text-emerald-500 transition-colors" />
            <input
              id="dns-domain"
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={dict.tools.dns.placeholder}
              className="w-full bg-transparent border-none outline-none text-[var(--text-primary)] text-lg focus:ring-0"
            />
          </div>

          {activeTab === "standard" && (
            <div className="flex flex-wrap items-center gap-4 p-3 bg-[var(--surface-secondary)] rounded-[2rem] border border-[var(--border-subtle)]">
              <div className="flex items-center gap-3 px-4 border-r border-[var(--border-strong)]">
                <Filter className="w-4 h-4 text-[var(--text-muted)]" />
                <label htmlFor="dns-type" className="text-xs">{isZh ? "记录类型" : "Type"}</label>
                <select id="dns-type"
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as DnsRecordType)
                  }
                  className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-[var(--text-secondary)] appearance-none tracking-[0.18em]"
                >
                  {recordTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 px-4">
                <Server className="w-4 h-4 text-[var(--text-muted)]" />
                <label htmlFor="dns-provider" className="text-xs">{isZh ? "解析器" : "Resolver"}</label>
                <select id="dns-provider"
                  value={selectedProvider}
                  onChange={(e) =>
                    setSelectedProvider(e.target.value as DnsProvider)
                  }
                  className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-[var(--text-muted)] appearance-none tracking-[0.16em]"
                >
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-[var(--text-faint)]" />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={activeTab === "standard" ? loading : auditLoading}
            className="ui-button-primary"
          >
            {(activeTab === "standard" ? loading : auditLoading) ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : activeTab === "security" ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <Zap className="w-5 h-5 fill-current" />
            )}
            <span className="tracking-[0.18em]">
              {activeTab === "security"
                ? isZh
                    ? "开始审计"
                    : "Run Audit"
                : dict.tools.dns.btn}
            </span>
          </button>
        </form>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">{isZh ? "域名将发送到 OpsKitPro 服务，再向所选公共 DNS 解析器查询。" : "The domain is sent to OpsKitPro, which queries the selected public DNS resolver."}</p>
      </div>

      {(activeTab === "standard" ? error : auditError) && (
        <div className="mb-12 p-10 bg-[var(--danger-soft)] border border-red-100 rounded-[2.5rem] text-[var(--danger-text)] flex items-start gap-6 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-8 h-8 shrink-0" />
          <div>
            <h3 className="text-xl font-semibold tracking-tight mb-2">
              {lang === "zh"
                  ? "查询异常"
                  : "Lookup error"}
            </h3>
            <p className="text-sm opacity-80 leading-relaxed">
              {activeTab === "standard" ? error : auditError}
            </p>
          </div>
        </div>
      )}

      {/* Security Audit Results */}
      {activeTab === "security" && auditResult && (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
          <SecurityAuditPanel result={auditResult} lang={lang} />
        </div>
      )}

      {/* Standard Lookup Results */}
      {activeTab === "standard" && result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Local Perspective Audit Panel */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-8 sm:p-10 mb-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                <Monitor className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">
                  {lang === "zh"
                      ? "本地联查"
                      : "Local Perspective"}
                </h3>
                <p className="text-xs text-[var(--text-muted)] tracking-[0.18em]">
                  {lang === "zh"
                      ? "通过多个本地解析器交叉确认"
                      : "Client-side multi-resolver checks"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {Object.values(localResolvers).map((node: any) => (
                <div
                  key={node.id}
                  className="bg-[var(--surface-primary)] p-5 rounded-3xl border border-[var(--border-subtle)] flex flex-col gap-3 transition-all hover:border-indigo-500 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.18em]">
                      {node.name}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full ${node.status === "OK" ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-red-400"}`}
                    ></div>
                  </div>
                  <div>
                    <p
                      className="text-xs text-[var(--text-muted)] truncate"
                      title={node.ip}
                    >
                      {node.ip || "NXDOMAIN"}
                    </p>
                    <p className="text-xs text-[var(--text-faint)] mt-1 tracking-[0.18em]">
                      {node.latency}
                    </p>
                  </div>
                </div>
              ))}
              {Object.values(localResolvers).length === 0 &&
                Array(4)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="bg-[var(--surface-secondary)] h-24 rounded-3xl border border-dashed border-[var(--border-strong)] animate-pulse"
                    ></div>
                  ))}
            </div>
          </div>

          {/* Quick Stats Panel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[var(--surface-primary)] p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40 group relative overflow-hidden transition-all hover:shadow-sm">
              <div className="absolute top-0 right-0 p-8 scale-150 opacity-[0.03] group-hover:opacity-10 transition-transform">
                <ShieldCheck className="w-12 h-12" />
              </div>
              <span className="text-xs text-[var(--text-muted)] tracking-[0.24em] font-semibold">
                {lang === "zh"
                    ? "解析状态"
                    : "Resolver Status"}
              </span>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-2xl font-semibold text-emerald-500 tracking-tighter">
                  {lang === "zh"
                      ? "安全 DoH"
                      : "Secure DoH"}
                </span>
              </div>
            </div>
            <div className="bg-[var(--surface-primary)] p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
              <span className="text-xs text-[var(--text-muted)] tracking-[0.24em] font-semibold">
                {lang === "zh"
                    ? "响应时间"
                    : "Response Time"}
              </span>
              <div>
                <div className="text-4xl font-semibold text-[var(--text-primary)] tracking-tighter">
                  {result.responseTime}
                </div>
                <div className="text-xs text-emerald-500 font-semibold tracking-[0.18em] mt-1">
                  {lang === "zh"
                      ? "毫秒"
                      : "Milliseconds"}
                </div>
              </div>
            </div>
            <div className="bg-[var(--surface-primary)] p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
              <span className="text-xs text-[var(--text-muted)] tracking-[0.24em] font-semibold">
                {lang === "zh"
                    ? "协议"
                    : "Protocol"}
              </span>
              <div className="text-xl font-semibold text-[var(--text-primary)]">
                {"TLS 1.3 / ECH"}
              </div>
            </div>
            <div className="bg-[var(--surface-primary)] p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
              <span className="text-xs text-[var(--text-muted)] tracking-[0.24em] font-semibold">
                {lang === "zh"
                    ? "记录类型"
                    : "Record Type"}
              </span>
              <div className="text-4xl font-semibold text-[var(--accent-text)] tracking-tighter underline decoration-2 underline-offset-8 decoration-emerald-500/30">
                {result.type}
              </div>
            </div>
          </div>

          {/* Answer Manifest Grid */}
          <div className="bg-[var(--surface-primary)] border border-black/5 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-sm">
            <div className="px-6 sm:px-10 py-6 bg-[var(--surface-secondary)] border-b border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h3 className="text-xs font-semibold text-[var(--text-muted)] tracking-[0.18em] flex items-center gap-3">
                <Database className="w-4 h-4 text-emerald-500" />{" "}
                {lang === "zh"
                    ? "响应记录 JSON"
                    : "Resolution Manifest JSON"}
              </h3>
              <button
                onClick={() => copyData(JSON.stringify(result.answers))}
                className="text-xs font-semibold text-[var(--text-muted)] hover:text-orange-600 flex items-center gap-2 group transition-colors"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Copy className="w-4 h-4 group-hover:scale-110" />
                )}
                {copied
                  ? lang === "zh"
                      ? "已复制"
                      : "Copied"
                  : lang === "zh"
                      ? "复制全部"
                      : "Copy all"}
              </button>
            </div>

            <div className="divide-y divide-zinc-50">
              {result.answers.length > 0 ? (
                result.answers.map((answer, idx) => (
                  <div
                    key={idx}
                    className="p-6 sm:p-10 hover:bg-[var(--surface-secondary)] transition-all group flex flex-col md:flex-row md:items-center gap-6 sm:gap-10"
                  >
                    <div className="flex-grow">
                      <div className="flex items-center gap-4 mb-4">
                        <span className="px-3 py-1 bg-orange-500 text-white rounded-lg text-xs font-semibold tracking-[0.18em]">
                          {answer.type}
                        </span>
                        <span className="text-zinc-200 font-light opacity-50">
                          /
                        </span>
                        <span className="text-xs font-semibold text-[var(--text-muted)] tracking-[0.18em]">
                          {answer.name}
                        </span>
                      </div>
                      <div className="font-semibold text-xl md:text-2xl text-[var(--text-primary)] break-all leading-tight flex items-start gap-3">
                        {answer.priority !== undefined && (
                          <span className="text-purple-500 text-sm mt-1">
                            [{answer.priority}]
                          </span>
                        )}
                        <span className="group-hover:text-[var(--accent-text)] transition-colors">
                          {answer.data}
                        </span>
                      </div>
                    </div>
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 pt-6 md:pt-0 border-[var(--border-subtle)] min-w-max">
                      <div className="flex flex-col md:items-end gap-1">
                        <div className="text-xs text-[var(--text-muted)] font-semibold tracking-[0.18em] flex items-center gap-2">
                          <Clock className="w-3 h-3" />{" "}
                          {"Time_To_Live"}
                        </div>
                        <div className="text-lg font-semibold text-[var(--text-primary)]">
                          {answer.ttl}
                          <span className="text-xs text-[var(--text-muted)] ml-1">S</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyData(answer.data)}
                        className="p-3 bg-[var(--bg-tertiary)] rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-white"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-32 text-center flex flex-col items-center bg-[var(--surface-primary)]">
                  <Terminal className="w-20 h-20 text-zinc-100 mb-6 animate-pulse" />
                  <p className="text-[var(--text-muted)] text-sm tracking-[0.18em]">
                    {dict.tools.dns.no_records}
                  </p>
                  <p className="text-xs text-[var(--text-faint)] mt-2">
                    {lang === "zh"
                        ? "请检查 NXDOMAIN / 超时"
                        : "Check NXDOMAIN / timeout"}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Collapsible JSON Audit View */}
          <div className="mt-16">
            <button
              onClick={() => setShowJson(!showJson)}
              className="flex items-center gap-2 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors tracking-[0.18em] mb-6"
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showJson ? "rotate-180" : ""}`}
              />
              {lang === "zh"
                  ? "原始 DNS 记录 JSON"
                  : "Raw DNS Audit JSON"}
            </button>
            {showJson && (
              <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-xs text-[var(--text-muted)] overflow-x-auto border border-zinc-800 shadow-sm relative">
                <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                  <button
                    onClick={() => copyData(JSON.stringify(result.raw))}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <pre className="font-mono leading-relaxed pt-4">
                  {JSON.stringify(result.raw, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forensics History Section */}
      {activeTab === "standard" &&
        !result &&
        !loading &&
        history.length > 0 && (
          <div className="animate-in fade-in duration-1000 mt-24">
            <div className="flex items-center justify-between mb-10 border-b border-[var(--border-subtle)] pb-6">
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-primary)] tracking-[0.18em] flex items-center gap-3">
                  <History className="w-5 h-5 text-emerald-500" />{" "}
                  {lang === "zh"
                      ? "最近的 DNS 记录"
                      : "Recent DNS Checks"}
                </h4>
                <p className="text-xs text-[var(--text-muted)] mt-1 tracking-[0.18em]">
                  {lang === "zh"
                      ? "缓存查询记录"
                      : "Cached query history"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {history.slice(0, 4).map((h) => (
                <button
                  key={h.id}
                  onClick={() => lookup(h.domain, h.type, h.provider)}
                  className="p-8 bg-[var(--surface-primary)] border border-black/5 rounded-3xl hover:border-orange-500/40 hover:-translate-y-1 transition-all text-left flex flex-col justify-between group shadow-sm h-40"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-lg text-xs font-semibold tracking-[0.18em]">
                        {h.type}
                      </span>
                      <span className="text-xs font-semibold text-[var(--text-faint)] tracking-[0.18em]">
                        @ {h.provider.split("_")[0]}
                      </span>
                    </div>
                    <p className="font-semibold text-[var(--text-primary)] text-base group-hover:text-orange-600 transition-colors truncate w-full">
                      {h.domain}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-semibold tracking-[0.18em] group-hover:text-[var(--text-primary)] transition-colors">
                    {"Replay_Probe"}{" "}
                    <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      {/* Hero Empty State View */}
      {!result && !auditResult && !loading && !auditLoading && (
        <div className="tool-empty mt-6">
          <Cpu className="w-5 h-5 text-[var(--accent-text)] mb-2" />
          <p className="text-[var(--text-secondary)] text-sm leading-6">
            {activeTab === "standard"
              ? (isZh ? "输入域名，查询 A、AAAA、CNAME、MX、NS、TXT 或 CAA 记录。" : "Enter a domain to query A, AAAA, CNAME, MX, NS, TXT or CAA records.")
              : (isZh ? "输入域名，检查 DMARC、SPF 与 CAA 策略。" : "Enter a domain to inspect DMARC, SPF and CAA policies.")}
          </p>
        </div>
      )}
    </div>
  );
}
