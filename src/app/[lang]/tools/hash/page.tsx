import type { Metadata } from "next";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolGuide } from "@/components/ToolGuide";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import HashChecksumClient from "./HashChecksumClient";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> { const lang = ((await params).lang || "en") as "en" | "zh"; return buildPageMetadata(lang === "zh" ? "Hash 与文件校验" : "Hash & File Checksum", lang === "zh" ? "在浏览器本地生成并比对文本或文件的 SHA-256、SHA-512、SHA-1 和 MD5 校验值。" : "Generate and compare SHA-256, SHA-512, SHA-1, and MD5 checksums for text or files locally.", lang, "/tools/hash"); }
export default async function HashPage({ params }: { params: Promise<{ lang: string }> }) { const lang = ((await params).lang || "en") as "en" | "zh"; const dict = await getDictionary(lang); return <><SiteHeader dict={dict} lang={lang} /><HashChecksumClient lang={lang} /><ToolGuide id="hash" lang={lang} /><SiteFooter dict={dict} lang={lang} /></>; }
