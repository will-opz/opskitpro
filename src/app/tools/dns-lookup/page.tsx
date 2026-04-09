import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import DnsClient from './DnsClient'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { lang: 'en' | 'zh' } }): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  return {
    title: `${dict.tools.dns_title} - OpsKitPro`,
    description: dict.tools.dns_desc,
  }
}

export default async function DnsPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <DnsClient />
      <SiteFooter dict={dict} />
    </>
  )
}
