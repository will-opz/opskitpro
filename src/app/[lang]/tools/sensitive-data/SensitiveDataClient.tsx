"use client";

import { useMemo, useState } from "react";
import { Clipboard, Eye, EyeOff } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import {
  SENSITIVE_LABELS,
  detectSensitive,
  type SensitiveEntity,
  buildSummaryText,
  type SensitiveMatch,
} from "./sensitive-data-engine";

type Lang = "en" | "zh";

const ENTITY_OPTIONS: Array<{ id: SensitiveEntity; defaultEnabled: boolean }> = [
  { id: "email", defaultEnabled: true },
  { id: "phone", defaultEnabled: true },
  { id: "api_key", defaultEnabled: true },
  { id: "password", defaultEnabled: true },
  { id: "uuid", defaultEnabled: true },
  { id: "private_key", defaultEnabled: true },
  { id: "credit_card", defaultEnabled: true },
  { id: "ip", defaultEnabled: true },
];

const DEFAULT_ENABLED = Object.fromEntries(
  ENTITY_OPTIONS.map(({ id, defaultEnabled }) => [id, defaultEnabled]),
) as Record<SensitiveEntity, boolean>;

const copy = {
  en: {
    eyebrow: "Local-first security helper",
    title: "Sensitive Data Detector",
    subtitle: "Scan text in-browser, highlight sensitive entities, and generate redacted output locally.",
    privacy: "Local processing · Nothing is sent to the server",
    inputLabel: "Text to scan",
    inputPlaceholder: "Paste logs, messages, or JSON before sharing…",
    scanHint: "Detections are limited to common high-risk patterns and will continue to improve.",
    matchesLabel: "Detection",
    redaction: "Show redacted output",
    copyRedacted: "Copy redacted text",
    copied: "Copied",
    copyFailed: "Copy failed",
    compare: "Show comparison",
    mappingTitle: "Redaction map",
    clear: "Clear",
    noData: "No text input yet.",
    placeholderHint: (value: string) => `Found ${value}`,
    limit: (limit: number) => `Only first ${limit} matches are shown for performance.`,
    empty: "No sensitive findings.",
    onlyLocal: "All matching happens in your browser.",
    originalHighlighted: "Original (highlighted)",
    detectedEntities: (count: number) => `Detected ${count} entities`,
    mappedText: (value: string, type: string) => `[${value}] -> ${type}`,
  },
  zh: {
    eyebrow: "本地敏感信息检测",
    title: "敏感信息检测与脱敏",
    subtitle: "在浏览器内扫描文本，标注敏感实体，并生成可追踪的脱敏内容。",
    privacy: "本地处理 · 不上传内容",
    inputLabel: "待扫描文本",
    inputPlaceholder: "在分享前粘贴日志、消息或 JSON …",
    scanHint: "检测规则覆盖常见高风险模式，后续会持续补齐。",
    matchesLabel: "检测结果",
    redaction: "显示脱敏输出",
    copyRedacted: "复制脱敏文本",
    copied: "已复制",
    copyFailed: "复制失败",
    compare: "并排对比",
    mappingTitle: "脱敏映射",
    clear: "清空",
    noData: "尚未输入文本。",
    placeholderHint: (value: string) => `发现 ${value}`,
    limit: (limit: number) => `为保证性能，仅展示前 ${limit} 条匹配。`,
    empty: "未发现敏感信息。",
    onlyLocal: "所有匹配均在你的浏览器内完成。",
    originalHighlighted: "原文（已高亮）",
    detectedEntities: (count: number) => `已检测到 ${count} 处敏感信息`,
    mappedText: (value: string, type: string) => `${value} -> ${type}`,
  },
} as const;

function sortMatches(matches: SensitiveMatch[]) {
  return [...matches].sort((a, b) => a.start - b.start || a.end - b.end);
}

