import { Suspense } from "react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RelatedTools } from "@/components/RelatedTools";
import { ApiUsageSnippet } from "@/components/ApiUsageSnippet";
import { ToolGuide } from "@/components/ToolGuide";
import { AiReferralToolOpen } from "@/components/AnalyticsEvent";
import WebsiteCheckClient from "./WebsiteCheckClient";
import type { Metadata } from "next";

import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  const title =
    lang === "zh"
      ? "网站诊断 | DNS · HTTP · TLS · CDN 检测与 JSON API"
      : "Website Check | DNS, HTTP, TLS, CDN & JSON API";
  const description = dict.home.card1_desc;
  return buildPageMetadata(
    title,
    description,
    lang,
    "/tools/website-check",
  );
}

export default async function DiagnosticPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <AiReferralToolOpen tool="website-check" />
      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
              <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-8 py-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div>
                    <p className="text-xs font-semibold tracking-[0.24em] text-[var(--text-muted)]">
                      {dict.tools.diagnostic_title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-[var(--text-secondary)]">
                      {dict.tools.website_check.loading}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <WebsiteCheckClient dict={dict} lang={lang} />
        </Suspense>

        <div className="max-w-4xl mx-auto px-6 w-full">
          <ApiUsageSnippet
            lang={lang}
            endpoint="GET https://opskitpro.com/api/diagnostic"
            parameterHint={
              lang === "zh"
                ? "domain 参数支持域名、完整 URL 或 IP 地址；服务会在检查前归一化输入。"
                : "The domain parameter accepts a domain, full URL, or IP address and normalizes it before checking."
            }
            abbreviatedResponse
            exampleCurl={
              'curl "https://opskitpro.com/api/diagnostic?domain=example.com"'
            }
            exampleResponse={`{
  "domain": "example.com",
  "status": "success",
  "diagnosis": {
    "schemaVersion": "opskitpro.diagnostic.v1",
    "verdict": "Healthy",
    "evidence": [{
      "id": "http.server.status",
      "area": "http",
      "source": "opskitpro_probe",
      "observationPoint": "AWS Lightsail",
      "value": { "statusCode": 200 }
    }],
    "assessments": [{
      "id": "availability.http",
      "status": "healthy",
      "evidenceIds": ["http.server.status"]
    }]
  },
  "observations": {
    "edge": {
      "source": "cloudflare_edge",
      "status": "reachable",
      "colo": "NRT"
    },
    "server": {
      "source": "opskitpro_probe",
      "status": "reachable",
      "location": "AWS Lightsail"
    }
  },
  "dns": { "success": true, "ipv4": ["93.184.216.34"] },
  "http": { "success": true, "status_code": 200 },
  "ssl": { "valid": true, "issuer": "...", "expiry": "..." },
  "securityHeaders": {
    "passed": 4,
    "total": 5,
    "checks": [{ "key": "x-content-type-options", "present": true }]
  }
}`}
          />
        </div>

        <ToolGuide id="website-check" lang={lang} />
        <RelatedTools currentTool="website-check" lang={lang} />
      </div>
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
