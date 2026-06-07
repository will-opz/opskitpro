'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAdminSession } from '@/components/AdminSessionProvider'
import {
  Activity,
  Braces,
  Check,
  Code2,
  Edit3,
  Globe,
  Lock,
  LogOut,
  Plus,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'

type Lang = 'zh' | 'en' | 'ja' | 'tw'
type LinkKind = 'builtin' | 'external' | 'custom'
type NavCategory = 'core' | 'ops' | 'dev' | 'ai' | 'security' | 'docs' | 'custom'

type NavItem = {
  id: string
  title: string
  description: string
  url: string
  category: NavCategory
  tags: string[]
  kind: LinkKind
  pinned?: boolean
}

type EditableNavItem = Pick<NavItem, 'title' | 'description' | 'url' | 'category' | 'tags' | 'pinned'>

const STORAGE_KEY = 'opskitpro.tools.customNav.v1'

const categoryLabels: Record<Lang, Record<NavCategory | 'all' | 'pinned', string>> = {
  zh: {
    all: '全部',
    pinned: '常用',
    core: 'OpsKitPro',
    ops: '运维',
    dev: '开发',
    ai: 'AI',
    security: '安全',
    docs: '文档',
    custom: '自定义',
  },
  tw: {
    all: '全部',
    pinned: '常用',
    core: 'OpsKitPro',
    ops: '維運',
    dev: '開發',
    ai: 'AI',
    security: '安全',
    docs: '文件',
    custom: '自訂',
  },
  en: {
    all: 'All',
    pinned: 'Pinned',
    core: 'OpsKitPro',
    ops: 'Ops',
    dev: 'Dev',
    ai: 'AI',
    security: 'Security',
    docs: 'Docs',
    custom: 'Custom',
  },
  ja: {
    all: 'すべて',
    pinned: 'よく使う',
    core: 'OpsKitPro',
    ops: '運用',
    dev: '開発',
    ai: 'AI',
    security: '安全',
    docs: '文書',
    custom: 'カスタム',
  },
}

const copy = {
  zh: {
    badge: '个人导航',
    title: '工具导航',
    subtitle: '把 OpsKitPro 工具、排障入口和日常服务放到一个轻量页面。',
    search: '搜索名称、URL、标签',
    login: '登录编辑',
    logout: '退出',
    add: '添加入口',
    edit: '编辑',
    delete: '删除',
    open: '打开',
    save: '保存',
    cancel: '取消',
    password: '管理员密码',
    loginTitle: '管理员登录',
    loginHelp: '当前只启用一个管理员账号。登录状态通过安全 cookie 保存。',
    notConfigured: '未配置管理员密码，请设置 OPSKITPRO_ADMIN_PASSWORD。',
    loginFailed: '密码不正确。',
    empty: '没有匹配的导航入口。',
    customCount: '自定义入口',
    pinnedCount: '常用入口',
    totalCount: '全部入口',
    reset: '恢复默认',
    name: '名称',
    description: '说明',
    url: '链接',
    category: '分类',
    tags: '标签',
    tagsHelp: '用逗号分隔',
    pinned: '加入常用',
    localOnly: '自定义配置保存在当前浏览器，本阶段不做多设备同步。',
  },
  tw: {
    badge: '個人導航',
    title: '工具導航',
    subtitle: '把 OpsKitPro 工具、排障入口和日常服務放到一個輕量頁面。',
    search: '搜尋名稱、URL、標籤',
    login: '登入編輯',
    logout: '登出',
    add: '新增入口',
    edit: '編輯',
    delete: '刪除',
    open: '開啟',
    save: '儲存',
    cancel: '取消',
    password: '管理員密碼',
    loginTitle: '管理員登入',
    loginHelp: '目前只啟用一個管理員帳號。登入狀態透過安全 cookie 保存。',
    notConfigured: '未配置管理員密碼，請設定 OPSKITPRO_ADMIN_PASSWORD。',
    loginFailed: '密碼不正確。',
    empty: '沒有匹配的導航入口。',
    customCount: '自訂入口',
    pinnedCount: '常用入口',
    totalCount: '全部入口',
    reset: '恢復預設',
    name: '名稱',
    description: '說明',
    url: '連結',
    category: '分類',
    tags: '標籤',
    tagsHelp: '用逗號分隔',
    pinned: '加入常用',
    localOnly: '自訂配置保存在目前瀏覽器，本階段不做多裝置同步。',
  },
  en: {
    badge: 'Personal Navigation',
    title: 'Tool Navigator',
    subtitle: 'OpsKitPro tools, diagnostic links, and daily services in one focused page.',
    search: 'Search name, URL, or tags',
    login: 'Sign in to edit',
    logout: 'Sign out',
    add: 'Add link',
    edit: 'Edit',
    delete: 'Delete',
    open: 'Open',
    save: 'Save',
    cancel: 'Cancel',
    password: 'Admin password',
    loginTitle: 'Admin sign in',
    loginHelp: 'A single admin user is enabled. The session is stored with a secure cookie.',
    notConfigured: 'Admin password is not configured. Set OPSKITPRO_ADMIN_PASSWORD.',
    loginFailed: 'Incorrect password.',
    empty: 'No navigation links matched.',
    customCount: 'Custom links',
    pinnedCount: 'Pinned links',
    totalCount: 'Total links',
    reset: 'Reset defaults',
    name: 'Name',
    description: 'Description',
    url: 'URL',
    category: 'Category',
    tags: 'Tags',
    tagsHelp: 'Separated by commas',
    pinned: 'Pin this link',
    localOnly: 'Custom links are stored in this browser for now; cross-device sync can come later.',
  },
  ja: {
    badge: '個人ナビ',
    title: 'ツールナビ',
    subtitle: 'OpsKitPro ツール、診断入口、日常サービスを軽量な 1 ページに集約。',
    search: '名前、URL、タグを検索',
    login: '編集ログイン',
    logout: 'ログアウト',
    add: '入口を追加',
    edit: '編集',
    delete: '削除',
    open: '開く',
    save: '保存',
    cancel: 'キャンセル',
    password: '管理者パスワード',
    loginTitle: '管理者ログイン',
    loginHelp: '現在は 1 人の管理者のみ有効です。セッションは安全な cookie で保存されます。',
    notConfigured: '管理者パスワード未設定です。OPSKITPRO_ADMIN_PASSWORD を設定してください。',
    loginFailed: 'パスワードが正しくありません。',
    empty: '一致するナビ項目がありません。',
    customCount: 'カスタム',
    pinnedCount: 'よく使う',
    totalCount: '全項目',
    reset: '初期状態に戻す',
    name: '名前',
    description: '説明',
    url: 'URL',
    category: 'カテゴリ',
    tags: 'タグ',
    tagsHelp: 'カンマ区切り',
    pinned: 'よく使うに追加',
    localOnly: 'カスタム設定は現在のブラウザに保存されます。複数端末同期は次段階です。',
  },
} satisfies Record<Lang, Record<string, string>>

const defaultItems: NavItem[] = [
  { id: 'network-check', title: 'Network Check', description: 'Speed, latency, IPv6 and reachability test', url: '/tools/network-check', category: 'core', tags: ['network', 'speed', 'ipv6', 'ping'], kind: 'builtin', pinned: true },
  { id: 'website-check', title: 'Website Check', description: 'DNS, SSL, CDN, HTTP health diagnostics', url: '/tools/website-check', category: 'core', tags: ['dns', 'ssl', 'cdn'], kind: 'builtin', pinned: true },
  { id: 'dns-lookup', title: 'DNS Lookup', description: 'DNS records and resolution checks', url: '/tools/dns-lookup', category: 'core', tags: ['dns', 'record'], kind: 'builtin', pinned: true },
  { id: 'ip-lookup', title: 'IP Lookup', description: 'ASN, ISP, geo and network hints', url: '/tools/ip-lookup', category: 'core', tags: ['ip', 'asn'], kind: 'builtin', pinned: true },
  { id: 'json', title: 'JSON Tool', description: 'Format, validate, repair and compare JSON', url: '/tools/json', category: 'dev', tags: ['json', 'format'], kind: 'builtin', pinned: true },
  { id: 'websocket', title: 'WebSocket Debugger', description: 'Connect, send messages and inspect logs', url: '/tools/websocket', category: 'dev', tags: ['ws', 'debug'], kind: 'builtin' },
  { id: 'passgen', title: 'Password Generator', description: 'Generate strong local passwords', url: '/tools/passgen', category: 'security', tags: ['password'], kind: 'builtin' },
  { id: 'qrgen', title: 'QR Generator', description: 'Create QR codes from text and links', url: '/tools/qrgen', category: 'dev', tags: ['qr'], kind: 'builtin' },
  { id: 'time', title: 'Time Converter', description: 'Unix, ISO and timezone conversion', url: '/tools/time', category: 'dev', tags: ['time'], kind: 'builtin' },
  { id: 'encode', title: 'Encode Tool', description: 'Base64, URL encoding and JWT payload decode', url: '/tools/encode', category: 'dev', tags: ['base64', 'jwt'], kind: 'builtin' },
  { id: 'prompt-builder', title: 'Prompt Builder', description: 'Engineering prompts for AI coding agents', url: '/tools/prompt-builder', category: 'ai', tags: ['prompt', 'agent'], kind: 'builtin', pinned: true },
  { id: 'blog', title: 'OpsKitPro Blog', description: 'Public notes, tool design and SRE reflections', url: '/blog', category: 'docs', tags: ['kb', 'notes'], kind: 'builtin' },
  { id: 'cloudflare', title: 'Cloudflare Dashboard', description: 'Edge, DNS, WAF and Workers console', url: 'https://dash.cloudflare.com', category: 'ops', tags: ['cloudflare', 'edge'], kind: 'external', pinned: true },
  { id: 'github', title: 'GitHub OpsKitPro', description: 'Public repository and CI/CD history', url: 'https://github.com/will-opz/opskitpro', category: 'dev', tags: ['github', 'ci'], kind: 'external', pinned: true },
  { id: 'cloudflare-status', title: 'Cloudflare Status', description: 'Cloudflare incidents and component health', url: 'https://www.cloudflarestatus.com/', category: 'ops', tags: ['status'], kind: 'external' },
  { id: 'github-status', title: 'GitHub Status', description: 'GitHub incidents and component health', url: 'https://www.githubstatus.com/', category: 'dev', tags: ['status'], kind: 'external' },
  { id: 'openai', title: 'OpenAI', description: 'ChatGPT and OpenAI platform', url: 'https://chat.openai.com', category: 'ai', tags: ['ai'], kind: 'external', pinned: true },
  { id: 'claude', title: 'Claude', description: 'Anthropic Claude workspace', url: 'https://claude.ai', category: 'ai', tags: ['ai'], kind: 'external', pinned: true },
  { id: 'qiita', title: 'Qiita', description: 'Technical article publishing', url: 'https://qiita.com', category: 'docs', tags: ['article', 'japan'], kind: 'external' },
  { id: 'x', title: 'X / Twitter', description: 'OpsKitPro promotion and feedback', url: 'https://x.com/OpsKitPro', category: 'docs', tags: ['social'], kind: 'external' },
  { id: 'matrix', title: 'Matrix.org', description: 'Federated secure communication project', url: 'https://matrix.org', category: 'docs', tags: ['matrix', 'chat'], kind: 'external' },
]

const categoryOrder: Array<NavCategory | 'all' | 'pinned'> = ['pinned', 'all', 'core', 'ops', 'dev', 'ai', 'security', 'docs', 'custom']

const iconByCategory = {
  core: Activity,
  ops: Globe,
  dev: Code2,
  ai: Sparkles,
  security: Shield,
  docs: Braces,
  custom: Star,
} satisfies Record<NavCategory, typeof Activity>

const blankItem: EditableNavItem = {
  title: '',
  description: '',
  url: '',
  category: 'custom',
  tags: [],
  pinned: true,
}

export default function ToolsNavigatorClient({ lang }: { lang: Lang }) {
  const t = copy[lang] || copy.zh
  const labels = categoryLabels[lang] || categoryLabels.zh
  const searchParams = useSearchParams()
  const adminMode = searchParams.get('admin') === '1'
  const { authenticated, openLogin, logout } = useAdminSession()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<NavCategory | 'all' | 'pinned'>('pinned')
  const [customItems, setCustomItems] = useState<NavItem[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<NavItem | null>(null)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved) setCustomItems(JSON.parse(saved))
    } catch {
      setCustomItems([])
    } finally {
      setStorageReady(true)
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customItems))
  }, [customItems, storageReady])

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.getElementById('tool-search')?.focus()
      }
    }

    window.addEventListener('keydown', focusSearch)
    return () => window.removeEventListener('keydown', focusSearch)
  }, [])

  const allItems = useMemo(() => [...defaultItems, ...customItems], [customItems])
  const pinnedItems = useMemo(() => allItems.filter((item) => item.pinned), [allItems])
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return allItems.filter((item) => {
      const categoryMatches =
        activeCategory === 'all' ||
        (activeCategory === 'pinned' ? item.pinned : item.category === activeCategory)
      const queryMatches =
        !normalizedQuery ||
        [item.title, item.description, item.url, item.category, ...item.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)

      return categoryMatches && queryMatches
    })
  }, [activeCategory, allItems, query])

  const openNewEditor = () => {
    setEditingItem(null)
    setEditorOpen(true)
  }

  const openEdit = (item: NavItem) => {
    setEditingItem(item)
    setEditorOpen(true)
  }

  const saveItem = (item: EditableNavItem) => {
    const normalizedItem: NavItem = {
      ...item,
      id: editingItem?.id || `custom-${Date.now()}`,
      kind: 'custom',
      title: item.title.trim(),
      description: item.description.trim(),
      url: item.url.trim(),
      tags: item.tags.map((tag) => tag.trim()).filter(Boolean),
    }

    setCustomItems((items) => {
      if (!editingItem) return [normalizedItem, ...items]

      return items.map((existing) => (existing.id === editingItem.id ? normalizedItem : existing))
    })
    setEditorOpen(false)
  }

  const deleteItem = (item: NavItem) => {
    setCustomItems((items) => items.filter((existing) => existing.id !== item.id))
  }

  const resetCustomItems = () => setCustomItems([])

  return (
    <main className="w-full flex-grow bg-[#f9fafb] text-[#17201c] dark:bg-[#0d100f] dark:text-[var(--text-primary)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 pb-20 pt-8 sm:px-6 md:pt-10">
        <div className="rounded-2xl border border-black/[0.045] bg-white px-5 py-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] dark:border-white/[0.07] dark:bg-[#141816] sm:px-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 text-[10px] font-semibold uppercase text-[#1a6f4e]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1a6f4e]" />
                {t.badge}
              </div>
              <h1 className="text-3xl font-semibold sm:text-[2.6rem] sm:leading-none">{t.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68736d] dark:text-[var(--text-muted)]">{t.subtitle}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {authenticated && adminMode ? (
                <>
                  <button type="button" onClick={openNewEditor} className="ui-button-primary rounded-xl px-4 py-2.5">
                    <Plus className="h-4 w-4" />
                    {t.add}
                  </button>
                  <button type="button" onClick={() => void logout()} className="ui-button-ghost rounded-xl border border-[var(--border-subtle)]">
                    <LogOut className="h-4 w-4" />
                    {t.logout}
                  </button>
                </>
              ) : adminMode ? (
                <button type="button" onClick={() => openLogin('/tools?admin=1')} className="ui-button-primary rounded-xl px-4 py-2.5">
                  <Lock className="h-4 w-4" />
                  {t.login}
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/[0.055] pt-4 dark:border-white/[0.07]">
            <StatCard label={t.pinnedCount} value={pinnedItems.length} icon={Star} />
            <StatCard label={t.customCount} value={customItems.length} icon={UserRound} />
            <StatCard label={t.totalCount} value={allItems.length} icon={Check} />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label htmlFor="tool-search" className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#89928d]" />
            <input
              id="tool-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t.search}
              className="h-12 w-full rounded-xl border border-black/[0.07] bg-white pl-11 pr-16 text-[13px] font-medium text-[#25302a] shadow-[0_8px_30px_rgba(0,0,0,0.025)] outline-none placeholder:font-normal placeholder:text-[#9da59f] focus:border-[#1a6f4e]/40 focus:ring-4 focus:ring-[#1a6f4e]/[0.07] dark:border-white/[0.08] dark:bg-[#141816] dark:text-[var(--text-primary)]"
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-black/[0.06] bg-[#f5f7f6] px-2 py-1 text-[10px] font-medium text-[#8b948f] dark:border-white/[0.08] dark:bg-white/[0.04]">
              ⌘ K
            </span>
          </label>

          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
            {categoryOrder.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  activeCategory === category
                    ? 'border-[#1a6f4e] bg-[#1a6f4e] text-white shadow-sm'
                    : 'border-black/[0.06] bg-white text-[#68736d] hover:border-[#1a6f4e]/25 hover:bg-[#1a6f4e]/[0.035] hover:text-[#1a6f4e] dark:border-white/[0.08] dark:bg-[#141816] dark:text-[var(--text-secondary)]'
                }`}
              >
                {labels[category]}
              </button>
            ))}
          </div>
        </div>

        {authenticated && adminMode && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3">
            <p className="text-xs leading-5 text-[var(--text-muted)]">{t.localOnly}</p>
            {customItems.length > 0 && (
              <button type="button" onClick={resetCustomItems} className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:border-red-500/30 hover:bg-red-500/8 hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
                {t.reset}
              </button>
            )}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-primary)] text-sm text-[var(--text-muted)]">
            {t.empty}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => (
              <NavCard
                key={item.id}
                item={item}
                labels={labels}
                openLabel={t.open}
                editLabel={t.edit}
                deleteLabel={t.delete}
                authenticated={authenticated && adminMode}
                onEdit={openEdit}
                onDelete={deleteItem}
              />
            ))}
          </div>
        )}
      </section>

      {editorOpen && (
        <EditorDialog
          t={t}
          labels={labels}
          item={editingItem}
          onClose={() => setEditorOpen(false)}
          onSave={saveItem}
        />
      )}
    </main>
  )
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity }) {
  return (
    <div className="min-w-0 rounded-xl bg-[#f7f9f8] px-3 py-2.5 dark:bg-white/[0.035]">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 text-[#1a6f4e]" />
        <span className="text-lg font-semibold leading-none text-[#26332c] dark:text-[var(--text-primary)]">{value}</span>
      </div>
      <div className="mt-1.5 whitespace-nowrap text-[8px] font-medium uppercase text-[#8a948e] sm:text-[10px]">{label}</div>
    </div>
  )
}

function NavCard({
  item,
  labels,
  openLabel,
  editLabel,
  deleteLabel,
  authenticated,
  onEdit,
  onDelete,
}: {
  item: NavItem
  labels: Record<NavCategory | 'all' | 'pinned', string>
  openLabel: string
  editLabel: string
  deleteLabel: string
  authenticated: boolean
  onEdit: (item: NavItem) => void
  onDelete: (item: NavItem) => void
}) {
  const Icon = iconByCategory[item.category]
  const external = /^https?:\/\//.test(item.url)
  const editable = authenticated && item.kind === 'custom'

  return (
    <article className="group relative flex min-h-[178px] flex-col justify-between overflow-hidden rounded-xl border border-black/[0.055] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.03)] transition duration-200 hover:-translate-y-0.5 hover:border-[#1a6f4e]/20 hover:shadow-[0_16px_40px_rgba(26,111,78,0.08)] dark:border-white/[0.07] dark:bg-[#141816]">
      <Link
        href={item.url}
        target={external ? '_blank' : undefined}
        rel={external ? 'noreferrer' : undefined}
        aria-label={`${openLabel}: ${item.title}`}
        className="absolute inset-0 z-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1a6f4e]/40 focus:ring-offset-2"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3.5">
          <Icon className="mt-0.5 h-6 w-6 shrink-0 stroke-[1.7] text-[#1a6f4e]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[15px] font-semibold text-[#202b25] dark:text-[var(--text-primary)]">{item.title}</h2>
              {item.pinned && <Star className="h-3 w-3 shrink-0 fill-[#1a6f4e] text-[#1a6f4e]" />}
            </div>
            <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[#748078] dark:text-[var(--text-muted)]">{item.description}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-md bg-[#1a6f4e]/[0.055] px-2 py-1 text-[10px] font-medium text-[#1a6f4e]">
            #{labels[item.category].toLowerCase()}
          </span>
          {item.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-md bg-[#f5f7f6] px-2 py-1 text-[10px] font-medium text-[#89938d] dark:bg-white/[0.04]">
              #{tag.toLowerCase()}
            </span>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <span className="translate-y-1 text-[10px] font-medium text-[#1a6f4e] opacity-0 transition duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            {openLabel} ↗
          </span>
          {editable && (
            <div className="relative z-20 flex gap-1.5">
              <button type="button" onClick={() => onEdit(item)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.06] bg-white text-[#748078] hover:border-[#1a6f4e]/30 hover:text-[#1a6f4e] dark:border-white/[0.08] dark:bg-[#141816]" aria-label={editLabel}>
                <Edit3 className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onDelete(item)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-black/[0.06] bg-white text-[#748078] hover:border-red-500/30 hover:text-red-500 dark:border-white/[0.08] dark:bg-[#141816]" aria-label={deleteLabel}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function EditorDialog({
  t,
  labels,
  item,
  onClose,
  onSave,
}: {
  t: Record<string, string>
  labels: Record<NavCategory | 'all' | 'pinned', string>
  item: NavItem | null
  onClose: () => void
  onSave: (item: EditableNavItem) => void
}) {
  const [form, setForm] = useState<EditableNavItem>(() => item ? {
    title: item.title,
    description: item.description,
    url: item.url,
    category: item.category,
    tags: item.tags,
    pinned: item.pinned,
  } : blankItem)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSave(form)
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={submit} className="w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-elevated)] p-5 shadow-2xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-lg font-black">{item ? t.edit : t.add}</h2>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label={t.name} value={form.title} onChange={(value) => setForm({ ...form, title: value })} required />
          <TextField label={t.url} value={form.url} onChange={(value) => setForm({ ...form, url: value })} required />
          <label className="block text-sm font-semibold sm:col-span-2">
            {t.description}
            <textarea
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              className="mt-2 min-h-24 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-sm outline-none focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
            />
          </label>
          <label className="block text-sm font-semibold">
            {t.category}
            <select
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value as NavCategory })}
              className="mt-2 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 text-sm outline-none focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
            >
              {(['custom', 'ops', 'dev', 'ai', 'security', 'docs'] as NavCategory[]).map((category) => (
                <option key={category} value={category}>{labels[category]}</option>
              ))}
            </select>
          </label>
          <TextField
            label={t.tags}
            value={form.tags.join(', ')}
            helper={t.tagsHelp}
            onChange={(value) => setForm({ ...form, tags: value.split(',') })}
          />
        </div>

        <label className="mt-4 flex items-center gap-3 text-sm font-semibold">
          <input
            type="checkbox"
            checked={Boolean(form.pinned)}
            onChange={(event) => setForm({ ...form, pinned: event.target.checked })}
            className="h-4 w-4 accent-emerald-500"
          />
          {t.pinned}
        </label>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="ui-button-ghost border border-[var(--border-subtle)]">{t.cancel}</button>
          <button type="submit" className="ui-button-primary">{t.save}</button>
        </div>
      </form>
    </Modal>
  )
}

function TextField({
  label,
  value,
  helper,
  required,
  onChange,
}: {
  label: string
  value: string
  helper?: string
  required?: boolean
  onChange: (value: string) => void
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        type="text"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 text-sm outline-none focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
      />
      {helper && <span className="mt-1 block text-xs font-normal text-[var(--text-muted)]">{helper}</span>}
    </label>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 py-6">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 cursor-default bg-black/45 backdrop-blur-sm" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  )
}
