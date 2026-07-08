import { BlogSection } from "@/content/blog-posts";

export function LegacyBlogRenderer({
  sections,
  lang,
}: {
  sections: BlogSection[];
  lang: string;
}) {
  return (
    <div className="mt-6 space-y-10">
      {sections.map((section, index) => (
        <section
          key={`${section.heading}-body`}
          className="border-b border-zinc-100 pb-8 last:border-b-0 last:pb-0"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900">
              {section.heading}
            </h2>
            <span className="rounded-full border border-emerald-500/15 bg-emerald-500/8 px-2.5 py-1 text-[10px] font-semibold tracking-[0.22em] text-emerald-600">
              {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {section.paragraphs.map((paragraph, paragraphIndex) => (
              <p
                key={`${section.heading}-${paragraphIndex}`}
                className="text-[15px] leading-8 text-zinc-700"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {section.bullets?.length ? (
            <ul className="mt-6 space-y-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-5 text-[15px] leading-7 text-zinc-700">
              {section.bullets.map((bullet, bulletIndex) => (
                <li
                  key={`${section.heading}-bullet-${bulletIndex}`}
                  className="flex gap-3"
                >
                  <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}

          {section.files?.length ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-semibold tracking-[0.18em] text-zinc-500">
                {false
                  ? "参考ファイル"
                  : lang === "zh"
                    ? "参考文件"
                    : false
                      ? "參考檔案"
                      : "Reference files"}
              </span>
              {section.files.map((file) => (
                <span
                  key={file}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-600"
                >
                  {file}
                </span>
              ))}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
