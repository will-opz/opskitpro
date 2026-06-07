import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import DnsClient from './DnsClient'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { RelatedTools } from '@/components/RelatedTools'
import type { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  const title = `${dict.home.card3_title} | OpsKitPro`;
  const description = dict.home.card3_desc;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://opskitpro.com/tools/dns-lookup',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  }
}

export default async function DnsPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://opskitpro.com/' },
      { '@type': 'ListItem', position: 2, name: 'Tools', item: 'https://opskitpro.com/services' },
      { '@type': 'ListItem', position: 3, name: dict.home.card3_title, item: 'https://opskitpro.com/tools/dns-lookup' },
    ],
  }

  const jsonLdWebApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: dict.home.card3_title,
    description: dict.home.card3_desc,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    url: 'https://opskitpro.com/tools/dns-lookup',
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
        name: 'What does the DNS Lookup tool do?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'It performs global DNS queries to fetch A, AAAA, MX, TXT, CNAME, NS, and SOA records for any domain, directly from Cloudflare resolvers.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is a DNS Security Audit?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Our DNS Security Audit checks your domain for critical security records like SPF, DMARC, and CAA to ensure your email infrastructure is protected against spoofing and phishing.',
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
          <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
            <div className="w-10 h-10 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin mb-4" />
            <p className="text-zinc-400 tracking-[0.24em] text-[10px]">
              {lang === 'ja' ? 'DNS を読み込み中...' : lang === 'zh' ? '正在加载 DNS...' : lang === 'tw' ? '正在載入 DNS...' : 'Loading DNS...'}
            </p>
          </div>
        }>
          <DnsClient dict={dict} lang={lang} />
        </Suspense>
        <RelatedTools currentTool="dns-lookup" lang={lang} />
      </div>
      <SiteFooter dict={dict} />
    </>
  )
}
