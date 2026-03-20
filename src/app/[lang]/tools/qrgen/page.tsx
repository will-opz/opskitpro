import { getDictionary } from '../../../../dictionaries'
import QRClient from './qr-client'

export default async function QRPage({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang)
  
  return <QRClient lang={lang} dict={dict} />
}
