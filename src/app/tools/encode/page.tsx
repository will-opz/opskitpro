import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import EncodeClient from './encode-client'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw"
  const dict = await getDictionary(lang)

  return {
    title: `${dict.tools.encode_title} - OpsKitPro`,
    description: dict.tools.encode_desc,
    openGraph: {
      title: `${dict.tools.encode_title} - OpsKitPro`,
      description: dict.tools.encode_desc,
    },
  }
}

export default async function EncodePage() {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw"
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <EncodeClient dict={dict} lang={lang} />
      <SiteFooter dict={dict} />
    </>
  )
}
