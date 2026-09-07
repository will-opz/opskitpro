/** HTTP availability and freshness are independent. Raw evidence is never rewritten. */
export type ObservationState = "success" | "restricted" | "failed" | "unknown";
export type HttpAvailability = "success" | "partial" | "failed" | "unknown";
export type EvidenceFreshness = "fresh" | "cached" | "stale";
type RawObservation = { status?: string; precision?: string; httpStatus?: number };
export type HttpEvidenceInput = {
  http?: { success?: boolean; status_code?: number; classification?: string };
  observations?: { browser?: RawObservation; edge?: RawObservation };
  meta?: { cacheStatus?: string; cacheAgeSeconds?: number };
};
export type NormalizedHttpObservation = { source: "probe" | "browser" | "edge"; state: ObservationState; code?: number };

function responseState(code: number | undefined): ObservationState | undefined {
  if (!code || !Number.isFinite(code)) return undefined;
  if (code >= 200 && code < 400) return "success";
  if ([401, 403, 407, 429].includes(code)) return "restricted";
  if (code >= 400 && code <= 599) return "failed";
  return undefined;
}

export function normalizeHttpEvidence(input: HttpEvidenceInput) {
  const raw = input.http;
  const probe: NormalizedHttpObservation = {
    source: "probe", code: raw?.status_code || undefined,
    // Concrete HTTP evidence takes precedence over a legacy success flag.
    state: responseState(raw?.status_code) ?? (
      raw?.classification === "probe_blocked" ? "restricted"
        : ["network_error", "origin_error"].includes(raw?.classification || "") ? "failed"
          : raw?.success === true ? "success" : "unknown"
    ),
  };
  const normalize = (source: "browser" | "edge", value?: RawObservation): NormalizedHttpObservation => ({
    source, code: value?.httpStatus || undefined,
    // An opaque response cannot establish HTTP availability.
    state: value?.precision !== "full" ? "unknown" : responseState(value.httpStatus) ?? (
      ["reachable", "redirected"].includes(value.status || "") ? "success"
        : ["blocked", "probe_blocked"].includes(value.status || "") ? "restricted"
          : ["failed", "unreachable", "network_error", "timeout"].includes(value.status || "") ? "failed" : "unknown"
    ),
  });
  return { probe, browser: normalize("browser", input.observations?.browser), edge: normalize("edge", input.observations?.edge) };
}

export function assessHttpEvidence(input: HttpEvidenceInput) {
  const evidence = normalizeHttpEvidence(input);
  const points = Object.values(evidence);
  const reachable = points.some((point) => point.state === "success");
  const adverse = points.some((point) => point.state === "failed" || point.state === "restricted");
  const availability: HttpAvailability = reachable ? adverse ? "partial" : "success"
    : points.some((point) => point.state === "restricted") ? "partial"
      : points.some((point) => point.state === "failed") ? "failed" : "unknown";
  const freshness: EvidenceFreshness = (input.meta?.cacheAgeSeconds ?? 0) >= 600 ? "stale"
    : ["HIT", "BROWSER"].includes(input.meta?.cacheStatus || "") ? "cached" : "fresh";
  return {
    ...evidence, availability, freshness, reachable,
    probeBlocked: evidence.probe.state === "restricted",
    browserReachable: evidence.browser.state === "success",
    edgeReachable: evidence.edge.state === "success",
    corroboratedReachable: evidence.browser.state === "success" || evidence.edge.state === "success",
    tone: availability === "success" ? "emerald" : availability === "partial" ? "orange" : availability === "failed" ? "red" : "zinc",
  } as const;
}

export function describeHttpAssessment(assessment: ReturnType<typeof assessHttpEvidence>, lang: "en" | "zh") {
  const names = lang === "zh" ? { probe: "探针", browser: "浏览器", edge: "边缘" } : { probe: "Probe", browser: "Browser", edge: "Edge" };
  const states = lang === "zh" ? { success: "正常", restricted: "受限", failed: "失败", unknown: "未知" } : { success: "OK", restricted: "restricted", failed: "failed", unknown: "unknown" };
  return [assessment.browser, assessment.edge, assessment.probe]
    .filter((point) => point.source === "probe" || point.state !== "unknown")
    .map((point) => `${names[point.source]} ${states[point.state]}${point.code ? ` · HTTP ${point.code}` : ""}`)
    .join(" / ");
}
