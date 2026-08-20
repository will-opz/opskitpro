import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import type { ProductLocale } from "@/lib/tool-catalog";
import { buildPageMetadata } from "@/lib/seo";
import { ToolCatalogClient } from "./ToolCatalogClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as ProductLocale;
  return buildPageMetadata(
    lang === "zh"
      ? "安全与本地工具"
      : "Secure Local-First Tools",
    lang === "zh"
      ? "密码、编码和数据尽可能在浏览器本地处理；联网诊断明确说明发送内容和观测点。"
      : "Passwords, encoded text, and data stay browser-local where practical; online diagnostics explain what is sent and where it is observed.",
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
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-10 sm:px-6">
        <section className="max-w-3xl">
          <div className="ui-chip mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            {lang === "zh" ? "隐私透明 · 无需登录" : "Privacy-transparent · No sign-in"}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {lang === "zh" ? "知道数据在哪里处理，再开始使用" : "Know where your data is processed"}
          </h1>
          <p className="mt-4 text-sm leading-7 text-[var(--text-muted)] sm:text-base">
            {lang === "zh"
              ? "敏感输入尽可能只在当前浏览器处理。需要联网的工具会说明发送什么、发给谁，以及结果来自哪个观测点。"
              : "Sensitive input stays in your browser where practical. Tools that need the internet explain what is sent, who receives it, and where results are observed."}
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
              <p className="text-sm font-semibold text-emerald-600">{lang === "zh" ? "本地处理 · 不上传" : "Local processing · Not uploaded"}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{lang === "zh" ? "密码、JSON、编码、二维码、时间与提示词在当前浏览器完成。" : "Passwords, JSON, encoding, QR codes, time, and prompts are processed in this browser."}</p>
            </div>
            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.05] p-4">
              <p className="text-sm font-semibold text-sky-600">{lang === "zh" ? "联网诊断 · 明确数据流" : "Online diagnostics · Explicit data flow"}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{lang === "zh" ? "域名、IP 或网络请求只发送到完成诊断所需的位置。" : "Domains, IPs, or requests go only to the destinations required for the diagnostic."}</p>
            </div>
          </div>
        </section>
        <ToolCatalogClient lang={lang} />
      </main>
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
