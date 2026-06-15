'use client'

import { createContext, FormEvent, useContext, useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, ShieldCheck, X } from 'lucide-react'

type AdminSessionContextValue = {
  authenticated: boolean
  email: string
  provider: 'cloudflare_access' | 'password' | null
  configured: boolean
  passwordConfigured: boolean
  accessConfigured: boolean
  loading: boolean
  openLogin: (nextPath?: string) => void
  logout: () => Promise<void>
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

const labels = {
  zh: {
    title: '管理员登录',
    help: '登录后可进入管理页面并编辑个人导航。公开工具无需登录。',
    email: '管理员邮箱',
    password: '管理员密码',
    zeroTrust: '使用 Cloudflare Zero Trust 登录',
    zeroTrustHint: '推荐：使用白名单邮箱完成认证。',
    passwordLogin: '使用管理员密码登录',
    fallbackHint: '备用入口，适合本地开发或 Zero Trust 不可用时使用。',
    divider: '或',
    login: '登录',
    cancel: '取消',
    failed: '邮箱或密码不正确。',
    notConfigured: '管理员登录尚未配置。',
  },
  tw: {
    title: '管理員登入',
    help: '登入後可進入管理頁面並編輯個人導航。公開工具無需登入。',
    email: '管理員信箱',
    password: '管理員密碼',
    zeroTrust: '使用 Cloudflare Zero Trust 登入',
    zeroTrustHint: '推薦：使用白名單信箱完成認證。',
    passwordLogin: '使用管理員密碼登入',
    fallbackHint: '備用入口，適合本機開發或 Zero Trust 無法使用時。',
    divider: '或',
    login: '登入',
    cancel: '取消',
    failed: '信箱或密碼不正確。',
    notConfigured: '管理員登入尚未配置。',
  },
  en: {
    title: 'Admin sign in',
    help: 'Sign in to access management pages and edit your personal navigation. Public tools remain open.',
    email: 'Admin email',
    password: 'Admin password',
    zeroTrust: 'Continue with Cloudflare Zero Trust',
    zeroTrustHint: 'Recommended for whitelisted admin emails.',
    passwordLogin: 'Sign in with admin password',
    fallbackHint: 'Fallback for local development or when Zero Trust is unavailable.',
    divider: 'or',
    login: 'Sign in',
    cancel: 'Cancel',
    failed: 'Incorrect email or password.',
    notConfigured: 'Admin sign-in is not configured.',
  },
  ja: {
    title: '管理者ログイン',
    help: 'ログイン後、管理ページと個人ナビ編集を利用できます。公開ツールはログイン不要です。',
    email: '管理者メール',
    password: '管理者パスワード',
    zeroTrust: 'Cloudflare Zero Trust でログイン',
    zeroTrustHint: '推奨：許可済みメールアドレスで認証します。',
    passwordLogin: '管理者パスワードでログイン',
    fallbackHint: 'ローカル開発や Zero Trust が使えない場合の予備入口です。',
    divider: 'または',
    login: 'ログイン',
    cancel: 'キャンセル',
    failed: 'メールアドレスまたはパスワードが正しくありません。',
    notConfigured: '管理者ログインが未設定です。',
  },
}

export function AdminSessionProvider({
  children,
  lang,
}: {
  children: React.ReactNode
  lang: keyof typeof labels
}) {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)
  const [email, setEmail] = useState('')
  const [provider, setProvider] = useState<'cloudflare_access' | 'password' | null>(null)
  const [configured, setConfigured] = useState(true)
  const [passwordConfigured, setPasswordConfigured] = useState(false)
  const [accessConfigured, setAccessConfigured] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | undefined>()

  const loadSession = async () => {
    if (sessionChecked) {
      return authenticated
    }

    setLoading(true)
    return fetch('/api/admin/session')
      .then((response) => response.json())
      .then((data) => {
        const isAuthenticated = Boolean(data.authenticated)
        setAuthenticated(isAuthenticated)
        setEmail(typeof data.email === 'string' ? data.email : '')
        setProvider(data.provider === 'cloudflare_access' || data.provider === 'password' ? data.provider : null)
        setConfigured(Boolean(data.configured))
        setPasswordConfigured(Boolean(data.passwordConfigured))
        setAccessConfigured(Boolean(data.accessConfigured))
        setSessionChecked(true)
        return isAuthenticated
      })
      .catch(() => {
        setConfigured(false)
        setSessionChecked(true)
        return false
      })
      .finally(() => setLoading(false))
  }

  const openLogin = async (path?: string) => {
    setNextPath(path)
    const isAuthenticated = await loadSession()
    if (isAuthenticated) return
    setLoginOpen(true)
  }

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuthenticated(false)
    setEmail('')
    setProvider(null)
    setSessionChecked(true)
    router.push('/tools')
    router.refresh()
  }

  return (
    <AdminSessionContext.Provider value={{ authenticated, email, provider, configured, passwordConfigured, accessConfigured, loading, openLogin, logout }}>
      {children}
      {loginOpen && (
        <AdminLoginDialog
          lang={lang}
          configured={configured}
          passwordConfigured={passwordConfigured}
          accessConfigured={accessConfigured}
          onAccessLogin={() => {
            const target = nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/admin'
            setLoginOpen(false)
            router.push(`/admin/auth?next=${encodeURIComponent(target)}`)
          }}
          onClose={() => setLoginOpen(false)}
          onLogin={(identity) => {
            setAuthenticated(true)
            setEmail(identity.email)
            setProvider(identity.provider)
            setLoginOpen(false)
            if (nextPath) router.push(nextPath)
            router.refresh()
          }}
        />
      )}
    </AdminSessionContext.Provider>
  )
}

