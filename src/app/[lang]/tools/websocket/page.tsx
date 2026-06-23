import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import WebsocketClient from './WebsocketClient'
import type { Metadata } from 'next'

import { buildPageMetadata, buildToolJsonLd } from '@/lib/seo'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  return buildPageMetadata(
    `${dict.tools.websocket_title} - OpsKitPro`,
    dict.tools.websocket_desc,
    lang,
    '/tools/websocket'
  )
}

export default async function WebsocketPage({ params }: { params: { lang: string } }) {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)

  const jsonLdWebApp = buildToolJsonLd({
    name: dict.tools.websocket_title,
    description: dict.tools.websocket_desc,
    url: 'https://opskitpro.com/tools/websocket',
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <SiteHeader dict={dict} lang={lang} />
      <WebsocketClient dict={dict} lang={lang} />
      <SiteFooter dict={dict} />
    </>
  )
}
