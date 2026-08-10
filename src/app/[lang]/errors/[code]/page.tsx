import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Info,
  Wrench,
  ShieldAlert,
  Activity,
  Globe,
  ArrowRight,
  AlertCircle,
  Cpu,
  BookOpen,
} from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { TrackedLink } from "@/components/TrackedLink";
import {
  getCloudflareErrors,
  getCloudflareError,
  localize,
} from "@/content/cloudflare-errors";
import { buildPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getCloudflareErrors().map((e) => ({
    code: e.code,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; code: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const error = getCloudflareError(resolvedParams.code);
  if (!error) return {};
  const lang = (resolvedParams.lang || "en") as "zh" | "en";

  const title = `Cloudflare Error ${error.code}: ${localize(error.title, lang)}`;
  const description = localize(error.summary, lang);

  return buildPageMetadata(title, description, lang, `/errors/${error.code}`, {
    openGraph: { type: "article" },
  });
}

export default async function ErrorDetailPage({
  params,
}: {
  params: Promise<{ lang: string; code: string }>;
}) {
  const resolvedParams = await params;
  const error = getCloudflareError(resolvedParams.code);
  if (!error) {
    notFound();
  }
  const lang = (resolvedParams.lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const isZh = lang === "zh";

  const localizedTitle = localize(error.title, lang);
  const localizedSummary = localize(error.summary, lang);
  const localizedCauses = localize(error.causes, lang);

  const causeLabel = isZh
      ? "常见原因"
      : "Common Causes";
  const responsibilityLabel = isZh
      ? "责任方"
      : "Responsibility";
  const guideLabel = isZh
      ? "排障指南"
      : "Troubleshooting Guide";
  const relatedErrorsLabel = isZh
      ? "关联错误"
      : "Related Errors";

  const severityConfig = {
    critical: {
      color: "text-red-600 bg-red-100 border-red-500/20",
      icon: <ShieldAlert className="h-4 w-4" />,
      label: "Critical",
      desc:
        isZh
          ? "影响：网站完全不可访问"
          : "Impact: Website completely inaccessible",
    },
    warning: {
      color: "text-amber-600 bg-amber-100 border-amber-500/20",
      icon: <AlertCircle className="h-4 w-4" />,
      label: "Warning",
      desc:
        isZh
          ? "影响：部分请求被拦截或受限"
          : "Impact: Requests partially blocked or limited",
    },
    info: {
      color: "text-blue-600 bg-blue-100 border-blue-500/20",
      icon: <Info className="h-4 w-4" />,
      label: "Info",
      desc:
        isZh
          ? "影响：提示性信息"
          : "Impact: Informational",
    },
  };

  const currentSeverity = severityConfig[error.severity || "info"];

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://opskitpro.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Errors",
        item: "https://opskitpro.com/errors",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `Error ${error.code}`,
        item: `https://opskitpro.com/errors/${error.code}`,
      },
    ],
  };

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `What causes Cloudflare Error ${error.code}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: localizedSummary + " " + localizedCauses.join(" "),
        },
      },
      ...error.troubleshooting.map((step) => ({
        "@type": "Question",
        name: `How to fix Cloudflare Error ${error.code} - ${localize(step.title, lang)}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: localize(step.content, lang),
        },
      })),
    ],
  };

  const jsonLdArticle = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `Cloudflare Error ${error.code}: ${localizedTitle}`,
    description: localizedSummary,
    proficiencyLevel: "Expert",
    author: {
      "@type": "Organization",
      name: "OpsKitPro",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />

      <SiteHeader dict={dict} lang={lang} />

      <main className="relative mx-auto w-full max-w-4xl flex-grow px-6 pb-24 pt-8 z-10 md:pt-12">
        {/* Decorative Background */}
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-full max-w-[800px] -translate-x-1/2 rounded-full bg-red-500/5 blur-[120px]" />

        {/* Breadcrumb Navigation */}
        <nav className="mb-8 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          <Link
            href={`/${lang}/errors`}
            className="hover:text-red-500 transition-colors"
          >
            Encyclopedia
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-zinc-800">Error {error.code}</span>
        </nav>

        {/* Header Section */}
        <header className="mb-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-bold text-zinc-600 shadow-sm">
              Cloudflare Error {error.code}
            </div>
            {error.severity && (
              <div
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold shadow-sm ${currentSeverity.color}`}
              >
                {currentSeverity.icon}
                {currentSeverity.label}
              </div>
            )}
          </div>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
            {localizedTitle}
          </h1>
          <p className="mt-5 text-base leading-8 text-zinc-600 sm:text-lg">
            {localizedSummary}
          </p>
          {error.severity && (
            <p className="mt-2 text-sm font-medium text-zinc-500 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
              {currentSeverity.desc}
            </p>
          )}
        </header>

        {/* Info Grid */}
        <div className="mb-12 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
              <Globe className="h-4 w-4 text-emerald-500" />
              {responsibilityLabel}
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                  error.responsibility === "Origin Server"
                    ? "bg-orange-100 text-orange-600"
                    : error.responsibility === "Configuration"
                      ? "bg-indigo-100 text-indigo-600"
                      : error.responsibility === "Client / Network"
                        ? "bg-rose-100 text-rose-600"
                        : "bg-sky-100 text-sky-600"
                }`}
              >
                {error.responsibility === "Origin Server" ? (
                  <Cpu className="h-5 w-5" />
                ) : error.responsibility === "Configuration" ? (
                  <Wrench className="h-5 w-5" />
                ) : (
                  <Globe className="h-5 w-5" />
                )}
              </div>
              <div className="text-lg font-bold text-zinc-800">
                {error.responsibility}
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-zinc-500">
              {error.responsibility === "Origin Server"
                ? isZh
                    ? "此错误由源站服务器引起，请优先排查源站负载与日志。"
                    : "This error originates from your origin server. Check origin load and logs."
                : error.responsibility === "Configuration"
                  ? isZh
                      ? "此错误通常由 DNS、SSL 或防火墙配置不当引起。"
                      : "This error is usually caused by incorrect DNS, SSL, or firewall configurations."
                  : isZh
                      ? "此错误由客户端请求或网络层引起。"
                      : "This error is triggered by the client or network layer."}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
              <Info className="h-4 w-4 text-sky-500" />
              {causeLabel}
            </div>
            <ul className="space-y-2">
              {localizedCauses.map((cause, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-sm text-zinc-700"
                >
                  <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500" />
                  <span className="leading-snug">{cause}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Troubleshooting Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
              <Wrench className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">
              {guideLabel}
            </h2>
          </div>

          <div className="space-y-6">
            {error.troubleshooting.map((step, index) => (
              <div
                key={index}
                className="group relative rounded-2xl border border-zinc-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="absolute -left-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-4 border-white bg-red-100 text-sm font-black text-red-600">
                  {index + 1}
                </div>
                <h3 className="mb-3 pl-2 text-lg font-bold text-zinc-900">
                  {localize(step.title, lang)}
                </h3>
                <p className="pl-2 text-sm leading-7 text-zinc-600">
                  {localize(step.content, lang)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Tools & Errors */}
        {(error.relatedTools.length > 0 || error.relatedErrors?.length > 0) && (
          <section className="rounded-3xl bg-zinc-50 p-6 sm:p-8 space-y-8">
            {/* Core Diagnostics CTAs */}
            <div>
              <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                <Activity className="h-4 w-4 text-emerald-500" />
                {isZh
                    ? "诊断工具"
                    : "Diagnostics"}
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <TrackedLink
                  href={`/${lang}/tools/website-check`}
                  eventName="error_page_to_website_check"
                  className="flex-1 group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-white p-5 text-center shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
                >
                  <Globe className="h-6 w-6 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-zinc-900">
                    {isZh
                        ? "诊断你的站点"
                        : "Diagnose Your Site"}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Website Check
                  </span>
                </TrackedLink>
                <Link
                  href={`/${lang}/tools/cloudflare-trace`}
                  className="flex-1 group relative flex flex-col items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white p-5 text-center shadow-sm transition-all hover:border-sky-500 hover:shadow-md"
                >
                  <Activity className="h-6 w-6 text-sky-600 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-zinc-900">
                    {isZh
                        ? "追踪边缘连接"
                        : "Check Cloudflare Trace"}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    Cloudflare Trace
                  </span>
                </Link>
              </div>
            </div>

            {error.relatedErrors?.length > 0 && (
              <div>
                <div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-zinc-400">
                  <BookOpen className="h-4 w-4 text-rose-500" />
                  {relatedErrorsLabel}
                </div>
                <div className="flex flex-wrap gap-3">
                  {error.relatedErrors.map((errCode) => (
                    <Link
                      key={errCode}
                      href={`/errors/${errCode}`}
                      className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-colors hover:border-rose-500 hover:text-rose-600"
                    >
                      Error {errCode}
                      <ArrowRight className="h-4 w-4 text-zinc-400" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </main>
      <SiteFooter dict={dict} />
    </>
  );
}
