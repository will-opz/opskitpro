import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SqlFormatterClient from "./SqlFormatterClient";

describe("SQL formatter client", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("formats SQL and renders output", async () => {
    render(<SqlFormatterClient lang="en" />);
    const input = screen.getByPlaceholderText("SELECT id,name FROM users WHERE status='active' AND score>=100 ORDER BY created_at DESC;");
    fireEvent.change(input, {
      target: {
        value: "SELECT id,name from users where status='active' and score>=100 order by created_at desc;",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Format SQL" }));
    const output = await screen.findByTestId("sql-output");
    expect(output.textContent).toContain("SELECT");
    expect(output.textContent).toContain("FROM");
    expect(output.textContent).toContain("ORDER BY");
  });

  it("shows error for unmatched parentheses", async () => {
    render(<SqlFormatterClient lang="zh" />);
    const input = screen.getByPlaceholderText("SELECT id,name FROM users WHERE status='active' AND score>=100 ORDER BY created_at DESC;");
    fireEvent.change(input, { target: { value: "SELECT (id,name FROM users" } });
    fireEvent.click(screen.getByRole("button", { name: "开始格式化" }));
    expect(await screen.findByText("括号不匹配。")).toBeInTheDocument();
  });
});
