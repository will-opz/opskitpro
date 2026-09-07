import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useLocalToolResult } from "./useLocalToolResult";

describe("local result provenance", () => {
  it("retains but invalidates output immediately on every actual input edit", () => {
    const { result } = renderHook(() => useLocalToolResult<string>());
    act(() => result.current.setInput("A"));
    act(() => result.current.publish("Result A"));
    expect(result.current.canUseResult).toBe(true);
    act(() => result.current.setInput("B"));
    expect(result.current).toMatchObject({ status: "stale", result: "Result A", canUseResult: false });
    act(() => result.current.setInput("A"));
    expect(result.current.status).toBe("stale");
    act(() => result.current.publish("Result A2"));
    expect(result.current.status).toBe("fresh");
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ input: "", result: null, status: "idle" });
  });
  it("ignores an asynchronous result from an older input revision", () => {
    const { result } = renderHook(() => useLocalToolResult<string>());
    act(() => result.current.setInput("A"));
    const oldRevision = result.current.revision;
    act(() => result.current.setInput("B"));
    act(() => result.current.publish("Result B"));
    act(() => result.current.publish("Late result A", oldRevision));
    expect(result.current).toMatchObject({ result: "Result B", status: "fresh" });
  });
});
