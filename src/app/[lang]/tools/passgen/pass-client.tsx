"use client";

import { useState, useCallback, useEffect } from "react";
import {
  KeyRound,
  RefreshCw,
  Copy,
  QrCode,
  Check,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import {
  generateSecurePassphrase,
  generateSecurePassword,
  getPasswordPreset,
  type PasswordPreset,
} from "@/lib/password-generator";
import {
  analyzePasswordStrength,
  checkPwnedPassword,
} from "@/lib/password-security";
import PasswordVaultPanel from "./password-vault-panel";

type Lang = "zh" | "en";

export default function PassClient({ dict, lang }: { dict: any; lang: Lang }) {
  const [password, setPassword] = useState("");
  const [length, setLength] = useState(16);
  const [mode, setMode] = useState<"password" | "passphrase">("password");
  const [activePreset, setActivePreset] = useState<PasswordPreset | null>(null);
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false);
  const [excludedCharacters, setExcludedCharacters] = useState("");
  const [wordCount, setWordCount] = useState(6);
  const [separator, setSeparator] = useState<"-" | "." | "_" | " ">("-");
  const [includePhraseNumber, setIncludePhraseNumber] = useState(true);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    uuid: false,
    pin6: false,
    pin8: false,
  });

  // Helper to toggle options correctly
  const toggleOption = (key: string) => {
    setOptions((prev) => {
      const next = { ...prev };
      if (key === "uuid" || key === "pin6" || key === "pin8") {
        setMode("password");
        setActivePreset(null);
        const val = !prev[key as keyof typeof prev];
        // Reset all special modes first
        next.uuid = false;
        next.pin6 = false;
        next.pin8 = false;
        next[key as keyof typeof next] = val;
      } else {
        setActivePreset(null);
        next[key as keyof typeof next] = !prev[key as keyof typeof next];
        // If we are enabling a character set, disable special modes
        next.uuid = false;
        next.pin6 = false;
        next.pin8 = false;
      }
      return next;
    });
  };
  const [copied, setCopied] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [breachState, setBreachState] = useState<
    | { status: "idle" }
    | { status: "checking" }
    | { status: "found"; count: number }
    | { status: "not_found" }
    | { status: "error" }
  >({ status: "idle" });

  useEffect(() => {
    const saved = localStorage.getItem("opskitpro_pass_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const generatePassword = useCallback(
    (saveToHistory = true) => {
      let generated = "";

      if (mode === "passphrase") {
        generated = generateSecurePassphrase({
          wordCount,
          separator,
          includeNumber: includePhraseNumber,
        });
      } else if (options.uuid) {
        // UUID v4 generation using cryptographically secure API
        generated = crypto.randomUUID();
      } else if (options.pin6 || options.pin8) {
        const pinLength = options.pin6 ? 6 : 8;
        const array = new Uint32Array(pinLength);
        window.crypto.getRandomValues(array);
        for (let i = 0; i < pinLength; i++) {
          generated += (array[i] % 10).toString();
        }
      } else {
        if (
          !options.uppercase &&
          !options.lowercase &&
          !options.numbers &&
          !options.symbols
        ) {
          return "";
        }
        try {
          generated = generateSecurePassword({
            length,
            uppercase: options.uppercase,
            lowercase: options.lowercase,
            numbers: options.numbers,
            symbols: options.symbols,
            excludeAmbiguous,
            excludedCharacters,
          });
        } catch {
          setPassword("");
          setGenerationError(
            lang === "zh"
              ? "当前排除规则没有可用字符，请调整选项。"
              : "No characters remain under the current exclusions.",
          );
          return "";
        }
      }

      setPassword(generated);
      setGenerationError("");
      setBreachState({ status: "idle" });

      if (saveToHistory) {
        setHistory((prev) => {
          const newHistory = [generated, ...prev].slice(0, 5);
          localStorage.setItem(
            "opskitpro_pass_history",
            JSON.stringify(newHistory),
          );
          return newHistory;
        });
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
      separator,
      wordCount,
    ],
  );

  const applyPreset = (preset: PasswordPreset) => {
    const next = getPasswordPreset(preset);
    setMode("password");
    setActivePreset(preset);
    setLength(next.length);
    setExcludeAmbiguous(Boolean(next.excludeAmbiguous));
    setExcludedCharacters("");
    setOptions({
      uppercase: next.uppercase,
      lowercase: next.lowercase,
      numbers: next.numbers,
      symbols: next.symbols,
      uuid: false,
      pin6: false,
      pin8: false,
    });
  };

  // Initial generation on mount
  useEffect(() => {
    generatePassword(false);
  }, []);

  const regenerate = () => generatePassword(true);

  const strength = password ? analyzePasswordStrength(password) : null;
  const checkBreach = async () => {
    if (!password || breachState.status === "checking") return;
    setBreachState({ status: "checking" });
    try {
      const result = await checkPwnedPassword(password);
      setBreachState(
        result.count > 0
          ? { status: "found", count: result.count }
          : { status: "not_found" },
      );
    } catch {
      setBreachState({ status: "error" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("opskitpro_pass_history");
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 pt-8 md:pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.28em] mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {dict.tools.passgen_title}
        </div>

        <div className="flex items-center gap-2 mb-8 text-[11px] text-zinc-500">
          <Link href={`/`} className="hover:text-emerald-600 transition-colors">
            {"Home"}
          </Link>
          <span className="text-zinc-300">/</span>
          <Link
            href={`/tools`}
            className="hover:text-emerald-600 transition-colors"
          >
            {"Tools"}
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 border-b border-emerald-500/30 font-semibold">
            {dict.tools.passgen_title}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-lg shadow-emerald-500/10 group transition-all">
            <KeyRound className="w-7 h-7 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              {dict.tools.passgen_title}
            </h1>
            <p className="text-zinc-600 text-[10px] sm:text-xs tracking-[0.18em] mt-1 leading-relaxed">
              {dict.tools.passgen_desc}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Result Box */}
          <div className="bg-zinc-100 rounded-3xl border border-black/10 p-2 backdrop-blur-md relative group overflow-hidden">
            <div className="p-8 text-center bg-[#fafafa]/40 rounded-2xl border border-black/5">
              <span className="text-2xl sm:text-4xl font-mono text-zinc-900 tracking-widest break-all select-all selection:bg-emerald-500/30">
                <span data-testid="generated-password">
                  {password}
                </span>
              </span>
            </div>
            {generationError && (
              <p role="alert" className="px-4 pt-2 text-xs text-red-600">
                {generationError}
              </p>
            )}
            {/* Strength indicator */}
            {strength &&
              (() => {
                const colors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-600"];
                return (
                  <div className="px-4 pt-2 pb-1 flex items-center gap-3">
                    <div className="flex gap-1 flex-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= strength.score ? colors[strength.score - 1] : "bg-zinc-200"}`}
                        />
                      ))}
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                        strength.score <= 2
                          ? "text-red-500"
                          : strength.score === 3
                            ? "text-yellow-500"
                            : "text-emerald-600"
                      }`}
                    >
                      {dict.tools.passgen[`strength_${strength.label}`]}
                    </span>
                  </div>
                );
              })()}

            <div className="flex flex-col sm:flex-row p-2 gap-2">
              <div className="flex flex-1 gap-2">
                <button
                  onClick={regenerate}
                  className="flex-1 py-4 bg-white hover:bg-emerald-50 border border-black/5 hover:border-emerald-200 text-zinc-900 hover:text-emerald-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
                  <span className="text-sm sm:text-base !text-zinc-900 group-hover:!text-white">
                    {dict.tools.passgen.generate}
                  </span>
                </button>
              </div>
              <div className="flex flex-1 gap-2">
                <button
                  onClick={() => copyToClipboard(password)}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
                >
                  {copied ? (
                    <Check className="w-5 h-5 animate-bounce" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                  <span className="text-sm sm:text-base text-white">
                    {copied
                      ? dict.tools.passgen.copied
                      : dict.tools.passgen.copy}
                  </span>
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border shadow-sm active:scale-95 ${
                    showQR
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20"
                      : "bg-white text-zinc-900 hover:bg-emerald-50 hover:text-emerald-700 border-black/5"
                  }`}
                  aria-label="Show QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {strength && (
            <section className="rounded-3xl border border-zinc-200/70 bg-white/60 p-6 sm:p-8 space-y-6">
              <div>
                <h2 className="font-bold text-zinc-900">{dict.tools.passgen.strength_title}</h2>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{dict.tools.passgen.strength_disclaimer}</p>
              </div>
              <ul className="space-y-2 text-sm text-zinc-700">
                {strength.findings.map((finding) => (
                  <li key={finding} className="flex gap-2">
                    <span aria-hidden="true" className="text-emerald-600">•</span>
                    {dict.tools.passgen[`finding_${finding}`]}
                  </li>
                ))}
              </ul>
              <div className="rounded-2xl border border-black/5 bg-zinc-50 p-5 space-y-3">
                <h3 className="font-semibold text-zinc-900">{dict.tools.passgen.breach_title}</h3>
                <p className="text-xs leading-5 text-zinc-600">{dict.tools.passgen.breach_intro}</p>
                <button
                  type="button"
                  disabled={breachState.status === "checking"}
                  onClick={checkBreach}
                  className="min-h-12 w-full rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {breachState.status === "checking"
                    ? dict.tools.passgen.breach_checking
                    : dict.tools.passgen.breach_check}
                </button>
                {breachState.status === "found" && (
                  <p role="alert" className="text-sm font-semibold text-red-700">
                    {dict.tools.passgen.breach_found.replace("{count}", breachState.count.toLocaleString())}
                  </p>
                )}
                {breachState.status === "not_found" && (
                  <p role="status" className="text-sm text-emerald-700">{dict.tools.passgen.breach_not_found}</p>
                )}
                {breachState.status === "error" && (
                  <p role="alert" className="text-sm text-amber-700">{dict.tools.passgen.breach_error}</p>
                )}
                <a
                  href="https://haveibeenpwned.com/Passwords"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-xs text-zinc-500 underline underline-offset-4 hover:text-emerald-700"
                >
                  {dict.tools.passgen.breach_attribution}
                </a>
              </div>
            </section>
          )}

          {/* Controls */}
          <div className="bg-white/30 rounded-3xl border border-zinc-200/50 p-8 space-y-10">
            <div className="space-y-4">
              <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] px-1">
                {dict.tools.passgen.mode}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {(["password", "passphrase"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setActivePreset(null);
                      setOptions((current) => ({
                        ...current,
                        uuid: false,
                        pin6: false,
                        pin8: false,
                      }));
                    }}
                    className={`min-h-12 rounded-xl border px-4 text-xs font-semibold transition ${
                      mode === item
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                        : "border-black/5 bg-zinc-100/50 text-zinc-500"
                    }`}
                  >
                    {item === "password"
                      ? dict.tools.passgen.password_mode
                      : dict.tools.passgen.passphrase_mode}
                  </button>
                ))}
              </div>
            </div>

            {mode === "password" && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] px-1">
                  {dict.tools.passgen.presets}
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["account", "wifi", "api", "easy"] as const).map(
                    (preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => applyPreset(preset)}
                        className={`min-h-11 rounded-xl border px-3 text-[11px] font-semibold transition ${
                          activePreset === preset
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            : "border-black/5 bg-white text-zinc-600"
                        }`}
                      >
                        {dict.tools.passgen[`preset_${preset}`]}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-zinc-600 font-medium">
                  {mode === "password"
                    ? dict.tools.passgen.length
                    : dict.tools.passgen.word_count}
                </label>
                <span className="text-3xl font-mono text-emerald-700">
                  {mode === "password" ? length : wordCount}
                </span>
              </div>
              <input
                aria-label={
                  mode === "password"
                    ? dict.tools.passgen.length
                    : dict.tools.passgen.word_count
                }
                type="range"
                min={mode === "password" ? 8 : 4}
                max={mode === "password" ? 64 : 8}
                value={mode === "password" ? length : wordCount}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (mode === "password") {
                    setLength(value);
                    setActivePreset(null);
                  } else {
                    setWordCount(value);
                  }
                }}
                className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all"
              />
            </div>

            {mode === "password" ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] px-1">
                    {dict.tools.passgen.options}
                  </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {["uppercase", "lowercase", "numbers", "symbols"].map(
                    (key) => (
                      <button
                        key={key}
                        onClick={() => toggleOption(key)}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                          options[key as keyof typeof options]
                            ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-900 shadow-sm"
                            : "bg-zinc-100/50 border-black/5 text-zinc-400"
                        }`}
                      >
                        <span className="font-medium text-xs uppercase tracking-[0.18em]">
                          {dict.tools.passgen[key]}
                        </span>
                        <div
                          className={`w-10 h-6 rounded-full relative transition-colors ${
                            options[key as keyof typeof options]
                              ? "bg-emerald-500"
                              : "bg-zinc-200"
                          }`}
                        >
                          <div
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                              options[key as keyof typeof options]
                                ? "left-5"
                                : "left-1"
                            }`}
                          />
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  type="button"
                  aria-pressed={excludeAmbiguous}
                  onClick={() => {
                    setExcludeAmbiguous((value) => !value);
                    setActivePreset(null);
                  }}
                  className={`flex min-h-12 w-full items-center justify-between rounded-xl border p-4 text-xs font-medium transition ${
                    excludeAmbiguous
                      ? "border-emerald-500/20 bg-emerald-500/5 text-zinc-900"
                      : "border-black/5 bg-zinc-100/50 text-zinc-500"
                  }`}
                >
                  {dict.tools.passgen.exclude_ambiguous}
                  <span>{excludeAmbiguous ? "ON" : "OFF"}</span>
                </button>
                <label className="block space-y-2 text-xs font-medium text-zinc-600">
                  <span>{dict.tools.passgen.exclude_custom}</span>
                  <input
                    value={excludedCharacters}
                    maxLength={64}
                    onChange={(event) => {
                      setExcludedCharacters(event.target.value);
                      setActivePreset(null);
                    }}
                    placeholder={dict.tools.passgen.exclude_placeholder}
                    className="min-h-12 w-full rounded-xl border border-black/10 bg-white px-4 font-mono text-zinc-900 outline-none focus:border-emerald-500/40"
                  />
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] px-1">
                  {lang === "zh"
                      ? "特殊格式"
                      : "Special Formats"}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {["uuid", "pin6", "pin8"].map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleOption(key)}
                      className={`flex items-center justify-between sm:justify-center flex-row sm:flex-col gap-3 p-4 rounded-xl border transition-all ${
                        options[key as keyof typeof options]
                          ? "bg-cyan-500/5 border-cyan-500/20 text-zinc-900 shadow-sm"
                          : "bg-zinc-100/50 border-black/5 text-zinc-400"
                      }`}
                    >
                      <span className="font-bold text-[10px] uppercase tracking-[0.18em]">
                        {dict.tools.passgen[key]}
                      </span>
                      <div
                        className={`w-8 h-4 rounded-full relative transition-colors ${
                          options[key as keyof typeof options]
                            ? "bg-cyan-500"
                            : "bg-zinc-200"
                        }`}
                      >
                        <div
                          className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                            options[key as keyof typeof options]
                              ? "left-4.5"
                              : "left-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-3">
                  <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] px-1">
                    {dict.tools.passgen.separator}
                  </h3>
                  <div className="grid grid-cols-4 gap-3">
                    {(["-", ".", "_", " "] as const).map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setSeparator(item)}
                        className={`min-h-11 rounded-xl border font-mono text-sm transition ${
                          separator === item
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                            : "border-black/5 bg-zinc-100/50 text-zinc-500"
                        }`}
                      >
                        {item === " " ? "Space" : item}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  aria-pressed={includePhraseNumber}
                  onClick={() => setIncludePhraseNumber((value) => !value)}
                  className={`flex min-h-12 w-full items-center justify-between rounded-xl border p-4 text-xs font-medium transition ${
                    includePhraseNumber
                      ? "border-emerald-500/20 bg-emerald-500/5 text-zinc-900"
                      : "border-black/5 bg-zinc-100/50 text-zinc-500"
                  }`}
                >
                  {dict.tools.passgen.include_number}
                  <span>{includePhraseNumber ? "ON" : "OFF"}</span>
                </button>
                <p className="text-xs leading-5 text-zinc-500">
                  {dict.tools.passgen.passphrase_note}
                </p>
              </div>
            )}
          </div>

          <PasswordVaultPanel lang={lang} />

          {/* History Section */}
          <div className="bg-white/30 rounded-3xl border border-zinc-200/50 p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-zinc-600 font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {dict.tools.passgen.history}
              </h3>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                >
                  {dict.tools.passgen.clear_history}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((h, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#fafafa]/30 rounded-xl border border-black/5 group hover:border-emerald-500/30 transition-colors"
                  >
                    <span className="font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors truncate mr-4">
                      {h}
                    </span>
                    <button
                      onClick={() => copyToClipboard(h)}
                      className="p-2 text-zinc-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-700 italic text-sm">
                  {dict.tools.passgen.history_empty}
                </div>
              )}
            </div>

            <p className="mt-6 text-[11px] text-zinc-600 flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
              {dict.tools.passgen.history_helper}
            </p>
          </div>
        </div>
      </div>

      {/* Global Fixed Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#fafafa]/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white border border-black/10 p-10 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QRCodeSVG value={password} size={220} level="M" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-zinc-900 font-medium flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                {lang === "zh"
                    ? "安全传输"
                    : "Secure Transfer"}
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed px-2">
                {lang === "zh"
                    ? "使用移动设备扫描即可安全传输密码，无需使用剪贴板。"
                    : "Scan with your mobile device to securely transfer this password without using the clipboard."}
              </p>
            </div>
            <button
              onClick={() => setShowQR(false)}
              className="mt-4 w-full py-3 bg-zinc-100 hover:bg-zinc-800 text-zinc-700 hover:text-white rounded-xl transition-colors font-medium"
            >
              {lang === "zh" ? "关闭" : "Close"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
