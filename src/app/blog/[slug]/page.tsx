import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Clock,
  Code2,
  Layers3,
  Sparkles,
} from 'lucide-react'
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

  const relatedPosts = getBlogPosts(lang)
    .filter((entry) => post.related.includes(entry.slug))
    .slice(0, 3)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 mt-6 md:mt-8 mb-28 relative">
        <div className={`absolute inset-x-0 top-0 h-[420px] bg-gradient-to-br ${post.accent} blur-3xl opacity-80 -z-10`} />

        <div className="mb-8">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-[11px] font-medium tracking-[0.16em] text-zinc-600 transition-colors hover:border-emerald-500/30 hover:text-emerald-600"
          >
            <ArrowLeft className="w-4 h-4" />
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
                <Calendar className="w-3.5 h-3.5" />
                {post.date}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                <Clock className="w-3.5 h-3.5" />
                {post.readTime}
              </span>
            </div>

            <h1 className="mt-6 max-w-4xl text-4xl font-black tracking-tighter text-zinc-900 sm:text-5xl md:text-6xl leading-tight">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-700">
              {post.summary}
            </p>
          </div>

          <div className="grid gap-6 border-b border-zinc-100 px-6 py-8 sm:grid-cols-3 sm:px-10">
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50/70 p-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                {lang === 'ja' ? '読みどころ' : lang === 'zh' ? '阅读重点' : lang === 'tw' ? '閱讀重點' : 'Highlights'}
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-700">
                {lang === 'ja'
                  ? 'この文章は、需求、設計、実装の順で、OpsKitPro をどう組み立てたかをまとめています。'
                  : lang === 'zh'
                    ? '这篇文章按“需求 → 设计 → 实现”的顺序，拆解 OpsKitPro 的搭建思路。'
                    : lang === 'tw'
                      ? '這篇文章按照「需求 → 設計 → 實作」的順序，拆解 OpsKitPro 的搭建思路。'
                      : 'This article follows the path from requirements to design to implementation.'}
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50/70 p-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
                {lang === 'ja' ? '補足' : lang === 'zh' ? '补充说明' : lang === 'tw' ? '補充說明' : 'Note'}
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-700">
                {lang === 'ja'
                  ? '本文の本文は中国語で整理しています。タイトルと要約は、サイトの言語設定に合わせて切り替わります。'
                  : lang === 'zh'
                    ? '正文先以中文整理，标题和摘要会随站点语言切换。'
                    : lang === 'tw'
                      ? '正文先以中文整理，標題和摘要會隨站點語言切換。'
                      : 'The body is currently written in Chinese-first form. Titles and summaries follow the site language.'}
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-zinc-50/70 p-5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                <Layers3 className="w-3.5 h-3.5 text-emerald-500" />
                {lang === 'ja' ? '関連ファイル' : lang === 'zh' ? '相关文件' : lang === 'tw' ? '相關文件' : 'Files'}
              </div>
              <p className="mt-3 text-sm leading-7 text-zinc-700">
                {lang === 'ja'
                  ? 'README、UI、API、i18n、デプロイの各層にまたがる内容です。'
                  : lang === 'zh'
                    ? '内容覆盖 README、UI、API、i18n 与部署等多个层面。'
                    : lang === 'tw'
                      ? '內容覆蓋 README、UI、API、i18n 與部署等多個層面。'
                      : 'The article spans README, UI, API, i18n, and deployment layers.'}
              </p>
            </div>
          </div>

          <div className="grid gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-10">
              {post.sections.map((section, index) => (
                <section key={index} className="space-y-4">
                  <h2 className="text-2xl font-black tracking-tighter text-zinc-900">{section.heading}</h2>
                  {section.paragraphs.map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex} className="text-sm leading-8 text-zinc-700">
                      {paragraph}
                    </p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="space-y-2 rounded-3xl border border-zinc-100 bg-zinc-50/60 p-5">
                      {section.bullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-zinc-700">
                          <span className="mt-2 h-2 w-2 rounded-full bg-emerald-500" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {section.files?.length ? (
                    <div className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm">
                      <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                        <Code2 className="w-3.5 h-3.5 text-emerald-500" />
                        {lang === 'ja' ? 'コード参照' : lang === 'zh' ? '代码参考' : lang === 'tw' ? '程式碼參考' : 'Code references'}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {section.files.map((file) => (
                          <span
                            key={file}
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-mono text-zinc-700"
                          >
                            {file}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </section>
              ))}
            </div>

            <aside className="space-y-6">
              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === 'ja' ? 'シリーズ一覧' : lang === 'zh' ? '系列文章' : lang === 'tw' ? '系列文章' : 'Series'}
                </div>
                <div className="mt-4 space-y-3">
                  {relatedPosts.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className="block rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 transition-colors hover:border-emerald-500/20 hover:bg-emerald-50/40"
                    >
                      <p className="text-xs font-semibold tracking-[0.16em] text-emerald-600">{item.tag}</p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-900">{item.title}</p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === 'ja' ? '次の一歩' : lang === 'zh' ? '下一步' : lang === 'tw' ? '下一步' : 'Next step'}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-700">
                  {lang === 'ja'
                    ? '必要なら、サービス矩阵や個別ツールの実装記事も続けて読めます。'
                    : lang === 'zh'
                      ? '如果想继续深入，可以接着看服务矩阵或各个工具模块的实现。'
                      : lang === 'tw'
                        ? '如果想繼續深入，可以接著看服務矩陣或各個工具模組的實作。'
                        : 'If you want to go deeper, continue with the service matrix or individual tool modules.'}
                </p>
                <Link
                  href="/blog"
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  {lang === 'ja' ? 'ブログ一覧へ' : lang === 'zh' ? '返回博客列表' : lang === 'tw' ? '返回部落格列表' : 'Back to blog'}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
