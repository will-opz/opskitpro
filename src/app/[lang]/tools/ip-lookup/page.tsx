import { Suspense } from "react";
import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RelatedTools } from "@/components/RelatedTools";
import { ApiUsageSnippet } from "@/components/ApiUsageSnippet";
import { ToolGuide } from "@/components/ToolGuide";
import IPLookupClient from "./IPLookupClient";

import { buildPageMetadata, buildToolJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    `${dict.tools.ip_title} with JSON API | OpsKitPro`,
    dict.tools.ip_desc,
    lang,
    "/tools/ip-lookup",
  );
}

export default async function IPPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const jsonLdWebApp = buildToolJsonLd({
    name: dict.tools.ip_title,
    description: dict.tools.ip_desc,
    url: "https://opskitpro.com/tools/ip-lookup",
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
              <div className="rounded-[2rem] border border-zinc-100 bg-white/80 px-8 py-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.24em] text-zinc-400">
                      {dict.tools.ip_title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-700">
                      {dict.tools.ip.loading}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <IPLookupClient dict={dict} lang={lang} />
        </Suspense>

        <div className="max-w-4xl mx-auto px-6 w-full">
          <ApiUsageSnippet
            endpoint="GET https://opskitpro.com/api/tools/ip-lookup"
            exampleCurl={
              'curl "https://opskitpro.com/api/tools/ip-lookup?ip=8.8.8.8"'
            }
            exampleResponse={`{
  "ok": true,
  "tool": "ip-lookup",
  "input": {
    "ip": "8.8.8.8"
  },
  "result": {
    "ip": "8.8.8.8",
    "country": "United States",
    "countryCode": "US",
    "region": "Ohio",
    "city": "Glenmont",
    "latitude": 40.5369,
    "longitude": -82.1228,
    "isp": "Google LLC",
    "asn": "15169",
    "timezone": "America/New_York",
    "isDataCenter": true,
    "isProxy": false
  },
  "meta": {
    "durationMs": 47,
    "timestamp": "2026-06-23T00:00:00.000Z"
  }
}`}
          />
        </div>

        <ToolGuide id="ip-lookup" lang={lang} />
        <RelatedTools currentTool="ip-lookup" lang={lang} />
      </div>
      <SiteFooter dict={dict} />
    </>
  );
}
