import { describe, expect, it } from "vitest";

import { productTools } from "../tool-catalog";
import {
  buildLlmsTxt,
  buildToolManifest,
  createStableEtag,
} from "../tool-discovery";

describe("tool discovery", () => {
  it("keeps manifest coverage and public fields complete", () => {
    const manifest = buildToolManifest();
    expect(manifest.tools.map((tool) => tool.id)).toEqual(
      productTools.map((tool) => tool.id),
    );

    for (const tool of manifest.tools) {
      expect(tool.requiresLogin).toBe(false);
      expect(tool.observationPoints.length).toBeGreaterThan(0);
      expect(tool.urls.en).toMatch(/^https:\/\/opskitpro\.com\/en\/tools\//);
      expect(tool.urls.zh).toMatch(/^https:\/\/opskitpro\.com\/zh\/tools\//);
      expect(tool.capabilities.en).toHaveLength(2);
      expect(tool.capabilities.zh).toHaveLength(2);
      expect(tool.lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("keeps llms.txt links aligned with the manifest", () => {
    const manifest = buildToolManifest();
    const text = buildLlmsTxt();
    for (const tool of manifest.tools) {
      expect(text).toContain(tool.urls.en);
      expect(text).toContain(tool.urls.zh);
    }
  });

  it("creates stable content-based ETags", () => {
    expect(createStableEtag("same")).toBe(createStableEtag("same"));
    expect(createStableEtag("same")).not.toBe(createStableEtag("changed"));
  });
});
