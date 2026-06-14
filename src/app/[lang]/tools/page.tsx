import { Suspense } from 'react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import ToolsNavigatorClient from './ToolsNavigatorClient'

export default async function ToolsPage({ params }: { params: { lang: string } }) {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <Suspense fallback={<div className="min-h-screen" />}>
        <ToolsNavigatorClient lang={lang} />
      </Suspense>
      <SiteFooter dict={dict} />
    </>
  )
}
