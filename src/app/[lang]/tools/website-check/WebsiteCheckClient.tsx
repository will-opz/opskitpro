"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Globe,
  Zap,
  Activity,
  AlertCircle,
  ShieldCheck,
  Server,
  Cloud,
  CheckCircle2,
  ArrowRight,
  ChevronDown,
  ShieldAlert,
  Search,
  Copy,
  Check,
  Monitor,
  Lock,
  Database,
  LayoutGrid,
  Download,
  Star,
  Terminal,
  Trash2,
  Link2,
  History,
} from "lucide-react";
import { TrackedLink } from "@/components/TrackedLink";

import { useDiagnosticHistory } from "./_hooks/useDiagnosticHistory";
import { useWebsiteCheck } from "./_hooks/useWebsiteCheck";
import {
  isBlockedHttpStatus,
  normalizeTargetInput,
} from "./_hooks/helpers";
import { buildWebsiteDiagnosticModel } from "@/lib/diagnostic-model";
import {
  buildWebsiteCheckMarkdown,
  buildWebsiteCheckPlainSummary,
  buildWebsiteCheckReport,
} from "./_lib/report";

export default function WebsiteCheckClient({
  dict,
  lang,
}: {
  dict: any;
  lang: "zh" | "en";
}) {
  const isAsianLanguage = lang !== "en";
  const searchParams = useSearchParams();
  const { history, upsertHistory, deleteHistory, togglePin } =
    useDiagnosticHistory();
  const {
    domain,
    setDomain,
    loading,
    currentStep,
    result,
    error,
    localResolvers,
    runDiagnostic,
  } = useWebsiteCheck();
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedAction, setCopiedAction] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const localeText = useMemo(() => {
    switch (lang) {
      case "zh":
        return {
          heroBadge: "网站诊断",
          heroTitles: {
            visitor: "连接环境检查",
            ip: "IP 诊断",
            site: "网站诊断",
          },
          heroSubtitle: "将 DNS · SSL · CDN · HTTP 一次看清。",
          heroModeLabel: "面向 SRE 的统一诊断",
          analyzing: "诊断中",
          errorTitle: "诊断错误",
          fault: {
            likelyCause: "可能原因 · 置信度低",
            evidence: "证据",
            nextAction: "参考建议",
            retry: "重新检测",
            copy: "复制故障摘要",
            dnsTitle: "DNS 解析异常",
            dnsCause: "NS 或 A/AAAA 记录可能未正确解析。",
            timeoutTitle: "连接超时",
            timeoutCause: "源站、防火墙或 CDN 链路中可能存在响应阻塞。",
            cloudflareTitle: "Cloudflare / 源站异常",
            cloudflareCause:
              "Cloudflare 可能无法访问源站，或 Origin DNS 配置异常。",
            sslTitle: "SSL / TLS 异常",
            sslCause: "证书、SNI、证书链或 TLS 配置可能存在问题。",
            genericTitle: "可达性异常",
            genericCause: "网络、源站或 HTTP 配置导致诊断失败。",
          },
          loading: {
            title: "诊断流程",
            headline: "进行中",
            desc: "正在整理目标，并行检查 DNS、HTTP、SSL 与 CDN。",
            progress: "进度",
            current: "当前阶段",
            stages: [
              {
                id: "normalize",
                title: "01 整理目标",
                desc: "正在规范域名或 URL。",
              },
              {
                id: "probe",
                title: "02 并行诊断",
                desc: "DNS、HTTP、SSL、CDN 同时检查。",
              },
              {
                id: "summarize",
                title: "03 汇总结果",
                desc: "提炼要点并整理成可读视图。",
              },
            ],
          },
          summaryVerdict: "判定",
          detailsHint: "仅在需要时展开详情",
          detailsOpen: "显示详情",
          detailsClose: "收起详情",
          geo: {
            step: "00",
            title: "地理确认",
            country: "国家 / 地区",
            city: "城市 / 节点",
            asn: "AS 编号",
            isp: "运营商",
          },
          whois: {
            step: "01",
            title: "WHOIS / 注册信息",
            diagException: "诊断异常",
            noInfo: "无信息",
            registrar: "注册商",
            registered: "注册日期",
            allocated: "分配日期",
            networkClass: "线路类型",
            expiry: "有效期限",
            status: "注册状态",
            lookupTarget: "注册域查询目标",
            rdapUnavailable: "暂时无法取得注册信息",
            rdapErrors: {
              invalid_target: "无法从该主机名识别可注册域。",
              not_found: "注册信息服务未找到该域名的记录。",
              timeout: "注册信息服务响应超时，请稍后重试。",
              upstream_error: "注册信息服务暂时返回错误。",
              network_error: "当前无法连接注册信息服务。",
              parse_error: "注册信息服务返回了无法解析的数据。",
            },
            privateIp: "私有 IPv4",
            publicIp: "公有 IPv4",
            assetTitle: "资产清单",
            assetCountSuffix: "项",
          },
          dns: {
            step: "02",
            title: "DNS 解析",
            resolved: "已解析 IP",
            latency: "响应时间",
            nameservers: "名称服务器",
            unknown: "未知",
            restricted: "受限",
            recordOverview: "DNS 记录全览",
            noRecords: "暂无记录",
            recordNotes: {
              A: "IPv4 访问入口。",
              AAAA: "IPv6 访问入口。",
              CNAME: "别名跳转，链路过长可能增加解析耗时。",
              MX: "邮件投递使用，不直接影响网站访问。",
              TXT: "常用于 SPF/DKIM 或站点所有权验证。",
              CAA: "限制哪些 CA 可以签发证书。",
              SOA: "DNS Zone 的权威信息。",
            },
          },
          http: {
            step: "03",
            title: "HTTP 响应",
            availability: "可达性",
            status: "状态码",
            protocol: "协议",
            responseTime: "响应速度",
            success: "正常",
            failure: "不可达",
            redirects: "重定向链",
            finalUrl: "最终 URL",
            noRedirects: "无重定向",
            redirectHint: "用于检查 HTTP 到 HTTPS、www 规范化与循环跳转。",
            redirectWarning: "注意",
          },
          security: {
            step: "04",
            title: "安全响应头",
            score: "响应头评分",
            passed: "已启用",
            missing: "缺失项",
            recommendation: "建议",
          },
          ssl: {
            step: "05",
            title: "SSL 安全",
            certStatus: "证书状态",
            expiry: "有效期限",
            grade: "SSL 安全评级",
            grading: "评级标准",
            hsts: "HSTS 启用",
            cipher: "加密套件",
            chain: "证书链",
            chainUnavailable: "无链信息",
          },
          cdn: {
            step: "06",
            title: "CDN",
            provider: "提供商基础设施",
            edge: "边缘转发",
            header: "服务器头",
            proxied: "经由",
            direct: "未知 · 未识别已知 CDN 特征",
          },
          advice: {
            title: "确认重点",
            subtitle: "按优先级整理当前最值得关注的项目。",
            itemLabel: "待处理项",
            noneTitle: "当前配置没有明显问题",
            noneDesc: "暂无需要立即处理的项目。",
            nextTitle: "下一步检查",
            ip: "查看 IP 详情",
            dns: "查看 DNS 记录",
            json: "原始诊断 JSON",
          },
          copy: {
            copied: "已复制",
            copy: "复制",
          },
          actions: {
            copySummary: "复制摘要",
            copyJson: "复制 JSON",
            copyMarkdown: "复制 Markdown",
            exportJson: "导出 JSON",
            exportMarkdown: "导出 Markdown",
            share: "分享链接",
            shareCopied: "链接已复制",
            favorite: "收藏",
            unfavorite: "取消收藏",
            history: "历史 / 收藏",
            noHistory: "暂无历史记录",
            remove: "删除",
          },
          report: {
            keyFindings: "需要关注",
            nextSteps: "下一步建议",
            technicalDetails: "技术详情",
            technicalDetailsHint: "观察点、通过项、探测耗时、缓存与导出",
            passedChecks: "已通过检查",
            informational: "参考信息",
            noAttention: "当前没有需要处理的问题。",
            attentionCount: (count: number) => `${count} 项需要处理`,
            ok: "正常",
            warning: "警告",
            error: "异常",
            noIssues: "未发现明显高优先级问题。",
            dnsOk: "DNS 已正常响应。",
            dnsBad: "DNS 解析失败，请检查 NS 与 A/AAAA 记录。",
            httpOk: "HTTP 可正常访问。",
            httpBad: "HTTP 可达性异常，请检查源站、防火墙或 CDN 配置。",
            sslOk: "SSL 证书有效。",
            sslBad: "SSL 证书或证书链存在问题。",
            headersOk: "关键安全响应头已启用。",
            headersBad: "存在缺失的安全响应头。",
            cdnOk: "检测到 CDN / Edge 分发。",
            cdnBad: "未识别已知 CDN 特征；这不代表站点一定未使用边缘分发。",
          },
          meta: {
            checkedAt: "检查时间",
            totalMs: "完整检测",
            coreMs: "核心探测",
            cacheAge: "缓存时间",
            edgeColo: "Edge",
            cache: "缓存",
          },
          emptyHint: "Global Edge Probe • DNS 诊断 • SSL 链路 • HTTP 头部分析",
        };
      default:
        return {
          heroBadge: "SRE Diagnostic Suite",
          heroTitles: {
            visitor: "Connection Check",
            ip: "IP Diagnostics",
            site: "Site Diagnostics",
          },
          heroSubtitle: "Instant DNS · SSL · CDN · HTTP forensics.",
          heroModeLabel: "Unified Diagnostics for SREs",
          analyzing: "ANALYZING",
          errorTitle: "SYSTEM_FAULT_DETECTED",
          fault: {
            likelyCause: "Possible Cause · Low Confidence",
            evidence: "Evidence",
            nextAction: "Guidance",
            retry: "Retry Check",
            copy: "Copy Fault Summary",
            dnsTitle: "DNS Resolution Fault",
            dnsCause: "NS or A/AAAA records may not be resolving correctly.",
            timeoutTitle: "Connection Timeout",
            timeoutCause:
              "The origin, firewall, or CDN path may be blocking the response.",
            cloudflareTitle: "Cloudflare / Origin Fault",
            cloudflareCause:
              "Cloudflare may not be able to reach the origin, or Origin DNS is misconfigured.",
            sslTitle: "SSL / TLS Fault",
            sslCause:
              "Certificate, SNI, chain, or TLS settings may be invalid.",
            genericTitle: "Reachability Fault",
            genericCause:
              "Network, origin, or HTTP configuration caused the diagnostic to fail.",
          },
          loading: {
            title: "Diagnostic Flow",
            headline: "In Progress",
            desc: "Normalizing the target and probing in parallel.",
            progress: "Progress",
            current: "Current Stage",
            stages: [
              {
                id: "normalize",
                title: "01 Normalizing Target",
                desc: "Cleaning the input and resolving the host.",
              },
              {
                id: "probe",
                title: "02 Parallel Probes",
                desc: "DNS, HTTP, SSL, and CDN checks run in parallel.",
              },
              {
                id: "summarize",
                title: "03 Result Assembly",
                desc: "We build a concise audit summary.",
              },
            ],
          },
          summaryVerdict: "Verdict",
          detailsHint: "Expand details when needed",
          detailsOpen: "Show Details",
          detailsClose: "Hide Details",
          geo: {
            step: "00",
            title: "Environment",
            country: "Country/Region",
            city: "City/Node",
            asn: "AS Number",
            isp: "ISP Service",
          },
          whois: {
            step: "01",
            title: "WHOIS Registry",
            diagException: "Diagnostic Exception",
            noInfo: "NO_INFO",
            registrar: "Registrar",
            registered: "Registered On",
            allocated: "Allocation date",
            networkClass: "Network Class",
            expiry: "Expires On",
            status: "Registry Status",
            lookupTarget: "Registration lookup target",
            rdapUnavailable: "Registration data is temporarily unavailable",
            rdapErrors: {
              invalid_target:
                "No registrable domain could be derived from this hostname.",
              not_found: "No registration record was found for this domain.",
              timeout: "The registration lookup timed out. Try again later.",
              upstream_error:
                "The registration service returned an upstream error.",
              network_error:
                "The registration service could not be reached.",
              parse_error:
                "The registration service returned unreadable data.",
            },
            privateIp: "PRIVATE_IPv4",
            publicIp: "PUBLIC_IPv4",
            assetTitle: "Digital Asset Census",
            assetCountSuffix: "FOUND",
          },
          dns: {
            step: "02",
            title: "DNS Resolution",
            resolved: "Resolved IP(s)",
            latency: "Lookup Latency",
            nameservers: "Nameservers",
            unknown: "Unknown",
            restricted: "CORS_RESTRICTED",
            recordOverview: "DNS Records",
            noRecords: "No records found",
            recordNotes: {
              A: "IPv4 entry points.",
              AAAA: "IPv6 entry points.",
              CNAME: "Alias chain. Long chains can add lookup latency.",
              MX: "Mail routing. It does not directly affect website reachability.",
              TXT: "Used for SPF/DKIM and ownership verification.",
              CAA: "Limits which CAs can issue certificates.",
              SOA: "Authority data for the DNS zone.",
            },
          },
          http: {
            step: "03",
            title: "Server Response",
            availability: "Availability",
            status: "Response Code",
            protocol: "Protocol",
            responseTime: "Response Time",
            success: "NOMINAL",
            failure: "UNREACHABLE",
            redirects: "Redirect Chain",
            finalUrl: "Final URL",
            noRedirects: "No redirects",
            redirectHint:
              "Checks HTTP to HTTPS, www normalization, and redirect loops.",
            redirectWarning: "Warning",
          },
          security: {
            step: "04",
            title: "Security Headers",
            score: "Header Score",
            passed: "Enabled",
            missing: "Missing",
            recommendation: "Recommendation",
          },
          ssl: {
            step: "05",
            title: "SSL Security",
            certStatus: "Cert Status",
            expiry: "Expiry Date",
            grade: "SSL Security Grade",
            grading: "Grading Algorithm:",
            hsts: "HSTS Enforcement",
            cipher: "Cipher Support",
            chain: "Trust Chain Audit",
            chainUnavailable: "Chain_Data_Unavailable",
          },
          cdn: {
            step: "06",
            title: "Edge CDN",
            provider: "Provider Infrastructure",
            edge: "Edge Routing",
            header: "Server Header",
            proxied: "PROXIED",
            direct: "UNKNOWN · NO KNOWN SIGNATURE",
          },
          advice: {
            title: "Recommendations",
            subtitle: "SRE mitigation strategies",
            itemLabel: "Critical Action Item",
            noneTitle: "Optimal Configuration Detected",
            noneDesc: "No immediate mitigation required.",
            nextTitle: "Next Checks",
            ip: "Review IP Details",
            dns: "Check DNS Records",
            json: "Raw Diagnostic JSON",
          },
          copy: {
            copied: "COPIED",
            copy: "COPY_AUDIT",
          },
          actions: {
            copySummary: "Copy Summary",
            copyJson: "Copy JSON",
            copyMarkdown: "Copy Markdown",
            exportJson: "Export JSON",
            exportMarkdown: "Export Markdown",
            share: "Share Link",
            shareCopied: "Link copied",
            favorite: "Pin",
            unfavorite: "Unpin",
            history: "History / Pins",
            noHistory: "No recent targets yet",
            remove: "Remove",
          },
          report: {
            keyFindings: "Needs Attention",
            nextSteps: "Next Steps",
            technicalDetails: "Technical Details",
            technicalDetailsHint:
              "Observation points, passed checks, probe timing, cache, and exports",
            passedChecks: "Passed Checks",
            informational: "Informational",
            noAttention: "Nothing needs action right now.",
            attentionCount: (count: number) =>
              `${count} ${count === 1 ? "item needs" : "items need"} attention`,
            ok: "OK",
            warning: "Warning",
            error: "Action Needed",
            noIssues: "No high-priority issues detected.",
            dnsOk: "DNS is responding.",
            dnsBad: "DNS resolution failed. Check NS and A/AAAA records.",
            httpOk: "HTTP is reachable.",
            httpBad:
              "HTTP reachability failed. Check origin, firewall, or CDN settings.",
            sslOk: "SSL certificate is valid.",
            sslBad: "SSL certificate or chain has a problem.",
            headersOk: "Core security headers are enabled.",
            headersBad: "Some security headers are missing.",
            cdnOk: "CDN / Edge delivery detected.",
            cdnBad:
              "No known CDN signature identified; this does not prove direct-origin delivery.",
          },
          meta: {
            checkedAt: "Checked At",
            totalMs: "Full Check",
            coreMs: "Core Probe",
            cacheAge: "Cache Age",
            edgeColo: "Edge",
            cache: "Cache",
          },
          emptyHint:
            "Global_Edge_Probe • DNS_Forensics • SSL_Chain • HTTP_Header_Analytics",
        };
    }
  }, [lang]);

  const loadingStages = useMemo(() => localeText.loading.stages, [localeText]);

  const activeLoadingStage = useMemo(() => {
    const index = Math.min(
      Math.max(currentStep - 1, 0),
      loadingStages.length - 1,
    );
    return loadingStages[index] ?? loadingStages[0];
  }, [currentStep, loadingStages]);

  const statusCopy = useMemo(
    () =>
      ({
        zh: {
          blocked: "连接可达，但 HTTP 被拒绝",
          browserReachableProbeBlocked: "网站可访问，服务端探测受限",
          edgeReachableProbeBlocked: "Cloudflare 边缘可达，Lightsail 探测受限",
          blockedAdvice:
            "目标拒绝了当前探测请求。若这是你的公网 IP，通常表示没有开放 Web 服务；若这是网站域名，请检查 Cloudflare WAF、Access、Bot Fight Mode、IP 访问规则或源站 Host/SNI 策略。",
          visitorSslNa: "公网 IP 检测不适用 SSL 证书评分。",
          visitorHeadersNa: "HTTP 被拒绝时无法完整评估安全响应头。",
        },

        en: {
          blocked: "Reachable, but HTTP is blocked",
          browserReachableProbeBlocked:
            "Site reachable, server probe restricted",
          edgeReachableProbeBlocked:
            "Cloudflare edge reachable, Lightsail probe restricted",
          blockedAdvice:
            "The target rejected this probe. For a public IP, this usually means no web service is exposed. For a domain, check Cloudflare WAF, Access, Bot Fight Mode, IP rules, or origin Host/SNI policy.",
          visitorSslNa:
            "SSL certificate grading is not applicable to a public IP check.",
          visitorHeadersNa:
            "Security headers cannot be fully graded while HTTP is blocked.",
        },
      })[lang],
    [lang],
  );

  const getResultState = useCallback(
    (data: any) => {
      const blocked =
        !data?.http?.success &&
        (data?.http?.classification === "probe_blocked" ||
          isBlockedHttpStatus(data?.http?.status_code));
      const browserReachable =
        data?.observations?.browser?.status === "reachable" &&
        data?.observations?.browser?.precision === "full";
      const edgeReachable =
        (data?.observations?.edge?.status === "reachable" ||
          data?.observations?.edge?.status === "redirected") &&
        data?.observations?.edge?.precision === "full";
      const corroboratedReachable = browserReachable || edgeReachable;
      const isIpOrVisitor = Boolean(data?.isVisitor || data?.isActuallyIp);
      const verdict = buildWebsiteDiagnosticModel(data).verdict;
      const healthy = verdict === "Healthy";
      const warning = verdict === "Degraded" || verdict === "Unknown";

      return {
        blocked,
        browserReachable,
        edgeReachable,
        corroboratedReachable,
        isIpOrVisitor,
        healthy,
        warning,
        verdict,
        tone: healthy ? "emerald" : warning ? "orange" : "red",
      };
    },
    [],
  );

  const summaryFacts = useMemo(() => {
    if (!result) return [];

    const state = getResultState(result);

    return [
      {
        label: localeText.summaryVerdict,
        value: state.verdict,
        tone: state.tone,
      },
      {
        label: localeText.dns.title,
        value: result.dns.latency,
        tone: "zinc",
      },
      {
        label: localeText.http.title,
        value: state.corroboratedReachable
          ? `${state.browserReachable ? result.observations.browser.httpStatus || "OK" : `Edge ${result.observations.edge.httpStatus || "OK"}`} / Probe ${result.http.status_code}`
          : `${result.http.status_code}`,
        tone: result.http.success || state.corroboratedReachable
          ? "emerald"
          : state.blocked
            ? "orange"
            : "red",
      },
      {
        label: localeText.ssl.title,
        value:
          state.isIpOrVisitor && !result.ssl.valid
            ? "N/A"
            : result.ssl.grade || "A",
        tone: result.ssl.valid
          ? "emerald"
          : state.isIpOrVisitor
            ? "zinc"
            : "red",
      },
      {
        label: localeText.security.title,
        value: state.blocked ? "N/A" : result.securityHeaders?.grade || "—",
        tone: state.blocked
          ? "zinc"
          : (result.securityHeaders?.score ?? 0) >= 75
            ? "emerald"
            : (result.securityHeaders?.score ?? 0) >= 55
              ? "orange"
              : "red",
      },
      {
        label: localeText.cdn.title,
        value: result.cdn.is_provider ? result.cdn.provider : "Unknown",
        tone: result.cdn.is_provider ? "emerald" : "zinc",
      },
    ];
  }, [getResultState, localeText, result]);

  // Tracks the last run query to avoid infinite loops in useEffect
  const lastProcessedQuery = React.useRef<string | undefined>(null as any);

  useEffect(() => {
    const q =
      searchParams.get("q") ||
      searchParams.get("domain") ||
      searchParams.get("target") ||
      undefined;
    const normalizedQuery = q ? normalizeTargetInput(q) : undefined;

    if (!normalizedQuery) {
      lastProcessedQuery.current = undefined;
      return;
    }

    // Check if we already processed this exact query
    if (normalizedQuery !== lastProcessedQuery.current) {
      lastProcessedQuery.current = normalizedQuery;
      setDomain(normalizedQuery);
      runDiagnostic(normalizedQuery);
    }
  }, [searchParams, runDiagnostic, setDomain]);

  const buildMarkdownReport = useCallback(() => {
    if (!result) return;
    return buildWebsiteCheckMarkdown(
      buildWebsiteCheckReport(result, { lang }),
      result,
    );
  }, [lang, result]);

  const buildFaultGuide = (message: string, data?: any) => {
    const normalized =
      `${message || ""} ${data?.http?.status_code || ""}`.toLowerCase();
    const faultCopy = localeText.fault;
    let title = faultCopy.genericTitle;
    let cause = faultCopy.genericCause;

    if (
      /nxdomain|enotfound|dns|name_not_resolved/.test(normalized) ||
      data?.dns?.success === false
    ) {
      title = faultCopy.dnsTitle;
      cause = faultCopy.dnsCause;
    } else if (
      /530|origin dns|cloudflare/.test(normalized) ||
      data?.http?.status_code === 530
    ) {
      title = faultCopy.cloudflareTitle;
      cause = faultCopy.cloudflareCause;
    } else if (/ssl|tls|cert|certificate|handshake/.test(normalized)) {
      title = faultCopy.sslTitle;
      cause = faultCopy.sslCause;
    } else if (
      /timeout|abort|aborted|timed out|fetch failed|network/.test(normalized)
    ) {
      title = faultCopy.timeoutTitle;
      cause = faultCopy.timeoutCause;
    }

    const evidence = [
      `Target: ${data?.domain || result?.domain || domain || "opskitpro.com"}`,
      `Error: ${message || data?.error || "Unknown error"}`,
      data?.dns?.latency ? `DNS latency: ${data.dns.latency}` : "",
      data?.dns?.resolved_ip ? `Resolved IP: ${data.dns.resolved_ip}` : "",
      data?.http?.status_code ? `HTTP status: ${data.http.status_code}` : "",
      data?.meta?.checkedAt ? `Checked at: ${data.meta.checkedAt}` : "",
    ].filter(Boolean);

    const nextAction = getAdvice(
      data || {
        http: { success: false, status_code: 0 },
        ssl: { valid: true, factors: [] },
        securityHeaders: { score: 100, checks: [] },
        cdn: { is_provider: true },
      },
    ).slice(0, 3);

    return { title, cause, evidence, nextAction };
  };

  const buildPlainSummary = useCallback(() => {
    if (!result) return "";
    return buildWebsiteCheckPlainSummary(
      buildWebsiteCheckReport(result, { lang }),
    );
  }, [lang, result]);

  const writeClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copiedByFallback = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copiedByFallback;
    }
  };

  const copyText = async (value: string, action: string = "default") => {
    await writeClipboard(value);
    setCopied(true);
    setCopiedAction(action);
    setTimeout(() => {
      setCopied(false);
      setCopiedAction(null);
    }, 2000);
  };

  const copyResult = () => {
    if (!result) return;
    const report = buildWebsiteCheckReport(result, { lang });
    copyText(JSON.stringify({ result, report }, null, 2), "json");
  };

  const copySummary = () => {
    const summary = buildPlainSummary();
    if (summary) copyText(summary, "summary");
  };

  const copyFaultSummary = () => {
    if (!error) return;
    const guide = buildFaultGuide(error, result);
    copyText(
      [
        `OpsKitPro Website Check Fault: ${result?.domain || domain || "opskitpro.com"}`,
        "",
        "Possible Cause (Confidence: Low):",
        guide.cause,
        "",
        "Evidence:",
        ...guide.evidence.map((item: string) => `- ${item}`),
        "",
        "Guidance:",
        ...guide.nextAction.map((item: string) => `- ${item}`),
      ].join("\n"),
      "fault",
    );
  };

  const downloadText = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const exportJson = () => {
    if (!result) return;
    const report = buildWebsiteCheckReport(result, { lang });
    downloadText(
      `opskitpro-${result.domain}.json`,
      JSON.stringify({ result, report }, null, 2),
      "application/json",
    );
  };

  const exportMarkdown = () => {
    const report = buildMarkdownReport();
    if (!result || !report) return;
    downloadText(`opskitpro-${result.domain}.md`, report, "text/markdown");
  };

  const copyShareLink = () => {
    const target = result?.domain || normalizeTargetInput(domain);
    if (!target) return;
    const url = new URL(window.location.href);
    url.searchParams.set("q", target);
    writeClipboard(url.toString()).then(() => {
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    });
  };

  const toggleFavorite = async (target: string) => {
    const current = history.find((entry) => entry.target === target);
    if (current) {
      await togglePin(current);
    } else {
      await upsertHistory(target, true);
    }
  };

  const removeHistory = async (target: string) => {
    await deleteHistory(target);
  };

  const getAdvice = (data: any) => {
    const advice = [];
    const copy = {
      zh: {
        http530: "Cloudflare 530：源站 DNS 出错，CDN 未能找到上游服务器 IP。",
        blocked: statusCopy.blockedAdvice,
        probeLimited:
          "用户浏览器已确认站点可访问。当前 403 仅表示 Lightsail 自动化探针受限，无需按站点宕机处理。",
        gateway: "网关超时：源站服务可能已停止，或响应失败。",
        connectivity: "可能存在连接故障。请检查防火墙与 80/443 端口。",
        sslExpired: "SSL 证书存在问题，当前会触发浏览器警告。",
        sslSoon: "证书可能即将到期，请在 15 天内安排更新。",
        hsts: "如果你运营该站点，请结合兼容性要求评估是否启用 Strict-Transport-Security。",
        csp: "如果你运营该站点，请结合应用脚本策略与兼容性要求评估 Content-Security-Policy。",
        securityHeaders:
          "如果你运营该站点，请根据安全与兼容性要求审查本次未观察到的响应头。",
        subdomains: "子域名数量偏多，建议排查是否存在遗留的测试或临时环境。",
        ok: "目前没有明显问题，可用性、性能与安全性表现良好。",
      },

      en: {
        http530:
          "Cloudflare 530: Origin DNS error. The CDN cannot find your upstream IP.",
        blocked: statusCopy.blockedAdvice,
        probeLimited:
          "Your browser confirmed the site is reachable. This 403 only limits the Lightsail probe and should not be treated as downtime.",
        gateway:
          "Gateway timeout: The origin service may be down or failing to respond.",
        connectivity:
          "Connectivity fault: Check your firewall and ports 80/443.",
        sslExpired:
          "SSL certificate problem: browser warnings are likely right now.",
        sslSoon: "Certificate expiring soon. Plan a renewal within 15 days.",
        hsts: "If you operate this site, evaluate Strict-Transport-Security against your HTTPS and compatibility requirements.",
        csp: "If you operate this site, evaluate Content-Security-Policy against the application's script and compatibility requirements.",
        securityHeaders:
          "If you operate this site, review the unobserved headers against its security and compatibility requirements.",
        subdomains:
          "A high subdomain count can hide forgotten staging or test environments.",
        ok: "No major issues detected. Availability, performance, and security look healthy.",
      },
    }[lang];

    const state = getResultState(data);

    if (!data.http.success) {
      if (state.browserReachable && state.blocked) {
        advice.push(copy.probeLimited);
      } else if (isBlockedHttpStatus(data.http.status_code)) {
        advice.push(copy.blocked);
      } else if (data.http.status_code === 530) {
        advice.push(copy.http530);
      } else if (
        data.http.status_code === 502 ||
        data.http.status_code === 504
      ) {
        advice.push(copy.gateway);
      } else {
        advice.push(copy.connectivity);
      }
    }

    const isExpired =
      data.ssl?.expiry && new Date(data.ssl.expiry) < new Date();
    if (!state.isIpOrVisitor && (isExpired || !data.ssl.valid)) {
      advice.push(copy.sslExpired);
    } else if (data.ssl.grade === "C") {
      advice.push(copy.sslSoon);
    }

    if (data.ssl.valid && !data.ssl.factors?.includes("HSTS_ENABLED")) {
      advice.push(copy.hsts);
    }

    const missingHeaders =
      data.securityHeaders?.checks?.filter((check: any) => !check.present) ||
      [];
    if (state.blocked) {
      advice.push(statusCopy.visitorHeadersNa);
    } else if (
      missingHeaders.some(
        (check: any) => check.key === "content-security-policy",
      )
    ) {
      advice.push(copy.csp);
    } else if ((data.securityHeaders?.score ?? 100) < 75) {
      advice.push(copy.securityHeaders);
    }

    if (data.subdomains && data.subdomains.length > 20) {
      advice.push(copy.subdomains);
    }

    if (advice.length === 0) {
      advice.push(copy.ok);
    }

    return advice;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeTargetInput(domain);
    if (!normalized) return;
    setDomain(normalized);
    runDiagnostic(normalized);
  };

  const detectCloudflareErrorMatch = (data: any) => {
    if (!data?.http) return null;
    const status = data.http.status_code;
    const cfRay = data.http.cf_ray;
    const isCfCdn =
      data.cdn?.provider === "Cloudflare" ||
      String(data.cdn?.server || "")
        .toLowerCase()
        .includes("cloudflare");
    const pageTitle = data.http.page_title?.toLowerCase() || "";

    let code: string | null = null;

    if (
      status >= 520 &&
      status <= 530 &&
      (cfRay || isCfCdn || pageTitle.includes("cloudflare"))
    ) {
      code = String(status);
    } else if (status === 403 && (cfRay || isCfCdn)) {
      if (pageTitle.includes("access denied") || pageTitle.includes("1020"))
        code = "1020";
      if (pageTitle.includes("1006")) code = "1006";
    } else if (status === 429 && (cfRay || isCfCdn)) {
      if (pageTitle.includes("rate limit") || pageTitle.includes("1015"))
        code = "1015";
    }

    if (!code && pageTitle) {
      if (pageTitle.includes("error 522")) code = "522";
      else if (pageTitle.includes("error 520")) code = "520";
      else if (pageTitle.includes("error 521")) code = "521";
      else if (pageTitle.includes("error 523")) code = "523";
      else if (pageTitle.includes("error 524")) code = "524";
      else if (pageTitle.includes("error 525")) code = "525";
      else if (pageTitle.includes("error 526")) code = "526";
      else if (pageTitle.includes("error 1020")) code = "1020";
      else if (pageTitle.includes("error 1015")) code = "1015";
      else if (pageTitle.includes("error 1006")) code = "1006";
    }
    return code;
  };

  const adviceList = result ? getAdvice(result) : [];
  const diagnosticReport = useMemo(
    () => (result ? buildWebsiteCheckReport(result, { lang }) : null),
    [lang, result],
  );
  const diagnosticFindings = useMemo(
    () => diagnosticReport?.findings || [],
    [diagnosticReport],
  );
  const prioritizedFindings = useMemo(
    () =>
      [...diagnosticFindings].sort((left, right) => {
        const priority = { critical: 0, warning: 1, info: 2, success: 3 };
        return priority[left.severity] - priority[right.severity];
      }),
    [diagnosticFindings],
  );
  const attentionFindings = useMemo(
    () =>
      prioritizedFindings.filter(
        (finding) =>
          finding.severity === "critical" || finding.severity === "warning",
      ),
    [prioritizedFindings],
  );
  const informationalFindings = useMemo(
    () =>
      prioritizedFindings.filter((finding) => finding.severity === "info"),
    [prioritizedFindings],
  );
  const passedFindings = useMemo(
    () =>
      prioritizedFindings.filter((finding) => finding.severity === "success"),
    [prioritizedFindings],
  );
  const faultGuide = error ? buildFaultGuide(error, result) : null;
  const displayedTarget = result?.domain || domain || "opskitpro.com";
  const resultState = result ? getResultState(result) : null;

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-5 sm:mt-7 mb-24 sm:mb-28 z-20 relative font-sans">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-emerald-500/6 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      {/* Hero Header */}
      <div className="text-center mb-9 sm:mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/70 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.18em] mb-4 shadow-sm backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {localeText.heroBadge}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 mb-3 justify-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-zinc-900 tracking-tighter break-words">
            {result?.isVisitor
              ? localeText.heroTitles.visitor
              : result?.isActuallyIp
                ? localeText.heroTitles.ip
                : localeText.heroTitles.site}
          </h1>
          <Link
            href={`/${lang}/tools/api`}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-white/65 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-600 text-[10px] font-semibold tracking-wide transition-colors border border-zinc-200/80 hover:border-emerald-500/20 w-max mx-auto sm:mx-0"
          >
            <Terminal className="w-3.5 h-3.5" />
            JSON API Available
          </Link>
        </div>
        <p className="max-w-2xl mx-auto mb-3 leading-relaxed text-zinc-600 text-sm sm:text-base font-medium tracking-normal">
          {localeText.heroSubtitle}
        </p>
        <div className="mb-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
          <span>
            {localeText.heroModeLabel}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:inline" />
          <span className="hidden sm:inline">
            {localeText.emptyHint}
          </span>
        </div>

        {/* Input Bar */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex flex-col sm:flex-row sm:items-center bg-white/95 border border-zinc-100 p-3 sm:p-2 rounded-[1.35rem] shadow-xl shadow-zinc-200/70 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all gap-3 sm:gap-0">
              <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-zinc-400 self-start sm:self-auto">
                <Globe className="w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
              </div>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const normalized = normalizeTargetInput(domain);
                    if (!normalized) return;
                    setDomain(normalized);
                    runDiagnostic(normalized);
                  }
                }}
                placeholder={dict.home.diagnostics_placeholder}
                className="min-w-0 w-full flex-grow bg-transparent border-none outline-none text-zinc-900 text-base sm:text-lg px-1 sm:px-2 py-1.5 sm:py-0"
              />
              <button
                type="button"
                onClick={() => {
                  const normalized = normalizeTargetInput(domain);
                  if (!normalized) return;
                  setDomain(normalized);
                  runDiagnostic(normalized, true);
                }}
                disabled={loading || !normalizeTargetInput(domain)}
                className="shrink-0 w-full sm:w-auto justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 sm:px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50"
              >
                {loading ? (
                  <Activity className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current" />
                )}
                <span className="whitespace-nowrap text-sm sm:text-base">
                  {loading ? localeText.analyzing : dict.home.diagnostics_btn}
                </span>
              </button>
            </div>
          </form>
          <div className="mt-4 rounded-3xl border border-zinc-100 bg-white/75 p-3 shadow-sm backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                <History className="h-3.5 w-3.5 text-emerald-500" />
                {localeText.actions.history}
              </div>
              {history.length === 0 && (
                <span className="text-[10px] font-medium text-zinc-400">
                  {localeText.actions.noHistory}
                </span>
              )}
            </div>
            {history.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {history.map((entry) => (
                  <div
                    key={entry.target}
                    className="flex shrink-0 items-center overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setDomain(entry.target);
                        runDiagnostic(entry.target);
                      }}
                      className="max-w-[180px] truncate px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:text-emerald-600"
                    >
                      {entry.target}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(entry.target)}
                      className={`border-l border-zinc-100 px-2 py-2 ${entry.pinned ? "text-amber-500" : "text-zinc-300 hover:text-amber-500"}`}
                      aria-label={
                        entry.pinned
                          ? localeText.actions.unfavorite
                          : localeText.actions.favorite
                      }
                    >
                      <Star
                        className={`h-3.5 w-3.5 ${entry.pinned ? "fill-current" : ""}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHistory(entry.target)}
                      className="border-l border-zinc-100 px-2 py-2 text-zinc-300 hover:text-red-500"
                      aria-label={localeText.actions.remove}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="max-w-3xl mx-auto rounded-3xl border border-emerald-100 bg-white/90 shadow-sm p-5 sm:p-6 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">
                {localeText.loading.title}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-zinc-900 tracking-[-0.01em]">
                {localeText.loading.headline}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 tracking-normal">
                {localeText.loading.desc}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-[10px] font-semibold text-zinc-400 tracking-[0.24em]">
                {localeText.loading.progress}
              </div>
              <div className="mt-2 text-lg font-semibold text-zinc-900 tabular-nums">
                {currentStep}/3
              </div>
              <div className="mt-1 text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">
                {activeLoadingStage.title}
              </div>
            </div>
          </div>

          <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${Math.min((currentStep / 3) * 100, 100)}%` }}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">
                  {localeText.loading.current}
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {activeLoadingStage.title}
                </div>
                <p className="mt-1 text-sm text-zinc-600">
                  {activeLoadingStage.desc}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && faultGuide && (
        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-red-100 bg-red-50/80 p-6 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-4 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500 shadow-sm">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-red-400">
                    {localeText.errorTitle}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight text-red-700">
                    {faultGuide.title}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      runDiagnostic(result?.domain || domain, true)
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-[10px] font-semibold tracking-[0.14em] text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    {localeText.fault.retry}
                  </button>
                  <button
                    onClick={copyFaultSummary}
                    className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-[10px] font-semibold tracking-[0.14em] text-red-600 transition-colors hover:bg-red-50"
                  >
                    {copiedAction === "fault" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copiedAction === "fault"
                      ? localeText.copy.copied
                      : localeText.fault.copy}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[0.9fr,1.1fr]">
                <div className="rounded-2xl border border-red-100 bg-white/80 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-red-400">
                    {localeText.fault.likelyCause}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-800">
                    {faultGuide.cause}
                  </p>
                </div>
                <div className="rounded-2xl border border-red-100 bg-white/80 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-red-400">
                    {localeText.fault.evidence}
                  </p>
                  <div className="mt-2 space-y-1.5">
                    {faultGuide.evidence.map((item: string, index: number) => (
                      <p
                        key={`${item}-${index}`}
                        className="break-all text-xs leading-5 text-zinc-700"
                      >
                        - {item}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl border border-red-100 bg-white/80 p-4">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-red-400">
                  {localeText.fault.nextAction}
                </p>
                <div className="mt-2 space-y-2">
                  {faultGuide.nextAction.map(
                    (item: string, index: number) => (
                    <p
                      key={`${item}-${index}`}
                      className="text-xs leading-5 text-zinc-700"
                    >
                      - {item}
                    </p>
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Presentation */}
      {result && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Cloudflare Error Banner */}
          {(() => {
            const cfErrorMatch = detectCloudflareErrorMatch(result);
            if (!cfErrorMatch) return null;
            return (
              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-800">
                      Cloudflare Error {cfErrorMatch} Detected
                    </h3>
                    <p className="text-xs font-medium text-red-600/80 mt-0.5">
                      We found a matching troubleshooting guide in our knowledge
                      base.
                    </p>
                  </div>
                </div>
                <Link
                  href={`/errors/${cfErrorMatch}`}
                  className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm"
                >
                  Read {cfErrorMatch} Troubleshooting Guide
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })()}

          {/* DNS Security Banner */}
          {(() => {
            const records = result.dns?.records || {};
            const hasDnsSecurityRecords =
              (records.MX && records.MX.length > 0) ||
              (records.TXT && records.TXT.length > 0);
            if (!hasDnsSecurityRecords) return null;
            return (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-800">
                      Email & DNS Security Validation Available
                    </h3>
                    <p className="text-xs font-medium text-emerald-600/80 mt-0.5">
                      We detected MX/TXT records. Audit your SPF, DMARC, and CAA
                      configurations.
                    </p>
                  </div>
                </div>
                <TrackedLink
                  eventName="website_check_to_dns_audit"
                  targetName={result.target}
                  href={`/tools/dns-lookup?tab=security&domain=${encodeURIComponent(result.target)}`}
                  className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm"
                >
                  Run Security Audit
                  <ArrowRight className="h-4 w-4" />
                </TrackedLink>
              </div>
            );
          })()}

          {/* Cloudflare CDN Banner */}
          {(() => {
            const isCfCdn =
              result.cdn?.provider === "Cloudflare" ||
              String(result.cdn?.server || "")
                .toLowerCase()
                .includes("cloudflare") ||
              !!result.meta?.cfRay;
            if (!isCfCdn) return null;
            return (
              <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-sky-800">
                      Cloudflare Edge Detected
                    </h3>
                    <p className="text-xs font-medium text-sky-600/80 mt-0.5">
                      This domain is routed through Cloudflare's global network.
                    </p>
                  </div>
                </div>
                <TrackedLink
                  eventName="website_check_to_trace"
                  targetName={result.target}
                  href={`/tools/cloudflare-trace`}
                  className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm"
                >
                  Analyze Cloudflare Trace
                  <ArrowRight className="h-4 w-4" />
                </TrackedLink>
              </div>
            );
          })()}

          {/* Overall Status Bar */}
          <div
            className={`mb-6 p-4 sm:p-7 rounded-[2rem] border shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-5 relative overflow-hidden ${
              resultState?.healthy
                ? "bg-white/90 border-emerald-100/80"
                : resultState?.warning
                  ? "bg-orange-50 border-orange-100"
                  : "bg-red-50 border-red-100"
            }`}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
            <div className="flex items-center gap-5 z-10 w-full min-w-0">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${
                  resultState?.healthy
                    ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                    : resultState?.warning
                      ? "border-orange-100 bg-orange-50 text-orange-600"
                      : "border-red-100 bg-red-50 text-red-600"
                }`}
              >
                {resultState?.healthy ? (
                  <CheckCircle2 className="h-8 w-8" />
                ) : (
                  <ShieldAlert className="h-8 w-8" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-[10px] font-semibold text-zinc-400 mb-1 tracking-[0.18em]">
                  {lang === "zh" ? "可用性结论" : "AVAILABILITY VERDICT"}
                </h2>
                <h1
                  className={`text-2xl sm:text-3xl font-semibold tracking-[-0.02em] ${
                    resultState?.healthy
                      ? "text-zinc-900"
                      : resultState?.warning
                        ? "text-orange-600"
                        : "text-red-600"
                  }`}
                >
                  {resultState?.verdict}
                </h1>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-600 sm:text-sm">
                  {diagnosticReport?.impact}
                  {diagnosticReport?.inferences[0]
                    ? ` ${lang === "zh" ? "可能原因" : "Possible cause"} (${diagnosticReport.inferences[0].confidence}): ${diagnosticReport.inferences[0].summary}`
                    : ""}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {attentionFindings.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-orange-700">
                      <AlertCircle className="h-3 w-3" />
                      {localeText.report.attentionCount(
                        attentionFindings.length,
                      )}
                    </span>
                  )}
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                    <Monitor className="h-3 w-3 shrink-0 text-zinc-400" />
                    <span className="truncate">{displayedTarget}</span>
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] ${
                      result.http.success || resultState?.corroboratedReachable
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : resultState?.blocked
                          ? "border-orange-100 bg-orange-50 text-orange-600"
                          : "border-red-100 bg-red-50 text-red-600"
                    }`}
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {resultState?.corroboratedReachable
                      ? `${resultState.browserReachable ? result.observations.browser.httpStatus || "OK" : `Edge ${result.observations.edge.httpStatus || "OK"}`} / Probe ${result.http.status_code}`
                      : result.http.status_code || "ERR"}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative z-10 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap lg:justify-end">
              <button
                onClick={copySummary}
                className="flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-semibold tracking-[0.16em] text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900"
              >
                {copiedAction === "summary" ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                {copiedAction === "summary"
                  ? localeText.copy.copied
                  : localeText.actions.copySummary}
              </button>
              <button
                onClick={copyShareLink}
                className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/90 px-4 py-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                {shareCopied ? (
                  <Check className="h-3 w-3 text-emerald-500" />
                ) : (
                  <Link2 className="h-3 w-3" />
                )}
                {shareCopied
                  ? localeText.actions.shareCopied
                  : localeText.actions.share}
              </button>
              <button
                onClick={() => toggleFavorite(result.domain)}
                className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[10px] font-semibold tracking-[0.16em] transition-colors ${
                  history.find((entry) => entry.target === result.domain)
                    ?.pinned
                    ? "border-amber-200 bg-amber-50 text-amber-600"
                    : "border-zinc-200 bg-zinc-50/90 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                }`}
              >
                <Star
                  className={`h-3 w-3 ${history.find((entry) => entry.target === result.domain)?.pinned ? "fill-current" : ""}`}
                />
                {history.find((entry) => entry.target === result.domain)?.pinned
                  ? localeText.actions.unfavorite
                  : localeText.actions.favorite}
              </button>
            </div>
          </div>

          <section
            className="rounded-[2rem] border border-zinc-100 bg-white/90 p-5 shadow-sm sm:p-6"
            data-testid="attention-findings"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                  {localeText.report.keyFindings}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                  {attentionFindings.length > 0
                    ? localeText.report.attentionCount(
                        attentionFindings.length,
                      )
                    : localeText.report.noAttention}
                </h3>
              </div>
              {attentionFindings.length > 0 && (
                <span className="inline-flex w-fit rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-[10px] font-semibold text-orange-700">
                  {localeText.report.warning}
                </span>
              )}
            </div>

            {attentionFindings.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
                {attentionFindings.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 ${
                      item.severity === "critical"
                        ? "border-red-100 bg-red-50/60"
                        : "border-orange-100 bg-orange-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          item.severity === "critical"
                            ? "text-red-500"
                            : "text-orange-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-zinc-900">
                          {item.title}
                        </h4>
                        <p className="mt-1 text-xs leading-5 text-zinc-700">
                          {lang === "zh" && item.id === "headers.missing"
                            ? `缺少或配置较弱的响应头：${result.securityHeaders?.checks
                                ?.filter((check: any) => !check.present)
                                .map((check: any) => check.label)
                                .join("、") || "未知"}。`
                            : item.description}
                        </p>
                        {item.likelyCause && (
                          <div className="mt-3 border-t border-black/5 pt-3">
                            <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400">
                              {lang === "zh" ? "可能原因" : "Possible cause"}
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-600">
                              {item.likelyCause}
                            </p>
                          </div>
                        )}
                        <div className="mt-3 border-t border-black/5 pt-3">
                          <p className="text-[10px] font-semibold tracking-[0.12em] text-zinc-400">
                            {lang === "zh" ? "建议" : "Guidance"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-zinc-700">
                            {lang === "zh" && item.id === "headers.missing"
                              ? "如果你运营该站点，请结合应用的安全策略与兼容性要求评估这些响应头。"
                              : item.recommendedFix}
                          </p>
                          {item.verificationSteps.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {item.verificationSteps
                                .slice(0, 2)
                                .map((step: string) => (
                                  <li
                                    key={step}
                                    className="text-xs leading-5 text-zinc-600"
                                  >
                                    · {step}
                                  </li>
                                ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {diagnosticReport?.impact}
              </div>
            )}

            {informationalFindings.length > 0 && (
              <div className="mt-5 border-t border-zinc-100 pt-4">
                <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                  {localeText.report.informational}
                </p>
                <div className="mt-2 space-y-2">
                  {informationalFindings.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-zinc-100 bg-zinc-50/70 px-4 py-3"
                    >
                      <p className="text-xs font-semibold text-zinc-700">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-600">
                        {lang === "zh" && item.id === "cdn.not-detected"
                          ? "未识别到已知 CDN 特征；这不能证明网站直接连接源站。"
                          : item.description}
                      </p>
                      {item.recommendedFix && (
                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                          {lang === "zh" && item.id === "cdn.not-detected"
                            ? "如果你运营该站点且预期使用 CDN，请核对 DNS 与边缘代理配置。"
                            : item.recommendedFix}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <div className="flex flex-col gap-3 rounded-3xl border border-zinc-100 bg-white/75 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold text-zinc-800">
                {localeText.report.technicalDetails}
              </p>
              <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                {localeText.report.technicalDetailsHint}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              aria-expanded={showDetails}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-[10px] font-semibold text-zinc-700 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-700"
            >
              <ChevronDown
                className={`h-3 w-3 transition-transform ${showDetails ? "rotate-180" : ""}`}
              />
              {showDetails ? localeText.detailsClose : localeText.detailsOpen}
            </button>
          </div>

          {showDetails && (
            <div className="space-y-5" data-testid="technical-summary">
          {passedFindings.length > 0 && (
            <section className="rounded-2xl border border-emerald-100 bg-emerald-50/40 px-4 py-3">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-emerald-700">
                {localeText.report.passedChecks}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {passedFindings.map((finding) => (
                  <span
                    key={finding.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {finding.title}
                  </span>
                ))}
              </div>
            </section>
          )}
          <section className="mb-5 rounded-[2rem] border border-zinc-100 bg-white/90 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                  {lang === "zh" ? "多观测点复核" : "MULTI-VANTAGE VERIFICATION"}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-zinc-900">
                  {lang === "zh"
                    ? "分别验证用户、边缘和独立探针看到的结果"
                    : "Compare what the user, edge, and independent probe can reach"}
                </h3>
              </div>
              <span className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold text-zinc-500 sm:inline-flex">
                {lang === "zh" ? "避免单点误报" : "False-positive resistant"}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                {
                  key: "browser",
                  label: lang === "zh" ? "你的浏览器" : "Your Browser",
                  meta: lang === "zh" ? "真实用户视角" : "Real-user view",
                  reachable: resultState?.browserReachable,
                  status: result.observations?.browser?.httpStatus,
                  detail: result.observations?.browser?.status,
                  icon: Monitor,
                },
                {
                  key: "edge",
                  label: "Cloudflare Edge",
                  meta: result.observations?.edge?.colo || (lang === "zh" ? "边缘视角" : "Edge view"),
                  reachable: resultState?.edgeReachable,
                  status: result.observations?.edge?.httpStatus,
                  detail: result.observations?.edge?.status,
                  icon: Cloud,
                },
                {
                  key: "probe",
                  label: "OpsKitPro Probe",
                  meta: "AWS Lightsail",
                  reachable: result.http.success,
                  status: result.http.status_code,
                  detail: result.http.classification,
                  icon: Server,
                },
              ].map((observation) => {
                const ObservationIcon = observation.icon;
                const restricted =
                  observation.key === "probe" && resultState?.blocked;
                return (
                  <div
                    key={observation.key}
                    className={`rounded-2xl border px-4 py-4 ${
                      observation.reachable
                        ? "border-emerald-100 bg-emerald-50/40"
                        : restricted
                          ? "border-orange-100 bg-orange-50/50"
                          : "border-zinc-200 bg-zinc-50/70"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white bg-white text-zinc-500 shadow-sm">
                          <ObservationIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-zinc-900">
                            {observation.label}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-zinc-500">
                            {observation.meta}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          observation.reachable
                            ? "bg-emerald-100 text-emerald-700"
                            : restricted
                              ? "bg-orange-100 text-orange-700"
                              : "bg-zinc-200 text-zinc-600"
                        }`}
                      >
                        {observation.status || "—"}
                      </span>
                    </div>
                    <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                      {restricted
                        ? lang === "zh"
                          ? "探针受限，不代表网站宕机"
                          : "Probe restricted, not downtime"
                        : observation.reachable
                          ? lang === "zh"
                            ? "可访问"
                            : "Reachable"
                          : observation.detail || (lang === "zh" ? "未确认" : "Unconfirmed")}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            {summaryFacts.slice(1).map((fact) => (
              <div
                key={fact.label}
                className="rounded-2xl border border-zinc-100 bg-white/85 backdrop-blur-md px-4 py-3 shadow-sm"
              >
                <div className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                  {fact.label}
                </div>
                <div
                  className={`mt-2 truncate text-sm font-semibold ${
                    fact.tone === "emerald"
                      ? "text-emerald-600"
                      : fact.tone === "orange"
                        ? "text-orange-500"
                        : fact.tone === "red"
                          ? "text-red-500"
                          : "text-zinc-900"
                  }`}
                >
                  {fact.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
            {[
              {
                label: localeText.meta.coreMs,
                value: result.meta?.coreMs ? `${result.meta.coreMs}ms` : "---",
              },
              {
                label: localeText.meta.totalMs,
                value: result.meta?.totalMs
                  ? `${result.meta.totalMs}ms`
                  : "---",
              },
              {
                label: localeText.meta.cacheAge,
                value:
                  result.meta?.cacheStatus === "HIT"
                    ? `${result.meta.cacheAgeSeconds || 0}s`
                    : "Live",
              },
              {
                label: localeText.meta.edgeColo,
                value: result.meta?.edgeColo || "Unknown",
              },
              {
                label: localeText.meta.cache,
                value: result.meta?.cacheStatus || "MISS",
              },
              {
                label: localeText.meta.checkedAt,
                value: result.meta?.checkedAt
                  ? new Date(result.meta.checkedAt).toLocaleString()
                  : "---",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-zinc-100 bg-white/80 px-4 py-3 shadow-sm"
              >
                <div className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                  {item.label}
                </div>
                <div className="mt-2 truncate text-xs font-semibold text-zinc-800">
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              onClick={exportMarkdown}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-700"
            >
              <Download className="h-4 w-4" />
              {localeText.actions.exportMarkdown}
            </button>
            <button
              onClick={exportJson}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-700"
            >
              <Download className="h-4 w-4" />
              {localeText.actions.exportJson}
            </button>
          </div>
            </div>
          )}

          {diagnosticReport && false && (
          <div className="hidden">
            <section className="rounded-[2rem] border border-zinc-100 bg-white/90 p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                    {localeText.report.keyFindings}
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-zinc-900">
                    {displayedTarget}
                  </h3>
                  {diagnosticReport && (
                    <p className="mt-2 max-w-2xl text-xs leading-5 text-zinc-600">
                      {diagnosticReport?.summary}
                    </p>
                  )}
                </div>
                <div
                  className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] ${
                    diagnosticFindings.some(
                      (item: any) => item.status === "error",
                    )
                      ? "border-red-100 bg-red-50 text-red-600"
                      : diagnosticFindings.some(
                            (item: any) => item.status === "warning",
                          )
                        ? "border-orange-100 bg-orange-50 text-orange-600"
                        : "border-emerald-100 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {diagnosticFindings.some(
                    (item: any) => item.status === "error",
                  )
                    ? localeText.report.error
                    : diagnosticFindings.some(
                          (item: any) => item.status === "warning",
                        )
                      ? localeText.report.warning
                      : localeText.report.ok}
                </div>
              </div>
              <div className="mb-4 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                  EXECUTIVE SUMMARY
                </p>
                <p className="mt-2 text-sm font-semibold text-zinc-900">
                  {diagnosticReport?.impact}
                </p>
                {diagnosticReport?.inferences[0] && (
                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    {lang === "zh" ? "可能原因" : "Possible cause"} · {diagnosticReport?.inferences[0].confidence}: {diagnosticReport?.inferences[0].summary}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {prioritizedFindings.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border px-4 py-3 ${
                      item.status === "ok"
                        ? "border-emerald-100 bg-emerald-50/40"
                        : item.status === "warning"
                          ? "border-orange-100 bg-orange-50/50"
                          : "border-red-100 bg-red-50/60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                          item.status === "ok"
                            ? "bg-emerald-500"
                            : item.status === "warning"
                              ? "bg-orange-400"
                              : "bg-red-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-xs font-semibold ${
                            item.status === "ok"
                              ? "text-emerald-700"
                              : item.status === "warning"
                                ? "text-orange-700"
                                : "text-red-700"
                          }`}
                        >
                          {item.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-zinc-600">
                          {item.description}
                        </p>
                        <div className="mt-3 space-y-2 border-t border-white/80 pt-3">
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                              CAUSE
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-600">
                              {item.likelyCause}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                              FIX
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-600">
                              {item.recommendedFix}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                              VERIFY
                            </p>
                            <ul className="mt-1 space-y-1">
                              {item.verificationSteps
                                .slice(0, 2)
                                .map((step: string) => (
                                  <li
                                    key={step}
                                    className="text-xs leading-5 text-zinc-600"
                                  >
                                    - {step}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-zinc-100 bg-white/90 p-5 shadow-sm sm:p-6">
              <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                {localeText.report.nextSteps}
              </p>
              <div className="mt-4 space-y-3">
                {adviceList.slice(0, 3).map((advice, index) => (
                  <div
                    key={index}
                    className="flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <p className="text-xs leading-5 text-zinc-700">{advice}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          )}

          {false && (
          <div className="hidden">
            <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.18em]">
              {localeText.detailsHint}
            </p>
            <button
              type="button"
              onClick={() => setShowDetails((value) => !value)}
              className={`inline-flex items-center gap-2 rounded-full border bg-white/90 px-4 py-2 text-[10px] font-semibold shadow-sm transition-all ${
                isAsianLanguage
                  ? "border-zinc-200 text-zinc-700 tracking-[0.18em] hover:text-zinc-900 hover:border-emerald-300"
                  : "border-black/5 tracking-[0.22em] text-zinc-500 hover:text-zinc-900 hover:border-emerald-200"
              }`}
            >
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showDetails ? "rotate-180" : ""} ${isAsianLanguage ? "text-emerald-500" : ""}`}
              />
              {showDetails ? localeText.detailsClose : localeText.detailsOpen}
            </button>
          </div>
          )}

          {showDetails && (
            <div className="space-y-4 mb-10">
              {/* Step: Geo-Location (Shown first for IPs) */}
              {result.isActuallyIp && (
                <div className="bg-emerald-50/30 border border-emerald-100 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
                  <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                    <span className="text-[10px] font-semibold text-emerald-600 tracking-[0.22em]">
                      {localeText.geo.step}
                    </span>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">
                        {localeText.geo.title}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.geo.country}
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {result.geo.country}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.geo.city}
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {result.geo.city}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.geo.asn}
                      </p>
                      <p className="text-sm font-semibold text-emerald-600">
                        {result.geo.asn}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.geo.isp}
                      </p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">
                        {result.geo.isp}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 1: WHOIS */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">
                    {localeText.whois.step}
                  </span>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">
                      {localeText.whois.title}
                    </span>
                  </div>
                </div>
                <div className="flex-grow">
                  {result.whois?.lookupTarget && (
                    <p className="mb-4 text-[10px] font-semibold tracking-[0.14em] text-zinc-400">
                      {localeText.whois.lookupTarget}: {result.whois.lookupTarget}
                    </p>
                  )}
                  {!result.whois?.success && result.whois?.error ? (
                    <div className="w-full h-full flex flex-col justify-center">
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.whois.rdapUnavailable}
                      </p>
                      <p className="text-sm font-medium leading-6 text-zinc-700">
                        {result.whois.errorCode
                          ? localeText.whois.rdapErrors[
                              result.whois.errorCode as keyof typeof localeText.whois.rdapErrors
                            ] || result.whois.error
                          : result.whois.error}
                      </p>
                      {result.whois.httpStatus && (
                        <p className="mt-1 text-[10px] text-zinc-400">
                          RDAP HTTP {result.whois.httpStatus}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                          {result.isActuallyIp ? "Network Owner" : "Registrar"}
                        </p>
                        <p
                          className={`text-sm font-semibold truncate ${result.whois?.success ? "text-zinc-900" : "text-zinc-400"}`}
                        >
                          {result.whois?.success
                            ? result.whois.registrar
                            : result.isActuallyIp
                              ? result.geo.isp
                              : localeText.whois.noInfo}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                          {result.isActuallyIp
                            ? localeText.whois.allocated
                            : localeText.whois.registered}
                        </p>
                        <p className="text-sm text-zinc-700">
                          {result.whois?.success
                            ? result.whois.registered
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                          {result.isActuallyIp
                            ? localeText.whois.networkClass
                            : localeText.whois.expiry}
                        </p>
                        <p className="text-sm text-zinc-700">
                          {result.isActuallyIp
                            ? result.isPrivate
                              ? localeText.whois.privateIp
                              : localeText.whois.publicIp
                            : result.whois?.success
                              ? result.whois.expires
                              : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                          {localeText.whois.status}
                        </p>
                        <p
                          className={`text-sm font-semibold truncate ${
                            result.whois?.status?.toLowerCase().includes("hold")
                              ? "text-red-500"
                              : "text-emerald-500"
                          }`}
                          title={result.whois?.status || "Unknown"}
                        >
                          {result.whois?.status ||
                            (lang === "en" ? "OK" : "正常")}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subdomain Discovery Add-on */}
                  {result.subdomains && result.subdomains.length > 0 && (
                    <details className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-3 h-3 text-zinc-400" />
                          <h4 className="text-[10px] font-semibold text-zinc-500 tracking-[0.18em]">
                            {localeText.whois.assetTitle}
                          </h4>
                        </div>
                        <span className="text-[9px] text-zinc-400">
                          {result.subdomains.length}{" "}
                          {localeText.whois.assetCountSuffix}
                        </span>
                      </summary>
                      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {result.subdomains.map((sub: string) => (
                          <button
                            key={sub}
                            onClick={() => {
                              setDomain(sub);
                              runDiagnostic(sub);
                            }}
                            className="text-left px-3 py-2 bg-white border border-zinc-100 rounded-lg text-[10px] text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 transition-all hover:shadow-sm truncate group"
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                              →
                            </span>{" "}
                            {sub}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              {/* Step 2: DNS */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">
                    {localeText.dns.step}
                  </span>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">
                      {localeText.dns.title}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.dns.resolved}
                    </p>
                    <p
                      className="text-[12px] font-semibold text-zinc-800 break-all leading-tight"
                      title={result.dns.all_ips?.join(", ")}
                    >
                      {result.dns.all_ips && result.dns.all_ips.length > 0
                        ? result.dns.all_ips.join(" / ")
                        : result.dns.resolved_ip}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${
                          result.dns.ipv4?.length
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-400"
                        }`}
                      >
                        IPv4{" "}
                        {result.dns.ipv4?.length
                          ? `${result.dns.ipv4.length} OK`
                          : "None"}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${
                          result.dns.ipv6?.length
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-zinc-200 bg-zinc-50 text-zinc-400"
                        }`}
                      >
                        IPv6{" "}
                        {result.dns.ipv6?.length
                          ? `${result.dns.ipv6.length} OK`
                          : "None"}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${
                          result.dns.dual_stack
                            ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {result.dns.dual_stack ? "Dual stack" : "Single stack"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-4 pt-4 border-t border-zinc-50/50">
                      {/* REGIONAL LOCAL NODES (Client Perspective) - Deduped by Map */}
                      {Object.values(localResolvers).map((node: any) => (
                        <div
                          key={node.id}
                          className="flex items-center gap-2 group cursor-help transition-all hover:scale-105"
                          title={`Direct from your locally configured network via ${node.id}`}
                        >
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              node.status === "OK"
                                ? "bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]"
                                : node.status === "RESOLVING"
                                  ? "bg-zinc-200 animate-pulse"
                                  : "bg-red-400"
                            }`}
                          ></div>
                          <div className="flex flex-col">
                            <span className="text-[9px] font-semibold text-zinc-800 leading-none tracking-[0.18em]">
                              {node.name}
                            </span>
                            <span className="text-[8px] text-zinc-400 mt-1 font-semibold">
                              {node.status === "FAILED"
                                ? localeText.dns.restricted
                                : node.ip
                                  ? node.ip.length > 15
                                    ? node.ip.slice(0, 12) + "..."
                                    : node.ip
                                  : "NXDOMAIN"}{" "}
                              • {node.latency}
                            </span>
                          </div>
                        </div>
                      ))}

                      {/* GLOBAL CLOUD NODES (Worker Perspective) */}
                      <div className="w-full flex flex-wrap items-center gap-4 mt-1">
                        {result.dns.resolvers?.map((r: any) => (
                          <div
                            key={r.resolver}
                            className="flex items-center gap-1.5"
                            title={`${r.resolver}: ${r.status || "Unknown"} · ${r.latencyMs ?? "—"}ms`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full ${r.status === "OK" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500"}`}
                            ></div>
                            <span className="text-[9px] font-semibold text-zinc-400 tracking-[0.12em]">
                              {r.resolver} {r.latencyMs ?? "—"}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.dns.latency}
                    </p>
                    <p className="text-sm text-emerald-600 flex items-center gap-1 font-semibold">
                      <Activity className="w-3 h-3" /> {result.dns.latency}
                    </p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.dns.nameservers}
                    </p>
                    <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-1 overflow-x-hidden">
                      {result.dns.ns && result.dns.ns.length > 0 ? (
                        result.dns.ns.map((ns: string) => (
                          <p
                            key={ns}
                            className="text-[10px] text-zinc-500 truncate leading-tight"
                            title={ns}
                          >
                            {ns}
                          </p>
                        ))
                      ) : (
                        <p className="text-[10px] text-zinc-400 font-semibold">
                          {localeText.dns.unknown}
                        </p>
                      )}
                    </div>
                  </div>
                  <details className="col-span-2 lg:col-span-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <h4 className="truncate text-[10px] font-semibold tracking-[0.18em] text-zinc-500">
                          {localeText.dns.recordOverview}
                        </h4>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {(
                        [
                          "A",
                          "AAAA",
                          "CNAME",
                          "MX",
                          "TXT",
                          "CAA",
                          "SOA",
                        ] as const
                      ).map((recordType) => {
                        const values = result.dns.records?.[recordType] || [];
                        return (
                          <div
                            key={recordType}
                            className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm"
                          >
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold text-zinc-900">
                                {recordType}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                  values.length
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-zinc-100 text-zinc-400"
                                }`}
                              >
                                {values.length}
                              </span>
                            </div>
                            <p className="mb-3 text-[10px] leading-4 text-zinc-500">
                              {localeText.dns.recordNotes[recordType]}
                            </p>
                            <div className="space-y-1.5">
                              {values.length ? (
                                values.slice(0, 8).map((value: string) => (
                                  <p
                                    key={value}
                                    className="rounded-lg bg-zinc-50 px-2.5 py-1.5 font-mono text-[10px] leading-4 text-zinc-700 break-all"
                                  >
                                    {value}
                                  </p>
                                ))
                              ) : (
                                <p className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400">
                                  {localeText.dns.noRecords}
                                </p>
                              )}
                              {values.length > 8 && (
                                <p className="text-[10px] font-semibold text-zinc-400">
                                  +{values.length - 8}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 3: Server HTTP */}
              <div
                className={`p-5 sm:p-6 rounded-3xl border flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all ${result.http.success || resultState?.corroboratedReachable ? "bg-white border-black/5" : resultState?.blocked ? "bg-orange-50 border-orange-100" : "bg-red-50 border-red-100"}`}
              >
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">
                    {localeText.http.step}
                  </span>
                  <div className="flex items-center gap-2">
                    <Server
                      className={`w-4 h-4 ${result.http.success || resultState?.corroboratedReachable ? "text-emerald-500" : resultState?.blocked ? "text-orange-500" : "text-red-500"}`}
                    />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">
                      {localeText.http.title}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[9px] font-semibold text-zinc-500">
                      OpsKitPro Probe · AWS Lightsail · full
                    </span>
                    {result.observations?.browser && (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700">
                        Your Browser · full
                      </span>
                    )}
                    {result.observations?.edge && (
                      <span
                        className={`rounded-full border px-2 py-1 text-[9px] font-semibold ${
                          resultState?.edgeReachable
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-orange-200 bg-orange-50 text-orange-700"
                        }`}
                      >
                        Cloudflare Edge Probe · {result.observations.edge.colo} · full
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.http.availability}
                    </p>
                    <p
                      className={`text-sm font-semibold ${result.http.success || resultState?.corroboratedReachable ? "text-emerald-500" : resultState?.blocked ? "text-orange-600" : "text-red-500"}`}
                    >
                      {resultState?.corroboratedReachable
                        ? lang === "zh"
                          ? `${resultState.browserReachable ? "浏览器" : "边缘"}正常 / Lightsail 受限`
                          : `${resultState.browserReachable ? "Browser" : "Edge"} OK / Lightsail restricted`
                        : result.http.success
                        ? localeText.http.success
                        : localeText.http.failure}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.http.status}
                    </p>
                    <p
                      className={`text-sm font-semibold ${result.http.success || resultState?.corroboratedReachable ? "text-zinc-900" : "text-red-500"}`}
                    >
                      {resultState?.corroboratedReachable
                        ? `${resultState.browserReachable ? result.observations.browser.httpStatus || "OK" : `Edge ${result.observations.edge.httpStatus || "OK"}`} / ${result.http.status_code}`
                        : result.http.status_code || "Err"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.http.protocol}
                    </p>
                    <p className="text-sm text-zinc-700">
                      {result.http.is_https ? "HTTPS" : "HTTP/TCP"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.http.responseTime}
                    </p>
                    <p className="text-sm text-zinc-900 flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3 text-emerald-500" />{" "}
                      {result.http.latency}
                    </p>
                  </div>
                  <details className="col-span-2 lg:col-span-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <div className="min-w-0">
                          <h4 className="truncate text-[10px] font-semibold tracking-[0.18em] text-zinc-500">
                            {localeText.http.redirects}
                          </h4>
                          <p className="mt-1 truncate text-[10px] text-zinc-400">
                            {(result.http.redirect_count ?? 0) > 0
                              ? `${result.http.redirect_count} hop(s)`
                              : localeText.http.noRedirects}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-3">
                      <p className="text-[10px] leading-4 text-zinc-500">
                        {localeText.http.redirectHint}
                      </p>
                      {result.http.redirect_warning && (
                        <div className="flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-[10px] text-orange-700">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span>
                            <span className="font-semibold">
                              {localeText.http.redirectWarning}:
                            </span>{" "}
                            {result.http.redirect_warning}
                          </span>
                        </div>
                      )}
                      <div className="rounded-2xl border border-white bg-white/90 p-3 shadow-sm">
                        <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                          {localeText.http.finalUrl}
                        </p>
                        <p className="break-all font-mono text-[10px] leading-4 text-zinc-700">
                          {result.http.final_url || "Unknown"}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {(result.http.redirect_chain || []).length ? (
                          (result.http.redirect_chain || []).map(
                            (hop: any, index: number) => (
                              <div
                                key={`${hop.url}-${index}`}
                                className="rounded-2xl border border-white bg-white/90 px-3 py-2 shadow-sm"
                              >
                                <div className="mb-1 flex items-center gap-2">
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                      hop.status >= 300 && hop.status < 400
                                        ? "bg-orange-50 text-orange-700"
                                        : hop.status < 400
                                          ? "bg-emerald-50 text-emerald-700"
                                          : "bg-red-50 text-red-700"
                                    }`}
                                  >
                                    {hop.status}
                                  </span>
                                  <span className="text-[9px] font-semibold tracking-[0.14em] text-zinc-400">
                                    HOP {index + 1}
                                  </span>
                                </div>
                                <p className="break-all font-mono text-[10px] leading-4 text-zinc-700">
                                  {hop.url}
                                </p>
                                {hop.location && (
                                  <p className="mt-1 break-all font-mono text-[10px] leading-4 text-zinc-400">
                                    → {hop.location}
                                  </p>
                                )}
                              </div>
                            ),
                          )
                        ) : (
                          <p className="rounded-xl bg-white px-3 py-2 text-[10px] font-semibold text-zinc-400">
                            {localeText.http.noRedirects}
                          </p>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 4: Security Headers */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">
                    {localeText.security.step}
                  </span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck
                      className={`w-4 h-4 ${(result.securityHeaders?.score ?? 0) >= 75 ? "text-emerald-500" : "text-orange-500"}`}
                    />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">
                      {localeText.security.title}
                    </span>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.security.score}
                      </p>
                      <p
                        className={`text-sm font-semibold ${(result.securityHeaders?.score ?? 0) >= 75 ? "text-emerald-600" : (result.securityHeaders?.score ?? 0) >= 55 ? "text-orange-500" : "text-red-500"}`}
                      >
                        {result.securityHeaders?.grade || "—"} /{" "}
                        {result.securityHeaders?.score ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.security.passed}
                      </p>
                      <p className="text-sm font-semibold text-zinc-900">
                        {result.securityHeaders?.passed ?? 0}/
                        {result.securityHeaders?.total ?? 0}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.security.missing}
                      </p>
                      <p className="text-sm font-semibold text-zinc-700">
                        {(result.securityHeaders?.checks || [])
                          .filter((check: any) => !check.present)
                          .map((check: any) => check.label)
                          .join(" / ") || "OK"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {(result.securityHeaders?.checks || []).map(
                      (check: any) => (
                        <div
                          key={check.key}
                          className={`rounded-2xl border px-4 py-3 ${check.present ? "border-emerald-100 bg-emerald-50/40" : "border-orange-100 bg-orange-50/50"}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className={`text-xs font-semibold ${check.present ? "text-emerald-700" : "text-orange-700"}`}
                              >
                                {check.label}
                              </p>
                              <p
                                className="mt-1 truncate text-[10px] text-zinc-500"
                                title={check.value || check.recommendation}
                              >
                                {check.present
                                  ? check.value || "enabled"
                                  : check.recommendation}
                              </p>
                            </div>
                            <div
                              className={`h-2.5 w-2.5 shrink-0 rounded-full ${check.present ? "bg-emerald-500" : "bg-orange-400"}`}
                            />
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>

              {/* Step 5: SSL */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">
                    {localeText.ssl.step}
                  </span>
                  <div className="flex items-center gap-2">
                    <Lock
                      className={`w-4 h-4 ${result.ssl.valid ? "text-emerald-500" : "text-red-500"}`}
                    />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">
                      {localeText.ssl.title}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-grow">
                  {/* Col 1: Status & Expiry */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.ssl.certStatus}
                      </p>
                      <p
                        className={`text-sm font-semibold ${result.ssl.valid ? "text-emerald-500" : "text-red-500"}`}
                      >
                        {result.ssl.valid
                          ? lang === "en"
                            ? "PROVEN_SECURE"
                            : "有效"
                          : lang === "en"
                            ? "VALIDATION_FAULT"
                            : "验证失败"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.ssl.expiry}
                      </p>
                      <p className="text-sm text-zinc-700">
                        {result.ssl.expiry}
                      </p>
                    </div>
                  </div>

                  {/* Col 2: Precise Validation */}
                  <div className="flex flex-col justify-center space-y-2 bg-zinc-50 rounded-2xl p-4 border border-black/5 relative">
                    <p className="text-[9px] font-semibold text-zinc-400 tracking-[0.18em] mb-1">
                      {lang === "en" ? "VALIDATION CHECKS" : "验证检查"}
                    </p>
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${result.ssl.date_valid === true ? 'bg-emerald-500' : result.ssl.date_valid === false ? 'bg-red-500' : 'bg-zinc-300'}`}></div>
                       <p className="text-[10px] text-zinc-700">{lang === "en" ? "Date Valid" : "日期有效"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${result.ssl.hostname_valid === true ? 'bg-emerald-500' : result.ssl.hostname_valid === false ? 'bg-red-500' : 'bg-zinc-300'}`}></div>
                       <p className="text-[10px] text-zinc-700">{lang === "en" ? "Hostname Match" : "主机名称相符"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className={`w-1.5 h-1.5 rounded-full ${result.ssl.chain_authorized === true ? 'bg-emerald-500' : result.ssl.chain_authorized === false ? 'bg-red-500' : 'bg-zinc-300'}`}></div>
                       <p className="text-[10px] text-zinc-700">{lang === "en" ? "Trusted Chain" : "受信任证书链"}</p>
                    </div>
                  </div>

                  {/* Col 3: Headers & Tech */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.ssl.hsts}
                      </p>
                      <p
                        className={`text-[11px] font-semibold ${result.ssl.factors?.includes("HSTS_ENABLED") ? "text-emerald-500" : "text-orange-500"}`}
                      >
                        {result.ssl.factors?.includes("HSTS_ENABLED")
                          ? lang === "en"
                            ? "STRICT_ACTIVE"
                            : "有效"
                          : lang === "en"
                            ? "OPTIONAL_NONE"
                            : "无效"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                        {localeText.ssl.cipher}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {result.ssl.tls_version || "TLS 1.3"}
                      </p>
                    </div>
                  </div>

                  {/* Col 4: Cert Chain View */}
                  <details className="bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100 relative overflow-hidden group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <p className="text-[9px] font-semibold text-zinc-400 tracking-[0.18em]">
                        {localeText.ssl.chain}
                      </p>
                      <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-60 group-open:opacity-100 transition-opacity" />
                    </summary>
                    <div className="space-y-3 relative mt-4">
                      {result.ssl.chain && result.ssl.chain.length > 0 ? (
                        result.ssl.chain.map((link: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-2 h-2 rounded-full ${link.status === "Trusted" || link.status === "Active" ? "bg-emerald-500" : "bg-red-500"}`}
                              ></div>
                              {idx < result.ssl.chain.length - 1 && (
                                <div className="w-px h-3 bg-zinc-200"></div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[9px] text-zinc-400 leading-none mb-1 tracking-[0.18em]">
                                {link.level}
                              </p>
                              <p
                                className="text-[10px] text-zinc-700 font-semibold truncate max-w-[120px]"
                                title={link.name}
                              >
                                {link.name}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-4 opacity-30">
                          <ShieldAlert className="w-6 h-6 mb-2 text-zinc-400" />
                          <p className="text-[9px] text-center tracking-[0.18em] text-zinc-500">
                            {localeText.ssl.chainUnavailable}
                          </p>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 5: CDN */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">
                    {localeText.cdn.step}
                  </span>
                  <div className="flex items-center gap-2">
                    <Cloud
                      className={`w-4 h-4 ${result.cdn.is_provider ? "text-emerald-500" : "text-zinc-400"}`}
                    />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">
                      {localeText.cdn.title}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.cdn.provider}
                    </p>
                    <p className="text-sm font-semibold text-zinc-900 truncate">
                      {result.cdn.provider}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.cdn.edge}
                    </p>
                    <p
                      className={`text-sm font-semibold ${result.cdn.is_provider ? "text-orange-500" : "text-zinc-400"}`}
                    >
                      {result.cdn.is_provider
                        ? localeText.cdn.proxied
                        : localeText.cdn.direct}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">
                      {localeText.cdn.header}
                    </p>
                    <p className="text-sm text-zinc-700 truncate">
                      {result.cdn.server}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions & Advice Section */}
          {showDetails && (
            <div className="rounded-[2.5rem] border border-zinc-200/70 bg-white shadow-sm p-6 sm:p-10 md:p-12">
              <div className="flex items-start justify-between gap-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-semibold text-zinc-900 tracking-[-0.02em]">
                      {localeText.advice.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 tracking-[0.16em]">
                      {localeText.advice.subtitle}
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,0.9fr] gap-6">
                <div className="space-y-3">
                  {adviceList.length > 0 ? (
                    adviceList.map((advice, i) => (
                      <div
                        key={i}
                        className="flex gap-4 p-5 bg-zinc-50/80 rounded-2xl border border-zinc-200/70 shadow-sm group overflow-hidden"
                      >
                        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                        <div className="flex-grow">
                          <p className="text-sm sm:text-[15px] font-medium text-zinc-800 leading-relaxed">
                            {advice}
                          </p>
                          <p className="mt-2 text-[10px] text-zinc-400 tracking-[0.16em]">
                            {localeText.advice.itemLabel}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-emerald-700">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 opacity-60 shrink-0" />
                        <div>
                          <span className="text-sm font-bold block">
                            {localeText.advice.noneTitle}
                          </span>
                          <span className="text-[10px] opacity-70 mt-1 block tracking-[0.16em]">
                            {localeText.advice.noneDesc}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-5 sm:p-6">
                  <h5 className="text-[10px] font-semibold text-zinc-400 mb-5 tracking-[0.18em]">
                    {localeText.advice.nextTitle}
                  </h5>
                  <div className="space-y-3">
                    <Link
                      href={`/tools/ip-lookup?q=${result.dns.resolved_ip}`}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/70 hover:border-emerald-300 hover:-translate-y-0.5 transition-all group shadow-sm"
                    >
                      <span className="text-sm font-semibold text-zinc-900">
                        {localeText.advice.ip}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                    <Link
                      href={`/tools/dns-lookup?q=${domain}`}
                      className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/70 hover:border-emerald-300 hover:-translate-y-0.5 transition-all group shadow-sm"
                    >
                      <span className="text-sm font-semibold text-zinc-900">
                        {localeText.advice.dns}
                      </span>
                      <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* JSON Audit View */}
          {showDetails && (
            <div className="mt-20">
              <button
                onClick={() => setShowJson(!showJson)}
                className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors tracking-[0.18em] mb-6"
              >
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${showJson ? "rotate-180" : ""}`}
                />
                {localeText.advice.json}
              </button>
              {showJson && (
                <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-[11px] text-zinc-400 overflow-x-auto border border-zinc-800 shadow-2xl relative">
                  <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                    <button
                      onClick={copyResult}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <pre className="font-mono leading-relaxed pt-4">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hero-State Empty View */}
      {!result && !loading && (
        <div className="max-w-2xl mx-auto mt-24 p-16 rounded-[3rem] border border-dashed border-zinc-200 bg-white/60 text-center animate-in fade-in duration-1000">
          <Search className="w-16 h-16 text-zinc-100 mx-auto mb-8 animate-pulse" />
          <p className="text-zinc-500 text-xs leading-relaxed tracking-[0.18em] opacity-40">
            {localeText.emptyHint}
          </p>
        </div>
      )}
    </main>
  );
}
