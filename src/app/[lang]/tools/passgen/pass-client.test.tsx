import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import zh from "@/dictionaries/zh.json";
import PassClient from "./pass-client";

describe("PassClient P0 modes", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    const storage = {
      clear: vi.fn(() => values.clear()),
      getItem: vi.fn((key: string) => values.get(key) ?? null),
      key: vi.fn((index: number) => [...values.keys()][index] ?? null),
      get length() {
        return values.size;
      },
      removeItem: vi.fn((key: string) => values.delete(key)),
      setItem: vi.fn((key: string, value: string) => values.set(key, String(value))),
    } satisfies Storage;

    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: storage,
    });
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: storage,
    });
  });

  it("applies the Wi-Fi preset", async () => {
    render(<PassClient dict={zh} lang="zh" />);
    fireEvent.click(screen.getByRole("button", { name: "家庭 Wi-Fi" }));
    fireEvent.click(screen.getByRole("button", { name: "重新生成" }));

    await waitFor(() =>
      expect(screen.getByTestId("generated-password").textContent).toHaveLength(24),
    );
    expect(screen.getByRole("slider", { name: "密码长度" })).toHaveValue("24");
  });

  it("generates a six-word phrase plus four digits", async () => {
    render(<PassClient dict={zh} lang="zh" />);
    fireEvent.click(screen.getByRole("button", { name: "易记短语" }));
    fireEvent.click(screen.getByRole("button", { name: "重新生成" }));

    await waitFor(() => {
      const parts = screen.getByTestId("generated-password").textContent?.split("-");
      expect(parts).toHaveLength(7);
      expect(parts?.at(-1)).toMatch(/^\d{4}$/);
    });
  });

  it("shows a bounded error if exclusions remove an enabled set", async () => {
    render(<PassClient dict={zh} lang="zh" />);
    for (const name of ["大写字母 (A-Z)", "小写字母 (a-z)", "符号 (!@#$)"]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    fireEvent.change(screen.getByPlaceholderText("例如：0O1lI"), {
      target: { value: "0123456789" },
    });
    fireEvent.click(screen.getByRole("button", { name: "重新生成" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("没有可用字符");
    expect(screen.getByTestId("generated-password")).toHaveTextContent("");
  });
});
