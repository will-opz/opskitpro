"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, KeyRound, Menu, TerminalSquare, X } from "lucide-react";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { type ActiveLocale, type Locale } from "@/lib/i18n";

export function SiteHeader({ dict, lang }: { dict: any; lang: Locale }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const localizedHref = (path: string) => `/${lang}${path === "/" ? "" : path}`;
  const copy = {
    zh: {
      allTools: "全部工具",
      websiteCheck: "网站检测",
      password: "密码生成器",
      menu: "打开工具菜单",
    },
    en: {
      allTools: "All tools",
      websiteCheck: "Website Check",
      password: "Password Generator",
      menu: "Open tools menu",
    },
  }[lang];

  const isActive = (path: string) => {
    const normalizedPathname = pathname.replace(/^\/(zh|en|ja|tw)/, "") || "/";
    return (
      normalizedPathname === path ||
      (path !== "/" && normalizedPathname.startsWith(path + "/"))
    );
  };

  const navItems = [
    {
      href: "/tools/website-check",
      label: copy.websiteCheck,
      icon: Activity,
    },
    { href: "/tools", label: copy.allTools, icon: TerminalSquare },
    { href: "/tools/passgen", label: copy.password, icon: KeyRound },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href={localizedHref("/")}
          className="group relative z-50 flex items-center gap-3 no-underline outline-none"
        >
          <div className="relative transition-transform duration-500 group-hover:-rotate-6">
            <img
              src="/logo.svg"
              alt="OpsKitPro logo"
              width={44}
              height={44}
              className="rounded-xl border border-[var(--border-subtle)] bg-zinc-950 shadow-[0_0_18px_rgba(16,185,129,0.28)]"
            />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-color)] sm:text-xl">
            OpsKit<span className="text-emerald-500">Pro_</span>
          </span>
          <div className="ui-surface hidden items-center gap-2 rounded-full px-3 py-1.5 lg:flex">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span className="ui-muted mt-0.5 text-[10px] font-semibold leading-none tracking-[0.16em]">
              {dict.home.system_status}
            </span>
          </div>
        </Link>

        <nav className="ui-surface hidden items-center gap-1 rounded-full px-1.5 py-1.5 text-sm md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={localizedHref(item.href)}
                className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 hover:-translate-y-0.5 ${
                  isActive(item.href)
                    ? "bg-[var(--accent-soft)] font-semibold text-[var(--text-primary)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive(item.href) ? "text-emerald-500" : ""}`}
                />
                {item.label}
              </Link>
            );
          })}
          <div className="ml-2 flex items-center gap-2 border-l border-[var(--border-subtle)] pl-3">
            <LanguageToggle currentLang={lang as ActiveLocale} />
            <ThemeToggle />
          </div>
        </nav>

        <div className="relative z-50 flex items-center gap-2 md:hidden">
          <LanguageToggle currentLang={lang as ActiveLocale} />
          <ThemeToggle />
          <button
            type="button"
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label={copy.menu}
            aria-expanded={isMenuOpen}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-30 cursor-default md:hidden"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--bg-primary) 92%, transparent)",
              }}
              onClick={() => setIsMenuOpen(false)}
            />
            <div className="fixed inset-x-3 top-[76px] z-40 md:hidden">
              <nav className="ui-surface-elevated flex flex-col rounded-2xl p-3 text-[var(--text-muted)] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={localizedHref(item.href)}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] ${
                        isActive(item.href) ? "bg-[var(--accent-soft)] text-[var(--accent-color)]" : ""
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