export function useAdminSession() {
  const context = useContext(AdminSessionContext)
  if (!context) throw new Error('useAdminSession must be used inside AdminSessionProvider')
  return context
}

function AdminLoginDialog({
  lang,
  configured,
  passwordConfigured,
  accessConfigured,
  onAccessLogin,
  onClose,
  onLogin,
}: {
  lang: keyof typeof labels
  configured: boolean
  passwordConfigured: boolean
  accessConfigured: boolean
  onAccessLogin: () => void
  onClose: () => void
  onLogin: (identity: { email: string; provider: 'cloudflare_access' | 'password' | null }) => void
}) {
  const t = labels[lang]
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    setSubmitting(false)
    if (response.ok) {
      const data = await response.json().catch(() => ({}))
      return onLogin({
        email: typeof data.email === 'string' ? data.email : '',
        provider: data.provider === 'cloudflare_access' || data.provider === 'password' ? data.provider : 'password',
      })
    }
    setError(response.status === 503 ? t.notConfigured : t.failed)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-6">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/40 backdrop-blur-sm" />
      <form onSubmit={submit} className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">{t.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{configured ? t.help : t.notConfigured}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)]">
            <X className="h-4 w-4" />
          </button>
        </div>
        {accessConfigured && (
          <button
            type="button"
            onClick={onAccessLogin}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-left hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-emerald-500/15"
          >
            <span className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-emerald-500" />
              <span>
                <span className="block text-sm font-semibold text-[var(--text-primary)]">{t.zeroTrust}</span>
                <span className="mt-1 block text-xs leading-5 text-[var(--text-muted)]">{t.zeroTrustHint}</span>
              </span>
            </span>
          </button>
        )}
        {accessConfigured && passwordConfigured && (
          <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
            {t.divider}
            <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
        )}
        {passwordConfigured && (
          <div className={accessConfigured ? '' : 'mt-1'}>
            <div className="mb-3 flex items-start gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3">
              <KeyRound className="mt-0.5 h-5 w-5 flex-none text-[var(--text-muted)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">{t.passwordLogin}</div>
                <div className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{t.fallbackHint}</div>
              </div>
            </div>
            <label className="block text-sm font-semibold text-[var(--text-secondary)]">
              {t.email}
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                autoFocus={!accessConfigured}
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>
            <label className="mt-3 block text-sm font-semibold text-[var(--text-secondary)]">
              {t.password}
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                className="mt-2 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
              />
            </label>
          </div>
        )}
        {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="ui-button-ghost border border-[var(--border-subtle)]">{t.cancel}</button>
          {passwordConfigured && (
            <button type="submit" disabled={submitting || !configured || !email.trim() || !password} className="ui-button-primary">{t.login}</button>
          )}
        </div>
      </form>
    </div>
  )
}
