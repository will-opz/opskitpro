import { describe, expect, it } from "vitest";
import {
  detectSensitive,
  SENSITIVE_TEXT_LIMIT,
} from "./sensitive-data-engine";

describe("sensitive data engine", () => {
  it("detects high-confidence entities in mixed text", () => {
    const result = detectSensitive(
      "Contact support: alice@example.com, phone +86 13800138000, token sk-abcdefghijklmnopqrstuvwxyz, ip 203.0.113.45, uuid 550e8400-e29b-41d4-a716-446655440000, key -----BEGIN PRIVATE KEY----- and card 4111-1111-1111-1111.",
    { maxMatches: 20 },
  );

    expect(result.total).toBe(7);
    const total = result.total;
    expect(total).toBe(7);
    expect(result.counts.email).toBe(1);
    expect(result.counts.phone).toBe(1);
    expect(result.counts.api_key).toBe(1);
    expect(result.counts.ip).toBe(1);
    expect(result.counts.uuid).toBe(1);
    expect(result.counts.private_key).toBe(1);
    expect(result.counts.credit_card).toBe(1);
    expect(result.redactedText).toContain("[EMAIL_1]");
    expect(result.redactedText).toContain("[PHONE_1]");
    expect(result.redactedText).toContain("[API_KEY_1]");
    expect(result.redactedText).toContain("[IP_1]");
    expect(result.redactedText).toContain("[UUID_1]");
    expect(result.redactedText).toContain("[PRIVATE_KEY_1]");
    expect(result.redactedText).toContain("[CREDIT_CARD_1]");
  });

  it("filters invalid card numbers even if they match pattern length", () => {
    const valid = detectSensitive("4242-4242-4242-4242");
    const invalid = detectSensitive("1111-1111-1111-1111");
    expect(valid.total).toBe(1);
    expect(invalid.total).toBe(0);
  });

  it("redacts the complete PEM private key block", () => {
    const pem = [
      "-----BEGIN RSA PRIVATE KEY-----",
      "SUPER_SECRET_BODY_123",
      "-----END RSA PRIVATE KEY-----",
    ].join("\n");
    const result = detectSensitive(`before\n${pem}\nafter`);

    expect(result.counts.private_key).toBe(1);
    expect(result.redactedText).toBe("before\n[PRIVATE_KEY_1]\nafter");
    expect(result.redactedText).not.toContain("SUPER_SECRET_BODY_123");
    expect(result.redactedText).not.toContain("END RSA PRIVATE KEY");
  });

  it.each([
    "4111111111111111",
    "4111 1111 1111 1111",
    "4111-1111-1111-1111",
  ])("classifies a valid card as credit card instead of phone: %s", (card) => {
    const result = detectSensitive(card);
    expect(result.counts.credit_card).toBe(1);
    expect(result.counts.phone).toBe(0);
    expect(result.redactedText).toBe("[CREDIT_CARD_1]");
  });

  it("does not reinterpret a disabled credit card as a phone number", () => {
    const result = detectSensitive("4111 1111 1111 1111", {
      enabled: { credit_card: false },
    });
    expect(result.total).toBe(0);
  });

  it("marks input truncation for long text", () => {
    const long = "a".repeat(SENSITIVE_TEXT_LIMIT + 10);
    const result = detectSensitive(long);
    expect(result.truncated).toBe(true);
    expect(result.redactedText.length).toBeLessThanOrEqual(SENSITIVE_TEXT_LIMIT);
  });

  it("supports entity toggles and max match capping", () => {
    const input = "a@b.com ".repeat(20);
    const partial = detectSensitive(input, { enabled: { email: true, phone: false, api_key: false, uuid: false, private_key: false, credit_card: false, ip: false }, maxMatches: 3 });
    expect(partial.matches).toHaveLength(3);
  });
});
