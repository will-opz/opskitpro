import { cookies } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Zap,
  Globe,
  Activity,
  History,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import HomeSearch from '@/components/HomeSearch'
import { getBlogPosts } from '@/content/blog-posts'

export default async function Home() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
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

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      {/* 1. Hero Section & 2. Quick Detection (via HomeSearch) */}
      <main className="flex-grow flex flex-col items-center justify-start text-center px-6 z-10 mt-6 md:mt-8 mb-20 md:mb-24 pt-5 md:pt-8 relative">
        {/* Subtle Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-accent/5 blur-[150px] rounded-full pointer-events-none z-[-1]"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <h1 className="mb-5 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 flex flex-col items-center gap-2 leading-none">
            {/* Label badge */}
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-sm font-bold ${
                isJapanese ? 'tracking-[0.18em]' : 'font-mono tracking-widest uppercase'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {heroBadge}
            </span>
            {isJapanese ? (
              <>
                <span className="block text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-zinc-900 tracking-[-0.03em] leading-[1.05] text-center">
                  DNS・IP・サイトを
                </span>
                <span className="block text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-zinc-900 tracking-[-0.03em] leading-[1.02] text-center">
                  <span className="relative inline-block">
                    <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-700 ai-glow">
                      まとめて
                    </span>
                    {/* Underline accent */}
                    <span className="absolute bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full opacity-60" />
                  </span>
                  診断
                </span>
              </>
            ) : (
              <span className="block text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-zinc-900 tracking-[-0.04em] leading-[1.0] text-center">
                {dict.home.title_part2_pre}
                <span className="relative inline-block mx-3">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-emerald-500 to-emerald-700 ai-glow">
                    {dict.home.title_part2_ai}
                  </span>
                  {/* Underline accent */}
                  <span className="absolute bottom-1 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full opacity-60" />
                </span>
                {dict.home.title_part2_suf}
              </span>
            )}
          </h1>
          
          <p className={`text-sm md:text-base max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 font-medium text-center text-balance ${
            isJapanese ? 'text-zinc-700/90' : 'text-zinc-700/85'
          }`}>
            {heroSubtitle}
          </p>
        </div>

        {/* Global Diagnostic Input */}
        <HomeSearch dict={dict} />

        {/* Compact Status Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-6xl mb-14 md:mb-16 px-0 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
          {[
            {
              label: isJapanese ? 'すぐに確認' : 'Quick Check',
              value: isJapanese ? 'URL を入れて即診断' : 'Instant lookup with one URL',
              tone: 'emerald',
            },
            {
              label: isJapanese ? '確認範囲' : 'Coverage',
              value: isJapanese ? 'DNS・SSL・CDN・HTTP' : 'DNS, SSL, CDN, HTTP',
              tone: 'zinc',
            },
            {
              label: isJapanese ? '利用条件' : 'Availability',
              value: isJapanese ? 'ログイン不要・すぐ使える' : 'No login, ready to use',
              tone: 'emerald',
            },
          ].map((item) => (
            <div key={item.label} className="bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl p-4 sm:p-5 shadow-sm text-left flex items-start justify-between gap-4">
              <div>
                <div className={`text-[10px] font-bold uppercase tracking-[0.35em] ${item.tone === 'emerald' ? 'text-emerald-500' : 'text-zinc-400'}`}>{item.label}</div>
                <div className="mt-2 text-sm sm:text-base font-semibold text-zinc-800 leading-snug">{item.value}</div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full mt-1 ${item.tone === 'emerald' ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
            </div>
          ))}
        </div>

        {/* 3. Core Tools Section (Focused 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full max-w-6xl mb-16 md:mb-20 px-0 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-600">
          <Link href={`/tools/website-check`} className="glass-card p-8 rounded-[2rem] group hover:border-emerald-500/30 transition-all text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3 flex items-center gap-2 tracking-tight">
              {dict.home.card1_title}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {dict.home.card1_desc}
            </p>
          </Link>

          <Link href={`/tools/ip-lookup`} className="glass-card p-8 rounded-[2rem] group hover:border-purple-500/30 transition-all text-left">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3 flex items-center gap-2 tracking-tight">
              {dict.home.card2_title}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {dict.home.card2_desc}
            </p>
          </Link>

          <Link href={`/tools/dns-lookup`} className="glass-card p-8 rounded-[2rem] group hover:border-orange-500/30 transition-all text-left">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
              <History className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-zinc-900 mb-3 flex items-center gap-2 tracking-tight">
              {dict.home.card3_title}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed">
              {dict.home.card3_desc}
            </p>
          </Link>
        </div>

        {/* 4. Common Use Cases (Scenes) */}
        <div className="w-full max-w-7xl mb-32 text-left bg-white border border-black/5 shadow-sm rounded-2xl sm:rounded-[3rem] p-6 sm:p-12 md:p-24 relative overflow-hidden transition-all hover:shadow-xl group">
           <div className="absolute top-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-emerald-500/5 blur-[120px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
           <div className="relative z-10">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-zinc-900 tracking-tight mb-8 sm:mb-12">
                 {dict.home.scenes.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-12">
                 {[
                   { title: dict.home.scenes.s1_title, desc: dict.home.scenes.s1_desc, icon: AlertCircle },
                   { title: dict.home.scenes.s2_title, desc: dict.home.scenes.s2_desc, icon: Zap },
                   { title: dict.home.scenes.s3_title, desc: dict.home.scenes.s3_desc, icon: Globe },
                 ].map((scene, i) => (
                   <div key={i} className="flex flex-col gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500">
                         <scene.icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-xl font-semibold text-zinc-900 tracking-tight">{scene.title}</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed truncate-3">{scene.desc}</p>
                 </div>
               ))}
              </div>
           </div>
        </div>

        {/* 5. Featured Intel / Technical Notes (Articles) */}
        <div className="w-full max-w-7xl mb-12 text-left">
           <div className="flex items-center justify-between mb-10 border-b border-zinc-200/50 pb-6">
              <div>
                 <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                   {dict.home.blog_section?.title || "FEATURED_INTEL"}
                 </h2>
                 <p className="text-xs text-zinc-500 mt-1 tracking-[0.22em] uppercase">
                   {dict.home.blog_section?.subtitle || "Technical Notes"}
                 </p>
              </div>
              <Link href="/blog" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                 {dict.home.blog_section?.view_all || "VIEW_ALL_POSTS"}
                 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>

           <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {latestNotes.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-zinc-100 bg-white/90 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-xl"
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
                    <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                      <span>{post.date}</span>
                      <span className="text-emerald-600">{post.readTime}</span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-emerald-600 sm:text-[1.05rem]">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-500">
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
