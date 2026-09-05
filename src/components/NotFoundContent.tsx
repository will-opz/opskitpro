"use client";
/* eslint-disable @next/next/no-html-link-for-pages -- Recovery links must load a fresh root layout from the global 404. */

import { usePathname } from "next/navigation";
import { Home, ArrowLeft } from "lucide-react";

export function NotFoundContent() {
  const pathname = usePathname();
  const zh = pathname?.startsWith("/zh");
  const lang = zh ? "zh" : "en";
  return (
    <main className="mx-auto flex min-h-[65vh] max-w-lg flex-col justify-center gap-4 px-6 py-12">
      <p className="text-sm font-semibold text-[var(--accent-text)]">404 · OpsKitPro</p>
      <h1 className="text-3xl font-semibold">{zh ? "找不到这个页面" : "Page not found"}</h1>
      <p className="text-[var(--text-secondary)]">{zh ? "链接可能已更改。你可以返回首页，或浏览全部工具。" : "This link may have changed. Return home or browse all tools."}</p>
      <div className="flex flex-wrap gap-3">
        <a className="ui-button-primary" href={`/${lang}`}><Home className="h-4 w-4" />{zh ? "返回首页" : "Go home"}</a>
        <a className="ui-button-secondary" href={`/${lang}/tools`}>{zh ? "全部工具" : "All tools"}</a>
        <button className="ui-button-ghost" onClick={() => window.history.back()}><ArrowLeft className="h-4 w-4" />{zh ? "返回上一页" : "Go back"}</button>
      </div>
    </main>
  );
}
