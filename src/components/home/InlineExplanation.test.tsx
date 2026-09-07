import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InlineExplanation } from "./InlineExplanation";

describe("inline source explanation", () => {
  it("supports focus, Escape and repeated tap without navigation", () => {
    render(<InlineExplanation description="Runs in your browser">LOCAL</InlineExplanation>);
    const trigger = screen.getByRole("button", { name: "LOCAL" });
    fireEvent.focus(trigger);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(trigger).toHaveAccessibleDescription("Runs in your browser");
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
  it("opens for mouse hover and dismisses when the pointer leaves", () => {
    render(<InlineExplanation description="Edge observation">EDGE</InlineExplanation>);
    const trigger = screen.getByRole("button");
    const enter = createEvent.pointerOver(trigger);
    Object.defineProperty(enter, "pointerType", { value: "mouse" });
    fireEvent(trigger, enter);
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.pointerOut(trigger, { relatedTarget: document.body });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
  it("dismisses on outside pointer and blur", () => {
    render(<InlineExplanation description="Remote observation">REMOTE</InlineExplanation>);
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    fireEvent.pointerDown(document.body);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    fireEvent.focus(trigger);
    fireEvent.blur(trigger, { relatedTarget: document.body });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
