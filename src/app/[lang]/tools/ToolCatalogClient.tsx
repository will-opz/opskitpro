"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Binary,
  Braces,
  Clock3,
  Cloud,
  Code2,
  Globe,
  GitCompareArrows,
  Hash as HashIcon,
  Palette,
  ImageIcon,
  KeyRound,
  Fingerprint,
  ShieldAlert,
  Network,
  QrCode,
  Search,
  ScanSearch,
  ShieldCheck,
  WandSparkles,
  Wifi,
} from "lucide-react";
import {
  localizeTool,
  toolCategoryOrder,
  toolCategoryCopy,
  type ToolPrimaryCategory,
  type ProductLocale,
  type ProductToolId,
  type ToolProcessingMode,
} from "@/lib/tool-catalog";

import { searchTools } from "@/lib/tool-search";

const icons = {
  "website-check": Activity,
  "network-doctor": Network,
  "dns-security": ShieldCheck,
  "ip-lookup": Globe,
  "cloudflare-trace": Cloud,
  api: Code2,
  json: Braces,
  websocket: Network,
  passgen: KeyRound,
  qrgen: QrCode,
  jwt: ShieldCheck,
  uuid: Fingerprint,
  encode: Binary,
  time: Clock3,
  "prompt-builder": WandSparkles,
  regex: ScanSearch,
  hash: HashIcon,
  "sensitive-data": ShieldAlert,
  cron: Clock3,
  yaml: Braces,
  sql: Code2,
  color: Palette,
  diff: GitCompareArrows,
} satisfies Record<ProductToolId, typeof Activity>;

const copy = {
  en: {
    search: "Find a tool or task",
    searchHint: "Search by name, task, or input type",
    filters: { all: "All", local: "Local processing", network: "Online diagnostics" },
    empty: "No tools match this search.",
    local: "Local processing · Not uploaded",
    network: "Internet required",
    networkTag: "Network-assisted",
    locations: {LOCAL:"Browser", EDGE:"Edge", REMOTE:"Remote service"},
    paths: {
      none: "Stays in this browser",
      "direct-target": "Browser connects directly to your target",
      "cloudflare-edge": "Observed at Cloudflare edge",
      "opskitpro-probe": "Sent to the OpsKitPro probe",
      mixed: "Browser, edge, and probe observations",
    },
    categories: toolCategoryCopy.en,
  },
  zh: {
    search: "查找工具或任务",
    searchHint: "按名称、用途或输入类型搜索",
    filters: { all: "全部", local: "本地处理", network: "联网诊断" },
    empty: "没有符合条件的工具。",
    local: "本地处理 · 不上传",
    network: "需要联网",
    networkTag: "需联网",
    locations: {LOCAL:"浏览器", EDGE:"边缘", REMOTE:"远程服务"},
    paths: {
      none: "数据留在当前浏览器",
      "direct-target": "浏览器直接连接你的目标",
      "cloudflare-edge": "由 Cloudflare 边缘观察",
      "opskitpro-probe": "发送给 OpsKitPro 探针",
      mixed: "浏览器、边缘和探针共同观察",
    },
    categories: toolCategoryCopy.zh,
  },
} as const;

type Filter = "all" | ToolProcessingMode;
type CategoryFilter = "all" | ToolPrimaryCategory;

