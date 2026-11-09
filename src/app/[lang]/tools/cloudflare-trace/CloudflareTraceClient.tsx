"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { startToolRun } from "@/lib/audience-client";
import { parseWebsiteTarget } from "@/lib/diagnostic-target";
import { buildTraceSummary, parseTraceText, traceSource, traceState, traceTime, type TraceSnapshot } from "@/lib/cloudflare-trace";
import { withinBudget } from "@/lib/request-budget";

function useTrace(mode: "my" | "target") {
  const [snapshot, setSnapshot] = useState<TraceSnapshot | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "done" | "error" | "cancelled">("idle");
  const [error, setError] = useState("");
  const active = useRef<{ controller: AbortController; finish?: ReturnType<typeof startToolRun>["finish"] } | null>(null);
  const stop = useCallback(() => { active.current?.controller.abort(); active.current?.finish?.("cancel"); active.current = null; }, []);
  const cancel = () => { stop(); setPhase("cancelled"); };
  const run = useCallback(async (userAction: boolean, target?: string) => {
    if (active.current) return;
    const controller = new AbortController();
    const usage = userAction ? startToolRun("cloudflare-trace") : null;
    const context = { controller, finish: usage?.finish }; active.current = context;
    const current = () => active.current === context;
    setPhase("loading"); setSnapshot(null); setError("");
    const timeout = AbortSignal.timeout(8000);
    const signal = AbortSignal.any([controller.signal, timeout]);
    try {
      const response = await withinBudget(fetch(mode === "my" ? "/cdn-cgi/trace" : `/api/trace?domain=${encodeURIComponent(target ?? "")}`, { signal, cache: "no-store" }), 8000, signal);
      const text = await withinBudget(response.text(), 8000, signal);
      if (!response.ok) {
        if (response.status === 429) throw new Error("rate_limit");
        let code = "unavailable";
        try { code = JSON.parse(text).error; } catch { /* Never expose raw error text. */ }
        throw new Error(code);
      }
      const trace = parseTraceText(text);
      if (!current()) return;
      setSnapshot({ trace, mode, target, receivedAt: new Date().toISOString() });
      setPhase("done"); usage?.finish("success");
    } catch (cause) {
      if (!current()) return;
      setError(timeout.aborted || (cause instanceof Error && cause.name === "TimeoutError") ? "timeout" : cause instanceof Error ? cause.message : "unavailable");
      setPhase("error"); usage?.finish("error");
    } finally {
      if (current()) active.current = null;
      controller.abort();
    }
  }, [mode]);
  useEffect(() => stop, [stop]);
  return { snapshot, phase, error, run, cancel };
}

