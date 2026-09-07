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
    expect(result.counts.password).toBe(0);
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

  it("rejects over-limit text without releasing a partial output", () => {
    const long = "a".repeat(SENSITIVE_TEXT_LIMIT + 10);
    const result = detectSensitive(long);
    expect(result.truncated).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.failureReason).toBe("input_too_long");
    expect(result.redactedText).toBe("");
  });

  it("supports entity toggles and max match capping", () => {
    const input = "a@b.com ".repeat(20);
    const partial = detectSensitive(input, { enabled: { email: true, phone: false, api_key: false, uuid: false, private_key: false, credit_card: false, ip: false }, maxMatches: 3 });
    expect(partial.matches).toHaveLength(3);
    expect(partial.total).toBe(20);
    expect(partial.redacted).toBe(20);
    expect(partial.redactedText).not.toContain("a@b.com");
  });

  it("detects and redacts the screenshot sample", () => {
    const result = detectSensitive([
      "will@gmail.com",
      "root@192.168.31.1",
      "mysql -u root -pmeimei -h localhost",
    ].join("\n"));

    expect(result.total).toBe(3);
    expect(result.counts.email).toBe(1);
    expect(result.counts.ip).toBe(1);
    expect(result.counts.password).toBe(1);
    expect(result.redactedText).toBe([
      "[EMAIL_1]",
      "root@[IP_1]",
      "mysql -u root -p[PASSWORD_1] -h localhost",
    ].join("\n"));
  });

  it.each([
    ['mysql -u root -psecret', 'mysql -u root -p[PASSWORD_1]'],
    ['mysql -u root -p"secret value"', 'mysql -u root -p"[PASSWORD_1]"'],
    ["mariadb -u root -p'secret value'", "mariadb -u root -p'[PASSWORD_1]'"],
    ['mysql --password=secret db', 'mysql --password=[PASSWORD_1] db'],
    ['mysql --password="secret value" db', 'mysql --password="[PASSWORD_1]" db'],
    ['password=secret', 'password=[PASSWORD_1]'],
    ['passwd: "secret value"', 'passwd: "[PASSWORD_1]"'],
    ["MYSQL_PWD='secret value'", "MYSQL_PWD='[PASSWORD_1]'"],
  ])("detects an explicit credential in %s", (input, expected) => {
    const result = detectSensitive(input);
    expect(result.counts.password).toBe(1);
    expect(result.redactedText).toBe(expected);
  });

  it.each([
    "mysql -u root -p",
    "mysql --password",
    "mysql -port 3306",
    "the password is memorable",
    "root@localhost",
  ])("does not infer a credential from %s", (input) => {
    expect(detectSensitive(input).counts.password).toBe(0);
  });

  it("keeps a recognized API key classified as an API key", () => {
    const result = detectSensitive("password=sk-abcdefghijklmnopqrstuvwxyz");
    expect(result.counts.api_key).toBe(1);
    expect(result.counts.password).toBe(0);
    expect(result.redactedText).toBe("password=[API_KEY_1]");
  });

  it("supports independently disabling password and IP detection", () => {
    const input = "password=secret host=192.168.31.1";
    const noPassword = detectSensitive(input, { enabled: { password: false } });
    const noIp = detectSensitive(input, { enabled: { ip: false } });

    expect(noPassword.counts.password).toBe(0);
    expect(noPassword.counts.ip).toBe(1);
    expect(noIp.counts.password).toBe(1);
    expect(noIp.counts.ip).toBe(0);
  });
});


describe("redaction completeness regression", () => {
  it.each([120, 121, 500])("redacts every one of %i detected emails with a bounded preview", (count) => {
    const input = Array.from({ length: count }, (_, i) => `demo${i}@example.com`).join("\n");
    const result = detectSensitive(input);
    expect(result.complete).toBe(true);
    expect(result.total).toBe(count);
    expect(result.redacted).toBe(count);
    expect(result.displayed).toBe(Math.min(120, count));
    expect(result.counts.email).toBe(count);
    expect(result.matches).toHaveLength(result.displayed);
    expect(Object.keys(result.redactionMap)).toHaveLength(result.displayed);
    expect(result.redactedText).toBe(Array.from({ length: count }, (_, i) => `[EMAIL_${i + 1}]`).join("\n"));
  });

  it("redacts mixed entities beyond the preview limit without losing surrounding text", () => {
    const input = Array.from({ length: 100 }, (_, i) =>
      `row: demo${i}@example.com password=secret-${i} ip=192.0.2.10 token=sk-abcdefghijklmnopqrstuvwxyz`,
    ).join("\n");
    const result = detectSensitive(input);
    expect(result.total).toBe(400);
    expect(result.redacted).toBe(400);
    expect(result.counts).toMatchObject({ email: 100, password: 100, ip: 100, api_key: 100 });
    expect(result.redactedText).not.toMatch(/example\.com|secret-|192\.0|sk-abc/);
    expect(result.redactedText.split("\n")).toHaveLength(100);
    expect(result.redactedText).toContain("row: [EMAIL_100] password=[PASSWORD_100] ip=[IP_100] token=[API_KEY_100]");
  });

  it("redacts a match at the exact text limit and fails closed one character over", () => {
    const tail = " end@example.com";
    const input = "x".repeat(SENSITIVE_TEXT_LIMIT - tail.length) + tail;
    const result = detectSensitive(input);
    expect(result.complete).toBe(true);
    expect(result.redactedText).toBe("x".repeat(SENSITIVE_TEXT_LIMIT - tail.length) + " [EMAIL_1]");
    expect(detectSensitive(input + "!")).toMatchObject({ complete: false, redactedText: "", failureReason: "input_too_long" });
  });

  it("does not let a zero preview cap affect processing", () => {
    const result = detectSensitive("password=sk-abcdefghijklmnopqrstuvwxyz", { maxMatches: 0 });
    expect(result).toMatchObject({ total: 1, redacted: 1, displayed: 0, complete: true });
    expect(result.redactedText).toBe("password=[API_KEY_1]");
  });
});


it("fails closed on a processing exception", () => {
  const options = { get enabled(): never { throw new Error("scan interrupted"); } };
  expect(detectSensitive("demo@example.com", options)).toMatchObject({ complete: false, failureReason: "processing_failed", redactedText: "" });
});
