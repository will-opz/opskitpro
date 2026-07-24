import Image from "next/image";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { MDXRemote } from "next-mdx-remote/rsc";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import { getBlogPostBySlug, getAllBlogPosts } from "@/lib/blog";
import { mdxComponents } from "@/components/blog/mdx-components";
import { buildPageMetadata, buildTechArticleJsonLd } from "@/lib/seo";
import { extractTocFromMarkdown } from "@/lib/toc";
import { resolveLocalizedHref } from "@/lib/localized-href";

export function generateStaticParams() {
  const posts = getAllBlogPosts("en");
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang: langParam, slug } = await params;
  const lang = (langParam || "en") as "zh" | "en";
  const post = getBlogPostBySlug(lang, slug);

  if (!post) {
    return {
      title: "Blog",
    };
  }

  return buildPageMetadata(post.title, post.summary, lang, `/blog/${slug}`, {
    openGraph: {
      type: "article",
      images: [{ url: post.coverImage || "" }],
    },
  });
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang: langParam, slug } = await params;
  const lang = (langParam || "en") as "zh" | "en";
  const dict = await getDictionary(lang);
  const post = getBlogPostBySlug(lang, slug);

  if (!post) {
    notFound();
  }

  const isToolArticle = post.actionKind === "tool";
  const blogHref = resolveLocalizedHref(lang, "/blog");
  const ctaHref = resolveLocalizedHref(lang, post.ctaPath);
  const relatedPosts = getAllBlogPosts(lang)
    .filter((entry) => post.related.includes(entry.slug))
    .slice(0, 3);

  const jsonLd = buildTechArticleJsonLd({
    headline: post.title,
    description: post.summary,
    datePublished: post.publishedAt,
    imageUrl: post.coverImage || "",
    url: `https://opskitpro.com/${lang}/blog/${slug}`,
  });

  const toc = post.source === "mdx" && post.content ? extractTocFromMarkdown(post.content) : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative mx-auto mb-28 w-full max-w-6xl flex-grow px-6 pt-6 pb-6 md:pt-8">
        <div
          className={`absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-br ${post.accent} blur-3xl opacity-70`}
        />

        <div className="mb-8">
          <Link
            href={blogHref}
            className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-[11px] font-medium tracking-[0.16em] text-zinc-600 transition-colors hover:border-emerald-500/30 hover:text-emerald-600"
          >
            <ArrowLeft className="h-4 w-4" />
            {lang === "zh" ? "返回博客" : "Back to blog"}
          </Link>
        </div>

        <article className="overflow-hidden rounded-[2.5rem] border border-zinc-100 bg-white/90 shadow-[0_30px_120px_rgba(15,23,42,0.08)] backdrop-blur-xl">
          <div className="border-b border-zinc-100 px-6 py-6 sm:px-10 sm:py-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-[10px] font-semibold tracking-[0.24em] text-emerald-600">
                {post.category || "Blog"}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                <Calendar className="h-3.5 w-3.5" />
                {post.publishedAt}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.2em] text-zinc-400">
                <Clock className="h-3.5 w-3.5" />
                {post.readTime}
              </span>
            </div>

            <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
              <div>
                <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tighter text-zinc-900 sm:text-5xl md:text-6xl">
                  {post.title}
                </h1>
                <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-700">
                  {post.summary}
                </p>

                <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3 text-sm text-emerald-700">
                  <BookOpen className="h-4 w-4" />
                  {isToolArticle
                    ? lang === "zh"
                      ? "这篇文章按设计、实现和用法完整展开，可以直接往下读。"
                      : "This article reads through design, implementation, and usage in one flow."
                    : lang === "zh"
                      ? "这里是主站的整理版，必要时可以回到下方文章列表继续看。"
                      : "This is the organized version on the main site. Use the article list below if you want to keep exploring."}
                </div>

                <a
                  href={ctaHref}
                  target={
                    post.ctaPath?.startsWith("http") ? "_blank" : undefined
                  }
                  rel={
                    post.ctaPath?.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                >
                  {isToolArticle
                    ? lang === "zh"
                      ? "打开工具"
                      : "Open tool"
                    : lang === "zh"
                      ? "浏览文章列表"
                      : "Browse articles"}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              {post.coverImage ? (
                <figure className="overflow-hidden rounded-[2rem] border border-zinc-100 bg-zinc-950 shadow-sm">
                  <div className="relative aspect-[16/10]">
                    <Image
                      src={post.coverImage}
                      alt={post.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 420px"
                      priority
                    />
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${post.accent} opacity-70`}
                    />
                  </div>
                </figure>
              ) : null}
            </div>
          </div>

          <div className="grid gap-10 px-6 py-8 sm:px-10 lg:grid-cols-[minmax(0,1fr)_280px]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                  {lang === "zh" ? "关于正文" : "About the article"}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-700">
                  {isToolArticle
                    ? lang === "zh"
                      ? "这篇文章按完整正文来整理，从背景、实现到用法都可以连起来读。"
                      : "This page is organized as a full read-through, from background to implementation and usage."
                    : lang === "zh"
                      ? "这里按主站文章来整理，保留要点和结构，方便快速阅读。"
                      : "This page is organized as a main-site article, keeping the key points and structure easy to read."}
                </p>
              </div>

              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === "zh" ? "正文" : "Article body"}
                </div>
                {post.source === "mdx" && post.content ? (
                  <article className="mt-6 prose prose-zinc prose-emerald max-w-none">
                    <MDXRemote
                      source={post.content}
                      components={mdxComponents}
                      options={{
                        mdxOptions: {
                          rehypePlugins: [
                            rehypeSlug,
                            [
                              rehypePrettyCode,
                              {
                                theme: "github-dark",
                              },
                            ],
                          ],
                        },
                      }}
                    />
                  </article>
                ) : null}
              </div>
            </div>

            <aside className="space-y-6">
              {toc.length > 0 && (
                <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm hidden lg:block sticky top-8">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    {lang === "en" ? "On this page" : "目录"}
                  </div>
                  <nav className="mt-4 space-y-2">
                    {toc.map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-sm transition-colors hover:text-emerald-600 ${
                          heading.level === 3 ? "pl-4 text-zinc-500" : "font-medium text-zinc-700"
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              <div className="rounded-[2rem] border border-zinc-100 bg-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === "zh" ? "相关文章" : "Related articles"}
                </div>
                <div className="mt-4 space-y-3">
                  {relatedPosts.map((item) => (
                    <a
                      key={item.slug}
                      href={`/${lang}/blog/${item.slug}`}
                      className="block rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 transition-colors hover:border-emerald-500/20 hover:bg-emerald-50/40"
                    >
                      <p className="text-xs font-semibold tracking-[0.16em] text-emerald-600">
                        {item.actionKind === "tool"
                          ? lang === "zh" ? "工具" : "Tool"
                          : lang === "zh" ? "文章" : "Article"}
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-zinc-900">
                        {item.title}
                      </p>
                      <p className="mt-2 text-xs leading-6 text-zinc-500">
                        {item.summary}
                      </p>
                    </a>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-zinc-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                  {lang === "zh" ? "下一步" : "Next step"}
                </div>
                <p className="mt-4 text-sm leading-7 text-zinc-700">
                  {isToolArticle
                    ? lang === "zh"
                      ? "可以先打开实际工具试一试，再回到相关文章继续看。"
                      : "Open the actual tool to try it, then come back to related articles if needed."
                    : lang === "zh"
                      ? "如果想继续深入，可以接着看工具列表或各个工具文章。"
                      : "If you want to go deeper, continue with Tools or individual articles."}
                </p>
                <div className="mt-5 flex flex-col gap-3">
                  <Link
                    href={blogHref}
                    className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition-colors hover:border-emerald-500/20 hover:text-emerald-600"
                  >
                    {lang === "zh" ? "返回博客列表" : "Back to blog"}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={ctaHref}
                    target={
                      post.ctaPath?.startsWith("http") ? "_blank" : undefined
                    }
                    rel={
                      post.ctaPath?.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
                  >
                    {isToolArticle
                      ? lang === "zh" ? "打开工具" : "Open tool"
                      : lang === "zh" ? "浏览文章列表" : "Browse articles"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>

      <SiteFooter dict={dict} />
    </>
  );
}
