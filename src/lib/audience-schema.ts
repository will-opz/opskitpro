/** Anonymous operation metadata only. No user inputs or persistent identifiers. */
export const AUDIENCE_TOOLS = "api website-check network-check dns-lookup ip-lookup cloudflare-trace passgen qrgen json encode time websocket prompt-builder regex hash jwt uuid sensitive-data sql yaml cron color diff".split(" ");
export const AUDIENCE_EVENTS = ["page_view", "tool_open", "tool_run", "tool_success", "tool_error", "tool_cancel"] as const;
export type AudienceEvent = (typeof AUDIENCE_EVENTS)[number];
export function publicAnalyticsPath(path: string): boolean {
  if (path.includes("?") || path.length > 160) return false;
  const parts = path.replace(/^\/|\/$/g, "").split("/");
  return ["en", "zh"].includes(parts[0]) && (parts.length === 1 ||
    (parts.length === 2 && ["tools", "about", "privacy", "mcp", "errors"].includes(parts[1])) ||
    (parts.length === 3 && ((parts[1] === "tools" && [...AUDIENCE_TOOLS, "docs", "api"].includes(parts[2])) || (parts[1] === "errors" && /^\d+$/.test(parts[2])))));
}
export interface AudiencePayload {
  schema_version: 2; event_id: string; event: AudienceEvent; page: string;
  tool?: string; run_id?: string; automation?: boolean;
}
export function validAudiencePayload(value: unknown): value is AudiencePayload {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const v = value as Record<string, unknown>;
  if (Object.keys(v).some(k => !["schema_version", "event_id", "event", "page", "tool", "run_id", "automation"].includes(k))) return false;
  if (v.schema_version !== 2 || typeof v.event_id !== "string" || !/^[a-zA-Z0-9-]{16,64}$/.test(v.event_id) || !AUDIENCE_EVENTS.includes(v.event as AudienceEvent) || typeof v.page !== "string" || !publicAnalyticsPath(v.page)) return false;
  if (v.automation !== undefined && typeof v.automation !== "boolean") return false;
  if (v.event === "page_view") return v.tool === undefined && v.run_id === undefined;
  if (typeof v.tool !== "string" || !AUDIENCE_TOOLS.includes(v.tool) || v.page.replace(/\/$/, "").split("/").at(-1) !== v.tool) return false;
  if (v.tool === "api" && v.event !== "tool_open") return false;
  return v.event === "tool_open" ? v.run_id === undefined : typeof v.run_id === "string" && /^[a-zA-Z0-9-]{16,64}$/.test(v.run_id);
}
