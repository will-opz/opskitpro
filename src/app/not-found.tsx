'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] font-mono gap-6 px-4">
      <div className="text-7xl font-black text-zinc-100 tracking-tighter select-none">404</div>
      <div className="text-center">
        <p className="text-zinc-900 font-bold text-lg mb-1 uppercase tracking-tighter italic">Page_not_found</p>
        <p className="text-zinc-400 text-xs uppercase tracking-widest max-w-[200px] leading-relaxed">
          The requested coordinate does not exist in the current grid.
        </p>
      </div>
      
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-all group"
        >
          <Home className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
          GO_HOME
        </Link>
        <button 
          onClick={() => history.back()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          GO_BACK
        </button>
      </div>

      <div className="w-32 h-0.5 bg-zinc-100 rounded-full overflow-hidden mt-4">
        <div className="h-full w-full bg-zinc-200 rounded-full" />
      </div>
    </div>
  )
}

