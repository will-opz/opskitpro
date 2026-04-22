import { cookies } from 'next/headers'
import Link from 'next/link'
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

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 z-10 mt-6 md:mt-8 mb-28 relative">
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="mb-12 text-center md:text-left border-b border-zinc-100 pb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.28em] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {isJapanese ? '技術記事' : isZh ? '技术笔记' : 'Field Notes'}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter mb-6 leading-tight">
            {dict.nav.blog}
          </h1>
          <p className="text-sm sm:text-base text-zinc-700 max-w-xl font-medium leading-relaxed">
            {isJapanese
              ? '可観測性、サイト信頼性、エッジ基盤の現場メモをまとめています。'
              : isZh
                ? '这里整理了 OpsKitPro 的需求定义、设计原则、模块实现与工程收口。'
                : 'This section collects the product requirements, design choices, module implementations, and engineering wrap-up behind OpsKitPro.'}
            <br />
            <span className="opacity-40 mt-2 block">
              {isJapanese ? 'OpsKitPro ナレッジベースと連携しています。' : 'Powered by OpsKitPro Content Engine.'}
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
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
              className="bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-4"
            >
              <div>
                <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-[0.28em]">{item.label}</div>
                <div className="mt-2 text-sm text-zinc-700 leading-snug">{item.value}</div>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, idx) => {
            const Icon = CARD_ICONS[idx % CARD_ICONS.length]

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-white border border-black/5 rounded-[2rem] p-7 shadow-sm hover:shadow-2xl hover:border-emerald-500/20 transition-all relative overflow-hidden min-h-[280px]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${post.accent} opacity-80`} />
                <Icon className="absolute top-0 right-0 p-8 scale-150 opacity-[0.03] group-hover:opacity-10 transition-opacity" />

                <div className="relative z-10 flex h-full flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <span className="px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase bg-white/80 text-emerald-600">
                      {post.tag}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <Clock className="w-3 h-3" /> {post.readTime}
                    </div>
                  </div>

                  <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 group-hover:text-emerald-600 transition-colors leading-tight mb-3">
                    {post.title}
                  </h3>
                  <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed opacity-80 mb-6">
                    {post.summary}
                  </p>

                  <div className="mt-auto pt-5 border-t border-zinc-50 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-[0.18em]">{post.date}</span>
                    <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}

          <div className="lg:col-span-1 bg-white border border-black/5 rounded-[2rem] p-8 text-zinc-900 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative overflow-hidden group min-h-[280px]">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <BookOpen className="w-16 h-16" />
            </div>
            <div>
              <h4 className="text-[10px] font-semibold text-emerald-500 uppercase tracking-[0.22em] mb-6 underline decoration-emerald-500/30 underline-offset-4">
                {isJapanese ? '関連リンク' : isZh ? '延伸阅读' : 'Further reading'}
              </h4>
              <h3 className="text-2xl font-black tracking-tighter mb-4">
                {isJapanese ? 'ナレッジベースで深掘りする' : isZh ? '去知识库继续深挖' : 'Keep digging in the knowledge base'}
              </h3>
              <p className="text-[10px] text-zinc-400 leading-relaxed mb-8 opacity-80 uppercase tracking-[0.18em]">
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
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-semibold text-base hover:scale-[1.02] transition-all flex items-center gap-3 group shadow-xl shadow-emerald-500/20"
            >
              {isJapanese ? 'ナレッジを見る' : isZh ? '打开知识库' : 'Open knowledge base'}
              <Radio className="w-5 h-5 group-hover:animate-pulse" />
            </a>
          </div>
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}

