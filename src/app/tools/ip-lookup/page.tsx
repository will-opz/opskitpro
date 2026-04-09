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
      <IPClient />
      <SiteFooter dict={dict} />
    </>
  )
}
