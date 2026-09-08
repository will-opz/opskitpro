import { buildResultActions, type ResultAction } from "./result-actions";
export type { ResultAction } from "./result-actions";
import { assessHttpEvidence, type HttpEvidenceInput } from "@/lib/http-assessment";

export type RequestFailure = { target: string; kind: "dns" | "timeout" | "request"; message: string };
export type ResultState = "normal" | "abnormal" | "partial" | "unknown";
export type ResultEvidence = { id: string; location: "LOCAL" | "EDGE" | "REMOTE"; source: string; value: string; time?: string; timeScope: "observation" | "report"; freshness: "current" | "cached" | "stale" | "unknown"; state: "observed" | "missing" };
export type ResultExperience = { target: string; state: ResultState; title: string; summary: string; evidence: ResultEvidence[]; uncertainty: string[]; actions: ResultAction[]; freshness: ResultEvidence["freshness"]; raw: any };
const text = (zh: boolean, a: string, b: string) => zh ? a : b;
const validTime = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : undefined;

/** Website-only projection. Never rewrites API evidence or equates missing data with a fault. */
export function buildResultExperience(result: any, failure: RequestFailure | null, lang: "zh" | "en", now = Date.now()): ResultExperience {
  const zh = lang === "zh";
  const raw = result?.rawEvidence ?? result ?? {};
  const meta = result?.meta ?? raw.meta ?? {};
  const observations = result?.observations ?? raw.observations ?? {};
  const target = result?.domain || failure?.target || "";
  const freshnessOf = (time?: string, useCache = true): ResultEvidence["freshness"] => {
    const age = time ? Math.max(0, (now - Date.parse(time)) / 1000) : undefined;
    if ((age ?? 0) >= 600 || (useCache && (meta.cacheAgeSeconds ?? 0) >= 600)) return "stale";
    if (useCache && ["HIT", "BROWSER"].includes(meta.cacheStatus)) return "cached";
    return time ? "current" : "unknown";
  };
  const reportTime = validTime(meta.checkedAt);
  const evidence: ResultEvidence[] = [];
  const uncertainty: string[] = [];
  const add = (id: string, location: ResultEvidence["location"], source: string, value: string, missing = false, observedAt?: string) => {
    const ownTime = validTime(observedAt);
    const time = missing ? undefined : ownTime ?? reportTime;
    evidence.push({ id, location, source, value, time, timeScope: ownTime ? "observation" : "report", freshness: missing ? "unknown" : freshnessOf(time, location !== "LOCAL"), state: missing ? "missing" : "observed" });
  };
  const unavailable = text(zh, "未返回 / 无法判断", "Not returned / unknown");
  const dns = raw.dns;
  const addresses = [...new Set([...(dns?.all_ips ?? []), ...(dns?.records?.A ?? dns?.ipv4 ?? []), ...(dns?.records?.AAAA ?? dns?.ipv6 ?? [])].map((entry: any) => typeof entry === "string" ? entry : entry?.value).filter((entry: unknown) => typeof entry === "string" && entry.length > 0))];
  if (!addresses.length && dns?.resolved_ip && dns.resolved_ip !== target && !["Unknown", "---"].includes(dns.resolved_ip)) addresses.push(dns.resolved_ip);
  const dnsFailed = failure?.kind === "dns" || (dns?.success === false && !addresses.length);
  const dnsOk = addresses.length > 0 || dns?.success === true;
  add("dns", "REMOTE", "DNS Resolver", addresses.length ? addresses.slice(0, 3).join(" · ") : dnsFailed ? text(zh, "未解析到公网 A / AAAA 地址", "No public A / AAAA address returned") : dnsOk ? text(zh, "解析成功（未提供地址明细）", "Resolved; address details not supplied") : unavailable, !dnsFailed && !dnsOk);
  const http = assessHttpEvidence({ http: raw.http, observations } as HttpEvidenceInput);
  const describeHttp = (point: typeof http.probe, value: any) => point.code ? `HTTP ${point.code}` : value?.redirect_warning || value?.error || (value?.status === "timeout" ? "timeout" : point.state === "failed" ? text(zh, "未获得 HTTP 响应", "No HTTP response") : unavailable);
  add("http.remote", "REMOTE", "HTTP", describeHttp(http.probe, raw.http), http.probe.state === "unknown");
  if (observations.edge) add("http.edge", "EDGE", "HTTP", observations.edge.precision !== "full" ? text(zh, "有限观测，HTTP 状态未确认", "Limited observation; HTTP status unconfirmed") : describeHttp(http.edge, observations.edge), http.edge.state === "unknown", observations.edge.checkedAt);
  if (observations.browser) add("http.local", "LOCAL", "HTTP", observations.browser.precision !== "full" ? text(zh, "浏览器受限，HTTP 状态未确认", "Browser limited; HTTP status unconfirmed") : describeHttp(http.browser, observations.browser), http.browser.state === "unknown", observations.browser.checkedAt);
  const tls = raw.ssl;
  const certificateError = /CERT_|HOSTNAME_MISMATCH|UNTRUSTED|SELF_SIGNED|UNABLE_TO_VERIFY|CERTIFICATE/i.test(tls?.error_reason || "");
  const hasCertificate = Boolean(tls?.issuer && tls.issuer !== "Unknown" && tls.issuer !== "—") || Boolean(tls?.expiry && tls.expiry !== "Unknown");
  const tlsFailed = certificateError || (hasCertificate && [tls?.date_valid, tls?.hostname_valid, tls?.chain_authorized].some(v => v === false));
  const tlsOk = tls?.valid === true && !tlsFailed;
  const tlsNA = Boolean(result?.isActuallyIp || result?.isVisitor) && !tlsOk && !tlsFailed;
  add("tls", "REMOTE", "TLS", tlsFailed ? tls.error_reason || text(zh, "证书校验失败", "Certificate validation failed") : tlsOk ? text(zh, "证书校验通过", "Certificate valid") : tlsNA ? text(zh, "此 IP 检测未确认域名证书", "Domain certificate not assessed for this IP") : tls?.error_reason || unavailable, !tlsFailed && !tlsOk);
  const points = [http.probe, ...(observations.edge ? [http.edge] : []), ...(observations.browser ? [http.browser] : [])];
  const concrete = points.filter(p => p.state !== "unknown");
  const conflict = http.reachable && concrete.some(p => p.state !== "success");
  const differingCodes = new Set(concrete.flatMap(p => p.code ? [p.code] : [])).size > 1;
  const incomplete = points.some(p => p.state === "unknown") || !dnsOk || (!tlsOk && !tlsFailed && !tlsNA) || raw.status === "partial_error";
  let state: ResultState = "unknown";
  let summary = text(zh, "当前证据不足，无法判断目标是否可用。", "The available evidence cannot establish target availability.");
  if (conflict) { state = "partial"; summary = text(zh, "不同观察位置的 HTTP 结果不一致，不能据此认定网站整体宕机。", "HTTP observations conflict across locations; this does not establish a site-wide outage."); }
  else if (dnsFailed && http.reachable) { state = "partial"; summary = text(zh, "HTTP 可访问，但 DNS 未返回公网地址；结果存在矛盾。", "HTTP is reachable, but DNS returned no public address; evidence conflicts."); }
  else if (dnsFailed) { state = "abnormal"; summary = text(zh, "本次 DNS 未解析到可用的公网地址，后续可用性未确认。", "DNS returned no usable public address; subsequent availability is unconfirmed."); }
  else if (tlsFailed) { state = "abnormal"; summary = text(zh, "远程探针发现明确的证书校验异常，HTTP 成功也不代表证书正常。", "The remote probe found a certificate validation problem, regardless of HTTP success."); }
  else if (http.availability === "failed") { state = "abnormal"; summary = /timeout|timed out/i.test(raw.http?.redirect_warning || "")
    ? text(zh, "远程探针等待 HTTP 响应超时；尚不能判断其他网络是否可访问。", "The remote probe timed out waiting for HTTP; access from other networks is unconfirmed.")
    : text(zh, `观察点返回 ${http.probe.code ? `HTTP ${http.probe.code}` : "HTTP 异常"}；结论仅适用于这些观察位置。`, `The probe returned ${http.probe.code ? `HTTP ${http.probe.code}` : "an HTTP failure"}; this conclusion applies only to these observation points.`); }
  else if (http.availability === "partial") { state = "partial"; summary = text(zh, "探针访问受限，无法据此判断其他网络是否可用。", "Probe access is restricted; availability from other networks is unconfirmed."); }
  else if (http.reachable && incomplete) { state = "partial"; summary = text(zh, "已有 HTTP 可用证据，但部分检查未返回可判定结果。", "HTTP reachability was observed, but some checks remain unconfirmed."); }
  else if (http.reachable) { state = "normal"; summary = text(zh, "返回的 DNS、HTTP 与 TLS 证据正常；这不代表所有网络均可访问。", "Returned DNS, HTTP and TLS evidence is normal; this does not cover every network."); }
  if (failure && !result && failure.kind !== "dns") { state = "unknown"; summary = text(zh, "诊断请求未完成，尚未取得目标证据；这不等于网站故障。", "The diagnostic request did not complete. Missing target evidence is not a website failure."); }
  if (conflict || differingCodes) uncertainty.push(text(zh, "观察点返回不同结果；可能与访问控制、WAF、Geo / ASN 策略有关，当前数据不能确认具体原因。", "Responses differ by observation point. Access controls, WAF or Geo/ASN policies are possible causes, not established facts."));
  if (dnsFailed) uncertainty.push(text(zh, "当前数据不能区分 NXDOMAIN、解析器故障或公网地址限制。", "Current data cannot distinguish NXDOMAIN, resolver failure or public-address restrictions."));
  if (!observations.edge) uncertainty.push(text(zh, "未返回 EDGE 观察；未返回不代表该位置访问失败。", "No EDGE observation returned; absence does not mean failure there."));
  if (!observations.browser) uncertainty.push(text(zh, "未检测你所在网络的 HTTP 可用性；浏览器完整 HTTP 观测仅支持同源目标。", "Your network’s HTTP availability was not checked; full browser HTTP observation is same-origin only."));
  if (!tlsOk && !tlsFailed && !tlsNA) uncertainty.push(text(zh, "TLS 未取得可判定的证书证据；连接错误不等于证书无效。", "TLS has no conclusive certificate evidence; connection errors do not mean an invalid certificate."));
  if (!reportTime) uncertainty.push(text(zh, "服务端未提供报告时间，不能确认结果新鲜度。", "No report timestamp supplied; freshness is unconfirmed."));
  const freshness = freshnessOf(reportTime);
  if (freshness === "stale") uncertainty.unshift(text(zh, "结果已超过 10 分钟，仅供历史参考，请重新验证。", "Results are over 10 minutes old. Treat them as historical and verify again."));
  const actions = buildResultActions({target, lang, state, evidence, dnsFailed, tlsFailed, conflict, restricted:http.probe.state === "restricted", httpCode:http.probe.code, cloudflare:raw.cdn?.provider === "Cloudflare"});
  return { target, state, title: ({normal:text(zh,"正常","Normal"),abnormal:text(zh,"异常","Abnormal"),partial:text(zh,"部分可用","Partial availability"),unknown:text(zh,"无法判断","Unknown")})[state], summary, evidence, uncertainty, actions:actions.slice(0,3), freshness, raw };
}
