import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import UuidToolClient from "./UuidToolClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "UUID 生成与校验" : "UUID Generator & Validator",
    lang === "zh" ? "在浏览器本地生成 UUID v1、v4、v5，并校验常见 UUID 版本格式。" : "Generate UUID v1, v4, and v5 locally and validate common UUID versions without uploading data.",
    lang,
    "/tools/uuid",
  );
}

export default async function UuidToolPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <UuidToolClient lang={lang} />
      <ToolGuide id="uuid" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
