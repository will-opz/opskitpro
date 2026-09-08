import { describe, expect, it } from "vitest";
import { buildResultExperience } from "./result-experience";
import { toActionTarget } from "./result-actions";
import { resultFixture } from "./result-fixtures";

describe("diagnostic action contracts", () => {
  it.each(["normal", "dns-fail", "tls-fail", "timeout", "conflict"])("%s has actionable evidence-linked behavior", name => {
    const model = buildResultExperience(resultFixture(name), null, "zh");
    expect(model.actions.length).toBeLessThanOrEqual(3);
    for (const action of model.actions) {
      expect(action.reason).toBeTruthy();
      expect(action.evidenceIds.every(id => model.evidence.some(e => e.id === id && e.state === "observed"))).toBe(true);
      if (action.type === "navigate" && action.destination !== "dns") {
        expect(action.target).toBeNull();
        expect(action.href).not.toContain("?");
      } else expect(action.target?.value).toBe(`${name}.fixture.test`);
    }
  });
  it("DNS uses the existing q contract and strips URL secrets", () => {
    const raw = resultFixture("dns-fail"); raw.domain = "https://user:secret@Example.com/a?token=secret#hash";
    const action = buildResultExperience(raw, null, "en").actions[0];
    expect(action).toMatchObject({type:"navigate",destination:"dns",target:{kind:"hostname",value:"example.com"},href:"/en/tools/dns-lookup?q=example.com"});
  });
  it("IP literals are not sent to hostname DNS lookup", () => {
    const raw = resultFixture("dns-fail");raw.domain="192.0.2.1";
    expect(buildResultExperience(raw,null,"en").actions[0]).toMatchObject({type:"expand",section:"dns",target:{kind:"ip"}});
    expect(toActionTarget("https://[2001:db8::1]/" )?.kind).toBe("ip");
  });
  it("TLS stays on page and conflicts can investigate only current network", () => {
    expect(buildResultExperience(resultFixture("tls-fail"),null,"en").actions[0]).toMatchObject({type:"expand",section:"tls"});
    const action = buildResultExperience(resultFixture("conflict"),null,"en").actions.find(a=>a.id==="network");
    expect(action).toMatchObject({type:"navigate",destination:"current-network",target:null,href:"/en/tools/network-check"});
  });
  it("unknown inspects only returned evidence or retries", () => {
    const empty = buildResultExperience(null,{target:"example.com",kind:"timeout",message:"timeout"},"en");
    expect(empty.actions.map(a=>a.type)).toEqual(["retry"]);
    const raw = resultFixture("unknown");raw.dns={success:true,resolved_ip:"192.0.2.1"};
    expect(buildResultExperience(raw,null,"en").actions[0]).toMatchObject({type:"expand",section:"dns"});
  });
});
