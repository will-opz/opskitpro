import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import CronGeneratorClient from "./CronGeneratorClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  return buildPageMetadata(
    lang === "zh" ? "Cron 表达式生成器" : "Cron Generator",
    lang === "zh" ? "本地构建并解释标准 Cron 表达式，快速生成任务调度规则。" : "Build and interpret standard cron expressions locally for scheduling checks.",
    lang,
    "/tools/cron",
  );
}

export default async function CronGeneratorPage({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <CronGeneratorClient lang={lang} />
      <ToolGuide id="cron" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
