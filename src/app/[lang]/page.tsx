import Link from "next/link";
import {
  Activity,
  ArrowRight,
  KeyRound,
  QrCode,
  Braces,
  Code2,
  Clock3,
} from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import HomeSearch from "@/components/HomeSearch";
import { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import { HomePasswordGenerator } from "@/components/HomePasswordGenerator";
import { localizeTool, productTools } from "@/lib/tool-catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    dict.home.meta_title || "OpsKitPro | Edge Diagnostic Portal",
    dict.home.meta_desc ||
      "Real-time global network forensics and edge diagnostic tools.",
    lang,
    "",
  );
}

type HomeDiagnosticPreview = {
  domain: string;
  status: "healthy" | "degraded" | "unavailable";
  rows: Array<{
    label: string;
    value: string;
    tone: string;
  }>;
};

async function getHomeDiagnosticPreview(): Promise<HomeDiagnosticPreview> {
  return {
    domain: "opskitpro.com",
    status: "unavailable",
    rows: [
      { label: "DNS resolved", value: "Awaiting check", tone: "bg-zinc-400" },
      {
        label: "SSL certificate",
        value: "Awaiting check",
        tone: "bg-zinc-400",
      },
      { label: "CDN provider", value: "Awaiting check", tone: "bg-zinc-400" },
      { label: "HTTP latency", value: "Awaiting check", tone: "bg-zinc-400" },
    ],
  };
}

