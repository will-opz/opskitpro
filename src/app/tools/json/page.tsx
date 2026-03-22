import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import JSONClient from './json-client'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export default async function JSONToolPage() {
  const cookieStore = await cookies()
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
