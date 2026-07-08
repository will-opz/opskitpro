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
import { getCloudflareErrors, localize } from "@/content/cloudflare-errors";

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
      return <ShieldAlert className="h-4 w-4 text-zinc-500" />;
  }
}

export default async function ErrorsPage({
  params,
}: {
  params: { lang: string };
}) {
  const lang = (params.lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const isZh = lang === "zh";

  const errors = getCloudflareErrors();

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative mx-auto mb-28 w-full max-w-7xl flex-grow px-6 pt-6 z-10 md:pt-8">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-full max-w-[1000px] -translate-x-1/2 rounded-full bg-red-500/5 blur-[120px]" />

        <div className="mb-12 border-b border-zinc-100 pb-10 text-center md:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-white/75 px-4 py-1.5 text-[10px] font-semibold tracking-[0.28em] text-red-600 shadow-sm backdrop-blur-md">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            {isZh
                ? "排障指南"
                : "Troubleshooting"}
          </div>
          <h1 className="mb-5 text-4xl font-black leading-tight tracking-tighter text-zinc-900 sm:text-5xl md:text-7xl">
            Cloudflare Error Encyclopedia
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-zinc-700 sm:text-base md:mx-0">
            {isZh
                ? "整理常见的 Cloudflare 错误代码 (如 522, 1020 等)，提供 SRE 视角下的故障排查指南。"
                : "A comprehensive troubleshooting guide for common Cloudflare errors (e.g., 522, 1020) from an SRE perspective."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {errors.map((error) => (
            <Link
              key={error.code}
              href={`/errors/${error.code}`}
              className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-red-500/20 hover:shadow-2xl"
            >
              <div className="flex h-full flex-col p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  <span className="inline-flex items-center gap-1 font-semibold text-zinc-500">
                    {getIconForResponsibility(error.responsibility)}
                    {error.responsibility}
                  </span>
                  <span className="font-bold text-red-500">
                    Error {error.code}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black tracking-tight text-zinc-900 transition-colors group-hover:text-red-600">
                  {localize(error.title, lang)}
                </h3>
                <p className="mt-3 line-clamp-3 flex-grow text-sm leading-7 text-zinc-500">
                  {localize(error.summary, lang)}
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-zinc-50 pt-5">
                  <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold group-hover:text-red-500 transition-colors">
                    {isZh
                        ? "查看排障指南"
                        : "View Guide"}
                  </span>
                  <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-red-600" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  );
}
