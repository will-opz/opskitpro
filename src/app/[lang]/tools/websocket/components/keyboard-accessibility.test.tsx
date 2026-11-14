import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConnectionTabs } from "./ConnectionTabs";
import { ConnectionPanel } from "./ConnectionPanel";
import { MessageComposer } from "./MessageComposer";
import type { ConnectionTab } from "../hooks/useMultiConnection";

const config = { url: "wss://example.com/test", autoReconnect: false, reconnectInterval: 3000, maxReconnectAttempts: 5, binaryType: "arraybuffer" as const };
const tab: ConnectionTab = { id: "one", name: "Connection 1", url: config.url, config, status: "disconnected", logs: [], stats: { messagesSent: 0, messagesReceived: 0, bytesSent: 0, bytesReceived: 0, connectedAt: null, latency: null } };
const imeEvents = [{ isComposing: true, keyCode: 13 }, { isComposing: false, keyCode: 229 }];

beforeEach(() => {
  const values = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) });
});
afterEach(() => vi.unstubAllGlobals());

describe("IME-safe WebSocket actions", () => {
  it.each(imeEvents)("does not rename during composition %j, commits once on Enter and cancels on Escape", event => {
    const rename = vi.fn();
    render(<ConnectionTabs lang="en" tabs={[tab]} activeTabId="one" workspaceId="workspace" canAddTab onAddTab={vi.fn()} onSelectTab={vi.fn()} onRemoveTab={vi.fn()} onRenameTab={rename} />);
    const select = screen.getByRole("button", { name: "Connection 1" });
    expect(select).toHaveAttribute("aria-pressed", "true");
    expect(select).toHaveAttribute("aria-controls", "workspace");
    fireEvent.click(screen.getByRole("button", { name: "Rename connection: Connection 1" }));
    const input = screen.getByLabelText("Rename connection: Connection 1");
    fireEvent.change(input, { target: { value: "测试连接" } });
    fireEvent.keyDown(input, { key: "Enter", ...event });
    expect(rename).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    expect(rename).toHaveBeenCalledExactlyOnceWith("one", "测试连接");
    expect(select).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Rename connection: Connection 1" }));
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "discard" } });
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "Escape" });
    expect(rename).toHaveBeenCalledTimes(1);
    expect(select).toHaveFocus();
  });

  it.each(imeEvents)("does not connect during composition %j", event => {
    const connect = vi.fn();
    render(<ConnectionPanel lang="en" status="disconnected" config={config} onConnect={connect} onDisconnect={vi.fn()} onConfigChange={vi.fn()} />);
    const input = screen.getByLabelText("Target endpoint");
    fireEvent.keyDown(input, { key: "Enter", ...event });
    expect(connect).not.toHaveBeenCalled();
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    expect(connect).toHaveBeenCalledTimes(1);
  });

  it.each(imeEvents)("does not save templates during composition %j; preserves message shortcuts", event => {
    const send = vi.fn();
    render(<MessageComposer lang="en" status="connected" onSend={send} />);
    const message = screen.getByLabelText("Message content");
    fireEvent.change(message, { target: { value: "sample" } });
    fireEvent.keyDown(message, { key: "Enter" });
    expect(send).not.toHaveBeenCalled();
    fireEvent.keyDown(message, { key: "Enter", ctrlKey: true });
    expect(send).toHaveBeenCalledExactlyOnceWith("sample");
    fireEvent.click(screen.getByRole("button", { name: "Save as template" }));
    const input = screen.getByLabelText("Template name");
    fireEvent.change(input, { target: { value: "测试模板" } });
    fireEvent.keyDown(input, { key: "Enter", ...event });
    expect(input).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Enter", keyCode: 13 });
    expect(screen.queryByLabelText("Template name")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Templates" }));
    expect(screen.getByText("测试模板")).toBeInTheDocument();
  });
});
