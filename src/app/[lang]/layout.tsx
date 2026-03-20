import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-jetbrains' })

export const metadata: Metadata = {
  title: 'deops - AI-Native Operations Infrastructure',
  description: 'The Future of Ops is Defined by AI. Simple, Hardcore, Automated, Lightning-fast.',
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'zh' }]
}

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
