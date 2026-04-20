'use client'

import Link from 'next/link'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] font-sans gap-6 px-4">
      <div className="text-7xl sm:text-8xl font-black text-zinc-100 tracking-tighter select-none">404</div>
      <div className="text-center">
        <p className="text-zinc-900 font-semibold text-lg mb-1 tracking-tight">Page not found</p>
        <p className="text-zinc-400 text-sm max-w-[240px] leading-relaxed">
          The page you requested does not exist in this grid.
        </p>
      </div>
      
      <div className="flex flex-col gap-3 w-full max-w-[240px]">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl text-sm font-semibold hover:bg-emerald-600 transition-all group"
        >
          <Home className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
          Go home
        </Link>
        <button 
          onClick={() => history.back()}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-zinc-100 text-zinc-600 rounded-2xl text-sm font-semibold hover:bg-zinc-200 transition-all group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Go back
        </button>
      </div>

      <div className="w-32 h-0.5 bg-zinc-100 rounded-full overflow-hidden mt-4">
        <div className="h-full w-full bg-zinc-200 rounded-full" />
      </div>
    </div>
  )
}
