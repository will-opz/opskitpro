import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import YamlClient from "./YamlClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "YAML 格式化与校验" : "YAML Formatter",
    lang === "zh" ? "在浏览器本地校验并格式化 YAML 内容，返回可读的解析错误和行列信息。" : "Validate and format YAML content locally with readable parse errors and position hints.",
    lang,
    "/tools/yaml",
  );
}

export default async function YamlPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <YamlClient lang={lang} />
      <ToolGuide id="yaml" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
