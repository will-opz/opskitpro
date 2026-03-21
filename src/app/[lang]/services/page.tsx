import Link from 'next/link'
import { 
  ArrowLeft, 
  Activity, 
  Server, 
  Shield, 
  Cloud, 
  Terminal, 
  Workflow, 
  Database,
  BarChart,
  GitMerge,
  KeyRound,
  QrCode,
  Globe
} from 'lucide-react'
import { getDictionary } from '../../../dictionaries'

export const runtime = 'edge'

export default async function ServicesPage({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }) {
  const { lang } = await params;
  const dict = await getDictionary(lang)

  const categorizedServices = [
    {
      category: dict.services.cat_monitoring,
      tools: [
        { name: "Grafana", desc: "Metrics & Visualization", icon: BarChart, status: "operational", url: "#" },
        { name: "Prometheus", desc: "Time-series Database", icon: Activity, status: "operational", url: "#" },
        { name: "Elasticsearch", desc: "Log Analytics Engine", icon: Database, status: "operational", url: "#" },
      ]
    },
    {
      category: dict.services.cat_infra,
      tools: [
        { name: "AWS Console", desc: "Primary Cloud Provider", icon: Cloud, status: "operational", url: "#" },
        { name: "Cloudflare", desc: "Edge Network & WAF", icon: Shield, status: "operational", url: "#" },
        { name: "Kubernetes", desc: "Container Orchestration", icon: Server, status: "operational", url: "#" },
      ]
    },
    {
      category: dict.services.cat_cicd,
      tools: [
        { name: "GitHub Actions", desc: "Automated Workflows", icon: GitMerge, status: "operational", url: "#" },
        { name: "ArgoCD", desc: "GitOps Delivery", icon: Workflow, status: "operational", url: "#" },
        { name: "Jenkins", desc: "Legacy Automation", icon: Terminal, status: "maintenance", url: "#" },
      ]
    },
    {
      category: dict.tools.cat_cyber,
      tools: [
        { name: dict.tools.passgen_title, desc: dict.tools.passgen_desc, icon: KeyRound, status: "operational", url: `/${lang}/tools/passgen` },
        { name: dict.tools.qrgen_title, desc: dict.tools.qrgen_desc, icon: QrCode, status: "operational", url: `/${lang}/tools/qrgen` },
        { name: dict.tools.ip_title, desc: dict.tools.ip_desc, icon: Globe, status: "operational", url: `/${lang}/tools/ip` },
      ]
    }
  ]

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}`} className="text-zinc-500 hover:text-white transition-colors" title="Back">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-zinc-500">deops /</span> services<span className="text-accent animate-pulse">_</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 text-xs font-mono text-zinc-400 shadow-md backdrop-blur-sm cursor-default">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          {dict.services.matrix_active}
        </div>
      </header>

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 z-10 mt-8 mb-32">
        <div className="mb-14 flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {dict.services.title_part1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-mono italic">{dict.services.title_part2}</span>
            </h1>
            <p className="text-zinc-400 max-w-xl leading-relaxed">
              {dict.services.subtitle}
            </p>
          </div>
          
          {/* Language Toggle */}
          <div className="hidden md:flex items-center gap-2 border border-zinc-800 rounded-full px-4 py-1.5 bg-zinc-900/50">
            <Link href="/zh/services" className={`text-xs font-bold transition-colors ${lang === 'zh' ? 'text-accent' : 'text-zinc-500 hover:text-white'}`}>ZH</Link>
            <span className="text-zinc-700 text-xs">/</span>
            <Link href="/en/services" className={`text-xs font-bold transition-colors ${lang === 'en' ? 'text-accent' : 'text-zinc-500 hover:text-white'}`}>EN</Link>
          </div>
        </div>

        <div className="space-y-16">
          {categorizedServices.map((cat, idx) => (
            <section key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: `${idx * 150}ms` }}>
              <h2 className="text-lg font-mono font-semibold text-zinc-300 mb-6 flex items-center gap-3 border-b border-zinc-800/50 pb-3">
                <span className="text-accent text-xl leading-none">#</span> {cat.category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.tools.map((tool, tIdx) => {
                  const Icon = tool.icon;
                  const isOperational = tool.status === "operational";
                  
                  return (
                    <Link 
                      key={tIdx} 
                      href={tool.url}
                      className="glass-card group p-5 rounded-xl flex items-start gap-4 no-underline hover:bg-zinc-900/60"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center shrink-0 border border-zinc-700/50 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all duration-300 shadow-inner">
                        <Icon className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400 transition-colors duration-300" />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="font-semibold text-zinc-200 group-hover:text-white transition-colors duration-300">
                            {tool.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-medium uppercase tracking-wider ${isOperational ? 'text-emerald-500/80' : 'text-orange-500/80'}`}>
                              {isOperational ? dict.services.status_operational : dict.services.status_maintenance}
                            </span>
                            <div 
                              className="w-2 h-2 rounded-full transition-all duration-300"
                              style={{ 
                                backgroundColor: isOperational ? '#10b981' : '#f59e0b',
                                boxShadow: isOperational ? '0 0 8px rgba(16,185,129,0.4)' : '0 0 8px rgba(245,158,11,0.4)'
                              }}
                            >
                              <div className="w-full h-full rounded-full animate-ping opacity-40" style={{ backgroundColor: isOperational ? '#10b981' : '#f59e0b' }}></div>
                            </div>
                          </div>
                        </div>
                        <p className="text-[13px] text-zinc-500 font-mono leading-relaxed group-hover:text-zinc-400 transition-colors duration-300">
                          {tool.desc}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  )
}
