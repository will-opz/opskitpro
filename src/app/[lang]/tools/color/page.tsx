import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import ColorConverterClient from "./ColorConverterClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "颜色转换器" : "Color Converter",
    lang === "zh"
      ? "在浏览器本地转换 Hex、RGB、RGBA、HSL 等常见颜色格式。"
      : "Convert common color formats locally, including hex, rgb, rgba and hsl.",
    lang,
    "/tools/color",
  );
}

export default async function ColorConverterPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <ColorConverterClient lang={lang} />
      <ToolGuide id="color" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
