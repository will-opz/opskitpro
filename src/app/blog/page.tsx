import { cookies } from 'next/headers'
import Link from 'next/link'
import { FileText, Construction } from 'lucide-react'
import { getDictionary } from '@/dictionaries'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'


export default async function BlogPage() {
  const cookieStore = await cookies();
  const lang = (cookieStore.get("NEXT_LOCALE")?.value || "zh") as "zh" | "en";
  const dict = await getDictionary(lang)

  const isZh = lang === 'zh'

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-grow w-full max-w-4xl mx-auto px-6 z-10 mt-4 mb-32 flex flex-col items-center justify-center">
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-8 border border-zinc-200/60 shadow-sm">
            <Construction className="w-10 h-10 text-zinc-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 tracking-tight mb-4">
            {isZh ? "技术笔记即将上线" : "Tech Blog Coming Soon"}
          </h1>
          <p className="text-zinc-500 max-w-md mx-auto leading-relaxed mb-10 font-mono text-sm">
            {isZh 
              ? "深度技术文章与 SRE 实战笔记。涵盖 K8s 调优、网络安全与 AI 自动化工作流，正在全力撰写中。"
              : "In-depth tech articles and SRE field notes. Covering K8s tuning, cybersecurity, and AI automation workflows — currently being authored."
            }
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/services" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white rounded-xl font-mono text-sm hover:bg-emerald-600 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4" />
              {isZh ? "浏览服务矩阵" : "Browse Matrix"}
            </Link>
            <a 
              href="https://kb.deops.org" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 border border-zinc-200 text-zinc-700 rounded-xl font-mono text-sm hover:border-emerald-500 hover:text-emerald-600 transition-all bg-white/60 shadow-sm"
            >
              {isZh ? "查看数字花园" : "Digital Garden"} →
            </a>
          </div>
        </div>
      </main>

      <SiteFooter dict={dict} />
    </>
  )
}
