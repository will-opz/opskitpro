import Link from "next/link";

export function SiteFooter({ dict }: { dict: any }) {
  return (
    <footer className="z-10 mt-auto w-full border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/78 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="ui-muted flex items-center gap-2 text-sm font-sans">
          {dict.footer.copyright}
          <span className="ui-faint hidden md:inline">|</span>
          <Link
            href="https://github.com/will-opz/opskitpro"
            target="_blank"
            className="hover:text-[var(--text-primary)]"
          >
            GitHub
          </Link>
          <span className="ui-faint hidden md:inline">|</span>
          <span className="hidden cursor-default md:inline hover:text-[var(--text-primary)]">
            {dict.footer.slogan}
          </span>
        </div>

        <div className="ui-surface flex cursor-help items-center gap-3 rounded-full px-4 py-2 hover:border-emerald-500/30">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 duration-1000"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="ui-muted text-[11px] font-medium tracking-[0.14em]">
            {dict.footer.all_systems_operational}
          </span>
        </div>
      </div>
    </footer>
  );
}
