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
        className="flex items-center gap-1.5 border border-zinc-200 rounded-full px-3 py-1.5 bg-zinc-100/80 hover:bg-zinc-200 transition-all focus:outline-none"
      >
        <Globe className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-xs font-bold text-zinc-800">{langNames[currentLang as keyof typeof langNames] || 'Language'}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 py-2 w-32 bg-white rounded-xl shadow-xl border border-black/5 z-50 animate-in fade-in zoom-in-95 duration-200">
          {(Object.keys(langNames) as Array<keyof typeof langNames>).map((l) => (
            <button
              key={l}
              onClick={() => switchLang(l)}
              className={`w-full text-left px-4 py-2 text-xs font-medium transition-colors hover:bg-emerald-50 hover:text-emerald-700 ${currentLang === l ? 'text-emerald-600 bg-emerald-50/50 font-bold' : 'text-zinc-600'}`}
            >
              {langNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
