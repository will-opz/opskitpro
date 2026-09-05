import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary } from "@/dictionaries";
import { AdminSessionProvider } from "@/components/AdminSessionProvider";
import {
  ACTIVE_LOCALES,
  LOCALE_MAP,
  isActiveLocale,
} from "@/lib/i18n";
import "../globals.css";
import { buildSiteJsonLd, serializeJsonLd } from "@/lib/structured-data";

import { themeInitScript } from "@/lib/theme-init";

async function resolveLocale(params: Promise<{ lang: string }>) {
  const { lang } = await params;
  if (!isActiveLocale(lang)) notFound();
  return lang;
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = await resolveLocale(params);
  const dict = await getDictionary(lang);

  const baseUrl = "https://opskitpro.com";
  const canonicalUrl = `${baseUrl}/${lang}`;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: dict.home.meta_title || "OpsKitPro | Edge Diagnostic Portal",
      template: "%s | OpsKitPro",
    },
    description:
      dict.home.meta_desc ||
      "Real-time global network forensics and edge diagnostic tools.",
    keywords: [
      "DNS Checker",
      "IP Lookup",
      "Website Diagnostic",
      "SRE Tools",
      "Geo-Location IP",
      "WebSocket Test",
      "JSON Formatter",
      "DNS 解析查询",
      "网站测速",
      "IP归属地查询",
    ],
    authors: [{ name: "OpsKitPro Team" }],
    creator: "OpsKitPro",
    publisher: "OpsKitPro Edge",
    openGraph: {
      title: dict.home.meta_title || "OpsKitPro | Edge Diagnostic Portal",
      description: dict.home.meta_desc,
      url: canonicalUrl,
      siteName: "OpsKitPro",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
        },
      ],
      locale:
        (LOCALE_MAP as Record<string, string>)[lang]?.replace("-", "_") ||
        "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.home.meta_title,
      description: dict.home.meta_desc,
      creator: "@opskitpro",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/logo.svg", type: "image/svg+xml" },
      ],
      shortcut: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

export function generateStaticParams() {
  return ACTIVE_LOCALES.map((lang) => ({ lang }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const lang = await resolveLocale(params);
  const siteJsonLd = buildSiteJsonLd(lang);

  return (
    <html
      lang={lang}
      className="overflow-x-hidden"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="ui-shell selection:bg-emerald-500/20 selection:text-[var(--text-primary)]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(siteJsonLd) }}
        />
        {/* Dual Core tech background glow */}
        <div className="glow" />
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.03] pointer-events-none" />

        <AdminSessionProvider lang={lang as "zh" | "en"}>{children}</AdminSessionProvider>
      </body>
    </html>
  );
}
