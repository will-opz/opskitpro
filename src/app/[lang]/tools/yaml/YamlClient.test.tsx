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

    expect(screen.getByLabelText("YAML input")).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText("YAML input")).toHaveAccessibleDescription(/Line 2, column 1/);
  });

  it("keeps old output but prevents copying after input, indent or sample changes", () => {
    render(<YamlClient lang="en" />);
    const input = screen.getByLabelText("YAML input");
    const format = screen.getByRole("button", { name: "Format YAML" });
    const copy = () => screen.getByRole("button", { name: "Copy result" });
    fireEvent.change(input, { target: { value: "service:\n  name: before" } });
    fireEvent.click(format);
    expect(copy()).toBeEnabled();
    fireEvent.change(input, { target: { value: "service:\n  name: after" } });
    expect(screen.getByRole("status")).toHaveTextContent("Run again");
    expect(copy()).toBeDisabled();
    fireEvent.click(copy());
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    fireEvent.click(format);
    expect(copy()).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(copy()).toBeDisabled();
    fireEvent.click(format);
    fireEvent.click(copy());
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith("service:\n    name: after");
    fireEvent.click(screen.getByRole("button", { name: "Load sample" }));
    expect(copy()).toBeDisabled();
    fireEvent.click(format);
    expect(copy()).toBeEnabled();
    fireEvent.change(input, { target: { value: "a: [" } });
    fireEvent.click(format);
    expect(copy()).toBeDisabled();
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });
});

 it.each(["en", "zh"] as const)("associates localized empty/limit errors with the input (%s)", lang => {
    render(<YamlClient lang={lang} />);
    const input = screen.getByLabelText(lang === "en" ? "YAML input" : "YAML 输入");
    fireEvent.change(input, { target: { value: "x".repeat(50_001) } });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(lang === "en" ? "Input is too long. Reduce it to 50,000 characters or fewer." : "输入内容过长，请缩减到 50,000 字符以内。");
    fireEvent.change(input, { target: { value: "" } });
    expect(input).toHaveAttribute("aria-invalid", "false");
    fireEvent.click(screen.getByRole("button", { name: lang === "en" ? "Validate only" : "仅校验" }));
    expect(input).toHaveAccessibleDescription(lang === "en" ? "Enter YAML to validate." : "请输入要校验的 YAML 内容。");
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "a: 1" } });
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(input).not.toHaveAttribute("aria-describedby");
  });
