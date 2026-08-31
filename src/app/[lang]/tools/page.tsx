import type { Metadata } from "next";
import Link from "next/link";
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
        <section className="flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {lang === "zh" ? "常用工具" : "Tools"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)] sm:text-base">
            {lang === "zh"
              ? "选择工具后直接开始使用；涉及敏感数据的常用操作优先在浏览器本地完成。"
              : "Choose a tool and start immediately. Common tasks involving sensitive data run locally where practical."}
          </p>
          </div>
          <Link
            href={`/${lang}/tools/docs`}
            className="shrink-0 text-sm font-semibold text-[var(--accent-color)] hover:underline"
          >
            {lang === "zh" ? "数据处理说明" : "Data handling guide"} →
          </Link>
        </section>
        <ToolCatalogClient lang={lang} />
      </main>
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
