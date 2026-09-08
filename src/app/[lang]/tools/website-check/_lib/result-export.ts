import { buildWebsiteCheckReport } from "./report";
import type { ResultExperience } from "./result-experience";

/** Preserve v1 keys while making summary/actions agree with the displayed result. */
export function buildResultExport(result:any, model:ResultExperience, lang:"zh"|"en") {
  const legacy = buildWebsiteCheckReport(result, {lang});
  return {
    ...legacy,
    verdict: ({normal:"Healthy",abnormal:"Degraded",partial:"Degraded",unknown:"Unknown"} as const)[model.state],
    status: ({normal:"healthy",abnormal:"critical",partial:"degraded",unknown:"degraded"} as const)[model.state],
    summary:model.summary, impact:model.summary, suspectedCause:undefined,
    evidence:model.evidence.map(e=>`${e.location} · ${e.source} · ${e.value} · ${e.time || "time unavailable"} · ${e.freshness}`),
    evidenceRecords:model.evidence.filter(e=>e.state!=="missing").map(e=>({id:e.id,area:e.source,source:({LOCAL:"your_browser",EDGE:"cloudflare_edge",REMOTE:"opskitpro_probe"} as const)[e.location],observationPoint:e.location,observedAt:e.time,value:e.value})),
    assessments:[{id:"website.result",area:"availability",status:({normal:"healthy",abnormal:"degraded",partial:"degraded",unknown:"unknown"} as const)[model.state],evidenceIds:model.evidence.filter(e=>e.state!=="missing").map(e=>e.id),summary:model.summary}],
    inferences:[], guidance:model.actions.map(a=>({id:a.id,area:"next",audience:"anyone" as const,summary:`${a.label}: ${a.reason}`})),
    nextActions:model.actions.map(a=>`${a.label}: ${a.reason}`),
    // Legacy findings conflate absent evidence and failure; raw data remains available below.
    findings:[], resultExperience:model,
  };
}
