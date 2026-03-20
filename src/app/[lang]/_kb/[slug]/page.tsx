import { MDXRemote } from 'next-mdx-remote/rsc'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getKbBySlug, getAllKbSlugs } from '../../../../lib/mdx'
import { ArrowLeft, Calendar } from 'lucide-react'

export const dynamicParams = false
export async function generateStaticParams() {
  const slugs = getAllKbSlugs()
  const locales = ['en', 'zh']
  return locales.flatMap((lang) => 
    slugs.map((slug) => ({
      lang,
      slug,
    }))
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getKbBySlug(slug)
  if (!doc) return { title: 'Not Found' }
  return { title: `${doc.title} | deops.org` }
}

export default async function KbDocPage({ params }: { params: Promise<{ lang: string, slug: string }> }) {
  const { lang, slug } = await params
  const doc = getKbBySlug(slug)

  if (!doc) {
    notFound()
  }

  return (
    <div className="min-h-screen flex flex-col relative w-full pt-16">
      <main className="flex-grow w-full max-w-3xl mx-auto px-6 z-10 flex flex-col mb-24 animate-in fade-in duration-700">
        
        <Link href={`/${lang}/kb`} className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-400 transition-colors mb-12 w-fit">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-mono text-sm leading-none pt-[1px]">Back to Knowledge Base</span>
        </Link>
        
        <article className="prose prose-invert prose-zinc max-w-none 
          prose-headings:text-zinc-100 prose-headings:font-bold
          prose-h1:text-4xl prose-h1:tracking-tight prose-h1:mb-8
          prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:border-zinc-800 prose-h2:pb-2
          prose-a:text-emerald-400 prose-a:no-underline hover:prose-a:underline
          prose-code:text-emerald-300 prose-code:bg-zinc-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
          prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800
          prose-blockquote:border-emerald-500/50 prose-blockquote:bg-emerald-500/5 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:not-italic prose-blockquote:text-zinc-300
          prose-strong:text-zinc-200">
          
          <div className="mb-12 border-b border-zinc-800 pb-8">
            <h1 className="!mb-4">{doc.title}</h1>
            <div className="flex items-center gap-4 text-zinc-500 font-mono text-sm">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {doc.date}
              </span>
            </div>
          </div>

          <MDXRemote source={doc.content} />
          
        </article>
      </main>
    </div>
  )
}
