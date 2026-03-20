import { getDictionary } from '../../dictionaries'
import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export async function generateMetadata({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }): Promise<Metadata> {
  const { lang } = await params;
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

export const runtime = 'edge'


export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params;
  return (
    <html lang={lang} className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="font-sans antialiased min-h-screen flex flex-col relative overflow-x-hidden selection:bg-accent selection:text-white">
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none z-[-2]"></div>
        {/* Ambient glow */}
        <div className="glow"></div>
        {children}
      </body>
    </html>
  )
}
