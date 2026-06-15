
import Image from 'next/image'
import Link from 'next/link'
import {
  Zap,
  Globe,
  Activity,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  TerminalSquare,
  Server,
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import HomeSearch from '@/components/HomeSearch'
import { getBlogPosts } from '@/content/blog-posts'

type HomeDiagnosticPreview = {
  domain: string
  status: 'healthy' | 'degraded' | 'unavailable'
  rows: Array<{
    label: string
    value: string
    tone: string
  }>
}

async function getHomeDiagnosticPreview(): Promise<HomeDiagnosticPreview> {
  return {
    domain: 'opskitpro.com',
    status: 'unavailable',
    rows: [
      { label: 'DNS resolved', value: 'Awaiting check', tone: 'bg-zinc-400' },
      { label: 'SSL certificate', value: 'Awaiting check', tone: 'bg-zinc-400' },
      { label: 'CDN provider', value: 'Awaiting check', tone: 'bg-zinc-400' },
      { label: 'HTTP latency', value: 'Awaiting check', tone: 'bg-zinc-400' },
    ],
  }
}

const homeDashboardCopy = {
  en: {
    livePreview: 'Live Diagnostic Preview',
    healthy: 'healthy',
    degraded: 'degraded',
    unavailable: 'unavailable',
    rows: {
      dns: 'DNS resolved',
      ssl: 'SSL certificate',
      cdn: 'CDN provider',
      http: 'HTTP latency',
    },
    pending: 'Awaiting check',
    sslValid: 'Valid',
    sslFault: 'Validation fault',
    runFullCheck: 'Run full check',
    openDnsLookup: 'Open DNS lookup',
    featuredToolsTitle: 'Quick actions',
    featuredToolsDesc: 'Keep the homepage focused on the three checks people reach for first.',
    openAllTools: 'Open all tools',
    workflowsTitle: 'Operational workflows',
    workflowsDesc: 'Practical entry points for launch checks, incident response, and everyday edge debugging.',
    toolTags: {
      web: 'Web',
      dns: 'DNS',
      network: 'Network',
      dev: 'Dev',
      realtime: 'Realtime',
      security: 'Security',
      utility: 'Utility',
    },
    extraTools: {
      jsonTitle: 'JSON Toolkit',
      jsonDesc: 'Format, repair, query, and compare JSON payloads.',
      websocketTitle: 'WebSocket Lab',
      websocketDesc: 'Open sessions, send messages, and inspect realtime traffic.',
      passgenTitle: 'Password Generator',
      passgenDesc: 'Generate strong credentials with readable controls.',
      qrTitle: 'QR Generator',
      qrDesc: 'Create scannable QR codes for links and short payloads.',
      encodeTitle: 'Encode / Decode',
      encodeDesc: 'Convert URL, Base64, and common text encodings.',
    },
  },
  zh: {
    livePreview: '实时诊断预览',
    healthy: '健康',
    degraded: '需关注',
    unavailable: '暂不可用',
    rows: {
      dns: 'DNS 解析',
      ssl: 'SSL 证书',
      cdn: 'CDN 提供商',
      http: 'HTTP 延迟',
    },
    pending: '等待检测',
    sslValid: '有效',
    sslFault: '验证异常',
    runFullCheck: '运行完整检测',
    openDnsLookup: '打开 DNS 查询',
    featuredToolsTitle: '快速入口',
    featuredToolsDesc: '首页只保留最常用的三个检查入口，避免和工具页重复。',
    openAllTools: '打开全部工具',
    workflowsTitle: '运维工作流',
    workflowsDesc: '覆盖上线检查、故障响应和日常边缘排障的实用入口。',
    toolTags: {
      web: '网站',
      dns: 'DNS',
      network: '网络',
      dev: '开发',
      realtime: '实时',
      security: '安全',
      utility: '工具',
    },
    extraTools: {
      jsonTitle: 'JSON 工具',
      jsonDesc: '格式化、修复、查询和对比 JSON 数据。',
      websocketTitle: 'WebSocket 调试',
      websocketDesc: '打开连接、发送消息并检查实时通信。',
      passgenTitle: '密码生成',
      passgenDesc: '用清晰控件生成高强度凭证。',
      qrTitle: '二维码生成',
      qrDesc: '为链接和短文本生成可扫描二维码。',
      encodeTitle: '编码 / 解码',
      encodeDesc: '转换 URL、Base64 和常见文本编码。',
    },
  },
  tw: {
    livePreview: '即時診斷預覽',
    healthy: '健康',
    degraded: '需關注',
    unavailable: '暫不可用',
    rows: {
      dns: 'DNS 解析',
      ssl: 'SSL 憑證',
      cdn: 'CDN 提供商',
      http: 'HTTP 延遲',
    },
    pending: '等待檢測',
    sslValid: '有效',
    sslFault: '驗證異常',
    runFullCheck: '執行完整檢測',
    openDnsLookup: '開啟 DNS 查詢',
    featuredToolsTitle: '快速入口',
    featuredToolsDesc: '首頁只保留最常用的三個檢查入口，避免和工具頁重複。',
    openAllTools: '打開全部工具',
    workflowsTitle: '維運工作流',
    workflowsDesc: '覆蓋上線檢查、故障回應和日常邊緣排障的實用入口。',
    toolTags: {
      web: '網站',
      dns: 'DNS',
      network: '網路',
      dev: '開發',
      realtime: '即時',
      security: '安全',
      utility: '工具',
    },
    extraTools: {
      jsonTitle: 'JSON 工具',
      jsonDesc: '格式化、修復、查詢和比對 JSON 資料。',
      websocketTitle: 'WebSocket 調試',
      websocketDesc: '打開連線、傳送訊息並檢查即時通訊。',
      passgenTitle: '密碼生成',
      passgenDesc: '用清晰控件生成高強度憑證。',
      qrTitle: '二維碼生成',
      qrDesc: '為連結和短文字生成可掃描二維碼。',
      encodeTitle: '編碼 / 解碼',
      encodeDesc: '轉換 URL、Base64 和常見文字編碼。',
    },
  },
  ja: {
    livePreview: 'ライブ診断プレビュー',
    healthy: '正常',
    degraded: '要確認',
    unavailable: '利用不可',
    rows: {
      dns: 'DNS 解決',
      ssl: 'SSL 証明書',
      cdn: 'CDN プロバイダー',
      http: 'HTTP 遅延',
    },
    pending: '確認待ち',
    sslValid: '有効',
    sslFault: '検証エラー',
    runFullCheck: '完全な診断を実行',
    openDnsLookup: 'DNS 検索を開く',
    featuredToolsTitle: 'クイック操作',
    featuredToolsDesc: 'ホームには最初に使う三つのチェックだけを残し、ツール一覧と重複しないようにします。',
    openAllTools: 'すべてのツールを開く',
    workflowsTitle: '運用ワークフロー',
    workflowsDesc: 'リリース確認、障害対応、日常のエッジ調査に使える入口です。',
    toolTags: {
      web: 'Web',
      dns: 'DNS',
      network: 'ネットワーク',
      dev: '開発',
      realtime: 'リアルタイム',
      security: '安全',
      utility: 'ツール',
    },
    extraTools: {
      jsonTitle: 'JSON ツール',
      jsonDesc: 'JSON の整形、修復、クエリ、比較を行えます。',
      websocketTitle: 'WebSocket 調査',
      websocketDesc: '接続を開き、メッセージ送信とリアルタイム通信を確認します。',
      passgenTitle: 'パスワード生成',
      passgenDesc: '読みやすい操作で強度の高い認証情報を生成します。',
      qrTitle: 'QR コード生成',
      qrDesc: 'リンクや短い文字列から読み取り可能な QR を作成します。',
      encodeTitle: 'エンコード / デコード',
      encodeDesc: 'URL、Base64、一般的な文字列エンコードを変換します。',
    },
  },
} as const

export default async function Home({ params }: { params: { lang: string } }) {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  const isJapanese = lang === 'ja'
  const latestNotes = getBlogPosts(lang)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4)
  const heroBadge = isJapanese ? '運用向け診断' : dict.home.title_part1
  const heroSubtitle = isJapanese
    ? 'DNS・SSL・CDN・HTTP を、ひとつの画面で素早く確認できます。ログインは不要です。'
    : dict.home.subtitle
  const diagnosticPreview = await getHomeDiagnosticPreview()
  const dashboardCopy = homeDashboardCopy[lang]
  const previewRows = [
    diagnosticPreview.rows[0] && { ...diagnosticPreview.rows[0], label: dashboardCopy.rows.dns, value: diagnosticPreview.rows[0].value === 'Awaiting check' ? dashboardCopy.pending : diagnosticPreview.rows[0].value },
    diagnosticPreview.rows[1] && {
      ...diagnosticPreview.rows[1],
      label: dashboardCopy.rows.ssl,
      value: diagnosticPreview.rows[1].value === 'Awaiting check'
        ? dashboardCopy.pending
        : diagnosticPreview.rows[1].value.startsWith('Valid')
          ? diagnosticPreview.rows[1].value.replace('Valid', dashboardCopy.sslValid)
          : diagnosticPreview.rows[1].value === 'Validation fault'
            ? dashboardCopy.sslFault
            : diagnosticPreview.rows[1].value,
    },
    diagnosticPreview.rows[2] && { ...diagnosticPreview.rows[2], label: dashboardCopy.rows.cdn, value: diagnosticPreview.rows[2].value === 'Awaiting check' ? dashboardCopy.pending : diagnosticPreview.rows[2].value },
    diagnosticPreview.rows[3] && { ...diagnosticPreview.rows[3], label: dashboardCopy.rows.http, value: diagnosticPreview.rows[3].value === 'Awaiting check' ? dashboardCopy.pending : diagnosticPreview.rows[3].value },
  ].filter(Boolean) as HomeDiagnosticPreview['rows']
  const featuredTools = [
    { href: `/${lang}/tools/website-check`, title: dict.home.card1_title, desc: dict.home.card1_desc, icon: Activity, tag: dashboardCopy.toolTags.web, tone: 'text-emerald-500 bg-emerald-500/10' },
    { href: `/${lang}/tools/dns-lookup`, title: dict.home.card3_title, desc: dict.home.card3_desc, icon: Server, tag: dashboardCopy.toolTags.dns, tone: 'text-sky-500 bg-sky-500/10' },
    { href: `/${lang}/tools/ip-lookup`, title: dict.home.card2_title, desc: dict.home.card2_desc, icon: Globe, tag: dashboardCopy.toolTags.network, tone: 'text-purple-500 bg-purple-500/10' },
  ]


  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative z-10 flex-grow px-4 pb-20 pt-8 sm:px-6 md:pb-24">
        <div className="pointer-events-none absolute left-1/2 top-0 z-[-1] h-[420px] w-full max-w-6xl -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

        <section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="ui-surface-elevated rounded-2xl p-5 text-left sm:p-7 lg:p-8">
            <div className={`ui-chip mb-5 ${isJapanese ? 'tracking-[0.18em]' : 'font-mono tracking-widest'}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {heroBadge}
            </div>
            <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              {isJapanese ? (
                <>
                  DNS・IP・サイトを
                  <span className="mx-2 bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent ai-glow">まとめて</span>
                  診断
                </>
              ) : (
                <>
                  {dict.home.title_part2_pre}
                  <span className="mx-2 bg-gradient-to-br from-emerald-400 to-emerald-600 bg-clip-text text-transparent ai-glow">
                    {dict.home.title_part2_ai}
                  </span>
                  {dict.home.title_part2_suf}
                </>
              )}
            </h1>
            <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-[var(--text-secondary)] md:text-base">
              {heroSubtitle}
            </p>
            <div className="mt-6 max-w-3xl">
              <HomeSearch dict={dict} lang={lang} compact />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {[
                dict.home.features.dns,
                dict.home.features.ssl,
                dict.home.features.cdn,
                'HTTP',
              ].map((item) => (
                <span key={item} className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <aside className="ui-surface rounded-2xl p-4 text-left">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">{dashboardCopy.livePreview}</div>
                <h2 className="mt-1 text-base font-semibold text-[var(--text-primary)]">{diagnosticPreview.domain}</h2>
              </div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] ${
                diagnosticPreview.status === 'healthy'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
                  : diagnosticPreview.status === 'degraded'
                    ? 'border-orange-500/20 bg-orange-500/10 text-orange-500'
                    : 'border-zinc-500/20 bg-zinc-500/10 text-[var(--text-muted)]'
              }`}>
                {dashboardCopy[diagnosticPreview.status]}
              </span>
            </div>
            <div className="space-y-2">
              {previewRows.map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${row.tone}`} />
                    <span className="truncate text-xs font-medium text-[var(--text-secondary)]">{row.label}</span>
                  </div>
                  <span className="truncate text-right text-xs font-semibold text-[var(--text-primary)]">{row.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Link href={`/${lang}/tools/website-check`} className="ui-button-primary px-3 py-2 text-xs">
                {dashboardCopy.runFullCheck}
              </Link>
              <Link href={`/${lang}/tools/dns-lookup`} className="ui-button-ghost border border-[var(--border-subtle)] px-3 py-2 text-xs">
                {dashboardCopy.openDnsLookup}
              </Link>
            </div>
          </aside>
        </section>

        <section className="mx-auto mt-8 w-full max-w-7xl text-left">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-faint)]">{dashboardCopy.featuredToolsTitle}</div>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--text-primary)]">{dict.home.scenes.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{dashboardCopy.featuredToolsDesc}</p>
            </div>
            <Link href={`/${lang}/tools`} className="group inline-flex items-center gap-1 text-xs font-semibold text-[var(--accent-color)] hover:text-[var(--accent-hover)]">
              {dashboardCopy.openAllTools}
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="ui-surface overflow-hidden rounded-2xl">
            {featuredTools.map((tool, index) => (
              <Link
                key={tool.href}
                href={tool.href}
                className={`group flex items-center gap-4 px-4 py-4 hover:bg-[var(--surface-secondary)] sm:px-5 ${index !== featuredTools.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tool.tone}`}>
                  <tool.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-color)]">{tool.title}</h3>
                    <span className="rounded-full border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] font-semibold text-[var(--text-muted)]">{tool.tag}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-xs leading-5 text-[var(--text-muted)]">{tool.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-faint)] transition group-hover:translate-x-0.5 group-hover:text-[var(--accent-color)]" />
              </Link>
            ))}
          </div>
        </section>

        <div className="ui-surface relative mx-auto mb-16 mt-10 w-full max-w-7xl overflow-hidden rounded-2xl p-6 text-left sm:p-8 md:p-10">
           <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[120px] sm:h-96 sm:w-96"></div>
           <div className="relative z-10">
              <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <div className="ui-chip mb-4"><TerminalSquare className="h-3 w-3" /> {dashboardCopy.workflowsTitle}</div>
                  <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    {dashboardCopy.workflowsTitle}
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-[var(--text-muted)]">
                  {dashboardCopy.workflowsDesc}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                 {[
                   { title: dict.home.scenes.s1_title, desc: dict.home.scenes.s1_desc, icon: AlertCircle, tone: 'text-red-500 bg-red-500/10' },
                   { title: dict.home.scenes.s2_title, desc: dict.home.scenes.s2_desc, icon: Zap, tone: 'text-amber-500 bg-amber-500/10' },
                   { title: dict.home.scenes.s3_title, desc: dict.home.scenes.s3_desc, icon: ShieldCheck, tone: 'text-emerald-500 bg-emerald-500/10' },
                 ].map((scene, i) => (
                   <div key={i} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5">
                      <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${scene.tone}`}>
                         <scene.icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-semibold tracking-tight text-[var(--text-primary)]">{scene.title}</h4>
                      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{scene.desc}</p>
                 </div>
               ))}
              </div>
           </div>
        </div>

        {/* 5. Featured Intel / Technical Notes (Articles) */}
        <div className="mx-auto mb-12 w-full max-w-7xl text-left">
           <div className="mb-8 flex items-center justify-between border-b border-[var(--border-subtle)] pb-6">
              <div>
                 <h2 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                   {dict.home.blog_section?.title || "FEATURED_INTEL"}
                 </h2>
                 <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--text-muted)]">
                   {dict.home.blog_section?.subtitle || "Technical Notes"}
                 </p>
              </div>
              <Link href={`/${lang}/blog`} className="group flex items-center gap-1 text-xs font-semibold text-[var(--accent-color)] hover:text-[var(--accent-hover)]">
                 {dict.home.blog_section?.view_all || "VIEW_ALL_POSTS"}
                 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>

           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {latestNotes.map((post) => (
                <Link
                  key={post.slug}
                  href={`/${lang}/blog/${post.slug}`}
                  className="ui-surface group overflow-hidden rounded-2xl hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-br ${post.accent} opacity-70`} />
                    <div className="absolute left-3 top-3 flex items-center gap-2">
                      <span className="rounded-full border border-white/30 bg-white/85 px-2.5 py-1 text-[9px] font-bold tracking-[0.2em] text-zinc-700 backdrop-blur-md">
                        {post.tag}
                      </span>
                      <span className="rounded-full border border-white/20 bg-zinc-950/70 px-2.5 py-1 text-[9px] font-semibold tracking-[0.16em] text-white backdrop-blur-md">
                        {post.actionKind === 'tool'
                          ? isJapanese
                            ? '工具'
                            : lang === 'zh'
                              ? '工具'
                              : lang === 'tw'
                                ? '工具'
                                : 'Tool'
                          : isJapanese
                            ? '筆記'
                            : lang === 'zh'
                              ? '笔记'
                              : lang === 'tw'
                                ? '筆記'
                                : 'Notes'}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      <span>{post.date}</span>
                      <span className="text-[var(--accent-color)]">{post.readTime}</span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-snug text-[var(--text-primary)] group-hover:text-[var(--accent-color)] sm:text-[1.05rem]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
                      {post.summary}
                    </p>
                  </div>
                </Link>
              ))}
           </div>
        </div>
      </main>

      {/* 6. Footer (Handled by component) */}
      <SiteFooter dict={dict} />
    </>
  )
}
