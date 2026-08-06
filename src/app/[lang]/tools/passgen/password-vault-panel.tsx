"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createVault,
  deleteStoredVault,
  encryptVault,
  loadStoredVault,
  parseVaultBackup,
  storeVault,
  unlockVault,
  type VaultDocument,
  type VaultEntry,
  type VaultEnvelope,
} from "@/lib/password-vault";

type Lang = "zh" | "en";

const COPY = {
  zh: {
    title: "本地加密保险库（试用版）", intro: "数据仅以加密形式保存在当前浏览器。忘记主密码无法恢复；清除浏览器数据前请导出加密备份。",
    audit: "这是浏览器本地 MVP，尚未经过独立安全审计，不替代成熟密码管理器。", create: "创建保险库", unlock: "解锁", master: "主密码（至少 12 位）", confirm: "再次输入主密码", mismatch: "两次主密码不一致。", failed: "无法解锁：主密码错误或数据已损坏。",
    lock: "立即锁定", export: "导出加密备份", import: "导入加密备份", importUnlock: "验证并导入", importReady: "已读取加密备份，请输入它的主密码。", add: "新增条目", site: "站点 / 用途", username: "用户名", password: "密码", note: "备注", save: "保存", cancel: "取消", edit: "编辑", remove: "删除", copy: "复制密码", search: "搜索站点或用户名", empty: "暂无条目。", reset: "永久重置保险库", resetHint: "输入“删除”确认，本地加密数据将被永久移除。", resetWord: "删除", resetAction: "确认永久删除", locked: "保险库已锁定。", saved: "已加密保存。", copied: "已复制，将按设定尝试清空剪贴板。", clipboard: "剪贴板清理", seconds: "秒",
  },
  en: {
    title: "Local encrypted vault (preview)", intro: "Data is stored only as encrypted content in this browser. A forgotten master password cannot be recovered; export an encrypted backup before clearing browser data.",
    audit: "This browser-local MVP has not had an independent security audit and does not replace a mature password manager.", create: "Create vault", unlock: "Unlock", master: "Master password (12+ characters)", confirm: "Repeat master password", mismatch: "Master passwords do not match.", failed: "Unable to unlock: wrong master password or damaged data.",
    lock: "Lock now", export: "Export encrypted backup", import: "Import encrypted backup", importUnlock: "Verify and import", importReady: "Encrypted backup loaded. Enter its master password.", add: "Add entry", site: "Site / purpose", username: "Username", password: "Password", note: "Note", save: "Save", cancel: "Cancel", edit: "Edit", remove: "Delete", copy: "Copy password", search: "Search site or username", empty: "No entries yet.", reset: "Permanently reset vault", resetHint: "Type RESET to permanently remove the local encrypted data.", resetWord: "RESET", resetAction: "Permanently delete", locked: "Vault locked.", saved: "Encrypted and saved.", copied: "Copied; the browser will attempt to clear the clipboard after the selected delay.", clipboard: "Clipboard clear", seconds: "sec",
  },
} as const;

