import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import PassClient from "./pass-client";

import { buildPageMetadata, buildToolJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    `${dict.tools.passgen_title} - OpsKitPro`,
    dict.tools.passgen_desc,
    lang,
    "/tools/passgen",
  );
}

export default async function PassPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const jsonLdWebApp = buildToolJsonLd({
    name: dict.tools.passgen_title,
    description: dict.tools.passgen_desc,
    url: "https://opskitpro.com/tools/passgen",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <SiteHeader dict={dict} lang={lang} />
      <PassClient dict={dict} lang={lang} />
      <SiteFooter dict={dict} />
    </>
  );
}
