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

  it("does not copy an old result after edits, and recovers on rerun", () => {
    render(<SqlFormatterClient lang="en" />);
    const input = screen.getByLabelText("SQL input");
    const format = screen.getByRole("button", { name: "Format SQL" });
    const copy = () => screen.getByRole("button", { name: "Copy formatted SQL" });
    fireEvent.change(input, { target: { value: "select before from sample;" } });
    fireEvent.click(format);
    fireEvent.change(input, { target: { value: "select after from sample;" } });
    expect(screen.getByTestId("sql-output")).toHaveTextContent("before");
    expect(screen.getByRole("status")).toHaveTextContent("Run again");
    expect(copy()).toBeDisabled();
    fireEvent.click(copy());
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
    fireEvent.click(format);
    expect(copy()).toBeEnabled();
    fireEvent.click(copy());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expect.stringContaining("after"));
    fireEvent.change(input, { target: { value: "select (" } });
    fireEvent.click(format);
    expect(copy()).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(input).toHaveValue("");
    expect(screen.getByTestId("sql-output")).not.toHaveTextContent("after");
  });
});
