import { cookies } from 'next/headers'
import Link from 'next/link'
import { 
  ArrowRight, 
  Clock, 
  Activity, 
  ShieldCheck, 
  Globe,
  Eye,
  Radio,
  Terminal,
  Zap
} from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export default async function BlogPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  const isZh = lang === 'zh'
  const isJapanese = lang === 'ja'

  // Simulating the Articles in KB/02_Articles
  const articles = [
    {
      id: 'opskitpro-edge-stability-rebuild',
      title: isJapanese ? "OpsKitPro のエッジ基盤を見直した 48 時間の記録" : (isZh ? "OpsKitPro 边缘网关稳定性重构：48小时 SRE 运维实战" : "OpsKitPro Edge Stability Rebuild: A 48-Hour SRE Field Note"),
      desc: isJapanese ? "Cloudflare Edge 上での切り分け手順と、Next.js 14 まわりの互換性問題を整理した実践メモです。" : (isZh ? "深度复盘 OpsKitPro 在 Cloudflare Edge 环境下的故障排查过程，涵盖已解决的 Next.js 14 兼容性问题。" : "A deep dive into troubleshooting OpsKitPro on Cloudflare Edge, covering resolved Next.js 14 compatibility issues."),
      date: "2026-03-27",
      tag: "SRE_INTEL",
      read: "6 min",
      icon: Terminal,
      color: "text-blue-500 bg-blue-500/10",
      href: "https://kb.opskitpro.com/02_Articles/opskitpro-edge-stability-rebuild"
    },
    {
      id: 'opskitpro-mobile-ui-optimization',
      title: isJapanese ? "OpsKitPro の UI 微調整: 見やすさとビルド改善" : (isZh ? "OpsKitPro 极致打磨：拟光美学与 Next.js 编译死锁修复" : "OpsKitPro UI Polish: Glassmorphism & Next.js Build Fixes"),
      desc: isJapanese ? "モバイルのはみ出し修正、見やすい配色、Next.js のビルド詰まり解消までをまとめた記録です。" : (isZh ? "记录修复前端横向滚动条溢出、设计流动玻璃拟物色组，及打破 Next.js 强制静态抓取编译链的实战历程。" : "Fixing mobile overflow, crafting fluid glassmorphism UI, and bypassing Next.js static build locks."),
      date: "2026-04-10",
      tag: "UI/UX & SRE",
      read: "5 min",
      icon: Zap,
      color: "text-teal-500 bg-teal-500/10",
      href: "https://kb.opskitpro.com/02_Articles/opskitpro-mobile-ui-optimization"
    },
    {
      id: 'website-not-loading-fix',
      title: isJapanese ? "サイトが開かないときの確認手順 5 選" : (isZh ? "网站打不开怎么办？5个排空步骤快速定位故障" : "Website not loading? 5 steps to diagnose quickly"),
      desc: isJapanese ? "DNS、SSL、CDN のどこで止まっているかを、順番に素早く切り分ける方法です。" : (isZh ? "从 DNS 解析到 SSL 状态，深度解析并提供一键排查方案。" : "From DNS resolution to SSL status, depth analysis and one-key troubleshooting solution."),
      date: "2026-03-25",
      tag: "DIAGNOSTIC",
      read: "3 min",
      icon: Activity,
      color: "text-emerald-500 bg-emerald-500/10",
      href: "/blog" // Placeholder link
    },
    {
      id: 'ip-lookup-tool-guide',
      title: isJapanese ? "IP の詳しい情報を確認するには" : (isZh ? "如何查询 IP 详细信息？了解地理位置与 ASN 取证" : "How to check IP details? Geolocation & ASN forensics"),
      desc: isJapanese ? "所在地、ASN、回線種別、Proxy / VPN の有無を手早く把握したいときの見方をまとめています。" : (isZh ? "需要查询 IP 的真实地理位置、所属运营商 (ISP) 或是否为代理 IP？" : "Need to find IP location, ISP or whether it is proxy/VPN? Let's trace it."),
      date: "2026-03-25",
      tag: "SECURITY",
      read: "5 min",
      icon: ShieldCheck,
      color: "text-purple-500 bg-purple-500/10",
      href: "/blog"
    },
    {
      id: 'understanding-dns-records',
      title: isJapanese ? "DNS レコードの見方: A, MX, CNAME, TXT の違い" : (isZh ? "DNS 记录类型全解析：A, MX, CNAME, TXT 是干什么的？" : "DNS Records Explained: A, MX, CNAME, TXT"),
      desc: isJapanese ? "DNS 設定で迷いやすいレコードの役割を、できるだけやさしく整理しています。" : (isZh ? "搞不懂 DNS 配置？本文用通俗易懂的语言为你解析各种记录类型。" : "Confused about DNS config? We explain record types in plain language."),
      date: "2026-03-25",
      tag: "NETWORK",
      read: "4 min",
      icon: Globe,
      color: "text-blue-500 bg-blue-500/10",
      href: "/blog"
    },
    {
      id: 'jp-ui-density-guidelines',
      title: isJapanese ? "日本向け UI で気をつけたい 3 つのこと" : "3 UI details that matter for Japanese users",
      desc: isJapanese ? "余白、説明の強さ、言葉の温度感を整えると、見やすさが一段上がります。" : "Spacing, wording tone, and density can make a big difference for Japanese audiences.",
      date: "2026-04-20",
      tag: "UX",
      read: "4 min",
      icon: Eye,
      color: "text-slate-500 bg-slate-500/10",
      href: "/blog"
    }
  ]

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-grow w-full max-w-7xl mx-auto px-6 z-10 mt-6 md:mt-8 mb-28 relative">
        {/* Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <div className="mb-12 text-center md:text-left border-b border-zinc-100 pb-10">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-black uppercase tracking-[0.35em] mb-5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              {isJapanese ? '技術記事' : 'Intelligence Streaming'}
           </div>
           <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-zinc-900 tracking-tighter mb-6 leading-tight">
              {dict.nav.blog}
           </h1>
           <p className="text-sm sm:text-base text-zinc-700 max-w-xl font-medium leading-relaxed">
              {isJapanese
                ? "可観測性、サイト信頼性、エッジ基盤の現場メモをまとめています。知識ベースと連携した、実務寄りの内容です。"
                : isZh
                  ? "来自可观测性、站点可靠性与边缘架构一线的实战记录。包含深度技术取证与架构拆解，与知识库实时同步。"
                  : "Practical insights from the front lines of observability, site reliability, and edge infrastructure. Detailed forensics and architectural deep-dives, synced from our knowledge base."
              }
              <br/>
              <span className="opacity-40 italic mt-2 block">{isJapanese ? 'OpsKitPro ナレッジベースと連携しています。' : 'Powered by OpsKitPro Content Engine.'}</span>
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          {[
            {
              label: isJapanese ? '最新' : 'Latest',
              value: isJapanese ? '現場の改善メモを更新中' : 'Fresh notes from the field',
            },
            {
              label: isJapanese ? '用途' : 'Use case',
              value: isJapanese ? '排障と設計の両方に役立つ' : 'Useful for troubleshooting and design',
            },
            {
              label: isJapanese ? '連携' : 'Link',
              value: isJapanese ? '知識ベースへすぐ移動' : 'Jump to the knowledge base',
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

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {articles.map((article, idx) => (
             <Link 
               key={idx} 
               href={article.href} 
               className="group flex flex-col bg-white border border-black/5 rounded-[2rem] p-7 shadow-sm hover:shadow-2xl hover:border-emerald-500/20 transition-all relative overflow-hidden"
             >
                {/* Visual Accent */}
                <article.icon className="absolute top-0 right-0 p-8 scale-150 opacity-[0.03] group-hover:opacity-10 transition-opacity" />
                
                <div className="relative z-10">
                   <div className="flex items-center justify-between mb-6">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${article.color}`}>
                          {article.tag}
                       </span>
                       <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono">
                          <Clock className="w-3 h-3" /> {article.read}
                       </div>
                   </div>

                   <h3 className="text-lg sm:text-xl font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors leading-tight mb-3 italic">
                      {article.title}
                   </h3>
                   <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed font-mono opacity-80 mb-6">
                      {article.desc}
                   </p>

                   <div className="pt-5 border-t border-zinc-50 flex items-center justify-between mt-auto">
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{article.date}</span>
                      <div className="w-10 h-10 rounded-xl bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:translate-x-1">
                         <ArrowRight className="w-4 h-4" />
                      </div>
                   </div>
                </div>
             </Link>
           ))}

           {/* Newsletter / CTA Placeholder */}
           <div className="lg:col-span-1 bg-white border border-black/5 rounded-[2rem] p-8 text-zinc-900 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all relative overflow-hidden group font-mono">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                 <Terminal className="w-16 h-16" />
              </div>
              <div>
                 <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-6 italic underline decoration-emerald-500/30 underline-offset-4">{isJapanese ? '購読する' : 'Join the Chain'}</h4>
                 <h3 className="text-2xl font-black italic tracking-tighter mb-4">{isJapanese ? '最新の知見を受け取る' : 'WANT MORE INTEL?'}</h3>
                 <p className="text-[10px] text-zinc-400 font-mono leading-relaxed mb-8 opacity-80 uppercase italic">{isJapanese ? '実運用で役立つ SRE の知見を、定期的にお届けします。' : 'Get the latest SRE techniques delivered straight to your terminal.'}</p>
              </div>
              <div className="flex items-center gap-2 p-1.5 bg-zinc-50 border border-zinc-100 rounded-xl focus-within:border-emerald-500/30 transition-all">
                 <input type="email" placeholder={isJapanese ? "メールアドレスを入力" : "ADMIN@NODE.LOCAL"} className="bg-transparent border-none outline-none text-[10px] px-3 py-2 flex-grow placeholder:opacity-40 uppercase font-mono" />
                 <button className="p-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg transition-all shadow-md shadow-emerald-500/20">
                    <Zap className="w-4 h-4 fill-current" />
                 </button>
              </div>
           </div>
        </div>

        {/* Knowledge Base Secondary Banner */}
           <div className="mt-24 p-10 sm:p-12 bg-white border border-black/5 rounded-[3rem] shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 sm:gap-10">
           <div className="flex-1">
              <h2 className="text-3xl font-black italic tracking-tighter text-zinc-900 mb-4">{isJapanese ? 'ナレッジベース' : 'DEEP_KNOWLEDGE_NODE'}</h2>
              <p className="text-sm text-zinc-500 font-mono leading-relaxed max-w-md">{isJapanese ? 'アーキテクチャ、Kubernetes、AI 導入の実践ガイドをまとめた専用アーカイブです。' : 'Our specialized vault for architectural patterns, Kubernetes orchestration, and AI deployment guides.'}</p>
           </div>
           <a 
             href="https://kb.opskitpro.com" 
             target="_blank" 
             rel="noopener noreferrer"
             className="px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-2xl font-black italic text-lg hover:scale-105 transition-all flex items-center gap-4 group shadow-xl shadow-emerald-500/20"
           >
              {isJapanese ? 'ナレッジを見る' : 'ACCESS_VAULT'}
              <Radio className="w-5 h-5 group-hover:animate-pulse" />
           </a>
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