function buildSegments(
  input: string,
  matches: SensitiveMatch[],
): Array<{ value: string; type: SensitiveEntity | null; key?: string }> {
  const sorted = sortMatches(matches);
  const pieces: Array<{ value: string; type: SensitiveEntity | null; key?: string }> = [];
  let cursor = 0;
  for (const match of sorted) {
    if (match.start < cursor) continue;
    pieces.push({ value: input.slice(cursor, match.start), type: null });
    pieces.push({ value: match.value, type: match.type, key: match.placeholder });
    cursor = match.end;
  }
  pieces.push({ value: input.slice(cursor), type: null });
  return pieces;
}

function getClassForType(type: SensitiveEntity | null) {
  if (!type) return "text-[var(--text-primary)]";
  const classes: Record<SensitiveEntity, string> = {
    email: "bg-[var(--danger-soft)] text-red-900",
    phone: "bg-[var(--warning-soft)] text-orange-900",
    api_key: "bg-[var(--warning-soft)] text-[var(--warning-text)]",
    password: "bg-[var(--danger-soft)] text-rose-900",
    uuid: "bg-violet-100 text-violet-900",
    private_key: "bg-pink-100 text-pink-900",
    credit_card: "bg-[var(--info-soft)] text-sky-900",
    ip: "bg-[var(--accent-soft)] text-emerald-900",
  };
  return `rounded px-1.5 py-0.5 font-mono text-xs ${classes[type]}`;
}

