"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { parseWebsiteTarget } from "@/lib/diagnostic-target";

export default function HomeSearch({ lang }: { lang: "zh" | "en" }) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();
  const id = useId();
  const zh = lang === "zh";
  return (
    <form onSubmit={(event) => {
      event.preventDefault();
      const target = parseWebsiteTarget(query);
      if (!target) { setError(true); return; }
      router.push(`/${lang}/tools/website-check?q=${encodeURIComponent(target)}`);
    }}>
      <label htmlFor={id} className="block text-sm font-semibold text-[var(--text-primary)]">
        {zh ? "域名或 URL" : "Domain or URL"}
      </label>
      <input id={id} type="text" required value={query}
        onChange={(event) => { setQuery(event.target.value); setError(false); }}
        placeholder="example.com" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        aria-invalid={error || undefined}
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        className="mt-2 min-h-12 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-secondary)] px-3 text-base text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" />
      {error && <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">
        {zh ? "请输入有效域名或 HTTP(S) URL，例如 example.com。" : "Enter a valid domain or HTTP(S) URL, such as example.com."}
      </p>}
      <button type="submit" className="ui-button-primary mt-3 min-h-12 w-full">
        {zh ? "开始检测" : "Start check"}<ArrowRight aria-hidden="true" className="h-4 w-4" />
      </button>
      <p id={`${id}-hint`} className="mt-3 text-[13px] leading-5 text-[var(--text-secondary)]">
        {zh ? "仅检测域名；URL 路径、参数和登录信息不会传递。" : "Only the hostname is checked. URL paths, query parameters and credentials are not passed on."}
      </p>
    </form>
  );
}
