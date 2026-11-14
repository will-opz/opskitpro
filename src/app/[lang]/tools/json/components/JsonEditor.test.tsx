import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { JsonEditor } from "./JsonEditor";

describe("JsonEditor keyboard navigation", () => {
  it("does not cancel Tab or Shift+Tab navigation", () => {
    const onChange = vi.fn();
    render(<><label id="json-input-title">Input</label><JsonEditor value="{}" onChange={onChange} onValidate={vi.fn()} /></>);
    const editor = screen.getByRole("textbox", { name: "Input" });
    expect(fireEvent.keyDown(editor, { key: "Tab" })).toBe(true);
    expect(fireEvent.keyDown(editor, { key: "Tab", shiftKey: true })).toBe(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

 it("keeps large multi-line input intact without one DOM element per line", () => {
    const value = Array.from({ length: 10000 }, (_, i) => String(i)).join("\n");
    const { container } = render(<><label id="json-input-title">Input</label><JsonEditor value={value} onChange={vi.fn()} onValidate={vi.fn()} /></>);
    expect(screen.getByRole("textbox", { name: "Input" })).toHaveValue(value);
    const gutter = container.querySelector('[aria-hidden="true"]')!;
    expect(gutter.childElementCount).toBe(0);
    expect(gutter.textContent?.split("\n")).toHaveLength(10000);
    expect(gutter.textContent?.endsWith("10000")).toBe(true);
  });
