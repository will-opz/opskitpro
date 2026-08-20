import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import YamlClient from "./YamlClient";

describe("YamlClient", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("formats valid YAML and shows formatted output", () => {
    render(<YamlClient lang="en" />);

    fireEvent.change(screen.getByPlaceholderText("Paste your YAML here…"), {
      target: { value: "a: 1\nb:\n  - c: 2\n" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Format YAML" }));

    const output = screen.getByText("Formatted output").parentElement?.querySelector("div.mt-2");
    expect(output).toHaveTextContent("a: 1");
    expect(screen.getByText("Valid YAML")).toBeInTheDocument();
  });

  it("clears input and output state", () => {
    render(<YamlClient lang="zh" />);

    fireEvent.change(screen.getByPlaceholderText("在此粘贴 YAML…"), {
      target: { value: "a: 1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "格式化" }));

    const clearButtons = screen.getAllByRole("button", { name: "清空" });
    fireEvent.click(clearButtons[0]);

    expect(screen.getByPlaceholderText("在此粘贴 YAML…")).toHaveValue("");
    expect(screen.getAllByText("粘贴 YAML 后自动显示校验结果")).toHaveLength(2);
  });

  it("copies formatted output on demand", () => {
    render(<YamlClient lang="en" />);

    fireEvent.change(screen.getByPlaceholderText("Paste your YAML here…"), {
      target: { value: "a: 1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Format YAML" }));

    fireEvent.click(screen.getByRole("button", { name: "Copy result" }));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("a: 1");
  });

  it("supports manual validation feedback", () => {
    render(<YamlClient lang="en" />);

    fireEvent.change(screen.getByPlaceholderText("Paste your YAML here…"), {
      target: { value: "a: [1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Validate only" }));

    expect(screen.getByText("Invalid YAML")).toBeInTheDocument();
  });
});
