import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import RegexTesterClient from "./RegexTesterClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "正则表达式测试器" : "Regex Tester",
    lang === "zh" ? "在浏览器本地测试 JavaScript 正则表达式、匹配高亮和捕获组，输入内容不会上传。" : "Test JavaScript regular expressions, highlights, and capture groups locally without uploading your input.",
    lang,
    "/tools/regex",
  );
}

export default async function RegexPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <RegexTesterClient lang={lang} />
      <ToolGuide id="regex" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
