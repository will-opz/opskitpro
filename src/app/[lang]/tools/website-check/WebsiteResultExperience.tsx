"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, RefreshCw, Info, Monitor, Cloud, Server } from "lucide-react";
import { buildResultExperience, type RequestFailure } from "./_lib/result-experience";
import { buildResultExport } from "./_lib/result-export";
import styles from "./result-experience.module.css";

export function WebsiteResultExperience({ result, localResolvers, failure, lang, onRetry, onNavigate }: { result: any; localResolvers?: unknown; failure: RequestFailure | null; lang: "zh" | "en"; onRetry: (target: string) => void; onNavigate?: (actionId: string) => void }) {
  const zh = lang === "zh";
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(timer); }, []);
  const model = useMemo(() => buildResultExperience(result, failure, lang, now), [result, failure, lang, now]);
  const priority = model.actions[0]?.evidenceIds ?? [];
  const keyEvidence = model.evidence.filter(e => e.state === "observed").sort((a,b) => Number(priority.includes(b.id)) - Number(priority.includes(a.id)));
  const details = useRef<HTMLDetailsElement>(null);
  const [feedback, setFeedback] = useState("");
  const freshLabels = { current: zh ? "本次观测" : "Current", cached: zh ? "缓存结果" : "Cached result", stale: zh ? "已过期" : "Stale", unknown: zh ? "新鲜度未知" : "Freshness unknown" };
  const openDetail = (id: string) => {
    if (details.current) details.current.open = true;
    const section = document.getElementById(`result-${id}`) as HTMLDetailsElement | null;
    if (section) { section.open = true; section.querySelector("summary")?.focus(); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); setFeedback(zh ? "已复制" : "Copied"); } catch { setFeedback(zh ? "无法访问剪贴板，请手动复制。" : "Clipboard unavailable; copy manually."); } };
  const summary = [model.target, `${model.title}: ${model.summary}`, ...model.evidence.map(e => `${e.location} · ${e.source} · ${e.value} · ${e.time || "time unavailable"} · ${e.freshness}`), ...model.uncertainty, ...model.actions.map(a => `${a.label}: ${a.reason}`)].join("\n");
  // Preserve report keys; export the same assessment and evidence as the UI.
  const download = (format: "json" | "md") => {
    if (!result) return;
    const report = buildResultExport(result, model, lang);
    const content = format === "json" ? JSON.stringify(report, null, 2) : `# OpsKitPro Website Check

${summary}

## Raw evidence

\`\`\`json
${JSON.stringify(model.raw, null, 2)}
\`\`\``;
    const url = URL.createObjectURL(new Blob([content], { type: format === "json" ? "application/json" : "text/markdown" }));
    const a = document.createElement("a"); a.href = url; a.download = `opskitpro-${model.target}.${format}`; a.click(); URL.revokeObjectURL(url);
  };
  const rawGroups = [
    ["dns", zh ? "DNS 记录与解析器" : "DNS records and resolvers", { server: model.raw.dns, browserResolverQueries: localResolvers }],
    ["tls", zh ? "TLS 证书详情" : "TLS certificate details", model.raw.ssl],
    ["http", zh ? "HTTP 与观察点详情" : "HTTP and observation details", { http: model.raw.http, observations: result?.observations ?? model.raw.observations }],
    ["headers", zh ? "已采集响应头" : "Collected response headers", model.raw.securityHeaders],
    ["context", zh ? "CDN / 注册信息" : "CDN / registration context", { cdn: model.raw.cdn, whois: model.raw.whois, meta: result?.meta }],
  ] as const;
  return <section data-website-result className={styles.result} aria-label={zh ? "诊断结果" : "Diagnostic result"}>
    <header className={styles.assessment} data-state={model.state}>
      <div className={styles.eyebrow}>Assessment <span>{model.target}</span></div>
      <div className={styles.verdict}><h2>{model.title}</h2><span data-testid="http-freshness">{freshLabels[model.freshness]}</span></div>
      <p>{model.summary}</p>
    </header>
    <section aria-labelledby="key-evidence-title" className={styles.layer}>
      <h3 id="key-evidence-title">{zh ? "关键证据" : "Key evidence"}</h3>
      {keyEvidence.length === 0 && <p>{zh ? "尚未获得可判定的目标证据。" : "No conclusive target evidence returned."}</p>}
      <div className={styles.evidenceTable} role="list">
        {keyEvidence.map(e => { const Icon = { LOCAL:Monitor, EDGE:Cloud, REMOTE:Server }[e.location]; return <div role="listitem" key={e.id} className={styles.evidenceRow} data-evidence={e.id}>
          <span className={styles.location}><Icon size={13} aria-hidden="true" />{e.location}</span>
          <span className={styles.source}>{e.source}</span>
          <strong>{e.value}</strong>
          <span className={styles.time}>{e.time ? <>{e.timeScope === "report" ? zh ? "报告时间 " : "Report time " : zh ? "观测时间 " : "Observed "}<time dateTime={e.time}>{e.time.replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time></> : zh ? "时间未提供" : "Time not supplied"}<span>{freshLabels[e.freshness]}</span></span>
        </div>; })}
      </div>
      <p className={styles.note}>{zh ? "DNS / TLS 未提供独立时间戳，使用报告时间。" : "DNS/TLS have no individual timestamps; report time is shown."}</p>
    </section>
    {model.uncertainty.length > 0 && <section className={`${styles.layer} ${styles.uncertainty}`} aria-labelledby="uncertainty-title"><h3 id="uncertainty-title"><Info size={15} aria-hidden="true" />{zh ? "矛盾与不确定性" : "Conflicts & uncertainty"}</h3><ul>{model.uncertainty.map(s=><li key={s}>{s}</li>)}</ul></section>}
    <section className={styles.layer} aria-labelledby="next-action-title"><h3 id="next-action-title">{zh ? "下一步" : "Next action"}</h3><div className={styles.actions}>{model.actions.map(a=><div key={a.id}>{a.type === "navigate" ? <Link data-result-action={a.id} href={a.href} onClick={()=>onNavigate?.(a.id)}>{a.label}<ArrowRight size={14} aria-hidden="true" /></Link> : <button data-result-action={a.id} type="button" onClick={()=>a.type === "retry" ? onRetry(a.target.value) : openDetail(a.section)}>{a.type === "retry" && <RefreshCw size={14} aria-hidden="true" />}{a.label}</button>}<p>{a.reason}</p></div>)}</div></section>
    <details ref={details} className={styles.details}><summary>{zh ? "详情 · 原始数据与导出" : "Details · raw data and export"}</summary>
      <div className={styles.detailBody}>
        {rawGroups.map(([id,label,value])=><details key={id} id={`result-${id}`}><summary>{label}</summary>{id === "tls" && <p>{zh ? "证书字段与连接错误分开解释：未返回证书时，不将 valid=false 视为证书校验失败。" : "Certificate fields and connection errors differ: valid=false without certificate evidence does not establish an invalid certificate."}</p>}{id === "headers" && <p>{zh ? "不支持完整 HTTP headers：当前 API 仅返回选定安全头和部分 HTTP 字段。" : "Complete HTTP headers are not supported; this API returns selected security headers and HTTP fields."}</p>}<pre>{value ? JSON.stringify(value,null,2) : zh ? "未返回" : "Not returned"}</pre></details>)}
        <details><summary>{zh ? "原始响应 JSON" : "Raw response JSON"}</summary><pre>{JSON.stringify(model.raw, null, 2)}</pre><button onClick={()=>copy(JSON.stringify(model.raw,null,2))}>{zh ? "复制原始响应" : "Copy raw response"}</button></details>
        {failure && <p>{zh ? "诊断请求信息：" : "Diagnostic request: "}{failure.message}</p>}
        <details><summary>{zh ? "API 示例" : "API example"}</summary><p>{zh ? "公开 DNS API 会发起独立查询，不会返回本次诊断快照。" : "The public DNS API runs a separate query; it does not return this diagnostic snapshot."}</p><pre>{`curl -s 'https://opskitpro.com/api/tools/dns-lookup?domain=${encodeURIComponent(model.target)}'`}</pre><Link href={`/${lang}/tools/api#dns`}>{zh ? "参数、响应与调用限制 →" : "Parameters, responses and limits →"}</Link></details>
        <div className={styles.exportActions}><button onClick={()=>copy(summary)}>{zh ? "复制结果摘要" : "Copy result summary"}</button><button onClick={()=>{ const url = new URL(window.location.href); url.searchParams.set("q",model.target); void copy(url.toString()); }}>{zh ? "复制重新检测链接" : "Copy rerun link"}</button>{result && <><button onClick={()=>download("json")}>{zh ? "导出 JSON 报告" : "Export JSON report"}</button><button onClick={()=>download("md")}>{zh ? "导出 Markdown" : "Export Markdown"}</button></>}</div>
        <p className={styles.note}>{zh ? "链接会重新运行检测，不是永久结果快照。JSON 导出保留兼容字段；当前判断与页面一致，完整结果见 resultExperience。" : "Links rerun the diagnostic; they are not permanent result snapshots. JSON exports retain compatibility fields and match this assessment; full results are under resultExperience."}</p><p role="status">{feedback}</p>
      </div>
    </details>
  </section>;
}
