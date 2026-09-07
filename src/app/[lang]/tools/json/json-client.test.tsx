import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import zh from "@/dictionaries/zh.json";
import JSONClient from "./json-client";

describe("JSONClient core workflow", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("formats valid JSON into the result pane", () => {
    render(<JSONClient dict={zh} lang="zh" />);
    fireEvent.change(screen.getByPlaceholderText("在此粘贴您的 JSON 数据..."), {
      target: { value: '{"ok":true}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "美化 JSON" }));

    expect(screen.getByTestId("json-output")).toHaveTextContent('"ok": true');
    expect(screen.getByText("JSON 格式合法")).toBeInTheDocument();
  });

  it("repairs invalid JSON without silently replacing the input", () => {
    render(<JSONClient dict={zh} lang="zh" />);
    const input = screen.getByPlaceholderText("在此粘贴您的 JSON 数据...");
    fireEvent.change(input, { target: { value: "{ok: true,}" } });
    fireEvent.click(screen.getByRole("button", { name: "智能修复" }));

    expect(input).toHaveValue("{ok: true,}");
    expect(screen.getByTestId("json-output")).toHaveTextContent('"ok": true');
    expect(screen.getByRole("button", { name: "用作输入" })).toBeEnabled();
  });

  it("converts valid JSON to YAML from the compact menu", () => {
    render(<JSONClient dict={zh} lang="zh" />);
    fireEvent.change(screen.getByPlaceholderText("在此粘贴您的 JSON 数据..."), {
      target: { value: '{"status":"ok"}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "转换" }));
    fireEvent.click(screen.getByRole("button", { name: "JSON → YAML" }));

    expect(screen.getByTestId("json-output")).toHaveTextContent("status: ok");
  });

  it("reports a clipboard failure without losing the result", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("denied"));
    render(<JSONClient dict={zh} lang="zh" />);
    fireEvent.change(screen.getByPlaceholderText("在此粘贴您的 JSON 数据..."), {
      target: { value: '{"ok":true}' },
    });
    fireEvent.click(screen.getByRole("button", { name: "美化 JSON" }));
    fireEvent.click(screen.getByRole("button", { name: "复制" }));

    await waitFor(() => expect(screen.getByText(/无法访问剪贴板/)).toBeInTheDocument());
    expect(screen.getByTestId("json-output")).toHaveTextContent('"ok": true');
  });
});

describe("JSON stale result safety", () => {
  beforeEach(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } }); });
  it.each(['{"b":2}', '{invalid', ''])("retains old output but blocks reuse after input becomes %s", (nextInput) => {
    render(<JSONClient dict={zh} lang="zh" />);
    const input = screen.getByPlaceholderText("在此粘贴您的 JSON 数据...");
    fireEvent.change(input, { target: { value: '{"a":1}' } });
    fireEvent.click(screen.getByRole("button", { name: "美化 JSON" }));
    fireEvent.change(input, { target: { value: nextInput } });
    expect(screen.getByRole("status")).toHaveTextContent("结果基于之前的输入");
    expect(screen.getByTestId("json-output")).toHaveTextContent('"a": 1');
    expect(screen.getByTestId("json-output")).toHaveAttribute("data-result-state", "stale");
    expect(screen.getByRole("button", { name: "复制" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "用作输入" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "复制" }));
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '{"b":2}' } });
    fireEvent.click(screen.getByRole("button", { name: "美化 JSON" }));
    expect(screen.queryByText("STALE")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制" })).toBeEnabled();
    expect(screen.getByTestId("json-output")).toHaveTextContent('"b": 2');
    fireEvent.click(screen.getByRole("button", { name: "清空" }));
    expect(screen.getByTestId("json-output")).toHaveAttribute("data-result-state", "idle");
  });
  it.each(["repair", "yaml", "toml"])("invalidates %s output when input changes", (kind) => {
    render(<JSONClient dict={zh} lang="zh" />);
    const input = screen.getByPlaceholderText("在此粘贴您的 JSON 数据...");
    fireEvent.change(input, { target: { value: kind === "repair" ? '{a:1}' : '{"a":1}' } });
    if (kind === "repair") fireEvent.click(screen.getByRole("button", { name: "智能修复" }));
    else {
      fireEvent.click(screen.getByRole("button", { name: "转换" }));
      fireEvent.click(screen.getByRole("button", { name: `JSON → ${kind.toUpperCase()}` }));
    }
    expect(screen.getByRole("button", { name: "复制" })).toBeEnabled();
    fireEvent.change(input, { target: { value: '{"b":2}' } });
    expect(screen.getByRole("button", { name: "复制" })).toBeDisabled();
  });
});
