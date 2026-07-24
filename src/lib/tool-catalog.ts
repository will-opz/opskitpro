export type ProductLocale = "en" | "zh";
export type CoreToolId = "website-check" | "network-doctor" | "dns-security";
export type ToolPlacement = "home" | "catalog";

export type ProductTool = {
  id: CoreToolId | string;
  href: string;
  category: "core" | "diagnostic" | "developer" | "utility";
  title: Record<ProductLocale, string>;
  description: Record<ProductLocale, string>;
  observationPoints: Array<"browser" | "edge" | "probe">;
};

export const observationPointCopy = {
  browser: {
    en: {
      label: "Your Browser",
      description: "Evidence measured in the visitor's browser.",
    },
    zh: {
      label: "你的浏览器",
      description: "由访问者当前浏览器测得的证据。",
    },
  },
  edge: {
    en: {
      label: "Cloudflare Edge",
      description: "Evidence measured from a Cloudflare edge location.",
    },
    zh: {
      label: "Cloudflare 边缘节点",
      description: "由 Cloudflare 边缘位置测得的证据。",
    },
  },
  probe: {
    en: {
      label: "OpsKitPro Probe (AWS Lightsail)",
      description: "Server-side evidence measured from the OpsKitPro probe.",
    },
    zh: {
      label: "OpsKitPro 探针（AWS Lightsail）",
      description: "由 OpsKitPro 服务端探针测得的证据。",
    },
  },
} as const;

export const productTools: ProductTool[] = [
  {
    id: "website-check",
    href: "/tools/website-check",
    category: "core",
    title: { en: "Website Check", zh: "网站检测" },
    description: {
      en: "Diagnose DNS, HTTP, TLS, CDN and security headers with evidence from distinct observation points.",
      zh: "从不同观察点诊断 DNS、HTTP、TLS、CDN 和安全响应头。",
    },
    observationPoints: ["browser", "edge", "probe"],
  },
  {
    id: "network-doctor",
    href: "/tools/network-check",
    category: "core",
    title: { en: "Network Doctor", zh: "网络诊断" },
    description: {
      en: "Explain connection quality, IPv6, DNS latency, reachability and Cloudflare request context.",
      zh: "解释连接质量、IPv6、DNS 延迟、服务可达性和 Cloudflare 请求上下文。",
    },
    observationPoints: ["browser", "edge", "probe"],
  },
  {
    id: "dns-security",
    href: "/tools/dns-lookup",
    category: "core",
    title: { en: "DNS Security", zh: "DNS 安全检查" },
    description: {
      en: "Inspect DNS records plus SPF, DMARC and CAA policy signals without overstating protection.",
      zh: "检查 DNS 记录以及 SPF、DMARC、CAA 策略信号，不夸大安全结论。",
    },
    observationPoints: ["probe"],
  },
  {
    id: "ip-lookup",
    href: "/tools/ip-lookup",
    category: "diagnostic",
    title: { en: "IP Lookup", zh: "IP 查询" },
    description: {
      en: "Inspect public IP, ASN, provider and location hints.",
      zh: "查询公网 IP、ASN、网络提供商和位置线索。",
    },
    observationPoints: ["edge"],
  },
  {
    id: "cloudflare-trace",
    href: "/tools/cloudflare-trace",
    category: "diagnostic",
    title: { en: "Cloudflare Trace", zh: "Cloudflare Trace" },
    description: {
      en: "Inspect edge colo, protocol, WARP and Gateway request context.",
      zh: "检查边缘机房、协议、WARP 和 Gateway 请求上下文。",
    },
    observationPoints: ["edge"],
  },
  {
    id: "api",
    href: "/tools/api",
    category: "developer",
    title: { en: "Diagnostic API", zh: "诊断 API" },
    description: {
      en: "Call bounded DNS, IP, HTTP and full diagnostic endpoints.",
      zh: "调用有安全边界的 DNS、IP、HTTP 和完整诊断接口。",
    },
    observationPoints: ["probe"],
  },
  {
    id: "json",
    href: "/tools/json",
    category: "developer",
    title: { en: "JSON Toolkit", zh: "JSON 工具" },
    description: {
      en: "Format, repair, query and compare JSON locally.",
      zh: "在本地格式化、修复、查询和对比 JSON。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "websocket",
    href: "/tools/websocket",
    category: "developer",
    title: { en: "WebSocket Lab", zh: "WebSocket 调试" },
    description: {
      en: "Open sessions and inspect realtime messages from your browser.",
      zh: "从浏览器建立连接并检查实时消息。",
    },
    observationPoints: ["browser"],
  },
];

export const coreTools = productTools.filter(
  (tool): tool is ProductTool & { id: CoreToolId } => tool.category === "core",
);

export function localizeTool(tool: ProductTool, lang: ProductLocale) {
  return {
    ...tool,
    title: tool.title[lang],
    description: tool.description[lang],
  };
}
