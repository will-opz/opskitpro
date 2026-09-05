"use client";

import { useMemo, useState } from "react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { Clipboard, RefreshCw, RotateCcw } from "lucide-react";
import { formatColor, parseColor } from "./color-engine";

type Lang = "en" | "zh";

const copy = {
  en: {
    eyebrow: "Local utility",
    title: "Color Converter",
    subtitle: "Convert common color formats in your browser. Supports Hex, RGB/RGBA and HSL/HSLA.",
    privacy: "Local processing · Your color values stay in this browser",
    inputLabel: "Input color",
    inputPlaceholder: "Try #1e90ff, rgb(30, 144, 255), hsl(210 100% 56%)",
    pickerLabel: "Color picker",
    pickerFallback: "Hex value from picker",
    convertButton: "Convert color",
    converting: "Converting…",
    clearButton: "Clear",
    outputTitle: "Conversion results",
    noResult: "No result yet.",
    copyButton: "Copy all formats",
    copied: "Copied",
    copyFailed: "Clipboard access failed",
    outputInfo: "Results are generated in your browser and are not uploaded.",
    noMatch: "Please enter a valid color.",
    errors: {
      empty_input: "Input cannot be empty.",
      invalid_format: "Unrecognized color format.",
      invalid_range: "Color values are out of range.",
    },
  },
  zh: {
    eyebrow: "本地工具",
    title: "颜色转换器",
    subtitle: "在浏览器本地转换常见颜色格式，支持 Hex、RGB/RGBA 及 HSL/HSLA。",
    privacy: "本地处理 · 色值仅在当前浏览器运行",
    inputLabel: "颜色输入",
    inputPlaceholder: "可尝试 #1e90ff、rgb(30, 144, 255)、hsl(210 100% 56%)",
    pickerLabel: "取色器",
    pickerFallback: "取色器对应十六进制值",
    convertButton: "开始转换",
    converting: "转换中…",
    clearButton: "清空",
    outputTitle: "转换结果",
    noResult: "尚未生成结果。",
    copyButton: "复制全部格式",
    copied: "已复制",
    copyFailed: "复制失败",
    outputInfo: "转换结果只在当前浏览器生成，不会上传。",
    noMatch: "请输入有效的颜色值。",
    errors: {
      empty_input: "输入不能为空。",
      invalid_format: "无法识别的颜色格式。",
      invalid_range: "颜色取值超出范围。",
    },
  },
} as const;

type State = "idle" | "running" | "done" | "error";

export default function ColorConverterClient({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [rawInput, setRawInput] = useState("");
  const [pickerValue, setPickerValue] = useState("#1e90ff");
  const [output, setOutput] = useState("");
  const [formatted, setFormatted] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const parsedFromPicker = useMemo(() => {
    const result = parseColor(pickerValue);
    return result.ok ? result.color ?? null : null;
  }, [pickerValue]);

  const convert = () => {
    setState("running");
    const result = parseColor(rawInput);
    if (!result.ok || !result.color) {
      setOutput("");
      setFormatted("");
      setError(t.errors[result.error ?? "invalid_format"]);
      setState("error");
      return;
    }

    const converted = formatColor(result.color);
    const body = [
      `HEX: ${converted.hex}`,
      `RGB(A): ${converted.rgb}`,
      `HSL(A): ${converted.hsl}`,
      `Normalized: ${converted.normalized}`,
    ].join("\n");
    setOutput(body);
    setFormatted(converted.hex);
    setError("");
    setState("done");
  };

  const clear = () => {
    setRawInput("");
    setOutput("");
    setFormatted("");
    setError("");
    setState("idle");
    setCopyState("idle");
  };

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(output || "");
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
    window.setTimeout(() => setCopyState("idle"), 1600);
  };

  return (
    <main className="tool-page">
      <ToolPageHeader title={t.title} description={t.subtitle} processing={t.privacy} />

      <section className="tool-grid">
        <article className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{t.inputLabel}</p>
          <label className="sr-only" htmlFor="color-input">
            {t.inputLabel}
          </label>
          <input
            id="color-input"
            spellCheck={false}
            value={rawInput}
            onChange={(event) => {
              setRawInput(event.target.value);
              if (state !== "running") {
                setError("");
                setOutput("");
                setState("idle");
              }
            }}
            placeholder={t.inputPlaceholder}
            className="mt-3 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm outline-none focus:border-emerald-500/50"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label htmlFor="color-picker" className="text-sm font-semibold text-[var(--text-primary)]">
              {t.pickerLabel}
            </label>
            <input
              id="color-picker"
              type="color"
              value={pickerValue}
              aria-label={t.pickerLabel}
              onChange={(event) => {
                const next = event.target.value;
                setPickerValue(next);
                if (!rawInput && next) {
                  setRawInput(next);
                }
              }}
              className="h-10 w-14 rounded border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-0"
            />
            {parsedFromPicker && (
              <span
                className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] px-3 py-1 text-xs"
              >
                {t.pickerFallback}: {formatColor(parsedFromPicker).hex}
              </span>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={convert}
              className="ui-button-primary inline-flex min-h-11 items-center gap-2 px-4 py-2"
            >
              <RefreshCw className="h-4 w-4" />
              {state === "running" ? t.converting : t.convertButton}
            </button>
            <button
              type="button"
              onClick={clear}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-muted)]"
            >
              <RotateCcw className="h-4 w-4" />
              {t.clearButton}
            </button>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-[var(--danger-text)]">
              {error || t.noMatch}
            </div>
          )}
        </article>

        <article className="ui-surface rounded-2xl p-4 sm:p-6">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{t.outputTitle}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{t.outputInfo}</p>
          <pre
            data-testid="color-output"
            aria-live="polite"
            className="mt-3 min-h-20 max-h-80 overflow-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-xs leading-6 text-[var(--text-primary)]"
          >
            {output || t.noResult}
          </pre>
          {output ? (
            <div
              className="mt-4 h-10 w-full rounded-xl border"
              style={{ backgroundColor: formatted, borderColor: "var(--border-subtle)" }}
              aria-label="Color preview"
            />
          ) : null}
          <button
            type="button"
            disabled={!output}
            onClick={copyAll}
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
