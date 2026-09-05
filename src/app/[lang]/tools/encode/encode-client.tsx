"use client";

import { useMemo, useState } from "react";
import { Braces, Check, Copy, RefreshCw } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";

type Lang = "zh" | "en";
type Mode =
  | "base64-encode"
  | "base64-decode"
  | "url-encode"
  | "url-decode"
  | "jwt-decode";

const copy = {
  zh: {
    home: "首页",
    tools: "工具",
    badge: "编码工具",
    title: "编码与解码",
    desc: "Base64、URL 编码和 JWT payload 解码，全部在本地处理。",
    input: "输入",
    output: "输出",
    placeholder: "输入文本、Base64、URL 编码内容或 JWT...",
    copy: "复制",
    copied: "已复制",
    clear: "清空",
    error: "无法处理当前输入，请检查格式。",
  },
  en: {
    home: "Home",
    tools: "Tools",
    badge: "Encoding Toolkit",
    title: "Encoding Toolkit",
    desc: "Base64, URL encoding, and JWT payload decoding. Everything runs locally.",
    input: "Input",
    output: "Output",
    placeholder: "Paste text, Base64, URL-encoded content, or a JWT...",
    copy: "Copy",
    copied: "Copied",
    clear: "Clear",
    error: "Unable to process this input. Please check the format.",
  },
} satisfies Record<Lang, Record<string, string>>;

const modes: Array<{ id: Mode; label: string }> = [
  { id: "base64-encode", label: "Base64 Encode" },
  { id: "base64-decode", label: "Base64 Decode" },
  { id: "url-encode", label: "URL Encode" },
  { id: "url-decode", label: "URL Decode" },
  { id: "jwt-decode", label: "JWT Decode" },
];

function encodeBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)));
}

function decodeBase64(value: string) {
  return decodeURIComponent(escape(atob(value.trim())));
}

function decodeJwtPayload(value: string) {
  const parts = value.trim().split(".");
  if (parts.length < 2) throw new Error("Invalid JWT");
  const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = decodeBase64(padded);

  try {
    return JSON.stringify(JSON.parse(decoded), null, 2);
  } catch {
    return decoded;
  }
}

function transform(mode: Mode, value: string) {
  if (!value) return "";

  switch (mode) {
    case "base64-encode":
      return encodeBase64(value);
    case "base64-decode":
      return decodeBase64(value);
    case "url-encode":
      return encodeURIComponent(value);
    case "url-decode":
      return decodeURIComponent(value);
    case "jwt-decode":
      return decodeJwtPayload(value);
  }
}

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export default function EncodeClient({
  lang,
}: {
  dict: any;
  lang: Lang;
}) {
  const t = copy[lang] || copy.zh;
  const [mode, setMode] = useState<Mode>("base64-decode");
  const [input, setInput] = useState("SGVsbG8sIE9wc0tpdFBybyE=");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    try {
      return { value: transform(mode, input), error: "" };
    } catch {
      return { value: "", error: t.error };
    }
  }, [input, mode, t.error]);

  const copyOutput = async () => {
    if (!result.value) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
    await writeClipboard(result.value);
  };

  return (
    <main className="min-h-0 bg-[var(--bg-primary)] px-4 pb-8 pt-6 text-[var(--text-secondary)] sm:px-6 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <ToolPageHeader
          title={t.title}
          description={t.desc}
          processing={lang === "zh" ? "本地处理 · 不上传" : "Local processing · Not uploaded"}
        />

        <section className="op-card mt-6 rounded-[1.5rem] p-4 sm:p-5">
          <div className="flex flex-wrap gap-2">
            {modes.map((item) => {
              const active = item.id === mode;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? "border-emerald-500 bg-[var(--accent-color)] text-[var(--accent-contrast)] shadow-sm"
                      : "border-[var(--border-strong)] bg-[var(--surface-primary)] text-[var(--text-secondary)] hover:border-emerald-500/30 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]"
                  }`}
                >
                  {lang === "zh" ? ({ "base64-encode": "Base64 编码", "base64-decode": "Base64 解码", "url-encode": "URL 编码", "url-decode": "URL 解码", "jwt-decode": "JWT 解码" }[item.id]) : item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="tool-grid">
          <div className="op-card rounded-[1.5rem] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label
                htmlFor="encode-input"
                className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]"
              >
                {t.input}
              </label>
              <button
                type="button"
                onClick={() => setInput("")}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t.clear}
              </button>
            </div>
            <textarea
              id="encode-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              className="h-48 min-h-48 sm:h-72 w-full resize-y rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="op-card rounded-[1.5rem] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                <Braces className="h-4 w-4 text-[var(--accent-text)]" />
                {t.output}
              </div>
              <button
                type="button"
                onClick={copyOutput}
                disabled={!result.value}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold text-[var(--text-muted)] transition hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)] disabled:opacity-40"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-[var(--accent-text)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                {copied ? t.copied : t.copy}
              </button>
            </div>

            <pre className="min-h-20 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-4 font-mono text-sm leading-6 text-[var(--text-primary)]">
              {result.error || result.value}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
