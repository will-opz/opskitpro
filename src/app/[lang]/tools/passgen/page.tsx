import { getDictionary } from '../../../../dictionaries'
import PassClient from './pass-client'

export default async function PassPage({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang)
  
  return <PassClient lang={lang} dict={dict} />
}
