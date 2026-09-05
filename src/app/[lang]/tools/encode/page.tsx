import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";
import EncodeClient from "./encode-client";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    dict.tools.encode_title,
    dict.tools.encode_desc,
    lang,
    "/tools/encode",
  );
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
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
