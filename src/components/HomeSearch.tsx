'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Globe, ArrowRight, Zap, ShieldCheck } from 'lucide-react'

export default function HomeSearch({ dict, lang }: { dict: any, lang: string }) {
  const [query, setQuery] = useState('')
  const router = useRouter()
  const isJapanese = lang === 'ja'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    // For now, redirect to search or a default tool (IP) with the query
    // In the future, this should lead to a dedicated /diagnostics page
    router.push(`/tools/website-check?q=${encodeURIComponent(query.trim())}`)
  }

  const quickChecks = [
    { name: dict.home.features.dns, icon: Zap },
    { name: dict.home.features.ssl, icon: ShieldCheck },
    { name: dict.home.features.cdn, icon: Globe },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative flex items-center bg-white/80 backdrop-blur-2xl border border-black/5 p-1.5 rounded-2xl shadow-2xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
          <div className="flex items-center justify-center w-12 h-12 text-zinc-400">
            <Globe className="w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={dict.home.diagnostics_placeholder}
            className="flex-grow bg-transparent border-none outline-none font-mono text-zinc-900 placeholder:text-zinc-400 px-2"
          />
          <button 
            type="submit"
            className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/30"
          >
            {dict.home.diagnostics_btn}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>
      
      <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
        {quickChecks.map((item) => (
          <div key={item.name} className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-[10px] font-mono font-bold text-emerald-600 border border-emerald-100 select-none transition-all hover:bg-emerald-100 cursor-default ${isJapanese ? 'tracking-[0.08em]' : 'uppercase tracking-wider'}`}>
            <item.icon className="w-3 h-3" />
            <span>{item.name}</span>
          </div>
        ))}
      </div>

      {/* Trust Footer */}
      <div className={`mt-8 text-[9px] font-mono text-zinc-400 opacity-60 ${isJapanese ? 'tracking-[0.16em] not-italic' : 'uppercase tracking-[0.4em] italic'}`}>
        {dict.home.trust_footer}
      </div>
    </div>
  )
}
