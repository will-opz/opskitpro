export type Lang = "zh" | "en";

export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  files?: string[];
};

export type BlogPost = {
  slug: string;
  date: string;
  readTime: string;
  tag: string;
  accent: string;
  ctaUrl: string;
  actionKind: "kb" | "tool";
  coverImage: string;
  titles: Record<Lang, string>;
  summaries: Record<Lang, string>;
  sections: BlogSection[];
  related: string[];
};

const posts: BlogPost[] = [
  {
    slug: "api-v0-release",
    date: "2026-06-23",
    readTime: "4 min",
    tag: "Release",
    accent: "from-emerald-500/10 via-teal-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/en/tools/api",
    actionKind: "tool",
    coverImage: "/blog-covers/why-opskitpro.svg",
    titles: {
      zh: "OpsKitPro Public JSON API v0 正式发布：DNS、IP 与 HTTP 检测 API 上线",
      en: "OpsKitPro Public JSON API v0 Is Live: DNS, IP and HTTP Check APIs",
    },
    summaries: {
      zh: "探索专为开发者打造的 Public JSON API。无需鉴权，支持 curl，全面涵盖 DNS、IP 以及带 SSRF 防护的 HTTP 诊断能力。",
      en: "Use OpsKitPro Public JSON API for DNS lookup, IP lookup, and HTTP checks with curl, scripts, and automation workflows.",
    },
    sections: [
      {
        heading: "Introduction / 简介",
        paragraphs: [
          "OpsKitPro is thrilled to announce the launch of our Public JSON API v0. While our web UI is great for quick manual checks, we know that DevOps, SREs, and developers need programmable access to build automations, CI/CD integrations, and AI agent workflows.",
          "That is why we have extracted our core diagnostic engines into a set of clean, fast, and free public API endpoints.",
        ],
      },
      {
        heading: "What is Included in v0? / v0 包含哪些能力？",
        paragraphs: [
          "The v0 release introduces three foundational diagnostic APIs, all returning a standardized JSON envelope:",
        ],
        bullets: [
          "**DNS Lookup API**: Fetch global A, AAAA, MX, TXT, and CNAME records instantly.",
          "**IP Lookup API**: Get accurate GeoIP, ISP, ASN, and Proxy/VPN detection signals.",
          "**HTTP Check API**: Perform deep HTTP diagnostics with full redirect chain tracing and header analysis.",
        ],
      },
      {
        heading: "Built for Curl and Scripts / 为自动化而生",
        paragraphs: [
          "The API requires absolutely no authentication or API keys to start using. It is rate-limited fairly at 60 requests per minute per IP.",
          "Try it out right now in your terminal:",
        ],
        bullets: [
          '`curl -s "https://opskitpro.com/api/tools/dns-lookup?domain=example.com" | jq`',
          '`curl -s "https://opskitpro.com/api/tools/ip-lookup?ip=8.8.8.8" | jq`',
          '`curl -s "https://opskitpro.com/api/tools/http-check?url=https://example.com" | jq`',
        ],
      },
      {
        heading: "Enterprise-Grade Security (SSRF Protection)",
        paragraphs: [
          "Opening up an HTTP Check API to the public comes with immense security responsibilities. OpsKitPro v0 implements rigorous SSRF (Server-Side Request Forgery) mitigations.",
          "Our HTTP engine strictly enforces `http`/`https` protocols, blocks non-standard ports, and manually intercepts every single redirect hop to validate that the target hostname does not resolve to a private or internal network (DNS Rebinding protection).",
        ],
      },
      {
        heading: "Read the Documentation / 查看文档",
        paragraphs: [
          "For full details on endpoint parameters, response schemas, and rate limits, please visit our Developer API portal.",
        ],
      },
    ],
    related: ["diagnostic-tools-overview"],
  },
  {
    slug: "diagnostic-tools-overview",
    date: "2026-06-23",
    readTime: "8 min",
    tag: "平台",
    accent: "from-blue-500/10 via-indigo-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/tools/website-check",
    actionKind: "tool",
    coverImage: "/blog-covers/why-opskitpro.svg",
    titles: {
      zh: "OpsKitPro：面向 DevOps、SRE 和开发者的在线诊断工具箱",
      en: "OpsKitPro: Online Website, DNS, IP and Network Diagnostic Tools for Developers",
    },
    summaries: {
      zh: "从网站状态、网络连通性到 Public JSON API，OpsKitPro 如何帮助你快速排障。",
      en: "From website status and network connectivity to our Public JSON API, see how OpsKitPro helps you troubleshoot faster.",
    },
    sections: [
      {
        heading: "OpsKitPro 是什么？",
        paragraphs: [
          "OpsKitPro 是一个面向 DevOps、SRE、开发者和安全分析人员的在线工具集合。",
          "它不是一个臃肿的监控平台，也不是一个复杂的企业系统，而是一组可以随时打开、快速使用的轻量级工具。",
          "你可以把它理解成：一个专注于网络诊断、网站检查、DNS 查询、IP 查询和运维排障的在线工具箱。",
        ],
        bullets: [
          "网站状态检测",
          "网络连通性检查",
          "DNS 查询",
          "IP 信息查询",
          "HTTP Header 分析",
          "SSL/TLS 证书检查",
          "Cloudflare 相关诊断",
          "开发者常用数据处理工具",
        ],
      },
      {
        heading: "核心工具介绍",
        paragraphs: [
          "Website Check 适合用来快速判断一个网站是否正常工作，并输出基础诊断信息。包含状态码、跳转链、响应时间、安全头等。",
          "Network Check 关注的是网络层面的访问质量，帮助观察请求 IP、网络延迟、目标可达性，以及是否经过 Cloudflare 边缘节点。",
          "DNS Lookup 可以用来查询常见 DNS 记录，验证 CDN 接入是否生效、检查邮件相关记录或排查域名迁移后的解析问题。",
          "IP Lookup 用于查询 IP 所属地区、ASN、网络运营商等信息，帮助判断请求来源或排查访问控制问题。",
        ],
      },
      {
        heading: "Public JSON API：下一阶段方向",
        paragraphs: [
          "很多在线工具站只解决一个问题：打开网页，输入内容，获得结果。OpsKitPro 更进一步的方向是：让工具能力不仅可以被人使用，也可以被脚本、自动化系统和 AI Agent 使用。",
          "相比单纯提供页面，Public JSON API 价值更大，可以直接用于 Shell 脚本、CI/CD 检查、自动化巡检等。",
          "目前首批 API 已经支持 dns-lookup、ip-lookup 和 http-check，每个 API 都采用统一的返回格式。",
        ],
        files: [
          "src/app/api/tools/dns-lookup/route.ts",
          "src/app/api/tools/ip-lookup/route.ts",
          "src/app/api/tools/http-check/route.ts",
        ],
      },
      {
        heading: "OpsKitPro 的长期定位",
        paragraphs: [
          "OpsKitPro 的长期目标，不只是做一个工具集合，而是成为一个轻量、开放、可组合的运维工具平台。",
          "它的核心价值不是“功能很多”，而是：常用工具足够快，结果足够清晰，输出足够标准，能力可以被自动化系统复用。",
          "这三层能力（网页工具、结构化 API、AI Agent 可读）结合起来，才是真正有长期价值的方向。",
        ],
      },
    ],
    related: ["why-opskitpro", "design-principles", "json-tool"],
  },
  {
    slug: "why-opskitpro",
    date: "2026-04-18",
    readTime: "6 min",
    tag: "需求",
    accent: "from-emerald-500/10 via-teal-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/blog",
    actionKind: "kb",
    coverImage: "/blog-covers/why-opskitpro.svg",
    titles: {
      zh: "为什么我做 OpsKitPro：从排障痛点到工具平台",
      en: "Why I built OpsKitPro: from troubleshooting pain points to a tool platform",
    },
    summaries: {
      zh: "把 DNS、IP、网站诊断、SSL、CDN、WebSocket 这些高频动作收进一个地方，减少切换成本。",
      en: "Bring DNS, IP, website checks, SSL, CDN, and WebSocket into one place to cut switching cost.",
    },
    sections: [
      {
        heading: "需求不是“再做一个工具站”",
        paragraphs: [
          "我最初想解决的，不是“再做一个好看的首页”，而是运维过程中反复出现的切换成本。查 DNS 要去一个站，查 IP 要去另一个站，看 SSL 又是第三个站，最后还要把结果拼在一起自己判断。",
          "问题不在于工具少，而在于信息太散。每次排障都要重新建立上下文，语言、格式、结果粒度都不统一，结论很难复用。",
        ],
        files: [
          "src/app/page.tsx",
          "src/app/tools/website-check/page.tsx",
          "src/app/tools/ip-lookup/page.tsx",
        ],
      },
      {
        heading: "我想把结果先变成结论",
        paragraphs: [
          "OpsKitPro 的第一原则，是先给结论，再给细节。首页、网站诊断、IP 查询、DNS 检测都尽量采用“摘要先行”的方式，让用户第一眼就知道发生了什么。",
          "这也是为什么我一直在收紧 loading、summary、detail 的层级：能在第一屏给出明确判断，就不要一上来把用户丢进长列表或大段 JSON 里。",
        ],
        files: [
          "src/lib/api-contracts.ts",
          "src/app/api/diagnostic/route.ts",
          "src/app/api/ip/route.ts",
        ],
      },
      {
        heading: "项目边界要足够清楚",
        paragraphs: [
          "我没有把它做成大而全的平台。OpsKitPro 的目标很明确：围绕高频排障动作，做一个边缘可达、快速响应、可以直接拿来用的工具集合。",
          "所以我保留了服务矩阵、知识库和博客，但都围绕同一个主题展开：让运维动作更快、判断更清楚、文档更容易追踪。",
        ],
        files: ["README.md", "README_zh.md", "OpsKitPro_Backlog.md"],
      },
    ],
    related: [
      "design-principles",
      "website-check-module",
      "services-deployment",
    ],
  },
  {
    slug: "design-principles",
    date: "2026-04-19",
    readTime: "5 min",
    tag: "设计",
    accent: "from-sky-500/10 via-cyan-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/blog",
    actionKind: "kb",
    coverImage: "/blog-covers/design-principles.svg",
    titles: {
      zh: "OpsKitPro 的设计原则：为什么我把 UI 做得更克制",
      en: "OpsKitPro design principles: why the UI became more restrained",
    },
    summaries: {
      zh: "从 HUD 视感收口到浅色产品页，统一卡片、状态和文案，让页面更清楚。",
      en: "The UI was tightened from a HUD vibe into a light product surface with unified cards, states, and copy.",
    },
    sections: [
      {
        heading: "为什么后来我把视觉收得更轻",
        paragraphs: [
          "项目早期的视觉更偏“运维控制台”与“HUD 仪表盘”风格，强调科技感和冲击力。但在实际使用中，这种风格会让信息显得太重，尤其是在日本用户习惯里，页面越清楚、越克制，越容易被认为是“认真做事”的产品。",
          "所以我逐步把主视觉收成了浅色卡片、明确标题、较低噪音的层级结构，让页面不只是“酷”，而是“稳”。",
        ],
        files: [
          "src/app/page.tsx",
          "src/app/about/page.tsx",
          "src/app/blog/page.tsx",
        ],
      },
      {
        heading: "标准化比“风格化”更重要",
        paragraphs: [
          "真正把产品拉齐的，不是某个单独页面的炫技，而是卡片、badge、按钮、状态文案这些基础组件是否统一。我的目标是让用户不管进首页、服务矩阵还是工具页，都能立刻读懂这是同一个系统。",
          "这也是为什么后来我会反复收紧排版，减少中英混排里的“拼装感”，让页面语言和结构尽量一体化。",
        ],
        files: [
          "src/components/SiteHeader.tsx",
          "src/components/HomeSearch.tsx",
          "src/components/SiteFooter.tsx",
          "src/app/services/ServicesClient.tsx",
        ],
      },
      {
        heading: "日本用户视角下的收口",
        paragraphs: [
          "站点主要面向日本推广后，我更明确地把设计目标改成了“清楚、安定、轻量”。这意味着 hero 不要太吵、按钮不要太多、说明不要太虚，用户进入页面后应该先看到结论，再决定要不要继续看细节。",
          "所以你会看到首页、about、website-check、ip-lookup 这些页面的共同变化：更短的标题、更自然的文案、更低噪音的间距，以及更少的装饰性元素。",
        ],
        files: [
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
          "src/app/tools/ip-lookup/IPLookupClient.tsx",
        ],
      },
    ],
    related: ["why-opskitpro", "website-check-module", "services-deployment"],
  },
  {
    slug: "website-check-module",
    date: "2026-04-20",
    readTime: "7 min",
    tag: "实现",
    accent: "from-emerald-500/10 via-lime-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/blog",
    actionKind: "kb",
    coverImage: "/blog-covers/website-check.svg",
    titles: {
      zh: "网站诊断模块是怎么做的：website-check 的实现拆解",
      en: "How the website-check module works: a breakdown of the implementation",
    },
    summaries: {
      zh: "目标归一化、并行探测、部分成功回退和摘要优先，是这套诊断页的核心。",
      en: "Target normalization, parallel probes, partial-success fallback, and summary-first UX are the core of the checker.",
    },
    sections: [
      {
        heading: "先把目标“整理对”",
        paragraphs: [
          "website-check 的第一步不是发请求，而是把输入规范化。用户可能输入域名、完整 URL、带路径的链接，甚至夹着多余的尾斜杠。前端和后端都需要把这些输入统一收成真正的主机名，否则同一个目标会被当成多个对象。",
          "这一层小逻辑非常重要，因为它决定了诊断结果是否稳定，也决定了缓存和测试能不能复用。",
        ],
        files: [
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
          "src/app/api/diagnostic/route.ts",
        ],
      },
      {
        heading: "并行探测比串行更适合这个页面",
        paragraphs: [
          "这类工具最常见的问题，是把 DNS、HTTP、SSL、CDN 拆成一条长流程，用户会先看见漫长的“第 1 步、第 2 步、第 3 步”。但真实的诊断更像并行工作：多个信号一起看，最后再汇总出结论。",
          "所以当前页面改成了摘要先行、明细折叠的结构。结果区先给出判断，再让用户根据需要展开 DNS、SSL、证书链或原始 JSON。",
        ],
        files: [
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
          "src/app/tools/website-check/page.tsx",
        ],
      },
      {
        heading: "部分成功比“完全失败”更有用",
        paragraphs: [
          "在边缘环境里，外部服务不稳定是常态。与其让页面直接白屏或者返回一行错误，不如把能确认的部分先展示出来，再把不可用的部分明确标记为待确认。",
          "这也是我一直坚持“部分成功态”的原因：用户至少能知道 DNS、HTTP、SSL、CDN 中哪一环已经确认，接下来该往哪里看。",
        ],
        files: [
          "src/app/api/diagnostic/route.ts",
          "src/lib/api-contracts.ts",
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
        ],
      },
    ],
    related: ["why-opskitpro", "ip-dns-module", "services-deployment"],
  },
  {
    slug: "ip-dns-module",
    date: "2026-04-21",
    readTime: "7 min",
    tag: "模块",
    accent: "from-indigo-500/10 via-sky-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/blog",
    actionKind: "kb",
    coverImage: "/blog-covers/ip-dns.svg",
    titles: {
      zh: "IP 与 DNS 模块：把查询结果变成可读的诊断结论",
      en: "IP and DNS modules: turning raw lookup data into readable conclusions",
    },
    summaries: {
      zh: "IP 页负责确认位置与接入环境，DNS 页负责交叉解析与多 resolver 比对。",
      en: "The IP page confirms location and access context, while the DNS page cross-checks multiple resolvers.",
    },
    sections: [
      {
        heading: "IP 页要先给“可用结论”",
        paragraphs: [
          "IP 页的重点不是输出一大堆字段，而是先回答三个问题：我是谁、我从哪里来、我现在是不是在代理后面。为了做到这一点，页面优先展示地理位置、ASN、ISP、代理线索和当前连接来源。",
          "当外部查询不可用时，页面也不会直接崩掉，而是返回结构化的部分结果。用户依然能继续往下看，也能知道哪些信息来自 Cloudflare Context，哪些信息来自外部回退。",
        ],
        files: [
          "src/app/api/ip/route.ts",
          "src/app/tools/ip-lookup/IPLookupClient.tsx",
          "src/app/api/ip/__tests__/route.test.ts",
        ],
      },
      {
        heading: "DNS 页要做交叉验证，而不是单点查询",
        paragraphs: [
          "DNS 工具最重要的不是“查得到”，而是“查得一致”。所以我给它接了多个 resolver，并且把本地联查和远端接口结果一起展示出来。这样用户就能一眼看出问题是出在解析本身，还是出在某个节点。",
          "同时，A、AAAA、CNAME、MX、NS、TXT、CAA 都被纳入标准记录类型里，避免“DNS 查询”只剩一个粗糙的 A 记录结果。",
        ],
        files: [
          "src/app/api/dns/route.ts",
          "src/app/tools/dns-lookup/DnsClient.tsx",
          "src/app/tools/dns-lookup/components/DnsBatchResult.tsx",
        ],
      },
      {
        heading: "统一输出格式，才能让 UI 真正变轻",
        paragraphs: [
          "之前这两个模块最容易出问题的地方，是字段名和展示层口径不完全一致。后来我把 API 契约抽成了共享 schema，前端和后端都基于同一份类型来理解“结果应该长什么样”。",
          "这样一来，页面上复制按钮、JSON 区、状态标签、提示语就能统一收口，不需要每个页面自己猜字段，也不会再出现同一项在不同页上叫法不同的情况。",
        ],
        files: [
          "src/lib/api-contracts.ts",
          "src/app/tools/dns-lookup/components/DnsResultTable.tsx",
          "src/app/tools/dns-lookup/components/DnsHistory.tsx",
        ],
      },
    ],
    related: [
      "website-check-module",
      "design-principles",
      "services-deployment",
    ],
  },
  {
    slug: "cloudflare-dual-stack",
    date: "2026-05-24",
    readTime: "6 min",
    tag: "工程",
    accent: "from-cyan-500/10 via-sky-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/blog",
    actionKind: "kb",
    coverImage: "/blog-covers/cloudflare-dual-stack.svg",
    titles: {
      zh: "Cloudflare 双栈访问链路分层图：IPv6 开关该怎么判断",
      en: "Cloudflare dual-stack access layers: how to judge the IPv6 switch",
    },
    summaries: {
      zh: "把边缘、回源、客户端、解析和排障分开看，才能知道该开哪一层 IPv6。",
      en: "Separating edge, origin, client, DNS, and troubleshooting layers makes IPv6 decisions much clearer.",
    },
    sections: [
      {
        heading: "先把链路分层，才知道该关哪一层",
        paragraphs: [
          "Cloudflare 的双栈不是一个开关控制所有事情，而是至少有三层：客户端到 Cloudflare 边缘、Cloudflare 到源站的回源、源站本身的双栈能力。很多排障把这三层混在一起，就会把“回源不支持 IPv6”误判成“边缘 IPv6 不能开”。",
          "所以分析图最好先把 DNS、Edge、Origin、Client 分开，再看每层是否需要 IPv6。边缘是用户入口，回源是到源站，源站才决定你自己的基础设施能不能接住双栈。",
        ],
        files: [
          "src/app/api/diagnostic/route.ts",
          "src/app/api/ip/route.ts",
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
        ],
      },
      {
        heading: "Cloudflare IPv6 开关的决策表",
        bullets: [
          "公网站点 / SaaS / API：保留 IPv6。",
          "移动端流量较多：保留 IPv6。",
          "源站暂时不支持 IPv6：只关回源，不关边缘。",
          "需要做临时排障：可临时关闭排查。",
          "纯内网系统：按需决定。",
          "合规要求单栈：按制度执行。",
        ],
        paragraphs: [
          "最核心的一句话：默认保留 Cloudflare 边缘 IPv6，只按需控制源站是否 IPv6 回源。",
          "如果你只记住一条规则，就记住“边缘和回源不是一个开关”。边缘决定外部用户能不能更容易连上你，回源决定你的源站基础设施是否准备好了双栈。",
        ],
        files: [
          "src/app/tools/ip-lookup/IPLookupClient.tsx",
          "src/app/tools/dns-lookup/DnsClient.tsx",
        ],
      },
      {
        heading: "文章末尾可直接用的实操顺序",
        paragraphs: [
          "第一步：先别动边缘 IPv6。对于公网站点，Cloudflare 边缘 IPv6 默认保持开启。原因很简单：这能兼容更多移动端和双栈客户端，不会白白损失可达性。",
          "第二步：如果源站不支持 IPv6，先只关闭回源链路的 IPv6，确认源站、WAF、负载均衡和回源地址都稳定后，再判断是否要恢复。",
          "第三步：如果问题仍然存在，再看 DNS 记录、边缘状态和真实访问来源。很多“IPv6 问题”其实是解析、缓存、回源或防火墙问题，而不是边缘本身。",
        ],
        files: [
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
          "src/app/api/diagnostic/route.ts",
        ],
      },
      {
        heading: "什么时候才适合关掉边缘 IPv6",
        paragraphs: [
          "只有在你明确要做临时排障，或者制度要求单栈时，才考虑临时关掉边缘 IPv6。排障完成后，还是应该回到“边缘保留、回源按需控制”的默认策略。",
          "如果站点面向公网，默认策略应该更保守：尽量不牺牲入口可达性，只控制最可能出问题的那一层。",
        ],
        files: [
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
          "src/app/api/diagnostic/route.ts",
          "src/app/api/ip/route.ts",
        ],
      },
    ],
    related: ["website-check-module", "ip-dns-module", "services-deployment"],
  },
  {
    slug: "network-doctor-upgrade",
    date: "2026-06-14",
    readTime: "7 min",
    tag: "工具",
    accent: "from-emerald-500/10 via-cyan-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/tools/network-check",
    actionKind: "tool",
    coverImage: "/blog-covers/network-doctor.svg",
    titles: {
      zh: "把 Network Check 升级成 Network Doctor：让测速结果变成诊断结论",
      en: "Upgrading Network Check into Network Doctor: turning speed tests into diagnosis",
    },
    summaries: {
      zh: "这次优化新增 Cloudflare Trace 状态卡、DNS 解析器延迟和自动诊断总结，用来解释 WARP、Gateway、边缘节点和实时通信变慢之间的关系。",
      en: "This upgrade adds Cloudflare Trace status, DNS resolver latency, and diagnosis summaries to explain WARP, Gateway, edge POPs, and slow realtime apps.",
    },
    sections: [
      {
        heading: "这次为什么不新开一个大页面",
        paragraphs: [
          "今天的优化没有另起一个新的 Network Doctor 页面，而是直接把现有的 /tools/network-check 升级。原因很简单：用户已经把它当成网络质量入口，如果再拆出一个新页面，反而会让“测速”和“诊断”变成两个分散动作。",
          "更合理的方向，是让原来的 Network Check 继续负责入口和基础检测，再把 Cloudflare Trace、DNS latency、可达性和总结规则接进去。这样用户仍然只需要点一次检测，但结果不再只是“快不快”，而是能回答“为什么某些应用慢”。",
        ],
        files: [
          "src/app/tools/network-check/NetworkCheckClient.tsx",
          "src/app/tools/network-check/page.tsx",
        ],
      },
      {
        heading: "Cloudflare Trace 变成第一层网络上下文",
        paragraphs: [
          "这次把 /api/trace 的解析字段补齐了：warp、gateway、colo、http、tls、sni、kex、loc 都会被结构化出来。原来的文本 trace 仍然保留，Cloudflare Trace 专项页不会受影响；但 Network Check 可以直接读取这些字段，生成更具体的状态卡。",
          "状态卡重点展示 WARP 是否开启、是否 WARP+、Zero Trust Gateway 是否启用、当前命中的 Cloudflare Edge POP，以及 TLS/KEX 是否包含 MLKEM 或 Kyber 这类后量子密钥交换线索。这样用户看到 NRT、WARP+、Gateway off、X25519MLKEM768 时，不需要自己去解释每个字段。",
        ],
        files: [
          "src/app/api/trace/route.ts",
          "src/app/api/network/info/route.ts",
          "src/app/tools/cloudflare-trace/CloudflareTraceClient.tsx",
        ],
      },
      {
        heading: "DNS latency 补上“解析器视角”",
        paragraphs: [
          "很多网络问题看起来像带宽问题，实际却是解析器、路由或目标站链路问题。所以这次增加了 /api/network/dns-latency，用 DoH 方式测试 Cloudflare、Google、Quad9、OpenDNS 的解析延迟，并在 Network Check 页面展示。",
          "这里要注意，它不是客户端本机 DNS 的完整替代，而是从服务端或边缘视角给出公共解析器的相对耗时。它的价值在于快速判断：当前问题是否可能和 DNS 解析器选择有关，还是更应该继续看 WARP 路由、目标站可达性或长连接体验。",
        ],
        files: [
          "src/app/api/network/dns-latency/route.ts",
          "src/lib/api-contracts.ts",
          "src/app/tools/network-check/NetworkCheckClient.tsx",
        ],
      },
      {
        heading: "自动诊断总结要讲人话",
        paragraphs: [
          "工具最重要的优化不是多放几个字段，而是把字段变成一句可执行的结论。比如 warp=plus、gateway=off、colo=NRT 时，总结会直接说明 WARP+ 已开启并命中东京节点，Gateway 未启用。",
          "如果 kex 里包含 MLKEM 或 Kyber，总结会提示后量子密钥交换已启用，首次 TLS 握手可能有轻微额外耗时。如果基础延迟正常，但 Telegram、GitHub 等目标可达性较慢，则会提示吞吐或基础 ping 可能没问题，实时通信和长连接体验仍可能受 WARP 路由影响。",
        ],
        bullets: [
          "WARP+ + Gateway off：适合说明当前是 WARP 加速链路，但没有走 Zero Trust Gateway。",
          "NRT / LAX / SJC 等 Edge POP：帮助用户确认当前离哪个 Cloudflare 边缘最近。",
          "MLKEM / Kyber：提示后量子密钥交换，不把它误判成普通 TLS 字段。",
          "DNS latency + reachability：把“解析快不快”和“目标站慢不慢”分开看。",
        ],
        files: [
          "src/app/tools/network-check/NetworkCheckClient.tsx",
          "e2e/smoke.spec.ts",
        ],
      },
      {
        heading: "这和 OpsKitPro 的方向是一致的",
        paragraphs: [
          "OpsKitPro 后续不会只堆工具数量，而是继续把排障动作整理成可复用的判断。Network Doctor 这次升级就是一个例子：测速只是事实，诊断才是用户真正需要带走的东西。",
          "下一步可以继续沿着这个方向补充 1.1.1.1 状态检测、DNS Resolver 识别、即时通讯专项测试和可分享报告。重点不是做成复杂的测速站，而是保持轻量，让 SRE 或开发者在现场能更快知道下一步该查哪里。",
        ],
        files: [
          "src/app/tools/network-check/NetworkCheckClient.tsx",
          "src/app/tools/website-check/WebsiteCheckClient.tsx",
          "src/content/blog-posts.ts",
        ],
      },
    ],
    related: ["website-check-module", "cloudflare-dual-stack", "ip-dns-module"],
  },
  {
    slug: "services-deployment",
    date: "2026-04-22",
    readTime: "6 min",
    tag: "工程",
    accent: "from-violet-500/10 via-fuchsia-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/blog",
    actionKind: "kb",
    coverImage: "/blog-covers/services-standardization.svg",
    titles: {
      zh: "服务矩阵、国际化与 Lightsail 部署：OpsKitPro 的工程收口",
      en: "Service matrix, i18n, and Lightsail deployment: OpsKitPro's engineering wrap-up",
    },
    summaries: {
      zh: "把普通工具统一成标准卡片，Tools 保留独立风格，再把整站收束到 Lightsail standalone Node 部署。",
      en: "Standardize the regular tools into one card system, keep Tools distinct, and deploy the product as a Lightsail standalone Node service.",
    },
    sections: [
      {
        heading: "服务矩阵是站点的“导航总览”",
        paragraphs: [
          "服务矩阵不是单纯的工具列表，它更像站点的中央目录：普通运维工具、密码管理、安全分析、自动化、云原生、零信任、AI 节点都能在这里被快速定位。",
          "我后来把大多数工具统一成标准卡片，只保留 Tools 使用独立视觉，是因为服务矩阵本身必须稳定、可扫视，不能每一块都抢注意力。",
        ],
        files: [
          "src/app/services/ServicesClient.tsx",
          "src/dictionaries/zh.json",
          "src/dictionaries/en.json",
        ],
      },
      {
        heading: "国际化不是“翻译文件”，而是页面节奏",
        paragraphs: [
          "项目的多语言不只是文案翻译，而是整个页面节奏都要重做一遍。日文更偏克制、中文更偏直接、英文更偏线性说明，标题长度、 badge 位置、行距和空白都需要跟着变。",
          "这也是为什么我一直在调整首页、about、blog、tools 的视觉密度：同一份信息，在不同语言里不应该有完全不同的阅读压力。",
        ],
        files: [
          "src/middleware.ts",
          "src/components/LanguageToggle.tsx",
          "src/dictionaries.ts",
        ],
      },
      {
        heading: "Lightsail standalone Node 是当前产品运行时",
        paragraphs: [
          "主站现在以 Next.js standalone Node 服务运行在 AWS Lightsail 上，由 Nginx 承接入口流量。这让诊断工具可以使用更完整的 Node.js 运行时，也让产品主站和私有运维后台保持更一致的部署模型。",
          "博客、README、Backlog 和实际页面一起更新，也是在强调一个点：这个项目不是先写文档再做产品，而是产品、文章和工程记录同步推进。",
        ],
        files: [
          "src/app/layout.tsx",
          "scripts/package-standalone.sh",
          "README.md",
          "OpsKitPro_Backlog.md",
        ],
      },
    ],
    related: [
      "why-opskitpro",
      "design-principles",
      "ip-dns-module",
      "passgen-tool",
      "qrgen-tool",
      "json-tool",
      "websocket-tool",
    ],
  },
  {
    slug: "passgen-tool",
    date: "2026-04-22",
    readTime: "5 min",
    tag: "工具",
    accent: "from-emerald-500/10 via-teal-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/tools/passgen",
    actionKind: "tool",
    coverImage: "/blog-covers/passgen-tool.svg",
    titles: {
      zh: "密码生成器怎么做：passgen 的设计、实现、用途和用法",
      en: "How the password generator works: design, implementation, use, and usage",
    },
    summaries: {
      zh: "从随机源、模式切换、强度提示到复制与历史记录，收口成一个很快的密码工具。",
      en: "From secure randomness and mode switching to strength hints, copy actions, and history, the tool stays fast.",
    },
    sections: [
      {
        heading: "为什么需要一个更快的密码生成器",
        paragraphs: [
          "passgen 的目标很直接：让你在需要密码、UUID 或 PIN 的时候，不用去别的站点来回切换。很多时候，真正麻烦的不是生成本身，而是你还要决定格式、长度、是否能复制、是否要保留历史。",
          "所以我把它做成一个很快的单页工具，打开就能生成，生成完就能复制，也能顺手保存最近几次结果。",
        ],
        files: [
          "src/app/tools/passgen/pass-client.tsx",
          "src/app/tools/passgen/page.tsx",
        ],
      },
      {
        heading: "为什么我把设置压到最少",
        paragraphs: [
          "密码工具最常见的问题，是把设置做得太多。字符集、长度、特殊模式、强度条都可以堆上去，但用户在现场要的往往不是功能，而是一个马上可用的结果。",
          "所以我把模式分成两类：普通密码和特殊模式。UUID、PIN 与字符集模式互斥，避免用户选完以后又不知道自己生成了什么。",
        ],
        files: [
          "src/app/tools/passgen/pass-client.tsx",
          "src/dictionaries/zh.json",
        ],
      },
      {
        heading: "实现和用法",
        paragraphs: [
          "实现上我用的是浏览器原生的 `crypto.randomUUID()` 和 `window.crypto.getRandomValues()`。这样做的好处是随机源可靠，而且不需要把敏感逻辑放到服务端。",
          "用法也很简单：先选长度或特殊模式，再点“生成”，然后复制结果。如果你希望把临时密码展示给别人，也可以切出 QR 码。",
        ],
        files: [
          "src/app/tools/passgen/pass-client.tsx",
          "src/app/tools/passgen/__tests__/passgen.test.ts",
        ],
      },
    ],
    related: ["qrgen-tool", "json-tool", "services-deployment"],
  },
  {
    slug: "qrgen-tool",
    date: "2026-04-22",
    readTime: "4 min",
    tag: "工具",
    accent: "from-cyan-500/10 via-sky-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/tools/qrgen",
    actionKind: "tool",
    coverImage: "/blog-covers/qrgen-tool.svg",
    titles: {
      zh: "二维码生成器怎么做：qrgen 的设计、实现、用途和用法",
      en: "How the QR generator works: design, implementation, use, and usage",
    },
    summaries: {
      zh: "输入文本就能立刻生成二维码预览，并可下载成 PNG，适合链接和短文本分享。",
      en: "Type text and instantly preview a QR code, then download it as PNG for links or short text sharing.",
    },
    sections: [
      {
        heading: "二维码工具真正要解决什么",
        paragraphs: [
          "qrgen 的使用场景很简单：把一段链接、配置片段、文案或者联系方式，快速变成可扫描的二维码。很多时候你并不需要复杂设置，你只需要一个清楚的预览和稳定的导出。",
          "因此这个页面的核心不是“花样很多”，而是“输入后马上能看见结果”。",
        ],
        files: [
          "src/app/tools/qrgen/qr-client.tsx",
          "src/app/tools/qrgen/page.tsx",
        ],
      },
      {
        heading: "为什么要保持单一主线",
        paragraphs: [
          "二维码工具如果做得太复杂，用户会困惑到底该调哪一项。我更希望它像一个“输入框 + 预览区”的二段式工具：左边输入，右边确认，按钮只保留下载这一件事。",
          "这样既能让页面足够轻，也能让扫描结果在视觉上更稳，特别适合日常临时分享。",
        ],
        files: [
          "src/app/tools/qrgen/qr-client.tsx",
          "src/dictionaries/zh.json",
        ],
      },
      {
        heading: "实现和用法",
        paragraphs: [
          "实现上我直接用了 `qrcode.react` 的 `QRCodeSVG`，然后通过序列化 SVG 再转成 PNG 下载。这样生成过程完全在前端完成，不需要额外的后端依赖。",
          "使用时只要把内容贴进去，右侧就会出现预览。确认没问题后点下载即可，适合快速把链接、临时说明或者访问地址发给别人。",
        ],
        files: ["src/app/tools/qrgen/qr-client.tsx"],
      },
    ],
    related: ["passgen-tool", "json-tool", "services-deployment"],
  },
  {
    slug: "json-tool",
    date: "2026-04-22",
    readTime: "7 min",
    tag: "工具",
    accent: "from-violet-500/10 via-fuchsia-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/tools/json",
    actionKind: "tool",
    coverImage: "/blog-covers/json-tool.svg",
    titles: {
      zh: "JSON 整理器怎么做：json 的设计、实现、用途和用法",
      en: "How the JSON toolkit works: design, implementation, use, and usage",
    },
    summaries: {
      zh: "从校验、修复、格式化，到 jq、schema、对比与字段提取，一页完成。",
      en: "Validation, repair, formatting, jq, schema, diff, and field extraction all live on one page.",
    },
    sections: [
      {
        heading: "为什么把 JSON 工具做成工作台",
        paragraphs: [
          "JSON 工具最常见的使用场景，是把 API 返回、配置文件、日志片段或者抓到的对象先整理清楚。很多时候你不是想“写 JSON”，而是想“看懂 JSON”。",
          "所以我把它做成一个多模式工作台：输入、修复、格式化、对比、转换和提取都放在同一页里。",
        ],
        files: [
          "src/app/tools/json/json-client.tsx",
          "src/app/tools/json/page.tsx",
        ],
      },
      {
        heading: "为什么要拆成几个功能块",
        paragraphs: [
          "JSON 的处理其实是多个不同任务的组合：有时你要修坏 JSON，有时要格式化，有时要跑 jq，有时要生成 schema。把这些任务硬塞到一个按钮里，用户只会更乱。",
          "所以我把它拆成编辑器、修复、转换、比较、校验、提取几个区块，用户可以按自己的节奏逐步推进。",
        ],
        files: [
          "src/app/tools/json/components/FormatConverter.tsx",
          "src/app/tools/json/components/JsonDiffPanel.tsx",
          "src/app/tools/json/components/SchemaValidator.tsx",
        ],
      },
      {
        heading: "实现和用法",
        paragraphs: [
          "实现上我把 JSON 修复、格式转换、jq 查询、schema 校验和字段提取都拆成了独立 hook / component。这样每个功能可以单独测试，也方便以后继续加新模式。",
          "用法上最简单的流程是：粘贴 JSON，先看校验状态，再决定是格式化、修复、转 YAML/TOML，还是直接跑 jq。需要对比时再切到 diff，需要抽字段时再进提取器。",
        ],
        files: [
          "src/app/tools/json/hooks/useFormatConvert.ts",
          "src/app/tools/json/hooks/useJqQuery.ts",
          "src/app/tools/json/hooks/useJsonRepair.ts",
          "src/app/tools/json/hooks/useJsonStorage.ts",
        ],
      },
    ],
    related: ["passgen-tool", "websocket-tool", "services-deployment"],
  },
  {
    slug: "websocket-tool",
    date: "2026-04-22",
    readTime: "7 min",
    tag: "工具",
    accent: "from-sky-500/10 via-cyan-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/tools/websocket",
    actionKind: "tool",
    coverImage: "/blog-covers/websocket-tool.svg",
    titles: {
      zh: "WebSocket 调试器怎么做：websocket 的设计、实现、用途和用法",
      en: "How the WebSocket debugger works: design, implementation, use, and usage",
    },
    summaries: {
      zh: "多连接、消息模板、二进制发送、会话保存与日志检索，面向实际调试。",
      en: "Multi-connection tabs, message templates, binary sending, session saving, and log retrieval for real debugging.",
    },
    sections: [
      {
        heading: "WebSocket 调试最麻烦的是什么",
        paragraphs: [
          "WebSocket 调试的难点，不只是“能不能连上”，而是连上之后要怎么发消息、怎么看日志、怎么留存会话。很多时候你还要同时调多个连接，或者在文本、JSON、二进制之间切换。",
          "所以我把它做成了一个多标签工作台，目标是让调试像开几个终端一样自然。",
        ],
        files: [
          "src/app/tools/websocket/WebsocketClient.tsx",
          "src/app/tools/websocket/page.tsx",
        ],
      },
      {
        heading: "为什么要拆成几个面板",
        paragraphs: [
          "一个 WebSocket 工具如果只有一块大输入框，通常不够用。真正调试时，你会同时关心连接状态、消息模板、发送内容、日志列表、统计信息和二进制编码。",
          "所以我把它拆成连接面板、消息编辑器、日志视图、统计面板、二进制构造器和会话管理几个部分。每块都小一点，组合起来反而更好用。",
        ],
        files: [
          "src/app/tools/websocket/components/ConnectionPanel.tsx",
          "src/app/tools/websocket/components/MessageComposer.tsx",
          "src/app/tools/websocket/components/LogViewer.tsx",
          "src/app/tools/websocket/components/SessionManager.tsx",
        ],
      },
      {
        heading: "实现和用法",
        paragraphs: [
          "实现上我用 `useWebSocket` 和 `useMultiConnection` 去管理连接状态、日志和发送逻辑。这样可以把连接生命周期、消息统计和会话切换拆开，避免一个巨大组件把所有事情都塞在一起。",
          "用法很直接：先输入 WebSocket 地址，再选文本或二进制模式，连接后发消息、看日志，需要时保存会话。对调试 echo 服务、内部推送或者实时通知都很方便。",
        ],
        files: [
          "src/app/tools/websocket/hooks/useWebSocket.ts",
          "src/app/tools/websocket/hooks/useMultiConnection.ts",
          "src/app/tools/websocket/hooks/useMessageTemplates.ts",
          "src/app/tools/websocket/hooks/useMessageHistory.ts",
        ],
      },
    ],
    related: ["json-tool", "qrgen-tool", "services-deployment"],
  },
  {
    slug: "vibe-coding-workflow",
    date: "2026-04-28",
    readTime: "6 min",
    tag: "AI",
    accent: "from-emerald-500/10 via-cyan-500/10 to-transparent",
    ctaUrl: "https://opskitpro.com/tools/prompt-builder",
    actionKind: "tool",
    coverImage: "/blog-covers/vibe-coding-workflow.svg",
    titles: {
      zh: "Vibe Coding 怎么落地：把 AI 辅助开发变成可验证的工程流程",
      en: "Vibe Coding in practice: turning AI-assisted coding into a verified engineering workflow",
    },
    summaries: {
      zh: "从想法到 prompt、代码、测试、记录和部署，关键不是让 AI 随便写，而是给它明确边界。",
      en: "From idea to prompt, code, tests, notes, and deployment, the point is not loose automation but clear guardrails.",
    },
    sections: [
      {
        heading: "Vibe Coding 不是放弃工程纪律",
        paragraphs: [
          "Vibe Coding 的价值在于把自然语言变成可执行的工程动作，但这不等于把判断权全部交给模型。真正适合 OpsKitPro 的做法，是让 AI 负责生成和修改，让人负责目标、边界、审查和验收。",
          "所以我把它整理成一个更稳的工作流：先描述目标，再限定范围，再声明不要改什么，最后要求测试、构建和记录。这样 AI 能快起来，但不会把项目带偏。",
        ],
        files: [
          "src/app/tools/prompt-builder/prompt-builder-client.tsx",
          "src/app/services/ServicesClient.tsx",
        ],
      },
      {
        heading: "OpsKitPro 的 AI 工程闭环",
        paragraphs: [
          "我的固定流程是：先读项目记录和约定，先写方案，再做最小必要改动，跑测试和构建，最后把结果、风险和回滚点写回 Obsidian。这个流程看起来慢一点，但能显著减少“改了很多却说不清为什么”的问题。",
          "Prompt Builder 的作用，就是把这个流程产品化。它不会保存内容，也不会调用外部 API，只在浏览器本地把任务说明整理成一段可以交给 Codex、Cursor 或 Claude Code 的工程 prompt。",
        ],
        files: [
          "src/app/tools/prompt-builder/page.tsx",
          "src/app/tools/prompt-builder/prompt-builder-client.tsx",
        ],
      },
      {
        heading: "Review & Deploy Checklist",
        paragraphs: [
          "进入 review 和 deploy 前，我会检查几件事：有没有越过 public/private 边界，是否只改了直接相关文件，是否没有新增不必要依赖，测试和构建是否通过，Obsidian 是否记录了结果。",
          "如果涉及公开内容，尤其不能把草稿、内部路径、token、排障细节或不确定是否公开的资料带进主站。Vibe Coding 可以加速实现，但不能替代边界判断。",
        ],
        bullets: [
          "确认范围：只改本次任务直接相关文件。",
          "确认边界：只使用已公开、已整理内容。",
          "确认质量：测试、类型检查、构建都通过。",
          "确认记录：方案、结果、风险和回滚点写回 Obsidian。",
        ],
        files: ["src/dictionaries/en.json", "src/app/sitemap.ts"],
      },
    ],
    related: ["design-principles", "services-deployment", "json-tool"],
  },
  {
    slug: "underestimating-git",
    date: "2026-06-01",
    readTime: "8 min",
    tag: "复盘",
    accent: "from-orange-500/10 via-emerald-500/10 to-cyan-500/10",
    ctaUrl: "https://opskitpro.com",
    actionKind: "kb",
    coverImage: "/blog-covers/git-ops-reflection.svg",
    titles: {
      zh: "翻到 8 年前自己在 V2EX 的回复，发现当年我真低估了 Git",
      en: "I found my V2EX reply from 8 years ago and realized I underestimated Git",
    },
    summaries: {
      zh: "从 SVN 和 Git 的旧判断，复盘运维视角里的工具演进、工程协作和 OpsKitPro 的整理方向。",
      en: "A reflection on SVN, Git, DevOps collaboration, and why OpsKitPro is becoming a cleaned-up operations notebook.",
    },
    sections: [
      {
        heading: "8 年前，我真觉得 SVN 和 Git 没太大差别",
        paragraphs: [
          "今天偶然翻到自己 8 年前在 V2EX 的一条回复。那时有人讨论“公司还在用 SVN，会不会显得技术落后”，我在下面回了一句：作为运维来说，真心没感觉 SVN 和 Git 在实际业务环境上有啥差别。",
          "现在看这句话，脸上会有点发烫。但如果把时间拉回 2018 年左右，当时的逻辑并不是完全不可理解。那时很多团队的发布方式很简单：代码进 SVN，Jenkins 拉下来，打包，测试环境过一遍，再顺次推到生产。运维最关心的是服务能不能起来、发布别挂、数据别丢、出事能不能回滚。",
          "在这种人肉或半自动化发布时代，SVN 确实够用。那时我看到的 Git，只是另一个“存代码的仓库”。我没有真正看到它背后会长出来什么。",
        ],
      },
      {
        heading: "后来才发现，我低估的不是 Git，而是研发效能生态",
        paragraphs: [
          "这些年回头看，Git 赢的从来不只是版本管理。它真正改变的是团队协作方式：GitHub、GitLab、Pull Request、Code Review、CI/CD、Infrastructure as Code、GitOps，一层一层叠起来，最后变成了现代软件工程默认的工作流。",
          "大多数团队今天也未必每天都在用 Git 最炫的“分布式本地提交”能力。但很少有团队愿意回到没有 Code Review、没有自动化 CI、没有基于代码变更触发部署的时代。",
          "当我后来在生产里高频接触 GitHub Actions、Terraform、ArgoCD 时，才彻底意识到：Git 早就不是一个代码管理工具了，它已经变成研发协作的空气和水。",
        ],
      },
      {
        heading: "但有些“保守”，今天看依然是对的",
        paragraphs: [
          "当年我还补了一句：“高可用方案还是怎么简单怎么来吧。”这句话我到今天依然认。",
          "干运维越久，越会发现技术先进和业务价值经常不是一回事。很多系统最后不是死于性能瓶颈，而是死于架构复杂度过高，团队没有足够的人力、经验和心智带宽去长期维护。",
          "Kubernetes 当然很好，但两三个人的小团队、业务规模有限时，ECS 也许更稳。ClickHouse 集群当然强，但如果未来一年数据量并不会爆，先把单机和备份做好可能更实际。最好的架构不是最先进的架构，而是贴合团队能力、半夜出事也能被稳定接住的架构。",
        ],
      },
      {
        heading: "从 SVN 到 AWS，再到 AI Workflow",
        paragraphs: [
          "十几年过去，手里的工具换了一轮又一轮。刚工作时是 SVN、Jenkins、MySQL、Nginx；后来变成 Git、AWS、Cloudflare、Terraform；这几年又多了 AI Workflow、Agent、LLM 和新一代自动化工具。",
          "工具会变，但运维要解决的底层命题几乎没有变：稳定性、可维护性、成本控制、自动化。真正值得沉淀的，不只是某个命令或某个配置，而是这些工具背后的判断标准。",
          "所以我现在更愿意把“当时为什么这么选”“后来哪里看错了”“哪些原则依然有效”写下来。技术债不只存在于代码里，也存在于人的判断里。",
        ],
      },
      {
        heading: "为什么把这些整理成 OpsKitPro",
        paragraphs: [
          "这些年踩过的坑、背过的锅，最后都散落成脚本、检查工具、排障文档和自动化流程。有的在服务器角落，有的在私有仓库里，有的只存在于脑子里的经验判断。",
          "OpsKitPro 的初衷很简单：把这些“过去用过、后来证明有用”的东西整理出来，变成一个干净、轻量、可复用的运维工具箱。它不是为了做一个大而全的工具站，而是把排障时真正高频、真正节省时间的动作收进一个地方。",
          "如果这些整理能让自己少翻几次旧脚本，也能让另一个深夜排障的同行省下几分钟，那这件事就值得继续做下去。",
        ],
      },
      {
        heading: "以后网站的方向：对自己之前的整理",
        paragraphs: [
          "接下来 OpsKitPro 会更明确地围绕“对过去经验的整理”来设计。工具不只是入口，文章也不只是内容营销；它们应该共同回答一个问题：一个 SRE 在真实排障、选型、发布和复盘中，如何把经验变成可复用的判断。",
          "网站信息架构可以分成三条线：诊断工具用于快速确认事实，运维复盘用于解释判断如何形成，工程工作流用于把这些判断固化成流程。首页也应该更直接地表达这个定位：把过去的排障脚本、检查清单和运维经验整理成可复用的 SRE 工作台。",
          "这样 OpsKitPro 就不是“又一个工具合集”，而是一个不断被整理、验证、修订的公开运维笔记本。工具负责快，文章负责深，历史复盘负责让判断越来越准。",
        ],
        bullets: [
          "首页首屏突出“整理过去的排障经验，变成今天可复用的工具”。",
          "博客新增“运维复盘”分类，把 Git、架构选型、发布事故、工具演进这些长期判断沉淀下来。",
          "工具页增加“为什么这个检查项重要”的短说明，让结果不只是数据，也能形成判断。",
          "每篇复盘文章都尽量关联一个工具、一个流程或一个检查清单，避免内容和产品脱节。",
        ],
      },
    ],
    related: [
      "vibe-coding-workflow",
      "services-deployment",
      "design-principles",
    ],
  },
];

function localize<T extends Record<Lang, unknown>>(value: T, lang: Lang) {
  return value[lang] ?? value.zh;
}

export function getBlogPosts(lang: Lang) {
  return posts.map((post) => ({
    slug: post.slug,
    date: post.date,
    readTime: post.readTime,
    tag: post.tag,
    accent: post.accent,
    ctaUrl: post.ctaUrl,
    actionKind: post.actionKind,
    coverImage: post.coverImage,
    title: localize(post.titles, lang) as string,
    summary: localize(post.summaries, lang) as string,
    related: post.related,
  }));
}

export function getBlogPost(slug: string, lang: Lang) {
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) return null;

  return {
    ...post,
    title: localize(post.titles, lang) as string,
    summary: localize(post.summaries, lang) as string,
  };
}

export function getBlogPostSlugs() {
  return posts.map((post) => post.slug);
}
