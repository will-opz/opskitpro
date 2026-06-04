import type { Metadata } from 'next'
import { cookies, headers } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import Script from 'next/script'
import { AdminSessionProvider } from '@/components/AdminSessionProvider'
import './globals.css'

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('opskit-theme');
    var theme = stored === 'dark' ? 'dark' : 'light';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  } catch (_) {}
})();
`

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = cookies();
  const headersList = headers();
  const langFromHeader = headersList.get("x-next-locale");
  const pathname = headersList.get("x-pathname") || "";
  const lang = (langFromHeader || cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang);
  
  const baseUrl = 'https://opskitpro.com';
  const canonicalUrl = `${baseUrl}${pathname}`;
  
  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: dict.home.meta_title || 'OpsKitPro | Edge Diagnostic Portal',
      template: '%s | OpsKitPro'
    },
    description: dict.home.meta_desc || 'Real-time global network forensics and edge diagnostic tools.',
    keywords: ['DNS Checker', 'IP Lookup', 'Website Diagnostic', 'SRE Tools', 'Geo-Location IP', 'WebSocket Test', 'JSON Formatter', 'DNS 解析查询', '网站测速', 'IP归属地查询'],
    authors: [{ name: 'OpsKitPro Team' }],
    creator: 'OpsKitPro',
    publisher: 'OpsKitPro Edge',
    openGraph: {
      title: dict.home.meta_title || 'OpsKitPro | Edge Diagnostic Portal',
      description: dict.home.meta_desc,
      url: canonicalUrl,
      siteName: 'OpsKitPro',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
        },
      ],
      locale: lang === 'zh' ? 'zh_CN' : lang === 'ja' ? 'ja_JP' : lang === 'tw' ? 'zh_TW' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.home.meta_title,
      description: dict.home.meta_desc,
      creator: '@opskitpro',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [
        { url: '/favicon.ico' },
        { url: '/logo.svg', type: 'image/svg+xml' },
      ],
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-US': '/en',
        'zh-CN': '/zh',
        'ja-JP': '/ja',
        'zh-TW': '/tw',
      },
    }
  }
}


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode,
}) {
  const cookieStore = cookies();
  const langFromHeader = headers().get("x-next-locale");
  const lang = (langFromHeader || cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  
  return (
    <html lang={lang} className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script 
          async 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3793455361566383"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className="ui-shell selection:bg-emerald-500/20 selection:text-[var(--text-primary)]">
        {/* Dual Core tech background glow */}
        <div className="glow" />
        <div className="bg-grid-pattern absolute inset-0 opacity-[0.03] pointer-events-none" />
        
        <AdminSessionProvider lang={lang}>
          {children}
        </AdminSessionProvider>
      </body>
    </html>
  )
}
