import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/CodeBlock";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

const copy = {
  en: {
    title: "MCP Website Check",
    description:
      "Connect AI agents to evidence-led DNS, HTTP, TLS, CDN and security-header diagnostics.",
    eyebrow: "REMOTE MCP SERVER",
    intro:
      "OpsKitPro MCP lets compatible AI clients call the same bounded Website Check used by the public product. It is read-only, requires no login in the current preview, and returns explicit observation points and limitations.",
    endpoint: "MCP endpoint",
    tool: "Available tool",
    toolText:
      "website_check — diagnose one public domain and return structured findings, evidence and next actions.",
    privacy: "Privacy and safety",
    privacyItems: [
      "Only public internet targets are accepted. Private, loopback, link-local and reserved destinations are blocked.",
      "No password, cookie or Authorization header is forwarded to the diagnostic target.",
      "Results are not stored as a user history. Operational logs follow the site's privacy-minimal policy.",
      "The result covers OpsKitPro Probe and, when available, Cloudflare Edge; it does not measure the MCP user's browser or private network.",
    ],
    example: "Client configuration",
    exampleNote:
      "Use the following remote server URL in a client that supports Streamable HTTP. Client field names vary by product.",
    limits: "Preview limits",
    limitsText:
      "The preview allows two Website Check calls per IP per minute. It has no batch mode, private-network access, persistent sessions or write operations.",
    api: "View the JSON API documentation",
  },
  zh: {
    title: "MCP 网站检测",
    description:
      "让 AI 智能体调用包含 DNS、HTTP、TLS、CDN 和安全响应头证据的网站诊断能力。",
    eyebrow: "远程 MCP 服务",
    intro:
      "OpsKitPro MCP 让兼容的 AI 客户端直接调用与公开产品相同、具备明确安全边界的网站检测能力。当前预览版只读、无需登录，并明确返回观察点和能力限制。",
    endpoint: "MCP 地址",
    tool: "当前工具",
    toolText:
      "website_check — 检测一个公网域名，返回结构化问题、证据与下一步建议。",
    privacy: "隐私与安全",
    privacyItems: [
      "只允许公网目标；私网、回环、链路本地和保留地址会被拦截。",
      "不会把密码、Cookie 或 Authorization 请求头转发给检测目标。",
      "检测结果不会保存为用户历史，运行日志遵循隐私最小化原则。",
      "结果来自 OpsKitPro 探针以及可用时的 Cloudflare Edge，不代表 MCP 用户浏览器或私有网络的测量结果。",
    ],
    example: "客户端配置",
    exampleNote:
      "在支持 Streamable HTTP 的客户端中填写以下远程服务地址。不同产品的配置字段名称可能不同。",
    limits: "预览版限制",
    limitsText:
      "当前每个 IP 每分钟最多调用两次 Website Check，不支持批量检测、私网访问、持久会话或任何写操作。",
    api: "查看 JSON API 文档",
  },
} as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const text = copy[lang];
  return buildPageMetadata(text.title, text.description, lang, "/mcp");
}

export default async function McpPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "en" | "zh";
  const dict = await getDictionary(lang);
  const text = copy[lang];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <SiteHeader dict={dict} lang={lang} />
      <main className="mx-auto w-full max-w-5xl px-4 pb-8 pt-8 sm:px-6">
        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 shadow-sm sm:p-6">
          <p className="text-xs font-semibold tracking-[0.18em] text-[var(--accent-text)]">
            {text.eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-3xl">
            {text.title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
            {text.intro}
          </p>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5">
              <h2 className="text-sm font-semibold text-[var(--text-muted)]">{text.endpoint}</h2>
              <code className="mt-3 block break-all text-base font-semibold text-[var(--accent-text)]">
                https://opskitpro.com/mcp
              </code>
            </div>
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-5">
              <h2 className="text-sm font-semibold text-[var(--text-muted)]">{text.tool}</h2>
              <p className="mt-3 leading-7 text-[var(--text-secondary)]">{text.toolText}</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 sm:p-5">
            <h2 className="text-2xl font-bold">{text.privacy}</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
              {text.privacyItems.map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 sm:p-5">
            <h2 className="text-2xl font-bold">{text.example}</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{text.exampleNote}</p>
            <CodeBlock lang={lang}>{JSON.stringify({url: "https://opskitpro.com/mcp"}, null, 2)}</CodeBlock>
          </section>
        </div>

        <section className="mt-6 rounded-3xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-6 sm:p-5">
          <h2 className="text-2xl font-bold">{text.limits}</h2>
          <p className="mt-3 leading-7 text-[var(--text-secondary)]">{text.limitsText}</p>
          <Link
            href={`/${lang}/tools/api`}
            className="mt-5 inline-flex font-semibold text-[var(--accent-text)] hover:text-emerald-800"
          >
            {text.api} →
          </Link>
        </section>
      </main>
      <SiteFooter dict={dict} lang={lang} />
    </div>
  );
}
