'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
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
  Cpu
} from 'lucide-react'
import { useDnsLookup, type DnsRecordType, type DnsProvider } from './hooks'

export default function DnsClient() {
  const { 
    loading, 
    result, 
    error, 
    lookup, 
    history 
  } = useDnsLookup()

  const params = useParams()
  const searchParams = useSearchParams()
  const lang = (params.lang as 'en' | 'zh') || 'zh'
  
  const [domain, setDomain] = useState('')
  const [selectedType, setSelectedType] = useState<DnsRecordType>('A')
  const [selectedProvider, setSelectedProvider] = useState<DnsProvider>('cloudflare')
  const [dict, setDict] = useState<any>(null)
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)

  const recordTypes: DnsRecordType[] = ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT', 'CAA']
  const providers: { id: DnsProvider; name: string }[] = [
    { id: 'cloudflare', name: 'Cloudflare (1.1.1.1)' },
    { id: 'google', name: 'Google (8.8.8.8)' },
    { id: 'quad9', name: 'Quad9 (9.9.9.9)' }
  ]

  useEffect(() => {
    import(`@/dictionaries/${lang}.json`).then(d => setDict(d.default))
  }, [lang])

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('domain')
    if (q) {
      setDomain(q)
      lookup(q, selectedType, selectedProvider)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // intentionally run only on URL param change

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!domain) return
    lookup(domain, selectedType, selectedProvider)
  }

  const copyData = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!dict) return (
     <div className="min-h-[60vh] flex flex-col items-center justify-center font-mono">
        <Activity className="w-10 h-10 text-orange-500 animate-pulse mb-6" />
        <p className="text-zinc-400 uppercase tracking-widest text-[10px]">INIT_DNS_ENVIRONMENT...</p>
     </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 font-mono pb-32">
       {/* Breadcrumbs */}
       <nav className="flex items-center gap-2 mb-12 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          <Link href="/" className="hover:text-zinc-900 transition-colors">ROOT</Link>
          <span>/</span>
          <span className="text-zinc-900 border-b border-orange-500/50">DNS_FORENSICS</span>
       </nav>

       {/* Header */}
       <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left">
             <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-zinc-900 tracking-tighter italic mb-4 leading-none lowercase break-words">
                DNS_QUERIES<span className="text-orange-500 tracking-widest">_</span>
             </h1>
             <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Deep propagation analysis & RDATA extraction</p>
          </div>
       </div>

       {/* Control Center */}
       <div className="bg-white border border-black/5 rounded-[2.5rem] p-3 shadow-2xl mb-16 relative group">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
             <div className="flex-grow flex items-center px-6 py-4">
                <Globe className="w-5 h-5 text-zinc-400 mr-4 group-focus-within:text-orange-500 transition-colors" />
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
                     className="bg-transparent text-xs font-black outline-none cursor-pointer text-zinc-600 appearance-none uppercase italic"
                   >
                      {recordTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="flex items-center gap-3 px-4">
                   <Server className="w-4 h-4 text-zinc-400" />
                   <select 
                     value={selectedProvider}
                     onChange={(e) => setSelectedProvider(e.target.value as DnsProvider)}
                     className="bg-transparent text-[10px] font-bold outline-none cursor-pointer text-zinc-500 appearance-none uppercase"
                   >
                      {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                   </select>
                   <ChevronDown className="w-3 h-3 text-zinc-300" />
                </div>
             </div>

             <button 
               type="submit"
               disabled={loading}
               className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-[2rem] transition-all flex items-center justify-center gap-3 font-bold shadow-lg shadow-orange-500/30 disabled:opacity-50 group/btn"
             >
                {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                <span className="tracking-widest uppercase">{dict.tools.dns.btn}</span>
             </button>
          </form>
       </div>

       {error && (
         <div className="mb-12 p-10 bg-red-50 border border-red-100 rounded-[2.5rem] text-red-600 flex items-start gap-6 animate-in fade-in slide-in-from-top-4">
            <AlertCircle className="w-8 h-8 shrink-0" />
            <div>
               <h3 className="text-xl font-black italic uppercase tracking-tight mb-2">QUERY_EXCEPTION</h3>
               <p className="text-sm opacity-80 leading-relaxed uppercase">{error}</p>
            </div>
         </div>
       )}

       {result && (
         <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Quick Stats Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40 group relative overflow-hidden transition-all hover:shadow-xl">
                  <div className="absolute top-0 right-0 p-8 scale-150 opacity-[0.03] group-hover:opacity-10 transition-transform">
                     <ShieldCheck className="w-12 h-12" />
                  </div>
                  <span className="text-[10px] text-zinc-400 uppercase tracking-[0.3em] font-bold">Resolver_Link</span>
                  <div className="flex items-center gap-3 relative z-10">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                     <span className="text-2xl font-black italic text-emerald-500 uppercase tracking-tighter">SECURED_DOH</span>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-[0.3em] font-bold">Response_Time</span>
                  <div>
                     <div className="text-4xl font-black text-zinc-900 tracking-tighter">{result.responseTime}</div>
                     <div className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mt-1">Milliseconds_ETA</div>
                  </div>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-[0.3em] font-bold">Protocol_Gate</span>
                  <div className="text-xl font-black text-zinc-900 uppercase italic">TLS_1.3 / ECH</div>
               </div>
               <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-black/5 flex flex-col justify-between h-40">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-[0.3em] font-bold">Record_Class</span>
                  <div className="text-4xl font-black text-orange-600 italic tracking-tighter underline decoration-2 underline-offset-8 decoration-orange-500/30">{result.type}</div>
               </div>
            </div>

            {/* Answer Manifest Matrix */}
            <div className="bg-white border border-black/5 rounded-[2.5rem] overflow-hidden shadow-sm transition-all hover:shadow-xl">
               <div className="px-6 sm:px-10 py-6 bg-zinc-50 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-3">
                     <Database className="w-4 h-4 text-orange-500" /> Resolution_Manifest_JSON
                  </h3>
                  <button onClick={() => copyData(JSON.stringify(result.answers))} className="text-[10px] font-bold text-zinc-400 hover:text-orange-600 flex items-center gap-2 group transition-colors">
                     {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 group-hover:scale-110" />}
                     {copied ? 'PAYLOAD_COPIED' : 'COPY_ALL_RDATA'}
                  </button>
               </div>
               
               <div className="divide-y divide-zinc-50">
                  {result.answers.length > 0 ? result.answers.map((answer, idx) => (
                    <div key={idx} className="p-6 sm:p-10 hover:bg-zinc-50/50 transition-all group flex flex-col md:flex-row md:items-center gap-6 sm:gap-10">
                       <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-4">
                             <span className="px-3 py-1 bg-orange-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                {answer.type}
                             </span>
                             <span className="text-zinc-200 font-light opacity-50">/</span>
                             <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">{answer.name}</span>
                          </div>
                          <div className="font-black text-xl md:text-2xl text-zinc-900 break-all leading-tight flex items-start gap-3">
                             {answer.priority !== undefined && <span className="text-purple-500 text-sm mt-1">[{answer.priority}]</span>}
                             <span className="group-hover:text-orange-600 transition-colors">{answer.data}</span>
                          </div>
                       </div>
                       <div className="flex md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 pt-6 md:pt-0 border-zinc-100 min-w-max">
                          <div className="flex flex-col md:items-end gap-1">
                             <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Time_To_Live
                             </div>
                             <div className="text-lg font-black text-zinc-900">{answer.ttl}<span className="text-xs text-zinc-400 ml-1">S</span></div>
                          </div>
                          <button 
                            onClick={() => copyData(answer.data)}
                            className="p-3 bg-zinc-100 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white"
                          >
                             <Copy className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  )) : (
                    <div className="py-32 text-center flex flex-col items-center bg-white">
                       <Terminal className="w-20 h-20 text-zinc-100 mb-6 animate-pulse" />
                       <p className="text-zinc-400 font-mono text-sm uppercase tracking-widest">{dict.tools.dns.no_records}</p>
                       <p className="text-[10px] text-zinc-300 mt-2 uppercase">Check_NXDOMAIN_OR_TIMEOUT</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Collapsible JSON Audit View */}
            <div className="mt-16">
               <button 
                  onClick={() => setShowJson(!showJson)}
                  className="flex items-center gap-2 text-[10px] font-bold text-zinc-400 hover:text-zinc-900 transition-colors uppercase tracking-widest mb-6"
               >
                  <ChevronDown className={`w-3 h-3 transition-transform ${showJson ? 'rotate-180' : ''}`} />
                  ROOT_DNS_PROTOCOL_ADCHANGE_AUDIT
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
                   <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.4em] flex items-center gap-3">
                      <History className="w-5 h-5 text-orange-500" /> RECENT_DNS_FORENSICS
                   </h4>
                   <p className="text-[10px] text-zinc-400 font-mono mt-1 uppercase tracking-widest">Cached Query Persistence System</p>
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
                           <span className="px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded-lg text-[9px] font-black uppercase">{h.type}</span>
                           <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">@ {h.provider.split('_')[0]}</span>
                        </div>
                        <p className="font-black text-zinc-900 text-base group-hover:text-orange-600 transition-colors truncate w-full">{h.domain}</p>
                     </div>
                     <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-bold uppercase tracking-widest group-hover:text-zinc-900 transition-colors">
                        Replay_Probe <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                     </div>
                  </button>
                ))}
             </div>
          </div>
       )}

       {/* Hero Empty State View */}
       {!result && !loading && (
          <div className="max-w-2xl mx-auto mt-16 sm:mt-24 p-10 sm:p-20 rounded-[3.5rem] border border-dashed border-zinc-200 bg-white/40 text-center animate-in fade-in duration-1000">
              <Cpu className="w-16 h-16 text-zinc-100 mx-auto mb-8 animate-pulse text-orange-500/20" />
              <p className="text-zinc-500 text-[10px] leading-relaxed font-mono uppercase tracking-[0.5em] opacity-40">
                A_Record • AAAA • CNAME • MX • NS • TXT • CAA Resolution Engines
              </p>
          </div>
       )}
    </div>
  )
}
