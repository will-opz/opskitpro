"use client";
import { useState } from "react";
import { Copy } from "lucide-react";

export function CodeBlock({ children, lang }: { children: string; lang: "zh" | "en" }) {
  const [status, setStatus] = useState("");
  async function copy() {
    try { await navigator.clipboard.writeText(children); setStatus(lang === "zh" ? "已复制" : "Copied"); }
    catch { setStatus(lang === "zh" ? "复制失败，请手动选择文本" : "Copy failed. Select the text manually."); }
  }
  return <div className="my-3 min-w-0 overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)]">
    <div className="flex items-center justify-end gap-3 border-b border-[var(--border-subtle)] px-3 py-1">
      <span role="status" className="text-xs text-[var(--text-secondary)]">{status}</span>
      <button type="button" onClick={copy} className="ui-button-ghost text-xs"><Copy className="h-4 w-4" />{lang === "zh" ? "复制代码" : "Copy code"}</button>
    </div>
    <pre className="overflow-x-auto p-4 text-sm leading-6 text-[var(--text-primary)]"><code>{children}</code></pre>
  </div>;
}
