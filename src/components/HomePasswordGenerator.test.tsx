import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomePasswordGenerator } from "./HomePasswordGenerator";

describe("HomePasswordGenerator", () => {
  const writeText = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    writeText.mockClear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
  });

  it("renders localized controls and links to the full tool", async () => {
    render(<HomePasswordGenerator lang="zh" />);
    expect(screen.getByText("立即生成安全密码")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /更多密码选项/ })).toHaveAttribute(
      "href",
      "/zh/tools/passgen",
    );
    await waitFor(() =>
      expect(screen.getByLabelText("生成的密码").textContent).toHaveLength(20),
    );
  });

  it("regenerates after changing length and copies the result", async () => {
    render(<HomePasswordGenerator lang="en" />);
    const slider = screen.getByRole("slider", { name: "Length" });
    fireEvent.change(slider, { target: { value: "28" } });
    await waitFor(() =>
      expect(screen.getByLabelText("Generated password").textContent).toHaveLength(28),
    );

    fireEvent.click(screen.getByRole("button", { name: /Copy/ }));
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: /Copied/ })).toBeInTheDocument();
  });

  it("keeps at least one character set enabled", () => {
    render(<HomePasswordGenerator lang="en" />);
    for (const name of ["Uppercase", "Lowercase", "Numbers"]) {
      fireEvent.click(screen.getByRole("button", { name }));
    }
    const symbols = screen.getByRole("button", { name: "Symbols" });
    fireEvent.click(symbols);
    expect(symbols).toHaveAttribute("aria-pressed", "true");
  });
});
