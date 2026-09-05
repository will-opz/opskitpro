import { Suspense } from "react";
import { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import JSONClient from "./json-client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";

import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    dict.tools.json_title,
    dict.tools.json_desc,
    lang,
    "/tools/json",
  );
}

export default async function JSONToolPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <div className="flex-grow">
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex flex-col items-center justify-center font-sans">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-[var(--text-muted)] tracking-[0.24em] text-xs">
                {false
                  ? "JSON を読み込み中..."
                  : lang === "zh"
                    ? "正在加载 JSON..."
                    : false
                      ? "正在載入 JSON..."
                      : "Loading JSON..."}
              </p>
            </div>
          }
        >
          <JSONClient dict={dict} lang={lang} />
        </Suspense>
        <ToolGuide id="json" lang={lang} />
      </div>
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