const button = "min-h-10 rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm font-medium hover:bg-[var(--surface-secondary)]";
export default function CloudflareTraceClient({ lang }: { lang: "zh" | "en" }) {
  const zh = lang === "zh";
  const [tab, setTab] = useState<"my" | "target">("my");
  const [input, setInput] = useState("");
  const [invalid, setInvalid] = useState(false);
  const my = useTrace("my"); const target = useTrace("target");
  const { run: runMy } = my;
  useEffect(() => { void runMy(false); }, [runMy]);
  const state = tab === "my" ? my : target;
  const errorText = state.error === "timeout" ? (zh ? "等待超时，请重试。" : "Request timed out. Try again.")
    : state.error === "rate_limit" ? (zh ? "请求较多，请稍后重试。" : "Too many requests. Try again later.")
    : state.error === "blocked" || state.error === "invalid_target" ? (zh ? "此目标无法探测，请使用公网域名。" : "This target cannot be probed. Use a public hostname.")
    : state.error === "redirected" ? (zh ? "目标发生重定向，请使用最终域名重试。" : "The target redirected. Retry with its final hostname.")
    : (zh ? "未获取到有效的 Cloudflare Trace，可重试或更换目标。" : "No valid Cloudflare Trace received. Retry or check another target.");
  return <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
    <h1 className="mb-6 text-3xl font-semibold tracking-tight">Cloudflare Trace</h1>
    <div className="mb-5 inline-flex gap-1 rounded-xl border border-[var(--border-subtle)] p-1">
      {(["my", "target"] as const).map(mode => <button key={mode} type="button" aria-pressed={tab === mode} onClick={() => setTab(mode)} className={`${button} ${tab === mode ? "bg-[var(--surface-secondary)]" : "border-transparent"}`}>{mode === "my" ? zh ? "当前连接" : "Current connection" : zh ? "目标域名" : "Target domain"}</button>)}
    </div>
    {tab === "target" ? <form onSubmit={event => { event.preventDefault(); const hostname = parseWebsiteTarget(input); setInvalid(!hostname); if (hostname) void target.run(true, hostname); }} className="mb-5">
      <label htmlFor="trace-target" className="mb-2 block text-sm font-semibold">{zh ? "域名或 URL" : "Domain or URL"}</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input id="trace-target" value={input} onChange={event => { setInput(event.target.value); setInvalid(false); }} placeholder="example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-invalid={invalid || undefined} aria-describedby="trace-data-note" className="min-w-0 flex-1 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-4 py-3" />
        <button className="ui-button-primary" disabled={target.phase === "loading" || !input.trim()}>{zh ? "探测 Trace" : "Trace target"}</button>
      </div>
      {invalid && <p role="alert" className="mt-2 text-sm">{zh ? "请输入有效域名或 HTTP(S) URL。" : "Enter a valid hostname or HTTP(S) URL."}</p>}
      <p id="trace-data-note" className="mt-2 text-sm text-[var(--text-secondary)]">{zh ? "由 OpsKitPro 服务端访问目标；仅发送域名。" : "OpsKitPro probes the target server-side; only the hostname is sent."}</p>
    </form> : <div className="mb-4 flex items-center justify-between gap-3"><span className="text-sm text-[var(--text-secondary)]">{zh ? "当前浏览器 → OpsKitPro" : "This browser → OpsKitPro"}</span><button className={button} disabled={my.phase === "loading"} onClick={() => void my.run(true)}>{zh ? "刷新" : "Refresh"}</button></div>}
    {state.phase === "loading" && <div className="flex items-center justify-between gap-3"><p role="status">{zh ? "正在获取…" : "Loading…"}</p><button className={button} onClick={state.cancel}>{zh ? "停止等待" : "Stop waiting"}</button></div>}
    {state.phase === "cancelled" && <p role="status">{zh ? "已停止等待此次探测。" : "Stopped waiting for this probe."}</p>}
    {state.phase === "error" && <p role="alert" className="rounded-xl border border-[var(--border-subtle)] p-4 text-sm">{errorText}</p>}
    {state.phase === "done" && state.snapshot && <TraceResult key={`${tab}-${state.snapshot.receivedAt}`} snapshot={state.snapshot} lang={lang} />}
  </main>;
}

