import { cookies } from 'next/headers'
import { Shield, Zap, Terminal, Mail, Fingerprint, Activity, Twitter } from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'

export default async function AboutPage() {
  const cookieStore = cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en" | "ja" | "tw";
  const dict = await getDictionary(lang)
  const isZh = lang === 'zh'
  const isJapanese = lang === 'ja'
  const aboutCopy = {
    badge: isJapanese ? '運営方針' : isZh ? '关于方针' : lang === 'tw' ? '運營方針' : 'About / Mission',
    title: isJapanese ? '運営' : isZh ? '关于我们' : lang === 'tw' ? '關於我們' : 'About',
    subtitle: isJapanese
      ? 'OpsKitPro は、現代の SRE と開発者のために設計したエッジネイティブな診断スイートです。DNS、IP、サイト健全性を、ログイン不要で素早く切り分けられます。複雑なネットワーク環境でも、必要な情報をすぐに確認できることを大切にしています。'
      : isZh
        ? 'OpsKitPro 是为现代化 SRE 与开发者打造的边缘原生诊断套件。我们提供免登录、极速响应的 DNS、IP 及网站健康取证分析。我们强调的是更快的判断、更清晰的结果，以及更少的视觉噪音。'
        : lang === 'tw'
          ? 'OpsKitPro 是為現代化 SRE 與開發者打造的邊緣原生診斷套件。我們提供免登入、快速回應的 DNS、IP 與網站健康取證分析，重視更快的判斷、更清楚的結果，以及更少的視覺噪音。'
          : 'OpsKitPro is an edge-native diagnostic suite built for modern SREs and developers. We provide instant, zero-login forensics for DNS, IP, and website health, with a focus on faster judgment and clearer output.',
    highlights: [
      {
        label: isJapanese ? '実務向け' : isZh ? '实战优先' : lang === 'tw' ? '實戰優先' : 'Practical',
        value: isJapanese ? '排障の手順にすぐ使える' : isZh ? '直接用于排障判断' : lang === 'tw' ? '可直接用於排障判斷' : 'Useful in live troubleshooting',
      },
      {
        label: isJapanese ? 'わかりやすさ' : isZh ? '清晰结构' : lang === 'tw' ? '清晰結構' : 'Clarity',
        value: isJapanese ? '読みやすい構成で整理' : isZh ? '结果与流程更易扫读' : lang === 'tw' ? '結果與流程更易掃讀' : 'Results are easy to scan',
      },
      {
        label: isJapanese ? '軽快な応答' : isZh ? '轻快响应' : lang === 'tw' ? '輕快回應' : 'Fast Edge',
        value: isJapanese ? 'エッジで素早く確認' : isZh ? '在边缘节点快速确认' : lang === 'tw' ? '在邊緣節點快速確認' : 'Fast checks at the edge',
      },
    ],
    philosophyTitle: isJapanese ? 'コアフィロソフィー' : isZh ? '核心理念' : lang === 'tw' ? '核心理念' : 'Core Philosophy',
    techTitle: isJapanese ? '技術スタック' : isZh ? '技术栈' : lang === 'tw' ? '技術棧' : 'Technology Stack',
    contactTitle: isJapanese ? 'ご相談・連携はこちら' : isZh ? '欢迎联系与合作' : lang === 'tw' ? '歡迎聯繫與合作' : 'Contact / Collaboration',
    contactDesc: isJapanese
      ? '導入相談や運用の意見交換など、お気軽にご連絡ください。'
      : isZh
        ? '欢迎进行导入咨询、产品交流或运维经验交换。'
        : lang === 'tw'
          ? '歡迎進行導入諮詢、產品交流或維運經驗交換。'
          : 'For adoption, product feedback, or SRE exchange, feel free to reach out.',
    contactX: isJapanese ? 'X で連絡' : isZh ? '通过 X 联系' : lang === 'tw' ? '透過 X 聯繫' : 'Contact on X',
    contactMail: isJapanese ? 'メールで連絡' : isZh ? '通过邮件联系' : lang === 'tw' ? '透過郵件聯繫' : 'Contact by email',
  }

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 z-10 mt-6 md:mt-8 mb-28 relative">
        {/* Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[860px] h-[320px] bg-emerald-500/4 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="mb-16 rounded-[2.5rem] border border-white/80 bg-white/85 backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10 shadow-sm text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.18em] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            {aboutCopy.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-zinc-900 tracking-tighter mb-5 leading-tight">
             {aboutCopy.title}
          </h1>
          <p className="text-base sm:text-lg text-zinc-800 leading-8 max-w-3xl font-normal">
            {aboutCopy.subtitle}
          </p>
        </section>

        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aboutCopy.highlights.map((item) => (
              <div key={item.label} className="bg-white/88 backdrop-blur-md border border-zinc-100 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">{item.label}</div>
                  <div className="mt-2 text-sm text-zinc-700 leading-snug">{item.value}</div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy - Light Theme Cards */}
        <section className="mb-24">
          <h2 className="text-[10px] font-semibold text-zinc-400 mb-10 tracking-[0.18em] flex items-center gap-3">
             <Fingerprint className="w-4 h-4 text-emerald-500" /> {aboutCopy.philosophyTitle}
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
              <div key={idx} className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-lg hover:border-emerald-500/20 transition-all group">
                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100 group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20 transition-all">
                  <item.icon className="w-5 h-5 text-zinc-900 group-hover:text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">{item.title}</h3>
                <p className="text-sm text-zinc-600 leading-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack - Sub-grid */}
        <section className="mb-24">
           <h2 className="text-[10px] font-semibold text-zinc-400 mb-8 tracking-[0.18em] flex items-center gap-3">
             <Activity className="w-4 h-4 text-emerald-500" /> {aboutCopy.techTitle}
          </h2>
           <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 sm:p-10 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-zinc-700">
              {[
                'Next.js 14 (App Router + Standalone)',
                'CF Edge Runtime',
                'Tailwind CSS v3',
                'Lucide Icons',
                'Quartz 4',
                'i18n Strategy',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-3">
                  <span className="text-emerald-500">•</span>
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
           </div>
        </section>

        {/* Contact/Support - Light Layout */}
        <section>
          <div className="bg-white border border-zinc-100 rounded-[3rem] p-10 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
               <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-4">{aboutCopy.contactTitle}</h2>
               <p className="text-sm text-zinc-600 leading-7 max-w-md">{aboutCopy.contactDesc}</p>
            </div>
            <div className="flex flex-col gap-4">
              <a 
                href="https://x.com/deopsai" 
                target="_blank"
                className="px-10 py-5 bg-zinc-900 text-white hover:bg-emerald-600 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-4 group shadow-sm"
              >
                {aboutCopy.contactX}
                <Twitter className="w-5 h-5 group-hover:scale-110" />
              </a>
              <a 
                href="mailto:admin@opskitpro.com" 
                className="px-10 py-5 bg-zinc-100 hover:bg-emerald-100 text-zinc-900 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-4 group border border-zinc-100 shadow-sm"
              >
                {aboutCopy.contactMail}
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
