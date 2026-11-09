import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useWebsiteCheck } from "./useWebsiteCheck";
import { resultFixture } from "../_lib/result-fixtures";
const mocks = vi.hoisted(() => ({ history: vi.fn(), read: vi.fn(), write: vi.fn(), starts: vi.fn(), terminals: vi.fn() }));
vi.mock("@/components/AdminSessionProvider", () => ({ useAdminSession: () => ({ authenticated: false }) }));
vi.mock("@/components/AnalyticsEvent", () => ({ sendAnalyticsEvent: vi.fn() }));
vi.mock("./useDiagnosticHistory", () => ({ useDiagnosticHistory: () => ({ upsertHistory: mocks.history }), readCachedDiagnosticResult: mocks.read, writeCachedDiagnosticResult: mocks.write }));
vi.mock("@/lib/audience-client", () => ({ startToolRun: () => { mocks.starts(); let done = false; return { finish: (outcome: string) => { if (!done) { done = true; mocks.terminals(outcome); } } }; } }));
const response = (value: unknown, status = 200, contentType = "application/json") => ({ ok: status === 200, status, headers: new Headers({ "content-type": contentType }), json: async () => value });
const never = () => new Promise<never>(() => {});
const fetchFixture = () => vi.stubGlobal("fetch", vi.fn(async (url: string) => response(url.startsWith("/api/") ? resultFixture("normal") : {})));
describe("diagnostic lifecycle", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.read.mockResolvedValue(null); mocks.write.mockResolvedValue(undefined); mocks.history.mockResolvedValue(undefined); fetchFixture(); });
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
  it("clears A before B fails and attributes failure only to B", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => url.includes("bad.test") && url.startsWith("/api/") ? response({ message: "Target did not resolve to a public A or AAAA address." }, 400) : response(resultFixture("normal"))));
    const { result } = renderHook(() => useWebsiteCheck());
    await act(async () => { await result.current.runDiagnostic("normal.fixture.test", true); });
    await act(async () => { await result.current.runDiagnostic("bad.test", true); });
    expect(result.current.result).toBeNull(); expect(result.current.failure).toMatchObject({ target: "bad.test", kind: "dns" }); expect(result.current.phase).toBe("failed");
  });
  it("ignores late response after replacement and sends one terminal per run", async () => {
    let release!: (value: unknown) => void;
    vi.stubGlobal("fetch", vi.fn((url: string) => url.startsWith("/api/") && url.includes("slow.test") ? new Promise(resolve => { release = resolve; }) : Promise.resolve(response(resultFixture("normal")))));
    const { result } = renderHook(() => useWebsiteCheck()); let slow!: Promise<void>;
    act(() => { slow = result.current.runDiagnostic("slow.test", true); });
    await act(async () => { await result.current.runDiagnostic("normal.fixture.test", true); });
    await act(async () => { release(response({ domain: "slow.test" })); await slow; });
    expect(result.current.result.domain).toBe("normal.fixture.test"); expect(mocks.terminals.mock.calls).toEqual([["cancel"], ["success"]]);
  });
  it("cancels immediately, deduplicates same-tick submit and permits immediate retry", async () => {
    vi.stubGlobal("fetch", vi.fn(never)); const { result } = renderHook(() => useWebsiteCheck()); let pending!: Promise<void>;
    act(() => { pending = result.current.runDiagnostic("slow.test", true); void result.current.runDiagnostic("slow.test", true); });
    expect(mocks.starts).toHaveBeenCalledTimes(1);
    act(() => result.current.cancel()); expect(result.current.loading).toBe(false); expect(result.current.phase).toBe("cancelled");
    fetchFixture(); await act(async () => { await result.current.runDiagnostic("slow.test", true); await pending; });
    expect(result.current.phase).toBe("complete"); expect(mocks.terminals.mock.calls).toEqual([["cancel"], ["success"]]);
  });
  it("bounds a hung cache read and never waits for local writes", async () => {
    vi.useFakeTimers(); mocks.read.mockImplementation(never); mocks.write.mockImplementation(never); mocks.history.mockImplementation(never);
    const { result } = renderHook(() => useWebsiteCheck()); let pending!: Promise<void>;
    act(() => { pending = result.current.runDiagnostic("normal.fixture.test"); });
    await act(async () => { await vi.advanceTimersByTimeAsync(501); await pending; });
    expect(result.current.phase).toBe("complete"); expect(result.current.loading).toBe(false);
  });
  it("returns cached results without a network diagnostic", async () => {
    mocks.read.mockResolvedValue(resultFixture("cached")); const { result } = renderHook(() => useWebsiteCheck());
    await act(async () => { await result.current.runDiagnostic("cached.fixture.test"); });
    expect(result.current.result.domain).toBe("cached.fixture.test"); expect(fetch).not.toHaveBeenCalled();
  });
  it("delivers the main result while same-origin observation hangs", async () => {
    vi.stubGlobal("fetch", vi.fn((url: string) => url.startsWith("/api/") ? Promise.resolve(response(resultFixture("normal"))) : never()));
    const { result } = renderHook(() => useWebsiteCheck());
    await act(async () => { await result.current.runDiagnostic(window.location.hostname, true); });
    expect(result.current.loading).toBe(false); expect(result.current.phase).toBe("complete");
  });
  it("times out a hung main request", async () => {
    vi.useFakeTimers(); vi.stubGlobal("fetch", vi.fn(never)); const { result } = renderHook(() => useWebsiteCheck()); let pending!: Promise<void>;
    act(() => { pending = result.current.runDiagnostic("slow.test", true); });
    await act(async () => { await vi.advanceTimersByTimeAsync(30001); await pending; });
    expect(result.current.failure?.kind).toBe("timeout"); expect(result.current.loading).toBe(false);
  });
  it.each([[429, "application/json", "rate_limit"], [200, "text/html", "invalid_response"]])("classifies %s/%s", async (status, contentType, kind) => {
    vi.stubGlobal("fetch", vi.fn(async () => response({}, Number(status), contentType as string))); const { result } = renderHook(() => useWebsiteCheck());
    await act(async () => { await result.current.runDiagnostic("example.com", true); }); expect(result.current.failure?.kind).toBe(kind);
  });
  it.each([["unknown", "partial"], ["http503", "complete"]])("keeps %s evidence separate from operation outcome", async (fixture, phase) => {
    vi.stubGlobal("fetch", vi.fn(async () => response(resultFixture(fixture)))); const { result } = renderHook(() => useWebsiteCheck());
    await act(async () => { await result.current.runDiagnostic(`${fixture}.fixture.test`, true); }); expect(result.current.phase).toBe(phase); expect(result.current.result).not.toBeNull();
  });
  it("aborts all client requests on unmount", async () => {
    vi.stubGlobal("fetch", vi.fn(never)); const { result, unmount } = renderHook(() => useWebsiteCheck()); let pending!: Promise<void>;
    act(() => { pending = result.current.runDiagnostic("slow.test", true); });
    unmount(); await pending;
    for (const call of vi.mocked(fetch).mock.calls) expect(call[1]?.signal?.aborted).toBe(true);
    expect(mocks.terminals.mock.calls).toEqual([["cancel"]]);
  });
});
