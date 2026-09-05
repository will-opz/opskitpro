"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Clipboard, Eraser, FlaskConical } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import {
  REGEX_PATTERN_LIMIT,
  REGEX_TEXT_LIMIT,
  type RegexResponse,
  type RegexResult,
} from "./regex-engine";

type Lang = "en" | "zh";
type RunState = "idle" | "running" | "timeout" | "worker_error" | "complete";

const FLAG_OPTIONS = ["g", "i", "m", "s", "u", "y"] as const;
const WORKER_TIMEOUT_MS = 400;

const copy = {
  en: {
    eyebrow: "Local security tool",
    title: "Regex Tester",
    subtitle: "Test JavaScript regular expressions, inspect capture groups, and keep every character in this browser.",
    privacy: "Local processing · Your pattern and test text are not uploaded",
    dialect: "JavaScript RegExp syntax. Enter the pattern without surrounding /slashes/.",
    pattern: "Regular expression",
    patternPlaceholder: "e.g. (\\w+)@(\\w+\\.\\w+)",
    flags: "Flags",
    testText: "Test text",
    textPlaceholder: "Paste or type text to test…",
    loadExample: "Load example",
    clear: "Clear",
    results: "Match results",
    idle: "Enter a pattern and test text to begin.",
    running: "Testing safely in an isolated worker…",
    timeout: "Execution timed out. The expression may cause excessive backtracking.",
    workerError: "The isolated worker could not run. Refresh and try again.",
    noMatches: "No matches found.",
    matches: (count: number) => `${count} match${count === 1 ? "" : "es"}`,
    truncated: "Showing the first 500 matches.",
    highlighted: "Highlighted text",
    details: "Match details",
    fullMatch: "Full match",
    groups: "Capture groups",
    noGroups: "No capture groups",
    zeroLength: "Zero-length match",
    index: "JavaScript index",
    copySummary: "Copy match summary",
    copied: "Copied",
    copyFailed: "Clipboard access failed",
    limit: (current: number, max: number) => `${current.toLocaleString()} / ${max.toLocaleString()}`,
  },
  zh: {
    eyebrow: "本地安全工具",
    title: "正则表达式测试器",
    subtitle: "测试 JavaScript 正则表达式、查看捕获组，所有输入始终留在当前浏览器。",
    privacy: "本地处理 · 表达式和测试文本不会上传",
    dialect: "使用 JavaScript RegExp 语法，请勿输入两侧的 /斜杠/。",
    pattern: "正则表达式",
    patternPlaceholder: "例如：(\\w+)@(\\w+\\.\\w+)",
    flags: "标志",
    testText: "测试文本",
    textPlaceholder: "粘贴或输入需要测试的文本…",
    loadExample: "载入示例",
    clear: "清空",
    results: "匹配结果",
    idle: "输入表达式和测试文本后开始。",
    running: "正在隔离 Worker 中安全执行…",
    timeout: "执行超时，表达式可能存在过度回溯。",
    workerError: "隔离 Worker 无法运行，请刷新后重试。",
    noMatches: "没有找到匹配项。",
    matches: (count: number) => `发现 ${count} 处匹配`,
    truncated: "仅显示前 500 处匹配。",
    highlighted: "高亮文本",
    details: "匹配详情",
    fullMatch: "完整匹配",
    groups: "捕获组",
    noGroups: "没有捕获组",
    zeroLength: "零长度匹配",
    index: "JavaScript 索引",
    copySummary: "复制匹配摘要",
    copied: "已复制",
    copyFailed: "无法访问剪贴板",
    limit: (current: number, max: number) => `${current.toLocaleString()} / ${max.toLocaleString()}`,
  },
} as const;

function createRegexWorker() {
  return new Worker(new URL("./regex-worker.ts", import.meta.url), { type: "module" });
}

function HighlightedText({ text, result }: { text: string; result: RegexResult | null }) {
  if (!result?.ok || result.matches.length === 0) {
    return <span>{text}</span>;
  }

  const pieces: React.ReactNode[] = [];
  let cursor = 0;
  result.matches.forEach((match, index) => {
    if (match.zeroLength) return;
    if (match.index > cursor) pieces.push(<span key={`plain-${cursor}`}>{text.slice(cursor, match.index)}</span>);
    pieces.push(
      <mark key={`match-${index}`} className="rounded bg-amber-200 px-0.5 text-amber-950 ring-1 ring-amber-400/40">
        {text.slice(match.index, match.end)}
      </mark>,
    );
    cursor = Math.max(cursor, match.end);
  });
  if (cursor < text.length) pieces.push(<span key={`plain-${cursor}`}>{text.slice(cursor)}</span>);
  return <>{pieces}</>;
}

