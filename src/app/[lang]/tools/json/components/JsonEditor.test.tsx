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
