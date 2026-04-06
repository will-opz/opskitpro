import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import QRClient from './qr-client'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en"
  const dict = await getDictionary(lang)
  
  return {
    title: `${dict.tools.qrgen_title} - OpsKitPro`,
    description: dict.tools.qrgen_desc,
    openGraph: {
      title: `${dict.tools.qrgen_title} - OpsKitPro`,
      description: dict.tools.qrgen_desc,
    },
  }
}

export default async function QRPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)
  
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <QRClient dict={dict} />
      <SiteFooter dict={dict} />
    </>
  )
}
