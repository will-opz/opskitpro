import { Suspense } from "react";
import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RelatedTools } from "@/components/RelatedTools";
import { ApiUsageSnippet } from "@/components/ApiUsageSnippet";
import { ToolGuide } from "@/components/ToolGuide";
import IPLookupClient from "./IPLookupClient";

import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    `${dict.tools.ip_title} with JSON API`,
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

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
              <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-8 py-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24em] text-[var(--text-muted)]">
                      {dict.tools.ip_title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
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
            lang={lang}
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
    "region": "Unknown",
    "city": "Unknown",
    "latitude": null,
    "longitude": null,
    "isp": "Google LLC",
    "asn": "AS15169",
    "asDomain": "google.com",
    "continent": "North America",
    "continentCode": "NA",
    "timezone": "Unknown",
    "isDataCenter": null,
    "isProxy": null,
    "provider": "IPinfo Lite",
    "source": "ipinfo-lite"
  },
  "meta": {
    "durationMs": 3,
    "timestamp": "2026-08-10T00:00:00.000Z"
  }
}`}
          />
        </div>

        <ToolGuide id="ip-lookup" lang={lang} />
        <RelatedTools currentTool="ip-lookup" lang={lang} />
      </div>
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
