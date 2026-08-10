import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Binary,
  Braces,
  Clock3,
  Cloud,
  Code2,
  Globe,
  KeyRound,
  Network,
  QrCode,
  ShieldCheck,
  WandSparkles,
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
  passgen: KeyRound,
  qrgen: QrCode,
  encode: Binary,
  time: Clock3,
  "prompt-builder": WandSparkles,
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as ProductLocale;
  return buildPageMetadata(
    lang === "zh"
      ? "SRE 诊断工具"
      : "SRE Diagnostic Tools",
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
  const utilities = localized.filter((tool) => tool.category === "utility");
  const secondary = localized.filter(
    (tool) => tool.category !== "core" && tool.category !== "utility",
  );
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

        <section className="mt-12 rounded-3xl border border-emerald-500/15 bg-emerald-500/[0.04] p-5 sm:p-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="ui-chip mb-3">
                <KeyRound className="h-3.5 w-3.5" />
                {lang === "zh" ? "本地运行 · 无需登录" : "Local-first · No sign-in"}
              </div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] sm:text-2xl">
                {lang === "zh" ? "常用小工具" : "Everyday utilities"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                {lang === "zh"
                  ? "密码、二维码、编码和时间转换都在浏览器本地完成，打开即可使用。"
                  : "Generate passwords, QR codes, encoded text, and timestamps directly in your browser."}
              </p>
            </div>
            <Link
              href={`/${lang}/tools/passgen`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-500 hover:text-emerald-400"
            >
              {lang === "zh" ? "生成安全密码" : "Generate a secure password"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {utilities.map((tool, index) => {
              const Icon = icons[tool.id as keyof typeof icons] || Code2;
              return (
                <Link
                  key={tool.id}
                  href={`/${lang}${tool.href}`}
                  className={`group flex items-start gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5 ${
                    index === 0
                      ? "border-emerald-500/25 bg-[var(--bg-primary)] shadow-sm sm:col-span-2 lg:col-span-1"
                      : "border-[var(--border-subtle)] bg-[var(--bg-primary)]/75 hover:bg-[var(--surface-secondary)]"
                  }`}
                >
                  <div className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {tool.title}
                      </h3>
                      {index === 0 && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-500">
                          {lang === "zh" ? "推荐" : "Featured"}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
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
