import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import zh from "@/dictionaries/zh.json";
import en from "@/dictionaries/en.json";
import JSONClient from "./json-client";

const usage = vi.hoisted(() => ({ finish: vi.fn() }));
vi.mock("@/lib/audience-client", () => ({ startToolRun: () => usage }));
afterEach(() => vi.restoreAllMocks());

describe("JSON operation failure recovery", () => {
  it.each([
    ["zh", "美化 JSON"], ["zh", "压缩 JSON"], ["en", "Beautify"], ["en", "Minify"],
  ] as const)("%s %s reports a capacity error without changing input or enabling old output", (lang, action) => {
    render(<JSONClient dict={lang === "zh" ? zh : en} lang={lang} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: '{"ok":true}' } });
    fireEvent.click(screen.getByRole("button", { name: action }));
    fireEvent.change(input, { target: { value: '{"force":true}' } });
    const stringify = JSON.stringify;
    const spy = vi.spyOn(JSON, "stringify").mockImplementation((value, replacer, space) => {
      if (value?.force) throw new RangeError("synthetic capacity failure");
      return stringify(value, replacer as never, space);
    });
    usage.finish.mockClear();
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(usage.finish).toHaveBeenCalledExactlyOnceWith("error");
    expect(input).toHaveValue('{"force":true}');
    expect(input).toHaveAttribute("aria-describedby", "json-operation-error");
    expect(input).not.toHaveAttribute("aria-invalid", "true");
    const message = document.getElementById("json-operation-error")!;
    expect(message).toHaveAttribute("aria-live", "polite");
    expect(message).toHaveTextContent(lang === "zh" ? "浏览器" : "browser");
    expect(screen.getByRole("button", { name: lang === "zh" ? "复制" : "Copy" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: lang === "zh" ? "用作输入" : "Use as input" })).not.toBeInTheDocument();
    spy.mockRestore();
    fireEvent.click(screen.getByRole("button", { name: action }));
    expect(message).toBeEmptyDOMElement();
    expect(input).not.toHaveAttribute("aria-describedby");
    expect(screen.getByRole("button", { name: lang === "zh" ? "复制" : "Copy" })).toBeEnabled();
    expect(screen.getByTestId("json-output")).toHaveTextContent('"force"');
  });

  it("reports failed repair and clears feedback on edit and reset", () => {
    render(<JSONClient dict={zh} lang="zh" />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "not json" } });
    fireEvent.click(screen.getByRole("button", { name: "智能修复" }));
    expect(document.getElementById("json-operation-error")).toHaveTextContent("无法完成操作");
    expect(input).toHaveValue("not json");
    fireEvent.change(input, { target: { value: "still not json" } });
    expect(document.getElementById("json-operation-error")).toBeEmptyDOMElement();
    fireEvent.click(screen.getByRole("button", { name: "智能修复" }));
    fireEvent.click(screen.getByRole("button", { name: "清空" }));
    expect(input).toHaveValue("");
    expect(document.getElementById("json-operation-error")).toBeEmptyDOMElement();
  });

  it("shows a recoverable error when the selected converter rejects valid JSON", () => {
    render(<JSONClient dict={en} lang="en" />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "null" } });
    fireEvent.click(screen.getByRole("button", { name: "Convert" }));
    fireEvent.click(screen.getByRole("button", { name: "JSON → TOML" }));
    expect(document.getElementById("json-operation-error")).toHaveTextContent("Unable to complete");
    expect(input).toHaveValue("null");
    expect(screen.getByRole("button", { name: "Copy" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Minify" }));
    expect(document.getElementById("json-operation-error")).toBeEmptyDOMElement();
    expect(screen.getByTestId("json-output")).toHaveTextContent("null");
  });
});

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
