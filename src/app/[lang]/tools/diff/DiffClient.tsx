"use client";

import { Check, Clipboard, Eraser, FlaskConical, GitCompareArrows, ShieldCheck, SwitchCamera } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  DIFF_CHARACTER_LIMIT,
  DIFF_LINE_LIMIT,
  type DiffHunk,
  type DiffOptions,
  type DiffResponse,
  type DiffResult,
} from "./diff-contract";

type Lang = "en" | "zh";
type RunState = "idle" | "running" | "complete" | "timeout" | "worker_error";
type ViewMode = "unified" | "split";
type VisibleHunk = DiffHunk | { type: "omitted"; count: number };

const WORKER_TIMEOUT_MS = 1_500;
const CONTEXT_LINES = 3;

const samples = {
  oldText: `server:
  port: 3000
  cache: false
  region: nrt`,
  newText: `server:
  port: 8080
  cache: true
  region: nrt
  healthcheck: /health`,
};

const copy = {
  en: {
    eyebrow: "Local developer tool",
    title: "Text Diff",
    subtitle: "Compare two text versions line by line without sending either version to a server.",
    privacy: "Local processing · Both texts and the result stay in this browser",
    original: "Original text",
    updated: "New text",
    originalPlaceholder: "Paste the original text…",
    updatedPlaceholder: "Paste the new text…",
    compare: "Compare texts",
    comparing: "Comparing in an isolated worker…",
    swap: "Swap sides",
    sample: "Load example",
    clear: "Clear",
    options: "Comparison options",
    ignoreCase: "Ignore letter case",
    ignoreWhitespace: "Ignore trailing spaces and tabs",
    optionWarning: "Ignored differences are treated as unchanged and excluded from the counts.",
    results: "Difference result",
    unified: "Unified",
    split: "Side by side",
    idle: "Enter two texts, then compare them.",
    identical: "No line differences with the selected options.",
    timeout: "Comparison timed out. Reduce the input size or simplify repeated content, then try again.",
    workerError: "The isolated worker could not run. Refresh and try again.",
    added: "Added",
    deleted: "Deleted",
    unchanged: "Unchanged",
    blocks: "Change blocks",
    omitted: (count: number) => `${count} unchanged lines hidden`,
    emptyLine: "Empty line",
    oldLine: "Old line",
    newLine: "New line",
    copySummary: "Copy summary",
    copied: "Copied",
    copyFailed: "Copy failed",
    limit: (chars: number, lines: number) => `${chars.toLocaleString()} chars · ${lines.toLocaleString()} lines`,
    max: `Per side: ${DIFF_CHARACTER_LIMIT.toLocaleString()} characters and ${DIFF_LINE_LIMIT.toLocaleString()} lines maximum.`,
  },
  zh: {
    eyebrow: "本地开发工具",
    title: "文本对比",
    subtitle: "逐行对比两个文本版本，原文、新文本和结果都不会发送到服务器。",
    privacy: "本地处理 · 两侧文本和结果仅保留在当前浏览器",
    original: "原文本",
    updated: "新文本",
    originalPlaceholder: "粘贴原文本…",
    updatedPlaceholder: "粘贴新文本…",
    compare: "开始对比",
    comparing: "正在隔离 Worker 中对比…",
    swap: "交换两侧",
    sample: "加载示例",
    clear: "清空",
    options: "对比选项",
    ignoreCase: "忽略字母大小写",
    ignoreWhitespace: "忽略行尾空格与 Tab",
    optionWarning: "被忽略的差异会按未变化处理，不计入差异统计。",
    results: "差异结果",
    unified: "统一视图",
    split: "并排视图",
    idle: "输入两段文本后开始对比。",
    identical: "按当前选项未发现行级差异。",
    timeout: "对比超时。请减少输入或简化大量重复内容后重试。",
    workerError: "隔离 Worker 无法运行，请刷新后重试。",
    added: "新增",
    deleted: "删除",
    unchanged: "未变化",
    blocks: "变化块",
    omitted: (count: number) => `已折叠 ${count} 行未变化内容`,
    emptyLine: "空行",
    oldLine: "原行号",
    newLine: "新行号",
    copySummary: "复制摘要",
    copied: "已复制",
    copyFailed: "复制失败",
    limit: (chars: number, lines: number) => `${chars.toLocaleString()} 字符 · ${lines.toLocaleString()} 行`,
    max: `每侧最多 ${DIFF_CHARACTER_LIMIT.toLocaleString()} 字符、${DIFF_LINE_LIMIT.toLocaleString()} 行。`,
  },
} as const;

