import { cookies } from 'next/headers'
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
  Menu,
  Fingerprint
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { LanguageToggle } from '@/components/LanguageToggle'

export const runtime = 'edge'

export default async function Home() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)

  return (
    <>
      {/* Header / Nav */}
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <Link href={`/`} className="group flex items-center gap-3 no-underline outline-none">
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
          <span className="font-mono text-xl font-bold tracking-tight text-zinc-900 group-hover:text-accent transition-colors">
            deops<span className="text-accent animate-pulse">_</span>
          </span>
        </Link>

        <nav className="hidden md:flex gap-8 items-center font-mono text-sm">
          <Link href={`/services`} className="text-zinc-600 hover:text-zinc-900 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <TerminalSquare className="w-4 h-4" /> {dict.nav.services}
          </Link>
          <Link href={`/blog`} className="text-zinc-600 hover:text-zinc-900 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" /> {dict.nav.blog}
          </Link>
          <a href="https://kb.deops.org" target="_blank" rel="noopener noreferrer" className="text-zinc-600 hover:text-zinc-900 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> {dict.nav.kb}
          </a>
          <Link href={`/about`} className="text-zinc-600 hover:text-zinc-900 hover:-translate-y-0.5 transition-all flex items-center gap-2">
            <Fingerprint className="w-4 h-4" /> {dict.nav.about}
          </Link>
          <div className="flex items-center gap-2 ml-4 border-l border-zinc-200 pl-6">
            <LanguageToggle currentLang={lang} />
          </div>

          <Link href="https://github.com/will-opz/deops.org" target="_blank" className="text-zinc-600 hover:text-zinc-900 hover:-translate-y-0.5 transition-all flex items-center gap-2 ml-4">
            <Github className="w-5 h-5" />
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-zinc-600 hover:text-zinc-900">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 z-10 mt-12 md:mt-20 mb-32 relative">
        {/* Subtle Hero Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-accent/5 blur-[120px] rounded-full pointer-events-none z-[-1]"></div>

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-white/80 text-xs font-mono text-accent mb-6 shadow-lg backdrop-blur-sm animate-in fade-in duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            {dict.home.system_status}
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-zinc-900 tracking-tighter leading-[1.05] mb-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-100">
            {dict.home.title_part1} <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 font-mono italic">{dict.home.title_part2}</span>
          </h1>
          
          <p className="text-lg md:text-xl text-zinc-600 max-w-2xl mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
            {dict.home.subtitle}
          </p>
        </div>

        {/* Quick Access HUD */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 px-6 py-3 rounded-2xl border border-black/5 bg-white/80 backdrop-blur-xl mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-zinc-600 border-r border-black/10 pr-6 mr-2 hidden sm:flex">
              <Terminal className="w-3.5 h-3.5 text-accent/70" />
              <span className="text-[11px] font-mono uppercase tracking-[0.15em] font-medium">
                {dict.home.quick_access}
              </span>
            </div>
            <Link href={`/tools/passgen`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
              <div className="w-7 h-7 rounded-md bg-orange-500/10 flex items-center justify-center group-hover:bg-orange-500/20 transition-colors">
                <Zap className="w-4 h-4 text-orange-600 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.home.tool_passgen}</span>
            </Link>
          </div>
          
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

          <Link href={`/services`} className="flex items-center gap-2.5 group hover:bg-black/5 px-3 py-1.5 rounded-lg transition-all">
            <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <TerminalSquare className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            </div>
            <span className="text-sm font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors">{dict.nav.services}</span>
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

          <a href="https://kb.deops.org" target="_blank" rel="noopener noreferrer" id="kb" className="glass-card p-8 rounded-xl group hover:border-cyan-500/30 transition-all scroll-mt-24 no-underline cursor-pointer">
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

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200/50 bg-white/80 backdrop-blur-md z-10 mt-auto">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-zinc-500 text-sm font-mono flex items-center gap-2">
            {dict.footer.copyright}
            <span className="hidden md:inline text-zinc-700">|</span>
            <Link href="https://github.com/will-opz/deops.org" target="_blank" className="hover:text-zinc-700 transition-colors">
              GitHub
            </Link>
            <span className="hidden md:inline text-zinc-700">|</span>
            <span className="hidden md:inline hover:text-zinc-700 transition-colors cursor-default">{dict.footer.slogan}</span>
          </div>
          
          <div className="flex items-center gap-3 bg-[#fafafa]/50 px-4 py-2 rounded-full border border-zinc-200/80 hover:border-emerald-500/30 transition-colors cursor-help">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">{dict.footer.all_systems_operational}</span>
          </div>
        </div>
      </footer>
    </>
  )
}
