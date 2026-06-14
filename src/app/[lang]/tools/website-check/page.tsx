import { Suspense } from 'react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { RelatedTools } from '@/components/RelatedTools'
import WebsiteCheckClient from './WebsiteCheckClient'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: { lang: string } }): Promise<Metadata> {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  const title = `${dict.home.card1_title} | OpsKitPro`;
  const description = dict.home.card1_desc;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://opskitpro.com/tools/website-check',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

export default async function DiagnosticPage({ params }: { params: { lang: string } }) {
  const lang = (params.lang || "en") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://opskitpro.com/' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://opskitpro.com/services' },
      { '@type': 'ListItem', position: 3, name: dict.home.card1_title, item: 'https://opskitpro.com/tools/website-check' },
    ],
  }

  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: dict.home.card1_title,
    description: dict.home.card1_desc,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    url: 'https://opskitpro.com/tools/website-check',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  }

  const jsonLdFAQ = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does this website check tool diagnose?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It performs a comprehensive health check, testing DNS resolution, ping/latency, SSL/TLS certificates, security headers, server connection, and Cloudflare routing.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can it detect Cloudflare errors?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. It accurately identifies common Cloudflare edge errors (e.g., 522 Connection Timeout, 1020 Access Denied) and links to detailed troubleshooting guides.',
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFAQ) }} />
      
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense fallback={
          <div className="min-h-[60vh] flex flex-col items-center justify-center px-6">
            <div className="rounded-[2rem] border border-zinc-100 bg-white/80 px-8 py-7 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.24em] text-zinc-400">{dict.tools.diagnostic_title}</p>
                  <p className="mt-1 text-sm font-medium text-zinc-700">{dict.tools.website_check.loading}</p>
                </div>
              </div>
            </div>
          </div>
        }>
          <WebsiteCheckClient dict={dict} lang={lang} />
        </Suspense>
        <RelatedTools currentTool="website-check" lang={lang} />
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
