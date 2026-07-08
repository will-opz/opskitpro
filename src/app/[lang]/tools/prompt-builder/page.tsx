import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import PromptBuilderClient from "./prompt-builder-client";

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}): Promise<Metadata> {
  const lang = (params.lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return {
    title: `${dict.tools.prompt_builder_title} - OpsKitPro`,
    description: dict.tools.prompt_builder_desc,
    openGraph: {
      title: `${dict.tools.prompt_builder_title} - OpsKitPro`,
      description: dict.tools.prompt_builder_desc,
    },
  };
}

export default async function PromptBuilderPage({
  params,
}: {
  params: { lang: string };
}) {
  const lang = (params.lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <PromptBuilderClient dict={dict} lang={lang} />
      <SiteFooter dict={dict} />
    </>
  );
}
