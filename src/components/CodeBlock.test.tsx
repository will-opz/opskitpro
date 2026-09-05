import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CodeBlock } from "./CodeBlock";

describe("CodeBlock", () => {
  it("copies the complete command, including newlines", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    const command = 'curl "https://example.com"\n  --head';
    render(<CodeBlock lang="zh">{command}</CodeBlock>);
    fireEvent.click(screen.getByRole("button", { name: "复制代码" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("已复制"));
    expect(writeText).toHaveBeenCalledWith(command);
  });

  it("keeps code available and announces clipboard failure", async () => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) } });
    render(<CodeBlock lang="en">example command</CodeBlock>);
    fireEvent.click(screen.getByRole("button", { name: "Copy code" }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("Copy failed"));
    expect(screen.getByText("example command")).toBeVisible();
  });
});
