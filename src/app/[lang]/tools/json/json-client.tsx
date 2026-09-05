"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  Braces,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Minimize2,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react";
import { JsonEditor } from "./components";
import { getJsonStats, jsonToToml, jsonToYaml, repairJson } from "./hooks";
import { ToolPageHeader } from "@/components/ToolPageHeader";

type Lang = "zh" | "en";
type ResultKind = "formatted" | "minified" | "repaired" | "yaml" | "toml" | null;

const SAMPLE_JSON = `{
  "project": "OpsKitPro",
  "status": "operational",
  "tools": ["website-check", "json", "password-generator"]
}`;

const ACTION_CLASS = "flex min-h-10 items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-primary)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-emerald-200 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)] disabled:cursor-not-allowed disabled:opacity-35";

export default function JSONClient({ dict, lang }: { dict: any; lang: Lang }) {
  const copy = dict.tools.json;
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [resultKind, setResultKind] = useState<ResultKind>(null);
  const [fixes, setFixes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [showConvert, setShowConvert] = useState(false);

  const validation = useMemo(() => {
    if (!input.trim()) return { state: "idle" as const, error: "" };
    try {
      JSON.parse(input);
      return { state: "valid" as const, error: "" };
    } catch (error) {
      return {
        state: "invalid" as const,
        error: error instanceof Error ? error.message : copy.invalid,
      };
    }
  }, [copy.invalid, input]);

  const stats = useMemo(
    () => validation.state === "valid" ? getJsonStats(input) : null,
    [input, validation.state],
  );

  const setJsonResult = (kind: Exclude<ResultKind, "repaired" | "yaml" | "toml" | null>) => {
    try {
      const parsed = JSON.parse(input);
      setOutput(kind === "formatted" ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed));
      setResultKind(kind);
      setFixes([]);
    } catch {
      setOutput("");
      setResultKind(null);
    }
  };

  const handleRepair = () => {
    if (!input.trim()) return;
    const repaired = repairJson(input);
    try {
      setOutput(JSON.stringify(JSON.parse(repaired.repaired), null, 2));
      setResultKind("repaired");
      setFixes(repaired.fixes);
    } catch {
      setOutput("");
      setResultKind(null);
      setFixes(repaired.fixes);
    }
  };

  const handleConvert = (target: "yaml" | "toml") => {
    const converted = target === "yaml" ? jsonToYaml(input) : jsonToToml(input);
    setShowConvert(false);
    setFixes([]);
    if (converted.error) {
      setOutput("");
      setResultKind(null);
      return;
    }
    setOutput(converted.output);
    setResultKind(target);
  };

  const copyResult = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError(copy.copy_error);
    }
  };

  const clearAll = () => {
    setInput("");
    setOutput("");
    setResultKind(null);
    setFixes([]);
    setCopyError("");
    setShowConvert(false);
  };

  const applyOutput = () => {
    if (!output || resultKind === "yaml" || resultKind === "toml") return;
    setInput(output);
    setOutput("");
    setResultKind(null);
    setFixes([]);
  };

  const resultLabel = resultKind ? copy[`result_${resultKind}`] : copy.output;

  return (
    <div className="relative overflow-hidden bg-[var(--bg-primary)] px-4 pb-8 pt-6 font-sans text-[var(--text-secondary)] sm:px-6 md:pt-8 lg:px-8">
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-full max-w-[800px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />
      <div className="mx-auto max-w-7xl">
        <ToolPageHeader
          title={dict.tools.json_title}
          description={dict.tools.json_desc}
          processing={lang === "zh" ? "本地处理 · 不上传" : "Local processing · Not uploaded"}
        />

        <main className="mt-6 overflow-hidden rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-primary)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-strong)] bg-[var(--surface-secondary)] px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setJsonResult("formatted")} disabled={validation.state !== "valid"} className={`${ACTION_CLASS} border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-500 hover:text-white`}>
                <Sparkles className="h-4 w-4" />{copy.format}
              </button>
              <button type="button" onClick={() => setJsonResult("minified")} disabled={validation.state !== "valid"} className={ACTION_CLASS}>
                <Minimize2 className="h-4 w-4" />{copy.minify}
              </button>
              <button type="button" onClick={handleRepair} disabled={!input.trim() || validation.state === "valid"} className={ACTION_CLASS}>
                <Wrench className="h-4 w-4" />{copy.repair}
              </button>
              <div className="relative">
                <button type="button" aria-expanded={showConvert} onClick={() => setShowConvert((value) => !value)} disabled={validation.state !== "valid"} className={ACTION_CLASS}>
                  <ArrowRightLeft className="h-4 w-4" />{copy.convert}<ChevronDown className="h-3.5 w-3.5" />
                </button>
                {showConvert && (
                  <div className="absolute left-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-[var(--border-strong)] bg-[var(--surface-primary)] p-1.5 shadow-sm">
                    <button type="button" onClick={() => handleConvert("yaml")} className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]">JSON → YAML</button>
                    <button type="button" onClick={() => handleConvert("toml")} className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]">JSON → TOML</button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setInput(SAMPLE_JSON)} className={ACTION_CLASS}>{copy.sample}</button>
              <button type="button" onClick={clearAll} disabled={!input && !output} className={`${ACTION_CLASS} hover:!border-red-200 hover:!bg-[var(--danger-soft)] hover:!text-[var(--danger-text)]`}><Trash2 className="h-4 w-4" />{copy.clear}</button>
            </div>
          </div>

          <div className="grid items-start grid-cols-1 divide-y divide-zinc-200 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
            <section aria-labelledby="json-input-title" className="min-w-0 bg-[var(--surface-primary)]">
              <div className="flex min-h-11 items-center justify-between border-b border-[var(--border-subtle)] px-4">
                <h2 id="json-input-title" className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">{copy.input}</h2>
                <span className={`flex items-center gap-1.5 text-xs font-semibold ${validation.state === "valid" ? "text-[var(--accent-text)]" : validation.state === "invalid" ? "text-[var(--danger-text)]" : "text-[var(--text-muted)]"}`}>
                  {validation.state === "valid" ? <CheckCircle2 className="h-3.5 w-3.5" /> : validation.state === "invalid" ? <AlertTriangle className="h-3.5 w-3.5" /> : <Braces className="h-3.5 w-3.5" />}
                  {validation.state === "valid" ? copy.valid : validation.state === "invalid" ? copy.invalid : copy.idle}
                </span>
              </div>
              <JsonEditor value={input} onChange={setInput} onValidate={() => {}} placeholder={copy.placeholder} />
              <div className={`min-h-12 border-t px-4 py-3 text-xs ${validation.state === "invalid" ? "border-red-100 bg-[var(--danger-soft)] text-[var(--danger-text)]" : "border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-[var(--text-muted)]"}`}>
                {validation.state === "invalid" ? validation.error : stats ? `${stats.type} · ${stats.keys} ${copy.keys} · ${copy.depth} ${stats.depth} · ${stats.size}` : copy.input_hint}
              </div>
            </section>

            <section aria-labelledby="json-output-title" className="min-w-0 bg-[var(--surface-secondary)]">
              <div className="flex min-h-11 items-center justify-between gap-2 border-b border-[var(--border-subtle)] px-4">
                <h2 id="json-output-title" className="text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent-text)]">{resultLabel}</h2>
                <div className="flex items-center gap-2">
                  {output && resultKind !== "yaml" && resultKind !== "toml" && <button type="button" onClick={applyOutput} className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--accent-text)]">{copy.apply_input}</button>}
                  <button type="button" onClick={copyResult} disabled={!output} className={`${ACTION_CLASS} !min-h-8 !px-2.5 !py-1.5`}>
                    {copied ? <Check className="h-3.5 w-3.5 text-[var(--accent-text)]" /> : <Copy className="h-3.5 w-3.5" />}{copied ? copy.copied : copy.copy}
                  </button>
                </div>
              </div>
              <pre data-testid="json-output" className="min-h-24 max-h-[640px] overflow-auto whitespace-pre-wrap break-words p-5 font-mono text-[13px] leading-relaxed text-[var(--text-primary)] sm:p-6">{output || <span className="italic text-[var(--text-faint)]">{copy.output_hint}</span>}</pre>
              <div className="min-h-12 border-t border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3 text-xs text-[var(--text-muted)]">
                {copyError || (fixes.length ? `${copy.repair_summary}: ${fixes.join("; ")}` : copy.local_note)}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
