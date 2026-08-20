"use client";

import { useMemo, useState } from "react";
import { AlertCircle, Clipboard, RefreshCcw, RefreshCw, ShieldCheck } from "lucide-react";
import {
  generateUuid,
  isValidUuid,
  type UuidValidation,
  UUID_LIMIT,
} from "./uuid-engine";

type Lang = "en" | "zh";
type CopyState = "idle" | "copied" | "failed";
type GenerateVersion = "v1" | "v4" | "v5";

const VERSION_OPTIONS: Array<{ id: GenerateVersion; label: { en: string; zh: string }; available: boolean }> = [
  { id: "v1", label: { en: "UUID v1", zh: "UUID v1" }, available: true },
  { id: "v4", label: { en: "UUID v4", zh: "UUID v4" }, available: true },
  { id: "v5", label: { en: "UUID v5", zh: "UUID v5" }, available: true },
];

const copy = {
  en: {
    eyebrow: "Local security tool",
    title: "UUID Generator & Validator",
    subtitle: "Generate UUIDs and validate UUID formats entirely in your browser.",
    privacy: "Local processing · UUID values never leave this browser",
    generate: "Generate",
    generateHint: "Use v1 for time-based IDs, v4 for random IDs, and v5 for deterministic IDs from namespace + name.",
    version: "Version",
    unavailable: "Current release does not support direct generation for this version.",
    count: "Batch count",
    countHelp: "Generate multiple UUIDs at once (1-50).",
    namespace: "v5 Namespace UUID",
    namespaceHelp: "Valid namespace UUID, e.g. DNS namespace: 6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    name: "v5 Name",
    namePlaceholder: "Enter namespace name (e.g. example.com)",
    generateButton: "Generate UUID",
    generating: "Generating…",
    generated: "Generated UUID",
    copied: "Copied",
    copyAll: "Copy all",
    copyFailed: "Clipboard failed",
    noGenerated: "No UUID generated yet.",
    validation: "Validation",
    validationHint: "Paste one UUID per line to validate format and version.",
    inputPlaceholder: "Input UUID(s) to validate…",
    total: (count: number) => `Found ${count} item${count === 1 ? "" : "s"}`,
    valid: "Valid",
    invalid: "Invalid",
    unknownVersion: "Unknown",
    clear: "Clear",
  },
  zh: {
    eyebrow: "本地安全工具",
    title: "UUID 生成与校验",
    subtitle: "在浏览器本地生成和校验 UUID，避免上传任何数据。",
    privacy: "本地处理 · UUID 不会离开当前浏览器",
    generate: "生成",
    generateHint: "v1 用于时间戳 ID，v4 用于随机 ID，v5 用于基于命名空间与名称的确定性 ID。",
    version: "版本",
    unavailable: "当前版本暂未支持该版本 UUID 的生成。",
    count: "生成数量",
    countHelp: "可一次性生成多个 UUID（1-50）。",
    namespace: "v5 命名空间 UUID",
    namespaceHelp: "有效的命名空间 UUID，例如 DNS 命名空间：6ba7b810-9dad-11d1-80b4-00c04fd430c8",
    name: "v5 名称",
    namePlaceholder: "输入名称（如：example.com）",
    generateButton: "生成 UUID",
    generating: "生成中…",
    generated: "生成结果",
    copied: "已复制",
    copyAll: "复制全部",
    copyFailed: "复制失败",
    noGenerated: "尚未生成 UUID。",
    validation: "校验",
    validationHint: "每行输入一个 UUID，校验格式与版本。",
    inputPlaceholder: "请输入要校验的 UUID…",
    total: (count: number) => `发现 ${count} 条`,
    valid: "有效",
    invalid: "无效",
    unknownVersion: "未知",
    clear: "清空",
  },
} as const;

function buildValidationResults(input: string) {
  return input
    .split(/\r?\n/)
    .map((raw) => raw.trim())
    .filter((value) => value.length > 0)
    .map((value) => ({ value, ...isValidUuid(value) }));
}

