import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import PassClient from './pass-client'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en"
  const dict = await getDictionary(lang)
  
  return {
    title: `${dict.tools.passgen_title} - OpsKitPro`,
    description: dict.tools.passgen_desc,
    openGraph: {
      title: `${dict.tools.passgen_title} - OpsKitPro`,
      description: dict.tools.passgen_desc,
    },
  }
}

export default async function PassPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)
  
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <PassClient dict={dict} />
      <SiteFooter dict={dict} />
    </>
  )
}
