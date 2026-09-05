import Link from "next/link";
import {
  ArrowRight,
  ShieldAlert,
  ServerCrash,
  Globe,
  Settings,
} from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getCloudflareErrors, localize, responsibilityText } from "@/content/cloudflare-errors";

function getIconForResponsibility(responsibility: string) {
  switch (responsibility) {
    case "Cloudflare Edge":
      return <Globe className="h-4 w-4 text-emerald-500" />;
    case "Origin Server":
      return <ServerCrash className="h-4 w-4 text-red-500" />;
    case "Configuration":
      return <Settings className="h-4 w-4 text-sky-500" />;
    case "Client / Network":
      return <ShieldAlert className="h-4 w-4 text-orange-500" />;
    default:
      return <ShieldAlert className="h-4 w-4 text-[var(--text-muted)]" />;
  }
}

export default async function ErrorsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const isZh = lang === "zh";

  const errors = getCloudflareErrors();

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative mx-auto mb-10 w-full max-w-7xl flex-grow px-6 pt-6 z-10 md:pt-8">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-full max-w-[1000px] -translate-x-1/2 rounded-full bg-red-500/5 blur-[120px]" />

        <div className="mb-5 border-b border-[var(--border-subtle)] pb-5 text-left md:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-[var(--surface-primary)] px-4 py-1.5 text-xs font-semibold tracking-[0.28em] text-[var(--danger-text)] shadow-sm backdrop-blur-md">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            {isZh
                ? "排障指南"
                : "Troubleshooting"}
          </div>
          <h1 className="mb-5 text-2xl font-semibold leading-tight tracking-tighter text-[var(--text-primary)] sm:text-3xl">
            {isZh ? "Cloudflare 错误速查" : "Cloudflare Error Encyclopedia"}
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-[var(--text-secondary)] sm:text-base md:mx-0">
            {isZh
                ? "整理常见的 Cloudflare 错误代码 (如 522, 1020 等)，提供 SRE 视角下的故障排查指南。"
                : "A comprehensive troubleshooting guide for common Cloudflare errors (e.g., 522, 1020) from an SRE perspective."}
          </p>
        </div>

        <nav aria-label={isZh ? "按错误代码查找" : "Find an error code"} className="mb-5 flex flex-wrap gap-2">{errors.map(error => <Link className="ui-button-secondary" key={error.code} href={`/${lang}/errors/${error.code}`}>{error.code}</Link>)}</nav>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {errors.map((error) => (
            <Link
              key={error.code}
              href={`/${lang}/errors/${error.code}`}
              className="group overflow-hidden rounded-[2rem] border border-black/5 bg-[var(--surface-primary)] shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500/20 hover:shadow-sm"
            >
              <div className="flex h-full flex-col p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  <span className="inline-flex items-center gap-1 font-semibold text-[var(--text-muted)]">
                    {getIconForResponsibility(error.responsibility)}
                    {responsibilityText(error.responsibility, lang)}
                  </span>
                  <span className="font-bold text-red-500">
                    Error {error.code}
                  </span>
                </div>

                <h3 className="mt-3 text-lg font-semibold tracking-tight text-[var(--text-primary)] transition-colors group-hover:text-[var(--danger-text)]">
                  {localize(error.title, lang)}
                </h3>
                <p className="mt-3 line-clamp-3 flex-grow text-sm leading-7 text-[var(--text-muted)]">
                  {localize(error.summary, lang)}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-[var(--border-subtle)] pt-3">
                  <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)] font-semibold group-hover:text-red-500 transition-colors">
                    {isZh
                        ? "查看排障指南"
                        : "View Guide"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-[var(--text-muted)] transition-transform group-hover:translate-x-1 group-hover:text-[var(--danger-text)]" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
