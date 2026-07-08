"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, ArrowRight, Zap, ShieldCheck } from "lucide-react";

export default function HomeSearch({
  dict,
  lang,
  compact = false,
}: {
  dict: any;
  lang: "zh" | "en";
  compact?: boolean;
}) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // For now, redirect to search or a default tool (IP) with the query
    // In the future, this should lead to a dedicated /diagnostics page
    router.push(
      `/${lang}/tools/website-check?q=${encodeURIComponent(query.trim())}`,
    );
  };

  const quickChecks = [
    { name: dict.home.features.dns, icon: Zap },
    { name: dict.home.features.ssl, icon: ShieldCheck },
    { name: dict.home.features.cdn, icon: Globe },
  ];

  return (
    <div
      className={`${compact ? "w-full" : "mx-auto mb-10 w-full max-w-3xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 md:mb-12"}`}
    >
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 rounded-xl bg-emerald-500/10 blur-2xl opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100"></div>
        <div
          className={`ui-surface-elevated relative flex flex-col gap-2 overflow-hidden ${compact ? "rounded-xl p-1.5" : "rounded-2xl p-2"} sm:flex-row sm:items-center`}
        >
          <div className="flex min-w-0 flex-1 items-center">
            <div
              className={`${compact ? "h-10 w-10" : "h-12 w-12"} flex shrink-0 items-center justify-center text-[var(--text-muted)]`}
            >
              <Globe
                className={`${compact ? "h-4 w-4" : "h-5 w-5"} group-focus-within:text-[var(--accent-color)]`}
              />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={dict.home.diagnostics_placeholder}
              className={`${compact ? "min-h-10 text-sm" : "min-h-12"} min-w-0 flex-grow border-none bg-transparent px-2 font-sans text-[var(--text-primary)] outline-none placeholder:text-[var(--text-faint)]`}
            />
          </div>
          <button
            type="submit"
            className={`ui-button-primary shrink-0 ${compact ? "min-h-10 rounded-lg px-4 text-xs" : "min-h-12"}`}
          >
            {dict.home.diagnostics_btn}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
      {!compact && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            {quickChecks.map((item) => (
              <div key={item.name} className="ui-chip select-none">
                <item.icon className="w-3 h-3" />
                <span>{item.name}</span>
              </div>
            ))}
          </div>

          <div className="ui-faint mt-6 text-[10px] tracking-[0.2em]">
            {dict.home.trust_footer}
          </div>
        </>
      )}
    </div>
  );
}
