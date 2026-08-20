import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import SensitiveDataClient from "./SensitiveDataClient";

describe("SensitiveDataClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("detects and highlights sensitive content", async () => {
    render(<SensitiveDataClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Text to scan"), {
      target: { value: "alice@example.com sk-abcdefghij1234567890" },
    });

    expect(screen.getAllByText(/Detected 2 sensitive item\(s\)/)).toHaveLength(2);
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
  });

  it("copies redacted text on request", async () => {
    render(<SensitiveDataClient lang="en" />);
    act(() => {
      fireEvent.change(screen.getByLabelText("Text to scan"), {
        target: { value: "alice@example.com +86 13800138000" },
      });
      fireEvent.click(screen.getByRole("button", { name: "Copy redacted text" }));
    });
    act(() => {
      vi.advanceTimersByTime(1600);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    const calls = (navigator.clipboard.writeText as unknown as { mock: { calls: unknown[] } }).mock.calls;
    const [output] = calls[0] as string[];
    expect(String(output)).toContain("[EMAIL_1]");
    expect(String(output)).toContain("[PHONE_1]");
  });

  it("shows redaction mapping in comparison mode", () => {
    render(<SensitiveDataClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Text to scan"), {
      target: { value: "alice@example.com +86 13800138000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Show comparison" }));

    expect(screen.getByText("Redaction map")).toBeInTheDocument();
    expect(screen.getByText("[EMAIL_1]")).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Email") && content.includes("#1"))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes("Phone") && content.includes("#1"))).toBeInTheDocument();
  });
});