function createDiffWorker() {
  return new Worker(new URL("./diff-worker.ts", import.meta.url), { type: "module" });
}

function countLines(value: string) {
  return value === "" ? 0 : value.replace(/\r\n?/g, "\n").split("\n").length;
}

function buildVisibleHunks(hunks: DiffHunk[]): VisibleHunk[] {
  return hunks.flatMap<VisibleHunk>((hunk) => {
    if (hunk.type !== "equal" || hunk.oldLines.length <= CONTEXT_LINES * 2 + 2) return [hunk];
    const hiddenCount = hunk.oldLines.length - CONTEXT_LINES * 2;
    return [
      { type: "equal" as const, oldLines: hunk.oldLines.slice(0, CONTEXT_LINES), newLines: hunk.newLines.slice(0, CONTEXT_LINES) },
      { type: "omitted" as const, count: hiddenCount },
      { type: "equal" as const, oldLines: hunk.oldLines.slice(-CONTEXT_LINES), newLines: hunk.newLines.slice(-CONTEXT_LINES) },
    ];
  });
}

function LineContent({ value, emptyLabel }: { value: string; emptyLabel: string }) {
  return value === "" ? <span className="italic text-[var(--text-faint)]">↵ <span className="sr-only">{emptyLabel}</span></span> : <>{value}</>;
}

