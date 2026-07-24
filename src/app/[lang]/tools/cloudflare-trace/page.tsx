import { Suspense } from "react";
import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { RelatedTools } from "@/components/RelatedTools";
import CloudflareTraceClient from "./CloudflareTraceClient";

import { buildPageMetadata, buildToolJsonLd } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  // Using a fallback directly since it might not be in the dictionary yet
  const title =
    lang === "zh"
      ? "Cloudflare Trace 解析"
      : false
        ? "Cloudflare Trace 解析"
        : false
          ? "Cloudflare Trace 解析"
          : "Cloudflare Trace Analyzer";
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

  const title =
    lang === "zh"
      ? "Cloudflare Trace 解析"
      : false
        ? "Cloudflare Trace 解析"
        : false
          ? "Cloudflare Trace 解析"
          : "Cloudflare Trace Analyzer";
  const description =
    lang === "zh"
      ? "查看当前浏览器访问 Cloudflare 边缘节点的详细追踪信息，包括 Colo, TLS, HTTP, WARP 等状态。"
      : "Analyze your connection to Cloudflare edge nodes, including Colo, TLS, HTTP, and WARP status.";

  const jsonLdBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://opskitpro.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Tools",
        item: "https://opskitpro.com/tools",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: "https://opskitpro.com/tools/cloudflare-trace",
      },
    ],
  };

  const jsonLdWebApp = buildToolJsonLd({
    name: title,
    description: description,
    url: "https://opskitpro.com/tools/cloudflare-trace",
  });

  const jsonLdFAQ = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What does a Cloudflare Trace check?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It queries the /cdn-cgi/trace endpoint to reveal how your connection hits the Cloudflare edge network, showing your IP, datacenter (Colo), TLS version, HTTP version, and WARP status.",
        },
      },
      {
        "@type": "Question",
        name: "Can I check the trace for another domain?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes! The tool allows you to check your own connection to Cloudflare, or trace how our servers connect to a specific target domain on the Cloudflare network.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }}
      />
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense>
          <CloudflareTraceClient dict={dict} lang={lang} />
        </Suspense>
        <RelatedTools currentTool="cloudflare-trace" lang={lang} />
      </div>
      <SiteFooter dict={dict} />
    </>
  );
}
