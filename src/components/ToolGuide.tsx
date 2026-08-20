import Link from "next/link";

import {
  localizeTool,
  productTools,
  type ProductLocale,
  type ProductToolId,
} from "@/lib/tool-catalog";
import { localizeToolGuide } from "@/lib/tool-guides";
import { buildToolPageJsonLd, serializeJsonLd } from "@/lib/structured-data";

const labels = {
  en: {
    eyebrow: "About this tool",
    title: "What it does and how your data is handled",
    purpose: "Purpose",
    input: "Input",
    output: "Output",
    processing: "Where it runs",
    privacy: "Privacy",
    limitation: "Limitations",
    example: "Example",
    related: "Related tools",
    reviewed: "Last reviewed",
    localBadge: "Local processing · Not uploaded",
    networkBadge: "Internet required · Data flow explained",
  },
  zh: {
    eyebrow: "工具说明",
    title: "功能、处理方式与隐私",
    purpose: "用途",
    input: "输入",
    output: "输出",
    processing: "处理位置",
    privacy: "隐私",
    limitation: "限制",
    example: "示例",
    related: "相关工具",
    reviewed: "最近复核",
    localBadge: "本地处理 · 不上传",
    networkBadge: "需要联网 · 数据流透明",
  },
} as const;

export function ToolGuide({ id, lang }: { id: ProductToolId; lang: ProductLocale }) {
  const guide = localizeToolGuide(id, lang);
  const jsonLd = buildToolPageJsonLd(id, lang);
  const copy = labels[lang];
  const tool = productTools.find((entry) => entry.id === id);
  const isLocal = tool?.processingMode === "local";
  const facts = [
    [copy.purpose, guide.purpose],
    [copy.input, guide.input],
    [copy.output, guide.output],
    [copy.processing, guide.processing],
    [copy.privacy, guide.privacy],
    [copy.limitation, guide.limitation],
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <section
        aria-labelledby={`${id}-guide-title`}
        className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14"
        data-tool-guide={id}
      >
        <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {copy.eyebrow}
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 id={`${id}-guide-title`} className="max-w-2xl text-2xl font-semibold tracking-tight text-zinc-900">
            {copy.title}
          </h2>
          <p className="text-xs text-zinc-500">
            {copy.reviewed}: <time dateTime={guide.lastReviewed}>{guide.lastReviewed}</time>
          </p>
        </div>

        <div className={`mt-6 rounded-2xl border p-4 ${isLocal ? "border-emerald-200 bg-emerald-50/70" : "border-sky-200 bg-sky-50/70"}`}>
          <p className={`text-sm font-semibold ${isLocal ? "text-emerald-800" : "text-sky-800"}`}>
            {isLocal ? copy.localBadge : copy.networkBadge}
          </p>
          <p className={`mt-1 text-sm leading-6 ${isLocal ? "text-emerald-950/75" : "text-sky-950/75"}`}>
            {guide.processing} {guide.privacy}
          </p>
        </div>

        <dl className="mt-7 grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm font-semibold text-zinc-900">{label}</dt>
              <dd className="mt-1 text-sm leading-6 text-zinc-600">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-7 rounded-2xl bg-emerald-50/70 p-4 sm:p-5">
          <h3 className="text-sm font-semibold text-emerald-950">{copy.example}</h3>
          <p className="mt-1 text-sm leading-6 text-emerald-950/75">{guide.example}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-semibold text-zinc-900">{copy.related}</span>
          {guide.related.map((relatedId) => {
            const related = productTools.find((tool) => tool.id === relatedId);
            if (!related) return null;
            const localized = localizeTool(related, lang);
            return (
              <Link
                key={relatedId}
                href={`/${lang}${related.href}`}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                {localized.title}
              </Link>
            );
          })}
        </div>
        </div>
      </section>
    </>
  );
}
