// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "./route";
const payload = () => ({ schema_version: 2, event_id: crypto.randomUUID(), event: "page_view", page: "/en" });
function request(body: unknown, headers: Record<string,string> = {}) {
  return new NextRequest("https://opskitpro.com/api/audience", { method:"POST", headers:{origin:"https://opskitpro.com","content-type":"application/json","user-agent":"Mozilla/5.0 Chrome/131.0.0.0",...headers}, body:JSON.stringify(body) });
}
afterEach(() => { vi.unstubAllEnvs();vi.restoreAllMocks(); });
describe("anonymous audience ingress", () => {
  it("is disabled by default and emits no logs", async () => {
    vi.stubEnv("AUDIENCE_ENABLED","false");const log=vi.spyOn(console,"log").mockImplementation(()=>{});
    expect((await POST(request(payload()))).status).toBe(202);expect(log).not.toHaveBeenCalled();
  });
  it("records only validated metadata and server classification", async () => {
    vi.stubEnv("AUDIENCE_ENABLED","true");const log=vi.spyOn(console,"log").mockImplementation(()=>{});
    expect((await POST(request(payload()))).status).toBe(202);
    const event=JSON.parse(log.mock.calls[0][0]);expect(event.classification).toBe("candidate_browser");expect(event.user_agent).toBeUndefined();expect(event.ip).toBeUndefined();
  });
  it("rejects sensitive/unknown fields, queries, cross-origin and oversized bodies", async () => {
    vi.stubEnv("AUDIENCE_ENABLED","true");const log=vi.spyOn(console,"log").mockImplementation(()=>{});
    for (const bad of [{...payload(),target:"secret"},{...payload(),page:"/en?secret=x"},{...payload(),classification:"human"},{...payload(),event:"tool_run",tool:"json"}]) expect((await POST(request(bad))).status).toBe(400);
    expect((await POST(request(payload(),{origin:"https://evil.example"}))).status).toBe(403);
    expect((await POST(request({x:"x".repeat(2000)}))).status).toBe(413);expect(log).not.toHaveBeenCalled();
  });
  it("marks named bots and webdriver as automation",async()=>{
    vi.stubEnv("AUDIENCE_ENABLED","true");const log=vi.spyOn(console,"log").mockImplementation(()=>{});
    await POST(request(payload(),{"user-agent":"Googlebot"}));await POST(request({...payload(),automation:true}));
    expect(log.mock.calls.map(c=>JSON.parse(c[0]).classification)).toEqual(["known_automation","suspected_automation"]);
  });
});

it("bounds ingestion independently of tool API quotas", async () => {
  vi.stubEnv("AUDIENCE_ENABLED","true");
  vi.spyOn(console,"log").mockImplementation(()=>{});
  vi.spyOn(Date,"now").mockReturnValue(Date.now()+120000);
  let response: Response | undefined;
  for(let n=0;n<601;n++) response=await POST(request(payload()));
  expect(response?.status).toBe(429);
});
