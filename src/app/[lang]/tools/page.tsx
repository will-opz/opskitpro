import { Suspense } from "react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import ToolsNavigatorClient from "./ToolsNavigatorClient";
import { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";

  return buildPageMetadata(
    "Tools Navigator | OpsKitPro",
    "A unified interface for all edge diagnostic and developer tools.",
    lang,
    "/tools",
  );
}
export default async function ToolsPage({
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
