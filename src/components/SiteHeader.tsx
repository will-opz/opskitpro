'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Github,
  Twitter,
  TerminalSquare,
  BookOpen,
  FileText,
  Menu,
  X,
  Fingerprint
} from 'lucide-react'
import { LanguageToggle } from '@/components/LanguageToggle'

export function SiteHeader({ dict, lang }: { dict: any; lang: 'zh' | 'en' | 'ja' | 'tw' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const isActive = (path: string) => {
    const normalizedPathname = pathname.replace(/^\/(zh|en|ja|tw)/, '') || '/'
    return normalizedPathname === path || (path !== '/' && normalizedPathname.startsWith(path + '/'))
  }

  return (
    <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center z-50 relative">
      <Link href={`/`} className="group flex items-center gap-3 no-underline outline-none relative z-50">
        <div className="relative group-hover:-rotate-6 transition-transform duration-500">
          <Image 
            src="/logo.png" 
            alt="OpsKitPro Avatar" 
            width={44} 
            height={44} 
            className="rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-white/5 bg-zinc-900" 
            priority
          />
        </div>
        <span className="font-mono text-xl font-bold tracking-tight text-zinc-900 group-hover:text-emerald-600 transition-colors">
          OpsKit<span className="text-emerald-500 animate-pulse">Pro_</span>
        </span>
        <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1 bg-zinc-100 rounded-full border border-zinc-200 shadow-sm animate-in fade-in duration-1000">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-none mt-0.5">{dict.home.system_status}</span>
        </div>
      </Link>

      {/* Desktop Nav */}
      <nav className="hidden md:flex gap-8 items-center font-mono text-sm">
        <Link href={`/services`} className={`hover:-translate-y-0.5 transition-all flex items-center gap-2 ${isActive('/services') ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}`}>
          <TerminalSquare className={`w-4 h-4 ${isActive('/services') ? 'text-emerald-500' : ''}`} /> {dict.nav.services}
        </Link>
        <Link href={`/blog`} className={`hover:-translate-y-0.5 transition-all flex items-center gap-2 ${isActive('/blog') ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}`}>
          <FileText className={`w-4 h-4 ${isActive('/blog') ? 'text-emerald-500' : ''}`} /> {dict.nav.blog}
        </Link>
        <a href="https://kb.opskitpro.com" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-900 hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <BookOpen className="w-4 h-4" /> {dict.nav.kb}
        </a>
        <Link href={`/about`} className={`hover:-translate-y-0.5 transition-all flex items-center gap-2 ${isActive('/about') ? 'text-zinc-900 font-bold' : 'text-zinc-500 hover:text-zinc-900'}`}>
          <Fingerprint className={`w-4 h-4 ${isActive('/about') ? 'text-emerald-500' : ''}`} /> {dict.nav.about}
        </Link>
        <div className="flex items-center gap-2 ml-4 border-l border-zinc-200 pl-6">
          <LanguageToggle currentLang={lang} />
        </div>

        <Link href="https://github.com/will-opz/opskitpro" target="_blank" className="text-zinc-600 hover:text-zinc-900 hover:-translate-y-0.5 transition-all flex items-center gap-2 ml-4">
          <Github className="w-5 h-5" />
        </Link>
        <Link href="https://x.com/deopsai" target="_blank" className="text-zinc-600 hover:text-[#1DA1F2] hover:-translate-y-0.5 transition-all flex items-center gap-2">
          <Twitter className="w-5 h-5" />
        </Link>
      </nav>

      {/* Mobile Menu Button */}
      <button 
        className="md:hidden text-zinc-600 hover:text-zinc-900 z-50 p-2"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle Menu"
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center pt-20 pb-10 animate-in fade-in duration-300">
          <nav className="flex flex-col gap-8 items-center font-mono text-lg text-zinc-600">
            <Link href={`/services`} onClick={() => setIsMenuOpen(false)} className="hover:text-zinc-900 flex items-center gap-3">
              <TerminalSquare className="w-5 h-5" /> {dict.nav.services}
            </Link>
            <Link href={`/blog`} onClick={() => setIsMenuOpen(false)} className="hover:text-zinc-900 flex items-center gap-3">
              <FileText className="w-5 h-5" /> {dict.nav.blog}
            </Link>
            <a href="https://kb.opskitpro.com" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)} className="hover:text-zinc-900 flex items-center gap-3">
              <BookOpen className="w-5 h-5" /> {dict.nav.kb}
            </a>
            <Link href={`/about`} onClick={() => setIsMenuOpen(false)} className="hover:text-zinc-900 flex items-center gap-3">
              <Fingerprint className="w-5 h-5" /> {dict.nav.about}
            </Link>
            
            <div className="flex items-center gap-6 mt-4 pt-8 border-t border-black/10 w-48 justify-center">
              <LanguageToggle currentLang={lang} />
              <Link href="https://github.com/will-opz/opskitpro" target="_blank" onClick={() => setIsMenuOpen(false)} className="text-zinc-600 hover:text-zinc-900">
                <Github className="w-6 h-6" />
              </Link>
              <Link href="https://x.com/deopsai" target="_blank" onClick={() => setIsMenuOpen(false)} className="text-zinc-600 hover:text-[#1DA1F2]">
                <Twitter className="w-6 h-6" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
