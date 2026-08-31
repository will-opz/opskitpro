"use client";

import { useMemo, useState } from "react";
import { Clipboard, ClipboardCheck, RefreshCw, RotateCcw } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import {
  cronPresets,
  parseCronExpression,
  type CronExplainResult,
} from "./cron-engine";

type Lang = "en" | "zh";

type CopyLabel = {
  eyebrow: string;
  title: string;
  subtitle: string;
  privacy: string;
  presetsTitle: string;
  expressionLabel: string;
  expressionHelp: string;
  expressionPlaceholder: string;
  parseButton: string;
  clearButton: string;
  noInput: string;
  parsedTitle: string;
  explanationTitle: string;
  copyButton: string;
  copied: string;
  copyFailed: string;
  errorTitle: string;
  inputTooLong: string;
  limit: string;
  explainOk: string;
  explainNo: string;
  fieldMinute: string;
  fieldHour: string;
  fieldDay: string;
  fieldMonth: string;
  fieldWeekday: string;
  parseAgain: string;
  resultSummary: (count: number) => string;
};

const copy: Record<Lang, CopyLabel> = {
  en: {
    eyebrow: "Local utility",
    title: "Cron Generator",
    subtitle: "Build standard 5-field cron expressions and read human-friendly execution rules in this browser.",
    privacy: "Local processing · Cron expressions stay in your browser",
    presetsTitle: "Quick presets",
    expressionLabel: "Cron expression",
    expressionHelp: "Supports standard 5-field UNIX cron only (minute hour day-of-month month day-of-week).",
    expressionPlaceholder: "e.g. 0 9 * * 1-5",
    parseButton: "Parse expression",
    clearButton: "Clear",
    noInput: "Paste or pick a cron expression to begin.",
    parsedTitle: "Parsed fields",
    explanationTitle: "Human-readable explanation",
    copyButton: "Copy explanation",
    copied: "Copied",
    copyFailed: "Copy failed",
    errorTitle: "Validation result",
    inputTooLong: "Input is too long for this lightweight client mode.",
    limit: "Characters",
    explainOk: "The expression is valid.",
    explainNo: "Could not parse this expression.",
    fieldMinute: "Minute",
    fieldHour: "Hour",
    fieldDay: "Day of month",
    fieldMonth: "Month",
    fieldWeekday: "Day of week",
    parseAgain: "Reparse",
    resultSummary: (count) => `Found ${count} explanation item${count === 1 ? "" : "s"}`,
  },
  zh: {
    eyebrow: "本地工具",
    title: "Cron 表达式生成器",
    subtitle: "在浏览器本地构建并解释标准 Cron 表达式，快速检查调度规则。",
    privacy: "本地处理 · 表达式仅在当前浏览器运行",
    presetsTitle: "快捷模版",
    expressionLabel: "Cron 表达式",
    expressionHelp: "仅支持标准 5 段 UNIX Cron（分 时 日 月 周）。",
    expressionPlaceholder: "示例：0 9 * * 1-5",
    parseButton: "解析表达式",
    clearButton: "清空",
    noInput: "粘贴或点击模板后解析。",
    parsedTitle: "解析字段",
    explanationTitle: "执行说明",
    copyButton: "复制说明",
    copied: "已复制",
    copyFailed: "复制失败",
    errorTitle: "校验结果",
    inputTooLong: "当前轻量模式仅支持简短长度输入。",
    limit: "字符数",
    explainOk: "表达式合法。",
    explainNo: "表达式无法解析。",
    fieldMinute: "分钟",
    fieldHour: "小时",
    fieldDay: "日",
    fieldMonth: "月",
    fieldWeekday: "星期",
    parseAgain: "重新解析",
    resultSummary: (count) => `解析到 ${count} 条说明`,
  },
} as const;

