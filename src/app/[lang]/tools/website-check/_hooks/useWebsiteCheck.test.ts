import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useWebsiteCheck } from "./useWebsiteCheck";
import { resultFixture } from "../_lib/result-fixtures";
vi.mock("@/components/AdminSessionProvider",()=>({useAdminSession:()=>({authenticated:false})}));
vi.mock("@/components/AnalyticsEvent",()=>({sendAnalyticsEvent:vi.fn()}));
vi.mock("./useDiagnosticHistory",()=>({useDiagnosticHistory:()=>({upsertHistory:vi.fn()}),readCachedDiagnosticResult:vi.fn().mockResolvedValue(null),writeCachedDiagnosticResult:vi.fn().mockResolvedValue(undefined)}));
const response=(value:any,ok=true)=>({ok,status:ok?200:400,headers:new Headers({"content-type":"application/json"}),json:async()=>value});
describe("diagnostic request provenance",()=>{
 beforeEach(()=>vi.restoreAllMocks());
 it("clears A before B fails and attributes failure only to B",async()=>{
  vi.stubGlobal("fetch",vi.fn(async(url:string)=>url.startsWith("/api/")?url.includes("bad.test")?response({message:"Target did not resolve to a public A or AAAA address."},false):response(resultFixture("normal")):response({})));
  const {result}=renderHook(()=>useWebsiteCheck());
  await act(async()=>{await result.current.runDiagnostic("normal.fixture.test",true);});
  expect(result.current.result.domain).toBe("normal.fixture.test");
  await act(async()=>{await result.current.runDiagnostic("bad.test",true);});
  expect(result.current.result).toBeNull();expect(result.current.failure?.target).toBe("bad.test");expect(result.current.failure?.kind).toBe("dns");
 });
 it("ignores a late prior request after a newer result",async()=>{
  let release!:(v:any)=>void;
  vi.stubGlobal("fetch",vi.fn((url:string)=>url.startsWith("/api/")&&url.includes("slow.test")?new Promise(resolve=>{release=resolve;}):Promise.resolve(response(url.startsWith("/api/")?resultFixture("normal"):{}))));
  const {result}=renderHook(()=>useWebsiteCheck());let slow!:Promise<void>;
  act(()=>{slow=result.current.runDiagnostic("slow.test",true);});
  await waitFor(()=>expect(release).toBeDefined());
  await act(async()=>{await result.current.runDiagnostic("normal.fixture.test",true);});
  await act(async()=>{release(response({domain:"slow.test"}));await slow;});
  expect(result.current.result.domain).toBe("normal.fixture.test");expect(result.current.loading).toBe(false);
 });
});
