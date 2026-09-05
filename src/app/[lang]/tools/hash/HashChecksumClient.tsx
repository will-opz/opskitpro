"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Clipboard, FileUp, RotateCcw, X } from "lucide-react";
import { ToolPageHeader } from "@/components/ToolPageHeader";
import { HASH_FILE_LIMIT_BYTES, compareChecksum, hashText, type HashAlgorithm, type HashWorkerMessage } from "./hash-engine";

type Lang = "en" | "zh";
type Mode = "text" | "file";

const algorithms: Array<{ id: HashAlgorithm; legacy?: boolean }> = [
  { id: "sha256" }, { id: "sha384" }, { id: "sha512" }, { id: "sha1", legacy: true }, { id: "md5", legacy: true },
];

const copy = {
  en: {
    title: "Hash & File Checksum", subtitle: "Generate and compare checksums locally. Text and files never leave this browser.", privacy: "Local processing · Text and files are not uploaded",
    text: "Text", file: "File", algorithm: "Algorithm", recommended: "Recommended", compatibility: "Compatibility only", legacyWarning: "MD5 and SHA-1 are for matching legacy checksums only. Do not use them for passwords, signatures, or security decisions.",
    textLabel: "Text to hash (UTF-8)", textPlaceholder: "Type or paste text…", bytes: "UTF-8 bytes", filePrompt: "Drop one file here or choose a file", choose: "Choose file", filePrivacy: "The file is read in chunks by an isolated browser worker and is never uploaded.",
    noResult: "Enter text or choose a file to calculate a checksum.", processing: "Calculating locally…", cancel: "Cancel", cancelled: "Calculation cancelled.", textLimit: "Text exceeds the 1 MiB browser safety limit. Use file mode for larger input.", fileLimit: "This file exceeds the 2 GiB browser safety limit.", readError: "The content could not be read locally.",
    checksum: "Checksum", copyHash: "Copy checksum", copied: "Copied", copyFailed: "Clipboard access failed", expected: "Expected checksum (optional)", expectedPlaceholder: "Paste a checksum to compare…", match: "Checksum matches", mismatch: "Checksum does not match", invalid: "Expected checksum has the wrong length or format", clear: "Clear", integrity: "A matching checksum confirms identical bytes, not who created or distributed the file.",
  },
  zh: {
    title: "Hash 与文件校验", subtitle: "在浏览器本地生成并比对校验值，文本和文件不会离开当前设备。", privacy: "本地处理 · 文本和文件不会上传",
    text: "文本", file: "文件", algorithm: "算法", recommended: "推荐算法", compatibility: "仅兼容校验", legacyWarning: "MD5 和 SHA-1 仅用于对照旧系统校验值，不能用于密码、签名或安全判断。",
    textLabel: "需要计算的文本（UTF-8）", textPlaceholder: "输入或粘贴文本…", bytes: "UTF-8 字节", filePrompt: "拖入一个文件，或选择文件", choose: "选择文件", filePrivacy: "文件由隔离的浏览器 Worker 分块读取，绝不会上传。",
    noResult: "输入文本或选择文件后计算校验值。", processing: "正在本地计算…", cancel: "取消", cancelled: "已取消计算。", textLimit: "文本超过 1 MiB 浏览器安全上限，请切换到文件模式处理大内容。", fileLimit: "文件超过 2 GiB 浏览器安全上限。", readError: "无法在本地读取内容。",
    checksum: "校验值", copyHash: "复制校验值", copied: "已复制", copyFailed: "无法访问剪贴板", expected: "预期校验值（可选）", expectedPlaceholder: "粘贴校验值进行比对…", match: "校验值一致", mismatch: "校验值不一致", invalid: "预期校验值长度或格式错误", clear: "清空", integrity: "校验值一致只能证明字节相同，不能证明文件由谁创建或发布。",
  },
} as const;

function createHashWorker() { return new Worker(new URL("./hash-worker.ts", import.meta.url), { type: "module" }); }
function formatBytes(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KiB`;
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MiB`;
  return `${(value / 1024 ** 3).toFixed(2)} GiB`;
}

