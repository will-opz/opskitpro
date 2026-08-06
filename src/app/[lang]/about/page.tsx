import {
  Shield,
  Zap,
  Terminal,
  Mail,
  Fingerprint,
  Activity,
  Twitter,
} from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default async function AboutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);
  const isZh = lang === "zh";
  const aboutCopy = {
    badge: isZh
        ? "关于方针"
        : "About / Mission",
    title: isZh
        ? "关于我们"
        : "About",
    subtitle: isZh
        ? "OpsKitPro 是为现代化 SRE 与开发者打造的边缘原生诊断套件。我们提供免登录、极速响应的 DNS、IP 及网站健康取证分析。我们强调的是更快的判断、更清晰的结果，以及更少的视觉噪音。"
        : "OpsKitPro is an edge-native diagnostic suite built for modern SREs and developers. We provide instant, zero-login forensics for DNS, IP, and website health, with a focus on faster judgment and clearer output.",
    highlights: [
      {
        label: isZh
            ? "实战优先"
            : "Practical",
        value: isZh
            ? "直接用于排障判断"
            : "Useful in live troubleshooting",
      },
      {
        label: isZh
            ? "清晰结构"
            : "Clarity",
        value: isZh
            ? "结果与流程更易扫读"
            : "Results are easy to scan",
      },
      {
        label: isZh
            ? "轻快响应"
            : "Fast Edge",
        value: isZh
            ? "在边缘节点快速确认"
            : "Fast checks at the edge",
      },
    ],
    philosophyTitle: isZh
        ? "核心理念"
        : "Core Philosophy",
    techTitle: isZh
        ? "技术栈"
        : "Technology Stack",
    contactTitle: isZh
        ? "欢迎联系与合作"
        : "Contact / Collaboration",
    contactDesc: isZh
        ? "欢迎进行导入咨询、产品交流或运维经验交换。"
        : "For adoption, product feedback, or SRE exchange, feel free to reach out.",
    contactX: isZh
        ? "通过 X 联系"
        : "Contact on X",
    contactMail: isZh
        ? "通过邮件联系"
        : "Contact by email",
  };

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 z-10 mt-6 md:mt-8 mb-28 relative">
        {/* Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[860px] h-[320px] bg-emerald-500/4 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="mb-16 rounded-[2.5rem] border border-white/80 bg-white/85 backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10 shadow-sm text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.18em] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            {aboutCopy.badge}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-zinc-900 tracking-tighter mb-5 leading-tight">
            {aboutCopy.title}
          </h1>
          <p className="text-base sm:text-lg text-zinc-800 leading-8 max-w-3xl font-normal">
            {aboutCopy.subtitle}
          </p>
        </section>

        <section className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aboutCopy.highlights.map((item) => (
              <div
                key={item.label}
                className="bg-white/88 backdrop-blur-md border border-zinc-100 rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-4"
              >
                <div>
                  <div className="text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm text-zinc-700 leading-snug">
                    {item.value}
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy - Light Theme Cards */}
        <section className="mb-24">
          <h2 className="text-[10px] font-semibold text-zinc-400 mb-10 tracking-[0.18em] flex items-center gap-3">
            <Fingerprint className="w-4 h-4 text-emerald-500" />{" "}
            {aboutCopy.philosophyTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Activity,
                title: isZh
                    ? "毫秒级取证"
                    : "Low-Latency Forensics",
                desc: isZh
                    ? "所有探测 API 构建在 Cloudflare Edge 之上，实现近零延迟的全球连通性审计。"
                    : "All probe APIs are built on Cloudflare Edge, achieving near-zero latency global connectivity auditing.",
              },
              {
                icon: Shield,
                title: isZh
                    ? "全链路透明"
                    : "Transparent Pipeline",
                desc: isZh
                    ? "无论是 SSL 到期还是 BGP 路由风险，数据永远以最原始、最直观的 JSON 审计方式呈现。"
                    : "Whether it is SSL expiry or BGP routing risks, data is always presented in the most raw and intuitive JSON audit form.",
              },
              {
                icon: Zap,
                title: isZh
                    ? "工业级美学"
                    : "Industrial Aesthetics",
                desc: isZh
                    ? "追求极致的渲染效率与 HUD 视觉呈现，将冷冰冰的运维任务转化为充满动感的取证艺术。"
                    : "Pursuing extreme rendering efficiency and HUD visual presentation, turning cold operations tasks into dynamic forensic art.",
              },
              {
                icon: Terminal,
                title: isZh
                    ? "去黑化设计"
                    : "Light-Mode Evolution",
                desc: isZh
                    ? "摒弃压抑的深色块，采用通透的高级白与翡翠绿，让排障过程更加清晰、冷静。"
                    : "Discarding depressing dark blocks, adopting transparent premium white and emerald green, making the troubleshooting process clearer and calmer.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-lg hover:border-emerald-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100 group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20 transition-all">
                  <item.icon className="w-5 h-5 text-zinc-900 group-hover:text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-zinc-900 mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-zinc-600 leading-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack - Sub-grid */}
        <section className="mb-24">
          <h2 className="text-[10px] font-semibold text-zinc-400 mb-8 tracking-[0.18em] flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-500" />{" "}
            {aboutCopy.techTitle}
          </h2>
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 p-8 sm:p-10 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-zinc-700">
            {[
              "Next.js 14 (App Router + Standalone)",
              "CF Edge Runtime",
              "Tailwind CSS v3",
              "Lucide Icons",
              "Local-first Utilities",
              "i18n Strategy",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/70 px-4 py-3"
              >
                <span className="text-emerald-500">•</span>
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact/Support - Light Layout */}
        <section>
          <div className="bg-white border border-zinc-100 rounded-[3rem] p-10 sm:p-12 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
              <h2 className="text-3xl font-semibold tracking-tight text-zinc-900 mb-4">
                {aboutCopy.contactTitle}
              </h2>
              <p className="text-sm text-zinc-600 leading-7 max-w-md">
                {aboutCopy.contactDesc}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <a
                href="https://x.com/deopsai"
                target="_blank"
                className="px-10 py-5 bg-zinc-900 text-white hover:bg-emerald-600 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-4 group shadow-sm"
              >
                {aboutCopy.contactX}
                <Twitter className="w-5 h-5 group-hover:scale-110" />
              </a>
              <a
                href="mailto:admin@opskitpro.com"
                className="px-10 py-5 bg-zinc-100 hover:bg-emerald-100 text-zinc-900 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-4 group border border-zinc-100 shadow-sm"
              >
                {aboutCopy.contactMail}
                <Mail className="w-5 h-5 group-hover:scale-110" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter dict={dict} />
    </>
  );
}
