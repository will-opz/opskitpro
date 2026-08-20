import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ColorConverterClient from "./ColorConverterClient";

describe("ColorConverterClient", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("converts hex input and shows all formats", () => {
    render(<ColorConverterClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Input color"), { target: { value: "#ff0000" } });
    fireEvent.click(screen.getByRole("button", { name: "Convert color" }));

    const outputText = screen.getByTestId("color-output").textContent || "";
    expect(outputText).toContain("HEX: #ff0000");
    expect(outputText).toContain("RGB(A): rgb(255, 0, 0)");
    expect(outputText).toContain("HSL(A): hsl(0 100% 50%)");
  });

  it("copies conversion result after convert", async () => {
    render(<ColorConverterClient lang="zh" />);
    fireEvent.change(screen.getByLabelText("颜色输入"), { target: { value: "#00ff00" } });
    fireEvent.click(screen.getByRole("button", { name: "开始转换" }));
    const outputText = screen.getByTestId("color-output").textContent || "";
    expect(outputText).toContain("HEX: #00ff00");

    const copyButton = screen.getByRole("button", { name: "复制全部格式" });
    await act(async () => {
      fireEvent.click(copyButton);
      await Promise.resolve();
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "HEX: #00ff00\nRGB(A): rgb(0, 255, 0)\nHSL(A): hsl(120 100% 50%)\nNormalized: #00FF00"
    );
  });

  it("shows error message for invalid input", () => {
    render(<ColorConverterClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Input color"), { target: { value: "bad-color" } });
    fireEvent.click(screen.getByRole("button", { name: "Convert color" }));
    expect(screen.getByText("Unrecognized color format.")).toBeInTheDocument();
  });
});
