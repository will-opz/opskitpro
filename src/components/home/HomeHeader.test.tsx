import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HomeHeader } from "./HomeHeader";

vi.mock("@/components/LanguageToggle", () => ({ LanguageToggle: () => <button>Language</button> }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button>Theme</button> }));
const tools = [{ title: "网站检测", href: "/zh/tools/website-check", keywords: "SSL TLS certificate" }, { title: "JSON", href: "/zh/tools/json", keywords: "format" }];
describe("homepage tool search", () => {
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); this.dispatchEvent(new Event("close")); };
  });
  it("opens by keyboard and searches metadata without executing a diagnostic", () => {
    render(<HomeHeader lang="zh" tools={tools} />);
    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    expect(screen.getByRole("dialog")).toBeVisible();
    const input = screen.getByRole("textbox", { name: "工具名称或任务" });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "ssl" } });
    expect(screen.getByRole("link", { name: "网站检测" })).toHaveAttribute("href", "/zh/tools/website-check");
    expect(screen.queryByRole("link", { name: "JSON" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "关闭搜索" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "搜索工具" })).toHaveFocus();
  });
  it("shows a recoverable empty result and cleans up the global shortcut", () => {
    const { unmount } = render(<HomeHeader lang="en" tools={tools} />);
    fireEvent.click(screen.getByRole("button", { name: "Search tools" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tool or task" }), { target: { value: "not-a-tool" } });
    expect(screen.getByRole("status")).toHaveTextContent("No matching tools");
    const show = vi.spyOn(HTMLDialogElement.prototype, "showModal");
    unmount();
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(show).not.toHaveBeenCalled();
  });
});
