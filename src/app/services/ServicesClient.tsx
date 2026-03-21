'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { LanguageToggle } from '@/components/LanguageToggle'
import { 
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
  Rocket,
  Radar,
  Scan,
  ShieldAlert,
  Bug,
  FileCode,
  Box,
  Eye,
  Crosshair,
  Search,
  History,
  Fingerprint,
  Map,
  Wrench,
  Layers,
  MonitorCheck,
  Zap,
  ArrowUp,
  Vault,
  KeySquare,
  ShieldCheck,
  DoorOpen
} from 'lucide-react'

export default function ServicesClient({ dict, lang }: { dict: any, lang: "zh" | "en" }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('')

  // Move the massive data array here so we can import and use Lucide icons dynamically in a Client component
  const categorizedServices = [
    {
      category: dict.tools.cat_cyber,
      tools: [
        { name: dict.tools.passgen_title, desc: dict.tools.passgen_desc, icon: KeyRound, status: "operational", url: `/tools/passgen` },
        { name: dict.tools.qrgen_title, desc: dict.tools.qrgen_desc, icon: QrCode, status: "operational", url: `/tools/qrgen` },
        { name: dict.tools.ip_title, desc: dict.tools.ip_desc, icon: Globe, status: "operational", url: `/tools/ip` },
      ]
    },
    {
      category: lang === 'zh' ? "密码管理与凭证" : "Password Management",
      tools: [
        { name: "1Password", desc: "Enterprise Password Manager", icon: KeySquare, status: "operational", url: "https://1password.com" },
        { name: "Enpass", desc: "Offline Password Manager", icon: Vault, status: "operational", url: "https://www.enpass.io" },
        { name: "Bitwarden", desc: "Open Source Vault", icon: ShieldCheck, status: "operational", url: "https://bitwarden.com" },
      ]
    },
    {
      category: dict.services.cat_monitoring,
      tools: [
        { name: "Grafana", desc: "Metrics & Visualization", icon: BarChart, status: "operational", url: "https://grafana.com" },
        { name: "Prometheus", desc: "Time-series Database", icon: Activity, status: "operational", url: "https://prometheus.io" },
        { name: "Elasticsearch", desc: "Log Analytics Engine", icon: Database, status: "operational", url: "https://www.elastic.co" },
        { name: "Zabbix", desc: "Enterprise Monitoring", icon: MonitorCheck, status: "operational", url: "https://www.zabbix.com" },
      ]
    },
    {
      category: lang === 'zh' ? "自动化与配置管理" : "IT Automation & IaC",
      tools: [
        { name: "Ansible", desc: "Agentless IT Automation", icon: Wrench, status: "operational", url: "https://www.ansible.com" },
        { name: "SaltStack", desc: "Event-driven Infra", icon: Zap, status: "operational", url: "https://saltproject.io" },
        { name: "Terraform", desc: "Infrastructure as Code", icon: Layers, status: "operational", url: "https://www.terraform.io" },
      ]
    },
    {
      category: dict.services.cat_infra,
      tools: [
        { name: "AWS Console", desc: "Primary Cloud Provider", icon: Cloud, status: "operational", url: "https://aws.amazon.com/console/" },
        { name: "Cloudflare", desc: "Edge Network & WAF", icon: Shield, status: "operational", url: "https://dash.cloudflare.com" },
        { name: "Kubernetes", desc: "Container Orchestration", icon: Server, status: "operational", url: "https://kubernetes.io" },
      ]
    },
    {
      category: dict.services.cat_cicd,
      tools: [
        { name: "GitHub Actions", desc: "Automated Workflows", icon: GitMerge, status: "operational", url: "https://github.com/features/actions" },
        { name: "ArgoCD", desc: "GitOps Delivery", icon: Workflow, status: "operational", url: "https://argoproj.github.io/cd/" },
        { name: "Jenkins", desc: "Legacy Automation", icon: Terminal, status: "maintenance", url: "https://www.jenkins.io" },
      ]
    },
    {
      category: lang === 'zh' ? "安全通道与零信任" : "Zero Trust & Tunnels",
      tools: [
        { name: "JumpServer", desc: "Open Source Bastion Host", icon: DoorOpen, status: "operational", url: "https://www.jumpserver.org" },
        { name: "Tailscale", desc: "Mesh VPN Network", icon: Network, status: "operational", url: "https://tailscale.com" },
        { name: "WireGuard", desc: "Fast & Modern VPN", icon: Lock, status: "operational", url: "https://www.wireguard.com" },
        { name: "Pritunl", desc: "Enterprise VPN Server", icon: Shield, status: "operational", url: "https://pritunl.com" },
        { name: "Proton Mail", desc: "Encrypted Email Service", icon: Mail, status: "operational", url: "https://proton.me/mail" },
      ]
    },
    {
      category: lang === 'zh' ? "人工智能体中枢" : "AI & Intelligence",
      tools: [
        { name: "OpenClaw", desc: "AI Inference & Bypass", icon: Brain, status: "operational", url: "https://openclaw.ai/" },
        { name: "OpenAI", desc: "GPT-4 / O1 Inference", icon: Brain, status: "operational", url: "https://chat.openai.com" },
        { name: "Claude", desc: "Anthropic Opus/Sonnet", icon: MessageSquare, status: "operational", url: "https://claude.ai" },
        { name: "Gemini3", desc: "Google Advanced Gemini", icon: Sparkles, status: "operational", url: "https://gemini.google.com" },
        { name: "Grok", desc: "xAI Unfiltered Model", icon: Rocket, status: "operational", url: "https://twitter.com/i/grok" },
      ]
    },
    {
      category: lang === 'zh' ? "威胁情报与资产探测" : "Threat Intel & Recon",
      tools: [
        { name: "Nmap", desc: "Network Discovery & Auditing", icon: Search, status: "operational", url: "https://nmap.org" },
        { name: "Masscan", desc: "Mass IP Port Scanner", icon: Crosshair, status: "operational", url: "https://github.com/robertdavidgraham/masscan" },
        { name: "Shodan", desc: "IoT Search Engine", icon: Radar, status: "operational", url: "https://www.shodan.io" },
        { name: "FOFA", desc: "Cyber Space Mapping", icon: Scan, status: "operational", url: "https://fofa.info" },
        { name: "VirusTotal", desc: "Malware Intelligence", icon: ShieldAlert, status: "operational", url: "https://www.virustotal.com" },
      ]
    },
    {
      category: lang === 'zh' ? "渗透拦截与防御抓包" : "Offensive & Traffic",
      tools: [
        { name: "Burp Suite", desc: "Web Vuln Scanner", icon: Crosshair, status: "operational", url: "https://portswigger.net/burp" },
        { name: "Wireshark", desc: "Packet Capture Analysis", icon: Activity, status: "operational", url: "https://www.wireshark.org" },
        { name: "Nuclei", desc: "Fast Vulnerability Scanner", icon: Bug, status: "operational", url: "https://github.com/projectdiscovery/nuclei" },
      ]
    },
    {
      category: lang === 'zh' ? "云原生安全与审计" : "Cloud & DevSecOps",
      tools: [
        { name: "Trivy", desc: "Container Security Scanner", icon: Box, status: "operational", url: "https://aquasecurity.github.io/trivy" },
        { name: "Checkov", desc: "IaC Security Misconfigs", icon: FileCode, status: "operational", url: "https://www.checkov.io" },
        { name: "Wazuh", desc: "Open Source XDR & SIEM", icon: Shield, status: "operational", url: "https://wazuh.com" },
      ]
    },
    {
      category: lang === 'zh' ? "网络与域名诊断" : "DNS & Diagnostics",
      tools: [
        { name: "MXToolBox", desc: "DNS & Mail Health Check", icon: Mail, status: "operational", url: "https://mxtoolbox.com" },
        { name: "DNSDumpster", desc: "DNS Topology Mapping", icon: Map, status: "operational", url: "https://dnsdumpster.com" },
        { name: "SecurityTrails", desc: "Historical DNS Records", icon: History, status: "operational", url: "https://securitytrails.com" },
        { name: "ViewDNS", desc: "Reverse IP & Network Utils", icon: Search, status: "operational", url: "https://viewdns.info" },
        { name: "ICANN Lookup", desc: "Global WHOIS Registry", icon: Fingerprint, status: "operational", url: "https://lookup.icann.org" },
      ]
    }
  ]

  const [showScrollTop, setShowScrollTop] = useState(false)

  // Filter Logic
  const filteredServices = categorizedServices.map(cat => {
    const matchedTools = cat.tools.filter((tool) => 
      tool.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      tool.desc.toLowerCase().includes(searchTerm.toLowerCase())
    )
    return { ...cat, tools: matchedTools }
  }).filter(cat => cat.tools.length > 0)

  // Smooth scroll to category logic
  const scrollToCat = (catId: string) => {
    const el = document.getElementById(catId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveCategory(catId)
    }
  }

  // Smooth scroll to top
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Keyboard shortcut listener (Cmd+K / Ctrl+K) & Scroll Event Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        document.getElementById('matrix-search')?.focus()
      }
    }
    
    const handleScroll = () => {
      // Show button if scrolled past 400px
      setShowScrollTop(window.scrollY > 400)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial check
    handleScroll()
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Use Intersection Observer for automated active tab highlighting
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter(e => e.isIntersecting)
      if (visible.length > 0) {
        // Find the top-most visible element
        visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        setActiveCategory(visible[0].target.id)
      }
    }, { rootMargin: '-100px 0px -60% 0px' })

    const sections = document.querySelectorAll('section[data-category]')
    sections.forEach(s => observer.observe(s))
    
    return () => observer.disconnect()
  }, [searchTerm])

  return (
    <main className="flex-grow w-full max-w-7xl mx-auto px-6 z-10 mt-2 mb-32 relative flex flex-col md:flex-row gap-12 items-start">
      
      {/* Option 2: Sticky Sidebar Index */}
      <aside className="sticky top-12 w-64 shrink-0 hidden md:block border-r border-zinc-200/60 pb-8 h-[calc(100vh-100px)] overflow-y-auto pr-4">
        <h3 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest mb-6 px-3">Matrix Index</h3>
        <nav className="flex flex-col gap-1">
          {filteredServices.map((cat, idx) => {
            const originalIdx = categorizedServices.findIndex(c => c.category === cat.category);
            const isActive = activeCategory === `cat-${originalIdx}`;
            return (
              <button
                key={idx}
                onClick={() => scrollToCat(`cat-${originalIdx}`)}
                className={`text-left px-3 py-2.5 text-[13px] font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-50 text-emerald-700 font-bold border-l-[3px] border-emerald-500 rounded-r-md' 
                    : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 border-l-[3px] border-transparent rounded-r-md'
                }`}
              >
                {cat.category}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow w-full min-w-0">
        <div className="mb-14 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-3">
              {dict.services.title_part1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 font-mono italic">{dict.services.title_part2}</span>
            </h1>
            <p className="text-zinc-600 max-w-xl leading-relaxed text-sm">
              {dict.services.subtitle}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-4 w-full lg:w-auto shrink-0">
            <LanguageToggle currentLang={lang} />
            
            {/* Option 1: Global Search Command Palette */}
            <div className="relative w-full lg:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                id="matrix-search"
                type="text"
                placeholder={lang === 'zh' ? "搜索模块 (Cmd+K)..." : "Search (Cmd+K)..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 rounded-xl leading-5 bg-white/60 backdrop-blur-sm placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono text-sm shadow-sm hover:border-zinc-300"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                 <span className="text-[10px] text-zinc-400 font-mono border border-zinc-200/80 rounded px-1.5 py-0.5 bg-zinc-50">⌘K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Service Grid */}
        <div className="space-y-16 min-h-[60vh]">
          {filteredServices.length === 0 ? (
             <div className="text-center py-24 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 flex flex-col items-center justify-center">
               <Activity className="w-8 h-8 text-zinc-300 mb-4" />
               <p className="text-zinc-500 font-mono text-sm">Target module not found in operational matrix.</p>
             </div>
          ) : (
            filteredServices.map((cat, idx) => {
              const originalIdx = categorizedServices.findIndex(c => c.category === cat.category);
              return (
                <section 
                  id={`cat-${originalIdx}`} 
                  data-category 
                  key={idx} 
                  className="scroll-mt-32 animate-in fade-in slide-in-from-bottom-4 duration-700" 
                  style={{ animationFillMode: 'both', animationDelay: `${idx * 100}ms` }}
                >
                  <h2 className="text-lg font-mono font-semibold text-zinc-700 mb-6 flex items-center gap-3 border-b border-zinc-200/50 pb-3">
                    <span className="text-accent text-xl leading-none">#</span> {cat.category}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cat.tools.map((tool: any, tIdx: number) => {
                      const Icon = tool.icon;
                      const isOperational = tool.status === "operational";
                      
                      return (
                        <Link 
                          key={tIdx} 
                          href={tool.url}
                          className="glass-card group p-5 rounded-xl flex items-start gap-4 no-underline hover:bg-white/60 transition-all border border-zinc-100 hover:border-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                        >
                          <div className="w-10 h-10 rounded-lg bg-zinc-100/50 flex items-center justify-center shrink-0 border border-zinc-200/60 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all duration-300 shadow-sm">
                            <Icon className="w-5 h-5 text-zinc-500 group-hover:text-emerald-600 transition-colors duration-300" />
                          </div>
                          
                          <div className="flex-grow min-w-0">
                            <div className="flex justify-between items-start mb-1.5 gap-2">
                              <h3 className="font-semibold text-zinc-800 text-sm group-hover:text-zinc-900 transition-colors duration-300 truncate">
                                {tool.name}
                              </h3>
                              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${isOperational ? 'text-emerald-700/80' : 'text-orange-500/80'}`}>
                                  {isOperational ? dict.services.status_operational : dict.services.status_maintenance}
                                </span>
                                <div 
                                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    backgroundColor: isOperational ? '#10b981' : '#f59e0b',
                                    boxShadow: isOperational ? '0 0 8px rgba(16,185,129,0.5)' : '0 0 8px rgba(245,158,11,0.5)'
                                  }}
                                >
                                  <div className="w-full h-full rounded-full animate-ping opacity-50" style={{ backgroundColor: isOperational ? '#10b981' : '#f59e0b' }}></div>
                                </div>
                              </div>
                            </div>
                            <p className="text-[12px] text-zinc-500/90 font-mono leading-relaxed group-hover:text-zinc-600 transition-colors duration-300 line-clamp-2">
                              {tool.desc}
                            </p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </section>
              )
            })
          )}
        </div>
      </div>

      {/* Floating Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-10 right-10 p-3 bg-zinc-900/90 text-white rounded-full shadow-lg backdrop-blur-md hover:bg-emerald-600 transition-all duration-300 z-50 group border border-zinc-700/50 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      )}
    </main>
  )
}