const CRON_TEXT_LIMIT = 512;
const ERROR_MESSAGES: Record<string, { en: string; zh: string }> = {
  cron_format_error: { en: "Cron must contain 5 fields (minute hour day month weekday).", zh: "Cron 必须包含 5 个字段（分钟 小时 日 月 周）。" },
  cron_minute_invalid_empty_token: { en: "Minute field is empty.", zh: "分钟字段为空。" },
  cron_minute_invalid_bad_step: { en: "Minute step is invalid.", zh: "分钟字段的步进格式无效。" },
  cron_minute_invalid_bad_step_base: { en: "Minute step base is invalid.", zh: "分钟字段的步进基础值无效。" },
  cron_minute_invalid_bad_range: { en: "Minute range format is invalid.", zh: "分钟字段范围格式无效。" },
  cron_minute_invalid_bad_range_order: { en: "Minute range start must be <= end.", zh: "分钟字段范围起点不能大于终点。" },
  cron_minute_invalid_out_of_range: { en: "Minute value out of range.", zh: "分钟值超出范围。" },
  cron_minute_invalid_bad_number_or_alias: { en: "Minute value or alias is invalid.", zh: "分钟值/别名无效。" },
  cron_hour_invalid_empty_token: { en: "Hour field is empty.", zh: "小时字段为空。" },
  cron_hour_invalid_bad_step: { en: "Hour step is invalid.", zh: "小时字段步进格式无效。" },
  cron_hour_invalid_bad_step_base: { en: "Hour step base is invalid.", zh: "小时字段步进基础值无效。" },
  cron_hour_invalid_bad_range: { en: "Hour range format is invalid.", zh: "小时字段范围格式无效。" },
  cron_hour_invalid_bad_range_order: { en: "Hour range start must be <= end.", zh: "小时字段范围起点不能大于终点。" },
  cron_hour_invalid_out_of_range: { en: "Hour value out of range.", zh: "小时值超出范围。" },
  cron_hour_invalid_bad_number_or_alias: { en: "Hour value or alias is invalid.", zh: "小时值/别名无效。" },
  cron_dayOfMonth_invalid_empty_token: { en: "Day-of-month field is empty.", zh: "日字段为空。" },
  cron_dayOfMonth_invalid_bad_step: { en: "Day-of-month step is invalid.", zh: "日字段步进格式无效。" },
  cron_dayOfMonth_invalid_bad_step_base: { en: "Day-of-month step base is invalid.", zh: "日字段步进基础值无效。" },
  cron_dayOfMonth_invalid_bad_range: { en: "Day-of-month range format is invalid.", zh: "日字段范围格式无效。" },
  cron_dayOfMonth_invalid_bad_range_order: { en: "Day-of-month range start must be <= end.", zh: "日字段范围起点不能大于终点。" },
  cron_dayOfMonth_invalid_out_of_range: { en: "Day-of-month value out of range.", zh: "日值超出范围。" },
  cron_dayOfMonth_invalid_bad_number_or_alias: { en: "Day-of-month value or alias is invalid.", zh: "日字段值/别名无效。" },
  cron_month_invalid_empty_token: { en: "Month field is empty.", zh: "月份字段为空。" },
  cron_month_invalid_bad_step: { en: "Month step is invalid.", zh: "月份字段步进格式无效。" },
  cron_month_invalid_bad_step_base: { en: "Month step base is invalid.", zh: "月份字段步进基础值无效。" },
  cron_month_invalid_bad_range: { en: "Month range format is invalid.", zh: "月份范围格式无效。" },
  cron_month_invalid_bad_range_order: { en: "Month range start must be <= end.", zh: "月份起点不能大于终点。" },
  cron_month_invalid_out_of_range: { en: "Month value out of range.", zh: "月份超出范围。" },
  cron_month_invalid_bad_number_or_alias: { en: "Month value or alias is invalid.", zh: "月份值/别名无效。" },
  cron_dayOfWeek_invalid_empty_token: { en: "Weekday field is empty.", zh: "星期字段为空。" },
  cron_dayOfWeek_invalid_bad_step: { en: "Weekday step is invalid.", zh: "星期字段步进格式无效。" },
  cron_dayOfWeek_invalid_bad_step_base: { en: "Weekday step base is invalid.", zh: "星期字段步进基础值无效。" },
  cron_dayOfWeek_invalid_bad_range: { en: "Weekday range format is invalid.", zh: "星期字段范围格式无效。" },
  cron_dayOfWeek_invalid_bad_range_order: { en: "Weekday range start must be <= end.", zh: "星期范围起点不能大于终点。" },
  cron_dayOfWeek_invalid_out_of_range: { en: "Weekday value out of range.", zh: "星期值超出范围。" },
  cron_dayOfWeek_invalid_bad_number_or_alias: { en: "Weekday value or alias is invalid.", zh: "星期值/别名无效。" },
};

function describeErrors(result: CronExplainResult, lang: Lang) {
  if (result.ok) {
    return result.errors;
  }
  return result.errors.map((errorCode) => ERROR_MESSAGES[errorCode]?.[lang] ?? errorCode);
}