export function ToolCatalogClient({ lang }: { lang: ProductLocale }) {
  const text = copy[lang];
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") || "");
      const category = params.get("category") as ToolPrimaryCategory;
      setCategoryFilter(toolCategoryOrder.includes(category) ? category : "all");
      const mode = params.get("mode");
      setFilter(mode === "local" || mode === "network" ? mode : "all");
    };
    restore(); window.addEventListener("popstate",restore);
    return () => window.removeEventListener("popstate",restore);
  }, []);
  const update = (next: {query?:string; category?:CategoryFilter; mode?:Filter}) => {
    const values = {query:next.query ?? query, category:next.category ?? categoryFilter, mode:next.mode ?? filter};
    setQuery(values.query);setCategoryFilter(values.category);setFilter(values.mode);
    const url = new URL(window.location.href);
    for (const [key,value] of [["q",values.query],["category",values.category],["mode",values.mode]]) {
      if (!value || (key !== "q" && value === "all")) url.searchParams.delete(key); else url.searchParams.set(key,value);
    }
    window.history.replaceState(window.history.state,"",url);
  };
  const matches = useMemo(()=>searchTools(query,{lang,category:categoryFilter,mode:filter}),[query,lang,categoryFilter,filter]);
  const groups = query.trim()
    ? [{category:"results" as const,tools:matches}].filter(group=>group.tools.length)
    : toolCategoryOrder.map(category=>({category,tools:matches.filter(result=>result.tool.primaryCategory===category)})).filter(group=>group.tools.length);

  return (
    <div className="mt-6">
      <div className="ui-surface rounded-2xl p-4 sm:p-5">
        <label htmlFor="tool-search" className="text-sm font-semibold text-[var(--text-primary)]">
          {text.search}
        </label>
        <div className="relative mt-2">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(event) => update({query:event.target.value})}
            placeholder={text.searchHint}
            className="min-h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2.5 pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-secondary)] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label={lang === "zh" ? "按处理方式筛选" : "Filter by processing mode"}>
          {(["all", "local", "network"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => update({mode:value})}
              className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${filter === value ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"}`}
            >
              {text.filters[value]}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label={lang === "zh" ? "按分类筛选" : "Filter by category"}>
          <button
            type="button"
            aria-pressed={categoryFilter === "all"}
            onClick={() => update({category:"all"})}
            className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${categoryFilter === "all" ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"}`}
          >
            {lang === "zh" ? "全部分类" : "All categories"}
          </button>
          {toolCategoryOrder.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={categoryFilter === category}
              onClick={() => update({category})}
              className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${categoryFilter === category ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--accent-text)]" : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)]"}`}
            >
              {text.categories[category][0]}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] p-10 text-center text-sm text-[var(--text-secondary)]">{text.empty}</div>
      ) : (
        <div className="mt-7 space-y-8">
          {groups.map(({ category, tools }) => {
            const [title, description] = category === "results" ? [lang === "zh" ? "搜索结果" : "Search results", lang === "zh" ? "按任务相关性排序" : "Sorted by task relevance"] : text.categories[category];
            const CategoryIcon =
              category === "secure"
                ? ShieldCheck
                : category === "generate"
                  ? ImageIcon
                  : category === "diagnose"
                    ? Wifi
                    : category === "inspect"
                      ? Network
                      : Code2;
            return (
              <section key={category} aria-labelledby={`category-${category}`}>
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500"><CategoryIcon className="h-5 w-5" /></span>
                  <div>
                    <h2 id={`category-${category}`} className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map(({tool:rawTool,note}) => {
                    const tool = localizeTool(rawTool, lang);
                    const Icon = icons[tool.id];
                    const isLocal = tool.processingMode === "local" && tool.networkPath === "none";
                    return (
                      <Link data-tool-id={tool.id} key={tool.id} href={`/${lang}${tool.href}`} className="group flex min-h-[136px] flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-4 transition hover:border-[var(--accent-text)] hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="shrink-0 rounded-lg bg-[var(--accent-soft)] p-1.5 text-[var(--accent-text)]"><Icon aria-hidden="true" className="h-5 w-5" /></span>
                          <h3 className="text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">{tool.title}</h3>
                        </div>
                        <p className="mb-1.5 mt-1.5 text-sm leading-5 text-[var(--text-secondary)]">{note || tool.description}</p>
                        <p className="mt-auto text-[13px] font-medium leading-5 text-[var(--accent-text)]">
                          {isLocal ? text.local : `${text.networkTag} · ${tool.networkPath === "direct-target" ? text.paths["direct-target"] : tool.processingLocations.map(location=>text.locations[location]).join(" / ")}`}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
