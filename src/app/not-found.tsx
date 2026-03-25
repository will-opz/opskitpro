'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()
  const [count, setCount] = useState(3)

  useEffect(() => {
    const timer = setInterval(() => setCount(c => c - 1), 1000)
    const redirect = setTimeout(() => router.replace('/'), 3000)
    return () => { clearInterval(timer); clearTimeout(redirect) }
  }, [router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] font-mono gap-6 px-4">
      <div className="text-7xl font-black text-zinc-100 tracking-tighter select-none">404</div>
      <div className="text-center">
        <p className="text-zinc-900 font-bold text-lg mb-1">Page_Not_Found</p>
        <p className="text-zinc-400 text-xs uppercase tracking-widest">Redirecting in {count}s...</p>
      </div>
      <div className="w-32 h-0.5 bg-zinc-100 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full animate-[progress_3s_linear_forwards]"
          style={{ animation: 'progress 3s linear forwards' }} />
      </div>
      <style>{`@keyframes progress { from { width: 0 } to { width: 100% } }`}</style>
    </div>
  )
}
