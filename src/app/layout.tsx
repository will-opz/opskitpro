import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import Script from 'next/script'
import './globals.css'

export async function generateMetadata({ params }: { params: { lang: 'en' | 'zh' } }): Promise<Metadata> {
  const cookieStore = cookies();
  const langFromHeader = headers().get("x-next-locale");
  const lang = (langFromHeader || cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang);
  
  return {
    title: {
      default: 'OpsKitPro | Edge Diagnostic Portal',
      template: '%s | OpsKitPro'
    },
    description: 'Real-time global network forensics and edge diagnostic tools.',
  }
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode,
  params: { lang: string }
}) {
  const cookieStore = cookies();
  const langFromHeader = headers().get("x-next-locale");
  const lang = (langFromHeader || cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)
  
  return (
    <html lang={lang}>
      <head>
        <Script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3793455361566383"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans antialiased text-zinc-900 bg-base selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
        {/* Dual Core tech background glow */}
        <div className="glow" />
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.03] pointer-events-none" />
        
        {children}
      </body>
    </html>
  )
}