function ValidationTag({
  valid,
  value,
  version,
  t,
}: { valid: boolean; value: string; version: string; t: { valid: string; invalid: string; unknownVersion: string } }) {
  return (
    <li className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-2.5 text-xs sm:text-sm">
      <p className={`break-all ${valid ? "text-emerald-700" : "text-red-600"}`}>
        <strong>{valid ? t.valid : t.invalid}</strong> · {value}
      </p>
      <p className="mt-1 text-[11px] text-[var(--text-muted)]">
        {valid ? (version ? `v${version}` : t.unknownVersion) : t.invalid}
      </p>
    </li>
  );
}

export default function UuidToolClient({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const [version, setVersion] = useState<GenerateVersion>("v4");
  const [count, setCount] = useState(5);
  const [namespace, setNamespace] = useState("");
  const [name, setName] = useState("");
  const [generated, setGenerated] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCopyState, setGeneratedCopyState] = useState<CopyState>("idle");
  const [validationInput, setValidationInput] = useState("");
  const [validationCopyState, setValidationCopyState] = useState<CopyState>("idle");

  const validationItems = useMemo(() => buildValidationResults(validationInput), [validationInput]);
  const validItems = useMemo(() => validationItems.filter((item) => item.isValid), [validationItems]);

  const validationTextLimit = UUID_LIMIT * 10;
  const inputIsTooLong = validationInput.length > validationTextLimit;

  const canGenerateV5 = version === "v5" ? namespace.trim() && name.trim() : true;
  const countIsInvalid = count < 1 || count > 50;

  const handleGenerate = async () => {
    if (countIsInvalid || (version === "v5" && !canGenerateV5)) return;
    setIsGenerating(true);
    const nextGenerated: string[] = [];
    try {
      for (let index = 0; index < count; index += 1) {
        const next = await generateUuid(version, namespace || undefined, version === "v5" ? name : undefined);
        nextGenerated.push(next);
      }
      setGenerated((current) => [...nextGenerated.reverse(), ...current].slice(0, 200));
    } finally {
      setIsGenerating(false);
    }
  };

  const copyGenerated = async () => {
    if (!generated.length) return;
    try {
      await navigator.clipboard.writeText(generated.join("\n"));
      setGeneratedCopyState("copied");
    } catch {
      setGeneratedCopyState("failed");
    }
    window.setTimeout(() => setGeneratedCopyState("idle"), 1500);
  };

  const copyValidation = async () => {
    if (!validationInput.trim()) return;
    try {
      await navigator.clipboard.writeText(validationInput);
      setValidationCopyState("copied");
    } catch {
      setValidationCopyState("failed");
    }
    window.setTimeout(() => setValidationCopyState("idle"), 1500);
  };

  const clearAll = () => {
    setGenerated([]);
    setValidationInput("");
  };

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-12">
      <section className="max-w-3xl">
        <div className="ui-chip mb-4">
          <ShieldCheck className="h-3.5 w-3.5" />{t.privacy}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">{t.title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--text-muted)] sm:text-base">
          {t.subtitle}
        </p>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-[var(--text-primary)]">{t.generate}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{t.generateHint}</p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-[var(--text-primary)]">{t.version}</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {VERSION_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={version === item.id}
                  onClick={() => {
                    if (!item.available) return;
                    setVersion(item.id);
                  }}
                  disabled={!item.available}
                  className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                    version === item.id
                      ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-700"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {item.label[lang]}
                </button>
              ))}
            </div>
          </fieldset>

          {version === "v5" && (
            <div className="mt-4">
              <label className="text-sm font-semibold text-[var(--text-primary)]" htmlFor="uuid-namespace">
                {t.namespace}
              </label>
              <input
                id="uuid-namespace"
                value={namespace}
                onChange={(event) => setNamespace(event.target.value)}
                placeholder="6ba7b810-9dad-11d1-80b4-00c04fd430c8"
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-sm outline-none focus:border-emerald-500/50"
              />
              <p className="mt-2 text-xs text-[var(--text-muted)]">{t.namespaceHelp}</p>

              <label className="mt-3 block text-sm font-semibold text-[var(--text-primary)]" htmlFor="uuid-name">
                {t.name}
              </label>
              <input
                id="uuid-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={t.namePlaceholder}
                className="mt-2 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-sm outline-none focus:border-emerald-500/50"
              />
            </div>
          )}

          <div className="mt-4">
            <label className="text-sm font-semibold text-[var(--text-primary)]" htmlFor="uuid-count">
              {t.count}
            </label>
            <input
              id="uuid-count"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(event) => setCount(Math.max(1, Math.min(50, Number(event.target.value) || 1)))}
              className="mt-2 w-32 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-sm outline-none focus:border-emerald-500/50"
            />
            <p className="mt-2 text-xs text-[var(--text-muted)]">{t.countHelp}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || countIsInvalid || (version === "v5" && !canGenerateV5)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-2 font-semibold text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              {isGenerating ? t.generating : t.generateButton}
            </button>
            <button
              type="button"
              onClick={() => setGenerated([])}
              disabled={generated.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 font-semibold text-[var(--text-muted)] disabled:opacity-50"
            >
              <RefreshCcw className="h-4 w-4" />{t.clear}
            </button>
          </div>
          {version === "v5" && !canGenerateV5 ? <p className="mt-3 flex items-center gap-2 text-sm text-amber-700"><AlertCircle className="h-4 w-4" />{t.unavailable}</p> : null}

          <h2 className="mt-6 text-sm font-semibold text-[var(--text-primary)]">{t.generated}</h2>
          <div className="mt-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 min-h-40">
            {generated.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">{t.noGenerated}</p>
            ) : (
              <ul className="space-y-2">
                {generated.slice(0, 100).map((item) => (
                  <li key={item} className="rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] px-2.5 py-1.5 font-mono text-xs break-all text-[var(--text-primary)] sm:text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={copyGenerated}
            disabled={generated.length === 0}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/30 px-3 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
          >
            <Clipboard className="h-4 w-4" />
            {generatedCopyState === "copied" ? t.copied : generatedCopyState === "failed" ? t.copyFailed : t.copyAll}
          </button>
        </div>

        <div className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t.validation}</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{t.validationHint}</p>
          <textarea
            value={validationInput}
            onChange={(event) => setValidationInput(event.target.value)}
            aria-label={t.validation}
            maxLength={validationTextLimit}
            placeholder={t.inputPlaceholder}
            className="mt-4 min-h-40 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-sm font-mono outline-none focus:border-emerald-500/50"
          />
          <p className={`mt-2 text-xs ${inputIsTooLong ? "text-red-700" : "text-[var(--text-muted)]"}`}>
            {validationInput.length.toLocaleString()} / {validationTextLimit.toLocaleString()}
          </p>

          <div className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              {t.total(validationItems.length)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {validItems.length} {lang === "zh" ? "条有效" : "valid items"}
            </p>
            {inputIsTooLong ? <p className="mt-2 text-xs text-red-700">{`Input exceeds ${validationTextLimit} characters.`}</p> : null}
          </div>

          <div className="mt-4 max-h-64 overflow-auto">
            {validationItems.length === 0 ? (
              <p className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-xs text-[var(--text-muted)]">-</p>
            ) : (
              <ul className="space-y-2">
                {validationItems.map((item: UuidValidation & { value: string }) => (
                  <ValidationTag
                    key={`${item.normalized}-${item.version}-${item.value}`}
                    valid={item.isValid}
                    value={item.value}
                    version={item.version}
                    t={t}
                  />
                ))}
              </ul>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={copyValidation}
              disabled={!validationInput.trim()}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-emerald-500/30 px-4 py-2 text-xs font-semibold text-emerald-700 disabled:opacity-50"
            >
              <Clipboard className="h-4 w-4" />
              {validationCopyState === "copied" ? t.copied : validationCopyState === "failed" ? t.copyFailed : t.copyAll}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 py-2 text-xs font-semibold text-[var(--text-muted)]"
            >
              <RefreshCcw className="h-4 w-4" />{t.clear}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