const homeDashboardCopy = {
  en: {
    livePreview: "Live Diagnostic Preview",
    healthy: "healthy",
    degraded: "degraded",
    unavailable: "unavailable",
    rows: {
      dns: "DNS resolved",
      ssl: "SSL certificate",
      cdn: "CDN provider",
      http: "HTTP latency",
    },
    pending: "Awaiting check",
    sslValid: "Valid",
    sslFault: "Validation fault",
    runFullCheck: "Run full check",
    openDnsLookup: "Open DNS Security",
    openAllTools: "Open all tools",
    popularToolsTitle: "Popular tools",
    popularToolsDesc:
      "Six focused tools for common tasks. No account required.",
  },
  zh: {
    livePreview: "实时诊断预览",
    healthy: "健康",
    degraded: "需关注",
    unavailable: "暂不可用",
    rows: {
      dns: "DNS 解析",
      ssl: "SSL 证书",
      cdn: "CDN 提供商",
      http: "HTTP 延迟",
    },
    pending: "等待检测",
    sslValid: "有效",
    sslFault: "验证异常",
    runFullCheck: "运行完整检测",
    openDnsLookup: "打开 DNS 安全检查",
    openAllTools: "打开全部工具",
    popularToolsTitle: "热门工具",
    popularToolsDesc: "六个高频入口，一个工具解决一个问题，无需注册。",
  },
} as const;

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);
  const heroBadge = dict.home.title_part1;
  const heroSubtitle = dict.home.subtitle;
  const diagnosticPreview = await getHomeDiagnosticPreview();
  const dashboardCopy = homeDashboardCopy[lang];
  const previewRows = [
    diagnosticPreview.rows[0] && {
      ...diagnosticPreview.rows[0],
      label: dashboardCopy.rows.dns,
      value:
        diagnosticPreview.rows[0].value === "Awaiting check"
          ? dashboardCopy.pending
          : diagnosticPreview.rows[0].value,
    },
    diagnosticPreview.rows[1] && {
      ...diagnosticPreview.rows[1],
      label: dashboardCopy.rows.ssl,
      value:
        diagnosticPreview.rows[1].value === "Awaiting check"
          ? dashboardCopy.pending
          : diagnosticPreview.rows[1].value.startsWith("Valid")
            ? diagnosticPreview.rows[1].value.replace(
                "Valid",
                dashboardCopy.sslValid,
              )
            : diagnosticPreview.rows[1].value === "Validation fault"
              ? dashboardCopy.sslFault
              : diagnosticPreview.rows[1].value,
    },
    diagnosticPreview.rows[2] && {
      ...diagnosticPreview.rows[2],
      label: dashboardCopy.rows.cdn,
      value:
        diagnosticPreview.rows[2].value === "Awaiting check"
          ? dashboardCopy.pending
          : diagnosticPreview.rows[2].value,
    },
    diagnosticPreview.rows[3] && {
      ...diagnosticPreview.rows[3],
      label: dashboardCopy.rows.http,
      value:
        diagnosticPreview.rows[3].value === "Awaiting check"
          ? dashboardCopy.pending
          : diagnosticPreview.rows[3].value,
    },
  ].filter(Boolean) as HomeDiagnosticPreview["rows"];
  const popularToolIcons = {
    passgen: KeyRound,
    "website-check": Activity,
    qrgen: QrCode,
    json: Braces,
    encode: Code2,
    time: Clock3,
  } as const;
  const popularTools = [
    "passgen",
    "website-check",
    "qrgen",
    "json",
    "encode",
    "time",
  ].flatMap((id) => {
      const tool = productTools.find((entry) => entry.id === id);
      if (!tool) return [];
      return [{
        ...localizeTool(tool, lang),
        icon: popularToolIcons[id as keyof typeof popularToolIcons],
      }];
    });

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative z-10 flex-grow px-4 pb-20 pt-8 sm:px-6 md:pb-24">
        <div className="pointer-events-none absolute left-1/2 top-0 z-[-1] h-[420px] w-full max-w-6xl -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="ui-surface-elevated rounded-2xl p-5 text-left sm:p-7 lg:p-8">
            <div
              className={`ui-chip mb-5 ${"font-mono tracking-widest"}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {heroBadge}
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              {(
                <>
                  {dict.home.title_part2_pre}
                  <span className="mx-2 bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent ai-glow">
                    {dict.home.title_part2_ai}
                  </span>
                  {dict.home.title_part2_suf}
                </>
              )}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-[var(--text-secondary)] md:text-base">
              {heroSubtitle}
            </p>
            <div className="mt-6 max-w-3xl">
              <HomeSearch dict={dict} lang={lang} compact />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                dict.home.features.dns,
                dict.home.features.ssl,
                dict.home.features.cdn,
                "HTTP",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="ui-surface rounded-2xl p-4 text-left">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                  {dashboardCopy.livePreview}
                </div>
                <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">
                  {diagnosticPreview.domain}
                </h2>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                  diagnosticPreview.status === "healthy"
                    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                    : diagnosticPreview.status === "degraded"
                      ? "border-orange-500/20 bg-orange-500/10 text-orange-500"
                      : "border-zinc-500/20 bg-zinc-500/10 text-[var(--text-muted)]"
                }`}
              >
                {dashboardCopy[diagnosticPreview.status]}
              </span>
            </div>
            <div className="space-y-2">
              {previewRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${row.tone}`}
                    />
                    <span className="truncate text-xs font-medium text-[var(--text-secondary)]">
                      {row.label}
                    </span>
                  </div>
                  <span className="truncate text-right text-xs font-semibold text-[var(--text-primary)]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link
                href={`/${lang}/tools/website-check`}
                className="ui-button-primary px-3 py-2 text-xs"
              >
                {dashboardCopy.runFullCheck}
              </Link>
              <Link
                href={`/${lang}/tools/dns-lookup`}
                className="ui-button-ghost border border-[var(--border-subtle)] px-3 py-2 text-xs"
              >
                {dashboardCopy.openDnsLookup}
              </Link>
            </div>
          </aside>
        </section>

        <HomePasswordGenerator lang={lang} />

        <section className="mx-auto mb-8 mt-10 w-full max-w-7xl text-left">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {dashboardCopy.popularToolsTitle}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                {dashboardCopy.popularToolsDesc}
              </p>
            </div>
            <Link
              href={`/${lang}/tools`}
              className="group hidden shrink-0 items-center gap-1 text-xs font-semibold text-[var(--accent-color)] sm:inline-flex"
            >
              {dashboardCopy.openAllTools}
              <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {popularTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/${lang}${tool.href}`}
                className="group flex min-h-16 items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3.5 py-3 transition hover:border-emerald-500/30 hover:bg-[var(--surface-secondary)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <tool.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)]">
                    {tool.title}
                  </span>
                  <span className="mt-0.5 block line-clamp-1 text-xs text-[var(--text-muted)]">
                    {tool.description}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-color)]" />
              </Link>
            ))}
          </div>
          <Link
            href={`/${lang}/tools`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-color)] sm:hidden"
          >
            {dashboardCopy.openAllTools}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>
      </main>

      {/* 6. Footer (Handled by component) */}
      <SiteFooter dict={dict} />
    </>
  );
}
