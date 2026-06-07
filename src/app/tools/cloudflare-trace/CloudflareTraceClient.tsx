'use client'

import { useState, useEffect } from 'react'
import { Server, Zap, Shield, Globe, Terminal, RefreshCw, Search, Layers, Activity } from 'lucide-react'
import { ResultPanel, MetaRow, StatusBadge } from '@/components/diagnostic'

interface CfTrace {
  fl?: string
  h?: string
  ip?: string
  ts?: string
  visit_scheme?: string
  uag?: string
  colo?: string
  sliver?: string
  http?: string
  loc?: string
  tls?: string
  sni?: string
  warp?: string
  gateway?: string
  kex?: string
}

export default function CloudflareTraceClient({
  dict,
  lang,
}: {
  dict: any
  lang: 'zh' | 'en' | 'ja' | 'tw'
}) {
  const [activeTab, setActiveTab] = useState<'my' | 'target'>('my')
  const [myTrace, setMyTrace] = useState<CfTrace | null>(null)
  const [myPhase, setMyPhase] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const [targetDomain, setTargetDomain] = useState('')
  const [targetTrace, setTargetTrace] = useState<CfTrace | null>(null)
  const [targetPhase, setTargetPhase] = useState<'idle' | 'loading' | 'done' | 'error' | 'not_cf'>('idle')
  const [targetErrorMsg, setTargetErrorMsg] = useState('')

  const fetchMyTrace = async () => {
    setMyPhase('loading')
    try {
      const res = await fetch('/cdn-cgi/trace')
      if (!res.ok) throw new Error()
      const text = await res.text()
      setMyTrace(parseTraceText(text))
      setMyPhase('done')
    } catch {
      setMyPhase('error')
    }
  }

  const fetchTargetTrace = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!targetDomain.trim()) return

    // Clean up domain input
    let cleanDomain = targetDomain.trim().toLowerCase()
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '')
    cleanDomain = cleanDomain.split('/')[0]

    setTargetPhase('loading')
    setTargetErrorMsg('')
    try {
      const res = await fetch(`/api/trace?domain=${encodeURIComponent(cleanDomain)}`)
      const text = await res.text()
      
      if (!res.ok) {
        let data: any = null
        try { data = JSON.parse(text) } catch { /* ignore */ }

        if (res.status === 404 && data?.error?.includes('Could not verify')) {
          setTargetPhase('not_cf')
        } else {
          setTargetPhase('error')
          setTargetErrorMsg(data?.error || 'Failed to fetch trace')
        }
        return
      }

      setTargetTrace(parseTraceText(text))
      setTargetPhase('done')
    } catch {
      setTargetPhase('error')
      setTargetErrorMsg('Network error')
    }
  }

  useEffect(() => {
    if (activeTab === 'my' && myPhase === 'idle') {
      fetchMyTrace()
    }
  }, [activeTab, myPhase])

  const parseTraceText = (text: string): CfTrace => {
    return Object.fromEntries(
      text
        .trim()
        .split('\n')
        .map((l) => l.split('='))
        .filter((p) => p.length === 2)
        .map(([k, v]) => [k.trim(), v.trim()])
    ) as unknown as CfTrace
  }

  const t = {
    zh: {
      title: 'Cloudflare Trace 中心',
      subtitle: '即时解析目标域名或当前环境的 Cloudflare 边缘节点路由追踪。',
      tabMy: 'My Cloudflare Trace',
      tabTarget: 'Target Domain Trace',
      colo: '数据中心 (Colo)',
      ip: '访问 IP',
      loc: '物理位置',
      http: 'HTTP 协议',
      tls: 'TLS 版本',
      sni: 'SNI',
      warp: 'WARP 状态',
      gateway: 'Zero Trust Gateway',
      refresh: '刷新状态',
      panel1: '核心路由信息',
      panel2: '加密与协议',
      targetPlaceholder: 'example.com',
      targetBtn: '探测 Trace',
      targetHint: '从 OpsKitPro 服务器探测目标的 /cdn-cgi/trace，非您本地浏览器直连。',
      notCfTitle: 'Cloudflare Trace Not Available',
      notCfDesc: '目标网站可能未接入 Cloudflare，或屏蔽了 /cdn-cgi/trace 路径。',
    },
    en: {
      title: 'Cloudflare Trace Center',
      subtitle: 'Analyze the Cloudflare edge routing for your connection or a target domain.',
      tabMy: 'My Cloudflare Trace',
      tabTarget: 'Target Domain Trace',
      colo: 'Data Center (Colo)',
      ip: 'Visitor IP',
      loc: 'Location',
      http: 'HTTP Protocol',
      tls: 'TLS Version',
      sni: 'SNI',
      warp: 'WARP Status',
      gateway: 'Zero Trust Gateway',
      refresh: 'Refresh',
      panel1: 'Core Routing',
      panel2: 'Encryption & Protocol',
      targetPlaceholder: 'example.com',
      targetBtn: 'Trace Target',
      targetHint: 'This checks the target from OpsKitPro’s Cloudflare Worker, not from your browser.',
      notCfTitle: 'Cloudflare Trace Not Available',
      notCfDesc: 'The target may not be using Cloudflare, or it blocks the /cdn-cgi/trace path.',
    },
    tw: {
      title: 'Cloudflare Trace 中心',
      subtitle: '即時解析目標網域名稱或當前環境的 Cloudflare 邊緣節點路由追蹤。',
      tabMy: 'My Cloudflare Trace',
      tabTarget: 'Target Domain Trace',
      colo: '資料中心 (Colo)',
      ip: '存取 IP',
      loc: '實體位置',
      http: 'HTTP 協定',
      tls: 'TLS 版本',
      sni: 'SNI',
      warp: 'WARP 狀態',
      gateway: 'Zero Trust Gateway',
      refresh: '更新狀態',
      panel1: '核心路由資訊',
      panel2: '加密與協定',
      targetPlaceholder: 'example.com',
      targetBtn: '探測 Trace',
      targetHint: '從 OpsKitPro 伺服器探測目標的 /cdn-cgi/trace，非您本機瀏覽器直連。',
      notCfTitle: 'Cloudflare Trace Not Available',
      notCfDesc: '目標網站可能未接入 Cloudflare，或封鎖了 /cdn-cgi/trace 路徑。',
    },
    ja: {
      title: 'Cloudflare Trace センター',
      subtitle: 'あなたの接続またはターゲットドメインの Cloudflare エッジルーティングを解析します。',
      tabMy: 'My Cloudflare Trace',
      tabTarget: 'Target Domain Trace',
      colo: 'データセンター (Colo)',
      ip: '訪問者 IP',
      loc: 'ロケーション',
      http: 'HTTP プロトコル',
      tls: 'TLS バージョン',
      sni: 'SNI',
      warp: 'WARP ステータス',
      gateway: 'Zero Trust Gateway',
      refresh: '更新',
      panel1: 'コアルーティング',
      panel2: '暗号化とプロトコル',
      targetPlaceholder: 'example.com',
      targetBtn: 'Trace 実行',
      targetHint: 'ブラウザからではなく、OpsKitPro のサーバーからターゲットをチェックします。',
      notCfTitle: 'Cloudflare Trace Not Available',
      notCfDesc: 'ターゲットは Cloudflare を使用していないか、/cdn-cgi/trace をブロックしています。',
    },
  }[lang]

  return (
    <main className="ui-shell">
      <div className="glow" aria-hidden />

      <section className="mx-auto w-full max-w-3xl px-4 pt-12 pb-6 sm:px-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-3">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
          {t.subtitle}
        </p>

        {/* Tabs */}
        <div className="inline-flex rounded-xl bg-[var(--surface-sunken)] p-1 border border-[var(--border-subtle)] mb-8">
          <button
            onClick={() => setActiveTab('my')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'my' 
                ? 'bg-white text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.tabMy}
          </button>
          <button
            onClick={() => setActiveTab('target')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'target' 
                ? 'bg-white text-[var(--text-primary)] shadow-sm' 
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.tabTarget}
          </button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-16">
        
        {/* TAB 1: My Trace */}
        {activeTab === 'my' && (
          <div className="grid gap-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[var(--text-secondary)]">Your connection to Cloudflare</div>
              {myPhase === 'done' && (
                <button
                  onClick={fetchMyTrace}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {t.refresh}
                </button>
              )}
            </div>

            <ResultPanel title={t.panel1} icon={<Globe className="w-4 h-4" />} phase={myPhase}>
              {myTrace && <TraceDataDisplay trace={myTrace} t={t} />}
            </ResultPanel>
          </div>
        )}

        {/* TAB 2: Target Trace */}
        {activeTab === 'target' && (
          <div className="grid gap-4">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm mb-4">
              <form onSubmit={fetchTargetTrace} className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.targetPlaceholder}
                  value={targetDomain}
                  onChange={(e) => setTargetDomain(e.target.value)}
                  className="flex-grow rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-sunken)] px-4 py-3 text-sm focus:border-[var(--accent-color)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-color)]"
                />
                <button
                  type="submit"
                  disabled={targetPhase === 'loading' || !targetDomain.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-50"
                >
                  {targetPhase === 'loading' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="hidden sm:inline">{t.targetBtn}</span>
                </button>
              </form>
              <div className="mt-3 flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                <Shield className="w-4 h-4 shrink-0" />
                <p>{t.targetHint}</p>
              </div>
            </div>

            {targetPhase === 'not_cf' && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center">
                <Activity className="w-8 h-8 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-zinc-900 mb-1">{t.notCfTitle}</h3>
                <p className="text-sm text-zinc-500">{t.notCfDesc}</p>
              </div>
            )}

            {targetPhase === 'error' && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{targetErrorMsg}</p>
              </div>
            )}

            {(targetPhase === 'done' || targetPhase === 'loading') && (
              <ResultPanel title={t.panel1} icon={<Server className="w-4 h-4" />} phase={targetPhase}>
                {targetTrace && <TraceDataDisplay trace={targetTrace} t={t} />}
              </ResultPanel>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function TraceDataDisplay({ trace, t }: { trace: CfTrace, t: any }) {
  return (
    <div className="grid gap-6">
      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        <div>
          <MetaRow label={t.colo} value={trace.colo || '—'} mono />
          <MetaRow label={t.ip} value={trace.ip || '—'} mono />
          <MetaRow label={t.loc} value={trace.loc || '—'} mono />
        </div>
        <div>
          <MetaRow label={t.http} value={trace.http || '—'} mono />
          <MetaRow label={t.tls} value={trace.tls || '—'} mono />
          <MetaRow label={t.sni} value={trace.sni === 'plaintext' ? 'off' : trace.sni || '—'} mono />
        </div>
      </div>
      
      {/* Advanced Details separated by a small divider */}
      <div className="border-t border-[var(--border-subtle)] pt-4 grid sm:grid-cols-2 gap-x-8 gap-y-1">
         <div>
          <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
            <span className="text-xs text-[var(--text-muted)]">{t.warp}</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold font-mono text-[var(--text-primary)]">{trace.warp || 'off'}</span>
              <StatusBadge status={trace.warp === 'on' || trace.warp === 'plus' ? 'ok' : 'slow'} />
            </div>
          </div>
          <MetaRow label={t.gateway} value={trace.gateway || 'off'} mono />
         </div>
         <div>
          <MetaRow label="Time (ts)" value={trace.ts || '—'} mono />
          <MetaRow label="Sliver" value={trace.sliver || '—'} mono />
         </div>
      </div>
    </div>
  )
}
