"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity,
  Binary,
  Braces,
  Clock3,
  Cloud,
  Code2,
  Globe,
  Hash as HashIcon,
  Palette,
  ImageIcon,
  KeyRound,
  ShieldAlert,
  Network,
  QrCode,
  Search,
  ScanSearch,
  ShieldCheck,
  Star,
  WandSparkles,
  Wifi,
} from "lucide-react";
import {
  localizeTool,
  productTools,
  type ProductLocale,
  type ProductToolId,
  type ToolProcessingMode,
} from "@/lib/tool-catalog";

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
  jwt: KeyRound,
  uuid: KeyRound,
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
} satisfies Record<ProductToolId, typeof Activity>;

type DisplayCategory = "security-first" | "developer-tooling" | "content-utility" | "ops-network" | "developer-debug";
type ToolPriority = "high" | "recommended" | "normal";

const categoryOrder: DisplayCategory[] = [
  "security-first",
  "developer-tooling",
  "content-utility",
  "developer-debug",
  "ops-network",
];

const toolCategory: Record<ProductToolId, DisplayCategory> = {
  "website-check": "ops-network",
  "network-doctor": "ops-network",
  "dns-security": "ops-network",
  "ip-lookup": "ops-network",
  "cloudflare-trace": "ops-network",
  api: "developer-debug",
  json: "developer-tooling",
  websocket: "developer-debug",
  passgen: "security-first",
  qrgen: "content-utility",
  encode: "developer-tooling",
  time: "content-utility",
  "prompt-builder": "developer-tooling",
  regex: "developer-tooling",
  hash: "security-first",
  jwt: "security-first",
  uuid: "security-first",
  "sensitive-data": "security-first",
  cron: "developer-tooling",
  yaml: "developer-tooling",
  sql: "developer-tooling",
  color: "content-utility",
};

const toolPriority: Record<ProductToolId, ToolPriority> = {
  "website-check": "recommended",
  "network-doctor": "recommended",
  "dns-security": "recommended",
  "ip-lookup": "normal",
  "cloudflare-trace": "normal",
  api: "recommended",
  json: "recommended",
  websocket: "normal",
  passgen: "high",
  qrgen: "normal",
  jwt: "high",
  uuid: "high",
  encode: "recommended",
  time: "normal",
  "prompt-builder": "normal",
  regex: "high",
  hash: "high",
  "sensitive-data": "high",
  cron: "recommended",
  yaml: "recommended",
  sql: "recommended",
  color: "normal",
};

const copy = {
  en: {
    search: "Find a tool or task",
    searchHint: "Search by name, task, or input type",
    filters: { all: "All", local: "Local processing", network: "Online diagnostics" },
    empty: "No tools match this search.",
    open: "Open tool",
    local: "Local processing · Not uploaded",
    network: "Internet required",
    localTag: "Local-first",
    networkTag: "Network-assisted",
    paths: {
      none: "Stays in this browser",
      "direct-target": "Browser connects directly to your target",
      "cloudflare-edge": "Observed at Cloudflare edge",
      "opskitpro-probe": "Sent to the OpsKitPro probe",
      mixed: "Browser, edge, and probe observations",
    },
    starterMessage: "Start with these priority tools for your first pass.",
    categories: {
      "security-first": [
        "Security & privacy tooling",
        "Generate, detect, hash, and mask sensitive data locally before sharing.",
      ],
      "developer-tooling": [
        "Developer helpers",
        "Common text, data, and logic tools for daily engineering work.",
      ],
      "content-utility": [
        "Content & workflow utility",
        "Practical local tools for prompts, time, colors, QR, and routine conversions.",
      ],
      "developer-debug": [
        "Developer networking tools",
        "Local workflow + network-aware helpers for API and real-time debugging.",
      ],
      "ops-network": [
        "Ops & network diagnostics",
        "Public-network checks with clear data destinations and observation points.",
      ],
    },
    priorities: {
      high: "High priority",
      recommended: "Recommended",
      normal: "Balanced",
    },
  },
  zh: {
    search: "查找工具或任务",
    searchHint: "按名称、用途或输入类型搜索",
    filters: { all: "全部", local: "本地处理", network: "联网诊断" },
    empty: "没有符合条件的工具。",
    open: "打开工具",
    local: "本地处理 · 不上传",
    network: "需要联网",
    localTag: "本地优先",
    networkTag: "需联网",
    paths: {
      none: "数据留在当前浏览器",
      "direct-target": "浏览器直接连接你的目标",
      "cloudflare-edge": "由 Cloudflare 边缘观察",
      "opskitpro-probe": "发送给 OpsKitPro 探针",
      mixed: "浏览器、边缘和探针共同观察",
    },
    starterMessage: "先从高优先工具开始：密码、Hash、JWT 和敏感信息。",
    categories: {
      "security-first": [
        "安全与脱敏工具",
        "生成、检测、哈希与脱敏，优先在浏览器本地完成。",
      ],
      "developer-tooling": [
        "开发者工具",
        "日常开发常用的文本、数据和逻辑类本地辅助。",
      ],
      "content-utility": [
        "内容与流程工具",
        "面向日常工作流的本地辅助，如时间、二维码、颜色、提示词。",
      ],
      "developer-debug": [
        "开发者调试工具",
        "兼具本地处理与网络场景的 API 与 WebSocket 排障辅助。",
      ],
      "ops-network": [
        "运维与网络诊断",
        "公开网络场景诊断，明确显示数据流向和观测来源。",
      ],
    },
    priorities: {
      high: "高优先",
      recommended: "推荐",
      normal: "常规",
    },
  },
} as const;

