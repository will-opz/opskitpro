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
      slugs: ['website-check-module', 'ip-dns-module'],
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
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-[10px] font-semibold tracking-[0.28em] text-emerald-600">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {isJapanese ? '技術メモ' : isZh ? '技术笔记' : 'Technical Notes'}
          </div>
          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tighter text-zinc-900 sm:text-5xl md:text-7xl">
            {dict.nav.blog}
          </h1>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-zinc-700 sm:text-base">
            {isJapanese
              ? '可観測性、サイト信頼性、エッジ基盤の技術メモを、プロジェクト別に整理しています。'
              : isZh
                ? '这里把 OpsKitPro 的技术笔记按项目说明、模块实现和工具实现整理在一起。'
                : 'This section groups OpsKitPro technical notes by project overview, module implementation, and tool implementation.'}
            <br />
            <span className="mt-2 block opacity-40">
              {isJapanese
                ? '長文は主站の文章区に残し、主站は索引と要点を保っています。'
                : isZh
                  ? '长文会继续保留在主站文章区，主站只放索引和要点。'
                  : lang === 'tw'
                    ? '長文會繼續保留在主站文章區，主站只放索引和要點。'
                    : 'Long-form content stays in the main-site article area, while the main site keeps the index and key points.'}
            </span>
          </p>
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
              <p className="mt-3 text-sm leading-7 text-zinc-600">{series.subtitle}</p>
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
                          {isJapanese ? '主站プレビュー' : isZh ? '主站预览' : lang === 'tw' ? '主站預覽' : 'Main site preview'}
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
                  {isJapanese ? '主站アーカイブで長文を読む' : isZh ? '长文请继续看主站文章区' : lang === 'tw' ? '長文請繼續看主站文章區' : 'Read the long-form archive on the main site'}

                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {isJapanese
                    ? '主站の技術メモは要点を残し、設計記録・運用記録は主站の文章区画に整理しています。'
                    : isZh
                      ? '主站技术笔记只保留要点，设计记录和运维记录都整理在主站文章区。'
                      : lang === 'tw'
                        ? '主站技術筆記只保留要點，設計記錄和運維記錄都整理在主站文章區。'
                        : 'The main site keeps the key points, while design and operations records are organized in the main-site article area.'}
                </p>
              </div>
              <a
                href="https://opskitpro.com/blog"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                <BookOpen className="h-4 w-4" />
                {isJapanese ? '記事一覧を開く' : isZh ? '打开文章列表' : lang === 'tw' ? '打開文章列表' : 'Open article list'}

              </a>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
