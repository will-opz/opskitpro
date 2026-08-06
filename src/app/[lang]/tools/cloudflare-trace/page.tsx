import { Suspense } from "react";
import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RelatedTools } from "@/components/RelatedTools";
import { ToolGuide } from "@/components/ToolGuide";
import CloudflareTraceClient from "./CloudflareTraceClient";

import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";

  const title =
    lang === "zh" ? "Cloudflare Trace 解析" : "Cloudflare Trace Analyzer";
  const description =
    lang === "zh"
      ? "查看当前浏览器访问 Cloudflare 边缘节点的详细追踪信息，包括 Colo, TLS, HTTP, WARP 等状态。"
      : "Analyze your connection to Cloudflare edge nodes, including Colo, TLS, HTTP, and WARP status.";

  return buildPageMetadata(
    title,
    description,
    lang,
    "/tools/cloudflare-trace",
    {
      keywords:
        "cloudflare trace, cloudflare colo, cloudflare warp, pop, /cdn-cgi/trace",
    },
  );
}

export default async function CloudflareTracePage({
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
        <Suspense>
          <CloudflareTraceClient dict={dict} lang={lang} />
        </Suspense>
        <ToolGuide id="cloudflare-trace" lang={lang} />
        <RelatedTools currentTool="cloudflare-trace" lang={lang} />
      </div>
      <SiteFooter dict={dict} />
    </>
  );
}
