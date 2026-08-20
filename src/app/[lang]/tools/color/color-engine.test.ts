import { describe, expect, it } from "vitest";
import { formatColor, parseColor } from "./color-engine";

describe("color engine", () => {
  it("parses and formats hex input", () => {
    const parsed = parseColor("#1e90ff");
    expect(parsed.ok).toBe(true);
    expect(parsed.color).toMatchObject({ r: 30, g: 144, b: 255, a: 255 });
    expect(formatColor(parsed.color!).hex).toBe("#1e90ff");
    expect(formatColor(parsed.color!).rgb).toBe("rgb(30, 144, 255)");
  });

  it("parses rgb with alpha and converts to rgba", () => {
    const parsed = parseColor("rgba(255, 0, 128, 0.5)");
    expect(parsed.ok).toBe(true);
    expect(formatColor(parsed.color!)).toMatchObject({
      hex: "#ff008080",
      rgb: "rgba(255, 0, 128, 0.502)",
      normalized: "rgba(255, 0, 128, 0.502)",
    });
  });

  it("parses 4-digit hex shorthand with alpha", () => {
    const parsed = parseColor("#0f08");
    expect(parsed.ok).toBe(true);
    expect(parsed.color).toMatchObject({
      r: 0,
      g: 255,
      b: 0,
      a: 136,
    });
    const output = formatColor(parsed.color!);
    expect(output.hex).toBe("#00ff0088");
    expect(output.rgb).toBe("rgba(0, 255, 0, 0.533)");
  });

  it("returns invalid format for invalid input", () => {
    expect(parseColor("not-a-color")).toEqual({
      ok: false,
      error: "invalid_format",
    });
  });

  it("returns empty_input for blanks", () => {
    expect(parseColor("   ")).toEqual({
      ok: false,
      error: "empty_input",
    });
  });
});
