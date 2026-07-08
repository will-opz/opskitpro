import Link from "next/link";
import { ArrowLeft, BookOpen, ExternalLink, FileText } from "lucide-react";
import { getBlogPosts } from "@/content/blog-posts";

export default function AdminContentPage() {
  const posts = getBlogPosts("en");

  return (
    <main className="mx-auto w-full max-w-5xl flex-grow px-4 pb-20 pt-8 sm:px-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--accent-color)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Admin
      </Link>

      <div className="mt-6">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--accent-color)]">
          <BookOpen className="h-4 w-4" />
          Content
        </div>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--text-primary)]">
          Public content overview
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          {posts.length} published articles are currently included in the public
          site build.
        </p>
      </div>

      <section className="mt-8 divide-y divide-[var(--border-subtle)] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] shadow-[var(--shadow-soft)]">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex items-center justify-between gap-4 px-4 py-4 hover:bg-[var(--surface-secondary)] sm:px-5"
          >
            <span className="flex min-w-0 items-center gap-3">
              <FileText className="h-4 w-4 shrink-0 text-[var(--accent-color)]" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                  {post.title}
                </span>
                <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">
                  {post.slug}
                </span>
              </span>
            </span>
            <ExternalLink className="h-4 w-4 shrink-0 text-[var(--text-faint)] group-hover:text-[var(--accent-color)]" />
          </Link>
        ))}
      </section>
    </main>
  );
}