export default function PasswordVaultPanel({ lang }: { lang: Lang }) {
  const text = COPY[lang];
  const keyRef = useRef<CryptoKey | null>(null);
  const envelopeRef = useRef<VaultEnvelope | null>(null);
  const masterRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const importPasswordRef = useRef<HTMLInputElement>(null);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exists, setExists] = useState<boolean | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [vaultDocument, setVaultDocument] = useState<VaultDocument>({ entries: [] });
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<VaultEntry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [pendingImport, setPendingImport] = useState<VaultEnvelope | null>(null);
  const [resetText, setResetText] = useState("");
  const [clipboardDelay, setClipboardDelay] = useState(30);

  useEffect(() => { loadStoredVault().then((value) => { envelopeRef.current = value; setExists(Boolean(value)); }).catch(() => setExists(false)); }, []);

  const lock = useCallback(() => {
    keyRef.current = null;
    setVaultDocument({ entries: [] });
    setUnlocked(false);
    setEditing(null);
    setShowForm(false);
    setMessage(text.locked);
  }, [text.locked]);

  useEffect(() => {
    if (!unlocked) return;
    const resetTimer = () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      lockTimerRef.current = setTimeout(lock, 5 * 60_000);
    };
    const onVisibility = () => { if (document.visibilityState === "hidden") lock(); };
    for (const event of ["pointerdown", "keydown", "touchstart"] as const) window.addEventListener(event, resetTimer);
    document.addEventListener("visibilitychange", onVisibility);
    resetTimer();
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
      for (const event of ["pointerdown", "keydown", "touchstart"] as const) window.removeEventListener(event, resetTimer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [lock, unlocked]);

  const create = async () => {
    const password = masterRef.current?.value ?? "";
    if (password !== (confirmRef.current?.value ?? "")) return setMessage(text.mismatch);
    try {
      const result = await createVault(password);
      await storeVault(result.envelope);
      keyRef.current = result.key; envelopeRef.current = result.envelope;
      setVaultDocument(result.document); setExists(true); setUnlocked(true); setMessage(text.saved);
      if (masterRef.current) masterRef.current.value = "";
      if (confirmRef.current) confirmRef.current.value = "";
    } catch { setMessage(text.failed); }
  };

  const unlock = async () => {
    if (!envelopeRef.current) return;
    try {
      const result = await unlockVault(envelopeRef.current, masterRef.current?.value ?? "");
      keyRef.current = result.key; setVaultDocument(result.document); setUnlocked(true); setMessage("");
      if (masterRef.current) masterRef.current.value = "";
    } catch { setMessage(text.failed); }
  };

  const persist = async (next: VaultDocument) => {
    if (!keyRef.current || !envelopeRef.current) return;
    const envelope = await encryptVault(next, keyRef.current, envelopeRef.current);
    await storeVault(envelope);
    envelopeRef.current = envelope; setVaultDocument(next); setMessage(text.saved);
  };

  const saveEntry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const now = new Date().toISOString();
    const entry: VaultEntry = {
      id: editing?.id ?? crypto.randomUUID(), site: String(data.get("site") ?? "").slice(0, 300), username: String(data.get("username") ?? "").slice(0, 500), password: String(data.get("password") ?? "").slice(0, 2000), note: String(data.get("note") ?? "").slice(0, 4000), updatedAt: now,
    };
    if (!entry.site || !entry.password) return;
    const entries = editing ? vaultDocument.entries.map((item) => item.id === entry.id ? entry : item) : [entry, ...vaultDocument.entries];
    await persist({ entries }); setEditing(null); setShowForm(false);
  };

  const copyPassword = async (value: string) => {
    await navigator.clipboard.writeText(value); setMessage(text.copied);
    setTimeout(async () => { try { if (!navigator.clipboard.readText || await navigator.clipboard.readText() === value) await navigator.clipboard.writeText(""); } catch {} }, clipboardDelay * 1000);
  };

  const exportBackup = () => {
    if (!envelopeRef.current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(envelopeRef.current, null, 2)], { type: "application/json" }));
    const link = document.createElement("a"); link.href = url; link.download = `opskitpro-vault-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(url);
  };

  const selectImport = async (file?: File) => {
    if (!file || file.size > 2_000_000) return setMessage(text.failed);
    try { setPendingImport(parseVaultBackup(await file.text())); setMessage(text.importReady); } catch { setMessage(text.failed); }
  };

  const importBackup = async () => {
    if (!pendingImport) return;
    try {
      const result = await unlockVault(pendingImport, importPasswordRef.current?.value ?? "");
      await storeVault(result.envelope); envelopeRef.current = result.envelope; keyRef.current = result.key;
      setVaultDocument(result.document); setExists(true); setUnlocked(true); setPendingImport(null); setMessage(text.saved);
      if (importPasswordRef.current) importPasswordRef.current.value = "";
    } catch { setMessage(text.failed); }
  };

  const reset = async () => {
    if (resetText !== text.resetWord) return;
    await deleteStoredVault(); envelopeRef.current = null; keyRef.current = null;
    setExists(false); setUnlocked(false); setVaultDocument({ entries: [] }); setResetText(""); setMessage("");
  };

  const filtered = vaultDocument.entries.filter((entry) => `${entry.site} ${entry.username}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <section className="mt-10 rounded-3xl border border-emerald-200/70 bg-emerald-50/40 p-6 sm:p-8 space-y-6" aria-labelledby="vault-title">
      <div><h2 id="vault-title" className="text-xl font-black text-zinc-900">{text.title}</h2><p className="mt-2 text-sm leading-6 text-zinc-700">{text.intro}</p><p className="mt-2 text-xs leading-5 text-amber-800">{text.audit}</p></div>
      {message && <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm text-zinc-700">{message}</p>}

      {exists === false && !pendingImport && (
        <div className="grid gap-3"><input ref={masterRef} type="password" autoComplete="new-password" placeholder={text.master} className="min-h-12 rounded-xl border bg-white px-4"/><input ref={confirmRef} type="password" autoComplete="new-password" placeholder={text.confirm} className="min-h-12 rounded-xl border bg-white px-4"/><button onClick={create} className="min-h-12 rounded-xl bg-emerald-700 font-bold text-white">{text.create}</button></div>
      )}
      {exists && !unlocked && !pendingImport && (
        <div className="grid gap-3"><input ref={masterRef} type="password" autoComplete="current-password" placeholder={text.master} className="min-h-12 rounded-xl border bg-white px-4"/><button onClick={unlock} className="min-h-12 rounded-xl bg-emerald-700 font-bold text-white">{text.unlock}</button></div>
      )}

      {pendingImport && !unlocked && <div className="grid gap-3"><input ref={importPasswordRef} type="password" autoComplete="current-password" placeholder={text.master} className="min-h-12 rounded-xl border bg-white px-4"/><button onClick={importBackup} className="min-h-12 rounded-xl bg-emerald-700 font-bold text-white">{text.importUnlock}</button></div>}

      {!unlocked && <label className="block min-h-12 cursor-pointer rounded-xl border border-dashed border-emerald-400 bg-white px-4 py-3 text-center text-sm font-semibold text-emerald-800">{text.import}<input type="file" accept="application/json,.json" className="sr-only" onChange={(event) => selectImport(event.target.files?.[0])}/></label>}

      {unlocked && <div className="space-y-5">
        <div className="flex flex-wrap gap-2"><button onClick={lock} className="min-h-11 rounded-xl border bg-white px-4 text-sm font-semibold">{text.lock}</button><button onClick={exportBackup} className="min-h-11 rounded-xl border bg-white px-4 text-sm font-semibold">{text.export}</button><button onClick={() => { setEditing(null); setShowForm(true); }} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">{text.add}</button></div>
        <label className="flex items-center gap-2 text-xs text-zinc-600">{text.clipboard}<select value={clipboardDelay} onChange={(event) => setClipboardDelay(Number(event.target.value))} className="rounded-lg border bg-white px-2 py-1">{[15,30,60].map((value)=><option key={value} value={value}>{value} {text.seconds}</option>)}</select></label>
        {(showForm || editing) && <form onSubmit={saveEntry} className="grid gap-3 rounded-2xl border bg-white p-4"><input name="site" required defaultValue={editing?.site} placeholder={text.site} className="min-h-11 rounded-lg border px-3"/><input name="username" defaultValue={editing?.username} placeholder={text.username} className="min-h-11 rounded-lg border px-3"/><input name="password" type="password" required defaultValue={editing?.password} placeholder={text.password} className="min-h-11 rounded-lg border px-3"/><textarea name="note" maxLength={4000} defaultValue={editing?.note} placeholder={text.note} className="min-h-24 rounded-lg border p-3"/><div className="flex gap-2"><button className="min-h-11 flex-1 rounded-lg bg-emerald-700 font-semibold text-white">{text.save}</button><button type="button" onClick={()=>{setEditing(null);setShowForm(false);}} className="min-h-11 flex-1 rounded-lg border">{text.cancel}</button></div></form>}
        <input value={search} onChange={(event)=>setSearch(event.target.value)} placeholder={text.search} className="min-h-12 w-full rounded-xl border bg-white px-4"/>
        <div className="space-y-3">{filtered.length ? filtered.map((entry)=><article key={entry.id} className="rounded-2xl border bg-white p-4"><div className="font-bold text-zinc-900">{entry.site}</div><div className="mt-1 text-sm text-zinc-600">{entry.username}</div><div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>copyPassword(entry.password)} className="min-h-10 rounded-lg bg-zinc-900 px-3 text-xs font-semibold text-white">{text.copy}</button><button onClick={()=>{setEditing(entry);setShowForm(true);}} className="min-h-10 rounded-lg border px-3 text-xs font-semibold">{text.edit}</button><button onClick={()=>persist({entries:vaultDocument.entries.filter((item)=>item.id!==entry.id)})} className="min-h-10 rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-700">{text.remove}</button></div></article>) : <p className="text-sm text-zinc-500">{text.empty}</p>}</div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4"><h3 className="font-bold text-red-900">{text.reset}</h3><p className="mt-1 text-xs text-red-800">{text.resetHint}</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><input value={resetText} onChange={(event)=>setResetText(event.target.value)} className="min-h-11 flex-1 rounded-lg border px-3"/><button disabled={resetText!==text.resetWord} onClick={reset} className="min-h-11 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white disabled:opacity-40">{text.resetAction}</button></div></div>
      </div>}
    </section>
  );
}
