import type { ProductLocale, ProductToolId } from "./tool-catalog";

type LocalizedText = Record<ProductLocale, string>;

export type ToolGuide = {
  purpose: LocalizedText;
  input: LocalizedText;
  output: LocalizedText;
  processing: LocalizedText;
  privacy: LocalizedText;
  limitation: LocalizedText;
  example: LocalizedText;
  related: ProductToolId[];
  lastReviewed: string;
};

const local = (en: string, zh: string): LocalizedText => ({ en, zh });

export const toolGuides = {
  "website-check": {
    purpose: local("Find likely DNS, HTTP, TLS, CDN, and security-header problems from separate observation points.", "从不同观察点查找 DNS、HTTP、TLS、CDN 和安全响应头问题。"),
    input: local("A public domain or website URL, such as example.com.", "公开域名或网站地址，例如 example.com。"),
    output: local("A diagnostic report with evidence, likely causes, fixes, and verification steps.", "包含证据、可能原因、修复建议和验证步骤的诊断报告。"),
    processing: local("Your browser, a Cloudflare edge probe, and the OpsKitPro Probe on AWS Lightsail each provide distinct observations.", "你的浏览器、Cloudflare 边缘探针和 AWS Lightsail 上的 OpsKitPro 探针分别提供独立观察结果。"),
    privacy: local("The target is sent to OpsKitPro probes to perform the requested public-network checks. Results are not published as public reports.", "目标地址会发送给 OpsKitPro 探针以执行公开网络检测；结果不会作为公开报告发布。"),
    limitation: local("A blocked server probe does not prove a website is down. WAF rules, geography, and DNS propagation can make observation points disagree.", "服务端探针被拦截不代表网站宕机；WAF、地域和 DNS 传播可能让不同观察点结果不一致。"),
    example: local("Check example.com after a deployment to confirm the final HTTP status, certificate, DNS, and security headers.", "网站发布后检查 example.com，确认最终 HTTP 状态、证书、DNS 和安全响应头。"),
    related: ["network-doctor", "dns-security"],
    lastReviewed: "2026-08-06",
  },
  "network-doctor": {
    purpose: local("Explain the current connection's latency, IPv6, DNS response, reachability, and edge context.", "解释当前网络的延迟、IPv6、DNS 响应、服务可达性和边缘节点信息。"),
    input: local("Your current browser connection; optional public hosts are used only for bounded reachability checks.", "当前浏览器网络；可选公开主机仅用于有限的可达性检测。"),
    output: local("Connection-quality measurements and clearly labeled browser, edge, and server-probe evidence.", "网络质量测量，以及明确标注的浏览器、边缘节点和服务端探针证据。"),
    processing: local("Measurements combine browser APIs, Cloudflare request context, and bounded OpsKitPro Probe requests.", "测量结合浏览器 API、Cloudflare 请求上下文和有限的 OpsKitPro 探针请求。"),
    privacy: local("Basic network context reaches OpsKitPro when server-assisted checks run. The tool does not require an account or store a public history.", "运行服务端辅助检测时，基础网络信息会发送到 OpsKitPro；无需账号，也不会保存公开历史。"),
    limitation: local("Browser timing is not a bandwidth benchmark, and one probe location cannot represent every user's route.", "浏览器计时不等同于专业带宽测速，单个探针位置也不能代表所有用户线路。"),
    example: local("Use it when a video call is unstable to compare latency, IPv6, DNS, and service reachability clues.", "视频通话不稳定时，用它对比延迟、IPv6、DNS 和服务可达性线索。"),
    related: ["website-check", "cloudflare-trace"],
    lastReviewed: "2026-08-06",
  },
  "dns-security": {
    purpose: local("Inspect DNS records and evidence for SPF, DMARC, and CAA policies.", "检查 DNS 记录以及 SPF、DMARC、CAA 策略证据。"),
    input: local("A public domain and, where supported, a DNS record type.", "公开域名，以及支持情况下的 DNS 记录类型。"),
    output: local("Resolved records plus evidence-led email and certificate-policy checks.", "解析到的记录，以及基于证据的邮件与证书策略检查。"),
    processing: local("Queries run through the OpsKitPro server-side DNS resolver.", "查询通过 OpsKitPro 服务端 DNS 解析器执行。"),
    privacy: local("The requested public domain is sent to OpsKitPro. No account is required and no private DNS zone is accessed.", "所查询的公开域名会发送到 OpsKitPro；无需账号，也不会访问私有 DNS 区域。"),
    limitation: local("A record's presence does not prove that mail delivery or anti-spoofing is configured correctly end to end.", "记录存在不代表邮件投递或反伪造配置在全链路上一定正确。"),
    example: local("Look up example.com to verify its A, MX, TXT, SPF, DMARC, and CAA evidence before changing DNS.", "修改 DNS 前查询 example.com，核对 A、MX、TXT、SPF、DMARC 和 CAA 证据。"),
    related: ["website-check", "api"],
    lastReviewed: "2026-08-06",
  },
  "ip-lookup": {
    purpose: local("Identify public IP ownership, ASN, provider, and approximate location hints.", "查询公网 IP 的归属、ASN、网络提供商和大致位置线索。"),
    input: local("A public IPv4 or IPv6 address, or your current public address.", "公网 IPv4、IPv6 地址，或当前公网地址。"),
    output: local("Country-level location, continent, ASN, network organization, and organization domain.", "国家级位置、洲、ASN、网络组织及组织域名。"),
    processing: local("Specified IPs are queried against a read-only IPinfo Lite database stored locally on the OpsKitPro server; current-visitor context may also use Cloudflare request metadata.", "指定 IP 通过 OpsKitPro 服务器本地只读的 IPinfo Lite 数据库查询；当前访客信息也可能使用 Cloudflare 请求元数据。"),
    privacy: local("The queried address reaches OpsKitPro but is not forwarded to an external lookup API. IP country data is approximate and should not be used to identify a person.", "所查询地址会到达 OpsKitPro，但不会再转发给外部 IP 查询 API；IP 国家数据是近似结果，不应用于识别个人。"),
    limitation: local("IPinfo Lite does not provide city, coordinates, timezone, hosting type, or VPN/proxy detection. Those fields remain explicitly unknown.", "IPinfo Lite 不提供城市、坐标、时区、托管类型或 VPN/代理检测；这些字段会明确保持未知。"),
    example: local("Check 8.8.8.8 to see its ASN and provider rather than assuming the user's physical location.", "查询 8.8.8.8 的 ASN 和提供商，不要把结果当作用户的精确物理位置。"),
    related: ["network-doctor", "cloudflare-trace"],
    lastReviewed: "2026-08-10",
  },
  "cloudflare-trace": {
    purpose: local("Explain how a request reaches Cloudflare, including colo, protocol, TLS, WARP, and Gateway context.", "解释请求如何到达 Cloudflare，包括机房、协议、TLS、WARP 和 Gateway 信息。"),
    input: local("Your current connection or a supported public target domain.", "当前网络连接，或受支持的公开目标域名。"),
    output: local("Parsed Cloudflare trace fields with plain-language labels.", "带有通俗说明的 Cloudflare Trace 字段。"),
    processing: local("Your own trace is observed at the Cloudflare edge; target checks may use an OpsKitPro server request.", "自身 Trace 在 Cloudflare 边缘观察；目标检测可能使用 OpsKitPro 服务端请求。"),
    privacy: local("Cloudflare and OpsKitPro receive normal request metadata. The result is not a proof of identity or exact location.", "Cloudflare 和 OpsKitPro 会接收常规请求信息；结果不能证明身份或精确位置。"),
    limitation: local("Trace fields describe one request path and can change between networks, devices, or moments.", "Trace 字段只描述一次请求路径，可能随网络、设备和时间变化。"),
    example: local("Compare the colo and protocol on home broadband and mobile data when only one network feels slow.", "只有一种网络较慢时，对比家庭宽带与移动网络的机房和协议字段。"),
    related: ["network-doctor", "ip-lookup"],
    lastReviewed: "2026-08-06",
  },
  api: {
    purpose: local("Run bounded DNS, IP, HTTP, and full diagnostic checks from scripts or agents.", "通过脚本或智能体调用有安全边界的 DNS、IP、HTTP 和完整诊断。"),
    input: local("Validated query parameters such as a public domain, IP address, or HTTP(S) URL.", "经过校验的查询参数，例如公开域名、IP 地址或 HTTP(S) 地址。"),
    output: local("Versioned JSON envelopes with result or error details and request metadata.", "带结果或错误详情及请求元数据的版本化 JSON 响应。"),
    processing: local("Requests run on OpsKitPro servers with SSRF, redirect, timeout, size, and rate-limit boundaries.", "请求在 OpsKitPro 服务端执行，并受 SSRF、跳转、超时、大小和频率限制保护。"),
    privacy: local("Inputs and normal server logs reach OpsKitPro. Do not send secrets, private hosts, tokens, or personal data.", "输入和常规服务日志会到达 OpsKitPro；请勿发送密钥、私有主机、令牌或个人数据。"),
    limitation: local("The public v0 API is rate-limited, unauthenticated, and unsuitable for private-network monitoring or guaranteed uptime SLAs.", "公开 v0 API 有频率限制且无需认证，不适合私网监控或可用性 SLA。"),
    example: local("Call the HTTP endpoint from CI to confirm a public release URL returns the expected final status.", "在 CI 中调用 HTTP 接口，确认公开发布地址返回预期最终状态。"),
    related: ["website-check", "dns-security"],
    lastReviewed: "2026-08-06",
  },
  json: {
    purpose: local("Format, repair, query, convert, validate, and compare JSON in one workspace.", "在一个工作区中格式化、修复、查询、转换、校验和对比 JSON。"),
    input: local("JSON text and optional JSONPath/jq-style queries, schemas, or comparison documents.", "JSON 文本，以及可选的查询、Schema 或对比文档。"),
    output: local("Formatted or repaired JSON, validation findings, extracted fields, conversions, and diffs.", "格式化或修复后的 JSON、校验结果、字段提取、格式转换和差异。"),
    processing: local("Processing runs in your browser.", "处理在你的浏览器本地完成。"),
    privacy: local("Pasted JSON is not sent to OpsKitPro by the tool. Browser extensions and the device environment remain outside our control.", "工具不会把粘贴的 JSON 发送到 OpsKitPro；浏览器扩展和设备环境不在本站控制范围内。"),
    limitation: local("Automatic repair is heuristic. Review the result before using it in production or signing data.", "自动修复基于规则推断；用于生产或数据签名前请人工核对。"),
    example: local("Paste a malformed API response, repair trailing commas, then validate it against a JSON Schema.", "粘贴格式错误的 API 响应，修复多余逗号，再用 JSON Schema 校验。"),
    related: ["api", "encode"],
    lastReviewed: "2026-08-06",
  },
  websocket: {
    purpose: local("Open and inspect WebSocket sessions, messages, templates, and ping behavior.", "建立并检查 WebSocket 会话、消息、模板和 Ping 行为。"),
    input: local("A ws:// or wss:// endpoint plus optional headers/subprotocols and message payloads.", "ws:// 或 wss:// 地址，以及可选的协议配置和消息内容。"),
    output: local("Connection state, timestamped incoming/outgoing messages, and ping observations.", "连接状态、带时间戳的收发消息和 Ping 观察结果。"),
    processing: local("The connection is opened directly by your browser to the endpoint you provide.", "连接由你的浏览器直接建立到所填写的目标地址。"),
    privacy: local("OpsKitPro does not relay message content, but the destination server receives everything you send.", "OpsKitPro 不转发消息内容，但目标服务器会收到你发送的所有数据。"),
    limitation: local("Browser security rules can block custom headers, insecure ws:// from HTTPS pages, or endpoints with certificate problems.", "浏览器安全规则可能阻止自定义请求头、HTTPS 页面中的 ws:// 或证书异常的服务。"),
    example: local("Connect to a test echo endpoint, send a JSON message, and inspect the returned frame and latency.", "连接测试 Echo 服务，发送 JSON 消息并检查返回帧和延迟。"),
    related: ["json", "api"],
    lastReviewed: "2026-08-06",
  },
  passgen: {
    purpose: local("Generate strong, customizable passwords without uploading them.", "生成可自定义的高强度密码，不上传密码内容。"),
    input: local("Length and character-set preferences such as uppercase, numbers, and symbols.", "长度及字符集偏好，例如大写字母、数字和符号。"),
    output: local("A generated password and an estimated strength indication.", "生成的密码及强度估计。"),
    processing: local("Generation runs in your browser using the device's cryptographic random source.", "使用设备的加密随机源在浏览器本地生成。"),
    privacy: local("Generated passwords are not sent to OpsKitPro. Clipboard managers and browser extensions may still observe copied text.", "生成的密码不会发送到 OpsKitPro；剪贴板管理器和浏览器扩展仍可能读取复制内容。"),
    limitation: local("A strong password still needs unique use and secure storage in a trusted password manager.", "高强度密码仍需避免复用，并保存在可信的密码管理器中。"),
    example: local("Generate a 20-character password with mixed case, numbers, and symbols for a new account.", "为新账号生成 20 位、包含大小写字母、数字和符号的密码。"),
    related: ["qrgen", "encode"],
    lastReviewed: "2026-08-06",
  },
  qrgen: {
    purpose: local("Turn links or short text into a downloadable QR code.", "把链接或短文本转换成可下载的二维码。"),
    input: local("A URL or short text plus size and appearance options.", "链接或短文本，以及尺寸和外观选项。"),
    output: local("A scannable QR preview and downloadable image.", "可扫码预览及可下载的二维码图片。"),
    processing: local("QR encoding and image generation run in your browser.", "二维码编码和图片生成在浏览器本地完成。"),
    privacy: local("Entered content is not sent to OpsKitPro by the generator. Anyone who scans the QR can read or open its content.", "生成器不会把输入内容发送到 OpsKitPro；任何扫码者都能读取或打开其中内容。"),
    limitation: local("Dense content, low contrast, small print, or a damaged image can reduce scan reliability. Test before distribution.", "内容过长、对比度低、印刷过小或图片损坏都会降低识别率，发布前请实测。"),
    example: local("Create a QR code for a store page, download it, and test it on two phones before printing.", "为店铺页面生成二维码，下载后先用两台手机测试再印刷。"),
    related: ["passgen", "encode"],
    lastReviewed: "2026-08-06",
  },
  encode: {
    purpose: local("Encode or decode URL components, Base64, HTML entities, and common text representations.", "编码或解码 URL、Base64、HTML 实体和常用文本表示。"),
    input: local("Text plus the selected encoding or decoding operation.", "文本及所选择的编码或解码方式。"),
    output: local("The converted text, ready to copy.", "转换后的可复制文本。"),
    processing: local("Conversion runs in your browser.", "转换在你的浏览器本地完成。"),
    privacy: local("Entered text is not sent to OpsKitPro by the tool. Do not mistake encoding for encryption.", "工具不会把输入文本发送到 OpsKitPro；编码不等于加密。"),
    limitation: local("The correct character encoding matters, and decoded content may be unsafe to execute or render as HTML.", "字符编码选择会影响结果；解码后的内容也可能不适合直接执行或渲染为 HTML。"),
    example: local("Decode a Base64 API value or safely encode a Chinese search term for a URL query parameter.", "解码 Base64 API 字段，或把中文搜索词安全编码为 URL 查询参数。"),
    related: ["json", "qrgen"],
    lastReviewed: "2026-08-06",
  },
  time: {
    purpose: local("Convert Unix timestamps and compare times across zones.", "转换 Unix 时间戳并比较不同时区时间。"),
    input: local("A timestamp, date/time, or timezone selection.", "时间戳、日期时间或时区选择。"),
    output: local("Human-readable local/UTC times and equivalent timestamps.", "易读的本地/UTC 时间及对应时间戳。"),
    processing: local("Conversion runs in your browser using its timezone database.", "使用浏览器时区数据库在本地完成转换。"),
    privacy: local("Entered dates and timestamps are not sent to OpsKitPro by the tool.", "输入的日期和时间戳不会发送到 OpsKitPro。"),
    limitation: local("Timezone rules and daylight-saving history vary; verify legally or financially sensitive deadlines with an authoritative source.", "时区和夏令时历史规则会变化；涉及法律或财务的重要期限请用权威来源复核。"),
    example: local("Convert 1775638800 into Beijing time and UTC when investigating a server log.", "排查服务器日志时，把 1775638800 转换成北京时间和 UTC。"),
    related: ["encode", "json"],
    lastReviewed: "2026-08-06",
  },
  "prompt-builder": {
    purpose: local("Turn a rough request into a reusable prompt with context, constraints, and output rules.", "把模糊需求整理成包含上下文、约束和输出规则的可复用提示词。"),
    input: local("Your task, background, constraints, examples, and desired output format.", "任务、背景、限制条件、示例和期望输出格式。"),
    output: local("A structured prompt you can copy into the AI service of your choice.", "可复制到所选 AI 服务中的结构化提示词。"),
    processing: local("Prompt assembly runs in your browser and does not call an AI model.", "提示词整理在浏览器本地完成，不调用 AI 模型。"),
    privacy: local("Entered content is not sent to OpsKitPro by the builder. The AI service you later use has its own data policy.", "构建器不会把输入内容发送到 OpsKitPro；之后使用的 AI 服务有其独立数据政策。"),
    limitation: local("Structure can improve clarity but cannot guarantee factual, safe, or consistent model output.", "清晰结构有助于表达，但不能保证模型输出事实正确、安全或稳定。"),
    example: local("Build a prompt that asks an AI to rewrite a customer notice in plain Chinese with a 120-character limit.", "构建提示词，让 AI 用通俗中文改写客户通知，并限制在 120 字内。"),
    related: ["json", "time"],
    lastReviewed: "2026-08-06",
  },
} satisfies Record<ProductToolId, ToolGuide>;

export function localizeToolGuide(id: ProductToolId, lang: ProductLocale) {
  const guide = toolGuides[id];
  return {
    purpose: guide.purpose[lang],
    input: guide.input[lang],
    output: guide.output[lang],
    processing: guide.processing[lang],
    privacy: guide.privacy[lang],
    limitation: guide.limitation[lang],
    example: guide.example[lang],
    related: guide.related,
    lastReviewed: guide.lastReviewed,
  };
}
