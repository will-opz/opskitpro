'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Wifi,
  Globe,
  Gauge,
  Download,
  Upload,
  Clock,
  Radio,
  Layers,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Play,
  Shield,
  Zap,
  Activity,
  Server,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import type {
  NetworkInfoResponse,
  PingResult,
  SpeedResult,
  DnsPerfResult,
  ReachabilityItem,
  NetworkAnalysis,
} from '@/lib/api-contracts'

// ─── Types ──────────────────────────────────────────────────────────────────

type CardPhase = 'idle' | 'loading' | 'done' | 'error'

interface CfTrace {
  http: string
  tls: string
  warp: string
  ip: string
  colo: string
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PING_SAMPLES = 10
const UPLOAD_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

// ─── Locale helpers ──────────────────────────────────────────────────────────

function t(dict: any, key: string): string {
  const keys = key.split('.')
  let val: any = dict
  for (const k of keys) {
    val = val?.[k]
    if (val === undefined) return key
  }
  return String(val)
}

// ─── AI Analysis engine ──────────────────────────────────────────────────────

function analyzeNetwork(
  info: NetworkInfoResponse | null,
  ping: PingResult | null,
  speed: SpeedResult | null,
  reachability: ReachabilityItem[],
  lang: string
): NetworkAnalysis {
  let score = 0

  // Latency (30 pts)
  if (ping) {
    if (ping.avg < 50) score += 30
    else if (ping.avg < 100) score += 24
    else if (ping.avg < 200) score += 16
    else if (ping.avg < 300) score += 8
  }

  // Download (25 pts)
  if (speed?.downloadMbps != null) {
    const dl = speed.downloadMbps
    if (dl > 100) score += 25
    else if (dl > 50) score += 20
    else if (dl > 20) score += 14
    else if (dl > 5) score += 8
    else score += 2
  }

  // Upload (15 pts)
  if (speed?.uploadMbps != null) {
    const ul = speed.uploadMbps
    if (ul > 50) score += 15
    else if (ul > 20) score += 12
    else if (ul > 5) score += 8
    else if (ul > 1) score += 4
    else score += 1
  }

  // Jitter (15 pts)
  if (ping) {
    if (ping.jitter < 5) score += 15
    else if (ping.jitter < 15) score += 10
    else if (ping.jitter < 30) score += 5
  }

  // IPv6 (10 pts)
  const hasIPv6 = info?.ipv6 != null
  if (hasIPv6) score += 10

  // Reachability (5 pts)
  if (reachability.length > 0) {
    const okCount = reachability.filter((r) => r.reachable).length
    const ratio = okCount / reachability.length
    if (ratio >= 1) score += 5
    else if (ratio >= 0.75) score += 3
    else if (ratio >= 0.5) score += 1
  }

  score = Math.min(100, Math.max(0, score))

  const grade: NetworkAnalysis['grade'] =
    score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F'

  const ipVersion: NetworkAnalysis['ipVersion'] =
    info?.ipv6 ? (info?.ip ? 'dual-stack' : 'ipv6-only') : 'ipv4-only'

  const isCN = lang === 'zh' || lang === 'tw'
  const isJA = lang === 'ja'

  const colo = info?.colo || '—'
  const avgMs = ping ? `${ping.avg.toFixed(0)} ms` : '—'
  const dlMbps = speed?.downloadMbps ? `${speed.downloadMbps.toFixed(1)} Mbps` : '—'

  // Summary
  const summaries: Record<string, string[]> = {
    zh: [
      `你的网络连接到 Cloudflare ${colo} 节点。`,
      ping ? `平均延迟 ${avgMs}，${ping.avg < 80 ? '延迟优秀，非常适合实时应用。' : ping.avg < 150 ? '延迟正常，适合日常使用。' : '延迟偏高，可能影响实时通信。'}` : '',
      speed?.downloadMbps ? `下载速度 ${dlMbps}。` : '',
      hasIPv6 ? '你的网络已启用 IPv6 双栈，支持新一代互联网服务。' : '你的网络尚未启用 IPv6。',
    ],
    en: [
      `Connected to Cloudflare ${colo} edge node.`,
      ping ? `Average latency ${avgMs} — ${ping.avg < 80 ? 'excellent for real-time applications.' : ping.avg < 150 ? 'good for everyday use.' : 'latency is elevated, may impact real-time communication.'}` : '',
      speed?.downloadMbps ? `Download speed: ${dlMbps}.` : '',
      hasIPv6 ? 'Your network supports IPv6 dual-stack.' : 'IPv6 is not yet enabled on your network.',
    ],
    ja: [
      `Cloudflare ${colo} エッジノードに接続中。`,
      ping ? `平均遅延 ${avgMs} — ${ping.avg < 80 ? 'リアルタイムアプリケーションに最適です。' : ping.avg < 150 ? '日常利用に適しています。' : '遅延がやや高く、リアルタイム通信に影響する可能性があります。'}` : '',
      speed?.downloadMbps ? `ダウンロード速度: ${dlMbps}。` : '',
      hasIPv6 ? 'IPv6 デュアルスタックに対応しています。' : 'IPv6 はまだ有効ではありません。',
    ],
  }

  const summary = (summaries[isCN ? 'zh' : isJA ? 'ja' : 'en'] || summaries.en)
    .filter(Boolean)
    .join(' ')

  // Suitable for
  const suitableMap = {
    zh: {
      videoConf: '视频会议',
      remoteWork: '远程办公',
      cloudOps: '云端运维',
      streaming4K: '4K 流媒体',
      gaming: '在线游戏',
      browsing: '日常浏览',
    },
    en: {
      videoConf: 'Video Conferencing',
      remoteWork: 'Remote Work',
      cloudOps: 'Cloud Operations',
      streaming4K: '4K Streaming',
      gaming: 'Online Gaming',
      browsing: 'Web Browsing',
    },
    ja: {
      videoConf: 'ビデオ会議',
      remoteWork: 'テレワーク',
      cloudOps: 'クラウド運用',
      streaming4K: '4K 動画視聴',
      gaming: 'オンラインゲーム',
      browsing: 'ウェブブラウジング',
    },
  }

  const sm = isCN ? suitableMap.zh : isJA ? suitableMap.ja : suitableMap.en
  const suitableFor: string[] = []
  if (ping && speed) {
    if (ping.avg < 100 && ping.jitter < 15 && (speed.downloadMbps ?? 0) > 5) suitableFor.push(sm.videoConf)
    if (score >= 60) suitableFor.push(sm.remoteWork)
    if (score >= 75 && hasIPv6) suitableFor.push(sm.cloudOps)
    if ((speed.downloadMbps ?? 0) > 25) suitableFor.push(sm.streaming4K)
    if (ping.avg < 80 && ping.jitter < 10) suitableFor.push(sm.gaming)
  }
  if (suitableFor.length === 0) suitableFor.push(sm.browsing)

  // Potential issues
  const issueMap = {
    zh: {
      highLatency: '延迟偏高（可能为物理距离或网络拥塞）',
      highJitter: '抖动较大（不稳定，影响实时通信）',
      slowDl: '下载速度较慢',
      slowUl: '上传速度较慢',
      noIPv6: '未启用 IPv6（可能影响部分服务）',
      lowReach: '部分网站不可达（可能存在网络限制）',
    },
    en: {
      highLatency: 'High latency (distance or congestion)',
      highJitter: 'High jitter (unstable connection)',
      slowDl: 'Slow download speed',
      slowUl: 'Slow upload speed',
      noIPv6: 'No IPv6 (may affect some modern services)',
      lowReach: 'Some sites unreachable (possible restrictions)',
    },
    ja: {
      highLatency: '遅延が高い（距離または輻輳の可能性）',
      highJitter: 'ジッターが大きい（接続が不安定）',
      slowDl: 'ダウンロード速度が遅い',
      slowUl: 'アップロード速度が遅い',
      noIPv6: 'IPv6 未対応（一部サービスに影響する可能性）',
      lowReach: '一部サイトへの接続不可（制限の可能性）',
    },
  }
  const im = isCN ? issueMap.zh : isJA ? issueMap.ja : issueMap.en
  const potentialIssues: string[] = []
  if (ping && ping.avg > 150) potentialIssues.push(im.highLatency)
  if (ping && ping.jitter > 20) potentialIssues.push(im.highJitter)
  if (speed?.downloadMbps != null && speed.downloadMbps < 10) potentialIssues.push(im.slowDl)
  if (speed?.uploadMbps != null && speed.uploadMbps < 5) potentialIssues.push(im.slowUl)
  if (!hasIPv6) potentialIssues.push(im.noIPv6)
  const unreachableCount = reachability.filter((r) => !r.reachable).length
  if (unreachableCount > 2) potentialIssues.push(im.lowReach)

  // Recommendations
  const recMap = {
    zh: {
      wifi5: '尽量使用 5GHz Wi-Fi，减少干扰',
      ipv6svc: '优先选择支持 IPv6 的服务',
      wiredConn: '改用有线连接以降低延迟和抖动',
      vpn: '考虑使用 Cloudflare WARP 加速跨区流量',
      reboot: '尝试重启路由器以改善网络质量',
      contactISP: '联系 ISP 升级宽带套餐',
    },
    en: {
      wifi5: 'Use 5GHz Wi-Fi to reduce interference',
      ipv6svc: 'Prefer IPv6-capable services when available',
      wiredConn: 'Switch to wired Ethernet for lower latency and jitter',
      vpn: 'Consider Cloudflare WARP to accelerate cross-region traffic',
      reboot: 'Try rebooting your router to improve network quality',
      contactISP: 'Contact your ISP to upgrade your bandwidth plan',
    },
    ja: {
      wifi5: '5GHz Wi-Fi を使用して干渉を減らす',
      ipv6svc: '可能な限り IPv6 対応サービスを優先',
      wiredConn: '有線 LAN に切り替えて遅延とジッターを改善',
      vpn: 'Cloudflare WARP でクロスリージョントラフィックを高速化',
      reboot: 'ルーターを再起動してネットワーク品質を改善',
      contactISP: 'ISP に帯域プランのアップグレードを相談',
    },
  }
  const rm = isCN ? recMap.zh : isJA ? recMap.ja : recMap.en
  const recommendations: string[] = [rm.wifi5]
  if (!hasIPv6) recommendations.push(rm.ipv6svc)
  if (ping && ping.jitter > 15) recommendations.push(rm.wiredConn)
  if (unreachableCount > 0) recommendations.push(rm.vpn)
  if (speed?.downloadMbps != null && speed.downloadMbps < 10) recommendations.push(rm.contactISP)
  if (recommendations.length < 2) recommendations.push(rm.reboot)

  return { score, grade, ipVersion, summary, suitableFor, potentialIssues, recommendations }
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  phase,
  children,
}: {
  title: string
  icon: React.ReactNode
  phase: CardPhase
  children?: React.ReactNode
}) {
  return (
    <div className="op-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
        <span className="text-[var(--accent-color)]">{icon}</span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] flex-1">{title}</h2>
        {phase === 'loading' && (
          <Loader2 className="w-4 h-4 text-[var(--accent-color)] animate-spin" />
        )}
        {phase === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
        {phase === 'error' && <AlertCircle className="w-4 h-4 text-amber-500" />}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function MetaRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span className={`text-xs font-semibold text-[var(--text-primary)] ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function StatBox({
  label,
  value,
  unit,
  quality,
}: {
  label: string
  value: string | null
  unit?: string
  quality?: 'good' | 'ok' | 'bad'
}) {
  const colors = {
    good: 'text-emerald-500',
    ok: 'text-amber-500',
    bad: 'text-red-500',
  }
  return (
    <div className="op-card-soft rounded-xl p-4 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)] mb-2">
        {label}
      </p>
      {value !== null ? (
        <p className={`text-2xl font-bold ${quality ? colors[quality] : 'text-[var(--text-primary)]'}`}>
          {value}
          {unit && <span className="text-xs ml-1 text-[var(--text-muted)]">{unit}</span>}
        </p>
      ) : (
        <div className="h-8 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-color)] animate-spin" />
        </div>
      )}
    </div>
  )
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 42
  const offset = circumference - (score / 100) * circumference
  const gradeColor =
    grade === 'A'
      ? '#10b981'
      : grade === 'B'
        ? '#34d399'
        : grade === 'C'
          ? '#f59e0b'
          : grade === 'D'
            ? '#f97316'
            : '#ef4444'

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border-subtle)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={gradeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-3xl font-black" style={{ color: gradeColor }}>
          {grade}
        </p>
        <p className="text-[10px] font-semibold text-[var(--text-muted)]">{score}/100</p>
      </div>
    </div>
  )
}

function PingChart({ samples }: { samples: number[] }) {
  if (samples.length === 0) return null
  const max = Math.max(...samples)
  return (
    <div className="flex items-end gap-1 h-10 mt-3">
      {samples.map((s, i) => {
        const h = Math.max(4, Math.round((s / max) * 40))
        const color = s < 100 ? 'bg-emerald-500' : s < 200 ? 'bg-amber-400' : 'bg-red-400'
        return (
          <div key={i} title={`${s}ms`} className={`flex-1 rounded-sm ${color}`} style={{ height: h }} />
        )
      })}
    </div>
  )
}

function StatusDot({ status }: { status: 'ok' | 'slow' | 'failed' }) {
  const map = {
    ok: 'bg-emerald-500',
    slow: 'bg-amber-400',
    failed: 'bg-red-400',
  }
  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]}`} />
}

function SpeedBar({ value, max = 200 }: { value: number | null; max?: number }) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden mt-2">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
        style={{ width: `${pct}%`, transition: 'width 0.8s ease-out' }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NetworkCheckClient({
  dict,
  lang,
}: {
  dict: any
  lang: 'zh' | 'en' | 'ja' | 'tw'
}) {
  const nc = dict.tools.network_check

  // State
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [currentStep, setCurrentStep] = useState('')

  const [netInfo, setNetInfo] = useState<NetworkInfoResponse | null>(null)
  const [netInfoPhase, setNetInfoPhase] = useState<CardPhase>('idle')

  const [pingResult, setPingResult] = useState<PingResult | null>(null)
  const [pingPhase, setPingPhase] = useState<CardPhase>('idle')

  const [speedResult, setSpeedResult] = useState<SpeedResult | null>(null)
  const [speedPhase, setSpeedPhase] = useState<CardPhase>('idle')
  const [selectedSizeMb, setSelectedSizeMb] = useState<1 | 10 | 50>(10)
  const [dlProgress, setDlProgress] = useState(0)
  const [ulProgress, setUlProgress] = useState(0)

  const [dnsPerfResult, setDnsPerfResult] = useState<DnsPerfResult | null>(null)
  const [dnsPerfPhase, setDnsPerfPhase] = useState<CardPhase>('idle')

  const [reachability, setReachability] = useState<ReachabilityItem[]>([])
  const [reachPhase, setReachPhase] = useState<CardPhase>('idle')

  const [cfTrace, setCfTrace] = useState<CfTrace | null>(null)
  const [tracePhase, setTracePhase] = useState<CardPhase>('idle')

  const [analysis, setAnalysis] = useState<NetworkAnalysis | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  // ── Helpers ────────────────────────────────────────────────────────────────

  const runPing = useCallback(async (): Promise<PingResult> => {
    const samples: number[] = []
    for (let i = 0; i < PING_SAMPLES; i++) {
      const t0 = performance.now()
      try {
        await fetch('/api/network/ping', { cache: 'no-store' })
      } catch {
        // ignore
      }
      samples.push(Math.round(performance.now() - t0))
      // Update state progressively
      setPingResult({
        samples: [...samples],
        min: Math.min(...samples),
        avg: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length),
        max: Math.max(...samples),
        jitter: Math.round(
          samples.slice(1).reduce((acc, s, i) => acc + Math.abs(s - samples[i]), 0) /
            Math.max(1, samples.length - 1)
        ),
      })
    }
    const min = Math.min(...samples)
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length)
    const max = Math.max(...samples)
    const jitter = Math.round(
      samples.slice(1).reduce((acc, s, i) => acc + Math.abs(s - samples[i]), 0) /
        Math.max(1, samples.length - 1)
    )
    return { min, avg, max, jitter, samples }
  }, [])

  const runDownload = useCallback(
    async (sizeMb: number): Promise<{ mbps: number; bytes: number; durationMs: number }> => {
      setDlProgress(0)
      const t0 = performance.now()
      const response = await fetch(`/api/network/download?size=${sizeMb}`, { cache: 'no-store' })
      const contentLength = parseInt(response.headers.get('content-length') ?? '0', 10)
      const reader = response.body!.getReader()
      let received = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        received += value?.byteLength ?? 0
        if (contentLength > 0) setDlProgress(Math.round((received / contentLength) * 100))
      }
      const durationMs = performance.now() - t0
      const mbps = (received * 8) / (durationMs / 1000) / 1_000_000
      setDlProgress(100)
      return { mbps, bytes: received, durationMs }
    },
    []
  )

  const runUpload = useCallback(async (): Promise<{ mbps: number; bytes: number; durationMs: number }> => {
    setUlProgress(0)
    const buf = new Uint8Array(UPLOAD_SIZE_BYTES)
    crypto.getRandomValues(buf)
    const blob = new Blob([buf])
    const t0 = performance.now()
    await fetch('/api/network/ping', {
      method: 'POST',
      body: blob,
      cache: 'no-store',
      headers: { 'Content-Type': 'application/octet-stream' },
    })
    const durationMs = performance.now() - t0
    const mbps = (UPLOAD_SIZE_BYTES * 8) / (durationMs / 1000) / 1_000_000
    setUlProgress(100)
    return { mbps, bytes: UPLOAD_SIZE_BYTES, durationMs }
  }, [])

  const getDnsPerf = useCallback((): DnsPerfResult => {
    try {
      const entries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
      const nav = entries[0]
      if (!nav) return { dnsMs: null, tcpMs: null, tlsMs: null, ttfbMs: null }
      const dnsMs = Math.round(nav.domainLookupEnd - nav.domainLookupStart)
      const tcpMs = Math.round(nav.connectEnd - nav.connectStart)
      const tlsMs =
        nav.secureConnectionStart > 0
          ? Math.round(nav.connectEnd - nav.secureConnectionStart)
          : null
      const ttfbMs = Math.round(nav.responseStart - nav.requestStart)
      return { dnsMs, tcpMs, tlsMs, ttfbMs }
    } catch {
      return { dnsMs: null, tcpMs: null, tlsMs: null, ttfbMs: null }
    }
  }, [])

  // ── Main flow ──────────────────────────────────────────────────────────────

  const startCheck = useCallback(async () => {
    abortRef.current = new AbortController()
    setPhase('running')
    setNetInfo(null)
    setNetInfoPhase('idle')
    setPingResult(null)
    setPingPhase('idle')
    setSpeedResult(null)
    setSpeedPhase('idle')
    setDlProgress(0)
    setUlProgress(0)
    setDnsPerfResult(null)
    setDnsPerfPhase('idle')
    setReachability([])
    setReachPhase('idle')
    setCfTrace(null)
    setTracePhase('idle')
    setAnalysis(null)

    let finalNetInfo: NetworkInfoResponse | null = null
    let finalPing: PingResult | null = null
    let finalSpeed: SpeedResult | null = null
    let finalReach: ReachabilityItem[] = []

    // Step 1 — Network info
    setCurrentStep(nc.info_title)
    setNetInfoPhase('loading')
    try {
      const res = await fetch('/api/network/info', { cache: 'no-store' })
      finalNetInfo = await res.json()
      setNetInfo(finalNetInfo)
      setNetInfoPhase('done')
    } catch {
      setNetInfoPhase('error')
    }

    // Step 2 — DNS perf (from page load timing)
    setDnsPerfPhase('loading')
    const dnsPerf = getDnsPerf()
    setDnsPerfResult(dnsPerf)
    setDnsPerfPhase(dnsPerf.dnsMs !== null ? 'done' : 'error')

    // Step 3 — Ping
    setCurrentStep(nc.ping_title)
    setPingPhase('loading')
    try {
      finalPing = await runPing()
      setPingResult(finalPing)
      setPingPhase('done')
    } catch {
      setPingPhase('error')
    }

    // Step 4 — Download + Upload
    setCurrentStep(nc.speed_title)
    setSpeedPhase('loading')
    let dlMbps: number | null = null
    let ulMbps: number | null = null
    let dlBytes = 0
    let dlDuration = 0
    let ulBytes = 0
    let ulDuration = 0

    try {
      const dl = await runDownload(selectedSizeMb)
      dlMbps = parseFloat(dl.mbps.toFixed(2))
      dlBytes = dl.bytes
      dlDuration = dl.durationMs
    } catch {
      // ignore
    }

    try {
      const ul = await runUpload()
      ulMbps = parseFloat(ul.mbps.toFixed(2))
      ulBytes = ul.bytes
      ulDuration = ul.durationMs
    } catch {
      // ignore
    }

    finalSpeed = {
      downloadMbps: dlMbps,
      uploadMbps: ulMbps,
      downloadDurationMs: dlDuration,
      uploadDurationMs: ulDuration,
      downloadBytes: dlBytes,
      uploadBytes: ulBytes,
    }
    setSpeedResult(finalSpeed)
    setSpeedPhase(dlMbps !== null || ulMbps !== null ? 'done' : 'error')

    // Step 5 — Reachability
    setCurrentStep(nc.reach_title)
    setReachPhase('loading')
    try {
      const res = await fetch('/api/network/reachability', { cache: 'no-store' })
      const data = await res.json()
      finalReach = data.results ?? []
      setReachability(finalReach)
      setReachPhase('done')
    } catch {
      setReachPhase('error')
    }

    // Step 6 — CF Trace
    setCurrentStep(nc.trace_title)
    setTracePhase('loading')
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
      ) as CfTrace
      setCfTrace(parsed)
      setTracePhase('done')
    } catch {
      setTracePhase('error')
    }

    // Step 7 — Analysis
    setCurrentStep(nc.ai_title)
    const result = analyzeNetwork(finalNetInfo, finalPing, finalSpeed, finalReach, lang)
    setAnalysis(result)

    setCurrentStep('')
    setPhase('done')
  }, [nc, selectedSizeMb, lang, runPing, runDownload, runUpload, getDnsPerf])

  // ── Metric quality helpers ─────────────────────────────────────────────────

  const latencyQuality = (ms: number): 'good' | 'ok' | 'bad' =>
    ms < 80 ? 'good' : ms < 200 ? 'ok' : 'bad'

  const speedQuality = (mbps: number): 'good' | 'ok' | 'bad' =>
    mbps > 50 ? 'good' : mbps > 10 ? 'ok' : 'bad'

  const jitterQuality = (ms: number): 'good' | 'ok' | 'bad' =>
    ms < 10 ? 'good' : ms < 25 ? 'ok' : 'bad'

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="ui-shell">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebApplication',
            name: nc.title,
            url: 'https://opskitpro.com/tools/network-check',
            applicationCategory: 'UtilitiesApplication',
            offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
            description: dict.tools.network_check_desc,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: lang === 'zh' ? '如何检测我的网络速度？' : 'How do I test my network speed?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    lang === 'zh'
                      ? '点击"开始检测"按钮，OpsKitPro 将自动测试你的下载速度、上传速度、延迟和 IPv6 支持。无需安装任何软件。'
                      : 'Click "Start Check" and OpsKitPro will automatically test your download speed, upload speed, latency and IPv6 support. No software installation required.',
                },
              },
              {
                '@type': 'Question',
                name: lang === 'zh' ? '什么是 IPv6？我的网络支持吗？' : 'What is IPv6 and does my network support it?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    lang === 'zh'
                      ? 'IPv6 是新一代互联网地址协议，提供更多地址空间。OpsKitPro 会自动检测你的网络是否支持 IPv6。'
                      : 'IPv6 is the next-generation internet addressing protocol. OpsKitPro automatically detects whether your network supports IPv6.',
                },
              },
              {
                '@type': 'Question',
                name: lang === 'zh' ? '延迟多少毫秒算正常？' : 'What is a normal ping latency?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    lang === 'zh'
                      ? '一般来说，低于 50ms 为优秀，50-100ms 为良好，100-200ms 为一般，超过 200ms 会影响实时应用使用体验。'
                      : 'Generally, under 50ms is excellent, 50-100ms is good, 100-200ms is average, and above 200ms may impact real-time applications.',
                },
              },
              {
                '@type': 'Question',
                name: lang === 'zh' ? '什么是 Jitter（抖动）？' : 'What is network jitter?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text:
                    lang === 'zh'
                      ? '抖动是延迟的波动幅度，数值越小代表连接越稳定。低于 10ms 对视频会议非常有利。'
                      : 'Jitter measures the variation in latency. Lower jitter means a more stable connection. Under 10ms is great for video calls.',
                },
              },
            ],
          }),
        }}
      />

      <div className="glow" aria-hidden />

      <section className="mx-auto w-full max-w-3xl px-4 pt-12 pb-6 sm:px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 ui-chip mb-5">
          <Radio className="w-3.5 h-3.5" />
          <span>{nc.badge}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)] mb-3">
          {nc.title}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-8">
          {nc.subtitle}
        </p>

        {/* Size selector (visible before run) */}
        {phase === 'idle' && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xs text-[var(--text-muted)]">{nc.speed_select}:</span>
            {([1, 10, 50] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSizeMb(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  selectedSizeMb === s
                    ? 'border-[var(--accent-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]'
                    : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-color)]/50'
                }`}
              >
                {s} MB
              </button>
            ))}
          </div>
        )}

        {/* CTA */}
        {phase === 'idle' && (
          <button
            id="start-network-check"
            onClick={startCheck}
            className="ui-button-primary gap-3 px-8 py-4 text-base rounded-2xl shadow-lg hover:-translate-y-1 transition-transform"
          >
            <Play className="w-5 h-5" />
            {nc.start}
          </button>
        )}

        {phase === 'running' && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                {nc.checking}
                {currentStep ? ` — ${currentStep}` : ''}
              </span>
            </div>
            {/* overall progress bar */}
            <div className="w-40 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--accent-color)] animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {phase === 'done' && (
          <button
            id="recheck-network"
            onClick={startCheck}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-[var(--border-strong)] text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-color)]/40 hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {nc.recheck}
          </button>
        )}
      </section>

      {/* Cards grid */}
      {(phase === 'running' || phase === 'done') && (
        <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-16 grid gap-4">
          {/* 1. Network Info */}
          <SectionCard title={nc.info_title} icon={<Globe className="w-4 h-4" />} phase={netInfoPhase}>
            {netInfo ? (
              <div className="grid sm:grid-cols-2 gap-x-8">
                <div>
                  <MetaRow label={nc.info_ip} value={netInfo.ip} mono />
                  {netInfo.ipv6 && <MetaRow label={nc.info_ipv6} value={netInfo.ipv6} mono />}
                  <MetaRow label={nc.info_asn} value={netInfo.asn ? `AS${netInfo.asn}` : '—'} mono />
                  <MetaRow label={nc.info_org} value={netInfo.org} />
                  <MetaRow label={nc.info_country} value={netInfo.country} />
                </div>
                <div>
                  <MetaRow label={nc.info_city} value={netInfo.city} />
                  <MetaRow label={nc.info_colo} value={netInfo.colo} mono />
                  <MetaRow label={nc.info_timezone} value={netInfo.timezone} />
                  <MetaRow label={nc.info_ua} value={netInfo.ua.split('/')[0] ?? netInfo.ua} />
                </div>
              </div>
            ) : (
              netInfoPhase === 'loading' && (
                <div className="h-24 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[var(--accent-color)] animate-spin" />
                </div>
              )
            )}
          </SectionCard>

          {/* 2. IPv6 Status */}
          <SectionCard title={nc.ipv6_title} icon={<Layers className="w-4 h-4" />} phase={netInfoPhase}>
            {netInfo ? (
              <div className="flex items-start gap-4">
                <div
                  className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-2xl ${
                    netInfo.ipv6 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {netInfo.ipv6 ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] mb-1">
                    {netInfo.ipv6 ? nc.ipv6_dual : nc.ipv6_ipv4only}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {netInfo.ipv6 ? nc.ipv6_dual_desc : nc.ipv6_ipv4only_desc}
                  </p>
                </div>
              </div>
            ) : (
              netInfoPhase === 'loading' && (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                </div>
              )
            )}
          </SectionCard>

          {/* 3. Latency */}
          <SectionCard title={nc.ping_title} icon={<Activity className="w-4 h-4" />} phase={pingPhase}>
            {pingResult ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox
                    label={nc.ping_min}
                    value={`${pingResult.min}`}
                    unit="ms"
                    quality={latencyQuality(pingResult.min)}
                  />
                  <StatBox
                    label={nc.ping_avg}
                    value={`${pingResult.avg}`}
                    unit="ms"
                    quality={latencyQuality(pingResult.avg)}
                  />
                  <StatBox
                    label={nc.ping_max}
                    value={`${pingResult.max}`}
                    unit="ms"
                    quality={latencyQuality(pingResult.max)}
                  />
                  <StatBox
                    label={nc.ping_jitter}
                    value={`${pingResult.jitter}`}
                    unit="ms"
                    quality={jitterQuality(pingResult.jitter)}
                  />
                </div>
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--text-faint)] mb-1">
                    {nc.ping_samples} ({pingResult.samples.length})
                  </p>
                  <PingChart samples={pingResult.samples} />
                </div>
              </>
            ) : (
              pingPhase === 'loading' && (
                <div className="h-24 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[var(--accent-color)] animate-spin" />
                </div>
              )
            )}
          </SectionCard>

          {/* 4. Speed */}
          <SectionCard title={nc.speed_title} icon={<Gauge className="w-4 h-4" />} phase={speedPhase}>
            <div className="space-y-5">
              {/* Download */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{nc.speed_download}</span>
                  </div>
                  {speedResult?.downloadMbps != null ? (
                    <span className={`text-lg font-black ${speedQuality(speedResult.downloadMbps) === 'good' ? 'text-emerald-500' : speedQuality(speedResult.downloadMbps) === 'ok' ? 'text-amber-500' : 'text-red-400'}`}>
                      {speedResult.downloadMbps.toFixed(1)}
                      <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">Mbps</span>
                    </span>
                  ) : speedPhase === 'loading' ? (
                    <span className="text-xs text-[var(--text-muted)] animate-pulse">{nc.speed_testing_dl}</span>
                  ) : null}
                </div>
                <SpeedBar value={speedResult?.downloadMbps ?? null} max={200} />
                {speedPhase === 'loading' && dlProgress > 0 && dlProgress < 100 && (
                  <p className="text-[10px] text-right mt-1 text-[var(--text-faint)]">{dlProgress}%</p>
                )}
              </div>

              {/* Upload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-500" />
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">{nc.speed_upload}</span>
                  </div>
                  {speedResult?.uploadMbps != null ? (
                    <span className={`text-lg font-black ${speedQuality(speedResult.uploadMbps) === 'good' ? 'text-emerald-500' : speedQuality(speedResult.uploadMbps) === 'ok' ? 'text-amber-500' : 'text-red-400'}`}>
                      {speedResult.uploadMbps.toFixed(1)}
                      <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">Mbps</span>
                    </span>
                  ) : speedPhase === 'loading' && dlProgress === 100 ? (
                    <span className="text-xs text-[var(--text-muted)] animate-pulse">{nc.speed_testing_ul}</span>
                  ) : null}
                </div>
                <SpeedBar value={speedResult?.uploadMbps ?? null} max={100} />
              </div>
            </div>
          </SectionCard>

          {/* 5. DNS / TLS Perf */}
          <SectionCard title={nc.dns_perf_title} icon={<Clock className="w-4 h-4" />} phase={dnsPerfPhase}>
            {dnsPerfResult ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox
                    label={nc.dns_perf_dns}
                    value={dnsPerfResult.dnsMs != null ? `${dnsPerfResult.dnsMs}` : null}
                    unit="ms"
                    quality={dnsPerfResult.dnsMs != null ? latencyQuality(dnsPerfResult.dnsMs) : undefined}
                  />
                  <StatBox
                    label={nc.dns_perf_tcp}
                    value={dnsPerfResult.tcpMs != null ? `${dnsPerfResult.tcpMs}` : null}
                    unit="ms"
                    quality={dnsPerfResult.tcpMs != null ? latencyQuality(dnsPerfResult.tcpMs) : undefined}
                  />
                  <StatBox
                    label={nc.dns_perf_tls}
                    value={dnsPerfResult.tlsMs != null ? `${dnsPerfResult.tlsMs}` : null}
                    unit="ms"
                    quality={dnsPerfResult.tlsMs != null ? latencyQuality(dnsPerfResult.tlsMs) : undefined}
                  />
                  <StatBox
                    label={nc.dns_perf_ttfb}
                    value={dnsPerfResult.ttfbMs != null ? `${dnsPerfResult.ttfbMs}` : null}
                    unit="ms"
                    quality={dnsPerfResult.ttfbMs != null ? latencyQuality(dnsPerfResult.ttfbMs) : undefined}
                  />
                </div>
                <p className="mt-3 text-[10px] text-[var(--text-faint)]">{nc.dns_perf_note}</p>
              </>
            ) : (
              dnsPerfPhase === 'loading' && (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                </div>
              )
            )}
          </SectionCard>

          {/* 6. Reachability */}
          <SectionCard title={nc.reach_title} icon={<Globe className="w-4 h-4" />} phase={reachPhase}>
            {reachability.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-x-6">
                {reachability.map((item) => (
                  <div
                    key={item.url}
                    className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={item.status} />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.latencyMs != null && (
                        <span className="text-xs text-[var(--text-muted)]">{item.latencyMs}ms</span>
                      )}
                      <span
                        className={`text-[10px] font-semibold uppercase tracking-wider ${
                          item.status === 'ok'
                            ? 'text-emerald-500'
                            : item.status === 'slow'
                              ? 'text-amber-500'
                              : 'text-red-400'
                        }`}
                      >
                        {item.status === 'ok' ? nc.reach_ok : item.status === 'slow' ? nc.reach_slow : nc.reach_failed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              reachPhase === 'loading' && (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[var(--accent-color)] animate-spin" />
                </div>
              )
            )}
          </SectionCard>

          {/* 7. Cloudflare Trace */}
          <SectionCard title={nc.trace_title} icon={<Server className="w-4 h-4" />} phase={tracePhase}>
            {cfTrace ? (
              <div className="grid sm:grid-cols-2 gap-x-8">
                <MetaRow label={nc.info_ip} value={cfTrace.ip} mono />
                <MetaRow label={nc.trace_colo} value={cfTrace.colo} mono />
                <MetaRow label={nc.trace_http} value={cfTrace.http} mono />
                <MetaRow label={nc.trace_tls} value={cfTrace.tls} mono />
                <MetaRow
                  label={nc.trace_warp}
                  value={cfTrace.warp === 'on' ? nc.trace_warp_on : nc.trace_warp_off}
                />
              </div>
            ) : (
              tracePhase === 'loading' && (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-[var(--accent-color)] animate-spin" />
                </div>
              )
            )}
          </SectionCard>

          {/* 8. AI Analysis */}
          <div className="op-card rounded-2xl overflow-hidden border-[var(--accent-color)]/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--accent-soft)]">
              <Zap className="w-4 h-4 text-[var(--accent-color)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex-1">{nc.ai_title}</h2>
              {!analysis && phase === 'running' && (
                <Loader2 className="w-4 h-4 text-[var(--accent-color)] animate-spin" />
              )}
              {analysis && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            </div>

            <div className="p-5">
              {analysis ? (
                <div className="space-y-6">
                  {/* Score + Summary */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <ScoreRing score={analysis.score} grade={analysis.grade} />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {nc.ai_score}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-center sm:text-left">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Grid: suitable / issues / recs */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Suitable for */}
                    <div className="op-card-soft rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--accent-color)] mb-3">
                        {nc.ai_suitable}
                      </p>
                      <ul className="space-y-1.5">
                        {analysis.suitableFor.map((s) => (
                          <li key={s} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Potential issues */}
                    <div className="op-card-soft rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-500 mb-3">
                        {nc.ai_issues}
                      </p>
                      {analysis.potentialIssues.length > 0 ? (
                        <ul className="space-y-1.5">
                          {analysis.potentialIssues.map((s) => (
                            <li key={s} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-emerald-500">✓ 未发现明显问题</p>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div className="op-card-soft rounded-xl p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-500 mb-3">
                        {nc.ai_recs}
                      </p>
                      <ul className="space-y-1.5">
                        {analysis.recommendations.map((s) => (
                          <li key={s} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                            <ChevronRight className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  {phase === 'running' ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 text-[var(--accent-color)] animate-spin" />
                      <span>{nc.checking}...</span>
                    </div>
                  ) : (
                    <span>{nc.no_data}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Landing placeholder when idle */}
      {phase === 'idle' && (
        <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: <Wifi className="w-5 h-5" />, label: lang === 'zh' ? '下载 / 上传速度' : 'Download / Upload', desc: lang === 'zh' ? '实时速度测量' : 'Real-time speed measurement' },
              { icon: <Activity className="w-5 h-5" />, label: lang === 'zh' ? '延迟 & 抖动' : 'Latency & Jitter', desc: lang === 'zh' ? '10次采样精准测量' : '10-sample precision ping' },
              { icon: <Shield className="w-5 h-5" />, label: lang === 'zh' ? 'IPv6 & 安全' : 'IPv6 & Security', desc: lang === 'zh' ? '网络配置全面检测' : 'Full network configuration audit' },
              { icon: <Globe className="w-5 h-5" />, label: lang === 'zh' ? '可达性检测' : 'Reachability', desc: lang === 'zh' ? '8个全球站点探测' : '8 global site probes' },
              { icon: <BarChart3 className="w-5 h-5" />, label: lang === 'zh' ? 'DNS / TLS 性能' : 'DNS / TLS Perf', desc: lang === 'zh' ? 'Performance API 数据' : 'Performance API data' },
              { icon: <Zap className="w-5 h-5" />, label: lang === 'zh' ? 'AI 诊断报告' : 'AI Diagnosis', desc: lang === 'zh' ? '评分 + 优化建议' : 'Score + recommendations' },
            ].map((item) => (
              <div key={item.label} className="glass-card rounded-2xl p-5 flex gap-4">
                <div className="op-icon-box w-10 h-10 shrink-0">{item.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">{item.label}</p>
                  <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
