export type Lang = 'zh' | 'en' | 'ja' | 'tw'

export type BlogSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
  files?: string[]
}

export type BlogPost = {
  slug: string
  date: string
  readTime: string
  tag: string
  accent: string
  kbUrl: string
  actionKind: 'kb' | 'tool'
  coverImage: string
  titles: Record<Lang, string>
  summaries: Record<Lang, string>
  sections: BlogSection[]
  related: string[]
}

const posts: BlogPost[] = [
  {
    slug: 'why-opskitpro',
    date: '2026-04-18',
    readTime: '6 min',
    tag: '需求',
    accent: 'from-emerald-500/10 via-teal-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/blog',
    actionKind: 'kb',
    coverImage: '/blog-covers/why-opskitpro.svg',
    titles: {
      zh: '为什么我做 OpsKitPro：从排障痛点到工具平台',
      en: 'Why I built OpsKitPro: from troubleshooting pain points to a tool platform',
      ja: 'OpsKitPro を作った理由: 排障の痛みを一つの場所に集約する',
      tw: '我為什麼做 OpsKitPro：從排障痛點到工具平台',
    },
    summaries: {
      zh: '把 DNS、IP、网站诊断、SSL、CDN、WebSocket 这些高频动作收进一个地方，减少切换成本。',
      en: 'Bring DNS, IP, website checks, SSL, CDN, and WebSocket into one place to cut switching cost.',
      ja: 'DNS、IP、サイト診断、SSL、CDN、WebSocket を一箇所にまとめ、切り替えコストを下げます。',
      tw: '把 DNS、IP、網站診斷、SSL、CDN、WebSocket 這些高頻動作收進一個地方，降低切換成本。',
    },
    sections: [
      {
        heading: '需求不是“再做一个工具站”',
        paragraphs: [
          '我最初想解决的，不是“再做一个好看的首页”，而是运维过程中反复出现的切换成本。查 DNS 要去一个站，查 IP 要去另一个站，看 SSL 又是第三个站，最后还要把结果拼在一起自己判断。',
          '问题不在于工具少，而在于信息太散。每次排障都要重新建立上下文，语言、格式、结果粒度都不统一，结论很难复用。',
        ],
        files: ['src/app/page.tsx', 'src/app/tools/website-check/page.tsx', 'src/app/tools/ip-lookup/page.tsx'],
      },
      {
        heading: '我想把结果先变成结论',
        paragraphs: [
          'OpsKitPro 的第一原则，是先给结论，再给细节。首页、网站诊断、IP 查询、DNS 检测都尽量采用“摘要先行”的方式，让用户第一眼就知道发生了什么。',
          '这也是为什么我一直在收紧 loading、summary、detail 的层级：能在第一屏给出明确判断，就不要一上来把用户丢进长列表或大段 JSON 里。',
        ],
        files: ['src/lib/api-contracts.ts', 'src/app/api/diagnostic/route.ts', 'src/app/api/ip/route.ts'],
      },
      {
        heading: '项目边界要足够清楚',
        paragraphs: [
          '我没有把它做成大而全的平台。OpsKitPro 的目标很明确：围绕高频排障动作，做一个边缘可达、快速响应、可以直接拿来用的工具集合。',
          '所以我保留了服务矩阵、知识库和博客，但都围绕同一个主题展开：让运维动作更快、判断更清楚、文档更容易追踪。',
        ],
        files: ['README.md', 'README_zh.md', 'OpsKitPro_Backlog.md'],
      },
    ],
    related: ['design-principles', 'website-check-module', 'services-deployment'],
  },
  {
    slug: 'design-principles',
    date: '2026-04-19',
    readTime: '5 min',
    tag: '设计',
    accent: 'from-sky-500/10 via-cyan-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/blog',
    actionKind: 'kb',
    coverImage: '/blog-covers/design-principles.svg',
    titles: {
      zh: 'OpsKitPro 的设计原则：为什么我把 UI 做得更克制',
      en: 'OpsKitPro design principles: why the UI became more restrained',
      ja: 'OpsKitPro のデザイン原則: UI を控えめにした理由',
      tw: 'OpsKitPro 的設計原則：為什麼我把 UI 做得更克制',
    },
    summaries: {
      zh: '从 HUD 视感收口到浅色产品页，统一卡片、状态和文案，让页面更清楚。',
      en: 'The UI was tightened from a HUD vibe into a light product surface with unified cards, states, and copy.',
      ja: 'HUD 風からライトなプロダクト面へ寄せ、カード・状態・文言を統一しました。',
      tw: '從 HUD 視感收斂到淺色產品頁，統一卡片、狀態與文案，讓頁面更清楚。',
    },
    sections: [
      {
        heading: '为什么后来我把视觉收得更轻',
        paragraphs: [
          '项目早期的视觉更偏“运维控制台”与“HUD 仪表盘”风格，强调科技感和冲击力。但在实际使用中，这种风格会让信息显得太重，尤其是在日本用户习惯里，页面越清楚、越克制，越容易被认为是“认真做事”的产品。',
          '所以我逐步把主视觉收成了浅色卡片、明确标题、较低噪音的层级结构，让页面不只是“酷”，而是“稳”。',
        ],
        files: ['src/app/page.tsx', 'src/app/about/page.tsx', 'src/app/blog/page.tsx'],
      },
      {
        heading: '标准化比“风格化”更重要',
        paragraphs: [
          '真正把产品拉齐的，不是某个单独页面的炫技，而是卡片、badge、按钮、状态文案这些基础组件是否统一。我的目标是让用户不管进首页、服务矩阵还是工具页，都能立刻读懂这是同一个系统。',
          '这也是为什么后来我会反复收紧排版，减少中英混排里的“拼装感”，让页面语言和结构尽量一体化。',
        ],
        files: ['src/components/SiteHeader.tsx', 'src/components/HomeSearch.tsx', 'src/components/SiteFooter.tsx', 'src/app/services/ServicesClient.tsx'],
      },
      {
        heading: '日本用户视角下的收口',
        paragraphs: [
          '站点主要面向日本推广后，我更明确地把设计目标改成了“清楚、安定、轻量”。这意味着 hero 不要太吵、按钮不要太多、说明不要太虚，用户进入页面后应该先看到结论，再决定要不要继续看细节。',
          '所以你会看到首页、about、website-check、ip-lookup 这些页面的共同变化：更短的标题、更自然的文案、更低噪音的间距，以及更少的装饰性元素。',
        ],
        files: ['src/dictionaries/ja.json', 'src/app/tools/website-check/WebsiteCheckClient.tsx', 'src/app/tools/ip-lookup/IPLookupClient.tsx'],
      },
    ],
    related: ['why-opskitpro', 'website-check-module', 'services-deployment'],
  },
  {
    slug: 'website-check-module',
    date: '2026-04-20',
    readTime: '7 min',
    tag: '实现',
    accent: 'from-emerald-500/10 via-lime-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/blog',
    actionKind: 'kb',
    coverImage: '/blog-covers/website-check.svg',
    titles: {
      zh: '网站诊断模块是怎么做的：website-check 的实现拆解',
      en: 'How the website-check module works: a breakdown of the implementation',
      ja: 'website-check モジュールの実装解説',
      tw: '網站診斷模組怎麼做：website-check 的實作拆解',
    },
    summaries: {
      zh: '目标归一化、并行探测、部分成功回退和摘要优先，是这套诊断页的核心。',
      en: 'Target normalization, parallel probes, partial-success fallback, and summary-first UX are the core of the checker.',
      ja: '対象の正規化、並行プローブ、部分成功のフォールバック、要約先行が中核です。',
      tw: '目標歸一化、並行探測、部分成功回退與摘要優先，是這套診斷頁的核心。',
    },
    sections: [
      {
        heading: '先把目标“整理对”',
        paragraphs: [
          'website-check 的第一步不是发请求，而是把输入规范化。用户可能输入域名、完整 URL、带路径的链接，甚至夹着多余的尾斜杠。前端和后端都需要把这些输入统一收成真正的主机名，否则同一个目标会被当成多个对象。',
          '这一层小逻辑非常重要，因为它决定了诊断结果是否稳定，也决定了缓存和测试能不能复用。',
        ],
        files: ['src/app/tools/website-check/WebsiteCheckClient.tsx', 'src/app/api/diagnostic/route.ts'],
      },
      {
        heading: '并行探测比串行更适合这个页面',
        paragraphs: [
          '这类工具最常见的问题，是把 DNS、HTTP、SSL、CDN 拆成一条长流程，用户会先看见漫长的“第 1 步、第 2 步、第 3 步”。但真实的诊断更像并行工作：多个信号一起看，最后再汇总出结论。',
          '所以当前页面改成了摘要先行、明细折叠的结构。结果区先给出判断，再让用户根据需要展开 DNS、SSL、证书链或原始 JSON。',
        ],
        files: ['src/app/tools/website-check/WebsiteCheckClient.tsx', 'src/app/tools/website-check/page.tsx'],
      },
      {
        heading: '部分成功比“完全失败”更有用',
        paragraphs: [
          '在边缘环境里，外部服务不稳定是常态。与其让页面直接白屏或者返回一行错误，不如把能确认的部分先展示出来，再把不可用的部分明确标记为待确认。',
          '这也是我一直坚持“部分成功态”的原因：用户至少能知道 DNS、HTTP、SSL、CDN 中哪一环已经确认，接下来该往哪里看。',
        ],
        files: ['src/app/api/diagnostic/route.ts', 'src/lib/api-contracts.ts', 'src/app/tools/website-check/WebsiteCheckClient.tsx'],
      },
    ],
    related: ['why-opskitpro', 'ip-dns-module', 'services-deployment'],
  },
  {
    slug: 'ip-dns-module',
    date: '2026-04-21',
    readTime: '7 min',
    tag: '模块',
    accent: 'from-indigo-500/10 via-sky-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/blog',
    actionKind: 'kb',
    coverImage: '/blog-covers/ip-dns.svg',
    titles: {
      zh: 'IP 与 DNS 模块：把查询结果变成可读的诊断结论',
      en: 'IP and DNS modules: turning raw lookup data into readable conclusions',
      ja: 'IP と DNS モジュール: 取得結果を読みやすい結論に変える',
      tw: 'IP 與 DNS 模組：把查詢結果整理成可讀的診斷結論',
    },
    summaries: {
      zh: 'IP 页负责确认位置与接入环境，DNS 页负责交叉解析与多 resolver 比对。',
      en: 'The IP page confirms location and access context, while the DNS page cross-checks multiple resolvers.',
      ja: 'IP ページは接続環境の確認、DNS ページは複数リゾルバの比較を担います。',
      tw: 'IP 頁負責確認位置與接入環境，DNS 頁負責交叉解析與多 resolver 比對。',
    },
    sections: [
      {
        heading: 'IP 页要先给“可用结论”',
        paragraphs: [
          'IP 页的重点不是输出一大堆字段，而是先回答三个问题：我是谁、我从哪里来、我现在是不是在代理后面。为了做到这一点，页面优先展示地理位置、ASN、ISP、代理线索和当前连接来源。',
          '当外部查询不可用时，页面也不会直接崩掉，而是返回结构化的部分结果。用户依然能继续往下看，也能知道哪些信息来自 Cloudflare Context，哪些信息来自外部回退。',
        ],
        files: ['src/app/api/ip/route.ts', 'src/app/tools/ip-lookup/IPLookupClient.tsx', 'src/app/api/ip/__tests__/route.test.ts'],
      },
      {
        heading: 'DNS 页要做交叉验证，而不是单点查询',
        paragraphs: [
          'DNS 工具最重要的不是“查得到”，而是“查得一致”。所以我给它接了多个 resolver，并且把本地联查和远端接口结果一起展示出来。这样用户就能一眼看出问题是出在解析本身，还是出在某个节点。',
          '同时，A、AAAA、CNAME、MX、NS、TXT、CAA 都被纳入标准记录类型里，避免“DNS 查询”只剩一个粗糙的 A 记录结果。',
        ],
        files: ['src/app/api/dns/route.ts', 'src/app/tools/dns-lookup/DnsClient.tsx', 'src/app/tools/dns-lookup/components/DnsBatchResult.tsx'],
      },
      {
        heading: '统一输出格式，才能让 UI 真正变轻',
        paragraphs: [
          '之前这两个模块最容易出问题的地方，是字段名和展示层口径不完全一致。后来我把 API 契约抽成了共享 schema，前端和后端都基于同一份类型来理解“结果应该长什么样”。',
          '这样一来，页面上复制按钮、JSON 区、状态标签、提示语就能统一收口，不需要每个页面自己猜字段，也不会再出现同一项在不同页上叫法不同的情况。',
        ],
        files: ['src/lib/api-contracts.ts', 'src/app/tools/dns-lookup/components/DnsResultTable.tsx', 'src/app/tools/dns-lookup/components/DnsHistory.tsx'],
      },
    ],
    related: ['website-check-module', 'design-principles', 'services-deployment'],
  },
  {
    slug: 'services-deployment',
    date: '2026-04-22',
    readTime: '6 min',
    tag: '工程',
    accent: 'from-violet-500/10 via-fuchsia-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/blog',
    actionKind: 'kb',
    coverImage: '/blog-covers/services-standardization.svg',
    titles: {
      zh: '服务矩阵、国际化与 Cloudflare 部署：OpsKitPro 的工程收口',
      en: "Service matrix, i18n, and Cloudflare deployment: OpsKitPro's engineering wrap-up",
      ja: 'サービスマトリクス、i18n、Cloudflare デプロイ: OpsKitPro の工程整理',
      tw: '服務矩陣、國際化與 Cloudflare 部署：OpsKitPro 的工程收斂',
    },
    summaries: {
      zh: '把普通工具统一成标准卡片，Matrix 保留独立风格，再把整站部署到 Cloudflare Workers。',
      en: 'Standardize the regular tools into one card system, keep Matrix distinct, and deploy everything to Cloudflare Workers.',
      ja: '通常ツールを標準カードへ揃え、Matrix は独立した表現を保ったまま Workers にデプロイしています。',
      tw: '把普通工具統一成標準卡片，Matrix 保留獨立風格，再把整站部署到 Cloudflare Workers。',
    },
    sections: [
      {
        heading: '服务矩阵是站点的“导航总览”',
        paragraphs: [
          '服务矩阵不是单纯的工具列表，它更像站点的中央目录：普通运维工具、密码管理、安全分析、自动化、云原生、零信任、AI 节点都能在这里被快速定位。',
          '我后来把大多数工具统一成标准卡片，只保留 Matrix 使用独立视觉，是因为服务矩阵本身必须稳定、可扫视，不能每一块都抢注意力。',
        ],
        files: ['src/app/services/ServicesClient.tsx', 'src/dictionaries/zh.json', 'src/dictionaries/ja.json', 'src/dictionaries/en.json', 'src/dictionaries/tw.json'],
      },
      {
        heading: '国际化不是“翻译文件”，而是页面节奏',
        paragraphs: [
          '项目的多语言不只是文案翻译，而是整个页面节奏都要重做一遍。日文更偏克制、中文更偏直接、英文更偏线性说明，标题长度、 badge 位置、行距和空白都需要跟着变。',
          '这也是为什么我一直在调整首页、about、blog、tools 的视觉密度：同一份信息，在不同语言里不应该有完全不同的阅读压力。',
        ],
        files: ['src/middleware.ts', 'src/components/LanguageToggle.tsx', 'src/dictionaries.ts'],
      },
      {
        heading: 'Cloudflare Workers 是这个项目的落点',
        paragraphs: [
          '整个站点最终跑在 Cloudflare Workers 上，通过 OpenNext 做 Next.js 的适配和边缘部署。这样做的好处很明显：边缘就近、诊断场景一致、部署流程单一，也更符合这个项目“运维工具要快”的定位。',
          '博客、README、Backlog 和实际页面一起更新，也是在强调一个点：这个项目不是先写文档再做产品，而是产品、文章和工程记录同步推进。',
        ],
        files: ['src/app/layout.tsx', 'wrangler.jsonc', 'open-next.config.ts', 'README.md', 'OpsKitPro_Backlog.md'],
      },
    ],
    related: ['why-opskitpro', 'design-principles', 'ip-dns-module', 'passgen-tool', 'qrgen-tool', 'json-tool', 'websocket-tool'],
  },
  {
    slug: 'passgen-tool',
    date: '2026-04-22',
    readTime: '5 min',
    tag: '工具',
    accent: 'from-emerald-500/10 via-teal-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/tools/passgen',
    actionKind: 'tool',
    coverImage: '/blog-covers/passgen-tool.svg',
    titles: {
      zh: '密码生成器怎么做：passgen 的设计、实现、用途和用法',
      en: 'How the password generator works: design, implementation, use, and usage',
      ja: 'パスワード生成ツール passgen の設計・実装・使い方',
      tw: '密碼產生器怎麼做：passgen 的設計、實作、用途與用法',
    },
    summaries: {
      zh: '从随机源、模式切换、强度提示到复制与历史记录，收口成一个很快的密码工具。',
      en: 'From secure randomness and mode switching to strength hints, copy actions, and history, the tool stays fast.',
      ja: '安全な乱数、モード切替、強度表示、コピー、履歴をまとめた高速な生成ツールです。',
      tw: '從安全亂數、模式切換、強度提示到複製與歷史記錄，收斂成一個很快的密碼工具。',
    },
    sections: [
      {
        heading: '为什么需要一个更快的密码生成器',
        paragraphs: [
          'passgen 的目标很直接：让你在需要密码、UUID 或 PIN 的时候，不用去别的站点来回切换。很多时候，真正麻烦的不是生成本身，而是你还要决定格式、长度、是否能复制、是否要保留历史。',
          '所以我把它做成一个很快的单页工具，打开就能生成，生成完就能复制，也能顺手保存最近几次结果。',
        ],
        files: ['src/app/tools/passgen/pass-client.tsx', 'src/app/tools/passgen/page.tsx'],
      },
      {
        heading: '为什么我把设置压到最少',
        paragraphs: [
          '密码工具最常见的问题，是把设置做得太多。字符集、长度、特殊模式、强度条都可以堆上去，但用户在现场要的往往不是功能，而是一个马上可用的结果。',
          '所以我把模式分成两类：普通密码和特殊模式。UUID、PIN 与字符集模式互斥，避免用户选完以后又不知道自己生成了什么。',
        ],
        files: ['src/app/tools/passgen/pass-client.tsx', 'src/dictionaries/zh.json', 'src/dictionaries/ja.json'],
      },
      {
        heading: '实现和用法',
        paragraphs: [
          '实现上我用的是浏览器原生的 `crypto.randomUUID()` 和 `window.crypto.getRandomValues()`。这样做的好处是随机源可靠，而且不需要把敏感逻辑放到服务端。',
          '用法也很简单：先选长度或特殊模式，再点“生成”，然后复制结果。如果你希望把临时密码展示给别人，也可以切出 QR 码。',
        ],
        files: ['src/app/tools/passgen/pass-client.tsx', 'src/app/tools/passgen/__tests__/passgen.test.ts'],
      },
    ],
    related: ['qrgen-tool', 'json-tool', 'services-deployment'],
  },
  {
    slug: 'qrgen-tool',
    date: '2026-04-22',
    readTime: '4 min',
    tag: '工具',
    accent: 'from-cyan-500/10 via-sky-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/tools/qrgen',
    actionKind: 'tool',
    coverImage: '/blog-covers/qrgen-tool.svg',
    titles: {
      zh: '二维码生成器怎么做：qrgen 的设计、实现、用途和用法',
      en: 'How the QR generator works: design, implementation, use, and usage',
      ja: 'QR 生成ツール qrgen の設計・実装・使い方',
      tw: '二維碼產生器怎麼做：qrgen 的設計、實作、用途與用法',
    },
    summaries: {
      zh: '输入文本就能立刻生成二维码预览，并可下载成 PNG，适合链接和短文本分享。',
      en: 'Type text and instantly preview a QR code, then download it as PNG for links or short text sharing.',
      ja: 'テキストを入力すると即座に QR を生成し、PNG でダウンロードできます。',
      tw: '輸入文字即可即時預覽 QR Code，並可下載成 PNG，適合連結與短文本分享。',
    },
    sections: [
      {
        heading: '二维码工具真正要解决什么',
        paragraphs: [
          'qrgen 的使用场景很简单：把一段链接、配置片段、文案或者联系方式，快速变成可扫描的二维码。很多时候你并不需要复杂设置，你只需要一个清楚的预览和稳定的导出。',
          '因此这个页面的核心不是“花样很多”，而是“输入后马上能看见结果”。',
        ],
        files: ['src/app/tools/qrgen/qr-client.tsx', 'src/app/tools/qrgen/page.tsx'],
      },
      {
        heading: '为什么要保持单一主线',
        paragraphs: [
          '二维码工具如果做得太复杂，用户会困惑到底该调哪一项。我更希望它像一个“输入框 + 预览区”的二段式工具：左边输入，右边确认，按钮只保留下载这一件事。',
          '这样既能让页面足够轻，也能让扫描结果在视觉上更稳，特别适合日常临时分享。',
        ],
        files: ['src/app/tools/qrgen/qr-client.tsx', 'src/dictionaries/zh.json', 'src/dictionaries/ja.json'],
      },
      {
        heading: '实现和用法',
        paragraphs: [
          '实现上我直接用了 `qrcode.react` 的 `QRCodeSVG`，然后通过序列化 SVG 再转成 PNG 下载。这样生成过程完全在前端完成，不需要额外的后端依赖。',
          '使用时只要把内容贴进去，右侧就会出现预览。确认没问题后点下载即可，适合快速把链接、临时说明或者访问地址发给别人。',
        ],
        files: ['src/app/tools/qrgen/qr-client.tsx'],
      },
    ],
    related: ['passgen-tool', 'json-tool', 'services-deployment'],
  },
  {
    slug: 'json-tool',
    date: '2026-04-22',
    readTime: '7 min',
    tag: '工具',
    accent: 'from-violet-500/10 via-fuchsia-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/tools/json',
    actionKind: 'tool',
    coverImage: '/blog-covers/json-tool.svg',
    titles: {
      zh: 'JSON 整理器怎么做：json 的设计、实现、用途和用法',
      en: 'How the JSON toolkit works: design, implementation, use, and usage',
      ja: 'JSON 整形ツール json の設計・実装・使い方',
      tw: 'JSON 整理器怎麼做：json 的設計、實作、用途與用法',
    },
    summaries: {
      zh: '从校验、修复、格式化，到 jq、schema、对比与字段提取，一页完成。',
      en: 'Validation, repair, formatting, jq, schema, diff, and field extraction all live on one page.',
      ja: '検証、修復、整形、jq、schema、比較、抽出を 1 ページでまとめています。',
      tw: '從校驗、修復、格式化，到 jq、schema、比對與欄位擷取，一頁完成。',
    },
    sections: [
      {
        heading: '为什么把 JSON 工具做成工作台',
        paragraphs: [
          'JSON 工具最常见的使用场景，是把 API 返回、配置文件、日志片段或者抓到的对象先整理清楚。很多时候你不是想“写 JSON”，而是想“看懂 JSON”。',
          '所以我把它做成一个多模式工作台：输入、修复、格式化、对比、转换和提取都放在同一页里。',
        ],
        files: ['src/app/tools/json/json-client.tsx', 'src/app/tools/json/page.tsx'],
      },
      {
        heading: '为什么要拆成几个功能块',
        paragraphs: [
          'JSON 的处理其实是多个不同任务的组合：有时你要修坏 JSON，有时要格式化，有时要跑 jq，有时要生成 schema。把这些任务硬塞到一个按钮里，用户只会更乱。',
          '所以我把它拆成编辑器、修复、转换、比较、校验、提取几个区块，用户可以按自己的节奏逐步推进。',
        ],
        files: ['src/app/tools/json/components/FormatConverter.tsx', 'src/app/tools/json/components/JsonDiffPanel.tsx', 'src/app/tools/json/components/SchemaValidator.tsx'],
      },
      {
        heading: '实现和用法',
        paragraphs: [
          '实现上我把 JSON 修复、格式转换、jq 查询、schema 校验和字段提取都拆成了独立 hook / component。这样每个功能可以单独测试，也方便以后继续加新模式。',
          '用法上最简单的流程是：粘贴 JSON，先看校验状态，再决定是格式化、修复、转 YAML/TOML，还是直接跑 jq。需要对比时再切到 diff，需要抽字段时再进提取器。',
        ],
        files: ['src/app/tools/json/hooks/useFormatConvert.ts', 'src/app/tools/json/hooks/useJqQuery.ts', 'src/app/tools/json/hooks/useJsonRepair.ts', 'src/app/tools/json/hooks/useJsonStorage.ts'],
      },
    ],
    related: ['passgen-tool', 'websocket-tool', 'services-deployment'],
  },
  {
    slug: 'websocket-tool',
    date: '2026-04-22',
    readTime: '7 min',
    tag: '工具',
    accent: 'from-sky-500/10 via-cyan-500/10 to-transparent',
    kbUrl: 'https://opskitpro.com/tools/websocket',
    actionKind: 'tool',
    coverImage: '/blog-covers/websocket-tool.svg',
    titles: {
      zh: 'WebSocket 调试器怎么做：websocket 的设计、实现、用途和用法',
      en: 'How the WebSocket debugger works: design, implementation, use, and usage',
      ja: 'WebSocket デバッガーの設計・実装・使い方',
      tw: 'WebSocket 調試器怎麼做：websocket 的設計、實作、用途與用法',
    },
    summaries: {
      zh: '多连接、消息模板、二进制发送、会话保存与日志检索，面向实际调试。',
      en: 'Multi-connection tabs, message templates, binary sending, session saving, and log retrieval for real debugging.',
      ja: '複数接続、テンプレート、バイナリ送信、セッション保存、ログ確認をまとめたデバッガーです。',
      tw: '多連線、訊息模板、二進位傳送、會話保存與日誌檢索，面向實際調試。',
    },
    sections: [
      {
        heading: 'WebSocket 调试最麻烦的是什么',
        paragraphs: [
          'WebSocket 调试的难点，不只是“能不能连上”，而是连上之后要怎么发消息、怎么看日志、怎么留存会话。很多时候你还要同时调多个连接，或者在文本、JSON、二进制之间切换。',
          '所以我把它做成了一个多标签工作台，目标是让调试像开几个终端一样自然。',
        ],
        files: ['src/app/tools/websocket/WebsocketClient.tsx', 'src/app/tools/websocket/page.tsx'],
      },
      {
        heading: '为什么要拆成几个面板',
        paragraphs: [
          '一个 WebSocket 工具如果只有一块大输入框，通常不够用。真正调试时，你会同时关心连接状态、消息模板、发送内容、日志列表、统计信息和二进制编码。',
          '所以我把它拆成连接面板、消息编辑器、日志视图、统计面板、二进制构造器和会话管理几个部分。每块都小一点，组合起来反而更好用。',
        ],
        files: ['src/app/tools/websocket/components/ConnectionPanel.tsx', 'src/app/tools/websocket/components/MessageComposer.tsx', 'src/app/tools/websocket/components/LogViewer.tsx', 'src/app/tools/websocket/components/SessionManager.tsx'],
      },
      {
        heading: '实现和用法',
        paragraphs: [
          '实现上我用 `useWebSocket` 和 `useMultiConnection` 去管理连接状态、日志和发送逻辑。这样可以把连接生命周期、消息统计和会话切换拆开，避免一个巨大组件把所有事情都塞在一起。',
          '用法很直接：先输入 WebSocket 地址，再选文本或二进制模式，连接后发消息、看日志，需要时保存会话。对调试 echo 服务、内部推送或者实时通知都很方便。',
        ],
        files: ['src/app/tools/websocket/hooks/useWebSocket.ts', 'src/app/tools/websocket/hooks/useMultiConnection.ts', 'src/app/tools/websocket/hooks/useMessageTemplates.ts', 'src/app/tools/websocket/hooks/useMessageHistory.ts'],
      },
    ],
    related: ['json-tool', 'qrgen-tool', 'services-deployment'],
  },
]

function localize<T extends Record<Lang, unknown>>(value: T, lang: Lang) {
  return value[lang] ?? value.zh
}

export function getBlogPosts(lang: Lang) {
  return posts.map((post) => ({
    slug: post.slug,
    date: post.date,
    readTime: post.readTime,
    tag: post.tag,
    accent: post.accent,
    kbUrl: post.kbUrl,
    actionKind: post.actionKind,
    coverImage: post.coverImage,
    title: localize(post.titles, lang) as string,
    summary: localize(post.summaries, lang) as string,
    related: post.related,
  }))
}

export function getBlogPost(slug: string, lang: Lang) {
  const post = posts.find((entry) => entry.slug === slug)
  if (!post) return null

  return {
    ...post,
    title: localize(post.titles, lang) as string,
    summary: localize(post.summaries, lang) as string,
  }
}

export function getBlogPostSlugs() {
  return posts.map((post) => post.slug)
}
