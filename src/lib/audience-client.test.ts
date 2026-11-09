// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { startToolRun, observePage } from "./audience-client";
import { validAudiencePayload, AUDIENCE_TOOLS } from "./audience-schema";
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe("privacy-minimal event contract",()=>{
 it("covers all tool routes and rejects private/query routes",()=>{
  for(const tool of AUDIENCE_TOOLS.filter(t => t !== "api")) expect(validAudiencePayload({schema_version:2,event_id:crypto.randomUUID(),event:"tool_run",tool,page:`/zh/tools/${tool}`,run_id:crypto.randomUUID()})).toBe(true);
  for(const page of ["/admin","/zh/nav","/en/tools/fake","/en?password=x"]) expect(validAudiencePayload({schema_version:2,event_id:crypto.randomUUID(),event:"page_view",page})).toBe(false);
 });
 it("correlates one run with exactly one terminal event, never input",async()=>{
  vi.stubEnv("NEXT_PUBLIC_AUDIENCE_ENABLED","true");window.history.replaceState({},"","/en/tools/json");
  const bodies:unknown[]=[];vi.stubGlobal("fetch",vi.fn((_url,init)=>{bodies.push(JSON.parse(init.body));return Promise.resolve(new Response());}));
  const run=startToolRun("json");run.finish("success");run.finish("error");
  expect(bodies).toHaveLength(2);expect((bodies[0] as any).run_id).toEqual((bodies[1] as any).run_id);
  expect(Object.keys(bodies[0] as object).sort()).toEqual(["automation","event","event_id","page","run_id","schema_version","tool"]);
  vi.unstubAllGlobals();
 });
 it("does not emit when disabled",()=>{
  vi.stubEnv("NEXT_PUBLIC_AUDIENCE_ENABLED","false");const spy=vi.fn();vi.stubGlobal("fetch",spy);observePage("/en");startToolRun("json").finish("success");expect(spy).not.toHaveBeenCalled();vi.unstubAllGlobals();
 });
});
