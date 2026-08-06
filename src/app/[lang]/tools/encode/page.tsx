import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";
import EncodeClient from "./encode-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return {
    title: `${dict.tools.encode_title} - OpsKitPro`,
    description: dict.tools.encode_desc,
    openGraph: {
      title: `${dict.tools.encode_title} - OpsKitPro`,
      description: dict.tools.encode_desc,
    },
  };
}

export default async function EncodePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <EncodeClient dict={dict} lang={lang} />
      <ToolGuide id="encode" lang={lang} />
      <SiteFooter dict={dict} />
    </>
  );
}
