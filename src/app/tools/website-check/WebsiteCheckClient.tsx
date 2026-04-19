'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Globe, 
  Zap, 
  Activity, 
  AlertCircle,
  ShieldCheck,
  Server,
  Cloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  Info,
  ExternalLink,
  ShieldAlert,
  Search,
  Copy,
  Check,
  Cpu,
  Monitor,
  Lock,
  Calendar,
  Database,
  HelpCircle,
  LayoutGrid
} from 'lucide-react'

const normalizeTargetInput = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return ''

  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    const parsed = new URL(withScheme)
    return parsed.hostname.replace(/\.$/, '')
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, '')
      .replace(/\/.*$/, '')
      .replace(/\.$/, '')
      .trim()
  }
}

export default function WebsiteCheckClient({ dict, lang }: { dict: any; lang: 'zh' | 'en' | 'ja' | 'tw' }) {
  const isAsianLanguage = lang !== 'en'
  const searchParams = useSearchParams()
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showGradeInfo, setShowGradeInfo] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [localResolvers, setLocalResolvers] = useState<Record<string, any>>({})

  const localeText = useMemo(() => {
    switch (lang) {
      case 'ja':
        return {
          heroBadge: 'サイト診断',
          heroTitles: {
            visitor: '接続環境の確認',
            ip: 'IP 診断',
            site: 'サイト診断',
          },
          heroSubtitle: 'DNS・SSL・CDN・HTTP をまとめて診断します。',
          heroModeLabel: 'SRE 向け統合診断',
          analyzing: '診断中',
          errorTitle: '診断エラー',
          loading: {
            title: '診断フロー',
            headline: '進行中',
            desc: '対象を整理し、DNS・HTTP・SSL・CDN を並行で確認しています。',
            progress: '進行状況',
            current: '現在の工程',
            stages: [
              { id: 'normalize', title: '01 対象を整理', desc: 'ドメインや URL を正規化しています。' },
              { id: 'probe', title: '02 並行診断', desc: 'DNS・HTTP・SSL・CDN を同時に確認しています。' },
              { id: 'summarize', title: '03 結果を整形', desc: '要点をまとめ、見やすく表示します。' },
            ],
          },
          summaryScore: '総合スコア',
          summaryVerdict: '判定',
          detailsHint: '詳細は必要なときだけ展開できます',
          detailsOpen: '詳細を表示',
          detailsClose: '詳細を閉じる',
          geo: {
            step: '00',
            title: '地理確認',
            country: '国・地域',
            city: '都市・ノード',
            asn: 'AS 番号',
            isp: '回線事業者',
          },
          whois: {
            step: '01',
            title: 'WHOIS / 登録情報',
            diagException: '診断例外',
            noInfo: '情報なし',
            registrar: 'Registrar',
            registered: '登録日',
            allocated: '割り当て日',
            networkClass: '回線区分',
            expiry: '有効期限',
            status: '登録状態',
            privateIp: 'プライベート IPv4',
            publicIp: 'パブリック IPv4',
            assetTitle: '資産確認',
            assetCountSuffix: '件',
          },
          dns: {
            step: '02',
            title: 'DNS 解決',
            resolved: '解決済み IP',
            latency: '応答時間',
            nameservers: 'ネームサーバー',
            unknown: '不明',
            restricted: '制限あり',
          },
          http: {
            step: '03',
            title: 'HTTP 応答',
            availability: '到達性',
            status: 'ステータス',
            protocol: 'プロトコル',
            responseTime: '応答速度',
            success: '正常',
            failure: '到達不可',
          },
          ssl: {
            step: '04',
            title: 'SSL セキュリティ',
            certStatus: '証明書状態',
            expiry: '有効期限',
            grade: 'SSL セキュリティ評価',
            grading: '評価基準',
            hsts: 'HSTS 有効化',
            cipher: '暗号スイート',
            chain: '証明書チェーン',
            chainUnavailable: 'チェーン情報なし',
          },
          cdn: {
            step: '05',
            title: 'CDN',
            provider: '提供元インフラ',
            edge: 'エッジ経由',
            header: 'サーバーヘッダー',
            proxied: '経由あり',
            direct: '直接',
          },
          advice: {
            title: '確認ポイント',
            subtitle: '今見るべき項目を、優先度順に整理しています。',
            itemLabel: '要対応項目',
            noneTitle: '問題のない構成です',
            noneDesc: '今すぐ対応が必要な項目はありません。',
            nextTitle: '次の確認候補',
            ip: 'IP を詳しく見る',
            dns: 'DNS レコードを確認',
            json: '生の診断 JSON',
          },
          copy: {
            copied: 'コピー完了',
            copy: 'コピー',
          },
          emptyHint: 'Global Edge Probe • DNS 診断 • SSL 連鎖 • HTTP ヘッダー確認',
        }
      case 'zh':
        return {
          heroBadge: '网站诊断',
          heroTitles: {
            visitor: '连接环境检查',
            ip: 'IP 诊断',
            site: '网站诊断',
          },
          heroSubtitle: '将 DNS · SSL · CDN · HTTP 一次看清。',
          heroModeLabel: '面向 SRE 的统一诊断',
          analyzing: '诊断中',
          errorTitle: '诊断错误',
          loading: {
            title: '诊断流程',
            headline: '进行中',
            desc: '正在整理目标，并行检查 DNS、HTTP、SSL 与 CDN。',
            progress: '进度',
            current: '当前阶段',
            stages: [
              { id: 'normalize', title: '01 整理目标', desc: '正在规范域名或 URL。' },
              { id: 'probe', title: '02 并行诊断', desc: 'DNS、HTTP、SSL、CDN 同时检查。' },
              { id: 'summarize', title: '03 汇总结果', desc: '提炼要点并整理成可读视图。' },
            ],
          },
          summaryScore: '总体评分',
          summaryVerdict: '判定',
          detailsHint: '仅在需要时展开详情',
          detailsOpen: '显示详情',
          detailsClose: '收起详情',
          geo: {
            step: '00',
            title: '地理确认',
            country: '国家 / 地区',
            city: '城市 / 节点',
            asn: 'AS 编号',
            isp: '运营商',
          },
          whois: {
            step: '01',
            title: 'WHOIS / 注册信息',
            diagException: '诊断异常',
            noInfo: '无信息',
            registrar: '注册商',
            registered: '注册日期',
            allocated: '分配日期',
            networkClass: '线路类型',
            expiry: '有效期限',
            status: '注册状态',
            privateIp: '私有 IPv4',
            publicIp: '公有 IPv4',
            assetTitle: '资产清单',
            assetCountSuffix: '项',
          },
          dns: {
            step: '02',
            title: 'DNS 解析',
            resolved: '已解析 IP',
            latency: '响应时间',
            nameservers: '名称服务器',
            unknown: '未知',
            restricted: '受限',
          },
          http: {
            step: '03',
            title: 'HTTP 响应',
            availability: '可达性',
            status: '状态码',
            protocol: '协议',
            responseTime: '响应速度',
            success: '正常',
            failure: '不可达',
          },
          ssl: {
            step: '04',
            title: 'SSL 安全',
            certStatus: '证书状态',
            expiry: '有效期限',
            grade: 'SSL 安全评级',
            grading: '评级标准',
            hsts: 'HSTS 启用',
            cipher: '加密套件',
            chain: '证书链',
            chainUnavailable: '无链信息',
          },
          cdn: {
            step: '05',
            title: 'CDN',
            provider: '提供商基础设施',
            edge: '边缘转发',
            header: '服务器头',
            proxied: '经由',
            direct: '直连',
          },
          advice: {
            title: '确认重点',
            subtitle: '按优先级整理当前最值得关注的项目。',
            itemLabel: '待处理项',
            noneTitle: '当前配置没有明显问题',
            noneDesc: '暂无需要立即处理的项目。',
            nextTitle: '下一步检查',
            ip: '查看 IP 详情',
            dns: '查看 DNS 记录',
            json: '原始诊断 JSON',
          },
          copy: {
            copied: '已复制',
            copy: '复制',
          },
          emptyHint: 'Global Edge Probe • DNS 诊断 • SSL 链路 • HTTP 头部分析',
        }
      case 'tw':
        return {
          heroBadge: '網站診斷',
          heroTitles: {
            visitor: '連線環境檢查',
            ip: 'IP 診斷',
            site: '網站診斷',
          },
          heroSubtitle: '將 DNS · SSL · CDN · HTTP 一次看清。',
          heroModeLabel: '面向 SRE 的統一診斷',
          analyzing: '診斷中',
          errorTitle: '診斷錯誤',
          loading: {
            title: '診斷流程',
            headline: '進行中',
            desc: '正在整理目標，並行檢查 DNS、HTTP、SSL 與 CDN。',
            progress: '進度',
            current: '目前階段',
            stages: [
              { id: 'normalize', title: '01 整理目標', desc: '正在正規化網域或 URL。' },
              { id: 'probe', title: '02 並行診斷', desc: 'DNS、HTTP、SSL、CDN 同時檢查。' },
              { id: 'summarize', title: '03 彙整結果', desc: '提煉重點並整理成可讀視圖。' },
            ],
          },
          summaryScore: '總體評分',
          summaryVerdict: '判定',
          detailsHint: '僅在需要時展開詳情',
          detailsOpen: '顯示詳情',
          detailsClose: '收起詳情',
          geo: {
            step: '00',
            title: '地理確認',
            country: '國家 / 地區',
            city: '城市 / 節點',
            asn: 'AS 編號',
            isp: '電信商',
          },
          whois: {
            step: '01',
            title: 'WHOIS / 註冊資訊',
            diagException: '診斷異常',
            noInfo: '無資訊',
            registrar: '註冊商',
            registered: '註冊日期',
            allocated: '分配日期',
            networkClass: '線路類型',
            expiry: '有效期限',
            status: '註冊狀態',
            privateIp: '私有 IPv4',
            publicIp: '公有 IPv4',
            assetTitle: '資產清單',
            assetCountSuffix: '項',
          },
          dns: {
            step: '02',
            title: 'DNS 解析',
            resolved: '已解析 IP',
            latency: '回應時間',
            nameservers: '名稱伺服器',
            unknown: '未知',
            restricted: '受限',
          },
          http: {
            step: '03',
            title: 'HTTP 回應',
            availability: '可達性',
            status: '狀態碼',
            protocol: '協定',
            responseTime: '回應速度',
            success: '正常',
            failure: '無法連線',
          },
          ssl: {
            step: '04',
            title: 'SSL 安全',
            certStatus: '憑證狀態',
            expiry: '有效期限',
            grade: 'SSL 安全評級',
            grading: '評級標準',
            hsts: 'HSTS 啟用',
            cipher: '加密套件',
            chain: '憑證鏈',
            chainUnavailable: '無鏈資訊',
          },
          cdn: {
            step: '05',
            title: 'CDN',
            provider: '提供商基礎設施',
            edge: '邊緣轉發',
            header: '伺服器標頭',
            proxied: '經由',
            direct: '直連',
          },
          advice: {
            title: '確認重點',
            subtitle: '按優先級整理目前最值得關注的項目。',
            itemLabel: '待處理項',
            noneTitle: '目前設定沒有明顯問題',
            noneDesc: '暫無需要立即處理的項目。',
            nextTitle: '下一步檢查',
            ip: '查看 IP 詳情',
            dns: '查看 DNS 記錄',
            json: '原始診斷 JSON',
          },
          copy: {
            copied: '已複製',
            copy: '複製',
          },
          emptyHint: 'Global Edge Probe • DNS 診斷 • SSL 鏈路 • HTTP 標頭分析',
        }
      default:
        return {
          heroBadge: 'SRE Diagnostic Suite',
          heroTitles: {
            visitor: 'Connection Check',
            ip: 'IP Diagnostics',
            site: 'Site Diagnostics',
          },
          heroSubtitle: 'Instant DNS · SSL · CDN · HTTP forensics.',
          heroModeLabel: 'Unified Diagnostics for SREs',
          analyzing: 'ANALYZING',
          errorTitle: 'SYSTEM_FAULT_DETECTED',
          loading: {
            title: 'Diagnostic Flow',
            headline: 'In Progress',
            desc: 'Normalizing the target and probing in parallel.',
            progress: 'Progress',
            current: 'Current Stage',
            stages: [
              { id: 'normalize', title: '01 Normalizing Target', desc: 'Cleaning the input and resolving the host.' },
              { id: 'probe', title: '02 Parallel Probes', desc: 'DNS, HTTP, SSL, and CDN checks run in parallel.' },
              { id: 'summarize', title: '03 Result Assembly', desc: 'We build a concise audit summary.' },
            ],
          },
          summaryScore: 'Overall Score',
          summaryVerdict: 'Verdict',
          detailsHint: 'Expand details when needed',
          detailsOpen: 'Show Details',
          detailsClose: 'Hide Details',
          geo: {
            step: '00',
            title: 'Environment',
            country: 'Country/Region',
            city: 'City/Node',
            asn: 'AS Number',
            isp: 'ISP Service',
          },
          whois: {
            step: '01',
            title: 'WHOIS Registry',
            diagException: 'Diagnostic Exception',
            noInfo: 'NO_INFO',
            registrar: 'Registrar',
            registered: 'Registered On',
            allocated: 'Allocation date',
            networkClass: 'Network Class',
            expiry: 'Expires On',
            status: 'Registry Status',
            privateIp: 'PRIVATE_IPv4',
            publicIp: 'PUBLIC_IPv4',
            assetTitle: 'Digital Asset Census',
            assetCountSuffix: 'FOUND',
          },
          dns: {
            step: '02',
            title: 'DNS Resolution',
            resolved: 'Resolved IP(s)',
            latency: 'Lookup Latency',
            nameservers: 'Nameservers',
            unknown: 'Unknown',
            restricted: 'CORS_RESTRICTED',
          },
          http: {
            step: '03',
            title: 'Server Response',
            availability: 'Availability',
            status: 'Response Code',
            protocol: 'Protocol',
            responseTime: 'Response Time',
            success: 'NOMINAL',
            failure: 'UNREACHABLE',
          },
          ssl: {
            step: '04',
            title: 'SSL Security',
            certStatus: 'Cert Status',
            expiry: 'Expiry Date',
            grade: 'SSL Security Grade',
            grading: 'Grading Algorithm:',
            hsts: 'HSTS Enforcement',
            cipher: 'Cipher Support',
            chain: 'Trust Chain Audit',
            chainUnavailable: 'Chain_Data_Unavailable',
          },
          cdn: {
            step: '05',
            title: 'Edge CDN',
            provider: 'Provider Infrastructure',
            edge: 'Edge Routing',
            header: 'Server Header',
            proxied: 'PROXIED',
            direct: 'DIRECT',
          },
          advice: {
            title: 'Recommendations',
            subtitle: 'SRE mitigation strategies',
            itemLabel: 'Critical Action Item',
            noneTitle: 'Optimal Configuration Detected',
            noneDesc: 'No immediate mitigation required.',
            nextTitle: 'Next Checks',
            ip: 'Review IP Details',
            dns: 'Check DNS Records',
            json: 'Raw Diagnostic JSON',
          },
          copy: {
            copied: 'COPIED',
            copy: 'COPY_AUDIT',
          },
          emptyHint: 'Global_Edge_Probe • DNS_Forensics • SSL_Chain • HTTP_Header_Analytics',
        }
    }
  }, [lang])

  const loadingStages = useMemo(() => localeText.loading.stages, [localeText])

  const activeLoadingStage = useMemo(() => {
    const index = Math.min(Math.max(currentStep - 1, 0), loadingStages.length - 1)
    return loadingStages[index] ?? loadingStages[0]
  }, [currentStep, loadingStages])

  function parseLatencyMs(latency: string | number): number {
    if (typeof latency === 'number') return latency
    return parseInt(String(latency).replace('ms', ''), 10) || 0
  }

  function calculateScore(data: any) {
    let score = 100
    if (!data.http.success) score -= 40
    if (data.http.status_code >= 400) score -= 20
    if (!data.ssl.valid) score -= 20
    if (parseLatencyMs(data.dns.latency) > 300) score -= 10
    if (!data.cdn.is_provider) score -= 5
    
    // Domain status penalty
    const status = data.whois?.status?.toLowerCase() || ''
    if (status.includes('hold')) score -= 50
    
    return Math.max(0, score)
  }

  const summaryFacts = useMemo(() => {
    if (!result) return []

    const score = calculateScore(result)
    const verdict = result.http.success && !result.whois?.status?.toLowerCase().includes('hold')
      ? dict.tools.website_check.summary_good
      : dict.tools.website_check.summary_bad

    return [
      {
        label: localeText.summaryScore,
        value: score,
        tone: score >= 80 ? 'emerald' : score >= 50 ? 'orange' : 'red',
      },
      {
        label: localeText.summaryVerdict,
        value: verdict,
        tone: result.http.success ? 'emerald' : 'red',
      },
      {
        label: localeText.dns.title,
        value: result.dns.latency,
        tone: 'zinc',
      },
      {
        label: localeText.http.title,
        value: `${result.http.status_code}`,
        tone: result.http.success ? 'emerald' : 'red',
      },
      {
        label: localeText.ssl.title,
        value: result.ssl.grade || 'A',
        tone: result.ssl.valid ? 'emerald' : 'red',
      },
      {
        label: localeText.cdn.title,
        value: result.cdn.provider,
        tone: result.cdn.is_provider ? 'emerald' : 'orange',
      },
    ]
  }, [dict.tools.website_check.summary_bad, dict.tools.website_check.summary_good, localeText, result])

  // Use a ref to keep runDiagnostic stable while still being able to access the latest domain state
  const domainRef = React.useRef(domain)
  useEffect(() => {
    domainRef.current = domain
  }, [domain])

  const runDiagnostic = useCallback(async (target?: string, skipCache: boolean = false) => {
    // Determine the query target: prioritized passed target > state domain > empty (Who Am I)
    const d = normalizeTargetInput(target !== undefined ? target : domainRef.current)
    
    setLoading(true)
    setError(null)
    setShowDetails(false)
    setCurrentStep(1)
    setLocalResolvers({})
    
    const expectedStepCount = 3

    const dnsMatrix = [
      { id: 'system', name: 'SYSTEM DNS', url: d ? `https://${d}/favicon.ico` : 'https://google.com/favicon.ico', type: 'native' },
      { id: 'google', name: 'GOOGLE (LOCAL)', url: `https://dns.google/resolve?name=${d || 'google.com'}&type=A`, type: 'doh' },
      { id: 'cf', name: 'CLOUDFLARE (LOCAL)', url: `https://cloudflare-dns.com/dns-query?name=${d || 'google.com'}&type=A`, type: 'doh' },
      { id: 'ali', name: 'ALIDNS (LOCAL)', url: `https://dns.alidns.com/resolve?name=${d || 'google.com'}&type=A`, type: 'doh' }
    ]

    dnsMatrix.forEach(async (r) => {
      const start = Date.now()
      try {
        if (r.type === 'native') {
           const controller = new AbortController()
           const tid = setTimeout(() => controller.abort(), 3000)
           try {
             await fetch(r.url, { mode: 'no-cors', signal: controller.signal })
             setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip: 'Native_OK', latency: `${Date.now() - start}ms`, status: 'OK' }}))
           } catch {
             setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip: 'No_Link', latency: '---', status: 'FAILED' }}))
           } finally { clearTimeout(tid) }
           return
        }

        const res = await fetch(r.url, { 
          headers: { 'accept': 'application/dns-json' }, 
          signal: AbortSignal.timeout(5000) 
        })
        const data = await res.json()
        const ip = data.Answer?.find((a: any) => a.type === 1)?.data || data.answer?.find((a: any) => a.type === 1)?.data || null
        setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip, latency: `${Date.now() - start}ms`, status: ip ? 'OK' : 'EMPTY' }}))
      } catch (e) {
        setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip: null, latency: 'ERR', status: 'FAILED' }}))
      }
    })

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < expectedStepCount ? prev + 1 : prev))
    }, 800)

    try {
      const res = await fetch(`/api/diagnostic?domain=${encodeURIComponent(d || '')}${skipCache ? '&_nocache=' + Date.now() : ''}`)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error(`Platform error (${res.status}): Received non-JSON response from server.`)
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Diagnostic failed with status ${res.status}`)
      
      setResult(data)
    } catch (err: any) {
      console.error('Forensics Engine Error:', err)
      setError(err.message || 'Unknown forensic engine failure')
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }, []) // Completely stable run function

  // Tracks the last run query to avoid infinite loops in useEffect
  const lastProcessedQuery = React.useRef<string | undefined>(null as any)

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('domain') || searchParams.get('target') || undefined
    const normalizedQuery = q ? normalizeTargetInput(q) : undefined
    
    // Check if we already processed this exact query
    if (normalizedQuery !== lastProcessedQuery.current) {
        lastProcessedQuery.current = normalizedQuery
        if (normalizedQuery) setDomain(normalizedQuery)
        runDiagnostic(normalizedQuery)
    }
  }, [searchParams, runDiagnostic])




  const copyResult = () => {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getAdvice = (data: any) => {
    const advice = []
    const copy = {
      ja: {
        http530: 'Cloudflare 530: オリジン DNS エラーです。CDN が接続先の IP を見つけられていません。',
        gateway: 'ゲートウェイのタイムアウトです。オリジンサービスが停止しているか、応答に失敗しています。',
        connectivity: '接続障害の可能性があります。ファイアウォールや 80/443 番ポートを確認してください。',
        sslExpired: 'SSL 証明書の有効性に問題があります。現在、ブラウザ側で警告が出る状態です。',
        sslSoon: '証明書の更新期限が近い可能性があります。15 日以内に更新計画を立ててください。',
        hsts: 'HSTS が無効です。Strict-Transport-Security を有効化すると SSL ストリップを防ぎやすくなります。',
        cdn: 'エッジ CDN ではなく直接配信の可能性があります。遅延削減のため CDN 化を検討してください。',
        subdomains: 'サブドメイン数が多めです。検証用や放置された環境がないか確認すると安心です。',
        ok: '現時点では大きな問題は見当たりません。可用性・性能・セキュリティは良好です。',
      },
      zh: {
        http530: 'Cloudflare 530：源站 DNS 出错，CDN 未能找到上游服务器 IP。',
        gateway: '网关超时：源站服务可能已停止，或响应失败。',
        connectivity: '可能存在连接故障。请检查防火墙与 80/443 端口。',
        sslExpired: 'SSL 证书存在问题，当前会触发浏览器警告。',
        sslSoon: '证书可能即将到期，请在 15 天内安排更新。',
        hsts: 'HSTS 处于关闭状态。启用 Strict-Transport-Security 可减少 SSL Strip 风险。',
        cdn: '当前可能是直连而非边缘 CDN。建议启用 CDN 以降低延迟。',
        subdomains: '子域名数量偏多，建议排查是否存在遗留的测试或临时环境。',
        ok: '目前没有明显问题，可用性、性能与安全性表现良好。',
      },
      tw: {
        http530: 'Cloudflare 530：源站 DNS 發生錯誤，CDN 無法找到上游伺服器 IP。',
        gateway: '閘道逾時：源站服務可能已停止，或回應失敗。',
        connectivity: '可能存在連線故障。請檢查防火牆與 80/443 連接埠。',
        sslExpired: 'SSL 憑證存在問題，目前會觸發瀏覽器警告。',
        sslSoon: '憑證可能即將到期，請在 15 天內安排更新。',
        hsts: 'HSTS 目前關閉。啟用 Strict-Transport-Security 可降低 SSL Strip 風險。',
        cdn: '目前可能是直連而非邊緣 CDN。建議啟用 CDN 以降低延遲。',
        subdomains: '子網域數量偏多，建議排查是否有遺留的測試或臨時環境。',
        ok: '目前沒有明顯問題，可用性、效能與安全性表現良好。',
      },
      en: {
        http530: 'Cloudflare 530: Origin DNS error. The CDN cannot find your upstream IP.',
        gateway: 'Gateway timeout: The origin service may be down or failing to respond.',
        connectivity: 'Connectivity fault: Check your firewall and ports 80/443.',
        sslExpired: 'SSL certificate problem: browser warnings are likely right now.',
        sslSoon: 'Certificate expiring soon. Plan a renewal within 15 days.',
        hsts: 'HSTS is disabled. Enable Strict-Transport-Security to reduce SSL stripping risk.',
        cdn: 'This looks like direct delivery, not edge CDN. Consider enabling CDN to reduce latency.',
        subdomains: 'A high subdomain count can hide forgotten staging or test environments.',
        ok: 'No major issues detected. Availability, performance, and security look healthy.',
      },
    }[lang]

    if (!data.http.success) {
      if (data.http.status_code === 530) {
        advice.push(copy.http530)
      } else if (data.http.status_code === 502 || data.http.status_code === 504) {
        advice.push(copy.gateway)
      } else {
        advice.push(copy.connectivity)
      }
    }

    const isExpired = data.ssl?.expiry && new Date(data.ssl.expiry) < new Date()
    if (isExpired || !data.ssl.valid) {
      advice.push(copy.sslExpired)
    } else if (data.ssl.grade === 'C') {
      advice.push(copy.sslSoon)
    }
    
    if (data.ssl.valid && !data.ssl.factors?.includes('HSTS_ENABLED')) {
      advice.push(copy.hsts)
    }

    if (!data.cdn.is_provider) {
      advice.push(copy.cdn)
    }

    if (data.subdomains && data.subdomains.length > 20) {
      advice.push(copy.subdomains)
    }

    if (advice.length === 0) {
      advice.push(copy.ok)
    }

    return advice
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeTargetInput(domain)
    setDomain(normalized)
    runDiagnostic(normalized)
  }

  // Memoize advice to avoid computing it twice in render
  const adviceList = useMemo(() => (result ? getAdvice(result) : []), [result])

  return (
    <main className={`w-full max-w-6xl mx-auto px-6 mt-12 mb-32 z-20 relative ${isAsianLanguage ? 'font-sans' : 'font-mono'}`}>
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      {/* Hero Header */}
      <div className="text-center mb-16">
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-black mb-6 ${isAsianLanguage ? 'tracking-[0.18em]' : 'uppercase tracking-[0.4em]'}`}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {localeText.heroBadge}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-zinc-900 tracking-tighter italic mb-6 break-words lowercase">
           {result?.isVisitor
             ? localeText.heroTitles.visitor
             : result?.isActuallyIp
             ? localeText.heroTitles.ip
             : localeText.heroTitles.site}
        </h1>
        <p className={`max-w-2xl mx-auto mb-10 leading-relaxed ${
          isAsianLanguage
            ? 'text-zinc-800 text-sm sm:text-base font-medium tracking-normal'
            : 'text-zinc-600 text-xs sm:text-sm uppercase tracking-[0.3em] font-light'
        }`}>
           {localeText.heroSubtitle}
        </p>

        {/* Input Bar */}
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex items-center bg-white border border-black/5 p-2 rounded-2xl shadow-2xl focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
               <div className="w-12 h-12 flex items-center justify-center text-zinc-400">
                  <Globe className="w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
               </div>
               <input 
                 type="text" 
                 value={domain}
                 onChange={(e) => setDomain(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault()
                     runDiagnostic()
                   }
                 }}
                 placeholder={dict.home.diagnostics_placeholder}
                 className="flex-grow bg-transparent border-none outline-none text-zinc-900 text-lg px-2"
               />
               <button 
                 type="button"
                 onClick={() => runDiagnostic(undefined, true)}
                 disabled={loading}
                 className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                 >
                 {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                 {loading ? localeText.analyzing : dict.home.diagnostics_btn}
               </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="max-w-3xl mx-auto rounded-3xl border border-emerald-100 bg-white/90 shadow-sm p-5 sm:p-6 animate-in fade-in duration-300">
           <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                 <div className={`text-[10px] font-bold text-emerald-600 ${isAsianLanguage ? 'tracking-[0.18em]' : 'uppercase tracking-[0.4em]'}`}>
                   {localeText.loading.title}
                 </div>
                 <h3 className={`mt-2 text-lg font-black text-zinc-900 ${isAsianLanguage ? 'tracking-[-0.01em]' : 'uppercase tracking-tight'}`}>
                   {localeText.loading.headline}
                 </h3>
                 <p className={`mt-1 text-sm text-zinc-600 ${isAsianLanguage ? 'tracking-normal' : 'font-mono uppercase tracking-[0.2em]'}`}>
                   {localeText.loading.desc}
                 </p>
              </div>
              <div className="shrink-0 text-right">
                 <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.35em]">{localeText.loading.progress}</div>
                 <div className="mt-2 text-lg font-black text-zinc-900 tabular-nums">{currentStep}/3</div>
                 <div className={`mt-1 text-[10px] font-bold text-emerald-600 ${isAsianLanguage ? 'tracking-[0.18em]' : 'uppercase tracking-[0.3em]'}`}>
                   {activeLoadingStage.title}
                 </div>
              </div>
           </div>

           <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
             <div
               className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
               style={{ width: `${Math.min((currentStep / 3) * 100, 100)}%` }}
             />
           </div>

           <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
             <div className="flex items-start gap-3">
               <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                 <Activity className="w-4 h-4 animate-pulse" />
               </div>
               <div className="min-w-0">
                 <div className={`text-[10px] font-bold text-emerald-600 ${isAsianLanguage ? 'tracking-[0.18em]' : 'uppercase tracking-[0.3em]'}`}>
                   {localeText.loading.current}
                 </div>
                 <div className="mt-1 text-sm font-semibold text-zinc-900">{activeLoadingStage.title}</div>
                 <p className="mt-1 text-sm text-zinc-600">{activeLoadingStage.desc}</p>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-2xl mx-auto p-10 bg-red-50 border border-red-100 rounded-[2.5rem] text-red-600 flex items-start gap-6 animate-in fade-in slide-in-from-top-4">
           <AlertCircle className="w-10 h-10 shrink-0" />
           <div>
               <h3 className="text-xl font-black italic uppercase tracking-tight mb-2">{localeText.errorTitle}</h3>
               <p className="text-sm opacity-80 leading-relaxed uppercase">{error}</p>
           </div>
        </div>
      )}

      {/* Results Presentation */}
      {result && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
           
           {/* Overall Status Bar */}
           <div className={`mb-10 p-6 sm:p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden ${result.http.success ? 'bg-white border-emerald-100' : 'bg-red-50 border-red-100'}`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="flex items-center gap-6 z-10 w-full md:w-auto">
                 {/* Score Ring */}
                 {(() => {
                   const score = calculateScore(result)
                   const radius = 30
                   const circumference = 2 * Math.PI * radius
                   const offset = circumference - (score / 100) * circumference
                   const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
                   return (
                     <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                       <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="6" />
                         <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }} />
                       </svg>
                       <div className="relative z-10 flex flex-col items-center">
                         <span className="text-xl font-black text-zinc-900 leading-none">{score}</span>
                       </div>
                     </div>
                   )
                 })()}
                 <div>
                   <h2 className={`text-[10px] font-bold text-zinc-400 mb-1 ${isAsianLanguage ? 'tracking-[0.18em]' : 'uppercase tracking-widest'}`}>{localeText.summaryScore}</h2>
                   <h1 className={`text-2xl sm:text-3xl font-black ${isAsianLanguage ? 'tracking-[-0.02em] text-zinc-900' : 'italic tracking-tighter uppercase'} ${result.http.success && !result.whois?.status?.toLowerCase().includes('hold') ? 'text-zinc-900' : 'text-red-600'}`}>
                     {result.http.success && !result.whois?.status?.toLowerCase().includes('hold') ? dict.tools.website_check.summary_good : dict.tools.website_check.summary_bad}
                   </h1>
                 </div>
              </div>
              <button onClick={copyResult} className="relative z-10 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest bg-zinc-50 py-3 px-6 rounded-full border border-black/5 hover:bg-zinc-100 w-full md:w-auto shrink-0">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? localeText.copy.copied : localeText.copy.copy}
              </button>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
             {summaryFacts.slice(2).map((fact) => (
               <div key={fact.label} className="rounded-2xl border border-black/5 bg-white/80 backdrop-blur-md px-4 py-3 shadow-sm">
                 <div className="text-[10px] font-bold uppercase tracking-[0.28em] text-zinc-400">{fact.label}</div>
                 <div className={`mt-2 text-sm font-black ${
                   fact.tone === 'emerald'
                     ? 'text-emerald-600'
                     : fact.tone === 'orange'
                     ? 'text-orange-500'
                     : fact.tone === 'red'
                     ? 'text-red-500'
                     : 'text-zinc-900'
                 }`}>
                   {fact.value}
                 </div>
               </div>
             ))}
           </div>

           <div className="flex items-center justify-between gap-3 mb-6">
             <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-[0.35em]">
               {localeText.detailsHint}
             </p>
             <button
               type="button"
               onClick={() => setShowDetails((value) => !value)}
                 className={`inline-flex items-center gap-2 rounded-full border bg-white/90 px-4 py-2 text-[10px] font-bold shadow-sm transition-all ${
                 isAsianLanguage
                   ? 'border-zinc-200 text-zinc-700 tracking-[0.18em] hover:text-zinc-900 hover:border-emerald-300'
                   : 'border-black/5 uppercase tracking-[0.32em] text-zinc-500 hover:text-zinc-900 hover:border-emerald-200'
               }`}
             >
               <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''} ${isAsianLanguage ? 'text-emerald-500' : ''}`} />
               {showDetails ? localeText.detailsClose : localeText.detailsOpen}
              </button>
           </div>

           {showDetails && (
           <div className="space-y-4 mb-10">
              
              {/* Step: Geo-Location (Shown first for IPs) */}
              {result.isActuallyIp && (
                <div className="bg-emerald-50/30 border border-emerald-100 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
                  <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{localeText.geo.step}</span>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{localeText.geo.title}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.geo.country}</p>
                      <p className="text-sm font-black text-zinc-900 truncate">{result.geo.country}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.geo.city}</p>
                      <p className="text-sm font-black text-zinc-900 truncate">{result.geo.city}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.geo.asn}</p>
                      <p className="text-sm font-mono font-bold text-emerald-600">{result.geo.asn}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.geo.isp}</p>
                      <p className="text-sm font-black text-zinc-900 truncate">{result.geo.isp}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 1: WHOIS */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{localeText.whois.step}</span>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{localeText.whois.title}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  {!result.whois?.success && result.whois?.error ? (
                    <div className="w-full h-full flex flex-col justify-center">
                       <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.whois.diagException}</p>
                       <p className="text-sm font-black text-red-500 uppercase italic">
                         RDAP_FAULT: {result.whois.error}
                       </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{result.isActuallyIp ? 'Network Owner' : 'Registrar'}</p>
                        <p className={`text-sm font-black truncate ${result.whois?.success ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {result.whois?.success ? result.whois.registrar : (result.isActuallyIp ? result.geo.isp : localeText.whois.noInfo)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{result.isActuallyIp ? localeText.whois.allocated : localeText.whois.registered}</p>
                        <p className="text-sm font-mono text-zinc-700">{result.whois?.success ? result.whois.registered : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{result.isActuallyIp ? localeText.whois.networkClass : localeText.whois.expiry}</p>
                        <p className="text-sm font-mono text-zinc-700">{result.isActuallyIp ? (result.isPrivate ? localeText.whois.privateIp : localeText.whois.publicIp) : (result.whois?.success ? result.whois.expires : 'N/A')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.whois.status}</p>
                        <p className={`text-sm font-black uppercase italic truncate ${
                            result.whois?.status?.toLowerCase().includes('hold') ? 'text-red-500' : 'text-emerald-500'
                        }`} title={result.whois?.status || 'Unknown'}>
                            {result.whois?.status || (lang === 'en' ? 'OK' : '正常')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subdomain Discovery Add-on */}
                  {result.subdomains && result.subdomains.length > 0 && (
                    <details className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-3 h-3 text-zinc-400" />
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{localeText.whois.assetTitle}</h4>
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400">{result.subdomains.length} {localeText.whois.assetCountSuffix}</span>
                      </summary>
                      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {result.subdomains.map((sub: string) => (
                          <button
                            key={sub}
                            onClick={() => {
                              setDomain(sub);
                              runDiagnostic(sub);
                            }}
                            className="text-left px-3 py-2 bg-white border border-zinc-100 rounded-lg text-[10px] font-mono text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 transition-all hover:shadow-sm truncate group"
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span> {sub}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              {/* Step 2: DNS */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{localeText.dns.step}</span>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{localeText.dns.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.dns.resolved}</p>
                     <p className="text-[12px] font-mono font-bold text-zinc-800 break-all leading-tight" title={result.dns.all_ips?.join(', ')}>
                          {result.dns.all_ips && result.dns.all_ips.length > 0 
                            ? result.dns.all_ips.join(' / ')
                            : result.dns.resolved_ip}
                     </p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-4 pt-4 border-t border-zinc-50/50">
                        {/* REGIONAL LOCAL NODES (Client Perspective) - Deduped by Map */}
                        {Object.values(localResolvers).map((node: any) => (
                           <div key={node.id} className="flex items-center gap-2 group cursor-help transition-all hover:scale-105" title={`Direct from your locally configured network via ${node.id}`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                node.status === 'OK' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 
                                node.status === 'RESOLVING' ? 'bg-zinc-200 animate-pulse' : 'bg-red-400'
                              }`}></div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black text-zinc-800 uppercase leading-none tracking-tighter">{node.name}</span>
                                <span className="text-[8px] font-mono text-zinc-400 mt-1 font-bold">
                                  {node.status === 'FAILED' ? localeText.dns.restricted : (node.ip ? (node.ip.length > 15 ? node.ip.slice(0, 12) + '...' : node.ip) : 'NXDOMAIN')} • {node.latency}
                                </span>
                              </div>
                           </div>
                        ))}

                        {/* GLOBAL CLOUD NODES (Worker Perspective) */}
                        <div className="w-full flex flex-wrap items-center gap-4 mt-1">
                          {result.dns.resolvers?.map((r: any) => (
                           <div key={r.name} className="flex items-center gap-1.5" title={`${r.name}: ${r.status}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase">{r.name}</span>
                           </div>
                        ))}
                        </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.dns.latency}</p>
                    <p className="text-sm font-mono text-emerald-600 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {result.dns.latency}
                    </p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.dns.nameservers}</p>
                    <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-1 overflow-x-hidden">
                        {result.dns.ns && result.dns.ns.length > 0 
                          ? result.dns.ns.map((ns: string) => (
                              <p key={ns} className="text-[10px] font-mono font-bold text-zinc-500 uppercase truncate leading-tight" title={ns}>{ns}</p>
                            ))
                          : <p className="text-[10px] font-mono text-zinc-400 font-bold uppercase italic">{localeText.dns.unknown}</p>
                        }
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Server HTTP */}
              <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all ${result.http.success ? 'bg-white border-black/5' : 'bg-red-50 border-red-100'}`}>
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{localeText.http.step}</span>
                  <div className="flex items-center gap-2">
                    <Server className={`w-4 h-4 ${result.http.success ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{localeText.http.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.http.availability}</p>
                    <p className={`text-sm font-black ${result.http.success ? 'text-emerald-500' : 'text-red-500'}`}>
                      {result.http.success ? localeText.http.success : localeText.http.failure}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.http.status}</p>
                    <p className={`text-sm font-black ${result.http.success ? 'text-zinc-900' : 'text-red-500'}`}>
                      {result.http.status_code || 'Err'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.http.protocol}</p>
                    <p className="text-sm font-mono text-zinc-700">{result.http.is_https ? 'HTTPS' : 'HTTP/TCP'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.http.responseTime}</p>
                    <p className="text-sm font-mono text-zinc-900 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-500" /> {result.http.latency}
                     </p>
                  </div>
                </div>
              </div>

              {/* Step 4: SSL */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{localeText.ssl.step}</span>
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${result.ssl.valid ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{localeText.ssl.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-grow">
                  {/* Col 1: Status & Expiry */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.ssl.certStatus}</p>
                      <p className={`text-sm font-black ${result.ssl.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                        {result.ssl.valid ? (lang === 'en' ? 'PROVEN_SECURE' : '有效') : (lang === 'en' ? 'VALIDATION_FAULT' : '驗證失敗')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.ssl.expiry}</p>
                      <p className="text-sm font-mono text-zinc-700">{result.ssl.expiry}</p>
                    </div>
                  </div>

                  {/* Col 2: Security Grade */}
                  <div className="flex flex-col items-center justify-center bg-zinc-50 rounded-2xl p-4 border border-black/5 relative">
                    <button 
                      onClick={() => setShowGradeInfo(!showGradeInfo)}
                      className="flex items-center gap-1 group"
                    >
                      <p className="text-[9px] font-black text-zinc-400 uppercase mb-2 group-hover:text-zinc-600 transition-colors">{localeText.ssl.grade}</p>
                      <HelpCircle className="w-2.5 h-2.5 text-zinc-300 mb-2 group-hover:text-emerald-500 transition-colors" />
                    </button>

                    {showGradeInfo && (
                      <div className="absolute z-50 bottom-full mb-2 w-64 bg-zinc-900 text-white p-4 rounded-xl shadow-2xl text-[10px] space-y-2 border border-white/10">
                        <p className="font-bold text-emerald-400 uppercase">{localeText.ssl.grading}</p>
                        <div className="space-y-1 text-zinc-300">
                          <p><span className="text-white font-bold">A+ :</span> {lang === 'en' ? 'Fully Secure (HTTPS + HSTS Active)' : '極為安全（HTTPS + HSTS 已啟用）'}</p>
                          <p><span className="text-white font-bold">A  :</span> {lang === 'en' ? 'Secure (HTTPS Enabled)' : '安全（HTTPS 已啟用）'}</p>
                          <p><span className="text-white font-bold">B  :</span> {lang === 'en' ? 'Warning (HTTPS but Missing HSTS)' : '提醒（HTTPS 可用，但缺少 HSTS）'}</p>
                          <p><span className="text-white font-bold">C  :</span> {lang === 'en' ? 'Urgent (Expiring within 15 days)' : '即將到期（15 天內）'}</p>
                          <p><span className="text-white font-bold">F  :</span> {lang === 'en' ? 'Critical (HTTP only or Invalid Cert)' : '需要處理（僅 HTTP 或憑證無效）'}</p>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[8px] text-zinc-500">
                          {lang === 'en' ? 'Based on Qualys SSL Labs & Mozilla Security standards.' : '參考 Qualys SSL Labs 與 Mozilla 的標準。'}
                        </div>
                      </div>
                    )}
                    <div className={`text-4xl font-black italic ${
                      result.ssl.grade?.startsWith('A') ? 'text-emerald-500' : 
                      result.ssl.grade === 'B' ? 'text-orange-500' : 'text-red-500'
                    }`}>
                      {result.ssl.grade || 'A'}
                    </div>
                    <div className="mt-2 flex gap-1">
                       {result.ssl.factors?.map((f: string) => (
                         <div key={f} className="w-1.5 h-1.5 rounded-full bg-zinc-200" title={f}></div>
                       ))}
                    </div>
                  </div>

                  {/* Col 3: Headers & Tech */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.ssl.hsts}</p>
                      <p className={`text-[11px] font-black uppercase ${result.ssl.factors?.includes('HSTS_ENABLED') ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {result.ssl.factors?.includes('HSTS_ENABLED') ? (lang === 'en' ? 'STRICT_ACTIVE' : '有效') : (lang === 'en' ? 'OPTIONAL_NONE' : '無效')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.ssl.cipher}</p>
                      <p className="text-[11px] font-mono text-zinc-600">{result.ssl.tls_version || 'TLS 1.3'}</p>
                    </div>
                  </div>

                  {/* Col 4: Cert Chain View */}
                  <details className="bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100 relative overflow-hidden group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{localeText.ssl.chain}</p>
                      <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-60 group-open:opacity-100 transition-opacity" />
                    </summary>
                    <div className="space-y-3 relative mt-4">
                       {result.ssl.chain && result.ssl.chain.length > 0 ? (
                         result.ssl.chain.map((link: any, idx: number) => (
                           <div key={idx} className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                 <div className={`w-2 h-2 rounded-full ${link.status === 'Trusted' || link.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                 {idx < (result.ssl.chain.length - 1) && <div className="w-px h-3 bg-zinc-200"></div>}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[9px] text-zinc-400 uppercase leading-none mb-1">{link.level}</p>
                                 <p className="text-[10px] text-zinc-700 font-mono font-bold truncate max-w-[120px]" title={link.name}>{link.name}</p>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full py-4 opacity-30">
                            <ShieldAlert className="w-6 h-6 mb-2 text-zinc-400" />
                            <p className="text-[9px] text-center uppercase tracking-tighter text-zinc-500">{localeText.ssl.chainUnavailable}</p>
                         </div>
                       )}
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 5: CDN */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{localeText.cdn.step}</span>
                  <div className="flex items-center gap-2">
                    <Cloud className={`w-4 h-4 ${result.cdn.is_provider ? 'text-emerald-500' : 'text-zinc-400'}`} />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{localeText.cdn.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.cdn.provider}</p>
                    <p className="text-sm font-black text-zinc-900 truncate">{result.cdn.provider}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.cdn.edge}</p>
                    <p className={`text-sm font-black uppercase italic ${result.cdn.is_provider ? 'text-orange-500' : 'text-zinc-400'}`}>
                      {result.cdn.is_provider ? localeText.cdn.proxied : localeText.cdn.direct}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">{localeText.cdn.header}</p>
                    <p className="text-sm font-mono text-zinc-700 truncate">{result.cdn.server}</p>
                  </div>
                </div>
              </div>

           </div>
           )}

           {/* Suggestions & Advice Section */}
           {showDetails && (
           <div className="rounded-[2.5rem] border border-zinc-200/70 bg-white shadow-sm p-6 sm:p-10 md:p-12">
              <div className="flex items-start justify-between gap-6 mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                       <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className={`text-2xl font-black text-zinc-900 ${isAsianLanguage ? 'tracking-[-0.02em]' : 'italic tracking-tight'}`}>{localeText.advice.title}</h3>
                       <p className={`text-xs text-zinc-500 mt-1 ${isAsianLanguage ? 'tracking-[0.16em]' : 'font-mono uppercase tracking-widest'}`}>
                         {localeText.advice.subtitle}
                       </p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,0.9fr] gap-6">
                 <div className="space-y-3">
                    {adviceList.length > 0 ? adviceList.map((advice, i) => (
                      <div key={i} className="flex gap-4 p-5 bg-zinc-50/80 rounded-2xl border border-zinc-200/70 shadow-sm group overflow-hidden">
                         <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                         <div className="flex-grow">
                            <p className="text-sm sm:text-[15px] font-medium text-zinc-800 leading-relaxed">{advice}</p>
                            <p className={`mt-2 text-[10px] text-zinc-400 ${isAsianLanguage ? 'tracking-[0.16em]' : 'font-mono uppercase tracking-widest'}`}>{localeText.advice.itemLabel}</p>
                         </div>
                      </div>
                    )) : (
                      <div className="p-8 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-emerald-700">
                         <div className="flex items-center gap-3">
                           <CheckCircle2 className="w-6 h-6 opacity-60 shrink-0" />
                           <div>
                             <span className="text-sm font-bold block">{localeText.advice.noneTitle}</span>
                             <span className={`text-[10px] opacity-70 mt-1 block ${isAsianLanguage ? 'tracking-[0.16em]' : 'font-mono uppercase tracking-widest'}`}>{localeText.advice.noneDesc}</span>
                           </div>
                         </div>
                      </div>
                    )}
                 </div>
                 <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-5 sm:p-6">
                    <h5 className={`text-[10px] font-bold text-zinc-400 mb-5 ${isAsianLanguage ? 'tracking-[0.18em]' : 'uppercase tracking-widest'}`}>{localeText.advice.nextTitle}</h5>
                    <div className="space-y-3">
                       <Link href={`/tools/ip-lookup?q=${result.dns.resolved_ip}`} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/70 hover:border-emerald-300 hover:-translate-y-0.5 transition-all group shadow-sm">
                          <span className="text-sm font-semibold text-zinc-900">{localeText.advice.ip}</span>
                          <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                       </Link>
                       <Link href={`/tools/dns-lookup?q=${domain}`} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/70 hover:border-emerald-300 hover:-translate-y-0.5 transition-all group shadow-sm">
                          <span className="text-sm font-semibold text-zinc-900">{localeText.advice.dns}</span>
                          <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                       </Link>
                    </div>
                </div>
              </div>
           </div>
           )}

           {/* JSON Audit View */}
           {showDetails && (
           <div className="mt-20">
              <button 
                 onClick={() => setShowJson(!showJson)}
                 className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest mb-6"
              >
                 <ChevronDown className={`w-3 h-3 transition-transform ${showJson ? 'rotate-180' : ''}`} />
                 {localeText.advice.json}
              </button>
              {showJson && (
                 <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-[11px] text-zinc-400 overflow-x-auto border border-zinc-800 shadow-2xl relative">
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                      <button onClick={copyResult} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                         {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                   <pre className="font-mono leading-relaxed pt-4">
                      {JSON.stringify(result, null, 2)}
                   </pre>
                </div>
              )}
           </div>
           )}
        </div>
      )}

      {/* Hero-State Empty View */}
      {!result && !loading && (
        <div className="max-w-2xl mx-auto mt-24 p-16 rounded-[3rem] border border-dashed border-zinc-200 bg-white/60 text-center animate-in fade-in duration-1000">
            <Search className="w-16 h-16 text-zinc-100 mx-auto mb-8 animate-pulse" />
            <p className="text-zinc-500 text-xs leading-relaxed font-mono uppercase tracking-[0.4em] opacity-40">
              {localeText.emptyHint}
            </p>
        </div>
      )}
    </main>
  )
}
