import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import IPLookupClient from './IPLookupClient'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw"
  const dict = await getDictionary(lang)
  
  return {
    title: dict.tools.ip_title,
    description: dict.tools.ip_desc,
    openGraph: {
      title: dict.tools.ip_title,
      description: dict.tools.ip_desc,
    },
  }
}


export default async function IPPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
            <div className="rounded-[2rem] border border-zinc-100 bg-white/80 px-8 py-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.24em] text-zinc-400">{dict.tools.ip_title}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-700">{dict.tools.ip.loading}</p>
                </div>
              </div>
            </div>
          </div>
        }>
          <IPLookupClient dict={dict} lang={lang} />
        </Suspense>
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
