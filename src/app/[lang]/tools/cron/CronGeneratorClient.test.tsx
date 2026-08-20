import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CronGeneratorClient from "./CronGeneratorClient";

describe("CronGeneratorClient", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("loads a preset and parses it", () => {
    render(<CronGeneratorClient lang="en" />);
    const presetButton = screen.getByRole("button", { name: "Every minute" });
    fireEvent.click(presetButton);
    const parseButton = screen.getByRole("button", { name: "Parse expression" });
    fireEvent.click(parseButton);

    expect(screen.getByText(/Minute/)).toBeInTheDocument();
    expect(screen.getByText("The expression is valid.")).toBeInTheDocument();
    const output = screen.getByTestId("cron-explain-output").textContent || "";
    expect(output).toContain("Every minute");
  });

  it("reports format errors for wrong field count", () => {
    render(<CronGeneratorClient lang="zh" />);
    const input = screen.getByLabelText("Cron 表达式");
    fireEvent.change(input, { target: { value: "0 9 * *" } });
    fireEvent.click(screen.getByRole("button", { name: "解析表达式" }));
    expect(screen.getByText("表达式无法解析。")).toBeInTheDocument();
    expect(screen.getByText("Cron 必须包含 5 个字段（分钟 小时 日 月 周）。")).toBeInTheDocument();
  });

  it("copies explain text", async () => {
    render(<CronGeneratorClient lang="en" />);
    const input = screen.getByLabelText("Cron expression");
    fireEvent.change(input, { target: { value: "*/5 * * * 1-5" } });
    fireEvent.click(screen.getByRole("button", { name: "Parse expression" }));
    const copyButton = screen.getByRole("button", { name: "Copy explanation" });
    fireEvent.click(copyButton);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });
});
