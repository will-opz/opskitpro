import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Globe, Github, Shield, Zap, Brain, Terminal, ArrowUpRight } from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { LanguageToggle } from '@/components/LanguageToggle'

export const runtime = 'edge'

export default async function AboutPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)

  const isZh = lang === 'zh'

  return (
    <div className="min-h-screen flex flex-col relative w-full bg-[#fafafa]">
      <header className="w-full max-w-4xl mx-auto px-6 py-8 flex justify-between items-center z-10">
        <div className="flex flex-col gap-2">
          <Link href={`/`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-mono text-sm transition-colors" title="Return to Home">
            <ArrowLeft className="w-4 h-4" /> {isZh ? "返回首页" : "Home"}
          </Link>
          <div className="font-mono text-xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <span className="text-zinc-600">deops /</span> about<span className="text-accent animate-pulse">_</span>
          </div>
        </div>
        <LanguageToggle currentLang={lang} />
      </header>

      <main className="flex-grow w-full max-w-4xl mx-auto px-6 z-10 mt-4 mb-32">
        {/* Hero */}
        <section className="mb-20">
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900 tracking-tight leading-tight mb-6">
            {isZh ? "去中心化运维" : "Decentralized Operations"}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-600 font-mono italic">
              {isZh ? "为下一代工程师而生" : "Built for Next-Gen Engineers"}
            </span>
          </h1>
          <p className="text-zinc-600 text-lg leading-relaxed max-w-2xl">
            {isZh 
              ? "deops (de + ops) 是一套极简、硬核、全面自动化的 AI 原生运维基础设施。我们相信运维的未来属于边缘计算、去中心化架构与大语言模型驱动的智能决策。"
              : "deops (de + ops) is a minimalist, hardcore, fully automated AI-native operations infrastructure. We believe the future of operations belongs to edge computing, decentralized architecture, and LLM-driven intelligent decision-making."
            }
          </p>
        </section>

        {/* Philosophy */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8 font-mono flex items-center gap-3">
            <span className="text-accent">#</span> {isZh ? "核心理念" : "Core Philosophy"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { 
                icon: Zap, 
                title: isZh ? "边缘优先" : "Edge-First", 
                desc: isZh ? "所有工具和 API 构建在 Cloudflare Edge Runtime 之上，实现近零延迟的全球化响应。" : "All tools and APIs are built on Cloudflare Edge Runtime, achieving near-zero latency global response."
              },
              { 
                icon: Shield, 
                title: isZh ? "去中心化安全" : "Decentralized Security", 
                desc: isZh ? "密码管理、零信任通道、威胁情报——安全不是附属品，而是架构的基石。" : "Password management, zero-trust tunnels, threat intelligence — security is not an add-on, it's the foundation."
              },
              { 
                icon: Brain, 
                title: isZh ? "AI 原生工作流" : "AI-Native Workflows", 
                desc: isZh ? "从异常检测到根因分析，从代码审计到事故复盘——大语言模型深度嵌入每一个运维环节。" : "From anomaly detection to root cause analysis, from code audits to incident reviews — LLMs are deeply embedded in every operations workflow."
              },
              { 
                icon: Terminal, 
                title: isZh ? "极客至上" : "Hacker Ethos", 
                desc: isZh ? "终端风格的界面设计、Cmd+K 全局搜索、HUD 仪表盘——deops 为有技术洁癖的人打造。" : "Terminal-inspired UI, Cmd+K global search, HUD dashboards — deops is built for those with a taste for technical perfection."
              }
            ].map((item, idx) => {
              const Icon = item.icon
              return (
                <div key={idx} className="glass-card p-6 rounded-xl border border-zinc-100 hover:border-emerald-500/20 transition-all">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-200/50">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-zinc-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-zinc-600 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Stack */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8 font-mono flex items-center gap-3">
            <span className="text-accent">#</span> {isZh ? "技术栈" : "Tech Stack"}
          </h2>
          <div className="glass-card rounded-xl border border-zinc-100 p-6 font-mono text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-700">
              <div className="flex items-center gap-3"><span className="text-emerald-600 font-bold">▸</span> Next.js 16 (Turbopack + App Router)</div>
              <div className="flex items-center gap-3"><span className="text-emerald-600 font-bold">▸</span> Cloudflare Edge Runtime</div>
              <div className="flex items-center gap-3"><span className="text-emerald-600 font-bold">▸</span> Tailwind CSS v4</div>
              <div className="flex items-center gap-3"><span className="text-emerald-600 font-bold">▸</span> Lucide React Icons</div>
              <div className="flex items-center gap-3"><span className="text-emerald-600 font-bold">▸</span> Quartz (Obsidian Digital Garden)</div>
              <div className="flex items-center gap-3"><span className="text-emerald-600 font-bold">▸</span> Cookie-based i18n (zh/en)</div>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-zinc-900 mb-8 font-mono flex items-center gap-3">
            <span className="text-accent">#</span> {isZh ? "快速入口" : "Quick Links"}
          </h2>
          <div className="flex flex-wrap gap-4">
            {[
              { label: "GitHub", url: "https://github.com/will-opz/deops.org", icon: Github },
              { label: isZh ? "数字花园" : "Digital Garden", url: "https://kb.deops.org", icon: Globe },
            ].map((link, idx) => {
              const Icon = link.icon
              return (
                <a
                  key={idx}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 text-white font-mono text-sm hover:bg-emerald-600 transition-all group shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              )
            })}
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-12 border-t border-zinc-200/60">
          <p className="text-zinc-400 font-mono text-xs text-center">
            Deep. Define. Decentralized. — Built with ❤️ by <a href="https://deops.org" className="text-emerald-600 hover:underline">deops.org</a>
          </p>
        </footer>
      </main>
    </div>
  )
}
