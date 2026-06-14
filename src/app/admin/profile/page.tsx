import { CircleUserRound, KeyRound, ShieldCheck } from 'lucide-react'
import { cookies, headers } from 'next/headers'
import { ProfileActions } from './ProfileActions'
import {
  ADMIN_COOKIE_NAME,
  getAdminIdentity,
  getCloudflareAccessEmail,
} from '@/lib/admin-auth'

const copy = {
  zh: {
    badge: '账户',
    title: '用户资料',
    description: '当前登录身份只用于私有管理功能。公开工具、文章和诊断页面仍然允许游客访问。',
    email: '管理员邮箱',
    provider: '登录方式',
    scope: '访问范围',
    zeroTrust: 'Cloudflare Zero Trust',
    password: '管理员密码',
    unknown: '未知',
    scopeValue: '管理后台、个人导航、自定义入口',
    sessionTitle: '会话说明',
    sessionBody: 'Zero Trust 登录由 Cloudflare Access 校验白名单邮箱；密码登录作为备用入口。退出后会清除 OpsKitPro 管理会话。',
  },
  tw: {
    badge: '帳戶',
    title: '使用者資料',
    description: '目前登入身分只用於私有管理功能。公開工具、文章和診斷頁面仍允許訪客使用。',
    email: '管理員信箱',
    provider: '登入方式',
    scope: '存取範圍',
    zeroTrust: 'Cloudflare Zero Trust',
    password: '管理員密碼',
    unknown: '未知',
    scopeValue: '管理後台、個人導航、自訂入口',
    sessionTitle: '工作階段說明',
    sessionBody: 'Zero Trust 登入由 Cloudflare Access 驗證白名單信箱；密碼登入作為備用入口。登出後會清除 OpsKitPro 管理工作階段。',
  },
  en: {
    badge: 'Account',
    title: 'User profile',
    description: 'This signed-in identity is only used for private admin features. Public tools, articles, and diagnostics stay open to guests.',
    email: 'Admin email',
    provider: 'Sign-in method',
    scope: 'Access scope',
    zeroTrust: 'Cloudflare Zero Trust',
    password: 'Admin password',
    unknown: 'Unknown',
    scopeValue: 'Admin dashboard, personal navigation, custom entries',
    sessionTitle: 'Session notes',
    sessionBody: 'Zero Trust sign-in is verified by Cloudflare Access against the email allowlist. Password sign-in remains a fallback. Signing out clears the OpsKitPro admin session.',
  },
  ja: {
    badge: 'アカウント',
    title: 'ユーザープロフィール',
    description: '現在のログイン情報は非公開の管理機能だけに使います。公開ツール、記事、診断ページはゲストでも利用できます。',
    email: '管理者メール',
    provider: 'ログイン方式',
    scope: 'アクセス範囲',
    zeroTrust: 'Cloudflare Zero Trust',
    password: '管理者パスワード',
    unknown: '不明',
    scopeValue: '管理画面、個人ナビ、カスタム入口',
    sessionTitle: 'セッション情報',
    sessionBody: 'Zero Trust ログインは Cloudflare Access が許可済みメールを検証します。パスワードログインは予備入口です。ログアウトすると OpsKitPro の管理セッションを削除します。',
  },
}

export default async function AdminProfilePage() {
  const cookieStore = cookies()
  const headerStore = headers()
  const lang = (cookieStore.get('NEXT_LOCALE')?.value || 'en') as keyof typeof copy
  const t = copy[lang] || copy.zh
  const identity = await getAdminIdentity(
    cookieStore.get(ADMIN_COOKIE_NAME)?.value,
    getCloudflareAccessEmail(headerStore),
  )
  const providerLabel = identity.provider === 'cloudflare_access'
    ? t.zeroTrust
    : identity.provider === 'password'
      ? t.password
      : t.unknown

  const rows = [
    { label: t.email, value: identity.email || t.unknown },
    { label: t.provider, value: providerLabel },
    { label: t.scope, value: t.scopeValue },
  ]

  return (
    <main className="mx-auto w-full max-w-5xl flex-grow px-4 pb-20 pt-8 sm:px-6">
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--accent-color)]">
          <CircleUserRound className="h-4 w-4" />
          {t.badge}
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">{t.description}</p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]">
          <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-color)]">
              {identity.provider === 'cloudflare_access' ? <ShieldCheck className="h-5 w-5" /> : <KeyRound className="h-5 w-5" />}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{identity.email || t.unknown}</div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{providerLabel}</div>
            </div>
          </div>
          <dl className="mt-5 space-y-4">
            {rows.map((row) => (
              <div key={row.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{row.label}</dt>
                <dd className="mt-1 text-sm font-semibold text-[var(--text-primary)]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)]">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">{t.sessionTitle}</h2>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{t.sessionBody}</p>
          <div className="mt-5">
            <ProfileActions lang={lang} />
          </div>
        </aside>
      </section>
    </main>
  )
}