function TraceResult({ snapshot, lang }: { snapshot: TraceSnapshot; lang: "zh" | "en" }) {
  const zh = lang === "zh"; const { trace, mode } = snapshot;
  const [includeIp, setIncludeIp] = useState(false);
  const [includeTarget, setIncludeTarget] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const [failedText, setFailedText] = useState("");
  const preview = useRef<HTMLDetailsElement>(null);
  const summary = buildTraceSummary(snapshot, lang, { includeIp, includeTarget });
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); setFeedback(zh ? "已复制" : "Copied"); setCopyFailed(false); }
    catch { setFeedback(zh ? "剪贴板不可用，请在预览中手动复制。" : "Clipboard unavailable. Copy from the preview."); setCopyFailed(true); setFailedText(text); if (preview.current) preview.current.open = true; }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([summary], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "opskitpro-cloudflare-trace.txt"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback(zh ? "已发起下载" : "Download initiated");
  };
  const rows = [[zh ? "数据中心" : "Data center", trace.colo], [zh ? "出口 IP" : "Egress IP", trace.ip], [zh ? "出口 IP 地区" : "Egress IP region", trace.loc || "—"], ["HTTP", trace.http || "—"], ["TLS", trace.tls || "—"], ["WARP", traceState(trace.warp, zh)], ["Gateway", traceState(trace.gateway, zh)]];
  return <section aria-label={zh ? "Trace 结果" : "Trace result"} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 sm:p-5">
    <div className="mb-4 text-sm text-[var(--text-secondary)]"><p>{traceSource(mode, zh)}</p>{snapshot.target && <p className="break-all font-semibold text-[var(--text-primary)]">{snapshot.target}</p>}<p>{zh ? "观测" : "Observed"}: {traceTime(trace.ts)}</p></div>
    <dl className="grid gap-x-6 sm:grid-cols-2">{rows.map(([label, value]) => <div key={label} className="flex min-w-0 flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] py-3"><dt className="text-sm text-[var(--text-secondary)]">{label}</dt><dd className="break-all font-mono text-sm">{value}</dd></div>)}</dl>
    <details className="mt-4 text-sm"><summary className="cursor-pointer py-2">{zh ? "如何理解结果" : "About these results"}</summary><div className="space-y-2 py-2 text-[var(--text-secondary)]">
      <p>{mode === "my" ? zh ? "这是浏览器访问本站的单次请求。" : "This is one browser request to this site." : zh ? "出口 IP 属于 OpsKitPro 探测服务，不是你的 IP 或目标源站 IP。" : "The egress IP belongs to the OpsKitPro probe, not you or the target origin."}</p>
      <p>{zh ? "Colo 是处理请求的数据中心；异地节点本身不代表故障。地区来自出口 IP，不是精确位置。" : "Colo is the serving data center; a distant node alone is not a fault. Region refers to the egress IP, not a precise location."}</p>
      <p>{zh ? "HTTP / TLS 仅描述本次请求。WARP / Gateway 未启用不代表异常；缺失字段显示未知。" : "HTTP/TLS describe this request only. Disabled WARP/Gateway is neutral; missing values are unknown."}</p>
      <p>{zh ? "SNI 保留原始值；plaintext 不代表 HTTPS 内容未加密。" : "SNI retains its raw value; plaintext does not mean HTTPS content is unencrypted."}</p>
      <a href="https://developers.cloudflare.com/support/troubleshooting/general-troubleshooting/geographic-traffic-routing/" className="underline">{zh ? "Cloudflare 路由说明" : "Cloudflare routing documentation"}</a>
    </div></details>
    <div className="mt-4 flex flex-wrap gap-2"><button className="ui-button-primary" onClick={() => void copy(summary)}>{includeIp || includeTarget ? zh ? "复制所选摘要" : "Copy selected summary" : zh ? "复制脱敏摘要" : "Copy redacted summary"}</button><button className={button} onClick={download}>{zh ? "下载 TXT" : "Download TXT"}</button><button className={button} onClick={() => void copy(`${window.location.origin}/${lang}/tools/cloudflare-trace`)}>{zh ? "复制工具地址" : "Copy tool URL"}</button></div>
    <p role="status" className="mt-2 text-sm">{feedback}</p>
    <details ref={preview} className="mt-3 text-sm"><summary className="cursor-pointer py-2">{zh ? "分享预览与选项" : "Share preview and options"}</summary>
      <div className="my-3 flex flex-wrap gap-4"><label className="flex items-center gap-2"><input type="checkbox" checked={includeIp} onChange={e => { setIncludeIp(e.target.checked); setFeedback(""); }} />{zh ? "包含完整出口 IP" : "Include full egress IP"}</label>{mode === "target" && <label className="flex items-center gap-2"><input type="checkbox" checked={includeTarget} onChange={e => { setIncludeTarget(e.target.checked); setFeedback(""); }} />{zh ? "包含目标域名" : "Include target hostname"}</label>}</div>
      {(includeIp || includeTarget) && <p className="mb-2">{zh ? "所选信息将进入复制与下载内容。" : "Selected information is included in copies and downloads."}</p>}
      <textarea aria-label={zh ? "分享摘要预览" : "Share summary preview"} readOnly value={summary} rows={12} className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-sm" />
      {copyFailed && failedText !== summary && <textarea aria-label={zh ? "待复制文本" : "Text to copy"} readOnly value={failedText} className="mt-2 w-full border p-2" />}
      {copyFailed && <p>{zh ? "选择上方文本即可手动复制。" : "Select the text above to copy manually."}</p>}
    </details>
    <details className="mt-3 text-sm"><summary className="cursor-pointer py-2">{zh ? "高级 · 原始字段" : "Advanced · raw fields"}</summary><p className="py-2">{zh ? "接收时间" : "Received"}: {snapshot.receivedAt.replace("T", " ").replace("Z", " UTC")}</p><pre className="overflow-auto whitespace-pre-wrap break-all">{Object.entries(trace).map(([key,value]) => `${key}=${value}`).join("\n")}</pre></details>
  </section>;
}
