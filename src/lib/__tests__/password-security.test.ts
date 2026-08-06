import { describe, expect, it, vi } from "vitest";
import { analyzePasswordStrength, checkPwnedPassword } from "../password-security";

describe("analyzePasswordStrength", () => {
  it("flags common, sequential, and keyboard-like passwords", () => {
    expect(analyzePasswordStrength("password")).toMatchObject({ score: 1, findings: expect.arrayContaining(["common", "short"]) });
    expect(analyzePasswordStrength("12345678").findings).toContain("sequence");
    expect(analyzePasswordStrength("qwerty123").findings).toContain("keyboard");
  });

  it("recognizes long diverse generated passwords without claiming safety", () => {
    expect(analyzePasswordStrength("A9!very-long-random-secret-Z7")).toMatchObject({ score: 5, findings: expect.arrayContaining(["long", "diverse"]) });
  });
});

describe("checkPwnedPassword", () => {
  const hashBytes = Uint8Array.from({ length: 20 }, (_, index) => index);
  const suffix = "2030405060708090A0B0C0D0E0F10111213";
  const cryptoSource = { subtle: { digest: vi.fn(async () => hashBytes.buffer) } } as unknown as Pick<Crypto, "subtle">;

  it("sends only a five-character prefix with response padding and matches locally", async () => {
    const fetchSource = vi.fn(async () => new Response(`${suffix}:42\n${"F".repeat(35)}:0`, { status: 200 }));
    await expect(checkPwnedPassword("secret-value", { cryptoSource, fetchSource })).resolves.toEqual({ count: 42 });
    expect(fetchSource).toHaveBeenCalledWith("https://api.pwnedpasswords.com/range/00010", { headers: { "Add-Padding": "true" } });
    expect(JSON.stringify(fetchSource.mock.calls)).not.toContain("secret-value");
    expect(JSON.stringify(fetchSource.mock.calls)).not.toContain("000102030405060708090A0B0C0D0E0F10111213");
  });

  it("returns zero for padded, malformed, and non-matching rows", async () => {
    const fetchSource = vi.fn(async () => new Response(`${"A".repeat(35)}:0\ninvalid\n`, { status: 200 }));
    await expect(checkPwnedPassword("another", { cryptoSource, fetchSource })).resolves.toEqual({ count: 0 });
  });

  it("fails closed for service errors and oversized responses", async () => {
    await expect(checkPwnedPassword("x", { cryptoSource, fetchSource: vi.fn(async () => new Response("down", { status: 503 })) })).rejects.toThrow("unavailable");
    await expect(checkPwnedPassword("x", { cryptoSource, fetchSource: vi.fn(async () => new Response("x".repeat(2_000_001), { status: 200 })) })).rejects.toThrow("too large");
  });
});
