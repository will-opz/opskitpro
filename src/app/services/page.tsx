import { cookies } from 'next/headers'
import Link from 'next/link'
import { LanguageToggle } from '@/components/LanguageToggle'
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
  Globe,
  Network,
  Lock,
  Mail,
  Wifi,
  Brain,
  MessageSquare,
  Sparkles,
  Rocket
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'

export const runtime = 'edge'

export default async function ServicesPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
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
        { name: dict.tools.passgen_title, desc: dict.tools.passgen_desc, icon: KeyRound, status: "operational", url: `/tools/passgen` },
        { name: dict.tools.qrgen_title, desc: dict.tools.qrgen_desc, icon: QrCode, status: "operational", url: `/tools/qrgen` },
        { name: dict.tools.ip_title, desc: dict.tools.ip_desc, icon: Globe, status: "operational", url: `/tools/ip` },
      ]
    },
    {
      category: lang === 'zh' ? "安全通道与零信任" : "Zero Trust & Tunnels",
      tools: [
        { name: "Tailscale", desc: "Mesh VPN Network", icon: Network, status: "operational", url: "https://tailscale.com" },
        { name: "WireGuard", desc: "Fast & Modern VPN", icon: Lock, status: "operational", url: "https://www.wireguard.com" },
        { name: "Pritunl", desc: "Enterprise VPN Server", icon: Shield, status: "operational", url: "https://pritunl.com" },
        { name: "Proton Mail", desc: "Encrypted Email Service", icon: Mail, status: "operational", url: "https://proton.me/mail" },
      ]
    },
    {
      category: lang === 'zh' ? "人工智能体中枢" : "AI & Intelligence",
      tools: [
        { name: "OpenClaw", desc: "AI Inference & Bypass", icon: Brain, status: "operational", url: "#" },
        { name: "OpenAI", desc: "GPT-4 / O1 Inference", icon: Brain, status: "operational", url: "https://chat.openai.com" },
        { name: "Claude", desc: "Anthropic Opus/Sonnet", icon: MessageSquare, status: "operational", url: "https://claude.ai" },
        { name: "Gemini3", desc: "Google Advanced Gemini", icon: Sparkles, status: "operational", url: "https://gemini.google.com" },
        { name: "Grok", desc: "xAI Unfiltered Model", icon: Rocket, status: "operational", url: "https://twitter.com/i/grok" },
      ]
    }
  ]

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      <header className="w-full max-w-6xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <div className="flex flex-col gap-2">
          <Link href={`/`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-mono text-sm transition-colors" title="Return to Home">
            <ArrowLeft className="w-4 h-4" /> 返回首页
          </Link>
          <div className="font-mono text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-600">deops /</span> services<span className="text-accent animate-pulse">_</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-white/80 px-4 py-2 rounded-full border border-zinc-200 text-xs font-mono text-zinc-600 shadow-md backdrop-blur-sm cursor-default">
          <Activity className="w-3.5 h-3.5 text-emerald-700" />
          {dict.services.matrix_active}
        </div>
      </header>

      <main className="flex-grow w-full max-w-6xl mx-auto px-6 z-10 mt-8 mb-32">
        <div className="mb-14 flex justify-between items-start">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-4">
              {dict.services.title_part1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 font-mono italic">{dict.services.title_part2}</span>
            </h1>
            <p className="text-zinc-600 max-w-xl leading-relaxed">
              {dict.services.subtitle}
            </p>
          </div>
          
          {/* Language Toggle */}
          <LanguageToggle currentLang={lang} />
        </div>

        <div className="space-y-16">
          {categorizedServices.map((cat, idx) => (
            <section key={idx} className="animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ animationFillMode: 'both', animationDelay: `${idx * 150}ms` }}>
              <h2 className="text-lg font-mono font-semibold text-zinc-700 mb-6 flex items-center gap-3 border-b border-zinc-200/50 pb-3">
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
                      className="glass-card group p-5 rounded-xl flex items-start gap-4 no-underline hover:bg-white/60"
                    >
                      <div className="w-10 h-10 rounded-lg bg-zinc-100/50 flex items-center justify-center shrink-0 border border-zinc-300/50 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all duration-300 shadow-inner">
                        <Icon className="w-5 h-5 text-zinc-600 group-hover:text-emerald-600 transition-colors duration-300" />
                      </div>
                      
                      <div className="flex-grow">
                        <div className="flex justify-between items-start mb-1.5">
                          <h3 className="font-semibold text-zinc-200 group-hover:text-zinc-900 transition-colors duration-300">
                            {tool.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-mono font-medium uppercase tracking-wider ${isOperational ? 'text-emerald-700/80' : 'text-orange-500/80'}`}>
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
                        <p className="text-[13px] text-zinc-600 font-mono leading-relaxed group-hover:text-zinc-600 transition-colors duration-300">
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
