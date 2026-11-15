import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LanguageToggle } from "./LanguageToggle";

const navigation = vi.hoisted(() => ({ pathname: "/admin", push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname, useRouter: () => navigation }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });

it.each(["/admin", "/admin/profile", "/admin/analytics"])("refreshes %s in place after writing the locale", (pathname) => {
  navigation.pathname = pathname;
  window.history.replaceState(null, "", `${pathname}?view=account#details`);
  navigation.refresh.mockImplementationOnce(() => expect(document.cookie).toContain("NEXT_LOCALE=zh"));
  render(<LanguageToggle currentLang="en" />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
  expect(navigation.refresh).toHaveBeenCalledOnce();
  expect(navigation.push).not.toHaveBeenCalled();
  expect(window.location.pathname + window.location.search + window.location.hash).toBe(`${pathname}?view=account#details`);
  expect(screen.queryByRole("button", { name: "简体中文" })).toBeNull();
});

it.each([["/en/tools", "/zh/tools?q=dns"], ["/administrator", "/zh/administrator?q=dns"]])("preserves public navigation for %s", (pathname, target) => {
  navigation.pathname = pathname;
  window.history.replaceState(null, "", `${pathname}?q=dns`);
  render(<LanguageToggle currentLang="en" />);
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  fireEvent.click(screen.getByRole("button", { name: "简体中文" }));
  expect(navigation.push).toHaveBeenCalledWith(target);
  expect(navigation.refresh).not.toHaveBeenCalled();
});
