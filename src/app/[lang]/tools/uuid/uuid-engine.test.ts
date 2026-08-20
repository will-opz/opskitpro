import { afterEach, describe, expect, it, vi } from "vitest";
import { generateUuid, generateUuidV5, isValidUuid } from "./uuid-engine";

describe("uuid engine", () => {
  afterEach(() => vi.restoreAllMocks());
  it("validates common UUID formats", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toMatchObject({
      isValid: true,
      version: "4",
    });
    expect(isValidUuid("550E8400-E29B-41D4-A716-446655440000")).toMatchObject({
      isValid: true,
      version: "4",
    });
    expect(isValidUuid("not-a-uuid").isValid).toBe(false);
  });

  it("generates a v4 UUID that matches UUID v4 format", async () => {
    const value = await generateUuid("v4");
    const parsed = isValidUuid(value);
    expect(parsed.isValid).toBe(true);
    expect(parsed.version).toBe("4");
  });

  it("generates a v1 UUID that matches UUID v1 format", async () => {
    const value = await generateUuid("v1");
    const parsed = isValidUuid(value);
    expect(parsed.isValid).toBe(true);
    expect(parsed.version).toBe("1");
  });

  it("keeps v1 UUIDs unique when generated within one millisecond", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    const values = await Promise.all(Array.from({ length: 200 }, () => generateUuid("v1")));
    expect(new Set(values).size).toBe(values.length);
  });

  it("requires namespace and name for v5 generation", async () => {
    await expect(generateUuid("v5")).rejects.toThrow("v5 requires namespace and name");
    await expect(generateUuid("v5", "6ba7b810-9dad-11d1-80b4-00c04fd430c8")).rejects.toThrow("v5 requires namespace and name");
  });

  it("generates a deterministic v5 UUID for same namespace and name", async () => {
    const namespace = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
    const first = await generateUuidV5(namespace, "example.com");
    const second = await generateUuidV5(namespace, "example.com");
    expect(first).toBe(second);
    expect(isValidUuid(first).version).toBe("5");
  });
});
