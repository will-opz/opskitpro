import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applyThemePreference, themeInitScript } from "./theme-init";

beforeEach(() => {
  document.head.innerHTML = '<meta name="color-scheme" content="light dark">';
  document.documentElement.removeAttribute("style");
});
afterEach(() => { vi.unstubAllGlobals(); document.documentElement.className = ""; delete document.documentElement.dataset.theme; delete document.documentElement.dataset.themePreference; });

describe("shared pre-paint theme resolver", () => {
  it.each([true, false])("respects stored overrides and system (%s)", dark => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: dark })));
    for (const stored of [null, "system", "invalid", "light", "dark"]) {
      vi.stubGlobal("localStorage", { getItem: () => stored });
      new Function(themeInitScript)();
      const expected = stored === "light" || stored === "dark" ? stored : dark ? "dark" : "light";
      expect(document.documentElement.dataset.theme).toBe(expected);
      expect(document.documentElement.classList.contains("dark")).toBe(expected === "dark");
      expect(document.querySelector('meta[name="color-scheme"]')).toHaveAttribute("content", stored === "light" || stored === "dark" ? stored : "light dark");
    }
  });
  it("still applies the system theme when reading storage throws", () => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    vi.stubGlobal("localStorage", { getItem: () => { throw new DOMException("blocked", "SecurityError"); } });
    expect(() => new Function(themeInitScript)()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(applyThemePreference("light")).toBe("light");
    expect(document.documentElement.dataset.themePreference).toBe("light");
  });
});
