export type ProductLocale = "en" | "zh";
export type CoreToolId = "website-check" | "network-doctor" | "dns-security";
export type ProductToolId =
  | CoreToolId
  | "ip-lookup"
  | "cloudflare-trace"
  | "api"
  | "json"
  | "websocket"
  | "passgen"
  | "qrgen"
  | "encode"
  | "time"
  | "prompt-builder"
  | "regex"
  | "hash"
  | "jwt"
  | "uuid"
  | "sensitive-data"
  | "cron"
  | "yaml"
  | "sql"
  | "color"
  | "diff";
export type ToolPlacement = "home" | "catalog" | "referral";
export type ToolTaskCategory =
  | "password-checksum"
  | "encoding-data"
  | "text-development"
  | "image-file"
  | "website-network";
export type ToolProcessingMode = "local" | "network";
export type ToolNetworkPath = "none" | "direct-target" | "cloudflare-edge" | "opskitpro-probe" | "mixed";

export type ProductTool = {
  id: ProductToolId;
  href: string;
  category: "core" | "diagnostic" | "developer" | "utility";
  taskCategory: ToolTaskCategory;
  processingMode: ToolProcessingMode;
  networkPath: ToolNetworkPath;
  inputType: Record<ProductLocale, string>;
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
    taskCategory: "website-network",
    processingMode: "network",
    networkPath: "mixed",
    inputType: { en: "Public domain or URL", zh: "公开域名或网址" },
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
    taskCategory: "website-network",
    processingMode: "network",
    networkPath: "mixed",
    inputType: { en: "Current network connection", zh: "当前网络连接" },
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
    taskCategory: "website-network",
    processingMode: "network",
    networkPath: "opskitpro-probe",
    inputType: { en: "Public domain", zh: "公开域名" },
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
    taskCategory: "website-network",
    processingMode: "network",
    networkPath: "mixed",
    inputType: { en: "Public IP address", zh: "公网 IP 地址" },
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
    taskCategory: "website-network",
    processingMode: "network",
    networkPath: "cloudflare-edge",
    inputType: { en: "Current connection", zh: "当前网络连接" },
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
    taskCategory: "website-network",
    processingMode: "network",
    networkPath: "opskitpro-probe",
    inputType: { en: "Public domain, IP or URL", zh: "公开域名、IP 或网址" },
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
    taskCategory: "encoding-data",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "JSON text", zh: "JSON 文本" },
    title: { en: "JSON Toolkit", zh: "JSON 工具" },
    description: {
      en: "Format, minify, repair, and convert JSON locally.",
      zh: "在本地格式化、压缩、修复和转换 JSON。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "websocket",
    href: "/tools/websocket",
    category: "developer",
    taskCategory: "website-network",
    processingMode: "network",
    networkPath: "direct-target",
    inputType: { en: "WebSocket endpoint and messages", zh: "WebSocket 地址与消息" },
    title: { en: "WebSocket Lab", zh: "WebSocket 调试" },
    description: {
      en: "Open sessions and inspect realtime messages from your browser.",
      zh: "从浏览器建立连接并检查实时消息。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "passgen",
    href: "/tools/passgen",
    category: "utility",
    taskCategory: "password-checksum",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Generation preferences", zh: "生成选项" },
    title: { en: "Password Generator", zh: "密码生成器" },
    description: {
      en: "Generate strong passwords locally without sending them to a server.",
      zh: "在浏览器本地生成高强度密码，不上传服务器。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "qrgen",
    href: "/tools/qrgen",
    category: "utility",
    taskCategory: "image-file",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Link or short text", zh: "链接或短文本" },
    title: { en: "QR Generator", zh: "二维码生成器" },
    description: {
      en: "Turn links and short text into downloadable QR codes.",
      zh: "把链接和短文本转换为可下载的二维码。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "encode",
    href: "/tools/encode",
    category: "utility",
    taskCategory: "encoding-data",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Text or JWT", zh: "文本或 JWT" },
    title: { en: "Encode / Decode", zh: "编码 / 解码" },
    description: {
      en: "Convert URL, Base64, HTML entities and common text formats locally.",
      zh: "在本地转换 URL、Base64、HTML 实体和常用文本格式。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "time",
    href: "/tools/time",
    category: "utility",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Timestamp or date", zh: "时间戳或日期" },
    title: { en: "Time Converter", zh: "时间转换器" },
    description: {
      en: "Convert timestamps and compare time zones quickly.",
      zh: "快速转换时间戳并比较不同时区。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "regex",
    href: "/tools/regex",
    category: "developer",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Pattern and test text", zh: "表达式与测试文本" },
    title: { en: "Regex Tester", zh: "正则表达式测试器" },
    description: {
      en: "Test JavaScript regular expressions, highlights, and capture groups locally.",
      zh: "在本地测试 JavaScript 正则表达式、匹配高亮和捕获组。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "hash",
    href: "/tools/hash",
    category: "developer",
    taskCategory: "password-checksum",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Text or local file", zh: "文本或本地文件" },
    title: { en: "Hash & File Checksum", zh: "Hash 与文件校验" },
    description: { en: "Generate and compare text or file checksums locally.", zh: "在本地生成并比对文本或文件校验值。" },
    observationPoints: ["browser"],
  },
  {
    id: "jwt",
    href: "/tools/jwt",
    category: "developer",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "JWT token text", zh: "JWT 文本" },
    title: { en: "JWT Decoder & Verifier", zh: "JWT 解码与校验" },
    description: { en: "Decode JWT header and payload in-browser, then verify local signatures with supported algorithms.", zh: "在本地解码 JWT 的 header/payload，并校验支持的签名算法。" },
    observationPoints: ["browser"],
  },
  {
    id: "uuid",
    href: "/tools/uuid",
    category: "developer",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "UUID generation and validation parameters", zh: "UUID 生成与校验参数" },
    title: { en: "UUID Generator & Validator", zh: "UUID 生成与校验" },
    description: {
      en: "Generate UUID locally (v1/v4/v5), validate UUID formats, and copy results locally.",
      zh: "本地生成 UUID（v1/v4/v5）、验证 UUID 格式，并支持本地复制结果。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "sensitive-data",
    href: "/tools/sensitive-data",
    category: "developer",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Text or log samples", zh: "文本/日志样本" },
    title: { en: "Sensitive Data Detector", zh: "敏感信息检测与脱敏" },
    description: {
      en: "Detect emails, IPs, explicit credentials, tokens, and common secret-like patterns locally, then redact for safe sharing.",
      zh: "在本地检测邮箱、IP、显式密码凭据和密钥/Token，并一键生成脱敏文本。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "cron",
    href: "/tools/cron",
    category: "developer",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Cron fields or quick presets", zh: "Cron 字段或快捷模板" },
    title: { en: "Cron Generator", zh: "Cron 表达式生成器" },
    description: {
      en: "Build and explain standard 5-field cron expressions locally for quick scheduling checks.",
      zh: "在本地快速生成并解释标准 5 字段 cron 表达式。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "yaml",
    href: "/tools/yaml",
    category: "developer",
    taskCategory: "encoding-data",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "YAML text", zh: "YAML 文本" },
    title: { en: "YAML Formatter", zh: "YAML 格式化器" },
    description: {
      en: "Validate and format YAML locally with clear error position details.",
      zh: "在本地校验并格式化 YAML，清晰显示错误位置。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "sql",
    href: "/tools/sql",
    category: "developer",
    taskCategory: "encoding-data",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "SQL text", zh: "SQL 文本" },
    title: { en: "SQL Formatter", zh: "SQL 格式化器" },
    description: {
      en: "Format SQL text locally with practical readability defaults.",
      zh: "在浏览器本地按实用默认规则格式化 SQL 文本。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "color",
    href: "/tools/color",
    category: "utility",
    taskCategory: "image-file",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Color value", zh: "颜色值" },
    title: { en: "Color Converter", zh: "颜色转换器" },
    description: {
      en: "Convert colors between hex, RGB, RGBA, HSL and pick from a local color palette.",
      zh: "在本地完成颜色值的 Hex/RGB/RGBA/HSL 转换，并支持本地取色。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "diff",
    href: "/tools/diff",
    category: "developer",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Two text versions", zh: "两个文本版本" },
    title: { en: "Text Diff", zh: "文本对比" },
    description: {
      en: "Compare two text versions line by line locally with clear additions and deletions.",
      zh: "在浏览器本地逐行对比两个文本版本，清晰查看新增与删除。",
    },
    observationPoints: ["browser"],
  },
  {
    id: "prompt-builder",
    href: "/tools/prompt-builder",
    category: "utility",
    taskCategory: "text-development",
    processingMode: "local",
    networkPath: "none",
    inputType: { en: "Task and constraints", zh: "任务与约束" },
    title: { en: "Prompt Builder", zh: "提示词构建器" },
    description: {
      en: "Structure reusable prompts with clear context, constraints and output rules.",
      zh: "用清晰的上下文、约束和输出规则组织可复用提示词。",
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
