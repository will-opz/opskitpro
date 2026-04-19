import { cookies } from 'next/headers'
import { Shield, Zap, Search, Terminal, Globe, Github, ArrowUpRight, Mail, Fingerprint, Activity, Twitter } from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export default async function AboutPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  const isZh = lang === 'zh'
  const isJapanese = lang === 'ja'

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 z-10 mt-6 md:mt-8 mb-28 relative">
        {/* Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="mb-16 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.35em] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            {isJapanese ? '運営方針' : 'Global SRE Vision'}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter mb-5 leading-tight">
             {dict.nav.about}
          </h1>
          <p className="text-sm sm:text-base text-zinc-700 leading-relaxed max-w-2xl font-medium">
            {isJapanese
              ? "OpsKitPro は、現代の SRE と開発者のために設計したエッジネイティブな診断スイートです。DNS、IP、サイト健全性を、ログイン不要で素早く切り分けられます。複雑なネットワーク環境でも、必要な情報をすぐに確認できることを大切にしています。"
              : isZh
                ? "OpsKitPro 是为现代化 SRE 与开发者打造的边缘原生诊断套件。我们提供免登录、极速响应的 DNS、IP 及网站健康取证分析。我们坚信，真正的系统稳定性源自对复杂网络环境的实时感知 —— 在基础架构产生故障时，为您提供触手可及的精准数据。"
                : "OpsKitPro is an edge-native diagnostic suite built for modern SREs and developers. We provide instant, zero-login forensics for DNS, IP, and website health. We believe that true reliability starts with real-time perception — providing the precise data you need, right when your infrastructure demands it."
            }
          </p>
        </section>

        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                label: isJapanese ? '実務向け' : 'Practical',
                value: isJapanese ? '排障の手順にすぐ使える' : 'Useful in real troubleshooting',
              },
              {
                label: isJapanese ? 'わかりやすさ' : 'Clarity',
                value: isJapanese ? '読みやすい構成で整理' : 'Structured for quick scanning',
              },
              {
                label: isJapanese ? '軽快な応答' : 'Fast Edge',
                value: isJapanese ? 'エッジで素早く確認' : 'Fast checks at the edge',
              },
            ].map((item) => (
              <div key={item.label} className="bg-white/80 backdrop-blur-md border border-black/5 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.35em]">{item.label}</div>
                  <div className="mt-2 text-sm text-zinc-700 leading-snug">{item.value}</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy - Light Theme Cards */}
        <section className="mb-24">
          <h2 className="text-[10px] font-black text-zinc-400 mb-10 uppercase tracking-[0.3em] italic flex items-center gap-3">
             <Fingerprint className="w-4 h-4 text-emerald-500" /> {isJapanese ? 'コアフィロソフィー' : 'Core Philosophy'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { 
                icon: Activity, 
                title: isJapanese ? "低遅延の診断" : (isZh ? "毫秒级取证" : "Low-Latency Forensics"), 
                desc: isJapanese ? "Cloudflare Edge 上で動く診断 API により、待ち時間を抑えたグローバルな到達性確認を行います。" : (isZh ? "所有探测 API 构建在 Cloudflare Edge 之上，实现近零延迟的全球连通性审计。" : "All probe APIs are built on Cloudflare Edge, achieving near-zero latency global connectivity auditing.")
              },
              { 
                icon: Shield, 
                title: isJapanese ? "処理の見える化" : (isZh ? "全链路透明" : "Transparent Pipeline"), 
                desc: isJapanese ? "SSL の期限やルーティングの変化も、読みやすい JSON と視認しやすいカードで整理して表示します。" : (isZh ? "无论是 SSL 到期还是 BGP 路由风险，数据永远以最原始、最直观的 JSON 审计方式呈现。" : "Whether it is SSL expiry or BGP routing risks, data is always presented in the most raw and intuitive JSON audit form.")
              },
              { 
                icon: Zap, 
                title: isJapanese ? "実務向けの設計" : (isZh ? "工业级美学" : "Industrial Aesthetics"), 
                desc: isJapanese ? "読みやすさと応答性を重視し、調査の流れを邪魔しない運用画面を目指しています。" : (isZh ? "追求极致的渲染效率与 HUD 视觉呈现，将冷冰冰的运维任务转化为充满动感的取证艺术。" : "Pursuing extreme rendering efficiency and HUD visual presentation, turning cold operations tasks into dynamic forensic art.")
              },
              { 
                icon: Terminal, 
                title: isJapanese ? "明るい配色" : (isZh ? "去黑化设计" : "Light-Mode Evolution"), 
                desc: isJapanese ? "白基調とエメラルド系のアクセントで、確認作業を落ち着いて進めやすい画面にしています。" : (isZh ? "摒弃压抑的深色块，采用通透的高级白与翡翠绿，让排障过程更加清晰、冷静。" : "Discarding depressing dark blocks, adopting transparent premium white and emerald green, making the troubleshooting process clearer and calmer.")
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100 group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20 transition-all">
                  <item.icon className="w-5 h-5 text-zinc-900 group-hover:text-emerald-500" />
                </div>
                <h3 className="text-xl font-bold text-zinc-900 mb-3 italic">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed font-mono">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack - Sub-grid */}
        <section className="mb-24">
           <h2 className="text-[10px] font-black text-zinc-400 mb-10 uppercase tracking-[0.3em] italic flex items-center gap-3">
             <Activity className="w-4 h-4 text-emerald-500" /> {isJapanese ? '技術スタック' : 'Technology Stack'}
          </h2>
           <div className="bg-zinc-50 rounded-[2.5rem] border border-black/5 p-10 font-mono text-[10px] text-zinc-500 uppercase tracking-widest grid grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Next.js 14 (App Router + Standalone)</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> CF Edge Runtime</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Tailwind CSS v3</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Lucide Icons</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> Quartz 4</div>
              <div className="flex items-center gap-3"><span className="text-emerald-500">▸</span> i18n Strategy</div>
           </div>
        </section>

        {/* Contact/Support - Light Layout */}
        <section>
          <div className="bg-white border border-black/5 rounded-[3rem] p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
               <h2 className="text-3xl font-black italic tracking-tighter text-zinc-900 mb-4">{isJapanese ? 'ご相談・連携はこちら' : 'WANT TO COLLABORATE?'}</h2>
               <p className="text-sm text-zinc-500 font-mono leading-relaxed max-w-md">{isJapanese ? '導入相談や運用の意見交換など、お気軽にご連絡ください。' : 'Business inquiries or SRE technical exchange. Connect with our core node via encrypted mail.'}</p>
            </div>
            <div className="flex flex-col gap-4">
              <a 
                href="https://x.com/deopsai" 
                target="_blank"
                className="px-10 py-5 bg-zinc-900 text-white hover:bg-emerald-600 rounded-2xl font-black italic text-lg transition-all flex items-center justify-center gap-4 group"
              >
                {isJapanese ? 'X で連絡' : 'FOLLOW @DEOPSAI'}
                <Twitter className="w-5 h-5 group-hover:scale-110" />
              </a>
              <a 
                href="mailto:admin@opskitpro.com" 
                className="px-10 py-5 bg-zinc-100 hover:bg-emerald-100 text-zinc-900 rounded-2xl font-black italic text-lg transition-all flex items-center justify-center gap-4 group border border-black/5"
              >
                {isJapanese ? 'メールで連絡' : 'ADMIN@OPSKITPRO.COM'}
                <Mail className="w-5 h-5 group-hover:scale-110" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
