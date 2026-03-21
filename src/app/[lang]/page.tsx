import Link from 'next/link'
import { 
  BrainCircuit, 
  ArrowUpRight, 
  Zap,
  Github,
  Terminal,
  QrCode,
  TerminalSquare,
  BookOpen,
  Globe,
  FileText,
  Menu
} from 'lucide-react'
import { getDictionary } from '../../dictionaries'

export const runtime = 'edge'

export default async function Home({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang)

  return (
    <>
      {/* Header / Nav */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <Link href={`/${lang}`} className="group flex items-center gap-3 no-underline outline-none">
          {/* Geometric Logo: d, o, and >_ */}
          <svg className="logo-svg w-10 h-10" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="36" height="36" rx="8" stroke="#3f3f46" strokeWidth="2" className="group-hover:stroke-accent/50"/>
            <circle cx="14" cy="20" r="5" stroke="#d4d4d8" strokeWidth="2" className="group-hover:stroke-white"/>
            <path d="M19 12v13" stroke="#d4d4d8" strokeWidth="2" strokeLinecap="round" className="group-hover:stroke-white"/>
            <circle cx="26" cy="20" r="5" stroke="#d4d4d8" strokeWidth="2" className="group-hover:stroke-white"/>
            <path d="M16 30h8" stroke="#10b981" strokeWidth="2" strokeLinecap="round" className="group-hover:shadow-[0_0_10px_#10b981]"/>
            <circle cx="26" cy="12" r="1.5" fill="#10b981"/>
            <path d="M26 13.5v1.5" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2"/>
          </svg>
          <span className="font-mono text-xl font-bold tracking-tight text-white group-hover:text-accent transition-colors">
            deops<span className="text-accent animate-pulse">_</span>
          </span>
        </Link>

        <nav className="hidden md:flex gap-8 items-center font-mono text-sm">
          <Link href={`/${lang}#kb`} className="text-zinc-400 hover:text-white hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> {dict.nav.kb}
          </Link>
          <Link href={`/${lang}/services`} className="text-zinc-400 hover:text-white hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <TerminalSquare className="w-4 h-4" /> {dict.nav.services}
          </Link>
          <Link href={`/${lang}#blog`} className="text-zinc-400 hover:text-white hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" /> {dict.nav.blog}
          </Link>
          <div className="flex items-center gap-2 ml-4 border-l border-zinc-800 pl-6">
            <Link href="/zh" className={`text-xs font-bold transition-colors ${lang === 'zh' ? 'text-accent' : 'text-zinc-500 hover:text-white'}`}>ZH</Link>
            <span className="text-zinc-700 text-xs">/</span>
            <Link href="/en" className={`text-xs font-bold transition-colors ${lang === 'en' ? 'text-accent' : 'text-zinc-500 hover:text-white'}`}>EN</Link>
          </div>

          <Link href="https://github.com/will-opz/deops.org" target="_blank" className="text-zinc-400 hover:text-white hover:-translate-y-0.5 transition-all flex items-center gap-2 ml-4">
            <Github className="w-5 h-5" />
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-zinc-400 hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 z-10 mt-12 md:mt-20 mb-32 relative">
        {/* Subtle Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none z-[-1]"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-accent mb-6 shadow-lg backdrop-blur-sm animate-in fade-in duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            {dict.home.system_status}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.05] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            {dict.home.title_part1} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-mono italic">{dict.home.title_part2}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            {dict.home.subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-14 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <Link href={`/${lang}/services`} className="px-8 py-3.5 rounded-md bg-white text-zinc-900 font-semibold hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Zap className="w-5 h-5" /> {dict.home.btn_init}
            </Link>
            <Link href="https://github.com/will-opz/deops.org" target="_blank" className="px-8 py-3.5 rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-300 font-mono text-sm hover:border-zinc-500 hover:bg-zinc-800 active:scale-95 transition-all flex items-center justify-center gap-2 outline-none">
              <Github className="w-5 h-5" /> {dict.home.btn_docs}
            </Link>
          </div>
        </div>

        {/* Quick Access HUD */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 px-6 py-3 rounded-2xl border border-white/5 bg-zinc-900/40 backdrop-blur-xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-400 border-r border-white/10 pr-6 mr-2 hidden sm:flex">
              <Terminal className="w-3.5 h-3.5 text-accent/70" />
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium">
                {dict.home.quick_access}
              </span>
            </div>
            <Link href={`/${lang}/tools/passgen`} className="flex items-center gap-2.5 group hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">
              <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <Zap className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">{dict.home.tool_passgen}</span>
            </Link>
          </div>
          
          <div className="h-6 w-px bg-white/10 hidden md:block" />
          
          <Link href={`/${lang}/tools/qrgen`} className="flex items-center gap-2.5 group hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-cyan-500/10 flex items-center justify-center group-hover:bg-cyan-500/20 transition-colors">
              <QrCode className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">{dict.home.tool_qrgen}</span>
          </Link>
          
          <div className="h-6 w-px bg-white/10 hidden md:block" />

          <Link href={`/${lang}/tools/ip`} className="flex items-center gap-2.5 group hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Globe className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">{dict.home.tool_ip}</span>
          </Link>

          <div className="h-6 w-px bg-white/10 hidden md:block" />

          <Link href={`/${lang}/services`} className="flex items-center gap-2.5 group hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <TerminalSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-400 group-hover:text-white transition-colors">{dict.nav.services}</span>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl text-left">
          <div id="blog" className="glass-card p-8 rounded-xl group cursor-default scroll-mt-24">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all">
              <BrainCircuit className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              {dict.home.card1_title}
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors opacity-0 group-hover:opacity-100" />
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {dict.home.card1_desc}
            </p>
          </div>

          <div id="kb" className="glass-card p-8 rounded-xl group cursor-default scroll-mt-24">
            <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all">
              <BookOpen className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              {dict.home.card3_title}
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100" />
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {dict.home.card3_desc}
            </p>
          </div>

          <Link href={`/${lang}/services`} className="glass-card p-8 rounded-xl group hover:border-orange-500/30 transition-all scroll-mt-24 no-underline">
            <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
              <Zap className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              {dict.home.card4_title}
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-orange-400 transition-colors opacity-0 group-hover:opacity-100" />
            </h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              {dict.home.card4_desc}
            </p>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-800/50 bg-zinc-950/80 backdrop-blur-md z-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-zinc-500 text-sm font-mono flex items-center gap-2">
            {dict.footer.copyright}
            <span className="hidden md:inline text-zinc-700">|</span>
            <Link href="https://github.com/will-opz/deops.org" target="_blank" className="hover:text-zinc-300 transition-colors">
              GitHub
            </Link>
            <span className="hidden md:inline text-zinc-700">|</span>
            <span className="hidden md:inline hover:text-zinc-300 transition-colors cursor-default">{dict.footer.slogan}</span>
          </div>
          
          <div className="flex items-center gap-3 bg-black/50 px-4 py-2 rounded-full border border-zinc-800/80 hover:border-emerald-500/30 transition-colors cursor-help">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest">{dict.footer.all_systems_operational}</span>
          </div>
        </div>
      </footer>
    </>
  )
}
