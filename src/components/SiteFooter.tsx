import Link from 'next/link'

export function SiteFooter({ dict }: { dict: any }) {
  return (
    <footer className="w-full border-t border-zinc-200/50 bg-white/80 backdrop-blur-md z-10 mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-zinc-500 text-sm font-sans flex items-center gap-2">
          {dict.footer.copyright}
          <span className="hidden md:inline text-zinc-700">|</span>
          <Link href="https://github.com/will-opz/opskitpro" target="_blank" className="hover:text-zinc-700 transition-colors">
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
          <span className="text-[11px] font-medium text-zinc-600 tracking-[0.14em]">{dict.footer.all_systems_operational}</span>
        </div>
      </div>
    </footer>
  )
}
