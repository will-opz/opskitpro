import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeRegex, type RegexRequest } from "./regex-engine";
import RegexTesterClient from "./RegexTesterClient";

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();

  postMessage(request: RegexRequest) {
    window.setTimeout(() => {
      this.onmessage?.({ data: { id: request.id, result: executeRegex(request.pattern, request.flags, request.text) } } as MessageEvent);
    }, 0);
  }
}

describe("RegexTesterClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Worker", MockWorker);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function runTimers() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });
  }

  it("loads the local example and renders matches and named groups", async () => {
    render(<RegexTesterClient lang="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    await runTimers();

    expect(screen.getByText("3 matches")).toBeInTheDocument();
    expect(screen.getByTestId("regex-highlight").querySelectorAll("mark")).toHaveLength(3);
    expect(screen.getAllByText(/user:/).length).toBeGreaterThan(0);
  });

  it("reports syntax errors without sending input to storage or a URL", async () => {
    const originalUrl = window.location.href;
    render(<RegexTesterClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Regular expression"), { target: { value: "(" } });
    fireEvent.change(screen.getByLabelText("Test text"), { target: { value: "secret@example.com" } });
    await runTimers();

    expect(screen.getByText(/Invalid regular expression/)).toBeInTheDocument();
    expect(window.location.href).toBe(originalUrl);
  });

  it("copies only after the user requests a match summary", async () => {
    render(<RegexTesterClient lang="zh" />);
    fireEvent.change(screen.getByLabelText("正则表达式"), { target: { value: "\\d+" } });
    fireEvent.change(screen.getByLabelText("测试文本"), { target: { value: "编号 123" } });
    await runTimers();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "复制匹配摘要" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("1. [3-6] 123");
  });
});
