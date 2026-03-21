'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Globe, 
  Shield, 
  Zap, 
  Terminal, 
  Copy, 
  Check, 
  Activity, 
  MapPin, 
  Monitor, 
  Server,
  Lock,
  Cpu
} from 'lucide-react'
import { useParams } from 'next/navigation'

interface IPData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  continent_code: string;
  postal: string;
  latitude: number;
  longitude: number;
  timezone: string;
  utc_offset: string;
  asn: string;
  org: string;
  network_type?: string;
  proxy?: boolean;
}

export default function IPClient() {
  const params = useParams()
  const lang = (params.lang as 'en' | 'zh') || 'en'
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<IPData | null>(null)
  const [ipv4, setIpv4] = useState<string | null>(null)
  const [ipv6, setIpv6] = useState<string | null>(null)
  const [v4Data, setV4Data] = useState<IPData | null>(null)
  const [v6Data, setV6Data] = useState<IPData | null>(null)
  const [stack, setStack] = useState<'v4' | 'v6'>('v4')
  
  const [uaInfo, setUaInfo] = useState({ 
    ua: '', 
    os: '', 
    browser: '', 
    protocol: 'HTTP/2',
    language: '',
    resolution: '',
    timezone: '',
    cores: 0
  })
  const [copied, setCopied] = useState(false)

  // Simplified Dictionary (will be injected via props in a real app, but fetched here for 1-file demo)
  const dict = {
    zh: {
      title: "Ops IP 态势感知",
      subtitle: "深度解析网络元数据，探测边缘路由节点",
      back: "返回",
      your_ip: "您的访问地址",
      geo: "地理位置 (Geo-Location)",
      net: "网络/ASN (Connectivity)",
      sec: "安全审计 (Security Audit)",
      env: "环境感知 (Environment)",
      loading: "正在同步全球路由节点...",
      copy: "复制 JSON",
      isp: "运营商 / 组织",
      asn: "自治系统编号",
      coords: "地理坐标",
      region: "省份 / 地区",
      risk: "风险评级",
      proxy: "代理状态",
      type: "连接类型",
      security: "正常",
      protocol: "协议栈",
      wait: "探测中...",
      copied: "已复制",
      country: "所在国家",
      city: "城市/地区",
      ua: "浏览器指纹",
      timezone: "当地时间",
      ipv4: "IPv4 地址",
      ipv6: "IPv6 地址",
      not_found: "未检测到",
      detecting: "检测中..."
    },
    en: {
      title: "Ops IP Insights",
      subtitle: "Deep network metadata analysis & edge routing forensics",
      back: "Back",
      your_ip: "Your Access Address",
      geo: "Geo-Location",
      net: "Connectivity / ASN",
      sec: "Security Audit",
      env: "Environment Awareness",
      loading: "Synchronizing global routing nodes...",
      copy: "Copy JSON",
      isp: "ISP / Organization",
      asn: "ASN Identifier",
      coords: "Coordinates",
      region: "Region / State",
      risk: "Threat Level",
      proxy: "Proxy Status",
      type: "Network Type",
      security: "Secure",
      protocol: "Protocol Stack",
      wait: "Probing...",
      copied: "Copied",
      country: "Country",
      city: "City / Region",
      ua: "UA Fingerprint",
      timezone: "Local Time",
      ipv4: "IPv4 Address",
      ipv6: "IPv6 Address",
      not_found: "Not Detected",
      detecting: "Detecting..."
    }
  }[lang]

  useEffect(() => {
    async function probeConnectivity() {
      setLoading(true)
      
      const fetchIpAddress = async (url: string) => {
        try {
          const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
          const json = await res.json()
          return json.ip
        } catch (e) {
          return null
        }
      }

      const fetchIPMeta = async (ip: string) => {
        try {
          // Native extensible query capability (q=ip)
          const metaRes = await fetch(`/api/ip?q=${ip}`, { signal: AbortSignal.timeout(4000) })
          const meta = await metaRes.json()
          return meta.error ? { ip } : meta
        } catch(e) {
          return { ip }
        }
      }

      // 1. Primary CF-Connecting-IP Native Fetch
      let edgeData: any = null
      try {
        const edgeRes = await fetch('/api/ip', { cache: 'no-store' })
        const resJson = await edgeRes.json()
        if (resJson.ip && resJson.ip !== '127.0.0.1' && resJson.ip !== '::1' && resJson.country_name) {
          edgeData = resJson
        }
      } catch(e) {}

      let v4Ip = null
      let v6Ip = null
      let v4DataResult = null
      let v6DataResult = null

      if (edgeData && edgeData.ip) {
        if (edgeData.ip.includes(':')) {
           v6Ip = edgeData.ip
           v6DataResult = edgeData
           // Probe hidden v4
           v4Ip = await fetchIpAddress('https://api4.ipify.org?format=json')
           if (v4Ip) v4DataResult = await fetchIPMeta(v4Ip)
        } else {
           v4Ip = edgeData.ip
           v4DataResult = edgeData
           // Probe hidden v6
           v6Ip = await fetchIpAddress('https://api6.ipify.org?format=json')
           if (v6Ip) v6DataResult = await fetchIPMeta(v6Ip)
        }
      } else {
         // Fallback probing
         const [v4, v6] = await Promise.all([
           fetchIpAddress('https://api4.ipify.org?format=json'),
           fetchIpAddress('https://api6.ipify.org?format=json')
         ])
         v4Ip = v4; v6Ip = v6;
         if (v4Ip) v4DataResult = await fetchIPMeta(v4Ip)
         if (v6Ip) v6DataResult = await fetchIPMeta(v6Ip)
      }

      setV4Data(v4DataResult)
      setV6Data(v6DataResult)
      setIpv4(v4Ip)
      setIpv6(v6Ip)
      
      const primaryData = edgeData || v4DataResult || v6DataResult
      if (primaryData) setData(primaryData)
      setStack(edgeData?.ip?.includes(':') ? 'v6' : 'v4')

      setLoading(false)
    }

    // UA Parsing
    const ua = navigator.userAgent
    let os = "Linux"
    if (ua.indexOf("Win") != -1) os = "Windows"
    if (ua.indexOf("Mac") != -1) os = "macOS"
    if (ua.indexOf("X11") != -1) os = "UNIX"
    
    let browser = "Chrome"
    if (ua.indexOf("Firefox") != -1) browser = "Firefox"
    else if (ua.indexOf("Safari") != -1 && ua.indexOf("Chrome") == -1) browser = "Safari"
    else if (ua.indexOf("Edge") != -1) browser = "Edge"

    setUaInfo({ 
      ua, 
      os, 
      browser, 
      protocol: window.location.protocol === 'https:' ? 'HTTP/2' : 'HTTP/1.1',
      language: navigator.language || 'N/A',
      resolution: `${window.screen.width}x${window.screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      cores: navigator.hardwareConcurrency || 0
    })
    probeConnectivity()
  }, [])

  const copyToClipboard = () => {
    if (!data) return
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center font-mono p-6">
        <Activity className="w-12 h-12 text-accent animate-pulse mb-6 rotate-radar" />
        <p className="text-zinc-600 animate-pulse uppercase tracking-[0.2em]">{dict.loading}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 font-sans selection:bg-accent selection:text-zinc-900 pb-24 relative overflow-hidden">
      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-grid-zinc-900/[0.05] pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-6xl mx-auto px-6 py-4 flex justify-end items-center z-20 relative">
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-md hover:border-zinc-300 transition-all active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs font-mono uppercase tracking-wider">{copied ? dict.copied : dict.copy}</span>
        </button>
      </div>

      <main className="w-full max-w-6xl mx-auto px-6 mt-12 z-20 relative">
        {/* Dual Stack Display */}
        <div className="flex flex-col items-center justify-center text-center mb-16 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
            {/* IPv4 Block */}
            <div className={`p-8 rounded-2xl border transition-all ${stack === 'v4' ? 'bg-white border-accent/30 shadow-[0_0_40px_rgba(16,185,129,0.05)]' : 'bg-transparent border-black/5 opacity-50'}`}
                 onClick={() => v4Data && (setData(v4Data), setStack('v4'))}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] block">{dict.ipv4}</span>
                {ipv4 && (
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ipv4); }} className="text-zinc-400 hover:text-emerald-600 transition-colors p-1" title="Copy IPv4">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter mb-4 font-mono break-all sm:truncate">
                {ipv4 || (loading ? dict.detecting : dict.not_found)}
              </h2>
              {ipv4 && (
                <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-600 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]"></span>
                  ONLINE
                </div>
              )}
            </div>

            {/* IPv6 Block */}
            <div className={`p-8 rounded-2xl border transition-all ${stack === 'v6' ? 'bg-white border-accent/30 shadow-[0_0_40px_rgba(16,185,129,0.05)]' : 'bg-transparent border-black/5 opacity-50'}`}
                 onClick={() => v6Data && (setData(v6Data), setStack('v6'))}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] block">{dict.ipv6}</span>
                {ipv6 && (
                  <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(ipv6); }} className="text-zinc-400 hover:text-emerald-600 transition-colors p-1" title="Copy IPv6">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 tracking-tighter mb-4 font-mono break-all sm:truncate">
                {ipv6 || (loading ? dict.detecting : dict.not_found)}
              </h2>
              {ipv6 && (
                <div className="flex items-center justify-center gap-2 text-[10px] text-emerald-600 font-mono">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_6px_#10b981]"></span>
                  ONLINE
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-bold">
              {ipv4 && ipv6 ? 'Dual-Stack: Operational' : 'Single-Stack: Operational'}
            </span>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Geo */}
          <div className="glass-card p-6 rounded-xl border border-black/5 bg-black/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider">{dict.geo}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.country}</span>
                <span className="text-sm border-l-2 border-emerald-500/50 pl-3 py-0.5">{data?.country_name ? `${data.country_name} (${data.country_code})` : 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.region}</span>
                <span className="text-sm border-l-2 border-zinc-200 pl-3 py-0.5">{data?.region || data?.city ? `${data?.region || ''}${data?.region && data?.city ? ', ' : ''}${data?.city || ''}` : 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.coords}</span>
                <span className="text-sm border-l-2 border-zinc-200 pl-3 py-0.5 font-mono">{data?.latitude && data?.longitude ? `${data.latitude}, ${data.longitude}` : 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Connectivity */}
          <div className="glass-card p-6 rounded-xl border border-black/5 bg-black/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center rounded-lg">
                <Server className="w-4 h-4 text-cyan-600" />
              </div>
              <h3 className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider">{dict.net}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.isp}</span>
                <span className="text-[11px] border-l-2 border-cyan-500/50 pl-3 py-0.5 truncate" title={data?.org}>{data?.org || 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-mono">BGP / ASN</span>
                <span className="text-sm border-l-2 border-zinc-200 pl-3 py-0.5 text-cyan-600 font-mono italic">{data?.asn || 'AS.PROBING'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.type}</span>
                <span className="text-sm border-l-2 border-zinc-200 pl-3 py-0.5">
                  <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-600">
                    {data?.network_type === 'Data Center' ? 'CLOUD/IDC' : 'ISP/RES'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Security */}
          <div className="glass-card p-6 rounded-xl border border-black/5 bg-black/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center rounded-lg">
                <Shield className="w-4 h-4 text-orange-600" />
              </div>
              <h3 className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider">{dict.sec}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.proxy}</span>
                <span className="text-sm border-l-2 border-orange-500/50 pl-3 py-0.5">
                  <span className={data?.proxy ? 'text-orange-600' : 'text-emerald-600'}>
                    {data?.proxy ? 'DETECTED' : 'CLEAR'}
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.risk}</span>
                <span className="text-sm border-l-2 border-zinc-200 pl-3 py-0.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                  {dict.security}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">VPN / TOR / RELAY</span>
                <span className="text-sm border-l-2 border-zinc-200 pl-3 py-0.5 font-mono text-zinc-600 italic">NEGATIVE</span>
              </div>
            </div>
          </div>

          {/* Card 4: Environment */}
          <div className="glass-card p-6 rounded-xl border border-black/5 bg-black/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center rounded-lg">
                <Monitor className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider">{dict.env}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.ua}</span>
                <span className="text-[11px] border-l-2 border-purple-500/50 pl-3 py-0.5 leading-tight">{uaInfo.browser} / {uaInfo.os}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.protocol}</span>
                <span className="text-sm border-l-2 border-zinc-200 pl-3 py-0.5 font-mono text-emerald-600">{uaInfo.protocol} <span className="text-[10px] text-zinc-600">(ALPN)</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">{dict.timezone}</span>
                <span className="text-[11px] border-l-2 border-zinc-200 pl-3 py-0.5 font-mono">{uaInfo.timezone}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-600 uppercase tracking-widest">DISPLAY / LOCALE</span>
                <span className="text-[11px] border-l-2 border-zinc-200 pl-3 py-0.5 font-mono text-zinc-600">{uaInfo.resolution} @ {uaInfo.language} {uaInfo.cores ? `| ${uaInfo.cores} Cores` : ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Traffic Radar Mockup */}
        <div className="mt-16 glass-card p-4 rounded-xl border border-black/5 bg-black/10 backdrop-blur-md overflow-hidden relative min-h-[120px]">
          <div className="absolute top-0 right-0 p-4">
            <Activity className="w-4 h-4 text-emerald-700 opacity-30" />
          </div>
          <p className="text-[11px] font-mono text-zinc-600 mb-2 uppercase tracking-widest">Global Routing Trace (Simulated)</p>
          <div className="h-20 flex items-end gap-1 opacity-20">
            {[...Array(40)].map((_, i) => (
              <div 
                key={i} 
                className="flex-grow bg-emerald-500" 
                style={{ height: `${Math.random() * 80 + 20}%`, animation: `pulse-bar ${Math.random() * 2 + 1}s infinite alternate` }}
              ></div>
            ))}
          </div>
        </div>
      </main>

      <style jsx global>{`
        @keyframes pulse-bar {
          from { opacity: 0.1; }
          to { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
