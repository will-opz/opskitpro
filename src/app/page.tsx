import { cookies } from 'next/headers'
import Link from 'next/link'
import { 
  BrainCircuit, 
  ArrowUpRight, 
  Zap,
  Terminal,
  QrCode,
  TerminalSquare,
  BookOpen,
  Globe,
  FileText,
  Braces
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'


export default async function Home() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 z-10 mt-12 md:mt-20 mb-32 relative">
        {/* Subtle Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none z-[-1]"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center">

          <h1 className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100 flex flex-col items-center">
            <span className="block text-4xl md:text-5xl lg:text-6xl font-medium text-zinc-600 tracking-[-0.02em] leading-[1.3] mb-4">
              {dict.home.title_part1}
            </span>
            <span className="block text-5xl md:text-7xl lg:text-8xl font-black text-zinc-900 tracking-[-0.04em] leading-tight">
              {dict.home.title_part2_pre}
              <span className="inline-flex items-center mx-3 font-mono ai-glow tracking-[0.05em] select-none">
                <span className="text-zinc-200 font-light opacity-50 mr-2">[</span>
                <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600">
                  {dict.home.title_part2_ai}
                </span>
                <span className="text-zinc-200 font-light opacity-50 ml-2">]</span>
              </span>
              {dict.home.title_part2_suf}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            {dict.home.subtitle}
          </p>
        </div>

        {/* Quick Access HUD */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 px-8 py-3 rounded-2xl border border-black/5 bg-white/80 backdrop-blur-xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 shadow-2xl">
          <Link href={`/services`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <TerminalSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.nav.services}</span>
          </Link>

          <div className="h-6 w-px bg-black/10 hidden md:block" />

          <Link href={`/tools/passgen`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
              <Zap className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.home.tool_passgen}</span>
          </Link>
          
          <div className="h-6 w-px bg-black/10 hidden md:block" />
          
          <Link href={`/tools/qrgen`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <QrCode className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.home.tool_qrgen}</span>
          </Link>
          
          <div className="h-6 w-px bg-black/10 hidden md:block" />

          <Link href={`/tools/ip`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Globe className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.home.tool_ip}</span>
          </Link>

          <div className="h-6 w-px bg-black/10 hidden md:block" />

          <Link href={`/tools/json`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-zinc-500/10 flex items-center justify-center group-hover:bg-zinc-500/20 transition-colors">
              <Braces className="w-4 h-4 text-zinc-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.home.tool_json || 'JSON'}</span>
          </Link>

          <div className="h-6 w-px bg-black/10 hidden md:block" />

          <Link href={`/tools/websocket`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <Zap className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.home.tool_websocket || 'WS'}</span>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl text-left">
          <div id="insight" className="glass-card p-8 rounded-xl group cursor-default scroll-mt-24">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <BrainCircuit className="w-6 h-6 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
              {dict.home.card1_title}
              <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-600 transition-colors opacity-0 group-hover:opacity-100" />
            </h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              {dict.home.card1_desc}
            </p>
          </div>

          <a href="https://kb.opskitpro.com" target="_blank" rel="noopener noreferrer" id="kb" className="glass-card p-8 rounded-xl group hover:border-cyan-500/30 transition-all scroll-mt-24 no-underline cursor-pointer">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
              <BookOpen className="w-6 h-6 text-cyan-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
              {dict.home.card3_title}
              <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-600 transition-colors opacity-0 group-hover:opacity-100" />
            </h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              {dict.home.card3_desc}
            </p>
          </a>

          <Link href={`/services`} className="glass-card p-8 rounded-xl group hover:border-orange-500/30 transition-all scroll-mt-24 no-underline">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
              <Zap className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
              {dict.home.card4_title}
              <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-orange-600 transition-colors opacity-0 group-hover:opacity-100" />
            </h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              {dict.home.card4_desc}
            </p>
          </Link>

          <Link href={`/blog`} id="blog" className="glass-card p-8 rounded-xl group hover:border-purple-500/30 transition-all scroll-mt-24 no-underline">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-purple-500/20 transition-all">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-900 mb-3 flex items-center gap-2">
              {dict.home.card5_title || "Technical Blog"}
              <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-purple-600 transition-colors opacity-0 group-hover:opacity-100" />
            </h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              {dict.home.card5_desc || "Deep dives into Kubernetes, SRE workflows, and AI automation."}
            </p>
          </Link>
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
