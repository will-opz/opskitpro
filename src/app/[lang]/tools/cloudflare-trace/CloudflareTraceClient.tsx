"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Server,
  Shield,
  Globe,
  RefreshCw,
  Search,
  Activity,
} from "lucide-react";
import { ResultPanel, MetaRow, StatusBadge } from "@/components/diagnostic";

interface CfTrace {
  fl?: string;
  h?: string;
  ip?: string;
  ts?: string;
  visit_scheme?: string;
  uag?: string;
  colo?: string;
  sliver?: string;
  http?: string;
  loc?: string;
  tls?: string;
  sni?: string;
  warp?: string;
  gateway?: string;
  kex?: string;
}

export default function CloudflareTraceClient({ lang }: { lang: "zh" | "en" }) {
  const [activeTab, setActiveTab] = useState<"my" | "target">("my");
  const [myTrace, setMyTrace] = useState<CfTrace | null>(null);
  const [myPhase, setMyPhase] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  const [targetDomain, setTargetDomain] = useState("");
  const [targetTrace, setTargetTrace] = useState<CfTrace | null>(null);
  const [targetPhase, setTargetPhase] = useState<
    "idle" | "loading" | "done" | "error" | "not_cf"
  >("idle");
  const [targetErrorMsg, setTargetErrorMsg] = useState("");

  const fetchMyTrace = useCallback(async () => {
    setMyPhase("loading");
    try {
      const res = await fetch("/cdn-cgi/trace");
      if (!res.ok) throw new Error();
      const text = await res.text();
      const trace = parseTraceText(text);
      if (!trace.ip || !trace.colo) throw new Error("Trace unavailable");
      setMyTrace(trace);
      setMyPhase("done");
    } catch {
      setMyPhase("error");
    }
  }, []);

  const fetchTargetTrace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!targetDomain.trim()) return;

    // Clean up domain input
    let cleanDomain = targetDomain.trim().toLowerCase();
    cleanDomain = cleanDomain.replace(/^https?:\/\//, "");
    cleanDomain = cleanDomain.split("/")[0];

    setTargetPhase("loading");
    setTargetErrorMsg("");
    try {
      const res = await fetch(
        `/api/trace?domain=${encodeURIComponent(cleanDomain)}`,
      );
      const text = await res.text();

      if (!res.ok) {
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {
          /* ignore */
        }

        if (res.status === 404 && data?.error?.includes("Could not verify")) {
          setTargetPhase("not_cf");
        } else {
          setTargetPhase("error");
          setTargetErrorMsg(data?.error || "Failed to fetch trace");
        }
        return;
      }

      setTargetTrace(parseTraceText(text));
      setTargetPhase("done");
    } catch {
      setTargetPhase("error");
      setTargetErrorMsg("Network error");
    }
  };

  useEffect(() => {
    if (activeTab === "my" && myPhase === "idle") {
      fetchMyTrace();
    }
  }, [activeTab, fetchMyTrace, myPhase]);

  const parseTraceText = (text: string): CfTrace => {
    return Object.fromEntries(
      text
        .trim()
        .split("\n")
        .map((l) => l.split("="))
        .filter((p) => p.length === 2)
        .map(([k, v]) => [k.trim(), v.trim()]),
    ) as unknown as CfTrace;
  };

  const t = {
    zh: {
      title: "Cloudflare Trace 中心",
      subtitle: "即时解析目标域名或当前环境的 Cloudflare 边缘节点路由追踪。",
      tabMy: "当前连接",
      tabTarget: "目标域名",
      colo: "数据中心 (Colo)",
      ip: "访问 IP",
      loc: "物理位置",
      http: "HTTP 协议",
      tls: "TLS 版本",
      sni: "SNI",
      warp: "WARP 状态",
      gateway: "Zero Trust Gateway",
      refresh: "刷新状态",
      panel1: "核心路由信息",
      panel2: "加密与协议",
      targetPlaceholder: "example.com",
      targetBtn: "探测 Trace",
      targetHint:
        "从 OpsKitPro 服务器探测目标的 /cdn-cgi/trace，非您本地浏览器直连。",
      notCfTitle: "无法获取 Cloudflare Trace",
      notCfDesc:
        "目标网站可能未接入 Cloudflare，或屏蔽了 /cdn-cgi/trace 路径。",
    },
    en: {
      title: "Cloudflare Trace Center",
      subtitle:
        "Analyze the Cloudflare edge routing for your connection or a target domain.",
      tabMy: "My Cloudflare Trace",
      tabTarget: "Target Domain Trace",
      colo: "Data Center (Colo)",
      ip: "Visitor IP",
      loc: "Location",
      http: "HTTP Protocol",
      tls: "TLS Version",
      sni: "SNI",
      warp: "WARP Status",
      gateway: "Zero Trust Gateway",
      refresh: "Refresh",
      panel1: "Core Routing",
      panel2: "Encryption & Protocol",
      targetPlaceholder: "example.com",
      targetBtn: "Trace Target",
      targetHint:
        "This checks the target from OpsKitPro’s server-side probe, not from your browser.",
      notCfTitle: "Cloudflare Trace Not Available",
      notCfDesc:
        "The target may not be using Cloudflare, or it blocks the /cdn-cgi/trace path.",
    },
  }[lang];

  return (
    <main className="w-full flex-grow">
      <div className="glow" aria-hidden />

      <section className="mx-auto w-full max-w-3xl px-4 pt-8 pb-4 sm:px-6 text-left">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-3">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mb-5">
          {t.subtitle}
        </p>

        {/* Tabs */}
        <div className="inline-flex rounded-xl bg-[var(--surface-secondary)] p-1 border border-[var(--border-subtle)] mb-4">
          <button
            aria-pressed={activeTab === "my"}
            onClick={() => setActiveTab("my")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "my"
                ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.tabMy}
          </button>
          <button
            aria-pressed={activeTab === "target"}
            onClick={() => setActiveTab("target")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "target"
                ? "bg-[var(--surface-primary)] text-[var(--text-primary)] shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            {t.tabTarget}
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-16">
        {/* TAB 1: My Trace */}
        {activeTab === "my" && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[var(--text-secondary)]">
                {lang === "zh" ? "当前浏览器到 Cloudflare 的连接" : "Your connection to Cloudflare"}
              </div>
              {(myPhase === "done" || myPhase === "error") && (
                <button
                  onClick={fetchMyTrace}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t.refresh}
                </button>
              )}
            </div>

            <ResultPanel
              title={t.panel1}
              icon={<Globe className="w-4 h-4" />}
              phase={myPhase}
            >
              {myPhase === "error" ? <p role="alert" className="tool-empty">{lang === "zh" ? "无法获取当前连接的 Trace。此页面需要通过 Cloudflare 访问；你也可以切换到目标域名检测。" : "Trace is unavailable for this connection. This page needs to be served through Cloudflare. You can also check a target domain."}</p> : myPhase === "loading" ? <p role="status">{lang === "zh" ? "正在获取连接信息…" : "Loading connection details…"}</p> : myTrace && <TraceDataDisplay trace={myTrace} t={t} />}
            </ResultPanel>
          </div>
        )}

        {/* TAB 2: Target Trace */}
        {activeTab === "target" && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-sm mb-4">
              <label htmlFor="trace-target" className="mb-2 block text-sm font-semibold">{lang === "zh" ? "域名或 URL" : "Domain or URL"}</label>
              <form onSubmit={fetchTargetTrace} className="flex flex-col sm:flex-row gap-2">
                <input
                  id="trace-target"
                  type="text"
                  placeholder={t.targetPlaceholder}
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  className="flex-grow rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3 text-sm focus:border-[var(--accent-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                />
                <button
                  type="submit"
                  disabled={targetPhase === "loading" || !targetDomain.trim()}
                  className="ui-button-primary"
                >
                  {targetPhase === "loading" ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>{t.targetBtn}</span>
                </button>
              </form>
              <div className="mt-3 flex items-start gap-1.5 text-xs text-[var(--warning-text)] bg-[var(--warning-soft)] p-2.5 rounded-lg border border-amber-100">
                <Shield className="w-4 h-4 shrink-0" />
                <p>{t.targetHint}</p>
              </div>
            </div>

            {targetPhase === "not_cf" && (
              <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] p-6 text-center">
                <Activity className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">
                  {t.notCfTitle}
                </h3>
                <p className="text-sm text-[var(--text-muted)]">{t.notCfDesc}</p>
              </div>
            )}

            {targetPhase === "error" && (
              <div className="rounded-2xl border border-red-200 bg-[var(--danger-soft)] p-6 text-center text-[var(--danger-text)]">
                <p className="font-semibold">{lang === "zh" ? "检测失败" : "Check failed"}</p>
                <p className="text-sm mt-1">{targetErrorMsg}</p>
              </div>
            )}

            {(targetPhase === "done" || targetPhase === "loading") && (
              <ResultPanel
                title={t.panel1}
                icon={<Server className="w-4 h-4" />}
                phase={targetPhase}
              >
                {targetTrace && <TraceDataDisplay trace={targetTrace} t={t} />}
              </ResultPanel>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function TraceDataDisplay({ trace, t }: { trace: CfTrace; t: any }) {
  return (
    <div className="grid gap-6">
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div>
          <MetaRow label={t.colo} value={trace.colo || "—"} mono />
          <MetaRow label={t.ip} value={trace.ip || "—"} mono />
          <MetaRow label={t.loc} value={trace.loc || "—"} mono />
        </div>
        <div>
          <MetaRow label={t.http} value={trace.http || "—"} mono />
          <MetaRow label={t.tls} value={trace.tls || "—"} mono />
          <MetaRow
            label={t.sni}
            value={trace.sni === "plaintext" ? "off" : trace.sni || "—"}
            mono
          />
        </div>
      </div>

      {/* Advanced Details separated by a small divider */}
      <div className="border-t border-[var(--border-subtle)] pt-4 grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
            <span className="text-xs text-[var(--text-muted)]">{t.warp}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold font-mono text-[var(--text-primary)]">
                {trace.warp || "off"}
              </span>
              <StatusBadge
                status={
                  trace.warp === "on" || trace.warp === "plus" ? "ok" : "slow"
                }
              />
            </div>
          </div>
          <MetaRow label={t.gateway} value={trace.gateway || "off"} mono />
        </div>
        <div>
          <MetaRow label="Time (ts)" value={trace.ts || "—"} mono />
          <MetaRow label="Sliver" value={trace.sliver || "—"} mono />
        </div>
      </div>
    </div>
  );
}
