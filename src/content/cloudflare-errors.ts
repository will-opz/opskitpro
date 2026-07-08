export type Lang = "zh" | "en";

export type ErrorResponsibility =
  "Cloudflare Edge" | "Origin Server" | "Client / Network" | "Configuration";

export type TroubleshootingStep = {
  title: Record<Lang, string>;
  content: Record<Lang, string>;
};

export type CloudflareError = {
  code: string;
  title: Record<Lang, string>;
  summary: Record<Lang, string>;
  responsibility: ErrorResponsibility;
  severity: "critical" | "warning" | "info";
  causes: Record<Lang, string[]>;
  troubleshooting: TroubleshootingStep[];
  relatedTools: string[];
  relatedErrors: string[];
};

const errors: CloudflareError[] = [
  {
    code: "520",
    title: {
      zh: "Web server is returning an unknown error",
      en: "Web server is returning an unknown error",
    },
    summary: {
      zh: "源站返回了空响应、非标准 HTTP 状态码或连接被重置，导致 Cloudflare 无法解析响应。",
      en: "The origin server returned an empty, unknown, or unexpected response to Cloudflare.",
    },
    responsibility: "Origin Server",
    severity: "critical",
    causes: {
      zh: [
        "源站崩溃或突然重启",
        "源站防火墙切断了处于激活状态的 TCP 连接",
        "源站返回了超过 8KB 的响应头",
        "源站返回了非法的 HTTP 状态码",
      ],
      en: [
        "Origin server crashed or restarted",
        "Origin firewall forcibly closed the TCP connection",
        "Response headers exceeded 8KB",
        "Origin returned an invalid HTTP status code",
      ],
    },
    troubleshooting: [
      {
        title: { zh: "检查源站日志", en: "Check Origin Logs" },
        content: {
          zh: "在源站的 Nginx / Apache 或应用日志中搜索发生 520 错误时间点的异常崩溃记录。",
          en: "Search Nginx/Apache or application logs on your origin for crashes matching the timestamp of the 520 error.",
        },
      },
      {
        title: { zh: "检查响应头大小", en: "Check Response Header Size" },
        content: {
          zh: "Cloudflare 限制响应头最大 8KB。如果应用程序返回了过多的 Set-Cookie，会触发 520。",
          en: "Cloudflare limits response headers to 8KB. Excessive Set-Cookie headers often trigger 520 errors.",
        },
      },
    ],
    relatedTools: ["website-check"],
    relatedErrors: ["521", "525"],
  },
  {
    code: "521",
    title: {
      zh: "Web server is down",
      en: "Web server is down",
    },
    summary: {
      zh: "Cloudflare 能够解析到源站的 IP，但源站拒绝了来自 Cloudflare 的连接（如端口未监听或服务已停止）。",
      en: "Cloudflare can resolve your origin IP, but the origin server refused the connection (e.g., service stopped or port closed).",
    },
    responsibility: "Origin Server",
    severity: "critical",
    causes: {
      zh: [
        "源站 Web 服务进程（如 Nginx/Apache）已停止",
        "源站服务器由于宕机而完全离线",
        "源站防火墙阻止了特定端口（80/443）的连接",
      ],
      en: [
        "Origin web service process (e.g., Nginx) is stopped",
        "Origin server is entirely offline",
        "Origin firewall blocks the port (80/443)",
      ],
    },
    troubleshooting: [
      {
        title: { zh: "确认服务状态", en: "Verify Service Status" },
        content: {
          zh: "登录源站，运行 `systemctl status nginx` 或 `netstat -tlnp` 确认 80/443 端口是否处于监听状态。",
          en: "Log into the origin and run `systemctl status nginx` or `netstat -tlnp` to ensure port 80/443 is listening.",
        },
      },
      {
        title: {
          zh: "检查安全组与防火墙",
          en: "Check Security Groups & Firewalls",
        },
        content: {
          zh: "确认源站的云服务提供商（如 AWS Security Group）允许所有来源 IP 访问 80/443 端口，或至少允许 Cloudflare IP 段访问。",
          en: "Ensure the origin cloud provider (e.g., AWS Security Group) allows ingress to 80/443 from all IPs, or at least Cloudflare IPs.",
        },
      },
    ],
    relatedTools: ["website-check", "network-check"],
    relatedErrors: ["522", "520", "523"],
  },
  {
    code: "522",
    title: {
      zh: "Connection timed out",
      en: "Connection timed out",
    },
    summary: {
      zh: "Cloudflare 与源站建立 TCP 连接时超时。通常是因为源站的防火墙拦截了 Cloudflare 的请求，或源站负载过高无法响应。",
      en: "Cloudflare timed out while contacting the origin server. This usually means the origin firewall is dropping Cloudflare requests or the origin is overloaded.",
    },
    responsibility: "Configuration",
    severity: "critical",
    causes: {
      zh: [
        "源站防火墙使用 DROP 规则拦截了 Cloudflare 的 IP",
        "源站路由或网络层出现严重故障",
        "源站服务器 CPU 占用 100% 无法建立新连接",
      ],
      en: [
        "Origin firewall drops Cloudflare IP requests",
        "Severe routing or network layer failure at the origin",
        "Origin CPU is at 100% and cannot accept new connections",
      ],
    },
    troubleshooting: [
      {
        title: {
          zh: "允许 Cloudflare IP 放行",
          en: "Whitelist Cloudflare IPs",
        },
        content: {
          zh: "522 最常见的原因是源站防火墙开启了防 CC 或限流策略，误伤了 Cloudflare 的回源 IP。请确保在源站的 iptables/安全组中将 Cloudflare IP 段加入白名单。",
          en: "The most common cause of 522 is origin rate-limiting or anti-DDoS rules dropping Cloudflare IPs. Whitelist all Cloudflare IP ranges in your origin iptables/firewall.",
        },
      },
      {
        title: { zh: "检查源站负载", en: "Check Origin Load" },
        content: {
          zh: "如果间歇性出现 522，通常意味着源站服务器可用连接耗尽。使用 `top` 或 `dmesg` 检查是否存在 TCP backlog 满或 OOM 现象。",
          en: "Intermittent 522 errors suggest the origin server is running out of available connections. Check `top` or `dmesg` for TCP backlog drops or OOM kills.",
        },
      },
    ],
    relatedTools: ["website-check"],
    relatedErrors: ["521", "523", "524"],
  },
  {
    code: "523",
    title: {
      zh: "Origin is unreachable",
      en: "Origin is unreachable",
    },
    summary: {
      zh: "Cloudflare 无法在网络层找到源站，通常是因为 DNS 记录配置错误，或源站路由不可达。",
      en: "Cloudflare cannot find the origin at the network layer. This typically means incorrect DNS records or the origin route is unreachable.",
    },
    responsibility: "Configuration",
    severity: "critical",
    causes: {
      zh: [
        "Cloudflare DNS 控制台中配置的源站 IP 不存在或输入错误",
        "源站使用的内网 IP (如 10.x.x.x) 被错误地配置到了公网 DNS",
      ],
      en: [
        "The origin IP configured in Cloudflare DNS is incorrect or no longer exists",
        "A private IP (e.g., 10.x.x.x) was accidentally configured in public DNS",
      ],
    },
    troubleshooting: [
      {
        title: { zh: "核对源站 IP", en: "Verify Origin IP" },
        content: {
          zh: "登录 Cloudflare Dashboard，检查 DNS 设置页中的 A 或 AAAA 记录，确保它们指向的是源站真实的公网 IP。",
          en: "Log into the Cloudflare Dashboard and check your DNS settings. Ensure the A or AAAA records point to your valid, public origin IP.",
        },
      },
    ],
    relatedTools: ["dns-lookup", "website-check"],
    relatedErrors: ["521", "522", "524"],
  },
  {
    code: "524",
    title: {
      zh: "A timeout occurred",
      en: "A timeout occurred",
    },
    summary: {
      zh: "Cloudflare 与源站成功建立了 TCP 连接，但在等待 HTTP 响应时超时（默认 100 秒）。这表明源站后端处理过慢。",
      en: "Cloudflare established a TCP connection but timed out waiting for the HTTP response (default 100s). Indicates a slow origin backend.",
    },
    responsibility: "Origin Server",
    severity: "critical",
    causes: {
      zh: [
        "源站执行了耗时很长的数据库查询或脚本处理",
        "后端应用产生了死锁",
        "在 100 秒内未能输出任何 HTTP 响应内容",
      ],
      en: [
        "Origin executed a long-running database query or heavy script",
        "Backend application deadlocked",
        "Origin failed to send any HTTP response data within 100 seconds",
      ],
    },
    troubleshooting: [
      {
        title: { zh: "优化后端执行时间", en: "Optimize Backend Processing" },
        content: {
          zh: "如果这是预期中的大文件生成或长报表导出任务，请不要通过阻塞的 HTTP 请求处理，应该改为异步任务系统并提供进度条。",
          en: "If a large file or heavy report is expected to take time, do not process it over a blocking HTTP request. Use background jobs and a progress poll instead.",
        },
      },
    ],
    relatedTools: ["website-check"],
    relatedErrors: ["522", "521", "520"],
  },
  {
    code: "525",
    title: {
      zh: "SSL handshake failed",
      en: "SSL handshake failed",
    },
    summary: {
      zh: "Cloudflare 尝试使用 HTTPS 回源时，与源站的 SSL/TLS 握手失败。",
      en: "Cloudflare failed to negotiate a successful SSL/TLS handshake with the origin server.",
    },
    responsibility: "Configuration",
    severity: "critical",
    causes: {
      zh: [
        '源站根本没有配置 SSL 证书，且 Cloudflare 加密模式设为了 "Full" 或 "Strict"',
        "源站使用的 TLS 版本过低（不支持 TLS 1.2+）",
        "SNI 配置不匹配",
      ],
      en: [
        'Origin has no SSL certificate configured, but Cloudflare encryption mode is "Full" or "Strict"',
        "Origin only supports deprecated TLS versions",
        "SNI configuration mismatch",
      ],
    },
    troubleshooting: [
      {
        title: {
          zh: "检查 Cloudflare SSL/TLS 模式",
          en: "Check Cloudflare SSL/TLS Mode",
        },
        content: {
          zh: '如果源站不支持 HTTPS (仅 80 端口)，请将 Cloudflare 中的 SSL/TLS 模式改为 "Flexible"。如果源站有自签证书，改为 "Full"。如果是受信任的 CA 证书，可使用 "Full (strict)"。',
          en: 'If the origin only supports HTTP (port 80), change Cloudflare SSL mode to "Flexible". If the origin has a self-signed certificate, use "Full". If it has a trusted CA certificate, use "Full (strict)".',
        },
      },
    ],
    relatedTools: ["website-check"],
    relatedErrors: ["526", "520"],
  },
  {
    code: "526",
    title: {
      zh: "Invalid SSL certificate",
      en: "Invalid SSL certificate",
    },
    summary: {
      zh: '源站配置了证书，但无法被验证通过。仅在 Cloudflare SSL/TLS 模式设置为 "Full (strict)" 时出现。',
      en: 'The origin certificate could not be validated. This error only occurs when Cloudflare SSL/TLS mode is set to "Full (strict)".',
    },
    responsibility: "Configuration",
    severity: "critical",
    causes: {
      zh: [
        "源站证书已过期",
        "源站使用的是自签名证书",
        "源站证书请求的主机名与访客请求的不匹配",
        "缺少中间证书链",
      ],
      en: [
        "Origin certificate expired",
        "Origin uses a self-signed certificate",
        "Origin certificate hostname mismatch",
        "Missing intermediate certificate chain",
      ],
    },
    troubleshooting: [
      {
        title: {
          zh: "更新源站证书或降级模式",
          en: "Update Origin Cert or Downgrade Mode",
        },
        content: {
          zh: '推荐方案：在源站使用 Let\'s Encrypt 或 Cloudflare Origin CA 重新签发一张合法长效的证书。\n临时方案：将 Cloudflare 中的 SSL 模式从 "Full (strict)" 降级为 "Full"。',
          en: 'Recommended: Re-issue a valid certificate on the origin using Let\'s Encrypt or Cloudflare Origin CA.\nWorkaround: Downgrade SSL mode from "Full (strict)" to "Full".',
        },
      },
    ],
    relatedTools: ["website-check"],
    relatedErrors: ["525", "1020"],
  },
  {
    code: "1006",
    title: {
      zh: "Access Denied",
      en: "Access Denied",
    },
    summary: {
      zh: "用户的访问由于 Cloudflare 的高危安全策略或 Bot Management 规则被拒绝。",
      en: "The user request was blocked by Cloudflare's high-security policies or Bot Management rules.",
    },
    responsibility: "Configuration",
    severity: "warning",
    causes: {
      zh: [
        "访问者的 IP 在黑名单中",
        "客户端行为被识别为恶意 Bot",
        "触发了严格的安全级别 (I'm Under Attack 模式)",
      ],
      en: [
        "Visitor IP is blacklisted",
        "Client behavior is identified as a malicious Bot",
        "Triggered high security level (Under Attack Mode)",
      ],
    },
    troubleshooting: [
      {
        title: {
          zh: "检查 Cloudflare Security Events",
          en: "Check Security Events",
        },
        content: {
          zh: "要求访客提供 Error 页面底部显示的 `Ray ID`，然后在 Cloudflare Dashboard -> Security -> Events 中搜索该 Ray ID 即可查看拦截原因。",
          en: "Ask the visitor for the `Ray ID` at the bottom of the error page, then search for it in Cloudflare Dashboard -> Security -> Events to see why it was blocked.",
        },
      },
    ],
    relatedTools: [],
    relatedErrors: ["1020", "1015"],
  },
  {
    code: "1015",
    title: {
      zh: "You are being rate limited",
      en: "You are being rate limited",
    },
    summary: {
      zh: "访客触发了 Cloudflare 上的速率限制 (Rate Limiting) 规则。这通常是我们作为防御者主动配置的保护机制。",
      en: "The visitor triggered a Rate Limiting rule on Cloudflare. This is usually an intentional protection mechanism configured by the defender.",
    },
    responsibility: "Client / Network",
    severity: "warning",
    causes: {
      zh: [
        "短时间内发送了大量请求触发了 WAF Rate Limiting 规则",
        "遭遇了暴力破解或扫描器",
      ],
      en: [
        "A massive number of requests sent in a short time triggered a WAF Rate Limiting rule",
        "Brute-force attack or scanner activity detected",
      ],
    },
    troubleshooting: [
      {
        title: { zh: "调整速率限制阈值", en: "Adjust Rate Limit Thresholds" },
        content: {
          zh: "如果 1015 误伤了正常用户或 API 调用，请前往 Cloudflare WAF -> Rate Limiting，调高允许的请求次数，或将合法的办公出口 IP 加入 Bypass 白名单。",
          en: "If 1015 is blocking legitimate users or APIs, go to Cloudflare WAF -> Rate Limiting and increase the request threshold, or add legitimate office IPs to the Bypass rules.",
        },
      },
    ],
    relatedTools: [],
    relatedErrors: ["1020", "1006"],
  },
  {
    code: "1020",
    title: {
      zh: "Access Denied (WAF Violation)",
      en: "Access Denied (WAF Violation)",
    },
    summary: {
      zh: "访客的请求违反了管理员配置的自定义防火墙 (WAF Custom Rules) 规则。这是 100% 由于站点管理员的策略导致。",
      en: "The visitor's request violated a custom firewall rule (WAF Custom Rules) configured by the administrator. This is entirely policy-driven.",
    },
    responsibility: "Configuration",
    severity: "warning",
    causes: {
      zh: [
        "请求的国家/地区被防火墙屏蔽 (Geo-blocking)",
        "请求的 User-Agent 被判定为爬虫并设置为 Block",
        "触发了自定义的 URI 或 Header 过滤规则",
      ],
      en: [
        "The requested Country/Region is blocked (Geo-blocking)",
        "User-Agent is blocked via custom rule",
        "A custom URI or Header filtering rule triggered a Block action",
      ],
    },
    troubleshooting: [
      {
        title: {
          zh: "使用 Ray ID 查找违规规则",
          en: "Trace Violation via Ray ID",
        },
        content: {
          zh: "让用户截图 1020 错误页底部的 Ray ID，前往 Cloudflare Dashboard -> Security -> Events，搜索此 Ray ID。系统会清晰指示具体触发了哪条你编写的 WAF 规则，据此进行规则修订或放行。",
          en: "Ask the user for the Ray ID from the 1020 error page. In Cloudflare Dashboard -> Security -> Events, search the Ray ID. It will precisely identify which custom WAF rule blocked the request so you can amend it.",
        },
      },
    ],
    relatedTools: [],
    relatedErrors: ["1015", "1006"],
  },
];

export function getCloudflareErrors() {
  return errors;
}

export function getCloudflareError(code: string) {
  return errors.find((e) => e.code === code) || null;
}

export function localize<T>(value: Record<Lang, T>, lang: Lang): T {
  return value[lang] ?? value.zh;
}
