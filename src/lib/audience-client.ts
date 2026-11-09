"use client";
import { AUDIENCE_TOOLS, publicAnalyticsPath, type AudienceEvent } from "./audience-schema";
export function audienceEnabled() { return process.env.NEXT_PUBLIC_AUDIENCE_ENABLED === "true"; }
function emit(event: AudienceEvent, page: string, tool?: string, run_id?: string) {
  try {
    if (!audienceEnabled() || !publicAnalyticsPath(page)) return;
    const payload = JSON.stringify({ schema_version: 2, event_id: crypto.randomUUID(), event, page, tool, run_id, automation: navigator.webdriver === true });
    if (navigator.sendBeacon?.("/api/audience", new Blob([payload], { type: "application/json" }))) return;
    void fetch("/api/audience", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true }).catch(() => {});
  } catch { /* Telemetry must never affect a tool. */ }
}
export function observePage(page: string) {
  emit("page_view", page);
  const tool = page.replace(/\/$/, "").split("/").at(-1);
  if (tool && AUDIENCE_TOOLS.includes(tool) && page.includes("/tools/")) emit("tool_open", page, tool);
}
export function startToolRun(tool: string) {
  let done = false;
  let id = ""; let page = "";
  try { id = crypto.randomUUID(); page = window.location.pathname; } catch { /* server/test safe */ }
  emit("tool_run", page, tool, id);
  return { finish(outcome: "success" | "error" | "cancel") {
    if (done) return; done = true;
    emit(`tool_${outcome}`, page, tool, id);
  } };
}
