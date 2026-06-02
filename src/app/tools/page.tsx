import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import ToolsNavigatorClient from './ToolsNavigatorClient'

export default async function ToolsPage() {
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <ToolsNavigatorClient lang={lang} />
      <SiteFooter dict={dict} />
    </>
  )
}