type Filter = "all" | ToolProcessingMode;
type CategoryFilter = "all" | DisplayCategory;

export function ToolCatalogClient({ lang }: { lang: ProductLocale }) {
  const text = copy[lang];
  const [filter, setFilter] = useState<Filter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(lang === "zh" ? "zh-CN" : "en-US");
    const matches = productTools.filter((tool) => {
      if (filter !== "all" && tool.processingMode !== filter) return false;
      if (
        categoryFilter !== "all" &&
        toolCategory[tool.id] !== categoryFilter
      ) return false;
      if (!normalized) return true;
      const displayCategory = toolCategory[tool.id];
      const haystack = [
        tool.title[lang],
        tool.description[lang],
        tool.inputType[lang],
        text.categories[displayCategory][0],
      ].join(" ").toLocaleLowerCase(lang === "zh" ? "zh-CN" : "en-US");
      return haystack.includes(normalized);
    });
    return categoryOrder.map((category) => ({
      category,
      tools: matches
        .filter((tool) => toolCategory[tool.id] === category)
        .sort((left, right) => {
          const leftPriority = toolPriority[left.id];
          const rightPriority = toolPriority[right.id];
          const priorityWeight: Record<ToolPriority, number> = {
            high: 0,
            recommended: 1,
            normal: 2,
          };
          const priorityDiff = priorityWeight[leftPriority] - priorityWeight[rightPriority];
          if (priorityDiff !== 0) return priorityDiff;
          const titleDiff = left.title[lang].localeCompare(right.title[lang], lang === "zh" ? "zh-CN" : "en-US");
          return titleDiff;
        }),
    })).filter((group) => group.tools.length > 0);
  }, [filter, categoryFilter, lang, query, text.categories]);

  const categoryBadges: Record<DisplayCategory, { en: string; zh: string }> = {
    "security-first": { en: "Security first", zh: "安全优先" },
    "developer-tooling": { en: "Dev tooling", zh: "研发工具" },
    "content-utility": { en: "Workflow tool", zh: "流程工具" },
    "ops-network": { en: "Ops diagnostics", zh: "运维诊断" },
    "developer-debug": { en: "Dev debug", zh: "调试网络" },
  };

  const starterHints = {
    en: {
      high: "Starter-first",
      recommended: "Recommended first",
      normal: "Optional",
    },
    zh: {
      high: "新手起点",
      recommended: "推荐优先",
      normal: "按需尝试",
    },
  } as const;

  const starterPath = [
    "passgen",
    "hash",
    "sensitive-data",
    "jwt",
  ].map((toolId) => {
    const tool = productTools.find((item) => item.id === toolId);
    if (!tool) return "";
    return localizeTool(tool, lang).title;
  }).filter(Boolean);

  return (
    <div className="mt-9">
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
            onChange={(event) => setQuery(event.target.value)}
            placeholder={text.searchHint}
            className="min-h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] py-2.5 pl-10 pr-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-faint)] focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label={lang === "zh" ? "按处理方式筛选" : "Filter by processing mode"}>
          {(["all", "local", "network"] as Filter[]).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${filter === value ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"}`}
            >
              {text.filters[value]}
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-950">
          <span className="font-semibold">{text.starterMessage}</span>{" "}
          {starterPath.join(" · ")}
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label={lang === "zh" ? "按分类筛选" : "Filter by category"}>
          <button
            type="button"
            aria-pressed={categoryFilter === "all"}
            onClick={() => setCategoryFilter("all")}
            className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${categoryFilter === "all" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"}`}
          >
            {lang === "zh" ? "全部分类" : "All categories"}
          </button>
          {categoryOrder.map((category) => (
            <button
              key={category}
              type="button"
              aria-pressed={categoryFilter === category}
              onClick={() => setCategoryFilter(category)}
              className={`min-h-10 rounded-full border px-4 text-xs font-semibold transition ${categoryFilter === category ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]"}`}
            >
              {text.categories[category][0]}
            </button>
          ))}
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-[var(--border-subtle)] p-10 text-center text-sm text-[var(--text-muted)]">{text.empty}</div>
      ) : (
        <div className="mt-10 space-y-12">
          {groups.map(({ category, tools }) => {
            const [title, description] = text.categories[category];
            const CategoryIcon =
              category === "security-first"
                ? ShieldCheck
                : category === "content-utility"
                  ? ImageIcon
                  : category === "ops-network"
                    ? Wifi
                    : category === "developer-debug"
                      ? Network
                      : Code2;
            return (
              <section key={category} aria-labelledby={`category-${category}`}>
                <div className="flex items-start gap-3">
                  <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500"><CategoryIcon className="h-5 w-5" /></span>
                  <div>
                    <h2 id={`category-${category}`} className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{description}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.map((rawTool) => {
                    const tool = localizeTool(rawTool, lang);
                    const Icon = icons[tool.id];
              const isLocal = tool.processingMode === "local";
              const modeTag = isLocal ? text.localTag : text.networkTag;
              const catTag = categoryBadges[category];
              const categoryTag = catTag ? catTag[lang] : "";
                return (
                  <Link key={tool.id} href={`/${lang}${tool.href}`} className="ui-surface group flex min-h-56 flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-emerald-500/30">
                        <div className="flex items-start justify-between gap-3">
                          <span className={`rounded-xl p-2.5 ${isLocal ? "bg-emerald-500/10 text-emerald-600" : "bg-sky-500/10 text-sky-600"}`}><Icon className="h-5 w-5" /></span>
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${isLocal ? "border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-600" : "border-sky-500/20 bg-sky-500/[0.07] text-sky-600"}`}>
                              {modeTag}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                              <Star className="h-3.5 w-3.5" />
                              {starterHints[lang][toolPriority[rawTool.id] ?? "normal"]}
                            </span>
                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
                              {text.priorities[toolPriority[rawTool.id] ?? "normal"]}
                            </span>
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-semibold text-zinc-600">
                              {categoryTag}
                            </span>
                          </div>
                        </div>
                        <h3 className="mt-5 text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)]">{tool.title}</h3>
                        <p className="mt-2 flex-1 text-sm leading-6 text-[var(--text-muted)]">{tool.description}</p>
                        <div className="mt-4 border-t border-[var(--border-subtle)] pt-3 text-xs leading-5 text-[var(--text-muted)]">
                          <p>{tool.inputType[lang]}</p>
                          <p className="mt-1 font-medium text-[var(--text-secondary)]">{text.paths[tool.networkPath]}</p>
                        </div>
                        <span className="mt-4 text-xs font-semibold text-[var(--accent-color)]">{text.open} →</span>
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
