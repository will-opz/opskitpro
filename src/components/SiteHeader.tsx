'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Github,
  Twitter,
  TerminalSquare,
  FileText,
  Menu,
  X,
  Fingerprint
} from 'lucide-react'
import { LanguageToggle } from '@/components/LanguageToggle'
import { ThemeToggle } from '@/components/ThemeToggle'

export function SiteHeader({ dict, lang }: { dict: any; lang: 'zh' | 'en' | 'ja' | 'tw' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    const normalizedPathname = pathname.replace(/^\/(zh|en|ja|tw)/, '') || '/'
    return normalizedPathname === path || (path !== '/' && normalizedPathname.startsWith(path + '/'))
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
      <Link href={`/`} className="group flex items-center gap-3 no-underline outline-none relative z-50">
        <div className="relative group-hover:-rotate-6 transition-transform duration-500">
          <img 
            src="/logo.svg" 
            alt="OpsKitPro logo" 
            width={44}
            height={44}
            className="rounded-xl border border-[var(--border-subtle)] bg-zinc-950 shadow-[0_0_18px_rgba(16,185,129,0.28)]" 
          />
        </div>
        <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)] group-hover:text-[var(--accent-color)] sm:text-xl">
          OpsKit<span className="text-emerald-500 animate-pulse">Pro_</span>
        </span>
        <div className="ui-surface hidden items-center gap-2 rounded-full px-3 py-1.5 lg:flex">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="ui-muted mt-0.5 text-[10px] font-semibold leading-none tracking-[0.16em]">{dict.home.system_status}</span>
        </div>
      </Link>

      {/* Desktop Nav */}
      <nav className="ui-surface hidden items-center gap-1 rounded-full px-1.5 py-1.5 text-sm md:flex">
        <Link href={`/tools`} className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 hover:-translate-y-0.5 ${isActive('/tools') ? 'bg-[var(--accent-soft)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'}`}>
          <TerminalSquare className={`w-4 h-4 ${isActive('/tools') ? 'text-emerald-500' : ''}`} /> {dict.nav.services}
        </Link>
        <Link href={`/blog`} className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 hover:-translate-y-0.5 ${isActive('/blog') ? 'bg-[var(--accent-soft)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'}`}>
          <FileText className={`w-4 h-4 ${isActive('/blog') ? 'text-emerald-500' : ''}`} /> {dict.nav.blog}
        </Link>
        <Link href={`/about`} className={`flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 hover:-translate-y-0.5 ${isActive('/about') ? 'bg-[var(--accent-soft)] text-[var(--text-primary)] font-semibold' : 'text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]'}`}>
          <Fingerprint className={`w-4 h-4 ${isActive('/about') ? 'text-emerald-500' : ''}`} /> {dict.nav.about}
        </Link>
        <div className="ml-2 flex items-center gap-2 border-l border-[var(--border-subtle)] pl-3">
          <LanguageToggle currentLang={lang} />
          <ThemeToggle />
        </div>

        <Link href="https://github.com/will-opz/opskitpro" target="_blank" className="ml-1 flex items-center gap-2 text-[var(--text-muted)] hover:-translate-y-0.5 hover:text-[var(--text-primary)]">
          <Github className="w-5 h-5" />
        </Link>
        <Link href="https://x.com/deopsai" target="_blank" className="flex items-center gap-2 text-[var(--text-muted)] hover:-translate-y-0.5 hover:text-[#1DA1F2]">
          <Twitter className="w-5 h-5" />
        </Link>
      </nav>

      <div className="relative z-50 flex items-center gap-2 md:hidden">
        <ThemeToggle />
        <button 
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
          aria-expanded={isMenuOpen}
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-30 cursor-default md:hidden"
            style={{ backgroundColor: 'color-mix(in srgb, var(--bg-primary) 92%, transparent)' }}
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed inset-x-3 top-[76px] z-40 md:hidden">
            <nav className="ui-surface-elevated flex flex-col rounded-2xl p-3 text-[var(--text-muted)] shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <Link href={`/tools`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
                <TerminalSquare className="h-4 w-4" /> {dict.nav.services}
              </Link>
              <Link href={`/blog`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
                <FileText className="h-4 w-4" /> {dict.nav.blog}
              </Link>
              <Link href={`/about`} onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
                <Fingerprint className="h-4 w-4" /> {dict.nav.about}
              </Link>

              <div className="mt-2 flex items-center justify-between border-t border-[var(--border-subtle)] px-1 pt-3">
                <LanguageToggle currentLang={lang} />
                <div className="flex items-center gap-2">
                  <Link href="https://github.com/will-opz/opskitpro" target="_blank" onClick={() => setIsMenuOpen(false)} className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
                    <Github className="h-5 w-5" />
                  </Link>
                  <Link href="https://x.com/deopsai" target="_blank" onClick={() => setIsMenuOpen(false)} className="rounded-full p-2 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[#1DA1F2]">
                    <Twitter className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </nav>
            </div>
        </>
      )}
      </div>
    </header>
  )
}
