"use client";

import Link from "next/link";
import { Check, Copy, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  generateSecurePassword,
  type PasswordOptions,
} from "@/lib/password-generator";

const copy = {
  en: {
    eyebrow: "Local-first utility",
    title: "Generate a strong password",
    description: "Generated locally with your device's secure random source. Nothing is uploaded.",
    length: "Length",
    uppercase: "Uppercase",
    lowercase: "Lowercase",
    numbers: "Numbers",
    symbols: "Symbols",
    regenerate: "Regenerate",
    copy: "Copy",
    copied: "Copied",
    fullTool: "More password options",
    output: "Generated password",
  },
  zh: {
    eyebrow: "浏览器本地工具",
    title: "立即生成安全密码",
    description: "使用设备加密随机源在浏览器本地生成，不会上传。",
    length: "密码长度",
    uppercase: "大写字母",
    lowercase: "小写字母",
    numbers: "数字",
    symbols: "符号",
    regenerate: "重新生成",
    copy: "复制",
    copied: "已复制",
    fullTool: "更多密码选项",
    output: "生成的密码",
  },
} as const;

const initialOptions: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

export function HomePasswordGenerator({ lang }: { lang: "en" | "zh" }) {
  const t = copy[lang];
  const [options, setOptions] = useState(initialOptions);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);

  const regenerate = useCallback(() => {
    setPassword(generateSecurePassword(options));
    setCopied(false);
  }, [options]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const toggle = (key: keyof Omit<PasswordOptions, "length">) => {
    setOptions((current) => {
      const enabledCount = [
        current.uppercase,
        current.lowercase,
        current.numbers,
        current.symbols,
      ].filter(Boolean).length;
      if (current[key] && enabledCount === 1) return current;
      return { ...current, [key]: !current[key] };
    });
  };

  const copyPassword = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section
      aria-labelledby="home-password-title"
      className="ui-surface relative mx-auto mt-6 w-full max-w-7xl overflow-hidden rounded-2xl p-4 text-left sm:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(250px,0.72fr)_minmax(0,1.28fr)] lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-500">
            <ShieldCheck className="h-3.5 w-3.5" />
            {t.eyebrow}
          </div>
          <h2
            id="home-password-title"
            className="mt-2 text-xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-2xl"
          >
            {t.title}
          </h2>
          <p className="mt-2 max-w-lg text-xs leading-5 text-[var(--text-muted)] sm:text-sm">
            {t.description}
          </p>
          <Link
            href={`/${lang}/tools/passgen`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-color)] hover:text-[var(--accent-hover)]"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {t.fullTool}
          </Link>
        </div>

        <div className="min-w-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div
              aria-label={t.output}
              className="min-h-12 min-w-0 flex-1 select-all break-all rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3 py-3 font-mono text-sm font-semibold tracking-wide text-[var(--text-primary)] sm:text-base"
            >
              {password || "••••••••••••••••••••"}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={regenerate}
                className="ui-button-ghost min-h-12 border border-[var(--border-subtle)] px-3 text-xs"
              >
                <RefreshCw className="h-4 w-4" />
                {t.regenerate}
              </button>
              <button
                type="button"
                onClick={copyPassword}
                className="ui-button-primary min-h-12 px-3 text-xs"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? t.copied : t.copy}
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <label className="flex items-center gap-3 text-xs font-medium text-[var(--text-secondary)]">
              <span className="whitespace-nowrap">{t.length}</span>
              <input
                aria-label={t.length}
                type="range"
                min="8"
                max="40"
                value={options.length}
                onChange={(event) =>
                  setOptions((current) => ({
                    ...current,
                    length: Number(event.target.value),
                  }))
                }
                className="w-full min-w-28 accent-emerald-500 sm:w-40"
              />
              <span className="w-6 text-right font-mono text-[var(--text-primary)]">
                {options.length}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              {(
                ["uppercase", "lowercase", "numbers", "symbols"] as const
              ).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={options[key]}
                  onClick={() => toggle(key)}
                  className={`min-h-9 rounded-lg border px-3 text-[11px] font-semibold transition ${
                    options[key]
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                      : "border-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {t[key]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
