import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isAdminPassword } from "@/lib/admin-auth";

afterEach(() => {
  delete process.env.OPSKITPRO_ADMIN_PASSWORD;
});

describe("admin password verification", () => {
  it("rejects passwords when fallback login is not configured", () => {
    expect(isAdminPassword("anything")).toBe(false);
  });

  it("accepts only an exact password match", () => {
    process.env.OPSKITPRO_ADMIN_PASSWORD = "correct-horse";
    expect(isAdminPassword("correct-horse")).toBe(true);
    expect(isAdminPassword("correct-house")).toBe(false);
    expect(isAdminPassword("short")).toBe(false);
  });
});
