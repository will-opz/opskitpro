import ipaddr from "ipaddr.js";

export const TRACE_MAX_BYTES = 16384;
export type CfTrace = Record<string, string> & { ip: string; colo: string; ts: string };
export interface TraceSnapshot { trace: CfTrace; mode: "my" | "target"; target?: string; receivedAt: string }

/** Parse untrusted trace text, preserving values containing '=' without accepting HTML. */
export function parseTraceText(text: string): CfTrace {
  if (!text || text.length > TRACE_MAX_BYTES || /[<>\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new Error("invalid_response");
  const raw: Record<string, string> = Object.create(null);
  const lines = text.trim().split(/\r?\n/);
  if (lines.length > 64) throw new Error("invalid_response");
  for (const line of lines) {
    const index = line.indexOf("=");
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (index < 1 || !/^[a-z][a-z0-9_]{0,31}$/.test(key) || Object.hasOwn(raw, key) || value.length > 2048) throw new Error("invalid_response");
    raw[key] = value;
  }
  if (!raw.ip || !(ipaddr.IPv4.isValidFourPartDecimal(raw.ip) || ipaddr.IPv6.isValid(raw.ip)) || !/^[A-Z]{3}$/.test(raw.colo ?? "") || !/^\d{9,11}(\.\d{1,9})?$/.test(raw.ts ?? "") || !Number.isFinite(new Date(Number(raw.ts) * 1000).getTime())) throw new Error("invalid_response");
  return raw as CfTrace;
}
export function traceState(value: string | undefined, zh: boolean) {
  return value === "on" || value === "plus" ? (zh ? "已启用" : "Enabled") : value === "off" ? (zh ? "未启用" : "Disabled") : (zh ? "未知" : "Unknown");
}
export function traceTime(ts: string) { return new Date(Number(ts) * 1000).toISOString().replace("T", " ").replace("Z", " UTC"); }
export function traceSource(mode: TraceSnapshot["mode"], zh: boolean) {
  return mode === "my" ? (zh ? "当前浏览器 → OpsKitPro 的 Cloudflare 边缘" : "This browser → OpsKitPro Cloudflare edge") : (zh ? "OpsKitPro 服务端 → 目标的 Cloudflare 边缘" : "OpsKitPro server → target Cloudflare edge");
}
export function buildTraceSummary(snapshot: TraceSnapshot, lang: "zh" | "en", options: { includeIp?: boolean; includeTarget?: boolean } = {}) {
  const { trace, mode } = snapshot; const zh = lang === "zh";
  const unknown = zh ? "未知" : "Unknown";
  // Export only known protocol values: arbitrary server-controlled strings never become share content.
  const http = ["http/1.0", "http/1.1", "http/2", "http/3"].includes(trace.http) ? trace.http : unknown;
  const tls = ["TLSv1", "TLSv1.0", "TLSv1.1", "TLSv1.2", "TLSv1.3"].includes(trace.tls) ? trace.tls : unknown;
  return [
    "OpsKitPro · Cloudflare Trace",
    `${zh ? "观察来源" : "Source"}: ${traceSource(mode, zh)}`,
    `${zh ? "观测时间" : "Observed"}: ${traceTime(trace.ts)}`,
    `${zh ? "数据中心" : "Data center"}: ${trace.colo}`,
    `${zh ? "出口IP地区" : "Egress IP region"}: ${/^[A-Z]{2}$/.test(trace.loc ?? "") ? trace.loc : unknown}`,
    `${zh ? "协议" : "Protocols"}: ${http} · ${tls}`,
    `WARP: ${traceState(trace.warp, zh)}; Gateway: ${traceState(trace.gateway, zh)}`,
    `${zh ? "出口IP" : "Egress IP"}: ${options.includeIp ? trace.ip : zh ? "[已隐藏]" : "[hidden]"}`,
    ...(mode === "target" && options.includeTarget && snapshot.target ? [`${zh ? "目标" : "Target"}: ${snapshot.target}`] : []),
    zh ? "仅反映本次请求，不代表源站位置或整体网络质量。" : "This request only; not the origin location or overall network quality.",
    ...(mode === "target" ? [zh ? "出口IP属于服务端探测，不是用户或目标源站IP。" : "The egress IP belongs to the server probe, not the user or target origin."] : []),
  ].join("\n");
}
