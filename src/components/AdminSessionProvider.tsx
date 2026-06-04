'use client'

import { createContext, FormEvent, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

type AdminSessionContextValue = {
  authenticated: boolean
  configured: boolean
  loading: boolean
  openLogin: (nextPath?: string) => void
  logout: () => Promise<void>
}

const AdminSessionContext = createContext<AdminSessionContextValue | null>(null)

const labels = {
  zh: {
    title: '管理员登录',
    help: '登录后可进入管理页面并编辑个人导航。公开工具无需登录。',
    password: '管理员密码',
    login: '登录',
    cancel: '取消',
    failed: '密码不正确。',
    notConfigured: '管理员密码尚未配置。',
  },
  tw: {
    title: '管理員登入',
    help: '登入後可進入管理頁面並編輯個人導航。公開工具無需登入。',
    password: '管理員密碼',
    login: '登入',
    cancel: '取消',
    failed: '密碼不正確。',
    notConfigured: '管理員密碼尚未配置。',
  },
  en: {
    title: 'Admin sign in',
    help: 'Sign in to access management pages and edit your personal navigation. Public tools remain open.',
    password: 'Admin password',
    login: 'Sign in',
    cancel: 'Cancel',
    failed: 'Incorrect password.',
    notConfigured: 'Admin password is not configured.',
  },
  ja: {
    title: '管理者ログイン',
    help: 'ログイン後、管理ページと個人ナビ編集を利用できます。公開ツールはログイン不要です。',
    password: '管理者パスワード',
    login: 'ログイン',
    cancel: 'キャンセル',
    failed: 'パスワードが正しくありません。',
    notConfigured: '管理者パスワードが未設定です。',
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
  const [configured, setConfigured] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loginOpen, setLoginOpen] = useState(false)
  const [nextPath, setNextPath] = useState<string | undefined>()

  useEffect(() => {
    fetch('/api/admin/session')
      .then((response) => response.json())
      .then((data) => {
        setAuthenticated(Boolean(data.authenticated))
        setConfigured(Boolean(data.configured))
      })
      .catch(() => setConfigured(false))
      .finally(() => setLoading(false))
  }, [])

  const openLogin = (path?: string) => {
    setNextPath(path)
    setLoginOpen(true)
  }

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' })
    setAuthenticated(false)
    router.push('/tools')
    router.refresh()
  }

  return (
    <AdminSessionContext.Provider value={{ authenticated, configured, loading, openLogin, logout }}>
      {children}
      {loginOpen && (
        <AdminLoginDialog
          lang={lang}
          configured={configured}
          onClose={() => setLoginOpen(false)}
          onLogin={() => {
            setAuthenticated(true)
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
  onClose,
  onLogin,
}: {
  lang: keyof typeof labels
  configured: boolean
  onClose: () => void
  onLogin: () => void
}) {
  const t = labels[lang]
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
      body: JSON.stringify({ password }),
    })

    setSubmitting(false)
    if (response.ok) return onLogin()
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
        <label className="block text-sm font-semibold text-[var(--text-secondary)]">
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            className="mt-2 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10"
          />
        </label>
        {error && <p className="mt-3 text-sm font-semibold text-red-500">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="ui-button-ghost border border-[var(--border-subtle)]">{t.cancel}</button>
          <button type="submit" disabled={submitting || !configured} className="ui-button-primary">{t.login}</button>
        </div>
      </form>
    </div>
  )
}
