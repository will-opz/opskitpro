import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";
import WebsocketClient from "./WebsocketClient";
import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    `${dict.tools.websocket_title} - OpsKitPro`,
    dict.tools.websocket_desc,
    lang,
    "/tools/websocket",
  );
}

export default async function WebsocketPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <WebsocketClient dict={dict} lang={lang} />
      <ToolGuide id="websocket" lang={lang} />
      <SiteFooter dict={dict} />
    </>
  );
}
