import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import SensitiveDataClient from "./SensitiveDataClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "敏感信息检测与脱敏" : "Sensitive Data Detector",
    lang === "zh"
      ? "在本地检测邮件、电话、Token、UUID、私钥头和信用卡号，并生成可追踪的脱敏文本。"
      : "Detect emails, phone numbers, tokens, UUIDs, private keys, and card-like numbers locally, then generate traceable redaction output.",
    lang,
    "/tools/sensitive-data",
  );
}

export default async function SensitiveDataPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <SensitiveDataClient lang={lang} />
      <ToolGuide id="sensitive-data" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
