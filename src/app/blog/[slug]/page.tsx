import Image from 'next/image'
import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock } from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getBlogPost, getBlogPostSlugs, getBlogPosts } from '@/content/blog-posts'

export function generateStaticParams() {
  return getBlogPostSlugs().map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const post = getBlogPost(slug, lang)

  if (!post) {
    return {
      title: 'Blog',
    }
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      images: [{ url: post.coverImage }],
    },
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const dict = await getDictionary(lang)
  const post = getBlogPost(slug, lang)

  if (!post) {
    notFound()
  }

  const isToolArticle = post.actionKind === 'tool'
  const formatHeading = (value: string) => value.replace(/^\d+\.\s*/, '')
  const relatedPosts = getBlogPosts(lang)
    .filter((entry) => post.related.includes(entry.slug))
    .slice(0, 3)
  const previewSections = post.sections.slice(0, 3)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative mx-auto mb-28 w-full max-w-6xl flex-grow px-6 pt-6 pb-6 md:pt-8">
        <div className={`absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-br ${post.accent} blur-3xl opacity-70`} />

        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-[11px] font-medium tracking-[0.16em] text-zinc-600 transition-colors hover:border-emerald-500/30 hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === 'ja' ? 'ブログへ戻る' : lang === 'zh' ? '返回博客' : lang === 'tw' ? '返回部落格' : 'Back to blog'}
          </Link>
        </div>

        <article className="overflow-hidden rounded-[2.5rem] border border-zinc-100 bg-white/90 shadow-[0_30px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-zinc-100 px-6 py-6 sm:px-10 sm:py-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-emerald-600">
                {post.tag}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                {post.date}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              <div>
                <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tighter text-zinc-900 sm:text-5xl md:text-6xl">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-700">{post.summary}</p>

                <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">
                  <BookOpen className="h-4 w-4" />
                  {isToolArticle
                    ? lang === 'ja'
                      ? 'この記事では設計・実装・使い方をまとめ、ツール本体にもすぐ行けます。'
                      : lang === 'zh'
                        ? '这篇文章会讲清设计、实现和用法，旁边也能直接打开工具。'
                        : lang === 'tw'
                          ? '這篇文章會講清設計、實作與用法，旁邊也能直接打開工具。'
                          : 'This article covers design, implementation, and usage, with a direct link to the tool.'
                    : lang === 'ja'
                      ? '全文は KB にあります。ここは主站の軽量プレビューです。'
                      : lang === 'zh'
                        ? '完整正文在 KB，这里是主站的轻量预览。'
                        : lang === 'tw'
                          ? '完整正文在 KB，這裡是主站的輕量預覽。'
                          : 'The full article lives in KB. This is a lightweight preview on the main site.'}
                </div>

                <a
                  href={post.kbUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  {isToolArticle
                    ? lang === 'ja'
                      ? 'ツールを開く'
                      : lang === 'zh'
                        ? '打开工具'
                        : lang === 'tw'
                          ? '開啟工具'
                          : 'Open tool'
                    : lang === 'ja'
                      ? 'KB で全文を読む'
                      : lang === 'zh'
                        ? '在 KB 阅读全文'
                        : lang === 'tw'
                          ? '在 KB 閱讀全文'
                          : 'Read full article on KB'}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <figure className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-zinc-950 shadow-sm">
                <div className="relative aspect-[16/10]">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 420px"
                    priority
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${post.accent} opacity-70`} />
                </div>
              </figure>
            </div>
          </div>

          <div className="border-b border-zinc-100 px-6 py-8 sm:px-10">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
              <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
              {isToolArticle
                ? lang === 'ja'
                  ? '記事プレビュー'
                  : lang === 'zh'
                    ? '文章预览'
                    : lang === 'tw'
                      ? '文章預覽'
                      : 'Article preview'
                : lang === 'ja'
                  ? '主站プレビュー'
                  : lang === 'zh'
                    ? '主站预览'
                    : lang === 'tw'
                      ? '主站預覽'
                      : 'Main site preview'}
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {previewSections.map((section, index) => (
                <div key={section.heading} className="rounded-3xl border border-zinc-100 bg-zinc-50/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                      {isToolArticle
                        ? lang === 'ja'
                          ? '記事'
                          : lang === 'zh'
                            ? '文章'
                            : lang === 'tw'
                              ? '文章'
                              : 'Article'
                        : lang === 'ja'
                          ? 'KB 参照'
                          : lang === 'zh'
                            ? 'KB 参照'
                            : lang === 'tw'
                              ? 'KB 參照'
                              : 'KB ref'}
                    </span>
                  </div>
                  <h2 className="mt-4 text-xl font-black tracking-tighter text-zinc-900">{formatHeading(section.heading)}</h2>
                  <p className="mt-3 text-sm leading-7 text-zinc-700">{section.paragraphs[0]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === 'ja' ? '公開方針' : lang === 'zh' ? '发布方式' : lang === 'tw' ? '發佈方式' : 'Publishing'}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-700">
                  {isToolArticle
                    ? lang === 'ja'
                      ? 'このページでは、各ツールの設計・実装・用途・使い方を主站でまとめています。'
                      : lang === 'zh'
                        ? '这篇文章会在主站里直接讲清每个工具的设计、实现、用途和用法。'
                        : lang === 'tw'
                          ? '這篇文章會在主站裡直接講清每個工具的設計、實作、用途和用法。'
                          : 'This page keeps the design, implementation, use, and usage notes directly on the main site.'
                    : lang === 'ja'
                      ? '長文は KB にまとめ、主站は要点だけを残しています。'
                      : lang === 'zh'
                        ? '长文统一放到 KB，主站只保留要点和入口。'
                        : lang === 'tw'
                          ? '長文統一放到 KB，主站只保留要點與入口。'
                          : 'Long-form writing lives in KB, while the main site keeps only the key points and entry points.'}
                </p>
              </div>

              <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50/70 p-6">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === 'ja' ? '文章構成' : lang === 'zh' ? '文章结构' : lang === 'tw' ? '文章結構' : 'Article outline'}
                </div>
                <div className="mt-4 grid gap-3">
                  {post.sections.map((section, index) => (
                    <div key={section.heading} className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm leading-7 text-zinc-700">
                      <span className="mr-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {formatHeading(section.heading)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === 'ja' ? '本文プレビュー' : lang === 'zh' ? '正文预览' : lang === 'tw' ? '正文預覽' : 'Article body'}
                </div>
                <div className="mt-5 space-y-5">
                  {post.sections.map((section, index) => (
                    <section key={`${section.heading}-body`} className="rounded-3xl border border-zinc-100 bg-zinc-50/60 p-5">
                      <div className="flex items-center gap-3">
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1 text-[10px] font-semibold tracking-[0.24em] text-emerald-600">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-lg font-black tracking-tight text-zinc-900">
                          {formatHeading(section.heading)}
                        </h3>
                      </div>

                      <div className="mt-4 space-y-4">
                        {section.paragraphs.map((paragraph, paragraphIndex) => (
                          <p key={`${section.heading}-${paragraphIndex}`} className="text-sm leading-7 text-zinc-700">
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.bullets?.length ? (
                        <div className="mt-5 rounded-2xl border border-emerald-500/10 bg-white px-4 py-4">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-600">
                            {lang === 'ja' ? '補足ポイント' : lang === 'zh' ? '补充要点' : lang === 'tw' ? '補充要點' : 'Notes'}
                          </div>
                          <ul className="mt-3 space-y-2 text-sm leading-7 text-zinc-700">
                            {section.bullets.map((bullet) => (
                              <li key={bullet} className="flex gap-2">
                                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </section>
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === 'ja'
                    ? '関連記事'
                    : lang === 'zh'
                      ? '相关文章'
                      : lang === 'tw'
                        ? '相關文章'
                        : 'Related articles'}
                </div>
                <div className="mt-4 space-y-3">
                  {relatedPosts.map((item) => (
                    <a
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="block rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 transition-colors hover:border-emerald-500/20 hover:bg-emerald-50/40"
                    >
                      <p className="text-xs font-semibold tracking-[0.16em] text-emerald-600">
                        {item.actionKind === 'tool'
                          ? lang === 'ja'
                            ? 'ツール'
                            : lang === 'zh'
                              ? '工具'
                              : lang === 'tw'
                                ? '工具'
                                : 'Tool'
                          : 'KB'}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-900">{item.title}</p>
                      <p className="mt-2 text-xs leading-6 text-zinc-500">{item.summary}</p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === 'ja'
                    ? '次の一歩'
                    : lang === 'zh'
                      ? '下一步'
                      : lang === 'tw'
                        ? '下一步'
                        : 'Next step'}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-700">
                  {isToolArticle
                    ? lang === 'ja'
                      ? '実際のツールを開いて試しつつ、必要なら関連記事へ戻れます。'
                      : lang === 'zh'
                        ? '可以先打开实际工具试一试，再回到相关文章继续看。'
                        : lang === 'tw'
                          ? '可以先打開實際工具試一試，再回到相關文章繼續看。'
                          : 'Open the actual tool to try it, then come back to related articles if needed.'
                    : lang === 'ja'
                      ? '必要なら、サービスマトリクスや個別ツールの KB 記事を続けて読めます。'
                      : lang === 'zh'
                        ? '如果想继续深入，可以接着看服务矩阵或各个工具模块的 KB 文章。'
                        : lang === 'tw'
                          ? '如果想繼續深入，可以接著看服務矩陣或各個工具模組的 KB 文章。'
                          : 'If you want to go deeper, continue with the service matrix or individual KB articles.'}
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href="/blog"
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:border-emerald-500/20 hover:text-emerald-600"
                  >
                    {lang === 'ja'
                      ? 'ブログ一覧へ'
                      : lang === 'zh'
                        ? '返回博客列表'
                        : lang === 'tw'
                          ? '返回部落格列表'
                          : 'Back to blog'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={post.kbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    {isToolArticle
                      ? lang === 'ja'
                        ? 'ツールを開く'
                        : lang === 'zh'
                          ? '打开工具'
                          : lang === 'tw'
                            ? '開啟工具'
                            : 'Open tool'
                      : lang === 'ja'
                        ? 'KB の全文へ'
                        : lang === 'zh'
                          ? '去 KB 看全文'
                          : lang === 'tw'
                            ? '去 KB 看全文'
                            : 'Open KB article'}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
