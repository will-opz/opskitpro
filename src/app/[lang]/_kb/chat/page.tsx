import { getDictionary } from '../../../../dictionaries'
import KbClient from './kb-client'

export const metadata = {
  title: 'Ops Copilot | deops.org',
  description: 'AI-Native Knowledge Base and Runbooks Search',
}

export default async function KbPage({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang)
  
  return <KbClient lang={lang} dict={dict} />
}
