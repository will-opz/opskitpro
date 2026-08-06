import { describe, expect, it } from "vitest";
import {
  generateSecurePassphrase,
  generateSecurePassword,
  getPasswordPreset,
  type PasswordOptions,
} from "../password-generator";

const defaults: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
};

describe("generateSecurePassword", () => {
  it("returns the requested length and covers every enabled set", () => {
    const password = generateSecurePassword(defaults);
    expect(password).toHaveLength(20);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[0-9]/);
    expect(password).toMatch(/[^A-Za-z0-9]/);
  });

  it("excludes disabled character sets", () => {
    const password = generateSecurePassword({
      ...defaults,
      uppercase: false,
      lowercase: false,
      symbols: false,
    });
    expect(password).toMatch(/^\d{20}$/);
  });

  it.each([3, 129, 12.5])("rejects invalid length %s", (length) => {
    expect(() => generateSecurePassword({ ...defaults, length })).toThrow();
  });

  it("rejects an empty character set", () => {
    expect(() =>
      generateSecurePassword({
        length: 20,
        uppercase: false,
        lowercase: false,
        numbers: false,
        symbols: false,
      }),
    ).toThrow("At least one character set");
  });

  it("removes ambiguous and explicitly excluded characters", () => {
    const password = generateSecurePassword({
      ...defaults,
      length: 80,
      symbols: false,
      excludeAmbiguous: true,
      excludedCharacters: "abcXYZ",
    });
    expect(password).not.toMatch(/[0O1lIabcXYZ]/);
  });

  it("rejects an enabled set when every character is excluded", () => {
    expect(() =>
      generateSecurePassword({
        length: 20,
        uppercase: false,
        lowercase: false,
        numbers: true,
        symbols: false,
        excludedCharacters: "0123456789",
      }),
    ).toThrow("no characters available");
  });

  it.each(["account", "wifi", "api", "easy"] as const)(
    "returns a valid %s preset",
    (preset) => {
      const options = getPasswordPreset(preset);
      expect(generateSecurePassword(options)).toHaveLength(options.length);
    },
  );
});

describe("generateSecurePassphrase", () => {
  it("returns the requested words, separator, and optional number", () => {
    const phrase = generateSecurePassphrase({
      wordCount: 6,
      separator: "-",
      includeNumber: true,
    });
    const parts = phrase.split("-");
    expect(parts).toHaveLength(7);
    expect(parts.at(-1)).toMatch(/^\d{4}$/);
  });

  it("supports a passphrase without a number", () => {
    const phrase = generateSecurePassphrase({
      wordCount: 4,
      separator: "_",
      includeNumber: false,
    });
    expect(phrase.split("_")).toHaveLength(4);
    expect(phrase).not.toMatch(/\d/);
  });

  it.each([3, 9, 5.5])("rejects invalid word count %s", (wordCount) => {
    expect(() =>
      generateSecurePassphrase({ wordCount, separator: "-", includeNumber: true }),
    ).toThrow();
  });
});
