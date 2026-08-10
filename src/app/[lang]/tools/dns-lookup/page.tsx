import { Suspense } from "react";
import { getDictionary } from "@/dictionaries";
import DnsClient from "./DnsClient";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RelatedTools } from "@/components/RelatedTools";
import { ApiUsageSnippet } from "@/components/ApiUsageSnippet";
import { ToolGuide } from "@/components/ToolGuide";
import { AiReferralToolOpen } from "@/components/AnalyticsEvent";
import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const title = `${dict.home.card3_title} with JSON API`;
  const description = dict.home.card3_desc;

  return buildPageMetadata(title, description, lang, "/tools/dns-lookup");
}

export default async function DnsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <AiReferralToolOpen tool="dns-security" />
      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
              <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
              <p className="text-zinc-400 tracking-[0.24em] text-[10px]">
                {false
                  ? "DNS を読み込み中..."
                  : lang === "zh"
                    ? "正在加载 DNS..."
                    : false
                      ? "正在載入 DNS..."
                      : "Loading DNS..."}
              </p>
            </div>
          }
        >
          <DnsClient dict={dict} lang={lang} />
        </Suspense>

        <div className="max-w-4xl mx-auto px-6 w-full">
          <ApiUsageSnippet
            lang={lang}
            endpoint="GET https://opskitpro.com/api/tools/dns-lookup"
            exampleCurl={
              'curl "https://opskitpro.com/api/tools/dns-lookup?domain=example.com&type=all"'
            }
            exampleResponse={`{
  "ok": true,
  "tool": "dns-lookup",
  "input": {
    "domain": "example.com",
    "type": "all"
  },
  "result": {
    "a": ["93.184.215.14"],
    "aaaa": ["2606:2800:21f:cb07:6820:80da:af6b:8b2c"],
    "cname": [],
    "mx": [],
    "txt": ["v=spf1 -all"],
    "ns": ["a.iana-servers.net.", "b.iana-servers.net."]
  },
  "meta": {
    "durationMs": 42,
    "timestamp": "2026-06-23T00:00:00.000Z"
  }
}`}
          />
        </div>

        <ToolGuide id="dns-security" lang={lang} />
        <RelatedTools currentTool="dns-lookup" lang={lang} />
      </div>
      <SiteFooter dict={dict} />
    </>
  );
}
