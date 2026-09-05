import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import WebsiteCheckClient from "./WebsiteCheckClient";
import { createSafeDiagnosticResult } from "./_hooks/helpers";

const state = vi.hoisted(() => ({ domain: "", loading: false, error: null as string | null, result: null as Record<string, any> | null, runDiagnostic: vi.fn(), setDomain: vi.fn(), query: "" }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(state.query) }));
vi.mock("./_hooks/useWebsiteCheck", () => ({ useWebsiteCheck: () => ({ ...state, currentStep: 0, localResolvers: {} }) }));
vi.mock("./_hooks/useDiagnosticHistory", () => ({ useDiagnosticHistory: () => ({ history: [], upsertHistory: vi.fn(), deleteHistory: vi.fn(), togglePin: vi.fn() }) }));
const dict = { home: { diagnostics_placeholder: "example.com", diagnostics_btn: "Start website check" } };

describe("WebsiteCheck entry", () => {
  beforeEach(() => { state.domain = ""; state.loading = false; state.error = null; state.result = null; state.query = ""; state.runDiagnostic.mockClear(); state.setDomain.mockClear(); });
  it("keeps result follow-ups behind the verdict and uses the returned domain", () => {
    state.domain = "edited.example.org";
    state.result = createSafeDiagnosticResult({ domain: "example.com", dns: { success: true, records: { MX: ["mail.example.com"] } }, http: { success: true, status_code: 200 }, ssl: { valid: true }, cdn: { is_provider: false } }, "example.com");
    render(<WebsiteCheckClient dict={dict} lang="zh" />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const disclosure = screen.getByText("相关诊断入口").closest("details")!;
    expect(disclosure).not.toHaveAttribute("open");
    const link = screen.getByText("运行安全审计").closest("a")!;
    expect(link).toHaveAttribute("href", "/zh/tools/dns-lookup?tab=security&domain=example.com");
    expect(screen.getByTestId("attention-findings").compareDocumentPosition(disclosure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
  it("keeps the example separate from network actions", () => {
    render(<WebsiteCheckClient dict={dict} lang="en" />);
    fireEvent.click(screen.getByText("View example report · Not live data"));
    expect(state.runDiagnostic).not.toHaveBeenCalled();
    expect(state.setDomain).not.toHaveBeenCalled();
    expect(screen.getByText("example.com · Static illustration")).toBeInTheDocument();
  });
  it("runs a query handoff once across rerenders", () => {
    state.query = "q=example.com";
    const { rerender } = render(<WebsiteCheckClient dict={dict} lang="en" />);
    rerender(<WebsiteCheckClient dict={dict} lang="en" />);
    expect(state.runDiagnostic).toHaveBeenCalledExactlyOnceWith("example.com");
  });
  it("submits only the hostname and does not show coverage during loading", () => {
    state.domain = "https://user:secret@example.com/private?token=secret";
    const { rerender } = render(<WebsiteCheckClient dict={dict} lang="en" />);
    fireEvent.submit(screen.getByLabelText("Domain or URL").closest("form")!);
    expect(state.runDiagnostic).toHaveBeenCalledExactlyOnceWith("example.com", true);
    state.loading = true;
    rerender(<WebsiteCheckClient dict={dict} lang="en" />);
    expect(screen.queryByText("What we’ll check")).not.toBeInTheDocument();
    fireEvent.submit(screen.getByLabelText("Domain or URL").closest("form")!);
    expect(state.runDiagnostic).toHaveBeenCalledTimes(1);
  });
  it("rejects malformed input and hides coverage on a diagnostic error", () => {
    state.domain = "invalid input";
    const { rerender } = render(<WebsiteCheckClient dict={dict} lang="en" />);
    fireEvent.submit(screen.getByLabelText("Domain or URL").closest("form")!);
    expect(screen.getByRole("alert")).toBeVisible();
    expect(state.runDiagnostic).not.toHaveBeenCalled();
    state.error = "Network request failed";
    rerender(<WebsiteCheckClient dict={dict} lang="en" />);
    expect(screen.queryByText("What we’ll check")).not.toBeInTheDocument();
  });
});
