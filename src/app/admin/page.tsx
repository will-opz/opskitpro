import Link from 'next/link'
import { BarChart3, BookOpen, ExternalLink, LayoutGrid, ShieldCheck } from 'lucide-react'

const sections = [
  {
    title: 'Analytics',
    description: 'Open Cloudflare traffic analysis and the private operations dashboard.',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Content',
    description: 'Review public articles and publishing entry points.',
    href: '/admin/content',
    icon: BookOpen,
  },
  {
    title: 'Navigation',
    description: 'Edit your personal links and pinned tools.',
    href: '/tools?admin=1',
    icon: LayoutGrid,
  },
]

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-grow px-4 pb-20 pt-8 sm:px-6">
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--accent-color)]">
          <ShieldCheck className="h-4 w-4" />
          Private admin
        </div>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">OpsKitPro Admin</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
          A private control surface for analytics, public content, and personal navigation. Public tools remain available without signing in.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href} className="group rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5 shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:border-emerald-500/25">
              <div className="flex items-start justify-between gap-3">
                <Icon className="h-6 w-6 text-[var(--accent-color)]" />
                <ExternalLink className="h-4 w-4 text-[var(--text-faint)] group-hover:text-[var(--accent-color)]" />
              </div>
              <h2 className="mt-6 text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{section.description}</p>
            </Link>
          )
        })}
      </section>
    </main>
  )
}
