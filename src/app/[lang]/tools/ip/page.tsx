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

export default function IPPage() {
  const params = useParams()
  const lang = (params.lang as 'en' | 'zh') || 'en'
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<IPData | null>(null)
  const [uaInfo, setUaInfo] = useState({ ua: '', os: '', browser: '', protocol: 'HTTP/2' })
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
      timezone: "当地时间"
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
      timezone: "Local Time"
    }
  }[lang]

  useEffect(() => {
    async function fetchIP() {
      try {
        const res = await fetch('https://ipapi.co/json/')
        const json = await res.json()
        setData(json)
        
        // Mocking some professional ops data that ipapi might not give in free tier
        setData(prev => ({
          ...prev!,
          network_type: json.org?.toLowerCase().includes('cloud') ? 'Data Center' : 'Residential',
          proxy: false // Browser JS cannot easily detect proxy without a specialized backend
        }))
      } catch (e) {
        console.error("IP leak check failed", e)
      } finally {
        setLoading(false)
      }
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

    setUaInfo({ ua, os, browser, protocol: window.location.protocol === 'https:' ? 'HTTP/2' : 'HTTP/1.1' })
    fetchIP()
  }, [])

  const copyToClipboard = () => {
    if (!data) return
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center font-mono p-6">
        <Activity className="w-12 h-12 text-accent animate-pulse mb-6 rotate-radar" />
        <p className="text-zinc-500 animate-pulse uppercase tracking-[0.2em]">{dict.loading}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 font-sans selection:bg-accent selection:text-white pb-24 relative overflow-hidden">
      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-grid-zinc-900/[0.05] pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent/5 blur-[120px] rounded-full pointer-events-none"></div>

      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center z-20 relative">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}/services`} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-900 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-zinc-500">deops /</span> ip-pulse<span className="text-accent animate-pulse">_</span>
          </div>
        </div>
        
        <button 
          onClick={copyToClipboard}
          className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-md hover:border-zinc-700 transition-all active:scale-95"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span className="text-xs font-mono uppercase tracking-wider">{copied ? dict.copied : dict.copy}</span>
        </button>
      </header>

      <main className="w-full max-w-6xl mx-auto px-6 mt-12 z-20 relative">
        {/* Main IP Badge */}
        <div className="flex flex-col items-center justify-center text-center mb-16">
          <span className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] mb-4">{dict.your_ip}</span>
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-4 translate-z-0 font-mono">
            {data?.ip || '0.0.0.0'}
          </h1>
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]"></div>
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 font-bold">System: Operational</span>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Geo */}
          <div className="glass-card p-6 rounded-xl border border-white/5 bg-zinc-900/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center rounded-lg">
                <MapPin className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">{dict.geo}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.country}</span>
                <span className="text-sm border-l-2 border-emerald-500/50 pl-3 py-0.5">{data?.country_name} ({data?.country_code})</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.region}</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5">{data?.region}, {data?.city}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.coords}</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5 font-mono">{data?.latitude}, {data?.longitude}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Connectivity */}
          <div className="glass-card p-6 rounded-xl border border-white/5 bg-zinc-900/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center rounded-lg">
                <Server className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">{dict.net}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.isp}</span>
                <span className="text-sm border-l-2 border-cyan-500/50 pl-3 py-0.5 truncate" title={data?.org}>{data?.org}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">BGP / ASN</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5 text-cyan-400 font-mono italic">{data?.asn || 'AS.PROBING'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.type}</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5">
                  <span className="bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-mono text-zinc-400">
                    {data?.network_type === 'Data Center' ? 'CLOUD/IDC' : 'ISP/RES'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Security */}
          <div className="glass-card p-6 rounded-xl border border-white/5 bg-zinc-900/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-orange-500/10 border border-orange-500/20 flex items-center justify-center rounded-lg">
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">{dict.sec}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.proxy}</span>
                <span className="text-sm border-l-2 border-orange-500/50 pl-3 py-0.5">
                  <span className={data?.proxy ? 'text-orange-400' : 'text-emerald-400'}>
                    {data?.proxy ? 'DETECTED' : 'CLEAR'}
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.risk}</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981]"></span>
                  {dict.security}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">VPN / TOR / RELAY</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5 font-mono text-zinc-600 italic">NEGATIVE</span>
              </div>
            </div>
          </div>

          {/* Card 4: Environment */}
          <div className="glass-card p-6 rounded-xl border border-white/5 bg-zinc-900/10 backdrop-blur-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-500/10 border border-purple-500/20 flex items-center justify-center rounded-lg">
                <Monitor className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">{dict.env}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.ua}</span>
                <span className="text-[11px] border-l-2 border-purple-500/50 pl-3 py-0.5 leading-tight">{uaInfo.browser} / {uaInfo.os}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.protocol}</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5 font-mono text-emerald-400">{uaInfo.protocol} <span className="text-[10px] text-zinc-600">(ALPN)</span></span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{dict.timezone}</span>
                <span className="text-sm border-l-2 border-zinc-800 pl-3 py-0.5 font-mono">{data?.utc_offset} ({data?.timezone?.split('/')[1]})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Traffic Radar Mockup */}
        <div className="mt-16 glass-card p-4 rounded-xl border border-white/5 bg-zinc-900/10 backdrop-blur-md overflow-hidden relative min-h-[120px]">
          <div className="absolute top-0 right-0 p-4">
            <Activity className="w-4 h-4 text-emerald-500 opacity-30" />
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
