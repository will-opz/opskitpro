"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  generateSecurePassphrase,
  generateSecurePassword,
  generateSecurePin,
  getPasswordPreset,
  type PasswordPreset,
} from "@/lib/password-generator";
import { analyzePasswordStrength } from "@/lib/password-security";
import { ToolPageHeader } from "@/components/ToolPageHeader";

type Lang = "zh" | "en";
type Mode = "password" | "passphrase" | "pin";

const characterKeys = ["uppercase", "lowercase", "numbers", "symbols"] as const;

export default function PassClient({ dict, lang }: { dict: any; lang: Lang }) {
  const copy = dict.tools.passgen;
  const [mode, setMode] = useState<Mode>("password");
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [wordCount, setWordCount] = useState(6);
  const [pinLength, setPinLength] = useState(6);
  const [separator, setSeparator] = useState<"-" | "." | "_" | " ">("-");
  const [includePhraseNumber, setIncludePhraseNumber] = useState(true);
  const [activePreset, setActivePreset] = useState<PasswordPreset | null>(null);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [excludedCharacters, setExcludedCharacters] = useState("");
  const [uuidMode, setUuidMode] = useState(false);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [copied, setCopied] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [copyError, setCopyError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generate = useCallback(
    (saveToHistory = false) => {
      try {
        let generated: string;
        if (mode === "passphrase") {
          generated = generateSecurePassphrase({
            wordCount,
            separator,
            includeNumber: includePhraseNumber,
          });
        } else if (mode === "pin") {
          generated = generateSecurePin({ length: pinLength });
        } else if (uuidMode) {
          generated = crypto.randomUUID();
        } else {
          generated = generateSecurePassword({
            length,
            ...options,
            excludeAmbiguous,
            excludedCharacters,
          });
        }
        setPassword(generated);
        setGenerationError("");
        if (saveToHistory) {
          setHistory((current) => [generated, ...current].slice(0, 5));
        }
      } catch {
        setPassword("");
        setGenerationError(
          lang === "zh"
            ? "当前设置没有可用字符，请调整选项。"
            : "No characters remain under the current settings.",
        );
      }
    },
    [
      excludeAmbiguous,
      excludedCharacters,
      includePhraseNumber,
      lang,
      length,
      mode,
      options,
      pinLength,
      separator,
      uuidMode,
      wordCount,
    ],
  );

  useEffect(() => {
    generate();
  }, [generate]);

  const changeMode = (nextMode: Mode) => {
    setMode(nextMode);
    setActivePreset(null);
    setUuidMode(false);
  };

  const applyPreset = (preset: PasswordPreset) => {
    const next = getPasswordPreset(preset);
    setMode("password");
    setUuidMode(false);
    setActivePreset(preset);
    setLength(next.length);
    setExcludeAmbiguous(Boolean(next.excludeAmbiguous));
    setExcludedCharacters("");
    setOptions({
      uppercase: next.uppercase,
      lowercase: next.lowercase,
      numbers: next.numbers,
      symbols: next.symbols,
    });
  };

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyError("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError(copy.copy_error);
    }
  };

  const strength = password && mode !== "pin" && !uuidMode
    ? analyzePasswordStrength(password)
    : null;
  const primaryLabel = mode === "password"
    ? copy.length
    : mode === "passphrase"
      ? copy.word_count
      : copy.pin_length;
  const primaryValue = mode === "password" ? length : mode === "passphrase" ? wordCount : pinLength;
  const primaryMin = mode === "password" ? 8 : 4;
  const primaryMax = mode === "password" ? 64 : mode === "passphrase" ? 8 : 12;

  const setPrimaryValue = (value: number) => {
    const bounded = Math.max(primaryMin, Math.min(primaryMax, value));
    if (mode === "password") {
      setLength(bounded);
      setActivePreset(null);
    } else if (mode === "passphrase") {
      setWordCount(bounded);
    } else {
      setPinLength(bounded);
    }
  };

  return (
    <div className="relative min-h-0 overflow-hidden bg-[var(--bg-primary)] px-4 pb-8 pt-6 font-sans text-[var(--text-secondary)] sm:px-6 md:pt-8 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="mx-auto max-w-5xl">
        <ToolPageHeader
          title={dict.tools.passgen_title}
          description={dict.tools.passgen_desc}
          processing={copy.local_privacy}
        />

        <div className="mt-6 space-y-5">
          <section className="rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-4 shadow-sm sm:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.mode}</p>
            <div role="tablist" aria-label={copy.mode} className="grid grid-cols-3 gap-2 rounded-2xl bg-[var(--bg-tertiary)] p-1.5">
              {(["password", "passphrase", "pin"] as const).map((item) => (
                <button
                  key={item}
                  role="tab"
                  aria-selected={mode === item}
                  type="button"
                  onClick={() => changeMode(item)}
                  className={`min-h-11 rounded-xl px-2 text-xs font-semibold transition sm:text-sm ${mode === item ? "bg-[var(--surface-primary)] text-[var(--accent-text)] shadow-sm" : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"}`}
                >
                  {item === "password" ? copy.password_mode : item === "passphrase" ? copy.passphrase_mode : copy.pin_mode}
                </button>
              ))}
            </div>
          </section>

          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
            <div className="space-y-4 lg:sticky lg:top-24">
              <section aria-label={dict.tools.passgen_title} className="overflow-hidden rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-primary)] shadow-sm">
                <div className="min-h-32 p-5">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{lang === "zh" ? "生成结果" : "Generated result"}</p>
                  <output data-testid="generated-password" aria-live="polite" className="block select-all break-all font-mono text-2xl font-semibold tracking-wide text-[var(--text-primary)] selection:bg-emerald-200 sm:text-3xl">
                    {password}
                  </output>
                  {generationError && <p role="alert" className="mt-3 text-xs text-[var(--danger-text)]">{generationError}</p>}
                  {copyError && <p role="alert" className="mt-3 text-xs text-[var(--danger-text)]">{copyError}</p>}
                  {strength && (
                    <div className="mt-5 flex items-center gap-3">
                      <div className="flex flex-1 gap-1" aria-hidden="true">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <span key={score} className={`h-1.5 flex-1 rounded-full ${score <= strength.score ? "bg-emerald-600" : "bg-zinc-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-[var(--accent-text)]">{copy[`strength_${strength.label}`]}</span>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 border-t border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-2">
                  <button type="button" onClick={() => generate(true)} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-3 text-sm font-bold text-[var(--text-primary)] transition hover:border-emerald-200 hover:text-[var(--accent-text)]">
                    <RefreshCw className="h-4 w-4" /> {copy.generate}
                  </button>
                  <button type="button" aria-label={copied ? copy.copied : copy.copy} onClick={() => copyToClipboard(password)} disabled={!password} className="ui-button-primary min-h-12 px-3 text-sm font-bold disabled:opacity-50">
                    {copied ? <Check className="h-4 w-4 shrink-0" /> : <Copy className="h-4 w-4 shrink-0" />} {copied ? copy.copied : lang === "zh" ? "复制" : "Copy"}
                  </button>
                  <button type="button" onClick={() => setShowQR(true)} disabled={!password} aria-label={copy.qr_label} className="flex min-h-12 min-w-12 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] text-[var(--text-secondary)] transition hover:text-[var(--accent-text)] disabled:opacity-50">
                    <QrCode className="h-5 w-5" />
                  </button>
                </div>
              </section>
              <p className="flex items-start gap-2 px-1 text-xs leading-5 text-[var(--text-muted)]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" />{copy.local_privacy}</p>
              {strength && (
                <details className="group rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-4">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-secondary)]"><span className="flex items-center justify-between">{copy.strength_details}<span className="text-[var(--text-muted)] transition group-open:rotate-45">＋</span></span></summary>
                  <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">{copy.strength_disclaimer}</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">{strength.findings.map((finding) => <li key={finding} className="flex gap-2"><span className="text-[var(--accent-text)]">•</span>{copy[`finding_${finding}`]}</li>)}</ul>
                </details>
              )}
            </div>

            <section className="space-y-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-5 shadow-sm sm:p-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="primary-number" className="font-medium text-[var(--text-secondary)]">{primaryLabel}</label>
                  <input id="primary-number" aria-label={`${primaryLabel} input`} type="number" min={primaryMin} max={primaryMax} value={primaryValue} onChange={(event) => setPrimaryValue(Number(event.target.value))} className="h-11 w-20 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-3 text-center font-mono text-xl text-[var(--accent-text)] outline-none focus:border-emerald-500" />
                </div>
                <input aria-label={primaryLabel} type="range" min={primaryMin} max={primaryMax} value={primaryValue} onChange={(event) => setPrimaryValue(Number(event.target.value))} className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[var(--bg-tertiary)] accent-emerald-600" />
                {mode !== "passphrase" && (
                  <div aria-label={copy.common_lengths} className={`grid gap-2 ${mode === "pin" ? "grid-cols-2" : "grid-cols-5"}`}>
                    {(mode === "pin" ? [6, 8] : [12, 16, 20, 24, 32]).map((value) => (
                      <button key={value} type="button" onClick={() => setPrimaryValue(value)} className={`min-h-9 rounded-lg border text-xs font-semibold ${primaryValue === value ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : "border-[var(--border-strong)] bg-[var(--surface-secondary)] text-[var(--text-muted)]"}`}>{value}</button>
                    ))}
                  </div>
                )}
              </div>

              {mode === "password" && (
                <>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.presets}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
                      {(["account", "wifi", "api", "easy"] as const).map((preset) => <button key={preset} type="button" onClick={() => applyPreset(preset)} className={`min-h-10 rounded-xl border px-2 text-xs font-semibold ${activePreset === preset ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : "border-[var(--border-strong)] bg-[var(--surface-primary)] text-[var(--text-secondary)]"}`}>{copy[`preset_${preset}`]}</button>)}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.options}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                      {characterKeys.map((key) => (
                        <button key={key} type="button" role="switch" aria-checked={options[key]} onClick={() => { setOptions((current) => ({ ...current, [key]: !current[key] })); setActivePreset(null); setUuidMode(false); }} className={`flex min-h-12 items-center justify-between rounded-xl border p-3 text-xs font-medium ${options[key] ? "border-emerald-500/20 bg-emerald-500/5 text-[var(--text-primary)]" : "border-[var(--border-strong)] bg-[var(--surface-secondary)] text-[var(--text-muted)]"}`}>
                          {copy[key]}<span aria-hidden="true" className={`relative h-6 w-10 rounded-full ${options[key] ? "bg-emerald-500" : "bg-zinc-200"}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-[var(--surface-primary)] transition-all ${options[key] ? "left-5" : "left-1"}`} /></span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <details className="group rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] p-4">
                    <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--text-secondary)]"><span className="flex items-center justify-between">{copy.advanced_settings}<span className="text-[var(--text-muted)] transition group-open:rotate-45">＋</span></span></summary>
                    <div className="mt-4 space-y-4">
                      <button type="button" role="switch" aria-checked={excludeAmbiguous} onClick={() => { setExcludeAmbiguous((value) => !value); setActivePreset(null); }} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-3 text-xs font-medium text-[var(--text-secondary)]">{copy.exclude_ambiguous}<span>{excludeAmbiguous ? "ON" : "OFF"}</span></button>
                      <label className="block space-y-2 text-xs font-medium text-[var(--text-secondary)]"><span>{copy.exclude_custom}</span><input value={excludedCharacters} maxLength={64} onChange={(event) => { setExcludedCharacters(event.target.value); setActivePreset(null); }} placeholder={copy.exclude_placeholder} className="min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] px-4 font-mono text-[var(--text-primary)] outline-none focus:border-emerald-500" /></label>
                      <div className="border-t border-[var(--border-strong)] pt-4"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.special_formats}</p><button type="button" aria-pressed={uuidMode} onClick={() => setUuidMode((value) => !value)} className={`min-h-11 w-full rounded-xl border px-3 text-xs font-semibold ${uuidMode ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-700" : "border-[var(--border-strong)] bg-[var(--surface-primary)] text-[var(--text-secondary)]"}`}>{copy.uuid_generate}</button></div>
                    </div>
                  </details>
                </>
              )}

              {mode === "passphrase" && (
                <div className="space-y-5">
                  <div><p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">{copy.separator}</p><div className="grid grid-cols-4 gap-2">{(["-", ".", "_", " "] as const).map((item) => <button key={item} type="button" aria-pressed={separator === item} onClick={() => setSeparator(item)} className={`min-h-11 rounded-xl border font-mono text-sm ${separator === item ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : "border-[var(--border-strong)] bg-[var(--surface-secondary)] text-[var(--text-muted)]"}`}>{item === " " ? copy.space : item}</button>)}</div></div>
                  <button type="button" role="switch" aria-checked={includePhraseNumber} onClick={() => setIncludePhraseNumber((value) => !value)} className="flex min-h-12 w-full items-center justify-between rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-3 text-xs font-medium text-[var(--text-secondary)]">{copy.include_number}<span>{includePhraseNumber ? "ON" : "OFF"}</span></button>
                  <p className="text-xs leading-5 text-[var(--text-muted)]">{copy.passphrase_note}</p>
                </div>
              )}
              {mode === "pin" && <p className="text-xs leading-5 text-[var(--text-muted)]">{lang === "zh" ? "PIN 适合设备解锁等限定场景；重要账号仍建议使用更长的随机密码。" : "PINs suit constrained device-unlock flows. Prefer a longer random password for important accounts."}</p>}
            </section>
          </div>

          <details className="group rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-4">
            <summary className="cursor-pointer list-none"><span className="flex items-center justify-between font-medium text-[var(--text-secondary)]"><span className="flex items-center gap-2"><RefreshCw className="h-4 w-4" />{copy.history}{history.length > 0 && <span className="text-xs text-[var(--text-muted)]">({history.length})</span>}</span><span className="text-[var(--text-muted)] transition group-open:rotate-45">＋</span></span></summary>
            <div className="mt-4 border-t border-[var(--border-strong)] pt-4">
              {history.length > 0 && <button type="button" onClick={() => setHistory([])} className="mb-3 text-xs text-[var(--text-secondary)] hover:text-red-500">{copy.clear_history}</button>}
              <div className="grid gap-2 sm:grid-cols-2">{history.length ? history.map((item, index) => <div key={`${item}-${index}`} className="flex items-center justify-between rounded-xl border border-[var(--border-strong)] bg-[var(--surface-secondary)] p-3"><span className="mr-3 truncate font-mono text-sm text-[var(--text-secondary)]">{item}</span><button type="button" aria-label={`${copy.copy} ${index + 1}`} onClick={() => copyToClipboard(item)} className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]"><Copy className="h-4 w-4" /></button></div>) : <p className="py-2 text-sm italic text-[var(--text-muted)]">{copy.history_empty}</p>}</div>
              <p className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]"><ShieldCheck className="h-3.5 w-3.5" />{copy.history_privacy}</p>
            </div>
          </details>
        </div>
      </div>

      {showQR && (
        <div role="dialog" aria-modal="true" aria-labelledby="qr-title" className="fixed inset-0 z-[100] flex items-center justify-center bg-[#fafafa]/90 p-4 backdrop-blur-xl" onClick={() => setShowQR(false)}>
          <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-8 shadow-sm" onClick={(event) => event.stopPropagation()}>
            <div className="rounded-2xl bg-[var(--surface-primary)] p-4 shadow-sm"><QRCodeSVG value={password} size={220} level="M" /></div>
            <div className="text-center"><h2 id="qr-title" className="font-bold text-[var(--text-primary)]">{copy.qr_title}</h2><p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{copy.qr_note}</p></div>
            <button type="button" autoFocus onClick={() => setShowQR(false)} className="w-full rounded-xl bg-[var(--bg-tertiary)] py-3 font-medium text-[var(--text-secondary)] hover:bg-zinc-800 hover:text-white">{copy.close}</button>
          </div>
        </div>
      )}
    </div>
  );
}
