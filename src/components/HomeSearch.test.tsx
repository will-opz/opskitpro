import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomeSearch from "./HomeSearch";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("HomeSearch", () => {
  beforeEach(() => push.mockClear());
  it.each(["en", "zh"] as const)("submits a sanitized target in %s", (lang) => {
    render(<HomeSearch lang={lang} />);
    const input = screen.getByRole("textbox", { name: lang === "zh" ? "域名或 URL" : "Domain or URL" });
    fireEvent.change(input, { target: { value: "https://user:secret@example.com/private?token=secret#fragment" } });
    expect(push).not.toHaveBeenCalled();
    fireEvent.submit(input.closest("form")!);
    expect(push).toHaveBeenCalledExactlyOnceWith(`/${lang}/tools/website-check?q=example.com`);
  });
  it("keeps invalid input editable without navigation", () => {
    render(<HomeSearch lang="en" />);
    const input = screen.getByLabelText("Domain or URL");
    fireEvent.change(input, { target: { value: "not a domain" } });
    fireEvent.submit(input.closest("form")!);
    expect(push).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.change(input, { target: { value: "example.com" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
