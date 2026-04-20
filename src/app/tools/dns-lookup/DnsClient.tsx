'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  Globe, 
  Search, 
  Zap, 
  Activity, 
  Database, 
  Clock, 
  Copy, 
  Check, 
  ChevronDown, 
  Server,
  AlertCircle,
  CheckCircle2,
  Filter,
  History,
  ArrowRight,
  ShieldCheck,
  Terminal,
  Cpu,
  Monitor
} from 'lucide-react'
import { useDnsLookup, type DnsRecordType, type DnsProvider } from './hooks'

export default function DnsClient({ dict, lang }: { dict: any; lang: 'zh' | 'en' | 'ja' | 'tw' }) {
  const { 
    loading, 
    result, 
    error, 
    lookup, 
    history 
  } = useDnsLookup()

  const searchParams = useSearchParams()
  const isJapanese = lang === 'ja'
  
  const [domain, setDomain] = useState('')
  const [selectedType, setSelectedType] = useState<DnsRecordType>('A')
  const [selectedProvider, setSelectedProvider] = useState<DnsProvider>('cloudflare')
  // dict passed via props
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)
  const [localResolvers, setLocalResolvers] = useState<Record<string, any>>({})

  const recordTypes: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'CAA']
  const providers: { id: DnsProvider; name: string }[] = [
    { id: 'cloudflare', name: 'Cloudflare (Global)' },
    { id: 'google', name: 'Google (Global)' },
    { id: 'aliyun', name: 'AliDNS (Domestic)' },
    { id: 'quad9', name: 'Quad9 (Privacy)' }
  ]

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('domain')
    if (q) {
      setDomain(q)
      lookup(q, selectedType, selectedProvider)
      runLocalAudit(q)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // intentionally run only on URL param change

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!domain) return
    lookup(domain, selectedType, selectedProvider)
    runLocalAudit(domain)
  }

  const runLocalAudit = async (d: string) => {
    setLocalResolvers({})
    const dnsMatrix = [
      { id: 'system', name: 'SYSTEM DNS', url: `https://${d}/favicon.ico`, type: 'native' },
      { id: 'google', name: 'GOOGLE (LOCAL)', url: `https://dns.google/resolve?name=${d}&type=${selectedType}`, type: 'doh' },
      { id: 'cf', name: 'CLOUDFLARE (LOCAL)', url: `https://cloudflare-dns.com/dns-query?name=${d}&type=${selectedType}`, type: 'doh' },
      { id: 'ali', name: 'ALIDNS (LOCAL)', url: `https://dns.alidns.com/resolve?name=${d}&type=${selectedType}`, type: 'doh' },
      { id: 'quad9', name: 'QUAD9 (LOCAL)', url: `https://dns.quad9.net/dns-query?name=${d}&type=${selectedType}`, type: 'doh' }
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

        const res = await fetch(r.url, { headers: { 'accept': 'application/dns-json' }, signal: AbortSignal.timeout(5000) })
        const data = await res.json()
        const ans = data.Answer || data.answer || []
        const ip = ans.find((a: any) => a.type === 1 || a.type === 28)?.data || ans[0]?.data || null
        setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip, latency: `${Date.now() - start}ms`, status: ip ? 'OK' : 'EMPTY' }}))
      } catch (e) {
        setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip: null, latency: 'ERR', status: 'FAILED' }}))
      }
    })
  }

  const copyData = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!dict) return (
     <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
        <Activity className="w-10 h-10 text-orange-500 animate-pulse mb-6" />
        <p className="text-zinc-400 tracking-[0.24em] text-[10px]">{isJapanese ? 'DNS 環境を初期化中...' : 'Loading DNS environment...'}</p>
     </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 font-sans pb-32">
       {/* Breadcrumbs */}
       <nav className="flex items-center gap-2 mb-12 text-[10px] tracking-[0.24em] text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 transition-colors">{isJapanese ? 'ホーム' : lang === 'zh' ? '首页' : lang === 'tw' ? '首頁' : 'Home'}</Link>
          <span>/</span>
          <span className="text-zinc-900 border-b border-emerald-500/30 font-semibold">{dict.tools.dns_lookup_title}</span>
       </nav>

       {/* Header */}
       <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
             <h1 className="text-3xl sm:text-4xl md:text-6xl font-semibold text-zinc-900 tracking-tighter mb-4 leading-none break-words">
                {dict.tools.dns_lookup_title}
             </h1>
             <p className="text-sm text-zinc-500 leading-relaxed max-w-2xl">{dict.tools.dns_lookup_desc}</p>
          </div>
       </div>

       {/* Control Center */}
       <div className="bg-white border border-black/5 rounded-[2.5rem] p-3 shadow-sm mb-16 relative group">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
             <div className="flex-grow flex items-center px-6 py-4">
                <Globe className="w-5 h-5 text-zinc-400 mr-4 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={dict.tools.dns.placeholder}
                  className="w-full bg-transparent border-none outline-none text-zinc-900 text-lg focus:ring-0"
                />
             </div>
             
             <div className="flex flex-wrap items-center gap-4 p-3 bg-zinc-50 rounded-[2rem] border border-zinc-100">
                <div className="flex items-center gap-3 px-4 border-r border-zinc-200">
                   <Filter className="w-4 h-4 text-zinc-400" />
                   <select 
                     value={selectedType}
                     onChange={(e) => setSelectedType(e.target.value as DnsRecordType)}
                     className="bg-transparent text-xs font-semibold outline-none cursor-pointer text-zinc-600 appearance-none tracking-[0.18em]"
                   >
                      {recordTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="flex items-center gap-3 px-4">
                   <Server className="w-4 h-4 text-zinc-400" />
                   <select 
                     value={selectedProvider}
                     onChange={(e) => setSelectedProvider(e.target.value as DnsProvider)}
                     className="bg-transparent text-[10px] font-semibold outline-none cursor-pointer text-zinc-500 appearance-none tracking-[0.16em]"
                   >
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                   <ChevronDown className="w-3 h-3 text-zinc-300" />
                </div>
             </div>

             <button 
               type="submit"
               disabled={loading}
               className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 font-semibold shadow-lg shadow-emerald-500/20 disabled:opacity-50 group/btn"
             >
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                <span className="tracking-[0.18em]">{dict.tools.dns.btn}</span>
             </button>
          </form>
       </div>

       {error && (
         <div className="mb-12 p-10 bg-red-50 border border-red-100 rounded-[2.5rem] text-red-600 flex items-start gap-6 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div>
               <h3 className="text-xl font-semibold tracking-tight mb-2">{isJapanese ? '診断エラー' : lang === 'zh' ? '查询异常' : lang === 'tw' ? '查詢異常' : 'Lookup error'}</h3>
               <p className="text-sm opacity-80 leading-relaxed">{error}</p>
            </div>
         </div>
       )}

       {result && (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Local Perspective Audit Panel */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2.5rem] p-8 sm:p-10 mb-8">
               <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                     <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                     <h3 className="text-xl font-semibold text-zinc-900 tracking-tight">{isJapanese ? 'ローカル照合' : lang === 'zh' ? '本地联查' : lang === 'tw' ? '本地聯查' : 'Local Perspective'}</h3>
                     <p className="text-[10px] text-zinc-400 tracking-[0.18em]">{isJapanese ? 'クライアント側の複数リゾルバで確認' : lang === 'zh' ? '通过多个本地解析器交叉确认' : lang === 'tw' ? '透過多個本地解析器交叉確認' : 'Client-side multi-resolver checks'}</p>
                  </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {Object.values(localResolvers).map((node: any) => (
                    <div key={node.id} className="bg-white p-5 rounded-3xl border border-zinc-100 flex flex-col gap-3 transition-all hover:border-indigo-500 group">
                       <div className="flex items-center justify-between">
                          <span className="text-[9px] font-semibold text-zinc-900 tracking-[0.18em]">{node.name}</span>
                          <div className={`w-2 h-2 rounded-full ${node.status === 'OK' ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-red-400'}`}></div>
                       </div>
                       <div>
                          <p className="text-[10px] text-zinc-500 truncate" title={node.ip}>{node.ip || 'NXDOMAIN'}</p>
                          <p className="text-[9px] text-zinc-300 mt-1 tracking-[0.18em]">{node.latency}</p>
                       </div>
                    </div>
                  ))}
                  {Object.values(localResolvers).length === 0 && Array(4).fill(0).map((_, i) => (
                    <div key={i} className="bg-zinc-50/50 h-24 rounded-3xl border border-dashed border-zinc-200 animate-pulse"></div>
                  ))}
               </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40 group relative overflow-hidden transition-all hover:shadow-xl">
                  <div className="absolute top-0 right-0 p-8 scale-150 opacity-[0.03] group-hover:opacity-10 transition-transform">
                     <ShieldCheck className="w-12 h-12" />
                  </div>
                  <span className="text-[10px] text-zinc-400 tracking-[0.24em] font-semibold">{isJapanese ? '解析状態' : lang === 'zh' ? '解析状态' : lang === 'tw' ? '解析狀態' : 'Resolver Status'}</span>
                  <div className="flex items-center gap-3 relative z-10">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-2xl font-semibold text-emerald-500 tracking-tighter">{isJapanese ? '安全な DoH' : lang === 'zh' ? '安全 DoH' : lang === 'tw' ? '安全 DoH' : 'Secure DoH'}</span>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
                  <span className="text-[10px] text-zinc-400 tracking-[0.24em] font-semibold">{isJapanese ? '応答時間' : lang === 'zh' ? '响应时间' : lang === 'tw' ? '回應時間' : 'Response Time'}</span>
                  <div>
                     <div className="text-4xl font-semibold text-zinc-900 tracking-tighter">{result.responseTime}</div>
                     <div className="text-[10px] text-emerald-500 font-semibold tracking-[0.18em] mt-1">{isJapanese ? 'ミリ秒' : lang === 'zh' ? '毫秒' : lang === 'tw' ? '毫秒' : 'Milliseconds'}</div>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
                  <span className="text-[10px] text-zinc-400 tracking-[0.24em] font-semibold">{isJapanese ? 'プロトコル' : lang === 'zh' ? '协议' : lang === 'tw' ? '協議' : 'Protocol'}</span>
                  <div className="text-xl font-semibold text-zinc-900">{isJapanese ? 'TLS 1.3 / ECH' : 'TLS 1.3 / ECH'}</div>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
                  <span className="text-[10px] text-zinc-400 tracking-[0.24em] font-semibold">{isJapanese ? 'レコード種別' : lang === 'zh' ? '记录类型' : lang === 'tw' ? '記錄類型' : 'Record Type'}</span>
                  <div className="text-4xl font-semibold text-emerald-600 tracking-tighter underline decoration-2 underline-offset-8 decoration-emerald-500/30">{result.type}</div>
               </div>
            </div>

            {/* Answer Manifest Matrix */}
            <div className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-xl">
               <div className="px-6 sm:px-10 py-6 bg-zinc-50 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-[10px] font-semibold text-zinc-400 tracking-[0.18em] flex items-center gap-3">
                     <Database className="w-4 h-4 text-emerald-500" /> {isJapanese ? '応答記録 JSON' : lang === 'zh' ? '响应记录 JSON' : lang === 'tw' ? '回應記錄 JSON' : 'Resolution Manifest JSON'}
                  </h3>
                  <button onClick={() => copyData(JSON.stringify(result.answers))} className="text-[10px] font-semibold text-zinc-400 hover:text-orange-600 flex items-center gap-2 group transition-colors">
                     {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 group-hover:scale-110" />}
                     {copied ? (isJapanese ? 'コピー完了' : lang === 'zh' ? '已复制' : lang === 'tw' ? '已複製' : 'Copied') : (isJapanese ? '全件コピー' : lang === 'zh' ? '复制全部' : lang === 'tw' ? '複製全部' : 'Copy all')}
                  </button>
               </div>
               
               <div className="divide-y divide-zinc-50">
                  {result.answers.length > 0 ? result.answers.map((answer, idx) => (
                    <div key={idx} className="p-6 sm:p-10 hover:bg-zinc-50/50 transition-all group flex flex-col md:flex-row md:items-center gap-6 sm:gap-10">
                       <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-4">
                             <span className="px-3 py-1 bg-orange-500 text-white rounded-lg text-[10px] font-semibold tracking-[0.18em]">
                                {answer.type}
                             </span>
                             <span className="text-zinc-200 font-light opacity-50">/</span>
                             <span className="text-xs font-semibold text-zinc-400 tracking-[0.18em]">{answer.name}</span>
                          </div>
                          <div className="font-semibold text-xl md:text-2xl text-zinc-900 break-all leading-tight flex items-start gap-3">
                             {answer.priority !== undefined && <span className="text-purple-500 text-sm mt-1">[{answer.priority}]</span>}
                             <span className="group-hover:text-emerald-600 transition-colors">{answer.data}</span>
                          </div>
                       </div>
                       <div className="flex md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 pt-6 md:pt-0 border-zinc-100 min-w-max">
                          <div className="flex flex-col md:items-end gap-1">
                             <div className="text-[10px] text-zinc-400 font-semibold tracking-[0.18em] flex items-center gap-2">
                                <Clock className="w-3 h-3" /> {isJapanese ? 'TTL' : 'Time_To_Live'}
                             </div>
                             <div className="text-lg font-semibold text-zinc-900">{answer.ttl}<span className="text-xs text-zinc-400 ml-1">S</span></div>
                          </div>
                          <button 
                            onClick={() => copyData(answer.data)}
                            className="p-3 bg-zinc-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-white"
                          >
                             <Copy className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  )) : (
                    <div className="py-32 text-center flex flex-col items-center bg-white">
                       <Terminal className="w-20 h-20 text-zinc-100 mb-6 animate-pulse" />
                       <p className="text-zinc-400 text-sm tracking-[0.18em]">{dict.tools.dns.no_records}</p>
               <p className="text-[10px] text-zinc-300 mt-2">{isJapanese ? 'NXDOMAIN / タイムアウトを確認してください' : lang === 'zh' ? '请检查 NXDOMAIN / 超时' : lang === 'tw' ? '請檢查 NXDOMAIN / 逾時' : 'Check NXDOMAIN / timeout'}</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Collapsible JSON Audit View */}
            <div className="mt-16">
               <button 
                  onClick={() => setShowJson(!showJson)}
                 className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors tracking-[0.18em] mb-6"
               >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showJson ? 'rotate-180' : ''}`} />
                  {isJapanese ? '生の DNS 診断 JSON' : lang === 'zh' ? '原始 DNS 记录 JSON' : lang === 'tw' ? '原始 DNS 記錄 JSON' : 'Raw DNS Audit JSON'}
               </button>
               {showJson && (
                 <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-[11px] text-zinc-500 overflow-x-auto border border-zinc-800 shadow-2xl relative">
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                       <button onClick={() => copyData(JSON.stringify(result.raw))} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                       </button>
                    </div>
                    <pre className="font-mono leading-relaxed pt-4">
                       {JSON.stringify(result.raw, null, 2)}
                    </pre>
                 </div>
               )}
            </div>
         </div>
       )}

       {/* Forensics History Section */}
       {!result && !loading && history.length > 0 && (
          <div className="animate-in fade-in duration-1000 mt-24">
             <div className="flex items-center justify-between mb-10 border-b border-zinc-100 pb-6">
                <div>
                   <h4 className="text-[11px] font-semibold text-zinc-900 tracking-[0.18em] flex items-center gap-3">
                      <History className="w-5 h-5 text-emerald-500" /> {isJapanese ? '最近の DNS 診断' : lang === 'zh' ? '最近的 DNS 记录' : lang === 'tw' ? '最近的 DNS 記錄' : 'Recent DNS Checks'}
                   </h4>
                   <p className="text-[10px] text-zinc-400 mt-1 tracking-[0.18em]">{isJapanese ? 'キャッシュされた履歴' : lang === 'zh' ? '缓存查询记录' : lang === 'tw' ? '快取查詢紀錄' : 'Cached query history'}</p>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {history.slice(0, 4).map((h) => (
                  <button 
                    key={h.id}
                    onClick={() => lookup(h.domain, h.type, h.provider)}
                    className="p-8 bg-white border border-black/5 rounded-3xl hover:border-orange-500/40 hover:-translate-y-1 transition-all text-left flex flex-col justify-between group shadow-sm h-40"
                  >
                     <div>
                        <div className="flex items-center gap-2 mb-4">
                           <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-lg text-[9px] font-semibold tracking-[0.18em]">{h.type}</span>
                           <span className="text-[9px] font-semibold text-zinc-300 tracking-[0.18em]">@ {h.provider.split('_')[0]}</span>
                        </div>
                        <p className="font-semibold text-zinc-900 text-base group-hover:text-orange-600 transition-colors truncate w-full">{h.domain}</p>
                     </div>
                     <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-semibold tracking-[0.18em] group-hover:text-zinc-900 transition-colors">
                        {isJapanese ? '再実行' : 'Replay_Probe'} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                     </div>
                  </button>
                ))}
             </div>
          </div>
       )}

       {/* Hero Empty State View */}
       {!result && !loading && (
       <div className="max-w-2xl mx-auto mt-16 sm:mt-24 p-10 sm:p-20 rounded-[3.5rem] border border-dashed border-zinc-200 bg-white/60 text-center animate-in fade-in duration-1000">
              <Cpu className="w-16 h-16 text-zinc-100 mx-auto mb-8 animate-pulse text-orange-500/20" />
              <p className="text-zinc-500 text-[10px] leading-relaxed tracking-[0.18em] opacity-40">
                {isJapanese ? 'A・AAAA・CNAME・MX・NS・TXT・CAA をまとめて確認できます。' : 'A_Record • AAAA • CNAME • MX • NS • TXT • CAA Resolution Engines'}
              </p>
          </div>
      )}
    </div>
  )
}
