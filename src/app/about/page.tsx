import { cookies } from 'next/headers'
import { Shield, Zap, Search, Terminal, Globe, Github, ArrowUpRight, Mail, Fingerprint, Activity } from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export default async function AboutPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  const isZh = lang === 'zh'

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-grow w-full max-w-4xl mx-auto px-6 z-10 mt-12 mb-32 relative">
        {/* Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="mb-24 text-center md:text-left">
          <div className="flex items-center gap-3 mb-6 justify-center md:justify-start">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] italic leading-none">The_Forensics_Vision</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-zinc-900 tracking-tighter italic mb-8 leading-[0.9] lowercase">
             ULtimate_SRE<span className="text-zinc-300">.TOOLCHAIN</span>
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed max-w-2xl font-mono lowercase">
            {isZh 
              ? "极简，硬核，数据驱动。OpsKitPro 是为下一代 SRE 工程师构建的轻量化取证基础设施。我们相信运维的本质不仅是写代码，更是对复杂网络环境的实时感知与精准取证。"
              : "Minimalist, hardcore, data-driven. OpsKitPro is a lightweight forensics infrastructure built for the next generation of SREs. We believe the essence of operations is not just coding, but real-time perception and precise forensics of complex network environments."
            }
          </p>
        </section>

        {/* Philosophy - Light Theme Cards */}
        <section className="mb-24">
          <h2 className="text-[10px] font-black text-zinc-400 mb-10 uppercase tracking-[0.3em] italic flex items-center gap-3">
             <Fingerprint className="w-4 h-4 text-emerald-500" /> core_philosophy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { 
                icon: Activity, 
                title: isZh ? "毫秒级取证" : "Low-Latency Forensics", 
                desc: isZh ? "所有探测 API 构建在 Cloudflare Edge 之上，实现近零延迟的全球连通性审计。" : "All probe APIs are built on Cloudflare Edge, achieving near-zero latency global connectivity auditing."
              },
              { 
                icon: Shield, 
                title: isZh ? "全链路透明" : "Transparent Pipeline", 
                desc: isZh ? "无论是 SSL 到期还是 BGP 路由风险，数据永远以最原始、最直观的 JSON 审计方式呈现。" : "Whether it is SSL expiry or BGP routing risks, data is always presented in the most raw and intuitive JSON audit form."
              },
              { 
                icon: Zap, 
                title: isZh ? "工业级美学" : "Industrial Aesthetics", 
                desc: isZh ? "追求极致的渲染效率与 HUD 视觉呈现，将冷冰冰的运维任务转化为充满动感的取证艺术。" : "Pursuing extreme rendering efficiency and HUD visual presentation, turning cold operations tasks into dynamic forensic art."
              },
              { 
                icon: Terminal, 
                title: isZh ? "去黑化设计" : "Light-Mode Evolution", 
                desc: isZh ? "摒弃压抑的深色块，采用通透的高级白与翡翠绿，让排障过程更加清晰、冷静。" : "Discarding depressing dark blocks, adopting transparent premium white and emerald green, making the troubleshooting process clearer and calmer."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100 group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20 transition-all">
                  <item.icon className="w-5 h-5 text-zinc-900 group-hover:text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3 italic">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-mono lowercase">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack - Sub-grid */}
        <section className="mb-24">
           <h2 className="text-[10px] font-black text-zinc-400 mb-10 uppercase tracking-[0.3em] italic flex items-center gap-3">
             <Activity className="w-4 h-4 text-emerald-500" /> stack_composition
          </h2>
           <div className="bg-zinc-50 rounded-[2.5rem] border border-black/5 p-10 font-mono text-[10px] text-zinc-500 uppercase tracking-widest grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Next.js 16 (Turbo)</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> CF Edge Runtime</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Tailwind CSS v4</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Lucide Icons</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Quartz Gen 4</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> i18n Strategy</div>
           </div>
        </section>

        {/* Contact/Support - Light Layout */}
        <section>
          <div className="bg-white border border-black/5 rounded-[3rem] p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
               <h2 className="text-3xl font-black italic tracking-tighter text-zinc-900 mb-4 lowercase">WANT_TO_COLLABORATE?</h2>
               <p className="text-sm text-zinc-500 font-mono leading-relaxed max-w-md">Business inquiries or SRE technical exchange. Connect with our core node via encrypted mail.</p>
            </div>
            <a 
              href="mailto:admin@opskitpro.com" 
              className="px-10 py-5 bg-zinc-100 hover:bg-emerald-500 text-zinc-900 hover:text-white rounded-2xl font-black italic text-lg transition-all flex items-center gap-4 group"
            >
              ADMIN@OPSKITPRO.COM
              <Mail className="w-5 h-5 group-hover:scale-110" />
            </a>
          </div>
        </section>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
