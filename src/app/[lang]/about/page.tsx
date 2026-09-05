import Link from "next/link";
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
        ? "OpsKitPro 提供免登录的浏览器工具和网站诊断。你可以处理文本与数据、生成密码和二维码，也可以检查 DNS、证书与 HTTP 问题。"
        : "OpsKitPro combines browser utilities with website diagnostics. Process text and data, generate passwords and QR codes, or investigate DNS, TLS and HTTP issues without signing in.",
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
            ? "常用内容在浏览器本地处理"
            : "Browser-local utilities",
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

      <main className="flex-grow w-full max-w-5xl mx-auto px-6 z-10 mt-6 md:mt-8 mb-4 relative">
        {/* Background Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[860px] h-[320px] bg-emerald-500/4 blur-[100px] rounded-full pointer-events-none -z-10"></div>

        {/* Hero Section */}
        <section className="mb-8 rounded-[2.5rem] border border-white/80 bg-[var(--surface-primary)] backdrop-blur-xl px-6 py-8 sm:px-6 sm:py-6 shadow-sm text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-[var(--accent-text)] text-xs font-semibold tracking-[0.18em] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            {aboutCopy.badge}
          </div>
          <h1 className="text-3xl sm:text-3xl font-semibold text-[var(--text-primary)] tracking-tighter mb-5 leading-tight">
            {aboutCopy.title}
          </h1>
          <p className="text-base sm:text-lg text-[var(--text-primary)] leading-8 max-w-3xl font-normal">
            {aboutCopy.subtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-3"><Link href={`/${lang}/tools`} className="ui-button-primary">{isZh ? "浏览全部工具" : "Browse all tools"}</Link><Link href={`/${lang}/tools/website-check`} className="ui-button-secondary">{isZh ? "网站检测" : "Website Check"}</Link></div>
        </section>

        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {aboutCopy.highlights.map((item) => (
              <div
                key={item.label}
                className="bg-[var(--surface-primary)] backdrop-blur-md border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 shadow-sm flex items-start justify-between gap-4"
              >
                <div>
                  <div className="text-xs font-semibold text-[var(--accent-text)] tracking-[0.18em]">
                    {item.label}
                  </div>
                  <div className="mt-2 text-sm text-[var(--text-secondary)] leading-snug">
                    {item.value}
                  </div>
                </div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1" />
              </div>
            ))}
          </div>
        </section>

        {/* Philosophy - Light Theme Cards */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] mb-4 tracking-[0.18em] flex items-center gap-3">
            <Fingerprint className="w-4 h-4 text-emerald-500" />{" "}
            {aboutCopy.philosophyTitle}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: Activity,
                title: isZh
                    ? "明确观测来源"
                    : "Clear observation points",
                desc: isZh
                    ? "区分浏览器、Cloudflare 边缘节点与 OpsKitPro 探针的结果，让你知道证据来自哪里。"
                    : "Results distinguish browser, Cloudflare Edge and OpsKitPro Probe observations so you can see where the evidence comes from.",
              },
              {
                icon: Shield,
                title: isZh
                    ? "全链路透明"
                    : "Transparent Pipeline",
                desc: isZh
                    ? "本地工具明确标注处理位置；网络工具说明请求对象和限制，诊断结果可查看具体证据。"
                    : "Local tools identify where data is processed. Network tools explain destinations and limitations, with evidence available in diagnostic results.",
              },
              {
                icon: Zap,
                title: isZh
                    ? "直接开始使用"
                    : "Start with a task",
                desc: isZh
                    ? "常用操作无需登录，输入后获得清楚的结果、复制或下载。高级设置按需展开。"
                    : "Common tasks need no login. Enter input, get a clear result, and copy or download it. Open advanced settings when needed.",
              },
              {
                icon: Terminal,
                title: isZh
                    ? "适应你的设备"
                    : "Works across devices",
                desc: isZh
                    ? "支持手机、键盘和浅色/深色显示，在不同环境下保持操作与结果可读。"
                    : "Use mobile, keyboard and light or dark mode with readable controls and results.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[var(--surface-primary)] p-5 rounded-[2rem] border border-[var(--border-subtle)] shadow-sm hover:shadow-lg hover:border-emerald-500/20 transition-all group"
              >
                <div className="w-12 h-12 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center mb-3 border border-[var(--border-subtle)] group-hover:bg-emerald-500/5 group-hover:border-emerald-500/20 transition-all">
                  <item.icon className="w-5 h-5 text-[var(--text-primary)] group-hover:text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-3 tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Tech Stack - Sub-grid */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-[var(--text-muted)] mb-8 tracking-[0.18em] flex items-center gap-3">
            <Activity className="w-4 h-4 text-emerald-500" />{" "}
            {aboutCopy.techTitle}
          </h2>
          <div className="bg-[var(--surface-primary)] rounded-[2.5rem] border border-[var(--border-subtle)] p-8 sm:p-10 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-[var(--text-secondary)]">
            {[
              "Next.js (App Router + Standalone)",
              "Node.js + Cloudflare",
              "Tailwind CSS v3",
              "Lucide Icons",
              "Local-first Utilities",
              "i18n Strategy",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-4 py-3"
              >
                <span className="text-emerald-500">•</span>
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Contact/Support - Light Layout */}
        <section>
          <div className="bg-[var(--surface-primary)] border border-[var(--border-subtle)] rounded-[3rem] p-5 sm:p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="flex-1">
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] mb-4">
                {aboutCopy.contactTitle}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] leading-7 max-w-md">
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
                className="px-10 py-5 bg-[var(--bg-tertiary)] hover:bg-[var(--accent-soft)] text-[var(--text-primary)] rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-4 group border border-[var(--border-subtle)] shadow-sm"
              >
                {aboutCopy.contactMail}
                <Mail className="w-5 h-5 group-hover:scale-110" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
