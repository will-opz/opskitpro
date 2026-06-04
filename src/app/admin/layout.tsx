import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import { ADMIN_COOKIE_NAME, isAdminToken } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'zh') as 'zh' | 'en' | 'ja' | 'tw'
  const authenticated = await isAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)

  if (!authenticated) redirect('/tools?admin=1')

  const dict = await getDictionary(lang)

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      {children}
      <SiteFooter dict={dict} />
    </>
  )
}
