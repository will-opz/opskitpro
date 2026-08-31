import Link from "next/link";

import {
  productTools,
  type ProductLocale,
  type ProductToolId,
} from "@/lib/tool-catalog";
import { localizeToolGuide } from "@/lib/tool-guides";
import { buildToolPageJsonLd, serializeJsonLd } from "@/lib/structured-data";

const labels = {
  en: {
    localBadge: "Local processing · Not uploaded",
    networkBadge: "Internet required",
    details: "View data handling and limitations",
  },
  zh: {
    localBadge: "本地处理 · 不上传",
    networkBadge: "需要联网",
    details: "查看数据处理与使用限制",
  },
} as const;

export function ToolGuide({ id, lang }: { id: ProductToolId; lang: ProductLocale }) {
  const guide = localizeToolGuide(id, lang);
  const jsonLd = buildToolPageJsonLd(id, lang);
  const copy = labels[lang];
  const tool = productTools.find((entry) => entry.id === id);
  const isLocal = tool?.processingMode === "local";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <section
        aria-label={copy.details}
        className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7"
        data-tool-guide={id}
      >
        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${isLocal ? "text-emerald-700" : "text-sky-700"}`}>
              {isLocal ? copy.localBadge : copy.networkBadge}
            </p>
            {!isLocal ? (
              <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-[var(--text-muted)]">
                {guide.processing}
              </p>
            ) : null}
          </div>
          <Link
            href={`/${lang}/tools/docs#${id}`}
            className="shrink-0 text-sm font-semibold text-[var(--accent-color)] hover:underline"
          >
            {copy.details} →
          </Link>
        </div>
      </section>
    </>
  );
}
