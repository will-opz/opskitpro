import {
  localizeTool,
  productTools,
  type ProductLocale,
  type ProductToolId,
} from "./tool-catalog";
import { localizeToolGuide } from "./tool-guides";
import { SITE_URL } from "./seo";

const localeNames: Record<ProductLocale, string> = {
  en: "en-US",
  zh: "zh-CN",
};

const categoryNames = {
  core: "UtilitiesApplication",
  diagnostic: "UtilitiesApplication",
  developer: "DeveloperApplication",
  utility: "UtilitiesApplication",
} as const;

export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export function buildSiteJsonLd(lang: ProductLocale) {
  const organizationId = `${SITE_URL}/#organization`;
  const websiteId = `${SITE_URL}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: "OpsKitPro",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo.svg`,
        },
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: `${SITE_URL}/${lang}`,
        name: "OpsKitPro",
        inLanguage: localeNames[lang],
        publisher: { "@id": organizationId },
      },
    ],
  };
}

export function buildToolPageJsonLd(id: ProductToolId, lang: ProductLocale) {
  const tool = productTools.find((candidate) => candidate.id === id);
  if (!tool) throw new Error(`Unknown public tool: ${id}`);

  const localized = localizeTool(tool, lang);
  const guide = localizeToolGuide(id, lang);
  const canonicalUrl = `${SITE_URL}/${lang}${tool.href}`;
  const organizationId = `${SITE_URL}/#organization`;
  const pageId = `${canonicalUrl}#webpage`;
  const appId = `${canonicalUrl}#application`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": appId,
        name: localized.title,
        description: localized.description,
        url: canonicalUrl,
        mainEntityOfPage: { "@id": pageId },
        applicationCategory: categoryNames[tool.category],
        operatingSystem: "Any",
        isAccessibleForFree: true,
        inLanguage: localeNames[lang],
        featureList: [guide.purpose, guide.output],
        dateModified: guide.lastReviewed,
        usageInfo: `${SITE_URL}/${lang}/privacy`,
        publisher: { "@id": organizationId },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      {
        "@type": "WebPage",
        "@id": pageId,
        url: canonicalUrl,
        name: localized.title,
        description: localized.description,
        inLanguage: localeNames[lang],
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": appId },
        dateModified: guide.lastReviewed,
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: lang === "zh" ? "首页" : "Home",
            item: `${SITE_URL}/${lang}`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: lang === "zh" ? "工具" : "Tools",
            item: `${SITE_URL}/${lang}/tools`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: localized.title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };
}
