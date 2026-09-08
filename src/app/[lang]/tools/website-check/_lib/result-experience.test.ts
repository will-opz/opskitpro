import { describe, expect, it } from "vitest";
import { buildResultExperience } from "./result-experience";
import { buildResultExport } from "./result-export";
import { resultFixture } from "./result-fixtures";
import { createSafeDiagnosticResult } from "../_hooks/helpers";
const now=Date.parse("2026-09-07T14:00:00Z");
const model=(name:string)=>buildResultExperience(createSafeDiagnosticResult(resultFixture(name),`${name}.fixture.test`),null,"zh",now);
describe("website result rules",()=>{
 it.each([["normal","normal"],["dns-fail","abnormal"],["tls-fail","abnormal"],["timeout","abnormal"],["conflict","partial"],["http404","abnormal"],["http503","abnormal"],["partial","partial"],["unknown","unknown"]])("%s is %s",(name,state)=>expect(model(name).state).toBe(state));
 it("keeps conflicting codes and evidence-linked actions",()=>{const m=model("conflict");expect(m.evidence.map(e=>e.value)).toEqual(expect.arrayContaining(["HTTP 200","HTTP 403"]));expect(m.uncertainty.join(" ")).toContain("WAF");expect(m.actions.length).toBeLessThanOrEqual(3);expect(m.actions[0].evidenceIds).toContain("http.edge");});
 it("passes the result target to DNS",()=>expect((model("dns-fail").actions[0] as {href:string}).href).toBe("/zh/tools/dns-lookup?q=dns-fail.fixture.test"));
 it("keeps cache/staleness independent from normal availability",()=>{expect(model("cached").freshness).toBe("cached");expect(model("stale").state).toBe("normal");expect(model("stale").freshness).toBe("stale");});
 it("does not fabricate a missing timestamp or IP",()=>{const r=createSafeDiagnosticResult({domain:"unknown.test"},"unknown.test");expect(r.meta?.checkedAt).toBeUndefined();expect(r.dns.resolved_ip).toBe("");const m=buildResultExperience(r,null,"en",now);expect(m.state).toBe("unknown");expect(m.freshness).toBe("unknown");expect(m.evidence.every(e=>!e.time)).toBe(true);});
 it("a diagnostic request timeout is unknown, not target downtime",()=>{const m=buildResultExperience(null,{target:"timeout.test",kind:"timeout",message:"timed out"},"en",now);expect(m.state).toBe("unknown");expect(m.summary).toContain("not a website failure");});
 it("an unconfirmed TLS handshake is not an invalid certificate",()=>{const r=resultFixture("normal");r.ssl={valid:false,date_valid:false,chain_authorized:false,issuer:"Unknown",expiry:"Unknown",error_reason:"timeout"};expect(buildResultExperience(r,null,"en",now).state).toBe("partial");});
 it("a positive HTTP observation cannot erase failed DNS",()=>{const r=resultFixture("dns-fail");r.observations={edge:{precision:"full",status:"reachable",httpStatus:200}};expect(buildResultExperience(r,null,"en",now).state).toBe("partial");});
});

it("exports TLS errors without claiming HTTP unreachability",()=>{const r=resultFixture("tls-fail");const m=buildResultExperience(r,null,"en",now);const report=buildResultExport(r,m,"en");expect(report.verdict).toBe("Degraded");expect(report.summary).toBe(m.summary);expect(report.resultExperience.state).toBe("abnormal");});
