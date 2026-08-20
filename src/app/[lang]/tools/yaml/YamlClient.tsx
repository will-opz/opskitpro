"use client";

import { Check, Clipboard, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

import { formatYaml, validateYaml, YAML_LIMITS } from "./yaml-engine";

type Lang = "en" | "zh";

type Status = "idle" | "valid" | "invalid" | "formatted";

const sampleYaml = `apiVersion: v1
service:
  name: opskitpro
  ports:
    - 80
    - 443
`;

const copy = {
  en: {
    badge: "Local processing · No upload",
    title: "YAML Formatter",
    description: "Validate YAML syntax and format with indentation cleanup locally.",
    inputLabel: "YAML input",
    inputPlaceholder: "Paste your YAML here…",
    formatButton: "Format YAML",
    validateButton: "Validate only",
    sample: "Load sample",
    clear: "Clear",
    outputLabel: "Formatted output",
    copy: "Copy result",
    copied: "Copied",
    copyFailed: "Copy failed",
    valid: "Valid YAML",
    invalid: "Invalid YAML",
    ready: "Paste YAML to start",
    limitHint: `Limit: ${YAML_LIMITS.maxChars.toLocaleString()} characters in one edit.`,
  },
  zh: {
    badge: "本地处理 · 不上传",
    title: "YAML 格式化器",
    description: "在本地校验 YAML 语法并格式化缩进。",
    inputLabel: "YAML 输入",
    inputPlaceholder: "在此粘贴 YAML…",
    formatButton: "格式化",
    validateButton: "仅校验",
    sample: "加载示例",
    clear: "清空",
    outputLabel: "格式化结果",
    copy: "复制结果",
    copied: "已复制",
    copyFailed: "复制失败",
    valid: "YAML 合法",
    invalid: "YAML 不合法",
    ready: "粘贴 YAML 后自动显示校验结果",
    limitHint: `上限：单次输入 ${YAML_LIMITS.maxChars.toLocaleString()} 字符。`,
  },
} satisfies Record<Lang, Record<string, string>>;

export default function YamlClient({ lang }: { lang: Lang }) {
  const c = copy[lang];
  const [input, setInput] = useState(sampleYaml);
  const [indent, setIndent] = useState(2);
  const [status, setStatus] = useState<Status>("idle");
  const [output, setOutput] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const validation = useMemo(() => validateYaml(input), [input]);
  const statusLabel = useMemo(() => {
    if (status === "formatted") return c.valid;
    if (status === "invalid") return c.invalid;
    if (status === "valid") return c.valid;
    if (!input.trim()) return c.ready;
    return validation.valid ? c.valid : c.invalid;
  }, [c.invalid, c.ready, c.valid, input, status, validation.valid]);

  const statusColor = validation.valid || status === "formatted"
    ? "text-emerald-700"
    : status === "invalid"
      ? "text-red-600"
      : "text-zinc-500";

  const runValidation = () => {
    setStatus(validation.valid ? "valid" : "invalid");
  };

  const runFormat = () => {
    const result = formatYaml(input, indent);
    if (!result.valid) {
      setOutput("");
      setStatus("invalid");
      return;
    }

    setOutput(result.formatted ?? "");
    setStatus("formatted");
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setStatus("idle");
    setCopyState("idle");
  };

  const copyOutput = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("failed");
      setTimeout(() => setCopyState("idle"), 1800);
    }
  };

  const outputLabel = status === "invalid" ? c.invalid : c.outputLabel;

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-12">
      <section className="max-w-3xl">
        <div className="ui-chip mb-4"><span>{c.badge}</span></div>
        <h1 className="text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">{c.title}</h1>
        <p className="mt-3 text-sm text-[var(--text-muted)]">{c.description}</p>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="ui-surface rounded-2xl p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="yaml-input" className="text-sm font-semibold text-[var(--text-primary)]">{c.inputLabel}</label>
            <span className="text-xs text-[var(--text-muted)]">{c.limitHint}</span>
          </div>
          <textarea
            id="yaml-input"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setStatus("idle");
            }}
            placeholder={c.inputPlaceholder}
            className="mt-2 min-h-80 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm leading-6 outline-none focus:border-emerald-500/50"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {[2, 4, 8].map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={indent === item}
                onClick={() => setIndent(item)}
                className={`min-h-10 rounded-full border px-3 text-xs font-semibold ${indent === item ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={runFormat} className="ui-button-primary min-h-11 px-4">{c.formatButton}</button>
            <button type="button" onClick={runValidation} className="ui-button-secondary min-h-11 px-4">{c.validateButton}</button>
            <button type="button" onClick={() => setInput(sampleYaml)} className="ui-button-ghost min-h-11 px-4">{c.sample}</button>
            <button type="button" onClick={clearAll} className="ui-button-ghost min-h-11 px-4">{c.clear}</button>
          </div>

          <p className={`mt-4 text-sm ${statusColor}`}>
            {statusLabel}
            {validation.error ? ` (${validation.errorMessage})` : ""}
          </p>
        </div>

        <div className="ui-surface rounded-2xl p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">{outputLabel}</h2>
          <div className={`mt-2 min-h-80 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 font-mono text-sm leading-6 whitespace-pre-wrap ${status === "invalid" ? "text-red-700" : "text-[var(--text-primary)]"}`}>
            {output || c.ready}
          </div>
          <div className="mt-4 flex items-center justify-between gap-2">
            <button type="button" onClick={copyOutput} disabled={!output} className="ui-button-primary min-h-10 px-4">
              {copyState === "copied" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
              {copyState === "copied" ? c.copied : copyState === "failed" ? c.copyFailed : c.copy}
            </button>
            <button type="button" onClick={clearAll} className="ui-button-ghost min-h-10 px-4"><RotateCcw className="h-4 w-4" />{c.clear}</button>
          </div>
        </div>
      </section>
    </main>
  );
}
