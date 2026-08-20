import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import DiffClient from "./DiffClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "文本对比" : "Text Diff",
    lang === "zh" ? "在浏览器本地逐行比较两段文本，查看新增、删除、行号和变化块，输入不会上传。" : "Compare two texts line by line locally, with additions, deletions, line numbers, and change blocks—without uploads.",
    lang,
    "/tools/diff",
  );
}

export default async function DiffPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <DiffClient lang={lang} />
      <ToolGuide id="diff" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
