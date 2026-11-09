import { describe, expect, it, vi } from "vitest";
import { withinBudget } from "./request-budget";
describe("request budgets", () => {
  it("handles work rejection even if already cancelled", async () => {
    const controller = new AbortController(); controller.abort();
    await expect(withinBudget(Promise.reject(new Error("late work")), 500, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    await Promise.resolve();
  });
  it("releases the deadline timer after successful work", async () => {
    vi.useFakeTimers();
    await expect(withinBudget(Promise.resolve("done"), 500)).resolves.toBe("done");
    expect(vi.getTimerCount()).toBe(0); vi.useRealTimers();
  });
});
