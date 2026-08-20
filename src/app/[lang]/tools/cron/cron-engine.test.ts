import { describe, expect, it } from "vitest";
import { cronPresets, parseCronExpression } from "./cron-engine";

describe("cron engine", () => {
  it("accepts standard preset expressions", () => {
    for (const preset of cronPresets) {
      const result = parseCronExpression(preset.expression);
      expect(result.ok).toBe(true);
      expect(result.parsed).toHaveLength(5);
    }
  });

  it("validates field count", () => {
    const result = parseCronExpression("0 9 * *");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("cron_format_error");
  });

  it("rejects out-of-range minute values", () => {
    const result = parseCronExpression("90 12 * * *");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("cron_minute_invalid_out_of_range");
  });

  it("supports names in month and weekday fields", () => {
    const result = parseCronExpression("0 9 1 Jan Mon-Fri");
    expect(result.ok).toBe(true);
    expect(result.parsed).toEqual(["0", "9", "1", "Jan", "Mon-Fri"]);
  });

  it("rejects Quartz question marks in standard five-field mode", () => {
    const result = parseCronExpression("0 0 * * ?");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("cron_dayOfWeek_invalid_bad_number_or_alias");
  });

  it("accepts both zero and seven for Sunday", () => {
    expect(parseCronExpression("0 0 * * 0").ok).toBe(true);
    expect(parseCronExpression("0 0 * * 7").ok).toBe(true);
  });
});
