import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import JSONClient from './json-client'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en"
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
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en"
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <JSONClient dict={dict} />
      <SiteFooter dict={dict} />
    </>
  )
}
