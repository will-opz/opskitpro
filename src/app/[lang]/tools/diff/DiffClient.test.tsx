import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import DiffClient from "./DiffClient";
import type { DiffRequest } from "./diff-contract";
import { createTextDiff } from "./diff-engine";

class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: (() => void) | null = null;
  terminate = vi.fn();

  postMessage(request: DiffRequest) {
    window.setTimeout(() => {
      this.onmessage?.({ data: { id: request.id, result: createTextDiff(request.oldText, request.newText, request.options) } } as MessageEvent);
    }, 0);
  }
}

describe("DiffClient", () => {
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

  async function finishWorker() {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
  }

  it("loads the example and renders a local line diff", async () => {
    render(<DiffClient lang="en" />);
    fireEvent.click(screen.getByRole("button", { name: "Load example" }));
    fireEvent.click(screen.getByRole("button", { name: "Compare texts" }));
    await finishWorker();

    expect(screen.getByText("Added 3 · Deleted 2")).toBeInTheDocument();
    expect(screen.getByText("healthcheck: /health")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Unified" })).toHaveAttribute("aria-selected", "true");
  });

  it("applies ignore options explicitly and can switch to split view", async () => {
    render(<DiffClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Original text"), { target: { value: "Hello   " } });
    fireEvent.change(screen.getByLabelText("New text"), { target: { value: "hello" } });
    fireEvent.click(screen.getByLabelText("Ignore letter case"));
    fireEvent.click(screen.getByLabelText("Ignore trailing spaces and tabs"));
    fireEvent.click(screen.getByRole("button", { name: "Compare texts" }));
    await finishWorker();

    expect(screen.getByText("No line differences with the selected options.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Side by side" }));
    expect(screen.getByRole("tab", { name: "Side by side" })).toHaveAttribute("aria-selected", "true");
  });

  it("swaps, clears, and copies only a bounded summary", async () => {
    render(<DiffClient lang="zh" />);
    fireEvent.change(screen.getByLabelText("原文本"), { target: { value: "旧内容" } });
    fireEvent.change(screen.getByLabelText("新文本"), { target: { value: "新内容" } });
    fireEvent.click(screen.getByRole("button", { name: "交换两侧" }));
    expect(screen.getByLabelText("原文本")).toHaveValue("新内容");

    fireEvent.click(screen.getByRole("button", { name: "开始对比" }));
    await finishWorker();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "复制摘要" }));
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("新增: 1\n删除: 1\n未变化: 0\n变化块: 1");

    fireEvent.click(screen.getByRole("button", { name: "清空" }));
    expect(screen.getByLabelText("原文本")).toHaveValue("");
    expect(screen.getByLabelText("新文本")).toHaveValue("");
  });

  it("terminates a comparison that exceeds the worker deadline", async () => {
    class NeverWorker extends MockWorker {
      postMessage() {}
    }
    vi.stubGlobal("Worker", NeverWorker);
    render(<DiffClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Original text"), { target: { value: "a" } });
    fireEvent.change(screen.getByLabelText("New text"), { target: { value: "b" } });
    fireEvent.click(screen.getByRole("button", { name: "Compare texts" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_600);
    });
    expect(screen.getByText(/Comparison timed out/)).toBeInTheDocument();
  });
});
