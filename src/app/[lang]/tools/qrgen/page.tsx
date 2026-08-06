import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";
import QRClient from "./qr-client";

import { buildPageMetadata, buildToolJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    dict.tools.qrgen_title,
    dict.tools.qrgen_desc,
    lang,
    "/tools/qrgen",
  );
}

export default async function QRPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const jsonLdWebApp = buildToolJsonLd({
    name: dict.tools.qrgen_title,
    description: dict.tools.qrgen_desc,
    url: "https://opskitpro.com/tools/qrgen",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <SiteHeader dict={dict} lang={lang} />
      <QRClient dict={dict} lang={lang} />
      <ToolGuide id="qrgen" lang={lang} />
      <SiteFooter dict={dict} />
    </>
  );
}
