import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import CloudflareTraceClient from './CloudflareTraceClient'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const dict = await getDictionary(lang)

  // Using a fallback directly since it might not be in the dictionary yet
  const title = lang === 'zh' ? 'Cloudflare Trace 解析' : lang === 'tw' ? 'Cloudflare Trace 解析' : lang === 'ja' ? 'Cloudflare Trace 解析' : 'Cloudflare Trace Analyzer'
  const description = lang === 'zh' ? '查看当前浏览器访问 Cloudflare 边缘节点的详细追踪信息，包括 Colo, TLS, HTTP, WARP 等状态。' : 'Analyze your connection to Cloudflare edge nodes, including Colo, TLS, HTTP, and WARP status.'
  const url = 'https://opskitpro.com/tools/cloudflare-trace'

  return {
    title,
    description,
    keywords: 'cloudflare trace, cloudflare colo, cloudflare warp, pop, /cdn-cgi/trace',
    openGraph: {
      title: `${title} | OpsKitPro`,
      description,
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | OpsKitPro`,
      description,
    },
    alternates: {
      canonical: url,
      languages: {
        'zh-CN': `${url}`,
        'en': `https://opskitpro.com/en/tools/cloudflare-trace`,
        'ja': `https://opskitpro.com/ja/tools/cloudflare-trace`,
        'zh-TW': `https://opskitpro.com/tw/tools/cloudflare-trace`,
      },
    },
  }
}

export default async function CloudflareTracePage() {
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense>
          <CloudflareTraceClient dict={dict} lang={lang} />
        </Suspense>
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
