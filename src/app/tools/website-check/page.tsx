import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import WebsiteCheckClient from './WebsiteCheckClient'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  return {
    title: `${dict.home.card1_title} | OpsKitPro`,
    description: dict.home.card1_desc,
    openGraph: {
      title: `${dict.home.card1_title} - Website Diagnostics`,
      description: dict.home.card1_desc,
    }
  }
}

export default async function DiagnosticPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center font-mono">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 uppercase tracking-widest text-[10px]">Booting_Forensics_Engine...</p>
          </div>
        }>
          <WebsiteCheckClient dict={dict} />
        </Suspense>
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
