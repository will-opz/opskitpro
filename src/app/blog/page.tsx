import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  BookOpen,
  Clock,
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getBlogPosts } from '@/content/blog-posts'

export default async function BlogPage() {
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const dict = await getDictionary(lang)
  const isZh = lang === 'zh'
  const isJapanese = lang === 'ja'
  const posts = getBlogPosts(lang)
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]))
  const totalPosts = posts.length
  const kbLabel = isJapanese ? '公開ナレッジ' : isZh ? '公开知识库' : lang === 'tw' ? '公開知識庫' : 'Public Knowledge Base'
  const publishedLabel = isJapanese ? '公開済み' : isZh ? '已公开' : lang === 'tw' ? '已公開' : 'Published'
  const groupLabel = isJapanese ? '分類' : isZh ? '分类' : lang === 'tw' ? '分類' : 'Sections'

  const articleGroups = [
    {
      id: 'project-overview',
      title:
        lang === 'ja'
          ? 'プロジェクト概要'
          : isZh
            ? '项目说明'
            : lang === 'tw'
              ? '專案說明'
              : 'Project overview',
      subtitle:
        lang === 'ja'
          ? '需求、設計原則、工程收口をまとめた導入記事です。'
          : isZh
            ? '需求、设计原则和工程收口放在一起，先建立项目上下文。'
            : lang === 'tw'
              ? '需求、設計原則與工程收斂放在一起，先建立專案上下文。'
              : 'Requirements, design principles, and engineering wrap-up in one place.',
      slugs: ['why-opskitpro', 'design-principles', 'services-deployment'],
    },
    {
      id: 'module-implementation',
      title:
        lang === 'ja'
          ? 'モジュール実装'
          : isZh
            ? '模块实现'
            : lang === 'tw'
              ? '模組實作'
              : 'Module implementation',
      subtitle:
        lang === 'ja'
          ? 'website-check と IP / DNS の設計を、単一の題材ごとに整理しています。'
          : isZh
            ? '把 website-check、IP、DNS 这几块按单一题目拆开讲。'
            : lang === 'tw'
              ? '把 website-check、IP、DNS 這幾塊按單一題目拆開講。'
              : 'Breaks down website-check, IP, and DNS as separate implementation topics.',
      slugs: ['website-check-module', 'ip-dns-module', 'cloudflare-dual-stack'],
    },
    {
      id: 'tool-implementation',
      title:
        lang === 'ja'
          ? 'ツール実装'
          : isZh
            ? '工具实现'
            : lang === 'tw'
              ? '工具實作'
              : 'Tool implementation',
      subtitle:
        lang === 'ja'
          ? 'passgen、qrgen、json、websocket を 1 テーマ 1 記事でまとめています。'
          : isZh
            ? 'passgen、qrgen、json、websocket 都按一个工具一篇文章来整理。'
            : lang === 'tw'
              ? 'passgen、qrgen、json、websocket 都按一個工具一篇文章來整理。'
              : 'One article per tool: passgen, qrgen, json, and websocket.',
      slugs: ['passgen-tool', 'qrgen-tool', 'json-tool', 'websocket-tool'],
    },
    {
      id: 'ai-engineering',
      title:
        lang === 'ja'
          ? 'AI エンジニアリング'
          : isZh
            ? 'AI 工程工作流'
            : lang === 'tw'
              ? 'AI 工程工作流'
              : 'AI engineering',
      subtitle:
        lang === 'ja'
          ? 'Vibe Coding を、境界・検証・記録を含む安全な実装フローとして整理しています。'
          : isZh
            ? '把 Vibe Coding 整理成有边界、有验证、有记录的 AI 辅助工程流程。'
            : lang === 'tw'
              ? '把 Vibe Coding 整理成有邊界、有驗證、有記錄的 AI 輔助工程流程。'
              : 'Turns vibe coding into a guarded workflow with scope, verification, notes, and deployment checks.',
      slugs: ['vibe-coding-workflow'],
    },
  ].map((group) => ({
    ...group,
    posts: group.slugs
      .map((slug) => postsBySlug.get(slug))
      .filter(Boolean) as typeof posts,
  }))
  const articleSeries = articleGroups.map((group) => ({
    id: group.id,
    title: group.title,
    subtitle: group.subtitle,
    count: group.posts.length,
  }))

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative mx-auto mb-28 w-full max-w-7xl flex-grow px-6 pt-6 z-10 md:pt-8">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-full max-w-[1000px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="mb-12 border-b border-zinc-100 pb-10 text-center md:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-white/75 px-4 py-1.5 text-[10px] font-semibold tracking-[0.28em] text-emerald-600 shadow-sm backdrop-blur-md">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {kbLabel}
          </div>
          <h1 className="mb-5 text-4xl font-black leading-tight tracking-tighter text-zinc-900 sm:text-5xl md:text-7xl">
            {dict.nav.blog}
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-zinc-700 sm:text-base md:mx-0">
            {isJapanese
              ? 'OpsKitPro の公開メモを、ツール、運用、実装の入口として整理しています。'
              : isZh
                ? '这里整理 OpsKitPro 已公开的工具说明、运维笔记和实现记录。'
                : lang === 'tw'
                  ? '這裡整理 OpsKitPro 已公開的工具說明、運維筆記與實作記錄。'
                  : 'A public hub for OpsKitPro tool notes, operations guides, and implementation records.'}
            <br />
            <span className="mt-2 block opacity-40">
              {isJapanese
                ? '草稿や内部記録ではなく、公開できる内容だけをここに置いています。'
                : isZh
                  ? '这里只放已整理、可公开复用的内容，不接入内部草稿。'
                  : lang === 'tw'
                    ? '這裡只放已整理、可公開複用的內容，不接入內部草稿。'
                    : 'Only cleaned, reusable public content lives here; private drafts stay outside the site build.'}
            </span>
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { label: publishedLabel, value: `${String(totalPosts).padStart(2, '0')} ${isJapanese ? '本' : isZh ? '篇' : lang === 'tw' ? '篇' : 'posts'}` },
              { label: groupLabel, value: `${String(articleGroups.length).padStart(2, '0')} ${isJapanese ? '分類' : isZh ? '组' : lang === 'tw' ? '組' : 'sections'}` },
              { label: isJapanese ? '範囲' : isZh ? '范围' : lang === 'tw' ? '範圍' : 'Scope', value: isJapanese ? '公開情報のみ' : isZh ? '仅公开内容' : lang === 'tw' ? '僅公開內容' : 'Public only' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-zinc-100 bg-white/75 px-4 py-3 text-left shadow-sm backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">{item.label}</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-14 grid gap-4 md:grid-cols-3">
          {articleSeries.map((series) => (
            <a
              key={series.id}
              href={`#${series.id}`}
              className="group rounded-[2rem] border border-zinc-100 bg-white/85 px-5 py-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-500">
                    {String(series.count).padStart(2, '0')} {isJapanese ? '本' : isZh ? '篇' : lang === 'tw' ? '篇' : 'posts'}
                  </div>
                  <h2 className="mt-2 text-xl font-black tracking-tighter text-zinc-900">{series.title}</h2>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-600">{series.subtitle}</p>
            </a>
          ))}
        </div>

        <div className="space-y-14">
          {articleGroups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-24">
              <div className="mb-6 border-b border-zinc-100 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-emerald-500/15 bg-emerald-500/8 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-emerald-600">
                    {String(group.posts.length).padStart(2, '0')} {isJapanese ? '本' : isZh ? '篇' : lang === 'tw' ? '篇' : 'posts'}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    {group.id === 'project-overview'
                      ? isJapanese
                        ? '概要'
                        : isZh
                          ? '总览'
                          : lang === 'tw'
                            ? '總覽'
                            : 'Overview'
                      : group.id === 'module-implementation'
                        ? isJapanese
                          ? '実装'
                          : isZh
                            ? '实现'
                            : lang === 'tw'
                              ? '實作'
                              : 'Implementation'
                        : group.id === 'ai-engineering'
                          ? 'AI'
                          : isJapanese
                            ? 'ツール'
                            : isZh
                              ? '工具'
                              : lang === 'tw'
                                ? '工具'
                                : 'Tools'}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tighter text-zinc-900 sm:text-3xl">
                  {group.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                  {group.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {group.posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-2xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-br ${post.accent} opacity-70`} />
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[9px] font-bold tracking-[0.22em] text-zinc-700 backdrop-blur-md">
                          {post.tag}
                        </span>
                        <span className="rounded-full border border-white/20 bg-zinc-950/75 px-3 py-1 text-[9px] font-semibold tracking-[0.18em] text-white backdrop-blur-md">
                          {post.actionKind === 'tool'
                            ? isJapanese
                              ? 'ツール'
                              : isZh
                                ? '工具'
                                : lang === 'tw'
                                  ? '工具'
                                  : 'Tool'
                            : isJapanese
                              ? '筆記'
                              : isZh
                                ? '笔记'
                                : lang === 'tw'
                                  ? '筆記'
                                  : 'Notes'}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-full flex-col p-6">
                      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                        <span>{post.date}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-emerald-600">
                        {post.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-500">
                        {post.summary}
                      </p>

                      <div className="mt-6 flex items-center justify-between border-t border-zinc-50 pt-5">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                          {isJapanese ? '公開メモ' : isZh ? '公开笔记' : lang === 'tw' ? '公開筆記' : 'Public note'}
                        </span>
                        <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <div className="rounded-[2rem] border border-emerald-500/15 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tighter text-zinc-900">
                  {isJapanese ? 'ツールへ戻る' : isZh ? '返回工具' : lang === 'tw' ? '返回工具' : 'Return to Tools'}

                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {isJapanese
                    ? 'ナレッジベースは公開情報だけを扱い、日常の診断や調査はツールから始められます。'
                    : isZh
                      ? '知识库只展示公开内容，日常诊断、排障和工具入口从工具开始。'
                      : lang === 'tw'
                        ? '知識庫只展示公開內容，日常診斷、排障和工具入口從工具開始。'
                        : 'The knowledge base stays public and reusable; daily diagnostics and workflows start from Tools.'}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                <BookOpen className="h-4 w-4" />
                {isJapanese ? 'ホームへ戻る' : isZh ? '返回首页' : lang === 'tw' ? '返回首頁' : 'Back to home'}
              </Link>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
