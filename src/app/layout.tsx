import { cookies } from 'next/headers'
import { getDictionary } from '@/dictionaries'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Noto_Sans_SC } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })
const notoSansSC = Noto_Sans_SC({ 
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto-sc'
})

export async function generateMetadata({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }): Promise<Metadata> {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang);
  
  return {
    title: dict.home.meta_title,
    description: dict.home.meta_desc,
    openGraph: {
      title: dict.home.meta_title,
      description: dict.home.meta_desc,
      type: 'website',
      url: `https://deops.org/${lang}`,
      siteName: 'deops.org',
    },
    twitter: {
      card: 'summary_large_image',
      title: dict.home.meta_title,
      description: dict.home.meta_desc,
    }
  }
}



export default async function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  return (
    <html lang={lang} className={`${inter.variable} ${jetbrainsMono.variable} ${notoSansSC.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col relative overflow-x-hidden selection:bg-accent selection:text-zinc-900">
        <Script 
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3793455361566383"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-[-2]"></div>
        {/* Ambient glow */}
        <div className="glow"></div>
        {children}
      </body>
    </html>
  )
}
