import { describe, expect, it } from "vitest";
import { buildPageMetadata } from "../seo";

describe("buildPageMetadata", () => {
  it("keeps page titles brand-free for the parent template and brands social cards once", () => {
    const metadata = buildPageMetadata(
      "SRE Diagnostic Tools",
      "Focused diagnostic workflows.",
      "en",
      "/tools",
    );

    expect(metadata.title).toBe("SRE Diagnostic Tools");
    expect(metadata.openGraph).toMatchObject({
      title: "SRE Diagnostic Tools | OpsKitPro",
      description: "Focused diagnostic workflows.",
    });
    expect(metadata.twitter).toMatchObject({
      card: "summary_large_image",
      title: "SRE Diagnostic Tools | OpsKitPro",
      description: "Focused diagnostic workflows.",
      creator: "@opskitpro",
    });
  });

  it("builds locale-specific canonical and reciprocal language alternates", () => {
    const metadata = buildPageMetadata("诊断工具", "说明", "zh", "/tools");

    expect(metadata.alternates).toEqual({
      canonical: "https://opskitpro.com/zh/tools",
      languages: {
        "x-default": "https://opskitpro.com/en/tools",
        "en-US": "https://opskitpro.com/en/tools",
        "zh-CN": "https://opskitpro.com/zh/tools",
      },
    });
  });

  it("does not append the brand twice when a same-segment title already includes it", () => {
    const metadata = buildPageMetadata(
      "Website Check and Online Tools - OpsKitPro",
      "Description",
      "en",
      "",
    );

    expect(metadata.openGraph).toMatchObject({
      title: "Website Check and Online Tools - OpsKitPro",
    });
    expect(metadata.twitter).toMatchObject({
      title: "Website Check and Online Tools - OpsKitPro",
    });
  });
});
