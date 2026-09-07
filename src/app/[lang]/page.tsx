import Link from "next/link";
import type { Metadata } from "next";
import { Activity, ArrowRight, Braces, Cloud, Fingerprint, Hash, KeyRound, Network, Regex, ShieldCheck, ShieldAlert, Terminal, type LucideIcon } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";
import { productTools } from "@/lib/tool-catalog";
import HomeSearch from "@/components/HomeSearch";
import { CodeBlock } from "@/components/CodeBlock";
import { HomeHeader } from "@/components/home/HomeHeader";
import { EvidenceExample } from "@/components/home/EvidenceExample";
import { ProcessingBadge, DnsSourceBadge, type ProcessingLocation } from "@/components/home/ProcessingBadge";
import styles from "@/components/home/home.module.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    dict.home.meta_title || "OpsKitPro | Edge Diagnostic Portal",
    dict.home.meta_desc ||
      "Real-time global network forensics and edge diagnostic tools.",
    lang,
    "",
  );
}

const copy = {
  zh: {
    title: "排查网站问题，先看证据。",
    subtitle: "检查 DNS、HTTP、TLS、CDN 和网络可达性，并明确展示结果来自哪里。",
    diagnose: "网站与网络诊断", diagnoseHint: "从整体检查，深入到具体问题。",
    local: "本地开发工作台", localHint: "这些工具在浏览器内处理输入，无需上传内容。",
    all: "查看全部工具", automate: "让同一流程进入自动化", automateDesc: "从网页到脚本和 AI 客户端，继续使用有明确观察边界的诊断能力。",
    data: "知道数据去往哪里", dataHint: "执行位置与观察来源，不代表安全等级。",
    localData: "文本、令牌和文件内容在浏览器内处理。是否存储，按各工具的说明为准。",
    edgeData: "启用边缘复核时，由 Cloudflare 边缘探针观察目标。机房以实际返回结果为准。",
    remoteData: "OpsKitPro 服务端探针对公开目标发起请求。结果代表该探针的观察范围。",
    externalData: "DNS 查询会使用第三方公共解析器。提交前可查看接收方与发送范围。",
  },
  en: {
    title: "Diagnose website issues with evidence.",
    subtitle: "Check DNS, HTTP, TLS, CDN and reachability. Know where each result comes from.",
    diagnose: "Website & network diagnostics", diagnoseHint: "Start broad. Follow the evidence into the details.",
    local: "Local developer workbench", localHint: "These tools process your input in the browser, without uploading it.",
    all: "View all tools", automate: "Automate the same workflow", automateDesc: "Take diagnostics into scripts and AI clients, with explicit observation boundaries.",
    data: "Know where your data goes", dataHint: "Processing locations and evidence sources, not security ratings.",
    localData: "Text, tokens and file contents are processed in your browser. See each tool’s notes for storage behavior.",
    edgeData: "When enabled, a Cloudflare edge probe checks the target. Its location comes from the actual response.",
    remoteData: "The OpsKitPro server probe requests public targets. Results describe what that probe can observe.",
    externalData: "DNS queries use third-party public resolvers. Review recipients and data scope before submitting.",
  },
} as const;

