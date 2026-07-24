import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock } from "lucide-react";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getAllBlogPosts } from "@/lib/blog";
import { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);

  return buildPageMetadata(
    dict.nav.blog || "Blog | OpsKitPro",
    "A public hub for OpsKitPro tool notes, operations guides, and implementation records.",
    lang,
    "/blog",
  );
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const lang = ((await params).lang || "en") as "zh" | "en";
  const dict = await getDictionary(lang);
  const isZh = lang === "zh";
  const posts = getAllBlogPosts(lang);
  const postsBySlug = new Map(posts.map((post) => [post.slug, post]));
  const totalPosts = posts.length;
  const kbLabel = isZh
      ? "公开知识库"
      : "Public Knowledge Base";
  const publishedLabel = isZh
      ? "已公开"
      : "Published";
  const groupLabel = isZh
      ? "分类"
      : "Sections";

  const articleGroups = [
    {
      id: "start-here",
      title: isZh
          ? "先从这里开始"
          : "Start here",
      subtitle: isZh
          ? "先建立 OpsKitPro 的产品定位、诊断入口和证据化报告上下文。"
          : "Start with OpsKitPro's product context, diagnostic entry point, and evidence-based report model.",
      slugs: [
        "why-opskitpro",
        "diagnostic-tools-overview",
        "website-diagnostic-report",
      ],
    },
    {
      id: "website-diagnostics",
      title: isZh
          ? "网站诊断方法论"
          : "Website diagnostics",
      subtitle: isZh
          ? "围绕 DNS、HTTP、TLS、CDN、安全响应头，把原始信号整理成可执行证据。"
          : "Turns DNS, HTTP, TLS, CDN, and security header signals into actionable evidence.",
      slugs: [
        "diagnostic-tools-evidence-not-scores",
        "website-check-module",
        "tls-health-vs-https",
        "cloudflare-522",
        "open-graph-social-preview-guide",
      ],
    },
    {
      id: "network-doctor",
      title: isZh
          ? "Network Doctor 与观测点"
          : "Network Doctor",
      subtitle: isZh
          ? "区分 Your Device、Cloudflare Edge 和 OpsKitPro Probe，避免网络指标过度承诺。"
          : "Separates Your Device, Cloudflare Edge, and OpsKitPro Probe so network metrics do not overclaim.",
      slugs: [
        "network-metric-observation-point",
        "network-doctor-upgrade",
        "cloudflare-dual-stack",
        "ip-dns-module",
      ],
    },
    {
      id: "cloudflare-lightsail",
      title: isZh
          ? "Cloudflare 到 Lightsail 架构"
          : "Cloudflare to Lightsail",
      subtitle: isZh
          ? "明确当前生产链路：Cloudflare 继续作为边缘层，Wrangler/Worker 运行时已退役。"
          : "Clarifies the current production path: Cloudflare remains the edge while Wrangler/Worker runtime is retired.",
      slugs: [
        "retired-wrangler-kept-cloudflare-edge",
        "services-deployment",
        "api-v0-release",
      ],
    },
    {
      id: "api-automation",
      title: isZh
          ? "API 与自动化"
          : "API and automation",
      subtitle: isZh
          ? "把网页诊断能力整理成脚本、CI 和 Agent 可以复用的公开接口。"
          : "Turns web diagnostics into public interfaces for scripts, CI, and agent workflows.",
      slugs: [
        "public-api-error-contract-for-diagnostic-tools",
        "ssrf-protection-public-diagnostic-apis",
        "single-node-rate-limiting-without-redis",
        "api-v0-release",
        "diagnostic-tools-overview",
      ],
    },
    {
      id: "ai-engineering",
      title: isZh
          ? "AI 工程工作流"
          : "AI engineering",
      subtitle: isZh
          ? "把 Vibe Coding 整理成有边界、有验证、有记录的 AI 辅助工程流程。"
          : "Turns vibe coding into a guarded workflow with scope, verification, notes, and deployment checks.",
      slugs: [
        "vibe-coding-workflow",
        "ai-coding-playwright-smoke-test",
        "underestimating-git",
      ],
    },
    {
      id: "utility-workbenches",
      title: isZh
          ? "工具工作台"
          : "Utility workbenches",
      subtitle: isZh
          ? "JSON、WebSocket、密码和二维码等高频小工具，强调快速、稳定、少干扰。"
          : "High-frequency JSON, WebSocket, password, and QR tools built for fast, predictable use.",
      slugs: ["json-tool", "websocket-tool", "passgen-tool", "qrgen-tool"],
    },
    {
      id: "product-building",
      title: isZh
          ? "产品建设"
          : "Product building",
      subtitle: isZh
          ? "记录 OpsKitPro 为什么这样设计、取舍和收敛。"
          : "Notes on why OpsKitPro is designed, scoped, and simplified this way.",
      slugs: ["design-principles", "services-deployment"],
    },
  ].map((group) => ({
    ...group,
    posts: group.slugs
      .map((slug) => postsBySlug.get(slug))
      .filter(Boolean) as typeof posts,
  }));
  const articleSeries = articleGroups.map((group) => ({
    id: group.id,
    title: group.title,
    subtitle: group.subtitle,
    count: group.posts.length,
  }));

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />

      <main className="relative mx-auto mb-28 w-full max-w-7xl flex-grow px-6 pt-6 z-10 md:pt-8 flex flex-col lg:flex-row lg:items-start gap-10">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-full max-w-[1000px] -translate-x-1/2 rounded-full bg-emerald-500/5 blur-[120px]" />

        {/* Sidebar Navigation */}
        <aside className="hidden lg:block w-[240px] shrink-0 sticky top-28">
          <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
            {isZh ? "知识地图" : "Knowledge Map"}
          </div>
          <nav className="space-y-1">
            <a href="#all" className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600">
              <span>{isZh ? "所有文章" : "All posts"}</span>
              <span className="text-zinc-400 text-xs">{totalPosts}</span>
            </a>
            {articleGroups.map((group) => (
              <a key={group.id} href={`#${group.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-emerald-50 hover:text-emerald-600">
                <span>{group.title}</span>
                <span className="text-zinc-400 text-xs">{group.posts.length}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0" id="all">
          <div className="mb-12 border-b border-zinc-100 pb-10 text-center md:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-white/75 px-4 py-1.5 text-[10px] font-semibold tracking-[0.28em] text-emerald-600 shadow-sm backdrop-blur-md">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            {kbLabel}
          </div>
          <h1 className="mb-5 text-4xl font-black leading-tight tracking-tighter text-zinc-900 sm:text-5xl md:text-7xl">
            {dict.nav.blog}
          </h1>
          <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-zinc-700 sm:text-base md:mx-0">
            {isZh
                ? "这里整理 OpsKitPro 已公开的工具说明、运维笔记和实现记录。"
                : "A public hub for OpsKitPro tool notes, operations guides, and implementation records."}
            <br />
            <span className="mt-2 block opacity-40">
              {isZh
                  ? "这里只放已整理、可公开复用的内容，不接入内部草稿。"
                  : "Only cleaned, reusable public content lives here; private drafts stay outside the site build."}
            </span>
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              {
                label: publishedLabel,
                value: `${String(totalPosts).padStart(2, "0")} ${isZh ? "篇" : "posts"}`,
              },
              {
                label: groupLabel,
                value: `${String(articleGroups.length).padStart(2, "0")} ${isZh ? "组" : "sections"}`,
              },
              {
                label: isZh
                    ? "范围"
                    : "Scope",
                value: isZh
                    ? "仅公开内容"
                    : "Public only",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-zinc-100 bg-white/75 px-4 py-3 text-left shadow-sm backdrop-blur-md"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                  {item.label}
                </div>
                <div className="mt-1 text-sm font-semibold text-zinc-900">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
          </div>

        {/* Mobile Navigation */}
        <div className="-mx-6 mb-8 flex items-center gap-2 overflow-x-auto px-6 pb-2 lg:hidden hide-scrollbar">
          <a href="#all" className="shrink-0 rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-emerald-100 hover:text-emerald-700">
            {isZh ? "全部" : "All"}
          </a>
          {articleGroups.map((group) => (
            <a key={group.id} href={`#${group.id}`} className="shrink-0 rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-emerald-100 hover:text-emerald-700">
              {group.title}
            </a>
          ))}
        </div>

        <div className="mb-14 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articleSeries.map((series) => (
            <a
              key={series.id}
              href={`#${series.id}`}
              className="group rounded-[2rem] border border-zinc-100 bg-white/85 px-5 py-5 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-lg"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-500">
                    {String(series.count).padStart(2, "0")}{" "}
                    {isZh ? "篇" : "posts"}
                  </div>
                  <h2 className="mt-2 text-xl font-black tracking-tighter text-zinc-900">
                    {series.title}
                  </h2>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-300 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
              </div>
              <p className="mt-3 line-clamp-2 text-sm leading-7 text-zinc-600">
                {series.subtitle}
              </p>
            </a>
          ))}
        </div>

        <div className="space-y-14">
          {articleGroups.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-28">
              <div className="mb-6 border-b border-zinc-100 pb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-emerald-500/15 bg-emerald-500/8 px-3 py-1 text-[10px] font-semibold tracking-[0.22em] text-emerald-600">
                    {String(group.posts.length).padStart(2, "0")}{" "}
                    {isZh ? "篇" : "posts"}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">
                    {group.id === "start-here"
                      ? isZh
                          ? "入口"
                          : "Start"
                      : group.id === "website-diagnostics"
                        ? isZh
                            ? "诊断"
                            : "Diagnostics"
                        : group.id === "network-doctor"
                          ? isZh
                              ? "网络"
                              : "Network"
                          : group.id === "cloudflare-lightsail"
                            ? "Cloudflare"
                            : group.id === "api-automation"
                              ? "API"
                              : group.id === "ai-engineering"
                                ? "AI"
                                : group.id === "product-building"
                                  ? isZh
                                      ? "产品"
                                      : "Product"
                                  : isZh
                                      ? "工具"
                                      : "Tools"}
                  </span>
                </div>
                <h2 className="mt-3 text-2xl font-black tracking-tighter text-zinc-900 sm:text-3xl">
                  {group.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-600">
                  {group.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {group.posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-500/20 hover:shadow-2xl"
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image
                        src={post.coverImage || ""}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${post.accent} opacity-70`}
                      />
                      <div className="absolute left-4 top-4 flex items-center gap-2">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[9px] font-bold tracking-[0.22em] text-zinc-700 backdrop-blur-md">
                          {post.category || "Blog"}
                        </span>
                        <span className="rounded-full border border-white/20 bg-zinc-950/75 px-3 py-1 text-[9px] font-semibold tracking-[0.18em] text-white backdrop-blur-md">
                          {post.actionKind === "tool"
                            ? isZh
                                ? "工具"
                                : "Tool"
                            : isZh
                                ? "笔记"
                                : "Notes"}
                        </span>
                      </div>
                    </div>

                    <div className="flex h-full flex-col p-6">
                      <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                        <span>{post.publishedAt}</span>
                        <span className="inline-flex items-center gap-1 text-emerald-600">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-emerald-600">
                        {post.title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-7 text-zinc-500">
                        {post.summary}
                      </p>

                      <div className="mt-6 flex items-center justify-between border-t border-zinc-50 pt-5">
                        <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                          {isZh
                              ? "公开笔记"
                              : "Public note"}
                        </span>
                        <ArrowRight className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-600" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}

          <div className="rounded-[2rem] border border-emerald-500/15 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tighter text-zinc-900">
                  {isZh
                      ? "返回工具"
                      : "Return to Tools"}
                </h3>
                <p className="mt-2 text-sm leading-7 text-zinc-600">
                  {isZh
                      ? "知识库只展示公开内容，日常诊断、排障和工具入口从工具开始。"
                      : "The knowledge base stays public and reusable; daily diagnostics and workflows start from Tools."}
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
              >
                <BookOpen className="h-4 w-4" />
                {isZh
                    ? "返回首页"
                    : "Back to home"}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>

      <SiteFooter dict={dict} />
    </>
  );
}