export default function HashChecksumClient({ lang }: { lang: Lang }) {
  const c = copy[lang];
  const [mode, setMode] = useState<Mode>("text");
  const [algorithm, setAlgorithm] = useState<HashAlgorithm>("sha256");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [digest, setDigest] = useState("");
  const [expected, setExpected] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "complete" | "cancelled" | "text_limit" | "file_limit" | "read_error">("idle");
  const [progress, setProgress] = useState(0);
  const [textBytes, setTextBytes] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const workerRef = useRef<Worker | null>(null);
  const requestRef = useRef(0);

  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (mode !== "text") return;
    requestRef.current += 1;
    const request = requestRef.current;
    workerRef.current?.terminate(); workerRef.current = null;
    if (!text) { setDigest(""); setTextBytes(0); setStatus("idle"); return; }
    const timer = window.setTimeout(async () => {
      setStatus("processing");
      try {
        const result = await hashText(text, algorithm);
        if (requestRef.current !== request) return;
        setDigest(result.digest); setTextBytes(result.bytes); setStatus("complete");
      } catch (error) {
        if (requestRef.current === request) setStatus(error instanceof Error && error.message === "text_limit" ? "text_limit" : "read_error");
      }
    }, 150);
    return () => window.clearTimeout(timer);
  }, [algorithm, mode, text]);

  const runFile = (selected: File, nextAlgorithm = algorithm) => {
    requestRef.current += 1; const id = requestRef.current;
    workerRef.current?.terminate(); setDigest(""); setProgress(0); setExpected("");
    if (selected.size > HASH_FILE_LIMIT_BYTES) { setStatus("file_limit"); return; }
    let worker: Worker;
    try { worker = createHashWorker(); } catch { setStatus("read_error"); return; }
    workerRef.current = worker; setStatus("processing");
    worker.onmessage = (event: MessageEvent<HashWorkerMessage>) => {
      if (event.data.id !== id) return;
      if (event.data.type === "progress") setProgress(event.data.total ? event.data.processed / event.data.total : 1);
      if (event.data.type === "complete") { setDigest(event.data.digest); setProgress(1); setStatus("complete"); worker.terminate(); workerRef.current = null; }
      if (event.data.type === "error") { setStatus(event.data.code); worker.terminate(); workerRef.current = null; }
    };
    worker.onerror = () => { if (requestRef.current === id) setStatus("read_error"); worker.terminate(); workerRef.current = null; };
    worker.postMessage({ id, file: selected, algorithm: nextAlgorithm });
  };

  useEffect(() => { if (mode === "file" && file) runFile(file, algorithm); }, [algorithm]); // eslint-disable-line react-hooks/exhaustive-deps

  const comparison = useMemo(() => digest ? compareChecksum(digest, expected, algorithm) : { status: "empty" as const }, [algorithm, digest, expected]);
  const selectFile = (selected?: File) => { if (!selected) return; setFile(selected); setMode("file"); runFile(selected); };
  const cancel = () => { requestRef.current += 1; workerRef.current?.terminate(); workerRef.current = null; setStatus("cancelled"); setProgress(0); };
  const clear = () => { cancel(); setText(""); setFile(null); setDigest(""); setExpected(""); setTextBytes(0); setStatus("idle"); };
  const copyDigest = async () => { try { await navigator.clipboard.writeText(digest); setCopyState("copied"); } catch { setCopyState("failed"); } window.setTimeout(() => setCopyState("idle"), 1800); };
  const setNextAlgorithm = (next: HashAlgorithm) => { setAlgorithm(next); setDigest(""); setExpected(""); };

  return <main className="tool-page max-w-6xl">
    <ToolPageHeader title={c.title} description={c.subtitle} processing={c.privacy} />
    <section className="mt-6 grid items-start gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="ui-surface-elevated rounded-2xl p-4 sm:p-6">
        <div className="grid grid-cols-2 rounded-xl bg-[var(--surface-secondary)] p-1" role="tablist">
          {(["text", "file"] as Mode[]).map((item) => <button key={item} role="tab" aria-selected={mode === item} onClick={() => { requestRef.current += 1; setMode(item); setDigest(""); setExpected(""); setStatus("idle"); workerRef.current?.terminate(); workerRef.current = null; }} className={`min-h-11 rounded-lg text-sm font-semibold ${mode === item ? "bg-[var(--bg-primary)] text-[var(--accent-text)] shadow-sm" : "text-[var(--text-muted)]"}`}>{c[item]}</button>)}
        </div>
        <fieldset className="mt-5"><legend className="text-sm font-semibold text-[var(--text-primary)]">{c.algorithm}</legend><div className="mt-2 flex flex-wrap gap-2">{algorithms.map((item) => <button key={item.id} type="button" aria-pressed={algorithm === item.id} onClick={() => setNextAlgorithm(item.id)} className={`min-h-11 rounded-xl border px-3 text-xs font-semibold uppercase ${algorithm === item.id ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : item.legacy ? "border-amber-500/25 text-[var(--warning-text)]" : "border-[var(--border-subtle)] text-[var(--text-muted)]"}`}>{item.id.replace("sha", "SHA-").toUpperCase()}</button>)}</div></fieldset>
        {(algorithm === "md5" || algorithm === "sha1") && <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-3 text-xs leading-5 text-[var(--warning-text)]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{c.legacyWarning}</div>}
        {mode === "text" ? <div className="mt-5"><div className="flex justify-between gap-3"><label htmlFor="hash-text" className="text-sm font-semibold text-[var(--text-primary)]">{c.textLabel}</label><span className="text-xs text-[var(--text-muted)]">{textBytes.toLocaleString()} {c.bytes}</span></div><textarea id="hash-text" value={text} onChange={(e) => setText(e.target.value)} placeholder={c.textPlaceholder} className="mt-2 min-h-48 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm leading-6 outline-none focus:border-emerald-500/50" /></div>
        : <div className="mt-5"><label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); selectFile(e.dataTransfer.files[0]); }} className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-500/30 bg-emerald-500/[0.04] p-5 text-center"><FileUp className="h-8 w-8 text-[var(--accent-text)]" /><span className="mt-3 text-sm font-semibold text-[var(--text-primary)]">{c.filePrompt}</span><span className="mt-3 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">{c.choose}</span><input type="file" className="sr-only" onChange={(e) => selectFile(e.target.files?.[0])} /></label><p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">{c.filePrivacy}</p>{file && <p className="mt-3 break-all text-sm font-semibold text-[var(--text-primary)]">{file.name} · {formatBytes(file.size)}</p>}</div>}
        <button type="button" onClick={clear} className="ui-button-ghost mt-4 min-h-11 border border-[var(--border-subtle)] px-4 text-sm"><RotateCcw className="h-4 w-4" />{c.clear}</button>
      </div>
      <div className="ui-surface rounded-2xl p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">{c.checksum}</h2>
        <div aria-live="polite" className="mt-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 text-sm text-[var(--text-secondary)]">{status === "processing" ? c.processing : status === "cancelled" ? c.cancelled : status === "text_limit" ? c.textLimit : status === "file_limit" ? c.fileLimit : status === "read_error" ? c.readError : digest ? `${algorithm.toUpperCase()} · ${mode === "file" && file ? formatBytes(file.size) : `${textBytes.toLocaleString()} B`}` : c.noResult}</div>
        {status === "processing" && mode === "file" && <div className="mt-4"><div className="h-2 overflow-hidden rounded-full bg-[var(--surface-secondary)]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}><div className="h-full bg-emerald-500" style={{ width: `${progress * 100}%` }} /></div><button type="button" onClick={cancel} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-500/25 px-3 text-xs font-semibold text-[var(--warning-text)]"><X className="h-4 w-4" />{c.cancel}</button></div>}
        {digest && <><div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-3"><code data-testid="hash-output" className="block break-all font-mono text-sm leading-6 text-[var(--text-primary)]">{digest}</code><button type="button" onClick={copyDigest} className="ui-button-primary mt-3 min-h-10 px-3 text-xs">{copyState === "copied" ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copyState === "copied" ? c.copied : copyState === "failed" ? c.copyFailed : c.copyHash}</button></div><label htmlFor="expected-hash" className="mt-6 block text-sm font-semibold text-[var(--text-primary)]">{c.expected}</label><textarea id="expected-hash" rows={3} value={expected} onChange={(e) => setExpected(e.target.value)} placeholder={c.expectedPlaceholder} spellCheck={false} className="mt-2 w-full resize-y rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 font-mono text-sm outline-none focus:border-emerald-500/50" />{comparison.status !== "empty" && <p className={`mt-3 flex items-center gap-2 text-sm font-semibold ${comparison.status === "match" ? "text-[var(--accent-text)]" : "text-[var(--warning-text)]"}`}>{comparison.status === "match" ? <Check className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}{comparison.status === "match" ? c.match : comparison.status === "mismatch" ? c.mismatch : c.invalid}</p>}</>}
        <p className="mt-6 text-xs leading-5 text-[var(--text-muted)]">{c.integrity}</p>
      </div>
    </section>
  </main>;
}
