// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const finish=vi.fn();const start=vi.hoisted(()=>vi.fn());
vi.mock("@/lib/audience-client",()=>({startToolRun:start}));
import { useReactiveToolUsage, useToolUsage } from "./use-tool-usage";
afterEach(()=>{vi.useRealTimers();vi.clearAllMocks();});
it("reactive tools count one settled edit, never defaults or each keystroke",()=>{
 vi.useFakeTimers();start.mockReturnValue({finish});const {result,rerender}=renderHook(({outcome})=>useReactiveToolUsage("encode",outcome),{initialProps:{outcome:"success" as "success"|"error"|"pending"}});
 act(()=>vi.advanceTimersByTime(1500));expect(start).not.toHaveBeenCalled();
 act(()=>result.current());act(()=>vi.advanceTimersByTime(500));act(()=>result.current());act(()=>vi.advanceTimersByTime(500));expect(start).not.toHaveBeenCalled();
 rerender({outcome:"pending"});act(()=>vi.advanceTimersByTime(1500));expect(start).not.toHaveBeenCalled();rerender({outcome:"error"});act(()=>vi.advanceTimersByTime(1000));expect(start).toHaveBeenCalledTimes(1);expect(finish).toHaveBeenCalledWith("error");
});
it("explicit actions wait for outcome and cancel on unmount",()=>{
 start.mockReturnValue({finish});const {result,rerender,unmount}=renderHook(({outcome})=>useToolUsage("json",outcome),{initialProps:{outcome:"pending" as "pending"|"success"}});
 expect(start).not.toHaveBeenCalled();act(()=>result.current());expect(start).toHaveBeenCalledOnce();rerender({outcome:"success"});expect(finish).toHaveBeenCalledWith("success");
 rerender({outcome:"pending"});act(()=>result.current());unmount();expect(finish).toHaveBeenLastCalledWith("cancel");
});
