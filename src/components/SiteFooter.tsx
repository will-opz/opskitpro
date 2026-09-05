import Link from "next/link";

export function SiteFooter({ dict, lang }: { dict: any; lang?: "zh" | "en" }) {
  const privacyHref = `/${lang ?? "en"}/privacy`;
  const privacyLabel = lang === "zh" ? "隐私政策" : "Privacy";

  return (
    <footer className="z-10 mt-auto w-full border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]/78 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="ui-muted flex items-center gap-2 text-sm font-sans">
          {dict.footer.copyright}
          <span className="ui-faint hidden md:inline">|</span>
          <Link
            href={privacyHref}
            className="hover:text-[var(--text-primary)]"
          >
            {privacyLabel}
          </Link>
          <span className="ui-faint hidden md:inline">|</span>
          <span className="hidden cursor-default md:inline hover:text-[var(--text-primary)]">
            {dict.footer.slogan}
          </span>
        </div>

        <nav aria-label={lang === "zh" ? "更多页面" : "More pages"} className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-[var(--text-secondary)]">
          {[["about", lang === "zh" ? "关于" : "About"], ["nav", lang === "zh" ? "我的导航" : "My navigation"], ["errors", lang === "zh" ? "错误速查" : "Error reference"], ["mcp", "MCP"]].map(([path, label]) => <Link key={path} href={`/${lang ?? "en"}/${path}`} className="hover:underline">{label}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
