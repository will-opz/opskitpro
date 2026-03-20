import Link from 'next/link'
import { getDictionary } from '../../../dictionaries'
import { getAllKbDocs } from '../../../lib/mdx'
import { Book, Terminal, ArrowRight, BrainCircuit } from 'lucide-react'

export const metadata = { title: 'Knowledge Base | deops.org' }

export default async function KbIndexPage({ params }: { params: Promise<{ lang: 'en' | 'zh' }> }) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  const docs = getAllKbDocs()

  return (
    <div className="min-h-screen flex flex-col relative w-full pt-16">
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 z-10 flex flex-col mb-16">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {dict.kb_index.title_part1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-mono italic">{dict.kb_index.title_part2}</span>
            </h1>
            <p className="text-zinc-400 max-w-lg leading-relaxed">
              {dict.kb_index.subtitle}
            </p>
          </div>
          
          <Link href={`/${lang}/kb/chat`} className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-zinc-800/50 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 transition-all">
            <BrainCircuit className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-sm font-semibold">{dict.kb_index.btn_ai_copilot}</span>
          </Link>
        </div>

        {/* List Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8 border-b border-zinc-800 pb-4">
            <Book className="w-5 h-5 text-zinc-500" />
            <h2 className="text-xl font-semibold text-zinc-300">{dict.kb_index.runbooks}</h2>
          </div>

          {docs.length === 0 ? (
             <div className="text-zinc-500 font-mono text-sm pb-10">No runbooks available yet.</div>
          ) : (
            docs.map(doc => (
              <Link key={doc.slug} href={`/${lang}/kb/${doc.slug}`} className="block group">
                <div className="glass-card rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 md:p-8 hover:border-emerald-500/30 transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/0 group-hover:bg-emerald-500/100 transition-colors"></div>
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <h3 className="text-xl font-bold text-zinc-100 group-hover:text-white transition-colors">
                      {doc.title}
                    </h3>
                    <div className="font-mono text-xs text-zinc-500 flex items-center gap-2">
                       <Terminal className="w-3.5 h-3.5" />
                       {doc.date}
                    </div>
                  </div>
                  
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    {doc.description}
                  </p>
                  
                  <div className="flex items-center text-emerald-500 text-sm font-semibold gap-2 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    {dict.kb_index.read_more} <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
