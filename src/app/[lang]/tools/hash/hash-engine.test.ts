import { describe, expect, it } from "vitest";
import { HASH_TEXT_LIMIT_BYTES, compareChecksum, hashText, normalizeExpectedChecksum } from "./hash-engine";

describe("hash engine", () => {
  it.each([
    ["md5", "d41d8cd98f00b204e9800998ecf8427e"],
    ["sha1", "da39a3ee5e6b4b0d3255bfef95601890afd80709"],
    ["sha256", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"],
    ["sha384", "38b060a751ac96384cd9327eb1b1e36a21fdb71114be07434c0cc7bf63f6e1da274edebfe76f65fbd51ad2f14898b95b"],
    ["sha512", "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e"],
  ] as const)("matches the empty %s vector", async (algorithm, expected) => {
    expect((await hashText("", algorithm)).digest).toBe(expected);
  });

  it("uses UTF-8 bytes", async () => {
    const result = await hashText("中文😀", "sha256");
    expect(result.bytes).toBe(10);
    expect(result.digest).toBe("e973a1c1b41c5c9f4fbac31fcc311536dfffd003bfb914580455170a599953fa");
  });

  it("rejects text beyond the browser safety limit", async () => {
    await expect(hashText("a".repeat(HASH_TEXT_LIMIT_BYTES + 1), "sha256")).rejects.toThrow("text_limit");
  });

  it("normalizes and compares expected checksums", () => {
    const digest = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(normalizeExpectedChecksum(`  ${digest.toUpperCase()}\n`)).toBe(digest);
    expect(compareChecksum(digest, digest.toUpperCase(), "sha256").status).toBe("match");
    expect(compareChecksum(digest, "f".repeat(64), "sha256").status).toBe("mismatch");
    expect(compareChecksum(digest, "not-a-hash", "sha256").status).toBe("invalid");
  });
});