type Shortcut = { path: string; icon: LucideIcon; title: string; description: string };
function ShortcutRow({ item, lang, featured = false }: { item: Shortcut; lang: "zh" | "en"; featured?: boolean }) {
  const Icon = item.icon;
  return <Link href={`/${lang}/tools/${item.path}`} className={`${styles.shortcut} ${featured ? styles.featured : ""}`}>
    <Icon size={18} className={styles.shortcutIcon} aria-hidden="true" />
    <div><h3 className={styles.shortcutTitle}>{item.title}</h3><p>{item.description}</p></div>
    <ArrowRight size={15} className={styles.arrow} aria-hidden="true" />
  </Link>;
}

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const c = copy[lang];
  const zh = lang === "zh";
  const diagnostics: Shortcut[] = [
    { path: "website-check", icon: Activity, title: zh ? "网站检测" : "Website Check", description: zh ? "DNS、HTTP、TLS 综合排查" : "DNS, HTTP and TLS in one check" },
    { path: "network-check", icon: Network, title: zh ? "网络诊断" : "Network Doctor", description: zh ? "当前连接与可达性" : "Connection and reachability" },
    { path: "dns-lookup", icon: ShieldCheck, title: "DNS", description: zh ? "解析记录与安全策略" : "Records and security policies" },
    { path: "ip-lookup", icon: Fingerprint, title: zh ? "IP 查询" : "IP Lookup", description: zh ? "地址归属与 ASN" : "IP ownership and ASN" },
    { path: "cloudflare-trace", icon: Cloud, title: "Cloudflare Trace", description: zh ? "边缘路由与请求信息" : "Edge routing and request context" },
  ];
  const local: Shortcut[] = [
    { path: "json", icon: Braces, title: "JSON", description: zh ? "格式化、校验与转换" : "Format, validate and convert" },
    { path: "jwt", icon: ShieldCheck, title: "JWT", description: zh ? "解码内容，检查签名" : "Decode claims and check signatures" },
    { path: "sensitive-data", icon: ShieldAlert, title: zh ? "敏感信息脱敏" : "Sensitive Data", description: zh ? "检测并替换日志中的敏感内容" : "Detect and redact sensitive text" },
    { path: "hash", icon: Hash, title: "Hash", description: zh ? "生成和比对文本、文件校验值" : "Generate and compare checksums" },
    { path: "regex", icon: Regex, title: "Regex", description: zh ? "测试表达式与匹配结果" : "Test patterns and inspect matches" },
    { path: "passgen", icon: KeyRound, title: zh ? "密码生成器" : "Password", description: zh ? "使用设备加密随机源生成" : "Generate with device cryptographic randomness" },
  ];
  const searchTools = productTools.filter((tool) => tool.id !== "api").map((tool) => ({
    title: tool.title[lang], href: `/${lang}${tool.href}`,
    keywords: `${tool.title.en} ${tool.title.zh} ${tool.description.en} ${tool.description.zh} ${tool.id === "website-check" ? "SSL TLS certificate 证书" : ""}`,
  }));
  const data: Array<[ProcessingLocation, string]> = [["local", c.localData], ["edge", c.edgeData], ["remote", c.remoteData]];
  const footer = [["tools", zh ? "工具" : "Tools"], ["tools/docs", zh ? "文档" : "Docs"], ["tools/api", "API"], ["mcp", "MCP"], ["about", zh ? "关于" : "About"], ["privacy", zh ? "隐私" : "Privacy"], ["errors", zh ? "错误速查" : "Errors"], ["nav", zh ? "我的导航" : "My navigation"]];
  return <div className={styles.home}>
    <HomeHeader lang={lang} tools={searchTools} />
    <main id="home-main" className={styles.container} tabIndex={-1}>
      <section className={styles.hero} aria-labelledby="home-title"><h1 id="home-title">{zh ? <><span className={styles.headlinePhrase}>排查网站问题，</span><span className={styles.headlinePhrase}>先看证据。</span></> : c.title}</h1><p>{c.subtitle}</p></section>
      <HomeSearch lang={lang} />
      <EvidenceExample lang={lang} />
      <section className={styles.section} aria-labelledby="diagnose-title">
        <div className={styles.sectionHeading}><h2 id="diagnose-title">{c.diagnose}</h2><p>{c.diagnoseHint}</p></div>
        <div className={styles.diagnosticRows}>{diagnostics.map((item, i) => <ShortcutRow key={item.path} item={item} lang={lang} featured={i === 0} />)}</div>
      </section>
      <section className={styles.section} aria-labelledby="local-title">
        <div className={styles.sectionHeading}><h2 id="local-title">{c.local}</h2><ProcessingBadge location="local" lang={lang} /></div>
        <p className="mb-2 text-sm text-[var(--text-secondary)]">{c.localHint}</p>
        <div className={styles.localRows}>{local.map((item) => <ShortcutRow key={item.path} item={item} lang={lang} />)}</div>
        <Link href={`/${lang}/tools`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent-text)]">{c.all}<ArrowRight size={15} aria-hidden="true" /></Link>
      </section>
      <section id="automate" className={`${styles.section} ${styles.automate}`} aria-labelledby="automate-title">
        <div><h2 id="automate-title">{c.automate}</h2><p>{c.automateDesc}</p><nav className={styles.integrationLinks} aria-label={zh ? "自动化入口" : "Automation links"}>
          <Link href={`/${lang}/tools/api`}>API<ArrowRight size={14} /></Link><Link href="/api/cli" prefetch={false}>CLI<ArrowRight size={14} /></Link><Link href={`/${lang}/mcp`}>MCP<ArrowRight size={14} /></Link>
        </nav></div>
        <div className="min-w-0"><div className="flex items-center gap-2 text-xs text-[var(--text-muted)]"><Terminal size={14} aria-hidden="true" />HTTP · JSON API</div><CodeBlock lang={lang}>{'curl -s "https://opskitpro.com/api/tools/http-check?url=https://example.com"'}</CodeBlock></div>
      </section>
      <section className={styles.section} aria-labelledby="data-title">
        <div className={styles.sectionHeading}><h2 id="data-title">{c.data}</h2><p>{c.dataHint}</p></div>
        <div className={styles.trustRows}>{data.map(([location, text]) => <article id={`data-${location}`} key={location}><ProcessingBadge location={location} lang={lang} link={false} /><p>{text}</p></article>)}<article><DnsSourceBadge lang={lang} explain={false} /><p>{c.externalData}</p></article></div>
      </section>
    </main>
    <footer className={styles.footer}><div className={`${styles.container} ${styles.footerInner}`}><span>© {new Date().getFullYear()} OpsKitPro</span><nav aria-label={zh ? "页脚导航" : "Footer navigation"}>{footer.map(([path, label]) => <Link key={path} href={`/${lang}/${path}`}>{label}</Link>)}</nav></div></footer>
  </div>;
}
