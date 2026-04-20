import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import JSONClient from './json-client'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw"
  const dict = await getDictionary(lang)
  
  return {
    title: `${dict.tools.json_title} - OpsKitPro`,
    description: dict.tools.json_desc,
    openGraph: {
      title: `${dict.tools.json_title} - OpsKitPro`,
      description: dict.tools.json_desc,
    },
  }
}

export default async function JSONToolPage() {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw"
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 tracking-[0.24em] text-[10px]">
              {lang === 'ja' ? 'JSON を読み込み中...' : lang === 'zh' ? '正在加载 JSON...' : lang === 'tw' ? '正在載入 JSON...' : 'Loading JSON...'}
            </p>
          </div>
        }>
          <JSONClient dict={dict} lang={lang} />
        </Suspense>
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
