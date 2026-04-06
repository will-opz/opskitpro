import { cookies } from 'next/headers'
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

export default async function Home() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      {/* 1. Hero Section & 2. Quick Detection (via HomeSearch) */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 z-10 mt-12 md:mt-24 mb-32 relative">
        {/* Subtle Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 blur-[150px] rounded-full pointer-events-none z-[-1]"></div>

        <div className="max-w-5xl mx-auto flex flex-col items-center">
          <h1 className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 flex flex-col items-center gap-3 leading-none">
            {/* Label badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-sm font-mono font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {dict.home.title_part1}
            </span>
            {/* Main headline */}
            <span className="block text-5xl md:text-7xl lg:text-8xl font-black text-zinc-900 tracking-[-0.04em] leading-[1.0] text-center">
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
          </h1>
          
          <p className="text-sm md:text-base text-zinc-500 max-w-xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 font-mono text-center text-balance">
            {dict.home.subtitle}
          </p>
        </div>

        {/* Global Diagnostic Input */}
        <HomeSearch dict={dict} lang={lang} />

        {/* 3. Core Tools Section (Focused 3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-24 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-600">
          <Link href={`/tools/website-check`} className="glass-card p-8 rounded-[2rem] group hover:border-emerald-500/30 transition-all text-left">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2 uppercase tracking-tighter italic">
              {dict.home.card1_title}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-mono">
              {dict.home.card1_desc}
            </p>
          </Link>

          <Link href={`/tools/ip-lookup`} className="glass-card p-8 rounded-[2rem] group hover:border-purple-500/30 transition-all text-left">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <Globe className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2 uppercase tracking-tighter italic">
              {dict.home.card2_title}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-mono">
              {dict.home.card2_desc}
            </p>
          </Link>

          <Link href={`/tools/dns-lookup`} className="glass-card p-8 rounded-[2rem] group hover:border-orange-500/30 transition-all text-left">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
              <History className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2 uppercase tracking-tighter italic">
              {dict.home.card3_title}
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-zinc-500 text-sm leading-relaxed font-mono">
              {dict.home.card3_desc}
            </p>
          </Link>
        </div>

        {/* 4. Common Use Cases (Scenes) */}
        <div className="w-full max-w-7xl mb-32 text-left bg-white border border-black/5 shadow-sm rounded-[3rem] p-12 md:p-24 relative overflow-hidden transition-all hover:shadow-xl group">
           <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[120px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
           <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-black text-zinc-900 tracking-tighter italic mb-12 lowercase">
                 {dict.home.scenes.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                 {[
                   { title: dict.home.scenes.s1_title, desc: dict.home.scenes.s1_desc, icon: AlertCircle },
                   { title: dict.home.scenes.s2_title, desc: dict.home.scenes.s2_desc, icon: Zap },
                   { title: dict.home.scenes.s3_title, desc: dict.home.scenes.s3_desc, icon: Globe },
                 ].map((scene, i) => (
                   <div key={i} className="flex flex-col gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/5 flex items-center justify-center text-emerald-500">
                         <scene.icon className="w-5 h-5" />
                      </div>
                      <h4 className="text-xl font-bold text-zinc-900 italic tracking-tight">{scene.title}</h4>
                      <p className="text-zinc-500 text-sm font-mono leading-relaxed truncate-3">{scene.desc}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        {/* 5. Featured Intel / Technical Notes (Articles) */}
        <div className="w-full max-w-7xl mb-12 text-left">
           <div className="flex items-center justify-between mb-10 border-b border-zinc-200/50 pb-6">
              <div>
                 <h2 className="text-2xl font-black text-zinc-900 tracking-tight italic">
                   {dict.home.blog_section?.title || "FEATURED_INTEL"}
                 </h2>
                 <p className="text-xs text-zinc-500 font-mono mt-1 uppercase tracking-widest">
                   {dict.home.blog_section?.subtitle || "SRE Field Notes & Tech Forensics"}
                 </p>
              </div>
              <Link href="/blog" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group">
                 {dict.home.blog_section?.view_all || "VIEW_ALL_POSTS"}
                 <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(dict.home.blog_section?.posts || []).map((post: any, idx: number) => {
                const cardGradients = [
                  'from-emerald-500/10 via-cyan-500/5 to-emerald-500/10',
                  'from-purple-500/10 via-pink-500/5 to-purple-500/10',
                  'from-orange-500/10 via-amber-500/5 to-orange-500/10',
                ]
                const gridPattern = [
                  'radial-gradient(circle at 20% 80%, rgba(16,185,129,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(6,182,212,0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 80% 80%, rgba(168,85,247,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 20%, rgba(236,72,153,0.1) 0%, transparent 50%)',
                  'radial-gradient(circle at 50% 20%, rgba(249,115,22,0.15) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(245,158,11,0.1) 0%, transparent 50%)',
                ]
                return (
                <Link key={idx} href="/blog" className="group flex flex-col gap-4">
                   <div className="aspect-[16/9] w-full rounded-[1.5rem] overflow-hidden border border-zinc-200/60 relative">
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-white/80 backdrop-blur-md rounded text-[9px] font-bold font-mono tracking-widest border border-black/5 z-10">
                        {post.tag}
                      </div>
                      <div
                        className={`w-full h-full bg-gradient-to-br ${cardGradients[idx % 3]} group-hover:scale-105 transition-transform duration-700`}
                        style={{ backgroundImage: gridPattern[idx % 3] }}
                      >
                        {/* Subtle dot grid overlay */}
                        <div className="absolute inset-0 opacity-30"
                          style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.08) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                      </div>
                   </div>
                   <div>
                      <div className="text-[10px] text-zinc-400 font-mono mb-2">{post.date}</div>
                      <h3 className="text-base font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors leading-snug mb-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-mono">
                        {post.desc}
                      </p>
                   </div>
                </Link>
                )}
              )}
           </div>
        </div>
      </main>

      {/* 6. Footer (Handled by component) */}
      <SiteFooter dict={dict} />
    </>
  )
}
