import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import JwtClient from "./JwtClient";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "JWT 解码与校验" : "JWT Decoder & Verifier",
    lang === "zh" ? "在浏览器本地解析 JWT 并校验 HMAC 签名，不上传敏感内容。" : "Decode JWTs and verify HMAC signatures locally without uploading any payload.",
    lang,
    "/tools/jwt",
  );
}

export default async function JwtPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <JwtClient lang={lang} />
      <ToolGuide id="jwt" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
