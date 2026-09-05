"use client";

import { AlertTriangle, Clipboard, RefreshCw, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { formatSql } from "./sql-engine";

type Lang = "en" | "zh";

const copy = {
  en: {
    eyebrow: "Local formatting utility",
    title: "SQL Formatter",
    subtitle: "Format SQL text locally to improve readability and reduce review noise.",
    privacy: "Local processing · SQL text never uploads",
    inputLabel: "SQL input",
    inputHelp: "Paste SQL text from scripts, consoles, or logs.",
    formatButton: "Format SQL",
    formatting: "Formatting…",
    clearButton: "Clear",
    outputLabel: "Formatted SQL",
    noOutput: "No formatted result yet.",
    copyButton: "Copy formatted SQL",
    copied: "Copied",
    copyFailed: "Clipboard access failed",
    outputInfo: "Output is formatted in your browser and not saved to any server.",
    unknownError: "Unable to format current SQL.",
    errors: {
      empty_input: "Input cannot be empty.",
      parse_error: "The SQL text could not be parsed.",
      unterminated_string: "Found an unterminated quoted string.",
      unterminated_comment: "Found an unterminated block comment.",
      unmatched_parentheses: "Brackets are unbalanced.",
      format_failed: "Unable to generate formatted output.",
    },
    warning: "This formatter is heuristic and does not cover every SQL dialect.",
  },
  zh: {
    eyebrow: "本地格式化工具",
    title: "SQL 格式化器",
    subtitle: "在浏览器本地格式化 SQL，提升可读性并减少审阅噪音。",
    privacy: "本地处理 · SQL 不会上传",
    inputLabel: "SQL 输入",
    inputHelp: "从脚本、控制台或日志中粘贴 SQL 文本。",
    formatButton: "开始格式化",
    formatting: "格式化中…",
    clearButton: "清空",
    outputLabel: "格式化结果",
    noOutput: "尚未生成格式化结果。",
    copyButton: "复制格式化 SQL",
    copied: "已复制",
    copyFailed: "复制失败",
    outputInfo: "结果仅在本浏览器生成，不会上传到任何服务端。",
    unknownError: "当前 SQL 无法完成格式化。",
    errors: {
      empty_input: "输入不能为空。",
      parse_error: "无法解析当前 SQL。",
      unterminated_string: "发现未闭合字符串引号。",
      unterminated_comment: "发现未闭合块注释。",
      unmatched_parentheses: "括号不匹配。",
      format_failed: "无法生成格式化结果。",
    },
    warning: "本工具采用启发式规则，不保证完全兼容所有 SQL 方言。",
  },
} as const;

type State = "idle" | "running" | "done" | "error";

export default function SqlFormatterClient({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [input, setInput] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [state, setState] = useState<State>("idle");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state !== "error") return;
    const timer = window.setTimeout(() => setError(""), 2200);
    return () => window.clearTimeout(timer);
  }, [state]);

  const statusText = state === "running" ? t.formatting : "";

  const handleFormat = () => {
    setState("running");
    const formatted = formatSql(input);
    if (!formatted.ok) {
      setResult("");
      setError(t.errors[formatted.error as keyof typeof t.errors] ?? t.unknownError);
      setState("error");
      return;
    }
    setResult(formatted.formatted);
    setError("");
    setState("done");
  };

  const clearAll = () => {
    setInput("");
    setResult("");
    setError("");
    setState("idle");
  };

  const copyOutput = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1500);
  };

  return (
    <main className="tool-page">
      <ToolPageHeader title={t.title} description={t.subtitle} processing={t.privacy} />

      <section className="tool-grid">
        <article className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <div className="mb-2 flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{t.inputLabel}</p>
            <span className="text-xs text-[var(--text-muted)]">{t.eyebrow}</span>
          </div>
          <p className="text-xs leading-5 text-[var(--text-muted)]">{t.inputHelp}</p>

          <label className="sr-only" htmlFor="sql-input">
            {t.inputLabel}
          </label>
          <textarea
            id="sql-input"
            rows={9}
            spellCheck={false}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              if (state !== "running") {
                setState("idle");
                setError("");
              }
            }}
            placeholder="SELECT id,name FROM users WHERE status='active' AND score>=100 ORDER BY created_at DESC;"
            className="mt-3 min-h-64 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm leading-6 outline-none focus:border-emerald-500/50"
          />

          <p className="mt-3 text-xs text-[var(--warning-text)]">{t.warning}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleFormat}
              className="ui-button-primary inline-flex min-h-11 items-center gap-2 px-4 py-2"
            >
              <RefreshCw className="h-4 w-4" />
              {statusText || t.formatButton}
            </button>
            <button type="button" onClick={clearAll} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-muted)]">
              <RotateCcw className="h-4 w-4" />
              {t.clearButton}
            </button>
          </div>

          {error && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-[var(--danger-text)]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </article>

        <article className="ui-surface rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{t.outputLabel}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{t.outputInfo}</p>
          <pre
            className="mt-3 min-h-20 max-h-[28rem] overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-xs leading-6 text-[var(--text-primary)]"
            data-testid="sql-output"
            aria-live="polite"
          >
            {result || (state === "error" ? t.unknownError : t.noOutput)}
          </pre>
          <button
            type="button"
            disabled={!result}
            onClick={copyOutput}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-2 text-sm font-semibold text-[var(--accent-text)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Clipboard className="h-4 w-4" />
            {copyState === "copied" ? t.copied : copyState === "failed" ? t.copyFailed : t.copyButton}
          </button>
        </article>
      </section>
    </main>
  );
}
