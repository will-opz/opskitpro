import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Activity } from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import ServicesClient from './ServicesClient'

export const runtime = 'edge'

export default async function ServicesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)

  return (
    <div className="min-h-screen flex flex-col relative w-full bg-[#fafafa]">
      <header className="w-full max-w-7xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <div className="flex flex-col gap-2">
          <Link href={`/`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-mono text-sm transition-colors" title="Return to Home">
            <ArrowLeft className="w-4 h-4" /> 返回首页
          </Link>
          <div className="font-mono text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-600">deops /</span> services<span className="text-accent animate-pulse">_</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full border border-zinc-200 text-xs font-mono text-zinc-600 shadow-sm backdrop-blur-sm cursor-default">
          <Activity className="w-3.5 h-3.5 text-emerald-700" />
          {dict.services.matrix_active}
        </div>
      </header>

      <ServicesClient dict={dict} lang={lang} />
    </div>
  )
}
