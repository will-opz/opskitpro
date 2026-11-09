"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Activity, ChevronDown, Globe, History, Star, Terminal, Trash2, Zap } from "lucide-react";
import { useDiagnosticHistory } from "./_hooks/useDiagnosticHistory";
import { useWebsiteCheck } from "./_hooks/useWebsiteCheck";
import { normalizeTargetInput } from "./_hooks/helpers";
import { parseWebsiteTarget } from "@/lib/diagnostic-target";
import { WebsiteCheckIntro } from "./WebsiteCheckIntro";
import { readDiagnosticReturn, saveDiagnosticReturn, type DiagnosticReturn } from "./_lib/action-return";
import { WebsiteResultExperience } from "./WebsiteResultExperience";

export default function WebsiteCheckClient({ dict, lang }: { dict:any; lang:"zh"|"en" }) {
  const zh = lang === "zh";
  const searchParams = useSearchParams();
  const { history, upsertHistory, deleteHistory, togglePin } = useDiagnosticHistory();
  const { domain, setDomain, result, error, failure, loading, localResolvers, runDiagnostic, restoreDiagnostic, phase, startedAt, cancel } = useWebsiteCheck();
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!loading || !startedAt) return;
    const update = () => setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    update(); const timer = setInterval(update, 1000); return () => clearInterval(timer);
  }, [loading, startedAt]);
  const [inputError, setInputError] = useState(false);
  const returnChecked = useRef(false);
  const [returnView, setReturnView] = useState<DiagnosticReturn | null>(null);
  const lastProcessedQuery = useRef<string | undefined>(undefined);
  const localeText = {
    heroTitles: { visitor:zh ? "连接环境检查":"Connection check", ip:zh ? "IP 诊断":"IP diagnostic", site:zh ? "网站诊断":"Website diagnostic" },
    heroSubtitle:zh ? "将 DNS · SSL · CDN · HTTP 一次看清。":"Inspect DNS, SSL, CDN and HTTP together.",
    analyzing:zh ? "诊断中":"Running",
    actions:{history:zh ? "历史 / 收藏":"History / favorites", noHistory:zh ? "暂无检测记录":"No recent checks",favorite:zh ? "收藏":"Favorite",unfavorite:zh ? "取消收藏":"Unfavorite",remove:zh ? "删除":"Remove"},
  };
  useEffect(() => {
    const query = searchParams.get("q") || searchParams.get("domain") || searchParams.get("target");
    const target = query ? normalizeTargetInput(query) : undefined;
    if (!returnChecked.current) {
      returnChecked.current = true;
      const saved = readDiagnosticReturn();
      if (saved) {
        lastProcessedQuery.current = target;
        restoreDiagnostic(saved);
        setReturnView(saved);
        return;
      }
    }
    if (!target) { lastProcessedQuery.current = undefined; return; }
    if (target !== lastProcessedQuery.current) { lastProcessedQuery.current = target; setDomain(target); void runDiagnostic(target); }
  }, [searchParams, setDomain, runDiagnostic, restoreDiagnostic]);
  useEffect(() => {
    if (!returnView || loading || (!result && !failure && !error)) return;
    const region = document.querySelector('[data-website-result]');
    if (!region) return;
    region.querySelectorAll<HTMLDetailsElement>('details').forEach((detail, index) => { detail.open = returnView.openDetails.includes(index); });
    const control = Array.from(region.querySelectorAll<HTMLElement>('[data-result-action]')).find(element => element.dataset.resultAction === returnView.actionId);
    control?.focus({preventScroll:true});
    const frame = requestAnimationFrame(() => { window.scrollTo({top:returnView.scrollY, behavior:"instant"}); setReturnView(null); });
    return () => cancelAnimationFrame(frame);
  }, [returnView, loading, result, failure, error]);
  const preserveReturn = (actionId: string) => {
    const region = document.querySelector('[data-website-result]');
    const openDetails = Array.from(region?.querySelectorAll<HTMLDetailsElement>('details') ?? []).flatMap((detail,index) => detail.open ? [index] : []);
    saveDiagnosticReturn({domain, result, error, failure, localResolvers, actionId, openDetails, scrollY:window.scrollY});
  };
  const handleSubmit = (event:React.FormEvent) => {
    event.preventDefault(); if (loading) return;
    const target = parseWebsiteTarget(domain); if (!target) { setInputError(true); return; }
    setInputError(false); void runDiagnostic(target, true);
  };
  const toggleFavorite = async (target:string) => { const item = history.find(e=>e.target===target); if(item) await togglePin(item); else await upsertHistory(target,true); };
  const removeHistory = (target:string) => deleteHistory(target);
  return <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-6 mb-10 z-20 relative font-sans">
      {/* Header and primary action */}
      <div className="mb-6">
        <div className="mx-auto mb-5 max-w-4xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              {result?.isVisitor ? localeText.heroTitles.visitor : result?.isActuallyIp ? localeText.heroTitles.ip : localeText.heroTitles.site}
            </h1>
            <Link href={`/${lang}/tools/api`} className="inline-flex min-h-10 items-center gap-2 text-sm font-medium text-[var(--accent-text)] hover:underline">
              <Terminal aria-hidden="true" className="h-4 w-4" />JSON API
            </Link>
          </div>

        </div>
        <div className="mx-auto max-w-4xl">
          <form onSubmit={handleSubmit}>
            <label htmlFor="website-target" className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">
              {lang === "zh" ? "域名或 URL" : "Domain or URL"}
            </label>
            <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-3 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-2">
                <Globe aria-hidden="true" className="ml-1 h-5 w-5 shrink-0 text-[var(--text-secondary)]" />
                <input id="website-target" type="text" required value={domain}
                  onChange={(e) => { setDomain(e.target.value); setInputError(false); }}
                  placeholder={dict.home.diagnostics_placeholder}
                  autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  aria-invalid={inputError || undefined}
                  aria-describedby={`website-data-note${inputError ? " website-input-error" : ""}`}
                  className="min-h-12 min-w-0 w-full rounded-lg border-none bg-transparent px-2 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
              </div>
              <button type="submit" disabled={loading} className="ui-button-primary min-h-12 shrink-0">
                {loading ? <Activity aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Zap aria-hidden="true" className="h-4 w-4" />}
                {loading ? localeText.analyzing : dict.home.diagnostics_btn}
              </button>
            </div>
            {inputError && <p id="website-input-error" role="alert" className="mt-2 text-sm text-[var(--danger-text)] dark:text-red-300">
              {lang === "zh" ? "请输入有效域名或 HTTP(S) URL，例如 example.com。" : "Enter a valid domain or HTTP(S) URL, such as example.com."}
            </p>}
            <p id="website-data-note" className="mt-3 text-[13px] leading-5 text-[var(--text-secondary)]">
              {lang === "zh"
                ? "仅域名发送至 OpsKitPro、Google、Cloudflare 和阿里 DNS；不含 URL 路径、参数或登录信息。"
                : "Only the hostname reaches OpsKitPro, Google, Cloudflare and AliDNS; URL paths, queries and credentials are omitted."}{" "}
              <Link href={`/${lang}/tools/docs#website-check`} className="font-semibold text-[var(--accent-text)] underline underline-offset-4">{lang === "zh" ? "数据处理说明" : "Data handling details"}</Link>
            </p>
          </form>

        </div>
      </div>


    {loading && <div className="mx-auto max-w-4xl rounded-lg border border-[var(--border-subtle)] p-4 text-sm text-[var(--text-secondary)]">
      <div className="flex items-center justify-between gap-3"><span role="status">{zh ? `检测中 · ${elapsed}秒` : `Checking · ${elapsed}s`}</span><button type="button" onClick={cancel} className="underline min-h-10">{zh ? "停止等待" : "Stop waiting"}</button></div>
      {elapsed >= 10 && <p>{zh ? "部分探测较慢，网络等待最多约30秒。" : "Some probes take longer; network wait is limited to about 30 seconds."}</p>}
    </div>}
    {phase === "cancelled" && <p role="status" className="mx-auto max-w-4xl text-sm">{zh ? "已停止等待此次检测。" : "Stopped waiting for this check."}</p>}
    {phase === "partial" && <p role="status" className="mx-auto max-w-4xl text-sm">{zh ? "已获得部分结果，可重新检测。" : "Partial results received. You can retry."}</p>}
    {!loading && (result || error || failure) && <WebsiteResultExperience key={result?.domain || failure?.target || domain} result={result} localResolvers={localResolvers} failure={failure || (error ? {target:result?.domain || domain,kind:"request",message:error}:null)} lang={lang} onNavigate={preserveReturn} onRetry={(target)=>void runDiagnostic(target,true)} />}
          <details className="mx-auto mt-6 max-w-4xl rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3">
            <summary className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[13px] font-medium text-[var(--text-secondary)]">
                <History aria-hidden="true" className="h-4 w-4 text-[var(--accent-text)]" />{localeText.actions.history}<ChevronDown aria-hidden="true" className="h-4 w-4" />
              </span>
              {history.length === 0 && <span className="text-[13px] text-[var(--text-secondary)]">{localeText.actions.noHistory}</span>}
            </summary>
            {history.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {history.map((entry) => (
                  <div
                    key={entry.target}
                    className="flex shrink-0 items-center overflow-hidden rounded-full border border-[var(--border-strong)] bg-[var(--surface-primary)]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDomain(entry.target);
                        runDiagnostic(entry.target);
                      }}
                      className="max-w-[180px] truncate px-3 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:text-[var(--accent-text)]"
                    >
                      {entry.target}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(entry.target)}
                      className={`border-l border-[var(--border-subtle)] px-2 py-2 ${entry.pinned ? "text-amber-500" : "text-[var(--text-secondary)] hover:text-amber-500"}`}
                      aria-label={
                        entry.pinned
                          ? localeText.actions.unfavorite
                          : localeText.actions.favorite
                      }
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${entry.pinned ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHistory(entry.target)}
                      className="border-l border-[var(--border-subtle)] px-2 py-2 text-[var(--text-secondary)] hover:text-red-500"
                      aria-label={localeText.actions.remove}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </details>
    {!result && !loading && !error && !failure && phase === "idle" && <WebsiteCheckIntro lang={lang} />}
  </main>;
}
