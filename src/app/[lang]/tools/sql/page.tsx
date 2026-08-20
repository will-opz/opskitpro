import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import SqlFormatterClient from "./SqlFormatterClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "SQL 格式化器" : "SQL Formatter",
    lang === "zh"
      ? "在浏览器本地格式化 SQL，改善可读性并减少审阅噪音。"
      : "Format SQL locally to improve readability and reduce review noise.",
    lang,
    "/tools/sql",
  );
}

export default async function SqlFormatterPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <SqlFormatterClient lang={lang} />
      <ToolGuide id="sql" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
