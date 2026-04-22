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
    kbUrl: 'https://kb.opskitpro.com/02_Articles/opskitpro-requirements',
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
        heading: '1. 需求不是“再做一个工具站”',
        paragraphs: [
          '我最初想解决的，不是“再做一个好看的首页”，而是运维过程中反复出现的切换成本。查 DNS 要去一个站，查 IP 要去另一个站，看 SSL 又是第三个站，最后还要把结果拼在一起自己判断。',
          '问题不在于工具少，而在于信息太散。每次排障都要重新建立上下文，语言、格式、结果粒度都不统一，结论很难复用。',
        ],
        bullets: [
          '同一件事要反复在多个站点之间切换。',
          '结果能看到，但很难被真正拿来做下一步判断。',
          '多语言界面一旦不统一，阅读成本会立刻上升。',
        ],
        files: ['src/app/page.tsx', 'src/app/tools/website-check/page.tsx', 'src/app/tools/ip-lookup/page.tsx'],
      },
      {
        heading: '2. 我想把结果先变成结论',
        paragraphs: [
          'OpsKitPro 的第一原则，是先给结论，再给细节。首页、网站诊断、IP 查询、DNS 检测都尽量采用“摘要先行”的方式，让用户第一眼就知道发生了什么。',
          '这也是为什么我一直在收紧 loading、summary、detail 的层级：能在第一屏给出明确判断，就不要一上来把用户丢进长列表或大段 JSON 里。',
        ],
        bullets: [
          '页面先给可用结论，再让用户按需展开。',
          '错误态和部分成功态比“空白失败”更有价值。',
          '结果可复制、可分享、可继续排查。',
        ],
        files: ['src/lib/api-contracts.ts', 'src/app/api/diagnostic/route.ts', 'src/app/api/ip/route.ts'],
      },
      {
        heading: '3. 项目边界要足够清楚',
        paragraphs: [
          '我没有把它做成大而全的平台。OpsKitPro 的目标很明确：围绕高频排障动作，做一个边缘可达、快速响应、可以直接拿来用的工具集合。',
          '所以我保留了服务矩阵、知识库和博客，但都围绕同一个主题展开：让运维动作更快、判断更清楚、文档更容易追踪。',
        ],
        bullets: [
          '不追求“什么都能做”，只做高频动作。',
          '工具、文档、博客保持同一套语言和口径。',
          '工程结构要轻，但不能轻到没有边界。',
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
    kbUrl: 'https://kb.opskitpro.com/02_Articles/opskitpro-design-principles',
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
        heading: '1. 为什么后来我把视觉收得更轻',
        paragraphs: [
          '项目早期的视觉更偏“运维控制台”与“HUD 仪表盘”风格，强调科技感和冲击力。但在实际使用中，这种风格会让信息显得太重，尤其是在日本用户习惯里，页面越清楚、越克制，越容易被认为是“认真做事”的产品。',
          '所以我逐步把主视觉收成了浅色卡片、明确标题、较低噪音的层级结构，让页面不只是“酷”，而是“稳”。',
        ],
        bullets: [
          '更浅的背景，更清楚的文本。',
          '更少的装饰，更明确的主次关系。',
          '更少的视觉噪音，更高的信息密度。',
        ],
        files: ['src/app/page.tsx', 'src/app/about/page.tsx', 'src/app/blog/page.tsx'],
      },
      {
        heading: '2. 标准化比“风格化”更重要',
        paragraphs: [
          '真正把产品拉齐的，不是某个单独页面的炫技，而是卡片、badge、按钮、状态文案这些基础组件是否统一。我的目标是让用户不管进首页、服务矩阵还是工具页，都能立刻读懂这是同一个系统。',
          '这也是为什么后来我会反复收紧排版，减少中英混排里的“拼装感”，让页面语言和结构尽量一体化。',
        ],
        bullets: [
          '卡片样式要统一，内容层级也要统一。',
          '状态词、按钮词、说明词不要东一套西一套。',
          '多语言不是翻译一遍，而是重新对齐阅读习惯。',
        ],
        files: ['src/components/SiteHeader.tsx', 'src/components/HomeSearch.tsx', 'src/components/SiteFooter.tsx', 'src/app/services/ServicesClient.tsx'],
      },
      {
        heading: '3. 日本用户视角下的收口',
        paragraphs: [
          '站点主要面向日本推广后，我更明确地把设计目标改成了“清楚、安定、轻量”。这意味着 hero 不要太吵、按钮不要太多、说明不要太虚，用户进入页面后应该先看到结论，再决定要不要继续看细节。',
          '所以你会看到首页、about、website-check、ip-lookup 这些页面的共同变化：更短的标题、更自然的文案、更低噪音的间距，以及更少的装饰性元素。',
        ],
        bullets: [
          '标题更短，信息更直接。',
          '副标题和说明更接近日式 SaaS 的阅读节奏。',
          '交互更克制，但不会失去品牌感。',
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
    kbUrl: 'https://kb.opskitpro.com/02_Articles/website-check-parallel-probes',
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
        heading: '1. 先把目标“整理对”',
        paragraphs: [
          'website-check 的第一步不是发请求，而是把输入规范化。用户可能输入域名、完整 URL、带路径的链接，甚至夹着多余的尾斜杠。前端和后端都需要把这些输入统一收成真正的主机名，否则同一个目标会被当成多个对象。',
          '这一层小逻辑非常重要，因为它决定了诊断结果是否稳定，也决定了缓存和测试能不能复用。',
        ],
        bullets: [
          '前端输入先归一化成 hostname。',
          '后端也做同样的规范化，避免契约漂移。',
          '能接受 URL、域名、路径片段等多种输入。',
        ],
        files: ['src/app/tools/website-check/WebsiteCheckClient.tsx', 'src/app/api/diagnostic/route.ts'],
      },
      {
        heading: '2. 并行探测比串行更适合这个页面',
        paragraphs: [
          '这类工具最常见的问题，是把 DNS、HTTP、SSL、CDN 拆成一条长流程，用户会先看见漫长的“第 1 步、第 2 步、第 3 步”。但真实的诊断更像并行工作：多个信号一起看，最后再汇总出结论。',
          '所以当前页面改成了摘要先行、明细折叠的结构。结果区先给出判断，再让用户根据需要展开 DNS、SSL、证书链或原始 JSON。',
        ],
        bullets: [
          '加载流程只保留必要阶段。',
          '摘要卡比长流水线更适合快速判断。',
          '细节默认折叠，减少初次阅读负担。',
        ],
        files: ['src/app/tools/website-check/WebsiteCheckClient.tsx', 'src/app/tools/website-check/page.tsx'],
      },
      {
        heading: '3. 部分成功比“完全失败”更有用',
        paragraphs: [
          '在边缘环境里，外部服务不稳定是常态。与其让页面直接白屏或者返回一行错误，不如把能确认的部分先展示出来，再把不可用的部分明确标记为待确认。',
          '这也是我一直坚持“部分成功态”的原因：用户至少能知道 DNS、HTTP、SSL、CDN 中哪一环已经确认，接下来该往哪里看。',
        ],
        bullets: [
          '错误信息要可读，而不是只抛异常码。',
          '结果应该允许复制、导出和继续排查。',
          'JSON 视图要默认隐藏，但需要时随时可见。',
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
    kbUrl: 'https://kb.opskitpro.com/02_Articles/ip-lookup-structured-fallback',
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
        heading: '1. IP 页要先给“可用结论”',
        paragraphs: [
          'IP 页的重点不是输出一大堆字段，而是先回答三个问题：我是谁、我从哪里来、我现在是不是在代理后面。为了做到这一点，页面优先展示地理位置、ASN、ISP、代理线索和当前连接来源。',
          '当外部查询不可用时，页面也不会直接崩掉，而是返回结构化的部分结果。用户依然能继续往下看，也能知道哪些信息来自 Cloudflare Context，哪些信息来自外部回退。',
        ],
        bullets: [
          '优先展示“位置 + 接入环境 + 风险线索”。',
          '支持空输入，查看当前访问上下文。',
          '失败时返回结构化结果而不是硬错误。',
        ],
        files: ['src/app/api/ip/route.ts', 'src/app/tools/ip-lookup/IPLookupClient.tsx', 'src/app/api/ip/__tests__/route.test.ts'],
      },
      {
        heading: '2. DNS 页要做交叉验证，而不是单点查询',
        paragraphs: [
          'DNS 工具最重要的不是“查得到”，而是“查得一致”。所以我给它接了多个 resolver，并且把本地联查和远端接口结果一起展示出来。这样用户就能一眼看出问题是出在解析本身，还是出在某个节点。',
          '同时，A、AAAA、CNAME、MX、NS、TXT、CAA 都被纳入标准记录类型里，避免“DNS 查询”只剩一个粗糙的 A 记录结果。',
        ],
        bullets: [
          '多 resolver 交叉确认，提高结论可信度。',
          '支持常见记录类型，覆盖排障高频场景。',
          '批量结果和历史记录都保留，方便重复检查。',
        ],
        files: ['src/app/api/dns/route.ts', 'src/app/tools/dns-lookup/DnsClient.tsx', 'src/app/tools/dns-lookup/components/DnsBatchResult.tsx'],
      },
      {
        heading: '3. 统一输出格式，才能让 UI 真正变轻',
        paragraphs: [
          '之前这两个模块最容易出问题的地方，是字段名和展示层口径不完全一致。后来我把 API 契约抽成了共享 schema，前端和后端都基于同一份类型来理解“结果应该长什么样”。',
          '这样一来，页面上复制按钮、JSON 区、状态标签、提示语就能统一收口，不需要每个页面自己猜字段，也不会再出现同一项在不同页上叫法不同的情况。',
        ],
        bullets: [
          '共享契约减少前后端漂移。',
          '复制、JSON、摘要三层结果都围绕同一套数据。',
          '页面语言更轻，用户判断更快。',
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
    kbUrl: 'https://kb.opskitpro.com/02_Articles/services-standardization',
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
        heading: '1. 服务矩阵是站点的“导航总览”',
        paragraphs: [
          '服务矩阵不是单纯的工具列表，它更像站点的中央目录：普通运维工具、密码管理、安全分析、自动化、云原生、零信任、AI 节点都能在这里被快速定位。',
          '我后来把大多数工具统一成标准卡片，只保留 Matrix 使用独立视觉，是因为服务矩阵本身必须稳定、可扫视，不能每一块都抢注意力。',
        ],
        bullets: [
          '普通工具统一为标准卡片。',
          'Matrix 作为特殊入口保留独立风格。',
          '侧边目录、搜索和状态展示服务于快速定位。',
        ],
        files: ['src/app/services/ServicesClient.tsx', 'src/dictionaries/zh.json', 'src/dictionaries/ja.json', 'src/dictionaries/en.json', 'src/dictionaries/tw.json'],
      },
      {
        heading: '2. 国际化不是“翻译文件”，而是页面节奏',
        paragraphs: [
          '项目的多语言不只是文案翻译，而是整个页面节奏都要重做一遍。日文更偏克制、中文更偏直接、英文更偏线性说明，标题长度、 badge 位置、行距和空白都需要跟着变。',
          '这也是为什么我一直在调整首页、about、blog、tools 的视觉密度：同一份信息，在不同语言里不应该有完全不同的阅读压力。',
        ],
        bullets: [
          '标题和说明要适应目标语言的阅读习惯。',
          '按钮、状态、错误信息要统一命名。',
          '国际化不只是字符串替换，而是信息设计。',
        ],
        files: ['src/middleware.ts', 'src/components/LanguageToggle.tsx', 'src/dictionaries.ts'],
      },
      {
        heading: '3. Cloudflare Workers 是这个项目的落点',
        paragraphs: [
          '整个站点最终跑在 Cloudflare Workers 上，通过 OpenNext 做 Next.js 的适配和边缘部署。这样做的好处很明显：边缘就近、诊断场景一致、部署流程单一，也更符合这个项目“运维工具要快”的定位。',
          '博客、README、Backlog 和实际页面一起更新，也是在强调一个点：这个项目不是先写文档再做产品，而是产品、文章和工程记录同步推进。',
        ],
        bullets: [
          'OpenNext + Cloudflare Workers 负责最终交付。',
          'README 和 Backlog 反映真实进度。',
          'Logo、favicon、页面、博客一起收口，工程状态更清楚。',
        ],
        files: ['src/app/layout.tsx', 'wrangler.jsonc', 'open-next.config.ts', 'README.md', 'OpsKitPro_Backlog.md'],
      },
    ],
    related: ['why-opskitpro', 'design-principles', 'ip-dns-module'],
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
