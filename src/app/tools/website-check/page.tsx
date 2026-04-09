import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import WebsiteCheckClient from './WebsiteCheckClient'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { lang: 'en' | 'zh' } }): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "en") as "en" | "zh";
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
      <WebsiteCheckClient dict={dict} />
      <SiteFooter dict={dict} />
    </>
  )
}
