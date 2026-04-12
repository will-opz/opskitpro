'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { 
  Globe, 
  ShieldCheck, 
  MapPin, 
  Activity, 
  Server, 
  Zap, 
  Copy, 
  Check, 
  ChevronDown, 
  Search,
  ArrowRight,
  Cpu,
  Monitor,
  Navigation
} from 'lucide-react'

interface IPData {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  latitude: string | number;
  longitude: string | number;
  timezone: string;
  asn: string;
  org: string;
  network_type?: string;
  proxy?: boolean;
}

export default function IPClient({ dict, lang }: { dict: any; lang: 'zh' | 'en' | 'ja' | 'tw' }) {
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<IPData | null>(null)
  const [inputIp, setInputIp] = useState('')
  const [copied, setCopied] = useState(false)
  const [showJson, setShowJson] = useState(false)

  const fetchIP = useCallback(async (target?: string) => {
    setLoading(true)
    try {
      const q = target || ''
      const res = await fetch(`/api/ip?q=${encodeURIComponent(q)}`)
      const result = await res.json()
      setData(result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const q = searchParams.get('q') || ''
    if (q) setInputIp(q)
    fetchIP(q)
  }, [searchParams, fetchIP])

  const formatCoords = (lat: string | number, lon: string | number) => {
    const la = parseFloat(String(lat))
    const lo = parseFloat(String(lon))
    if (isNaN(la) || isNaN(lo)) return 'N/A'
    const latDir = la >= 0 ? 'N' : 'S'
    const lonDir = lo >= 0 ? 'E' : 'W'
    return `${Math.abs(la).toFixed(4)}°${latDir} / ${Math.abs(lo).toFixed(4)}°${lonDir}`
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchIP(inputIp)
  }

  const copyResult = (text?: string) => {
    const content = text || JSON.stringify(data, null, 2)
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!dict || (loading && !data)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center font-mono animate-in fade-in duration-700">
        <div className="relative mb-8">
           <Activity className="w-12 h-12 text-purple-500 animate-pulse relative z-10" />
           <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
        </div>
        <p className="text-zinc-400 uppercase tracking-[0.5em] text-[10px] font-black italic">Locating_Global_Route...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 font-mono pb-32">
       {/* Background */}
       <div className="fixed inset-0 bg-[#fafafa] -z-10" />
       <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full -z-10" />

       {/* Header */}
       <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
             <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-zinc-900 tracking-tighter italic mb-4 leading-none lowercase">
                IP_INSIGHTS<span className="text-purple-500 tracking-widest">_</span>
             </h1>
             <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">ASN Forensics & Geolocation Intelligence</p>
          </div>
          
          <form onSubmit={handleSearch} className="relative group w-full md:w-auto sm:min-w-[320px]">
             <div className="absolute inset-0 bg-purple-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <div className="relative flex items-center bg-white border border-black/5 p-1.5 rounded-2xl shadow-xl focus-within:ring-2 focus-within:ring-purple-500/20 transition-all">
                <input 
                  type="text" 
                  value={inputIp}
                  onChange={(e) => setInputIp(e.target.value)}
                  placeholder={dict.tools.ip.ip_placeholder}
                  className="flex-grow bg-transparent border-none outline-none text-zinc-900 px-4 text-sm"
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-purple-500/30"
                >
                   {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                   {dict.tools.ip.ip_btn}
                </button>
             </div>
          </form>
       </div>

       {data && (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Main HUD */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
               <div className="md:col-span-8 bg-white border border-black/5 p-6 sm:p-10 rounded-[2.5rem] shadow-sm relative group overflow-hidden">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                     <Globe className="w-32 h-32" />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row items-baseline gap-4 mb-12">
                     <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter italic leading-none truncate max-w-full">
                        {data.ip}
                     </h1>
                     <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${data.proxy ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {data.proxy ? 'PROXY_DETECTED' : 'DIRECT_NODE'}
                     </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-8">
                     <div>
                        <p className="text-[9px] text-zinc-400 mb-1 uppercase font-bold tracking-widest">{dict.tools.ip.country}</p>
                        <p className="text-lg font-black text-zinc-900 flex items-center gap-2 truncate whitespace-nowrap overflow-hidden">
                           <span className="text-xl">📍</span> {data.country_name}
                        </p>
                     </div>
                     <div>
                        <p className="text-[9px] text-zinc-400 mb-1 uppercase font-bold tracking-widest">{dict.tools.ip.city}</p>
                        <p className="text-lg font-black text-zinc-900 leading-tight">
                           {data.city}<br/><span className="text-[10px] opacity-40">{data.region}</span>
                        </p>
                     </div>
                     <div className="col-span-2 md:col-span-1 border-t md:border-t-0 md:border-l border-zinc-100 md:pl-8 pt-4 md:pt-0">
                        <p className="text-[9px] text-zinc-400 mb-1 uppercase font-bold tracking-widest">ISP / Provider</p>
                        <p className="text-sm font-bold text-zinc-900 leading-snug">{data.org}</p>
                        <p className="text-[9px] text-purple-500 mt-2 font-black italic">{data.asn}</p>
                     </div>
                  </div>
               </div>

               {/* Map Placeholder HUD */}
               <div className="md:col-span-4 bg-zinc-900 border border-zinc-800 p-6 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col items-center justify-center group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent)] opacity-50"></div>
                  {/* Radar Scanner Effect */}
                  <div className="relative w-40 h-40 border-2 border-purple-500/20 rounded-full flex items-center justify-center animate-pulse">
                     <div className="absolute inset-0 border border-purple-500/10 rounded-full animate-ping"></div>
                     <div className="w-px h-1/2 bg-gradient-to-t from-purple-500 to-transparent origin-bottom animate-[spin_4s_linear_infinite]" style={{ transformOrigin: 'center bottom' }}></div>
                     <MapPin className="w-8 h-8 text-purple-500 relative z-20 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
                     {/* Static Dots */}
                     <div className="absolute top-1/4 right-1/4 w-1.5 h-1.5 bg-emerald-400 rounded-full blur-[1px]"></div>
                     <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-purple-400 rounded-full blur-[1px]"></div>
                  </div>
                  <div className="mt-8 text-center relative z-10">
                     <div className="text-[10px] text-zinc-500 uppercase tracking-[0.4em] font-bold mb-2">Geolocation_Locked</div>
                     <div className="text-xs font-mono text-white/80">
                        {formatCoords(data.latitude, data.longitude)}
                     </div>
                  </div>
               </div>
            </div>

            {/* Matrix Data Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white border border-black/5 p-8 rounded-3xl shadow-sm group hover:shadow-xl transition-all">
                   <div className="flex items-center justify-between mb-8 opacity-40 group-hover:opacity-100 transition-opacity">
                      <ShieldCheck className="w-5 h-5 text-zinc-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Security_Audit</span>
                   </div>
                   <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">{dict.tools.ip.risk}</h4>
                   <div className="space-y-6">
                      <div className="flex items-center justify-between bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                         <span className="text-xs font-bold text-zinc-600">Proxy Status</span>
                         <span className={`text-[10px] font-black uppercase italic ${data.proxy ? 'text-red-500' : 'text-emerald-500'}`}>
                            {data.proxy ? 'ACTIVE' : 'CLEAN'}
                         </span>
                      </div>
                      <div className="flex items-center justify-between px-2">
                         <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{dict.tools.ip.safe}</span>
                         <div className="w-12 bg-zinc-100 h-1 rounded-full overflow-hidden">
                            <div className={`h-full ${data.proxy ? 'bg-orange-500 w-1/2' : 'bg-emerald-500 w-full'}`}></div>
                         </div>
                      </div>
                   </div>
               </div>

               <div className="bg-white border border-black/5 p-8 rounded-3xl shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-8 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Zap className="w-5 h-5 text-zinc-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Network_Latency</span>
                   </div>
                   <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">EDGE_NODE</h4>
                   <div className="space-y-6">
                      <div>
                         <p className="text-xl font-black text-zinc-900 leading-none">{data.network_type || 'Residential'}</p>
                         <p className="text-[9px] text-zinc-400 mt-2 font-mono uppercase tracking-[0.2em]">{data.timezone}</p>
                      </div>
                      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
                         <span className="text-[10px] text-zinc-400">OPTIMIZED</span>
                         <span className="text-[10px] font-black text-purple-500 uppercase italic">TLS_1.3_Ready</span>
                      </div>
                   </div>
               </div>

               <div className="bg-white border border-black/5 p-8 rounded-3xl shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex items-center justify-between mb-8 opacity-40 group-hover:opacity-100 transition-opacity">
                      <Copy className="w-5 h-5 text-zinc-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Data_Exchange</span>
                   </div>
                   <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-4">QUICK_COPY</h4>
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => copyResult(data.ip)} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center justify-center gap-2">
                         {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Monitor className="w-3 h-3" />} IP
                      </button>
                      <button onClick={() => copyResult(`${data.city}, ${data.country_name}`)} className="p-3 bg-zinc-50 border border-zinc-100 rounded-xl text-[10px] font-bold text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all flex items-center justify-center gap-2">
                         {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Navigation className="w-3 h-3" />} GEO
                      </button>
                   </div>
                   <button onClick={() => copyResult()} className="w-full mt-3 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl text-[10px] font-black tracking-widest uppercase hover:from-purple-400 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {dict.tools.ip.ip_btn_copy || 'COPY_ALL_DATA'}
                   </button>
               </div>
            </div>

            {/* Collapsible JSON Audit */}
            <div className="mt-16 border-t border-zinc-100 pt-16">
               <button 
                   onClick={() => setShowJson(!showJson)}
                   className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest mb-6"
                >
                   <ChevronDown className={`w-3 h-3 transition-transform ${showJson ? 'rotate-180' : ''}`} />
                   RAW_FORENSIC_JSON_PAYLOAD
                </button>
                {showJson && (
                 <div className="bg-zinc-900 rounded-[2.5rem] p-10 text-[11px] text-zinc-400 overflow-x-auto border border-zinc-800 shadow-2xl relative">
                    <div className="absolute top-8 right-8">
                       <button onClick={() => copyResult()} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                       </button>
                    </div>
                    <pre className="font-mono leading-relaxed pt-4">
                       {JSON.stringify(data, null, 2)}
                    </pre>
                 </div>
               )}
            </div>
         </div>
       )}
    </div>
  )
}
