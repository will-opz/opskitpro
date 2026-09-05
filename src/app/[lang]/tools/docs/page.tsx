import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/dictionaries";
import {
  localizeTool,
  productTools,
  type ProductLocale,
} from "@/lib/tool-catalog";
import { localizeToolGuide } from "@/lib/tool-guides";
import { buildPageMetadata } from "@/lib/seo";

const copy = {
  en: {
    title: "Tool data handling and limitations",
    description: "Detailed input, output, privacy, processing, and limitation notes for every OpsKitPro tool.",
    intro: "Use this reference when you need more detail. The tool pages stay compact so you can start working immediately.",
    local: "Local tools",
    network: "Online diagnostics",
    purpose: "Purpose",
    input: "Input",
    output: "Output",
    processing: "Where it runs",
    privacy: "Privacy",
    limitation: "Limitations",
    example: "Example",
    related: "Related tools",
    reviewed: "Last reviewed",
    open: "Open tool",
  },
  zh: {
    title: "工具数据处理与使用限制",
    description: "集中说明 OpsKitPro 各项工具的输入、输出、处理位置、隐私和使用限制。",
    intro: "需要了解细节时查阅这里。工具页面保持简洁，打开后可以直接开始操作。",
    local: "本地工具",
    network: "联网诊断",
    purpose: "用途",
    input: "输入",
    output: "输出",
    processing: "处理位置",
    privacy: "隐私",
    limitation: "限制",
    example: "示例",
    related: "相关工具",
    reviewed: "最近复核",
    open: "打开工具",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as ProductLocale;
  return buildPageMetadata(
    copy[lang].title,
    copy[lang].description,
    lang,
    "/tools/docs",
  );
}

export default async function ToolDocsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as ProductLocale;
  const dict = await getDictionary(lang);
  const text = copy[lang];
  const groups = [
    {
      id: "local",
      title: text.local,
      tools: productTools.filter((tool) => tool.processingMode === "local"),
    },
    {
      id: "network",
      title: text.network,
      tools: productTools.filter((tool) => tool.processingMode === "network"),
    },
  ];

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <main className="mx-auto w-full max-w-5xl flex-grow px-4 py-6 sm:px-6 sm:py-8">
        <header className="max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            {text.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--text-muted)] sm:text-base">
            {text.intro}
          </p>
        </header>

        <nav aria-label={text.title} className="mt-7 flex flex-wrap gap-2">
          {groups.map((group) => (
            <a
              key={group.id}
              href={`#${group.id}`}
              className="rounded-full border border-[var(--border-subtle)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] hover:border-emerald-500/30 hover:text-[var(--accent-text)]"
            >
              {group.title}
            </a>
          ))}
        </nav>

        <nav aria-label={lang === "zh" ? "按工具直达" : "Jump to tool"} className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--accent-text)]">{productTools.map(tool => <a key={tool.id} href={`#${tool.id}`} className="hover:underline">{tool.title[lang]}</a>)}</nav>
        <div className="mt-6 space-y-8">
          {groups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
                {group.title}
              </h2>
              <div className="mt-5 space-y-5">
                {group.tools.map((rawTool) => {
                  const tool = localizeTool(rawTool, lang);
                  const guide = localizeToolGuide(rawTool.id, lang);
                  const facts = [
                    [text.purpose, guide.purpose],
                    [text.input, guide.input],
                    [text.output, guide.output],
                    [text.processing, guide.processing],
                    [text.privacy, guide.privacy],
                    [text.limitation, guide.limitation],
                  ];

                  return (
                    <article
                      key={tool.id}
                      id={tool.id}
                      className="scroll-mt-24 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                            {tool.title}
                          </h3>
                          <p className="mt-1 text-xs text-[var(--text-faint)]">
                            {text.reviewed}: <time dateTime={guide.lastReviewed}>{guide.lastReviewed}</time>
                          </p>
                        </div>
                        <Link
                          href={`/${lang}${tool.href}`}
                          className="shrink-0 text-sm font-semibold text-[var(--accent-text)] hover:underline"
                        >
                          {text.open} →
                        </Link>
                      </div>

                      <dl className="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                        {facts.map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-sm font-semibold text-[var(--text-primary)]">{label}</dt>
                            <dd className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{value}</dd>
                          </div>
                        ))}
                      </dl>

                      <div className="mt-5 rounded-xl bg-[var(--surface-secondary)] p-4">
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{text.example}</p>
                        <p className="mt-1 text-sm leading-6 text-[var(--text-muted)]">{guide.example}</p>
                      </div>

                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{text.related}</span>
                        {guide.related.map((relatedId) => {
                          const related = productTools.find((entry) => entry.id === relatedId);
                          if (!related) return null;
                          return (
                            <Link
                              key={relatedId}
                              href={`/${lang}${related.href}`}
                              className="rounded-full border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:border-emerald-500/30 hover:text-[var(--accent-text)]"
                            >
                              {localizeTool(related, lang).title}
                            </Link>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
