'use client'

import { useState, useEffect } from 'react'
import { Server, Zap, Shield, Globe, Terminal, RefreshCw, Layers } from 'lucide-react'
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
  const [trace, setTrace] = useState<CfTrace | null>(null)
  const [phase, setPhase] = useState<'loading' | 'done' | 'error'>('loading')

  const fetchTrace = async () => {
    setPhase('loading')
    try {
      const res = await fetch('/cdn-cgi/trace')
      const text = await res.text()
      const parsed = Object.fromEntries(
        text
          .trim()
          .split('\n')
          .map((l) => l.split('='))
          .filter((p) => p.length === 2)
          .map(([k, v]) => [k.trim(), v.trim()])
      ) as unknown as CfTrace
      setTrace(parsed)
      setPhase('done')
    } catch {
      setPhase('error')
    }
  }

  useEffect(() => {
    fetchTrace()
  }, [])

  const t = {
    zh: {
      title: 'Cloudflare Trace 中心',
      subtitle: '即时解析你在 Cloudflare 边缘网络的路由、协议与加密状态。',
      badge: 'Edge Node Info',
      colo: '接入节点 (Colo)',
      ip: '客户端 IP',
      loc: '物理位置',
      http: 'HTTP 协议',
      tls: 'TLS 版本',
      sni: 'SNI',
      warp: 'WARP 状态',
      gateway: 'Zero Trust Gateway',
      refresh: '刷新状态',
      panel1: '核心路由信息',
      panel2: '加密与协议',
    },
    en: {
      title: 'Cloudflare Trace Center',
      subtitle: 'Instantly analyze your routing, protocol, and encryption status on the Cloudflare edge.',
      badge: 'Edge Node Info',
      colo: 'Edge Node (Colo)',
      ip: 'Client IP',
      loc: 'Location',
      http: 'HTTP Protocol',
      tls: 'TLS Version',
      sni: 'SNI',
      warp: 'WARP Status',
      gateway: 'Zero Trust Gateway',
      refresh: 'Refresh Status',
      panel1: 'Core Routing',
      panel2: 'Encryption & Protocol',
    },
    tw: {
      title: 'Cloudflare Trace 中心',
      subtitle: '即時解析你在 Cloudflare 邊緣網路的路由、協定與加密狀態。',
      badge: 'Edge Node Info',
      colo: '接入節點 (Colo)',
      ip: '用戶端 IP',
      loc: '物理位置',
      http: 'HTTP 協定',
      tls: 'TLS 版本',
      sni: 'SNI',
      warp: 'WARP 狀態',
      gateway: 'Zero Trust Gateway',
      refresh: '更新狀態',
      panel1: '核心路由資訊',
      panel2: '加密與協定',
    },
    ja: {
      title: 'Cloudflare Trace センター',
      subtitle: 'Cloudflare エッジでのルーティング、プロトコル、暗号化ステータスを即座に解析します。',
      badge: 'Edge Node Info',
      colo: 'エッジノード (Colo)',
      ip: 'クライアント IP',
      loc: 'ロケーション',
      http: 'HTTP プロトコル',
      tls: 'TLS バージョン',
      sni: 'SNI',
      warp: 'WARP ステータス',
      gateway: 'Zero Trust Gateway',
      refresh: '更新',
      panel1: 'コアルーティング',
      panel2: '暗号化とプロトコル',
    },
  }[lang]

  return (
    <main className="ui-shell">
      <div className="glow" aria-hidden />

      <section className="mx-auto w-full max-w-3xl px-4 pt-12 pb-6 sm:px-6 text-center">
        <div className="inline-flex items-center gap-2 ui-chip mb-5">
          <Terminal className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-3">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
          {t.subtitle}
        </p>

        {phase === 'done' && (
          <button
            onClick={fetchTrace}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-[var(--border-strong)] text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-color)]/40 hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t.refresh}
          </button>
        )}
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-16 grid gap-4">
        {/* Routing Panel */}
        <ResultPanel title={t.panel1} icon={<Globe className="w-4 h-4" />} phase={phase}>
          {trace && (
            <div className="grid sm:grid-cols-2 gap-x-8">
              <div>
                <MetaRow label={t.ip} value={trace.ip || '—'} mono />
                <MetaRow label={t.loc} value={trace.loc || '—'} mono />
              </div>
              <div>
                <MetaRow label={t.colo} value={trace.colo || '—'} mono />
                <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                  <span className="text-xs text-[var(--text-muted)]">{t.warp}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold font-mono text-[var(--text-primary)]">{trace.warp || 'off'}</span>
                    <StatusBadge status={trace.warp === 'on' || trace.warp === 'plus' ? 'ok' : 'slow'} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </ResultPanel>

        {/* Crypto & Protocol Panel */}
        <ResultPanel title={t.panel2} icon={<Shield className="w-4 h-4" />} phase={phase}>
          {trace && (
            <div className="grid sm:grid-cols-2 gap-x-8">
              <div>
                <MetaRow label={t.http} value={trace.http || '—'} mono />
                <MetaRow label={t.tls} value={trace.tls || '—'} mono />
              </div>
              <div>
                <MetaRow label={t.sni} value={trace.sni || '—'} mono />
                <MetaRow label={t.gateway} value={trace.gateway || 'off'} mono />
              </div>
            </div>
          )}
        </ResultPanel>
      </section>
    </main>
  )
}