function renderParsed(result: CronExplainResult, t: CopyLabel) {
  return (
    <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
      <li>
        {t.fieldMinute}: <strong>{result.parsed[0]}</strong>
      </li>
      <li>
        {t.fieldHour}: <strong>{result.parsed[1]}</strong>
      </li>
      <li>
        {t.fieldDay}: <strong>{result.parsed[2]}</strong>
      </li>
      <li>
        {t.fieldMonth}: <strong>{result.parsed[3]}</strong>
      </li>
      <li>
        {t.fieldWeekday}: <strong>{result.parsed[4]}</strong>
      </li>
    </ul>
  );
}

export default function CronGeneratorClient({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [expression, setExpression] = useState(cronPresets[0]?.expression ?? "");
  const [result, setResult] = useState<CronExplainResult | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const charCount = expression.length;
  const hasLimitExceeded = charCount > CRON_TEXT_LIMIT;
  const explainText = useMemo(() => {
    if (!result || !result.ok) return "";
    return result.explanations.map((item) => item.description).join("\n");
  }, [result]);

  const parse = () => {
    const next = parseCronExpression(expression);
    setResult(next);
    setCopyState("idle");
  };

  const applyPreset = (nextExpression: string) => {
    setExpression(nextExpression);
    setResult(null);
  };

  const clear = () => {
    setExpression("");
    setResult(null);
    setCopyState("idle");
  };

  const copyExplain = async () => {
    if (!explainText) return;
    try {
      await navigator.clipboard.writeText(explainText);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1500);
  };

  const statusMessage = hasLimitExceeded
    ? `${t.inputTooLong} ${t.limit}: ${charCount}`
    : result
      ? result.ok
        ? t.explainOk
        : t.explainNo
      : t.noInput;

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-12">
      <ToolPageHeader title={t.title} description={t.subtitle} processing={t.privacy} />

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <article className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{t.presetsTitle}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {cronPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.expression)}
                className="rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-sm hover:bg-[var(--surface-secondary)]"
                title={preset.description[lang]}
              >
                {preset.title[lang]}
              </button>
            ))}
          </div>

          <label htmlFor="cron-input" className="mt-5 block text-sm font-semibold text-[var(--text-primary)]">
            {t.expressionLabel}
          </label>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{t.expressionHelp}</p>
          <input
            id="cron-input"
            value={expression}
            onChange={(event) => setExpression(event.target.value)}
            placeholder={t.expressionPlaceholder}
            className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm outline-none focus:border-emerald-500/50"
          />

          <div className="mt-3 text-xs text-[var(--text-muted)]">{`${t.limit}: ${charCount}/${CRON_TEXT_LIMIT}`}</div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={parse}
              disabled={hasLimitExceeded || !expression.trim()}
              className="ui-button-primary inline-flex min-h-11 items-center gap-2 px-4 py-2"
            >
              <RefreshCw className="h-4 w-4" />
              {result ? t.parseAgain : t.parseButton}
            </button>
            <button type="button" onClick={clear} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-muted)]">
              <RotateCcw className="h-4 w-4" />
              {t.clearButton}
            </button>
          </div>

          <div
            className={`mt-4 rounded-xl border p-3 text-sm ${result?.ok ? "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-700" : "border-amber-500/30 bg-amber-500/[0.06] text-amber-800"}`}
            aria-live="polite"
          >
            {statusMessage}
            {result && !result.ok ? (
              <ul className="mt-2 list-disc pl-5">
                {describeErrors(result, lang).map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </article>

        <article className="ui-surface rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{t.parsedTitle}</p>
          {result && result.ok ? renderParsed(result, t) : <p className="mt-2 text-sm text-[var(--text-muted)]">{t.noInput}</p>}

          <p className="mt-5 text-sm font-semibold text-[var(--text-primary)]">{t.explanationTitle}</p>
          <pre
            data-testid="cron-explain-output"
            className="mt-2 min-h-44 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-xs leading-6 text-[var(--text-primary)]"
            aria-live="polite"
          >
            {explainText || t.noInput}
          </pre>
          <div className="mt-3 text-xs text-[var(--text-muted)]">{result && result.ok ? t.resultSummary(result.explanations.length) : ""}</div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={copyExplain}
              disabled={!explainText}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-2 text-sm font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copyState === "copied" ? <ClipboardCheck className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copyState === "copied" ? t.copied : copyState === "failed" ? t.copyFailed : t.copyButton}
            </button>
          </div>
        </article>
      </section>
    </main>
  );
}