export default function SensitiveDataClient({ lang }: { lang: Lang }) {
  const c = copy[lang];
  const [input, setInput] = useState("");
  const [showRedacted, setShowRedacted] = useState(true);
  const [showCompare, setShowCompare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [enabled, setEnabled] = useState<Record<SensitiveEntity, boolean>>(
    DEFAULT_ENABLED,
  );

  const result = useMemo(() => detectSensitive(input, { enabled }), [input, enabled]);
  const summary = useMemo(() => buildSummaryText(result, lang), [result, lang]);

  const highlighted = useMemo(
    () => buildSegments(input, result.matches),
    [input, result.matches],
  );
  const redactionEntries = useMemo(() => {
    return Object.entries(result.redactionMap)
      .sort((a, b) => {
        const aIndex = a[1].index;
        const bIndex = b[1].index;
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a[0].localeCompare(b[0]);
      })
      .map(([key, value]) => ({ key, ...value }));
  }, [result.redactionMap]);

  const toggleEntity = (id: SensitiveEntity) => {
    setEnabled((current) => ({ ...current, [id]: !current[id] }));
  };

  const copyRedacted = async () => {
    if (!result.redactedText) return;
    try {
      await navigator.clipboard.writeText(result.redactedText);
      setCopied(true);
      setCopyFailed(false);
    } catch {
      setCopied(false);
      setCopyFailed(true);
    }
    window.setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
    }, 1500);
  };

  return (
    <main className="tool-page">
      <ToolPageHeader title={c.title} description={c.subtitle} processing={c.privacy} />

      <section className="mt-6 ui-surface-elevated rounded-2xl p-4 sm:p-6">
        <label className="text-sm font-semibold text-[var(--text-primary)]" htmlFor="sensitive-input">
          {c.inputLabel}
        </label>
        <textarea
          id="sensitive-input"
          className="mt-2 min-h-40 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm leading-6 outline-none focus:border-emerald-500/50"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={c.inputPlaceholder}
          spellCheck={false}
        />
        <p className="mt-2 text-xs text-[var(--text-muted)]">{c.onlyLocal}</p>
      </section>

      <section className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="ui-surface rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{c.matchesLabel}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {input.length ? summary.header : c.noData}
          </p>

          <div className="mt-3">
            {summary.detail ? <p className="text-xs text-[var(--text-secondary)]">{summary.detail}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              {ENTITY_OPTIONS.map((item) => (
                <label key={item.id} className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-3 py-2 text-xs">
                  <input
                    type="checkbox"
                    checked={enabled[item.id]}
                    onChange={() => toggleEntity(item.id)}
                  />
                  <span>{SENSITIVE_LABELS[lang][item.id]}</span>
                </label>
              ))}
            </div>
          </div>

          {input.length === 0 ? null : result.matches.length === 0 ? (
            <p className="mt-4 text-sm text-[var(--accent-text)]">{c.empty}</p>
          ) : (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-sm text-[var(--text-secondary)]">
              <p className="font-semibold">{summary.header}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {summary.detail || c.empty}
              </p>
              {result.limitHit && <p className="mt-2 text-xs text-[var(--warning-text)]">{c.limit(result.matches.length)}</p>}
            </div>
          )}

          {result.matches.length > 0 && (
            <div className="mt-4 rounded-xl border border-[var(--border-subtle)] p-3">
              <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">{c.originalHighlighted}</p>
              <pre className="whitespace-pre-wrap break-all rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-sm leading-6">
                {highlighted.map((piece, index) => (
                  piece.type ? (
                    <mark key={`${piece.key}-${index}`} className={getClassForType(piece.type)}>
                      {piece.value}
                    </mark>
                  ) : (
                    <span key={`${piece.key ?? index}-${index}`}>{piece.value}</span>
                  )
                ))}
              </pre>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="ui-surface rounded-2xl p-4 sm:p-5">
            <label className="flex items-center justify-between text-sm font-semibold text-[var(--text-primary)]">
              <span>{c.redaction}</span>
              <button
                type="button"
                onClick={() => setShowRedacted((prev) => !prev)}
                className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs"
              >
                {showRedacted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                <span className="sr-only">{showRedacted ? c.redaction : c.redaction}</span>
              </button>
            </label>

            <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.04] p-3 text-sm leading-6">
              {showRedacted ? (
                <pre className="whitespace-pre-wrap break-all">{input ? result.redactedText : c.noData}</pre>
              ) : (
                <span className="text-[var(--text-muted)]">{showRedacted ? c.noData : c.noData}</span>
              )}
            </div>

            <button
              type="button"
              onClick={copyRedacted}
              disabled={!input || result.matches.length === 0}
              className="ui-button-primary mt-4 min-h-10 px-3 text-xs"
            >
              <Clipboard className="h-4 w-4" />{copied ? c.copied : copyFailed ? c.copyFailed : c.copyRedacted}
            </button>
            <p className="mt-2 text-xs text-[var(--text-muted)]">{result.truncated ? "Input truncated to 50,000 chars for local processing." : ""}</p>
          </div>

          <div className="ui-surface rounded-2xl p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setShowCompare((prev) => !prev)}
              className="ui-button-ghost min-h-10 border border-[var(--border-subtle)] px-3 text-sm"
            >
              {c.compare}
            </button>
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              {c.detectedEntities(result.total)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setInput("");
              setShowRedacted(true);
            }}
            className="ui-button-ghost min-h-10 w-full border border-[var(--border-subtle)] px-3 text-sm"
          >
            {c.clear}
          </button>
        </div>
      </section>

      {showCompare && input.length > 0 && result.matches.length > 0 ? (
        <section className="mt-6 ui-surface rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{lang === "zh" ? "原文与脱敏对比" : "Original vs Redacted"}</p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs text-[var(--text-muted)]">{lang === "zh" ? "原文" : "Original"}</p>
              <pre className="whitespace-pre-wrap break-all rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-xs leading-6">
                {input}
              </pre>
            </div>
            <div>
              <p className="mb-2 text-xs text-[var(--text-muted)]">{lang === "zh" ? "脱敏文本" : "Redacted"}</p>
              <pre className="whitespace-pre-wrap break-all rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-3 text-xs leading-6">
                {result.redactedText}
              </pre>
            </div>
          </div>
          {redactionEntries.length > 0 ? (
            <div className="mt-4">
              <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">{c.mappingTitle}</p>
              <div className="overflow-hidden rounded-xl border border-[var(--border-subtle)]">
                {redactionEntries.map((entry) => (
                  <div key={entry.key} className="flex items-start justify-between gap-3 border-b border-[var(--border-subtle)] px-3 py-2 text-xs last:border-b-0">
                    <span className="font-mono text-[var(--text-primary)]">{entry.key}</span>
                    <span className="text-[var(--text-muted)]">
                      {c.mappedText(SENSITIVE_LABELS[lang][entry.type], `#${entry.index}`)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
