import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";
import PromptBuilderClient from "./prompt-builder-client";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    dict.tools.prompt_builder_title,
    dict.tools.prompt_builder_desc,
    lang,
    "/tools/prompt-builder",
  );
}

export default async function PromptBuilderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <PromptBuilderClient dict={dict} lang={lang} />
      <ToolGuide id="prompt-builder" lang={lang} />
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
