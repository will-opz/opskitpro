import Link from "next/link";
import {
  Activity,
  ArrowRight,
  KeyRound,
  QrCode,
  Braces,
  Code2,
  Clock3,
  Network,
  ShieldCheck,
  ShieldAlert,
  Hash,
  Fingerprint,
} from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";
import HomeSearch from "@/components/HomeSearch";
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

const homeDashboardCopy = {
  en: {
    title: "Website diagnostics and developer tools, in one place",
    subtitle: "Check DNS, certificate and HTTP issues. Everyday tools run locally in your browser.",
    previewTitle: "Check a website",
    openAllTools: "Browse all tools",
    probePrivacy: "Your hostname is sent to OpsKitPro probes and public DNS resolvers. Results are not published as public reports.",
    privacyLink: "Data handling details",
    localToolsTitle: "Local security tools",
    localToolsDesc: "Sensitive input stays in this browser and is not uploaded to OpsKitPro.",
    networkToolsTitle: "Website & network diagnostics",
    networkToolsDesc: "Internet-assisted checks state what is sent and where the evidence is observed.",
    localBadge: "Local processing · Not uploaded",
    networkBadge: "Internet required · Data flow explained",
  },
  zh: {
    title: "网站诊断与开发者工具，一处完成",
    subtitle: "检测 DNS、证书和 HTTP 问题；常用工具在浏览器本地运行。",
    previewTitle: "检测你的网站",
    openAllTools: "浏览全部工具",
    probePrivacy: "域名将发送给 OpsKitPro 探针和公共 DNS 解析服务；结果不会公开发布。",
    privacyLink: "数据处理说明",
    localToolsTitle: "本地安全工具",
    localToolsDesc: "敏感输入只在当前浏览器处理，不会上传到 OpsKitPro。",
    networkToolsTitle: "网站与网络诊断",
    networkToolsDesc: "联网检测会明确说明发送内容、接收位置和证据观测点。",
    localBadge: "本地处理 · 不上传",
    networkBadge: "需要联网 · 数据流透明",
  },
} as const;

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);
  const dashboardCopy = homeDashboardCopy[lang];
  const homeToolIcons = {
    passgen: KeyRound,
    "website-check": Activity,
    qrgen: QrCode,
    json: Braces,
    encode: Code2,
    time: Clock3,
    hash: Hash,
    jwt: ShieldCheck,
    "sensitive-data": ShieldAlert,
    uuid: Fingerprint,
    "network-doctor": Network,
    "dns-security": ShieldCheck,
  } as const;
  const localTools = [
    "passgen",
    "hash",
    "jwt",
    "sensitive-data",
    "uuid",
    "qrgen",
    "json",
    "encode",
    "time",
  ].flatMap((id) => {
    const tool = productTools.find((entry) => entry.id === id);
    if (!tool) return [];
    return [{
      ...localizeTool(tool, lang),
        icon: homeToolIcons[id as keyof typeof homeToolIcons],
      }];
    });
  const networkTools = ["website-check", "network-doctor", "dns-security"].flatMap((id) => {
    const tool = productTools.find((entry) => entry.id === id);
    if (!tool) return [];
    return [{ ...localizeTool(tool, lang), icon: homeToolIcons[id as keyof typeof homeToolIcons] }];
  });

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative z-10 flex-grow px-4 pb-8 pt-6 sm:px-6 md:pb-24">
        <div className="pointer-events-none absolute left-1/2 top-0 z-[-1] h-[420px] w-full max-w-6xl -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="flex flex-col justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-left sm:p-7 lg:p-8">
            <p className="mb-4 text-sm font-medium text-[var(--text-secondary)]">{lang === "zh" ? "实用工具 · 无需登录" : "Practical tools · No signup"}</p>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-[2.75rem]">
              {dashboardCopy.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--text-secondary)]">{dashboardCopy.subtitle}</p>
            <div className="mt-6">
              <Link href={`/${lang}/tools`} className="ui-button-ghost min-h-11 border border-[var(--border-strong)] px-5 py-3 text-sm">
                {dashboardCopy.openAllTools}<ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
          <aside className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 text-left sm:p-6">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{dashboardCopy.previewTitle}</h2>
            <p className="mb-5 mt-2 text-sm text-[var(--text-secondary)]">DNS · SSL · CDN · HTTP</p>
            <HomeSearch lang={lang} />
            <p className="mt-2 text-[13px] leading-5 text-[var(--text-secondary)]">
              {dashboardCopy.probePrivacy}{" "}
              <Link href={`/${lang}/tools/docs#website-check`} className="font-semibold text-[var(--accent-text)] underline underline-offset-4">{dashboardCopy.privacyLink}</Link>
            </p>
          </aside>
        </section>

        <section className="mx-auto mb-8 mt-10 w-full max-w-7xl text-left">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                {dashboardCopy.localToolsTitle}
              </h2>
              <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">
                {dashboardCopy.localToolsDesc}
              </p>
            </div>
            <Link
              href={`/${lang}/tools`}
              className="group hidden shrink-0 items-center gap-1 text-xs font-semibold text-[var(--accent-text)] sm:inline-flex"
            >
              {dashboardCopy.openAllTools}
              <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {localTools.map((tool) => (
              <Link
                key={tool.id}
                href={`/${lang}${tool.href}`}
                className="group flex min-h-16 items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-3.5 py-3 transition hover:border-emerald-500/30 hover:bg-[var(--surface-secondary)]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                  <tool.icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-text)]">
                    {tool.title}
                  </span>
                  <span className="mt-0.5 block line-clamp-1 text-xs text-[var(--text-muted)]">
                    {tool.description}
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-[var(--accent-text)]">
                    {dashboardCopy.localBadge}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-text)]" />
              </Link>
            ))}
          </div>
          <Link
            href={`/${lang}/tools`}
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-text)] sm:hidden"
          >
            {dashboardCopy.openAllTools}
            <ArrowRight className="h-3 w-3" />
          </Link>
        </section>

        <HomePasswordGenerator lang={lang} />

        <section className="mx-auto mb-8 mt-10 w-full max-w-7xl text-left">
          <div className="mb-4">
            <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{dashboardCopy.networkToolsTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{dashboardCopy.networkToolsDesc}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {networkTools.map((tool) => (
              <Link key={tool.id} href={`/${lang}${tool.href}`} className="group flex min-h-40 flex-col rounded-2xl border border-sky-500/15 bg-sky-500/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-sky-500/30">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-[var(--info-text)]"><tool.icon className="h-5 w-5" /></span>
                  <span className="rounded-full border border-sky-500/20 px-2.5 py-1 text-xs font-semibold text-[var(--info-text)]">{dashboardCopy.networkBadge}</span>
                </div>
                <h3 className="mt-4 text-base font-semibold text-[var(--text-primary)] group-hover:text-[var(--info-text)]">{tool.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* 6. Footer (Handled by component) */}
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
