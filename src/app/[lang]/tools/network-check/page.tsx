import { Suspense } from 'react'
import { Metadata } from 'next'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import NetworkCheckClient from './NetworkCheckClient'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)

  const title = dict.tools.network_check_title
  const description = dict.tools.network_check_desc
  const url = 'https://opskitpro.com/tools/network-check'

  return {
    title,
    description,
    keywords:
      lang === 'zh' || lang === 'tw'
        ? '网络测速,网络诊断,IPv6检测,DNS检测,网络质量测试,延迟测试,Ping测试,网速检测'
        : 'network test,internet speed test,network quality check,ipv6 test,dns test,latency test,ping test,internet diagnostics',
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
        'en': `https://opskitpro.com/en/tools/network-check`,
        'ja': `https://opskitpro.com/ja/tools/network-check`,
        'zh-TW': `https://opskitpro.com/tw/tools/network-check`,
      },
    },
  }
}

export default async function NetworkCheckPage({ params }: { params: { lang: string } }) {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
              <div className="rounded-[2rem] border border-zinc-100 bg-white/80 px-8 py-7 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.24em] text-zinc-400">
                      {dict.tools.network_check_title}
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-700">
                      {dict.tools.network_check.loading}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          }
        >
          <NetworkCheckClient dict={dict} lang={lang} />
        </Suspense>
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
