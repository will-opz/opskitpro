import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Braces,
  Cloud,
  Code2,
  Globe,
  Network,
  ShieldCheck,
} from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CoreToolImpressions } from "@/components/AnalyticsEvent";
import { CoreToolLink } from "@/components/CoreToolLink";
import {
  coreTools,
  localizeTool,
  observationPointCopy,
  productTools,
  type ProductLocale,
} from "@/lib/tool-catalog";
import { buildPageMetadata } from "@/lib/seo";

const icons = {
  "website-check": Activity,
  "network-doctor": Network,
  "dns-security": ShieldCheck,
  "ip-lookup": Globe,
  "cloudflare-trace": Cloud,
  api: Code2,
  json: Braces,
  websocket: Network,
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as ProductLocale;
  return buildPageMetadata(
    lang === "zh"
      ? "SRE 诊断工具 | OpsKitPro"
      : "SRE Diagnostic Tools | OpsKitPro",
    lang === "zh"
      ? "从网站、网络和 DNS 三个核心工作流开始，再按需使用专项诊断与开发工具。"
      : "Start with website, network and DNS workflows, then use focused diagnostic and developer utilities.",
    lang,
    "/tools",
  );
}

export default async function ToolsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as ProductLocale;
  const dict = await getDictionary(lang);
  const localized = productTools.map((tool) => localizeTool(tool, lang));
  const core = localized.filter((tool) => tool.category === "core");
  const secondary = localized.filter((tool) => tool.category !== "core");
  const pointLabel = (point: "browser" | "edge" | "probe") =>
    observationPointCopy[point][lang].label;

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6">
        <CoreToolImpressions
          tools={coreTools.map((tool) => tool.id)}
          placement="catalog"
        />
        <section className="max-w-3xl">
          <div className="ui-chip mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            {lang === "zh" ? "公开产品" : "Public products"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {lang === "zh" ? "先从三个核心诊断开始" : "Start with three core diagnostics"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--text-muted)] sm:text-base">
            {lang === "zh"
              ? "每项结果都会标明观察点，避免把浏览器、Cloudflare 边缘和服务端探针的数据混在一起。"
              : "Every result names its observation point so browser, Cloudflare edge and server-probe evidence stay distinct."}
          </p>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {core.map((tool, index) => {
            const Icon = icons[tool.id as keyof typeof icons] || Activity;
            return (
              <CoreToolLink
                key={tool.id}
                href={`/${lang}${tool.href}`}
                tool={
                  tool.id as
                    | "website-check"
                    | "network-doctor"
                    | "dns-security"
                }
                placement="catalog"
                className="ui-surface-elevated group flex min-h-72 flex-col rounded-2xl p-6 hover:-translate-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--text-faint)]">
                    0{index + 1}
                  </span>
                  <Icon className="h-6 w-6 text-emerald-500" />
                </div>
                <h2 className="mt-8 text-xl font-semibold text-[var(--text-primary)]">
                  {tool.title}
                </h2>
                <p className="mt-3 flex-1 text-sm leading-6 text-[var(--text-muted)]">
                  {tool.description}
                </p>
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {tool.observationPoints.map((point) => (
                    <span
                      key={point}
                      className="rounded-full border border-[var(--border-subtle)] px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)]"
                    >
                      {pointLabel(point)}
                    </span>
                  ))}
                </div>
                <span className="mt-6 inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                  {lang === "zh" ? "打开工具" : "Open tool"}
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </span>
              </CoreToolLink>
            );
          })}
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-[var(--text-primary)]">
            {lang === "zh" ? "专项工具" : "Focused tools"}
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {lang === "zh"
              ? "在核心诊断之后，按具体任务选择这些入口。"
              : "Use these when a core workflow points to a more specific task."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {secondary.map((tool) => {
              const Icon = icons[tool.id as keyof typeof icons] || Code2;
              return (
                <Link
                  key={tool.id}
                  href={`/${lang}${tool.href}`}
                  className="ui-surface group flex items-start gap-4 rounded-xl p-4 hover:bg-[var(--surface-secondary)]"
                >
                  <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {tool.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter dict={dict} />
    </>
  );
}
