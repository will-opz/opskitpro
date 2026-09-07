import { describe, expect, it } from "vitest";
import { assessHttpEvidence, describeHttpAssessment, type HttpEvidenceInput } from "../http-assessment";
import { buildWebsiteDiagnosticModel } from "../diagnostic-model";
import { createSafeDiagnosticResult } from "@/app/[lang]/tools/website-check/_hooks/helpers";

const edge = (httpStatus: number, precision = "full") => ({ status: "reachable", precision, httpStatus });
describe("HTTP evidence normalization and assessment", () => {
  it.each<[string, HttpEvidenceInput, string, string]>([
    ["probe and edge 200", { http: { success: true, status_code: 200 }, observations: { edge: edge(200) } }, "success", "success"],
    ["concrete 200 overrides stale flags", { http: { success: false, status_code: 200, classification: "probe_blocked" } }, "success", "success"],
    ["concrete 503 overrides success flag", { http: { success: true, status_code: 503 } }, "failed", "failed"],
    ["probe 403 and edge 200", { http: { status_code: 403 }, observations: { edge: edge(200) } }, "partial", "restricted"],
    ["probe timeout and edge 200", { http: { classification: "network_error" }, observations: { edge: edge(200) } }, "partial", "failed"],
    ["probe 200 and edge 503", { http: { status_code: 200 }, observations: { edge: edge(503) } }, "partial", "success"],
    ["unknown probe with opaque browser", { observations: { browser: edge(200, "opaque") } }, "unknown", "unknown"],
    ["unknown is not failure", { http: { success: false, status_code: 0, classification: "unknown" } }, "unknown", "unknown"],
    ["only probe rejected", { http: { status_code: 429 } }, "partial", "restricted"],
    ["no observations", {}, "unknown", "unknown"],
  ])("%s", (_, input, availability, probeState) => {
    const result = assessHttpEvidence(input);
    expect(result.availability).toBe(availability);
    expect(result.probe.state).toBe(probeState);
    if (probeState === "success") expect(describeHttpAssessment(result, "en")).not.toMatch(/Probe (restricted|failed|unknown)/);
  });
  it.each([ ["HIT", 42, "cached"], ["BROWSER", 42, "cached"], ["HIT", 601, "stale"], ["MISS", 0, "fresh"] ])("keeps freshness separate: %s %s", (cacheStatus, cacheAgeSeconds, freshness) => {
    const result = assessHttpEvidence({ http: { status_code: 200 }, meta: { cacheStatus: String(cacheStatus), cacheAgeSeconds: Number(cacheAgeSeconds) } });
    expect(result.freshness).toBe(freshness);
    expect(result.availability).toBe("success");
  });
  it("shares the same conclusion with the diagnostic model without altering evidence", () => {
    const input = createSafeDiagnosticResult({ dns: { success: true, resolved_ip: "192.0.2.1" }, http: { success: false, status_code: 200 }, ssl: { valid: true } }, "example.com");
    const before = JSON.stringify(input);
    const model = buildWebsiteDiagnosticModel(input);
    expect(model.verdict).toBe("Healthy");
    expect(model.assessments.find((item) => item.id === "http.availability")).toMatchObject({ status: "healthy", summary: "Probe OK · HTTP 200" });
    expect(JSON.stringify(input)).toBe(before);
    expect(model.evidence.find((item) => item.id === "http.result")?.value).toMatchObject({ success: false, statusCode: 200 });
  });
});


it("does not claim global unreachability when HTTP succeeded but DNS evidence disagrees", () => {
  const input = createSafeDiagnosticResult({ dns: { success: false }, http: { status_code: 200, success: true }, ssl: { valid: true } }, "example.com");
  expect(buildWebsiteDiagnosticModel(input).verdict).toBe("Degraded");
});
