'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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
  Database
} from 'lucide-react'

interface DiagnosticStep {
  id: string;
  label: string;
}

export default function WebsiteCheckClient({ dict }: { dict: any }) {
  const searchParams = useSearchParams()
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  const steps: DiagnosticStep[] = useMemo(() => [
    { id: 'whois', label: dict.tools.website_check.l0 || 'WHOIS Registry' },
    { id: 'dns', label: dict.tools.website_check.l1 },
    { id: 'server', label: dict.tools.website_check.l2 },
    { id: 'ssl', label: dict.tools.website_check.l3 },
    { id: 'cdn', label: dict.tools.website_check.l4 }
  ], [dict])

  const runDiagnostic = useCallback(async (target?: string) => {
    const d = target || domain
    if (!d) return

    setLoading(true)
    setError(null)
    setResult(null)
    setCurrentStep(0)

    // Sequential loading animation
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < steps.length ? prev + 1 : prev))
    }, 800)

    try {
      const res = await fetch(`/api/diagnostic?domain=${encodeURIComponent(d)}`)
      
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
  }, [domain, steps])

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('domain')
    if (q) {
      setDomain(q)
      runDiagnostic(q)
    }
  }, [searchParams, runDiagnostic])

  const parseLatencyMs = (latency: string | number): number => {
    if (typeof latency === 'number') return latency
    return parseInt(String(latency).replace('ms', ''), 10) || 0
  }

  const calculateScore = (data: any) => {
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

  const copyResult = () => {
    if (!result) return
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getAdvice = (data: any) => {
    const advice = []
    if (!data.http.success) {
      advice.push(dict.home.scenes.s1_desc)
    }
    if (data.http.status_code === 502) {
      advice.push("Cloudflare 502 detected. Check upstream Nginx/Apache service.")
    }
    if (!data.ssl.valid) {
      advice.push("SSL Cert expired or invalid. Traffic may be intercepted.")
    }
    if (parseLatencyMs(data.dns.latency) > 500) {
      advice.push("Slow DNS resolution. Recommend Cloudflare DoH (1.1.1.1).")
    }
    return advice
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    runDiagnostic()
  }

  // Memoize advice to avoid computing it twice in render
  const adviceList = useMemo(() => (result ? getAdvice(result) : []), [result])

  return (
    <main className="w-full max-w-6xl mx-auto px-6 mt-12 mb-32 z-20 relative font-mono">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      {/* Hero Header */}
      <div className="text-center mb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black text-zinc-900 tracking-tighter italic mb-6 break-words">
           {dict.tools.diagnostic_title}<span className="text-emerald-500">.exe</span>
        </h1>
        <p className="text-zinc-500 text-xs sm:text-sm uppercase tracking-[0.3em] font-light max-w-2xl mx-auto mb-10">
           Real-time Global Edge Diagnostic & Network Forensics
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
                 placeholder={dict.home.diagnostics_placeholder}
                 className="flex-grow bg-transparent border-none outline-none text-zinc-900 text-lg px-2"
               />
               <button 
                 type="submit"
                 disabled={loading}
                 className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50"
               >
                 {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                 {loading ? 'ANALYZING' : dict.home.diagnostics_btn}
               </button>
            </div>
          </form>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="max-w-2xl mx-auto space-y-3 animate-in fade-in duration-300">
           {steps.map((step, idx) => (
             <div
               key={step.id}
               className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                 currentStep > idx
                   ? 'bg-emerald-50/60 border-emerald-200/60'
                   : currentStep === idx
                   ? 'bg-white border-emerald-300/50 shadow-md shadow-emerald-500/5'
                   : 'bg-white/50 border-black/5'
               }`}
             >
                <div className="flex items-center gap-4">
                   <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                     currentStep > idx
                       ? 'bg-emerald-500'
                       : currentStep === idx
                       ? 'bg-white border-2 border-emerald-400 shadow-sm'
                       : 'bg-zinc-100 border border-zinc-200'
                   }`}>
                      {currentStep > idx
                        ? <CheckCircle2 className="w-4 h-4 text-white" />
                        : currentStep === idx
                        ? <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        : <div className="w-2 h-2 rounded-full bg-zinc-300" />
                      }
                   </div>
                   <span className={`text-sm font-mono transition-colors ${
                     currentStep >= idx ? 'text-zinc-900 font-bold' : 'text-zinc-400'
                   }`}>{step.label}</span>
                </div>
                {currentStep === idx && (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="inline-block w-1 h-1 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                {currentStep > idx && (
                  <span className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">Done</span>
                )}
             </div>
           ))}
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="max-w-2xl mx-auto p-10 bg-red-50 border border-red-100 rounded-[2.5rem] text-red-600 flex items-start gap-6 animate-in fade-in slide-in-from-top-4">
           <AlertCircle className="w-10 h-10 shrink-0" />
           <div>
              <h3 className="text-xl font-black italic uppercase tracking-tight mb-2">SYSTEM_FAULT_DETECTED</h3>
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
                   <h2 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">GLOBAL_SYSTEM_SCORE</h2>
                   <h1 className={`text-2xl sm:text-3xl font-black italic tracking-tighter uppercase ${result.http.success && !result.whois?.status?.toLowerCase().includes('hold') ? 'text-zinc-900' : 'text-red-600'}`}>
                     {result.http.success && !result.whois?.status?.toLowerCase().includes('hold') ? dict.tools.website_check.summary_good : dict.tools.website_check.summary_bad}
                   </h1>
                 </div>
              </div>
              <button onClick={copyResult} className="relative z-10 flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest bg-zinc-50 py-3 px-6 rounded-full border border-black/5 hover:bg-zinc-100 w-full md:w-auto shrink-0">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? 'COPIED' : 'COPY_AUDIT'}
              </button>
           </div>

           {/* Detection Steps Pipeline */}
           <div className="space-y-4 mb-10">
              
              {/* Step 1: WHOIS */}
              <div className="bg-white border border-black/5 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row gap-6 lg:gap-12 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-2 md:border-r border-zinc-100 pr-6">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Step 01</span>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">WHOIS Registry</span>
                  </div>
                </div>
                <div className="flex-grow">
                  {!result.whois?.success && result.whois?.error ? (
                    <div className="w-full h-full flex flex-col justify-center">
                       <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Diagnostic Exception</p>
                       <p className="text-sm font-black text-red-500 uppercase italic">
                         RDAP_FAULT: {result.whois.error}
                       </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Registrar</p>
                        <p className={`text-sm font-black truncate ${result.whois?.success ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {result.whois?.success ? result.whois.registrar : 'NO_INFO'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Registered On</p>
                        <p className="text-sm font-mono text-zinc-700">{result.whois?.success ? result.whois.registered : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Expires On</p>
                        <p className="text-sm font-mono text-zinc-700">{result.whois?.success ? result.whois.expires : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Domain Status</p>
                        <p className={`text-sm font-black uppercase italic truncate ${
                            result.whois?.status?.toLowerCase().includes('hold') ? 'text-red-500' : 'text-emerald-500'
                        }`} title={result.whois?.status || 'Unknown'}>
                            {(() => {
                              if (!result.whois?.status) return 'Active'
                              const holds = result.whois.status.split(',').map((s: string) => s.trim()).filter((s: string) => s.toLowerCase().includes('hold'))
                              if (holds.length > 0) return holds.join(', ')
                              return result.whois.status.split(',')[0]
                            })()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2: DNS */}
              <div className="bg-white border border-black/5 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row gap-6 lg:gap-12 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-2 md:border-r border-zinc-100 pr-6">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Step 02</span>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">DNS Resolution</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Resolved IP(s)</p>
                    <p className="text-sm font-black text-zinc-900 truncate" title={result.dns.all_ips?.join(', ')}>
                         {result.dns.all_ips && result.dns.all_ips.length > 1 
                           ? `${result.dns.all_ips.length} ANYCAST IPs` 
                           : result.dns.resolved_ip}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                        {result.dns.resolvers?.map((r: any) => (
                           <div key={r.name} className="flex items-center gap-1.5" title={`${r.name}: ${r.status}`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                              <span className="text-[9px] font-bold text-zinc-400 uppercase">{r.name}</span>
                           </div>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Lookup Latency</p>
                    <p className="text-sm font-mono text-emerald-600 flex items-center gap-1">
                      <Activity className="w-3 h-3" /> {result.dns.latency}
                    </p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Nameservers</p>
                    <div className="flex flex-col gap-0.5 max-h-[60px] overflow-y-auto pr-1 overflow-x-hidden">
                        {(() => {
                           const combined = Array.from(new Set([...(result.dns.ns || []), ...(result.whois?.nameservers || [])]))
                               .map(s => s.toLowerCase().replace(/\.$/, ''))
                           return combined.length > 0 
                             ? combined.map(ns => (
                                 <p key={ns} className="text-[11px] font-black text-zinc-500 uppercase italic truncate" title={ns}>{ns}</p>
                               ))
                             : <p className="text-sm font-black text-zinc-400 uppercase italic">Unknown</p>
                        })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Server HTTP */}
              <div className={`p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row gap-6 lg:gap-12 shadow-sm hover:shadow-md transition-all ${result.http.success ? 'bg-white border-black/5' : 'bg-red-50 border-red-100'}`}>
                <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-2 md:border-r border-zinc-100 pr-6">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Step 03</span>
                  <div className="flex items-center gap-2">
                    <Server className={`w-4 h-4 ${result.http.success ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Server Response</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Availability</p>
                    <p className={`text-sm font-black ${result.http.success ? 'text-emerald-500' : 'text-red-500'}`}>
                      {result.http.success ? 'NOMINAL' : 'UNREACHABLE'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Response Code</p>
                    <p className={`text-sm font-black ${result.http.success ? 'text-zinc-900' : 'text-red-500'}`}>
                      {result.http.status_code || 'Err'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Protocol</p>
                    <p className="text-sm font-mono text-zinc-700">{result.http.is_https ? 'HTTPS' : 'HTTP/TCP'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Response Time</p>
                    <p className="text-sm font-mono text-zinc-900 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-500" /> {result.http.latency}
                     </p>
                  </div>
                </div>
              </div>

              {/* Step 4: SSL */}
              <div className="bg-white border border-black/5 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row gap-6 lg:gap-12 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-2 md:border-r border-zinc-100 pr-6">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Step 04</span>
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${result.ssl.valid ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">SSL Security</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Cert Status</p>
                    <p className={`text-sm font-black ${result.ssl.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                      {result.ssl.valid ? 'VALID' : 'FAULT'}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Issuer Authority</p>
                    <p className="text-sm font-mono text-zinc-700 truncate" title={result.ssl.issuer}>{result.ssl.issuer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Expiry Date</p>
                    <p className="text-sm font-mono text-zinc-700">{result.ssl.expiry}</p>
                  </div>
                </div>
              </div>

              {/* Step 5: CDN */}
              <div className="bg-white border border-black/5 p-6 sm:p-8 rounded-3xl flex flex-col md:flex-row gap-6 lg:gap-12 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-48 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-4 md:gap-2 md:border-r border-zinc-100 pr-6">
                  <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Step 05</span>
                  <div className="flex items-center gap-2">
                    <Cloud className={`w-4 h-4 ${result.cdn.is_provider ? 'text-emerald-500' : 'text-zinc-400'}`} />
                    <span className="text-sm font-bold text-zinc-900 uppercase tracking-widest">Edge CDN</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Provider Infrastructure</p>
                    <p className="text-sm font-black text-zinc-900 truncate">{result.cdn.provider}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Edge Routing</p>
                    <p className={`text-sm font-black uppercase italic ${result.cdn.is_provider ? 'text-orange-500' : 'text-zinc-400'}`}>
                      {result.cdn.is_provider ? 'PROXIED' : 'DIRECT'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 uppercase font-bold mb-2">Server Header</p>
                    <p className="text-sm font-mono text-zinc-700 truncate">{result.cdn.server}</p>
                  </div>
                </div>
              </div>

           </div>

           {/* Suggestions & Advice Section */}
           <div className="bg-orange-50 border border-orange-100 rounded-[2.5rem] p-6 sm:p-10 md:p-16">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600">
                    <ShieldAlert className="w-6 h-6" />
                 </div>
                 <div>
                    <h3 className="text-2xl font-black italic text-orange-900 tracking-tight">{dict.tools.website_check.advice_title}</h3>
                    <p className="text-xs text-orange-700 font-mono opacity-60 uppercase tracking-widest">SRE Mitigation Strategies</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-4">
                    {adviceList.length > 0 ? adviceList.map((advice, i) => (
                      <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-orange-200 shadow-sm relative group overflow-hidden">
                         <div className="absolute inset-y-0 left-0 w-1 bg-orange-500"></div>
                         <div className="flex-grow">
                            <p className="text-sm font-bold text-zinc-900 mb-1">{advice}</p>
                            <p className="text-[10px] text-zinc-400 font-mono uppercase">Critical_Action_Item</p>
                         </div>
                      </div>
                    )) : (
                      <div className="p-10 bg-emerald-50/50 border border-emerald-100 rounded-3xl text-emerald-700 text-center">
                         <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-50" />
                         <span className="text-sm font-bold block uppercase tracking-tight">Optimal Configuration Detected</span>
                         <span className="text-[10px] opacity-60 font-mono mt-2 block">No immediate mitigation required.</span>
                      </div>
                    )}
                 </div>
                 <div className="bg-orange-900/5 border border-orange-200 rounded-3xl p-8">
                    <h5 className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-6">NEXT_PITCH_FORENSICS</h5>
                    <div className="space-y-3">
                       <Link href={`/tools/ip-lookup?q=${result.dns.resolved_ip}`} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-black/5 hover:border-orange-400 hover:-translate-y-1 transition-all group shadow-sm">
                          <span className="text-sm font-bold text-zinc-900 italic">IP_ANALYTICS</span>
                          <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                       </Link>
                       <Link href={`/tools/dns-lookup?q=${domain}`} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-black/5 hover:border-orange-400 hover:-translate-y-1 transition-all group shadow-sm">
                          <span className="text-sm font-bold text-zinc-900 italic">DNS_RECORDS_AUDIT</span>
                          <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                       </Link>
                    </div>
                 </div>
              </div>
           </div>

           {/* JSON Audit View */}
           <div className="mt-20">
              <button 
                 onClick={() => setShowJson(!showJson)}
                 className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest mb-6"
              >
                 <ChevronDown className={`w-3 h-3 transition-transform ${showJson ? 'rotate-180' : ''}`} />
                 ROOT_JSON_PAYLOAD_EXCHANGE
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
        </div>
      )}

      {/* Hero-State Empty View */}
      {!result && !loading && (
        <div className="max-w-2xl mx-auto mt-24 p-16 rounded-[3rem] border border-dashed border-zinc-200 bg-white/40 text-center animate-in fade-in duration-1000">
            <Search className="w-16 h-16 text-zinc-100 mx-auto mb-8 animate-pulse" />
            <p className="text-zinc-500 text-xs leading-relaxed font-mono uppercase tracking-[0.4em] opacity-40">
              Global_Edge_Probe • DNS_Forensics • SSL_Chain • HTTP_Header_Analytics
            </p>
        </div>
      )}
    </main>
  )
}