export default function DiffClient({ lang }: { lang: Lang }) {
  const text = copy[lang];
  const [oldText, setOldText] = useState("");
  const [newText, setNewText] = useState("");
  const [options, setOptions] = useState<DiffOptions>({ ignoreCase: false, ignoreTrailingWhitespace: false });
  const [view, setView] = useState<ViewMode>("unified");
  const [state, setState] = useState<RunState>("idle");
  const [result, setResult] = useState<DiffResult | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const requestId = useRef(0);

  const stopWorker = () => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  useEffect(() => () => stopWorker(), []);

  const invalidate = () => {
    requestId.current += 1;
    stopWorker();
    setResult(null);
    setState("idle");
    setCopyState("idle");
  };

  const runComparison = () => {
    invalidate();
    const currentId = requestId.current;
    let worker: Worker;
    try {
      worker = createDiffWorker();
    } catch {
      setState("worker_error");
      return;
    }
    workerRef.current = worker;
    setState("running");
    timeoutRef.current = window.setTimeout(() => {
      worker.terminate();
      workerRef.current = null;
      if (requestId.current === currentId) {
        setResult(null);
        setState("timeout");
      }
    }, WORKER_TIMEOUT_MS);

    worker.onmessage = (event: MessageEvent<DiffResponse>) => {
      if (event.data.id !== currentId || requestId.current !== currentId) return;
      stopWorker();
      setResult(event.data.result);
      setState("complete");
    };
    worker.onerror = () => {
      if (requestId.current !== currentId) return;
      stopWorker();
      setResult(null);
      setState("worker_error");
    };
    worker.postMessage({ id: currentId, oldText, newText, options });
  };

  const visibleHunks = useMemo(() => result?.ok ? buildVisibleHunks(result.hunks) : [], [result]);
  const resultMessage = state === "idle" ? text.idle
    : state === "running" ? text.comparing
      : state === "timeout" ? text.timeout
        : state === "worker_error" ? text.workerError
          : result?.ok ? (result.different ? `${text.added} ${result.stats.additions} · ${text.deleted} ${result.stats.deletions}` : text.identical)
            : result?.message ?? text.workerError;

  const changeOption = (key: keyof DiffOptions) => {
    setOptions((current) => ({ ...current, [key]: !current[key] }));
    invalidate();
  };

  const swap = () => {
    setOldText(newText);
    setNewText(oldText);
    invalidate();
  };

  const loadSample = () => {
    setOldText(samples.oldText);
    setNewText(samples.newText);
    invalidate();
  };

  const clear = () => {
    setOldText("");
    setNewText("");
    invalidate();
  };

  const copySummary = async () => {
    if (!result?.ok) return;
    const summary = `${text.added}: ${result.stats.additions}\n${text.deleted}: ${result.stats.deletions}\n${text.unchanged}: ${result.stats.unchanged}\n${text.blocks}: ${result.stats.changeBlocks}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1_800);
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-12">
      <section className="max-w-3xl">
        <div className="ui-chip mb-4"><GitCompareArrows className="h-3.5 w-3.5" />{text.eyebrow}</div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">{text.title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--text-muted)] sm:text-base">{text.subtitle}</p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[0.06] px-3 py-2 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />{text.privacy}
        </div>
      </section>

      <section className="mt-8 ui-surface-elevated rounded-2xl p-4 sm:p-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {([
            ["diff-old", text.original, text.originalPlaceholder, oldText, setOldText],
            ["diff-new", text.updated, text.updatedPlaceholder, newText, setNewText],
          ] as const).map(([id, label, placeholder, value, setter]) => (
            <div key={id} className="min-w-0">
              <div className="flex items-end justify-between gap-3">
                <label htmlFor={id} className="text-sm font-semibold text-[var(--text-primary)]">{label}</label>
                <span className="text-xs tabular-nums text-[var(--text-muted)]">{text.limit(value.length, countLines(value))}</span>
              </div>
              <textarea
                id={id}
                value={value}
                onChange={(event) => { setter(event.target.value); invalidate(); }}
                placeholder={placeholder}
                spellCheck={false}
                className="mt-2 min-h-64 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
              />
            </div>
          ))}
        </div>

        <p className="mt-3 text-xs text-[var(--text-muted)]">{text.max}</p>
        <fieldset className="mt-5">
          <legend className="text-sm font-semibold text-[var(--text-primary)]">{text.options}</legend>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-3">
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={options.ignoreCase} onChange={() => changeOption("ignoreCase")} className="h-4 w-4 rounded border-zinc-300 text-emerald-600" />
              {text.ignoreCase}
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-[var(--text-secondary)]">
              <input type="checkbox" checked={options.ignoreTrailingWhitespace} onChange={() => changeOption("ignoreTrailingWhitespace")} className="h-4 w-4 rounded border-zinc-300 text-emerald-600" />
              {text.ignoreWhitespace}
            </label>
          </div>
          {(options.ignoreCase || options.ignoreTrailingWhitespace) && <p className="mt-1 text-xs text-amber-700">{text.optionWarning}</p>}
        </fieldset>

        <div className="mt-5 flex flex-wrap gap-2">
          <button type="button" onClick={runComparison} disabled={state === "running"} className="ui-button-primary min-h-11 px-4 text-sm"><GitCompareArrows className="h-4 w-4" />{state === "running" ? text.comparing : text.compare}</button>
          <button type="button" onClick={swap} className="ui-button-secondary min-h-11 px-4 text-sm"><SwitchCamera className="h-4 w-4" />{text.swap}</button>
          <button type="button" onClick={loadSample} className="ui-button-ghost min-h-11 border border-[var(--border-subtle)] px-4 text-sm"><FlaskConical className="h-4 w-4" />{text.sample}</button>
          <button type="button" onClick={clear} className="ui-button-ghost min-h-11 border border-[var(--border-subtle)] px-4 text-sm"><Eraser className="h-4 w-4" />{text.clear}</button>
        </div>
      </section>

      <section className="mt-6 ui-surface rounded-2xl p-4 sm:p-6" aria-labelledby="diff-results-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="diff-results-title" className="text-lg font-semibold text-[var(--text-primary)]">{text.results}</h2>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label={text.results}>
            {(["unified", "split"] as const).map((mode) => (
              <button key={mode} type="button" role="tab" aria-selected={view === mode} onClick={() => setView(mode)} className={`min-h-10 rounded-xl border px-3 text-xs font-semibold ${view === mode ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>{text[mode]}</button>
            ))}
          </div>
        </div>

        <div aria-live="polite" className={`mt-4 rounded-xl border p-3 text-sm ${state === "timeout" || state === "worker_error" || (result && !result.ok) ? "border-amber-500/25 bg-amber-500/[0.06] text-amber-800" : "border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]"}`}>{resultMessage}</div>

        {result?.ok && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {([[text.added, result.stats.additions, "text-emerald-700"], [text.deleted, result.stats.deletions, "text-red-700"], [text.unchanged, result.stats.unchanged, "text-zinc-700"], [text.blocks, result.stats.changeBlocks, "text-amber-700"]] as const).map(([label, value, color]) => (
                <div key={label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className={`mt-1 text-xl font-semibold tabular-nums ${color}`}>{value}</p></div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={copySummary} className="ui-button-ghost min-h-10 border border-[var(--border-subtle)] px-3 text-xs">{copyState === "copied" ? <Check className="h-4 w-4 text-emerald-600" /> : <Clipboard className="h-4 w-4" />}{copyState === "copied" ? text.copied : copyState === "failed" ? text.copyFailed : text.copySummary}</button>
            </div>

            <div role="tabpanel" className="mt-4 max-h-[42rem] overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)]">
              {view === "unified" ? (
                <div className="min-w-[34rem] font-mono text-xs leading-6 sm:text-sm">
                  {visibleHunks.map((hunk, hunkIndex) => hunk.type === "omitted" ? (
                    <div key={`omitted-${hunkIndex}`} className="border-y border-[var(--border-subtle)] bg-sky-50 px-3 py-1 text-center font-sans text-xs text-sky-700">{text.omitted(hunk.count)}</div>
                  ) : hunk.type === "equal" ? hunk.newLines.map((line, index) => (
                    <div key={`equal-${hunkIndex}-${line.lineNumber}`} className="grid grid-cols-[3rem_3rem_1.5rem_minmax(0,1fr)] text-[var(--text-secondary)]"><span className="select-none border-r border-[var(--border-subtle)] px-2 text-right text-[var(--text-faint)]">{hunk.oldLines[index]?.lineNumber}</span><span className="select-none border-r border-[var(--border-subtle)] px-2 text-right text-[var(--text-faint)]">{line.lineNumber}</span><span className="select-none text-center"> </span><code className="whitespace-pre-wrap break-words px-2"><LineContent value={line.text} emptyLabel={text.emptyLine} /></code></div>
                  )) : <div key={`change-${hunkIndex}`}>
                    {hunk.oldLines.map((line) => <div key={`remove-${line.lineNumber}`} className="grid grid-cols-[3rem_3rem_1.5rem_minmax(0,1fr)] bg-red-50 text-red-950"><span className="select-none border-r border-red-100 px-2 text-right text-red-500">{line.lineNumber}</span><span className="border-r border-red-100" /><span className="select-none text-center font-semibold">−</span><code className="whitespace-pre-wrap break-words px-2"><LineContent value={line.text} emptyLabel={text.emptyLine} /></code></div>)}
                    {hunk.newLines.map((line) => <div key={`add-${line.lineNumber}`} className="grid grid-cols-[3rem_3rem_1.5rem_minmax(0,1fr)] bg-emerald-50 text-emerald-950"><span className="border-r border-emerald-100" /><span className="select-none border-r border-emerald-100 px-2 text-right text-emerald-600">{line.lineNumber}</span><span className="select-none text-center font-semibold">+</span><code className="whitespace-pre-wrap break-words px-2"><LineContent value={line.text} emptyLabel={text.emptyLine} /></code></div>)}
                  </div>)}
                </div>
              ) : (
                <div className="min-w-[48rem] font-mono text-xs leading-6 sm:text-sm">
                  {visibleHunks.map((hunk, hunkIndex) => hunk.type === "omitted" ? (
                    <div key={`omitted-${hunkIndex}`} className="border-y border-[var(--border-subtle)] bg-sky-50 px-3 py-1 text-center font-sans text-xs text-sky-700">{text.omitted(hunk.count)}</div>
                  ) : Array.from({ length: Math.max(hunk.oldLines.length, hunk.newLines.length) }, (_, index) => {
                    const oldLine = hunk.oldLines[index];
                    const newLine = hunk.newLines[index];
                    const changed = hunk.type === "change";
                    return <div key={`split-${hunkIndex}-${index}`} className="grid grid-cols-2 border-b border-[var(--border-subtle)] last:border-b-0">
                      <div className={`grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] ${changed && oldLine ? "bg-red-50 text-red-950" : "text-[var(--text-secondary)]"}`}><span aria-label={text.oldLine} className="select-none border-r border-[var(--border-subtle)] px-2 text-right text-[var(--text-faint)]">{oldLine?.lineNumber ?? ""}</span><code className="whitespace-pre-wrap break-words px-2">{oldLine ? <LineContent value={oldLine.text} emptyLabel={text.emptyLine} /> : ""}</code></div>
                      <div className={`grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] border-l border-[var(--border-subtle)] ${changed && newLine ? "bg-emerald-50 text-emerald-950" : "text-[var(--text-secondary)]"}`}><span aria-label={text.newLine} className="select-none border-r border-[var(--border-subtle)] px-2 text-right text-[var(--text-faint)]">{newLine?.lineNumber ?? ""}</span><code className="whitespace-pre-wrap break-words px-2">{newLine ? <LineContent value={newLine.text} emptyLabel={text.emptyLine} /> : ""}</code></div>
                    </div>;
                  }))}
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
