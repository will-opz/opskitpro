import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UuidToolClient from "./UuidToolClient";

describe("UuidToolClient", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("generates UUIDs and shows list content", async () => {
    render(<UuidToolClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Batch count"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate UUID" }));

    await waitFor(() => expect(screen.getAllByRole("listitem")).toHaveLength(2));
  });

  it("supports v1 generation path", async () => {
    render(<UuidToolClient lang="en" />);
    fireEvent.click(screen.getByRole("radio", { name: "UUID v1" }));
    fireEvent.change(screen.getByLabelText("Batch count"), { target: { value: "1" } });
    fireEvent.click(screen.getByRole("button", { name: "Generate UUID" }));

    const generated = await screen.findAllByRole("listitem");
    expect(generated).toHaveLength(1);
    expect(generated[0].textContent).toMatch(/-1[0-9a-f]{3}-/i);
  });

  it("validates UUID lines and reports valid/invalid status", async () => {
    render(<UuidToolClient lang="en" />);
    fireEvent.change(screen.getByLabelText("Validation"), {
      target: { value: "550e8400-e29b-41d4-a716-446655440000\nnot-a-uuid" },
    });

    await waitFor(() => expect(screen.getByText("Found 2 items")).toBeInTheDocument());
    const resultItems = screen.getAllByRole("listitem");
    expect(resultItems).toHaveLength(2);
    expect(resultItems.some((item) => item.textContent?.includes("v4"))).toBeTruthy();
    expect(screen.getAllByText("Invalid").length).toBeGreaterThan(0);
  });
});
