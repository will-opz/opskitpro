import { Suspense } from "react";
import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo";
import ToolsNavigatorClient from "./ToolsNavigatorClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  return buildPageMetadata(
    lang === "zh" ? "我的导航" : "My Navigation",
    lang === "zh"
      ? "个人常用入口和浏览器本地自定义导航。"
      : "Personal shortcuts and browser-local custom navigation.",
    lang,
    "/nav",
  );
}

export default async function NavigationPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <ToolsNavigatorClient lang={lang} />
      </Suspense>
      <SiteFooter dict={dict} />
    </>
  );
}
