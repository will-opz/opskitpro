import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CloudflareTraceClient from "./CloudflareTraceClient";
const mocks = vi.hoisted(() => ({ start: vi.fn(), finish: vi.fn() }));
vi.mock("@/lib/audience-client", () => ({ startToolRun: () => { mocks.start(); let done = false; return { finish: (value: string) => { if (!done) { done = true; mocks.finish(value); } } }; } }));
const text = "ip=2001:db8::1234\ncolo=NRT\nts=1794193200\nloc=JP\nhttp=http/2\ntls=TLSv1.3\nwarp=off\nsni=plaintext\nuag=private-agent\nh=private-host";
const response = (body = text, status = 200) => ({ ok: status === 200, status, text: async () => body });
async function targetForm() { fireEvent.click(screen.getByRole("button", { name: "Target domain" })); fireEvent.change(screen.getByLabelText("Domain or URL"), { target: { value: "https://user:secret@submitted.example/private?token=secret" } }); fireEvent.click(screen.getByRole("button", { name: "Trace target" })); await screen.findByRole("region", { name: "Trace result" }); }
describe("Trace UI lifecycle and sharing", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.stubGlobal("fetch", vi.fn(async () => response())); Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } }); });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });
  it("does not count automatic current-connection results as manual runs", async () => {
    render(<CloudflareTraceClient lang="en" />); await screen.findByRole("region", { name: "Trace result" }); expect(mocks.start).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" })); await waitFor(() => expect(mocks.finish).toHaveBeenCalledWith("success")); expect(mocks.start).toHaveBeenCalledTimes(1);
  });
  it("keeps submitted target in the snapshot and explicit share choices local", async () => {
    render(<CloudflareTraceClient lang="en" />); await targetForm();
    fireEvent.change(screen.getByLabelText("Domain or URL"), { target: { value: "edited.example" } });
    expect(screen.getByRole("region", { name: "Trace result" })).toHaveTextContent("submitted.example");
    fireEvent.click(screen.getByText("Share preview and options"));
    const preview = screen.getByLabelText("Share summary preview"); expect((preview as HTMLTextAreaElement).value).not.toMatch(/submitted|edited|2001:db8|private-agent|private-host/);
    fireEvent.click(screen.getByRole("button", { name: "Copy redacted summary" })); await screen.findByText("Copied");
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith((preview as HTMLTextAreaElement).value);
    fireEvent.click(screen.getByLabelText("Include target hostname")); expect((preview as HTMLTextAreaElement).value).toContain("submitted.example"); expect((preview as HTMLTextAreaElement).value).not.toContain("edited.example");
    fireEvent.click(screen.getByRole("button", { name: "Trace target" })); await screen.findByRole("region", { name: "Trace result" });
    fireEvent.click(screen.getByText("Share preview and options")); expect(screen.getByLabelText("Include target hostname")).not.toBeChecked();
  });
  it("opens selectable preview on clipboard denial without a success message", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValue(new Error("denied")); render(<CloudflareTraceClient lang="en" />); await screen.findByRole("region", { name: "Trace result" });
    fireEvent.click(screen.getByRole("button", { name: "Copy redacted summary" })); await screen.findByText("Clipboard unavailable. Copy from the preview.");
    expect(screen.getByLabelText("Share summary preview").closest("details")).toHaveAttribute("open"); expect(screen.queryByText("Copied")).toBeNull();
  });
  it("uses the same preview for TXT and revokes its URL", async () => {
    const create = vi.fn().mockReturnValue("blob:fixture"); const revoke = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: create }); Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revoke });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<CloudflareTraceClient lang="en" />); await screen.findByRole("region", { name: "Trace result" });
    vi.useFakeTimers(); fireEvent.click(screen.getByRole("button", { name: "Download TXT" }));
    const link = click.mock.instances[0] as HTMLAnchorElement; expect(link.download).toBe("opskitpro-cloudflare-trace.txt");
    await act(async () => { await vi.advanceTimersByTimeAsync(1001); }); expect(revoke).toHaveBeenCalledWith("blob:fixture"); click.mockRestore();
  });
  it("ignores a late cancelled result after immediate retry", async () => {
    let release!: (value: unknown) => void; let targets = 0;
    vi.stubGlobal("fetch", vi.fn((url: string) => url.startsWith("/api/trace") && ++targets === 1 ? new Promise(resolve => { release = resolve; }) : Promise.resolve(response())));
    render(<CloudflareTraceClient lang="en" />); fireEvent.click(screen.getByRole("button", { name: "Target domain" }));
    fireEvent.change(screen.getByLabelText("Domain or URL"), { target: { value: "first.example" } }); fireEvent.click(screen.getByRole("button", { name: "Trace target" }));
    fireEvent.click(screen.getByRole("button", { name: "Stop waiting" }));
    fireEvent.change(screen.getByLabelText("Domain or URL"), { target: { value: "second.example" } }); fireEvent.click(screen.getByRole("button", { name: "Trace target" }));
    await screen.findByRole("region", { name: "Trace result" }); await act(async () => { release(response(text.replace("NRT", "LAX"))); });
    expect(screen.getByRole("region", { name: "Trace result" })).toHaveTextContent("second.example"); expect(screen.getByRole("region", { name: "Trace result" })).not.toHaveTextContent("LAX");
    expect(mocks.finish.mock.calls).toEqual([["cancel"], ["success"]]);
  });
  it("shows invalid HTML as unavailable with no share button", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => response("<html>challenge</html>"))); render(<CloudflareTraceClient lang="zh" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("未获取到有效的 Cloudflare Trace"); expect(screen.queryByRole("button", { name: "复制脱敏摘要" })).toBeNull();
  });
});
