import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import PassClient from './pass-client'


export default async function PassPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)
  
  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <PassClient lang={lang} dict={dict} />
      <SiteFooter dict={dict} />
    </>
  )
}
