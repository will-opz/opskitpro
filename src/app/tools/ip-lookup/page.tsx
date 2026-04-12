import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import IPClient from './ip-client'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw"
  const dict = await getDictionary(lang)
  
  return {
    title: `${dict.tools.ip_title} - OpsKitPro`,
    description: dict.tools.ip_desc,
    openGraph: {
      title: `${dict.tools.ip_title} - OpsKitPro`,
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
          <div className="min-h-[60vh] flex flex-col items-center justify-center font-mono">
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 uppercase tracking-widest text-[10px]">Locating_Global_Route...</p>
          </div>
        }>
          <IPClient dict={dict} lang={lang} />
        </Suspense>
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
