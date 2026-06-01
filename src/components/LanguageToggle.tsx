'use client'

import { useRouter } from 'next/navigation'
import { Globe, ChevronDown } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function LanguageToggle({ currentLang }: { currentLang: 'zh' | 'tw' | 'en' | 'ja' }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const switchLang = (newLang: 'zh' | 'tw' | 'en' | 'ja') => {
    document.cookie = `NEXT_LOCALE=${newLang}; path=/; max-age=31536000`
    setIsOpen(false)
    router.refresh()
  }

  const langNames = {
    'zh': '简体中文',
    'tw': '繁體中文',
    'en': 'English',
    'ja': '日本語'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-1.5 hover:bg-[var(--surface-elevated)] focus:outline-none"
      >
        <Globe className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">{langNames[currentLang as keyof typeof langNames] || 'Language'}</span>
        <ChevronDown className={`w-3 h-3 text-[var(--text-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="ui-surface-elevated absolute right-0 z-50 mt-2 w-32 rounded-xl py-2 animate-in fade-in zoom-in-95 duration-200">
          {(Object.keys(langNames) as Array<keyof typeof langNames>).map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`w-full px-4 py-2 text-left text-xs font-medium hover:bg-[var(--accent-soft)] hover:text-[var(--accent-color)] ${currentLang === l ? 'bg-[var(--accent-soft)] text-[var(--accent-color)] font-semibold' : 'text-[var(--text-muted)]'}`}
            >
              {langNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
