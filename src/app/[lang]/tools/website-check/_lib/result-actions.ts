import { parseWebsiteTarget } from "@/lib/diagnostic-target";
import type { ResultEvidence, ResultState } from "./result-experience";

export type ActionTarget = { kind: "hostname" | "ip"; value: string };
type ActionBase = { id: string; label: string; reason: string; evidenceIds: string[] };
export type ResultAction = ActionBase & (
  | { type: "navigate"; href: string; destination: "dns"; target: ActionTarget }
  | { type: "navigate"; href: string; destination: "current-network" | "documentation"; target: null }
  | { type: "expand"; section: "dns" | "tls" | "http"; target: ActionTarget | null }
  | { type: "retry"; target: ActionTarget }
);

export function toActionTarget(value: string): ActionTarget | null {
  const normalized = parseWebsiteTarget(value);
  if (!normalized) return null;
  return { kind: normalized.includes(":") || /^(\d+\.){3}\d+$/.test(normalized) ? "ip" : "hostname", value: normalized };
}

type ActionContext = {
  target: string; lang: "zh" | "en"; state: ResultState; evidence: ResultEvidence[];
  dnsFailed: boolean; tlsFailed: boolean; conflict: boolean; restricted: boolean;
  httpCode?: number | null; cloudflare: boolean;
};

/** Rules consume facts; the view only dispatches the resulting typed behavior. */
export function buildResultActions(context: ActionContext): ResultAction[] {
  const { lang, state, evidence, dnsFailed, tlsFailed, conflict, restricted, httpCode, cloudflare } = context;
  const t = (zh: string, en: string) => lang === "zh" ? zh : en;
  const target = toActionTarget(context.target);
  const observed = evidence.filter(e => e.state === "observed");
  const httpIds = observed.filter(e => e.source === "HTTP").map(e => e.id);
  const actions: ResultAction[] = [];
  if (dnsFailed) {
    const base = { id: "dns", label: t("查询 DNS", "Inspect DNS"), reason: t("复核当前目标的解析记录。", "Verify this target’s DNS records."), evidenceIds: ["dns"] };
    actions.push(target?.kind === "hostname"
      ? { ...base, type: "navigate", destination: "dns", target, href: `/${lang}/tools/dns-lookup?q=${encodeURIComponent(target.value)}` }
      : { ...base, label: t("查看 DNS 证据", "Inspect DNS evidence"), reason: t("查看已有解析证据，不将 IP 当作域名传递。", "Inspect available DNS evidence without treating an IP as a hostname."), type: "expand", section: "dns", target });
  }
  if (tlsFailed) actions.push({ id: "tls", type: "expand", section: "tls", target, label: t("查看证书详情", "Inspect certificate"), reason: t("核对实际返回的有效期、域名和证书链字段。", "Review the returned expiry, hostname and chain fields."), evidenceIds: ["tls"] });
  if (!dnsFailed && !tlsFailed && state !== "normal" && httpIds.length) actions.push({ id: "http", type: "expand", section: "http", target, label: t("查看 HTTP 证据", "Inspect HTTP evidence"), reason: conflict || restricted ? t("若你运营该站点，复核访问控制、WAF 和 Geo / ASN 策略。", "If you operate this site, review access, WAF and Geo/ASN policies.") : t("查看返回状态或错误；不要直接推断源站宕机。", "Review the response or error without assuming origin downtime."), evidenceIds: httpIds });
  if (state === "unknown" && !actions.length && observed.some(e => e.id === "dns")) actions.push({ id: "dns-evidence", type: "expand", section: "dns", target, label: t("查看 DNS 证据", "Inspect DNS evidence"), reason: t("已返回解析信息，其余检查仍未确认。", "DNS evidence is available; other checks remain unconfirmed."), evidenceIds: ["dns"] });
  if (httpCode && [520,521,522,523,524,525,526,530].includes(httpCode) && cloudflare) actions.push({ id: "cloudflare-guide", type: "navigate", destination: "documentation", target: null, label: t(`查看 ${httpCode} 排查指南`, `Read ${httpCode} Troubleshooting Guide`), reason: t("按实际返回的 Cloudflare 状态继续排查。", "Investigate the observed Cloudflare response."), href: `/errors/${httpCode}`, evidenceIds: ["http.remote"] });
  if (target) actions.push({ id: "retry", type: "retry", target, label: t("重新验证", "Verify again"), reason: t("对同一目标发起新的检查。", "Run a new check for this target."), evidenceIds: observed.map(e => e.id) });
  if (state === "normal" || conflict) actions.push({ id: "network", type: "navigate", destination: "current-network", target: null, label: t("检查当前网络", "Check current network"), reason: t("如果你仍无法访问，检查当前网络环境；不会继续检测此域名。", "If access still fails for you, inspect your current network environment; this does not continue checking the domain."), href: `/${lang}/tools/network-check`, evidenceIds: httpIds });
  return actions.slice(0, 3);
}
