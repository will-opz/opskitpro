import { describe, expect, it } from "vitest";

import { productTools } from "../tool-catalog";
import {
  buildSiteJsonLd,
  buildToolPageJsonLd,
  serializeJsonLd,
} from "../structured-data";

describe("structured data", () => {
  it("builds a localized site graph", () => {
    const graph = buildSiteJsonLd("zh");
    expect(graph["@graph"].map((node) => node["@type"])).toEqual([
      "Organization",
      "WebSite",
    ]);
    expect(graph["@graph"][1]).toMatchObject({
      url: "https://opskitpro.com/zh",
      inLanguage: "zh-CN",
    });
  });

  it("builds one complete localized graph for every tool", () => {
    for (const tool of productTools) {
      for (const lang of ["en", "zh"] as const) {
        const graph = buildToolPageJsonLd(tool.id, lang);
        const [application, webpage, breadcrumb] = graph["@graph"];
        const canonical = `https://opskitpro.com/${lang}${tool.href}`;

        expect(application).toMatchObject({
          "@type": "WebApplication",
          url: canonical,
          isAccessibleForFree: true,
          inLanguage: lang === "zh" ? "zh-CN" : "en-US",
          usageInfo: `https://opskitpro.com/${lang}/privacy`,
          operatingSystem: "Any",
        });
        expect(application.featureList).toHaveLength(2);
        expect(webpage).toMatchObject({ "@type": "WebPage", url: canonical });
        expect(breadcrumb).toMatchObject({ "@type": "BreadcrumbList" });
        const items = (
          breadcrumb as { itemListElement: Array<{ item: string }> }
        ).itemListElement;
        expect(items).toHaveLength(3);
        expect(items[2].item).toBe(canonical);
      }
    }
  });

  it("escapes markup before embedding JSON-LD", () => {
    expect(serializeJsonLd({ value: "</script><script>" })).toBe(
      '{"value":"\\u003c/script>\\u003cscript>"}',
    );
  });
});
