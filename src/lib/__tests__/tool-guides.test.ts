import { describe, expect, it } from "vitest";

import { productTools } from "../tool-catalog";
import { localizeToolGuide, toolGuides } from "../tool-guides";

describe("tool guides", () => {
  it("covers every public first-party tool", () => {
    expect(Object.keys(toolGuides).sort()).toEqual(
      productTools.map((tool) => tool.id).sort(),
    );
  });

  it("has complete localized, source-controlled guidance", () => {
    for (const tool of productTools) {
      for (const lang of ["en", "zh"] as const) {
        const guide = localizeToolGuide(tool.id, lang);
        for (const value of [
          guide.purpose,
          guide.input,
          guide.output,
          guide.processing,
          guide.privacy,
          guide.limitation,
          guide.example,
        ]) {
          expect(value.trim().length).toBeGreaterThan(5);
        }
      }
      expect(toolGuides[tool.id].lastReviewed).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(toolGuides[tool.id].related).toHaveLength(2);
      expect(toolGuides[tool.id].related).not.toContain(tool.id);
    }
  });
});