export default function RegexTesterClient({ lang }: { lang: Lang }) {
  const text = copy[lang];
  const [pattern, setPattern] = useState("");
  const [testText, setTestText] = useState("");
  const [flags, setFlags] = useState<string[]>(["g"]);
  const [state, setState] = useState<RunState>("idle");
  const [result, setResult] = useState<RegexResult | null>(null);
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");
  const requestId = useRef(0);

  const flagString = FLAG_OPTIONS.filter((flag) => flags.includes(flag)).join("");

  useEffect(() => {
    if (!pattern || !testText) {
      setState("idle");
      setResult(null);
      return;
    }

    const currentId = requestId.current + 1;
    requestId.current = currentId;
    let activeWorker: Worker | null = null;
    let activeTimeout: number | null = null;
    const debounce = window.setTimeout(() => {
      let worker: Worker;
      try {
        worker = createRegexWorker();
      } catch {
        setState("worker_error");
        return;
      }
      activeWorker = worker;
      setState("running");
      const timeout = window.setTimeout(() => {
        worker.terminate();
        if (requestId.current === currentId) {
          setResult(null);
          setState("timeout");
        }
      }, WORKER_TIMEOUT_MS);
      activeTimeout = timeout;

      worker.onmessage = (event: MessageEvent<RegexResponse>) => {
        if (event.data.id !== currentId || requestId.current !== currentId) return;
        window.clearTimeout(timeout);
        setResult(event.data.result);
        setState("complete");
        worker.terminate();
      };
      worker.onerror = () => {
        if (requestId.current !== currentId) return;
        window.clearTimeout(timeout);
        setResult(null);
        setState("worker_error");
        worker.terminate();
      };
      worker.postMessage({ id: currentId, pattern, flags: flagString, text: testText });
    }, 180);

    return () => {
      window.clearTimeout(debounce);
      if (activeTimeout !== null) window.clearTimeout(activeTimeout);
      activeWorker?.terminate();
    };
  }, [flagString, pattern, testText]);

  const summary = useMemo(() => {
    if (!result?.ok) return "";
    return result.matches.map((match, index) => {
      const groups = match.groups.length
        ? ` | ${match.groups.map((group) => `${group.name}=${group.value ?? "undefined"}`).join(", ")}`
        : "";
      return `${index + 1}. [${match.index}-${match.end}] ${match.value || "(zero-length)"}${groups}`;
    }).join("\n");
  }, [result]);

  const toggleFlag = (flag: string) => {
    setFlags((current) => current.includes(flag) ? current.filter((item) => item !== flag) : [...current, flag]);
  };

  const loadExample = () => {
    setPattern("(?<user>[\\w.+-]+)@(?<domain>[\\w.-]+\\.[A-Za-z]{2,})");
    setFlags(["g", "i"]);
    setTestText("Contact ops@example.com or security@opskitpro.com for help.\n中文测试：hello@example.cn");
  };

  const clear = () => {
    requestId.current += 1;
    setPattern("");
    setTestText("");
    setFlags(["g"]);
    setResult(null);
    setState("idle");
    setCopyStatus("idle");
  };

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
    window.setTimeout(() => setCopyStatus("idle"), 1800);
  };

  const statusMessage = state === "idle" ? text.idle
    : state === "running" ? text.running
      : state === "timeout" ? text.timeout
        : state === "worker_error" ? text.workerError
          : result?.ok ? (result.matches.length ? text.matches(result.matches.length) : text.noMatches)
            : result?.message ?? text.idle;

  return (
    <main className="tool-page">
      <ToolPageHeader title={text.title} description={text.subtitle} processing={text.privacy} />

      <section className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <label htmlFor="regex-pattern" className="text-sm font-semibold text-[var(--text-primary)]">{text.pattern}</label>
          <div className="mt-2 flex min-h-12 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] focus-within:border-emerald-500/50 focus-within:ring-2 focus-within:ring-emerald-500/10">
            <span className="pl-3 font-mono text-[var(--text-faint)]" aria-hidden="true">/</span>
            <input id="regex-pattern" value={pattern} maxLength={REGEX_PATTERN_LIMIT} onChange={(event) => setPattern(event.target.value)} placeholder={text.patternPlaceholder} spellCheck={false} className="min-w-0 flex-1 bg-transparent px-2 py-3 font-mono text-sm text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]" />
            <span className="pr-3 font-mono text-[var(--text-faint)]" aria-hidden="true">/{flagString}</span>
          </div>
          <div className="mt-2 flex items-start justify-between gap-3 text-xs text-[var(--text-muted)]">
            <p>{text.dialect}</p><span className="shrink-0 tabular-nums">{text.limit(pattern.length, REGEX_PATTERN_LIMIT)}</span>
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold text-[var(--text-primary)]">{text.flags}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLAG_OPTIONS.map((flag) => (
                <button key={flag} type="button" aria-pressed={flags.includes(flag)}
                    title={({g:"Global",i:"Ignore case",m:"Multiline",s:"Dot all",u:"Unicode",y:"Sticky"} as Record<string,string>)[flag]} onClick={() => toggleFlag(flag)} className={`min-h-11 min-w-11 rounded-xl border px-3 font-mono text-sm font-semibold transition ${flags.includes(flag) ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"}`}>{flag}</button>
              ))}
            </div>
          </fieldset>

          <div className="mt-5 flex items-end justify-between gap-3">
            <label htmlFor="regex-text" className="text-sm font-semibold text-[var(--text-primary)]">{text.testText}</label>
            <span className="text-xs tabular-nums text-[var(--text-muted)]">{text.limit(testText.length, REGEX_TEXT_LIMIT)}</span>
          </div>
          <textarea id="regex-text" value={testText} maxLength={REGEX_TEXT_LIMIT} onChange={(event) => setTestText(event.target.value)} placeholder={text.textPlaceholder} spellCheck={false} className="mt-2 min-h-48 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10" />
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={loadExample} className="ui-button-primary min-h-11 px-4 text-sm"><FlaskConical className="h-4 w-4" />{text.loadExample}</button>
            <button type="button" onClick={clear} className="ui-button-ghost min-h-11 border border-[var(--border-subtle)] px-4 text-sm"><Eraser className="h-4 w-4" />{text.clear}</button>
          </div>
        </div>

        <div className="ui-surface rounded-2xl p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{text.results}</h2>
            {result?.ok && result.matches.length > 0 && (
              <button type="button" onClick={copySummary} className="ui-button-ghost min-h-10 border border-[var(--border-subtle)] px-3 text-xs">
                {copyStatus === "copied" ? <Check className="h-4 w-4 text-[var(--accent-text)]" /> : <Clipboard className="h-4 w-4" />}
                {copyStatus === "copied" ? text.copied : copyStatus === "failed" ? text.copyFailed : text.copySummary}
              </button>
            )}
          </div>
          <div aria-live="polite" className={`mt-4 rounded-xl border p-3 text-sm ${state === "timeout" || state === "worker_error" || (result && !result.ok) ? "border-amber-500/25 bg-amber-500/[0.06] text-[var(--warning-text)]" : "border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-[var(--text-secondary)]"}`}>
            {statusMessage}{result?.ok && result.truncated ? ` ${text.truncated}` : ""}
          </div>

          {testText && <div className="mt-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{text.highlighted}</h3>
            <pre data-testid="regex-highlight" className="mt-2 max-h-72 min-h-24 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm leading-6 text-[var(--text-secondary)]"><HighlightedText text={testText} result={result} /></pre>
          </div>}

          {result?.ok && result.matches.length > 0 && <div className="mt-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{text.details}</h3>
            {result?.ok && result.matches.length > 0 ? (
              <ol className="mt-3 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
                {result.matches.map((match, index) => (
                  <li key={`${match.index}-${index}`} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--text-primary)]">#{index + 1} · {text.index} {match.index}–{match.end}</span>
                      {match.zeroLength && <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-[var(--warning-text)]">{text.zeroLength}</span>}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[var(--text-muted)]">{text.fullMatch}</p>
                    <code className="mt-1 block overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-[var(--surface-secondary)] p-2 text-xs text-[var(--text-primary)]">{match.value || "∅"}</code>
                    <p className="mt-3 text-xs font-semibold text-[var(--text-muted)]">{text.groups}</p>
                    {match.groups.length ? (
                      <div className="mt-1 space-y-1">
                        {match.groups.map((group, groupIndex) => <p key={`${group.name}-${groupIndex}`} className="break-words font-mono text-xs text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">{group.name}:</span> {group.value ?? "undefined"}</p>)}
                      </div>
                    ) : <p className="mt-1 text-xs text-[var(--text-muted)]">{text.noGroups}</p>}
                  </li>
                ))}
              </ol>
            ) : null}
          </div>}
        </div>
      </section>
    </main>
  );
}
