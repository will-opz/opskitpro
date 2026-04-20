'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'

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
  DoorOpen,
  Braces
} from 'lucide-react'

export default function ServicesClient({ dict, lang }: { dict: any, lang: "zh" | "en" | "ja" | "tw" }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('')
  const isJapanese = lang === 'ja'

  // Move the massive data array here so we can import and use Lucide icons dynamically in a Client component
  const categorizedServices = [
    {
      category: dict.tools.cat_cyber,
      tools: [
        { name: dict.tools.diagnostic_title, desc: dict.tools.diagnostic_desc, icon: Activity, status: "operational", url: `/tools/website-check` },
        { name: dict.tools.passgen_title, desc: dict.tools.passgen_desc, icon: KeyRound, status: "operational", url: `/tools/passgen` },
        { name: dict.tools.qrgen_title, desc: dict.tools.qrgen_desc, icon: QrCode, status: "operational", url: `/tools/qrgen` },
        { name: dict.tools.ip_title, desc: dict.tools.ip_desc, icon: Globe, status: "operational", url: `/tools/ip-lookup` },
        { name: dict.tools.json_title, desc: dict.tools.json_desc, icon: Braces, status: "operational", url: `/tools/json` },
        { name: dict.tools.dns_lookup_title || dict.tools.dns.btn, desc: dict.tools.dns_lookup_desc || (isJapanese ? "DNS レコードと解決状態を確認できます。" : "Check DNS records and resolution status."), icon: Search, status: "operational", url: `/tools/dns-lookup` },
        { name: dict.tools.websocket_title, desc: dict.tools.websocket_desc, icon: Zap, status: "operational", url: `/tools/websocket` },
        { name: dict.tools.matrix_title, desc: dict.tools.matrix_desc, icon: MessageSquare, status: "operational", url: "https://matrix.org", variant: "matrix" },
      ]
    },
    {
      category: isJapanese ? "パスワード管理・認証情報" : (lang === 'zh' ? "密码管理与凭证" : "Password Management"),
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
      category: isJapanese ? "IT 自動化・IaC" : (lang === 'zh' ? "自动化与配置管理" : "IT Automation & IaC"),
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
        { name: "Jenkins", desc: "Legacy Automation", icon: Terminal, status: "operational", url: "https://www.jenkins.io" },
      ]
    },
    {
      category: isJapanese ? "ゼロトラスト・トンネル" : (lang === 'zh' ? "安全通道与零信任" : "Zero Trust & Tunnels"),
      tools: [
        { name: "JumpServer", desc: "Open Source Bastion Host", icon: DoorOpen, status: "operational", url: "https://www.jumpserver.org" },
        { name: "Tailscale", desc: "Mesh VPN Network", icon: Network, status: "operational", url: "https://tailscale.com" },
        { name: "WireGuard", desc: "Fast & Modern VPN", icon: Lock, status: "operational", url: "https://www.wireguard.com" },
        { name: "Pritunl", desc: "Enterprise VPN Server", icon: Shield, status: "operational", url: "https://pritunl.com" },
        { name: "Proton Mail", desc: "Encrypted Email Service", icon: Mail, status: "operational", url: "https://proton.me/mail" },
      ]
    },
    {
      category: isJapanese ? "AI・情報活用" : (lang === 'zh' ? "人工智能体中枢" : "AI & Intelligence"),
      tools: [
        { name: "OpenClaw", desc: "AI Inference & Bypass", icon: Brain, status: "operational", url: "https://openclaw.ai/" },
        { name: "OpenAI", desc: "GPT-4 / O1 Inference", icon: Brain, status: "operational", url: "https://chat.openai.com" },
        { name: "Claude", desc: "Anthropic Opus/Sonnet", icon: MessageSquare, status: "operational", url: "https://claude.ai" },
        { name: "Gemini3", desc: "Google Advanced Gemini", icon: Sparkles, status: "operational", url: "https://gemini.google.com" },
        { name: "Grok", desc: "xAI Unfiltered Model", icon: Rocket, status: "operational", url: "https://twitter.com/i/grok" },
      ]
    },
    {
      category: isJapanese ? "脅威インテリジェンス・偵察" : (lang === 'zh' ? "威胁情报与资产探测" : "Threat Intel & Recon"),
      tools: [
        { name: "Nmap", desc: "Network Discovery & Auditing", icon: Search, status: "operational", url: "https://nmap.org" },
        { name: "Masscan", desc: "Mass IP Port Scanner", icon: Crosshair, status: "operational", url: "https://github.com/robertdavidgraham/masscan" },
        { name: "Shodan", desc: "IoT Search Engine", icon: Radar, status: "operational", url: "https://www.shodan.io" },
        { name: "FOFA", desc: "Cyber Space Mapping", icon: Scan, status: "operational", url: "https://fofa.info" },
        { name: "VirusTotal", desc: "Malware Intelligence", icon: ShieldAlert, status: "operational", url: "https://www.virustotal.com" },
      ]
    },
    {
      category: isJapanese ? "トラフィック解析・テスト" : (lang === 'zh' ? "渗透拦截与防御抓包" : "Offensive & Traffic"),
      tools: [
        { name: "Burp Suite", desc: "Web Vuln Scanner", icon: Crosshair, status: "operational", url: "https://portswigger.net/burp" },
        { name: "Wireshark", desc: "Packet Capture Analysis", icon: Activity, status: "operational", url: "https://www.wireshark.org" },
        { name: "Nuclei", desc: "Fast Vulnerability Scanner", icon: Bug, status: "operational", url: "https://github.com/projectdiscovery/nuclei" },
      ]
    },
    {
      category: isJapanese ? "クラウド・DevSecOps" : (lang === 'zh' ? "云原生安全与审计" : "Cloud & DevSecOps"),
      tools: [
        { name: "Trivy", desc: "Container Security Scanner", icon: Box, status: "operational", url: "https://aquasecurity.github.io/trivy" },
        { name: "Checkov", desc: "IaC Security Misconfigs", icon: FileCode, status: "operational", url: "https://www.checkov.io" },
        { name: "Wazuh", desc: "Open Source XDR & SIEM", icon: Shield, status: "operational", url: "https://wazuh.com" },
      ]
    },
    {
      category: isJapanese ? "DNS・診断" : (lang === 'zh' ? "网络与域名诊断" : "DNS & Diagnostics"),
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
    <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 z-10 mt-8 md:mt-12 mb-32 relative flex flex-col md:flex-row gap-6 md:gap-12 items-start overflow-x-hidden">
      
      {/* Option 2: Sticky Sidebar Index */}
      <aside className="sticky top-12 w-64 shrink-0 hidden md:block border-r border-zinc-200/60 pb-8 h-[calc(100vh-100px)] overflow-y-auto pr-4">
        <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] mb-6 px-3">{isJapanese ? 'カテゴリ一覧' : 'Matrix Index'}</h3>
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
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.28em] mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isJapanese ? 'ツールマトリクス' : 'Matrix Control Center'}
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-4">
              OpsKit<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 font-mono italic">Pro_</span>
            </h1>
            <p className="text-zinc-600 max-w-xl leading-relaxed text-sm">
              {isJapanese ? 'インフラ、監視、配信、診断までを一か所で確認できる運用ダッシュボードです。' : 'Professional Cloud & Ops Toolkit Matrix. Fully automated, decentralized infrastructure.'}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-4 w-full lg:w-auto shrink-0">
            
            {/* Option 1: Global Search Command Palette */}
            <div className="relative w-full lg:w-72">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-zinc-400" />
              </div>
              <input
                id="matrix-search"
                type="text"
                placeholder={isJapanese ? "モジュールを検索 (Cmd+K)..." : (lang === 'zh' ? "搜索模块 (Cmd+K)..." : "Search (Cmd+K)...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-zinc-200 rounded-xl leading-5 bg-white/60 backdrop-blur-sm placeholder-zinc-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm shadow-sm hover:border-zinc-300"
              />
              <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                 <span className="text-[10px] text-zinc-400 border border-zinc-200/80 rounded px-1.5 py-0.5 bg-zinc-50">⌘K</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Service Grid */}
        <div className="space-y-16 min-h-[60vh]">
          {filteredServices.length === 0 ? (
             <div className="text-center py-24 border border-dashed border-zinc-200 rounded-2xl bg-zinc-50/50 flex flex-col items-center justify-center">
               <Activity className="w-8 h-8 text-zinc-300 mb-4" />
               <p className="text-zinc-500 text-sm">{isJapanese ? '該当するモジュールが見つかりませんでした。' : 'Target module not found in operational matrix.'}</p>
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
                  <h2 className="text-lg font-semibold text-zinc-700 mb-6 flex items-center gap-3 border-b border-zinc-200/50 pb-3">
                    <span className="text-accent text-xl leading-none">#</span> {cat.category}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {cat.tools.map((tool: any, tIdx: number) => {
                      const Icon = tool.icon;
                      const isOperational = tool.status === "operational";
                      const isMatrix = tool.variant === 'matrix'

                      if (isMatrix) {
                        return (
                          <Link
                            key={tIdx}
                            href={tool.url}
                            className="group flex h-full min-h-[176px] flex-col justify-between rounded-[1.5rem] border border-emerald-200/25 bg-gradient-to-br from-zinc-950 via-zinc-900 to-emerald-950 p-5 text-white shadow-lg shadow-emerald-900/10 transition hover:-translate-y-0.5 hover:border-emerald-200/40"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/8 text-emerald-300 shadow-sm">
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-mono font-bold uppercase tracking-[0.3em] text-emerald-300/80">
                                    Matrix
                                  </p>
                                  <h3 className="mt-1 text-sm font-semibold text-white">
                                    {tool.name}
                                  </h3>
                                </div>
                              </div>
                              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/25 bg-white/5 px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-emerald-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                                Matrix
                              </span>
                            </div>
                            <p className="mt-4 text-[12px] leading-6 text-zinc-300">
                              {tool.desc}
                            </p>
                            <div className="mt-5 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.28em] text-emerald-200/70">
                              <span>{dict.services.status_operational}</span>
                              <ArrowUp className="h-4 w-4 rotate-45" />
                            </div>
                          </Link>
                        )
                      }

                      return (
                        <Link
                          key={tIdx}
                          href={tool.url}
                          className="group flex h-full min-h-[176px] flex-col justify-between rounded-[1.5rem] border border-zinc-100 bg-white/90 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-zinc-500 transition group-hover:border-emerald-200 group-hover:bg-emerald-50 group-hover:text-emerald-600">
                              <Icon className="h-5 w-5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="min-w-0 flex-1 text-sm font-semibold leading-6 text-zinc-900">
                                  {tool.name}
                                </h3>
                                <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-widest ${isOperational ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-orange-200 bg-orange-50 text-orange-700'}`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${isOperational ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                  {isOperational ? dict.services.status_operational : dict.services.status_maintenance}
                                </span>
                              </div>
                              <p className="mt-2 line-clamp-2 text-[12px] leading-6 text-zinc-500">
                                {tool.desc}
                              </p>
                            </div>
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
          className="fixed bottom-6 right-4 sm:bottom-10 sm:right-10 p-3 sm:p-4 bg-white/90 text-zinc-900 rounded-full shadow-2xl backdrop-blur-xl hover:bg-emerald-500 hover:text-white transition-all duration-300 z-50 group border border-black/5 hover:scale-110"
          aria-label={isJapanese ? 'ページ上部へ戻る' : 'Scroll to top'}
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300" />
        </button>
      )}
    </main>
  )
}
