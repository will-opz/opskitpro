import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import DnsClient from './DnsClient'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  return {
    title: dict.home.card3_title,
    description: dict.home.card3_desc,
  }
}


export default async function DnsPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 tracking-[0.24em] text-[10px]">
              {lang === 'ja' ? 'DNS を読み込み中...' : lang === 'zh' ? '正在加载 DNS...' : lang === 'tw' ? '正在載入 DNS...' : 'Loading DNS...'}
            </p>
          </div>
        }>
          <DnsClient dict={dict} lang={lang} />
        </Suspense>
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
