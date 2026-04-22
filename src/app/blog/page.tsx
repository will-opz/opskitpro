import Image from 'next/image'
import { cookies } from 'next/headers'
import {
  ArrowRight,
  BookOpen,
  Clock,
  Eye,
  Globe,
  Radio,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { getBlogPosts } from '@/content/blog-posts'

const CARD_ICONS = [Terminal, Zap, ShieldCheck, Globe, Eye]

export default async function BlogPage() {
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const dict = await getDictionary(lang)
  const isZh = lang === 'zh'
  const isJapanese = lang === 'ja'
  const posts = getBlogPosts(lang)

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
          <p className="max-w-xl text-sm font-medium leading-relaxed text-zinc-700 sm:text-base">
            {isJapanese
              ? '可観測性、サイト信頼性、エッジ基盤の技術メモをまとめています。'
              : isZh
                ? '这里整理了 OpsKitPro 的技术笔记、需求、设计原则、模块实现与工程收口。'
                : 'This section collects OpsKitPro technical notes, requirements, design choices, module implementations, and engineering wrap-up.'}
            <br />
            <span className="mt-2 block opacity-40">
              {isJapanese ? 'OpsKitPro ナレッジベースと連携しています。' : 'Powered by OpsKitPro Content Engine.'}
            </span>
          </p>
        </div>

        <div className="mb-14 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              label: isJapanese ? '系列' : isZh ? '系列' : 'Series',
              value: isJapanese ? '需求、设计、实现、工程收口' : isZh ? '需求、设计、实现、工程收口' : 'Requirements, design, implementation, and delivery',
            },
            {
              label: isJapanese ? '用途' : isZh ? '用途' : 'Use case',
              value: isJapanese ? '排障与产品说明一起阅读' : isZh ? '既能看产品，也能看实现' : 'Read the product story together with the implementation',
            },
            {
              label: isJapanese ? '连携' : isZh ? '连携' : 'Link',
              value: isJapanese ? '知识库与博客同步更新' : isZh ? '知识库与博客同步更新' : 'Synced with the knowledge base',
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm backdrop-blur-md sm:p-5"
            >
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-500">{item.label}</div>
                <div className="mt-2 text-sm leading-snug text-zinc-700">{item.value}</div>
              </div>
              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, idx) => {
            const Icon = CARD_ICONS[idx % CARD_ICONS.length]

            return (
              <a
                key={post.slug}
                href={post.kbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm transition-all hover:border-emerald-500/20 hover:shadow-2xl"
              >
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={post.coverImage}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${post.accent} opacity-70`} />
                  <Icon className="absolute right-4 top-4 h-14 w-14 opacity-[0.08] transition-opacity group-hover:opacity-15" />
                </div>

                <div className="relative z-10 flex h-full flex-col p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="rounded-lg bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                      {post.tag}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <Clock className="h-3 w-3" /> {post.readTime}
                    </div>
                  </div>

                  <h3 className="mb-3 text-lg font-semibold leading-tight text-zinc-900 transition-colors group-hover:text-emerald-600 sm:text-xl">
                    {post.title}
                  </h3>
                  <p className="mb-6 line-clamp-3 text-xs leading-relaxed text-zinc-500 opacity-80">{post.summary}</p>

                  <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-5">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">{post.date}</span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-50 transition-all group-hover:translate-x-1 group-hover:bg-emerald-500 group-hover:text-white">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </a>
            )
          })}

          <div className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[2rem] border border-black/5 bg-white p-8 text-zinc-900 shadow-sm transition-all hover:shadow-xl lg:col-span-1">
            <div className="absolute right-0 top-0 p-8 opacity-[0.04] transition-opacity group-hover:opacity-10">
              <BookOpen className="h-16 w-16" />
            </div>
            <div>
              <h4 className="mb-6 text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-500 underline decoration-emerald-500/30 underline-offset-4">
                {isJapanese ? '関連リンク' : isZh ? '延伸阅读' : 'Further reading'}
              </h4>
              <h3 className="mb-4 text-2xl font-black tracking-tighter">
                {isJapanese ? 'ナレッジベースで深掘りする' : isZh ? '去知识库继续深挖' : 'Keep digging in the knowledge base'}
              </h3>
              <p className="mb-8 text-[10px] leading-relaxed uppercase tracking-[0.18em] text-zinc-400 opacity-80">
                {isJapanese
                  ? '設計メモ、運用記録、実装ノートをまとめています。'
                  : isZh
                    ? '设计笔记、运维记录、实现说明都会在这里继续整理。'
                    : 'Design notes, operations logs, and implementation write-ups live there.'}
              </p>
            </div>
            <a
              href="https://kb.opskitpro.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] hover:from-emerald-400 hover:to-teal-500"
            >
              {isJapanese ? 'ナレッジを見る' : isZh ? '打开知识库' : 'Open knowledge base'}
              <Radio className="h-5 w-5 group-hover:animate-pulse" />
            </a>
          </div>
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
