import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { buildPageMetadata } from "@/lib/seo";
import { isActiveLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang: langParam } = await params;
  const lang = langParam as "zh" | "en";

  const title = lang === "zh" ? "隐私政策" : "Privacy Policy";
  const description =
    lang === "zh"
      ? "了解 OpsKitPro 如何使用 Cookie、Google AdSense 以及您的数据。"
      : "Learn how OpsKitPro uses cookies, Google AdSense, and your data.";

  return buildPageMetadata(title, description, lang, "/privacy");
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang: langParam } = await params;
  if (!isActiveLocale(langParam)) notFound();
  const lang = langParam as "zh" | "en";
  const dict = await getDictionary(lang);

  const isZh = lang === "zh";

  return (
    <>
      <SiteHeader dict={dict} lang={lang} />
      <main className="mx-auto w-full max-w-3xl flex-grow px-6 pb-10 pt-8">
        <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
          {isZh ? "隐私政策" : "Privacy Policy"}
        </h1>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {isZh ? "最后更新：2026 年 11 月" : "Last updated: November 2026"}
        </p>

        <div className="mt-10 space-y-7 text-sm leading-7 text-[var(--text-secondary)]">
          {/* Overview */}
          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {isZh ? "概述" : "Overview"}
            </h2>
            <p className="mt-3">
              {isZh
                ? "OpsKitPro（opskitpro.com）是一个面向 SRE 和 DevOps 工程师的公开工具集。本页说明我们如何收集和使用数据，以及第三方广告服务的运作方式。"
                : "OpsKitPro (opskitpro.com) is a public toolset for SRE and DevOps engineers. This page explains how we collect and use data, and how third-party advertising services work on this site."}
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">{isZh ? "匿名使用统计" : "Anonymous usage counts"}</h2>
            <p className="mt-3">{isZh ? "启用使用统计时，我们记录公开页面路径、工具打开/运行/成功/失败次数和随机事件编号，用于去重和改进工具。不使用持久访客标识或跨设备追踪，不收集密码、诊断目标或工具输入输出。事件明细保留 90 个完整日及当前日，不含用户标识的每日汇总保留 400 天。机器人过滤是估算，不代表已验证的真实人数。" : "When usage measurement is enabled, we record public page paths, tool opens/runs/outcomes and random event IDs for deduplication and tool improvement. We use no persistent visitor IDs or cross-device tracking, and collect no passwords, diagnostic targets or tool input/output. Event details are retained for 90 complete days plus the current day; daily aggregates without user identifiers for 400 days. Bot filtering is an estimate, not a verified human count."}</p>
          </section>
          {/* Data we collect */}
          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {isZh ? "我们收集哪些数据" : "Data We Collect"}
            </h2>
            <p className="mt-3">
              {isZh
                ? "OpsKitPro 联网工具根据功能从浏览器、公共 DNS、Cloudflare 边缘或服务端探针发起请求，并将结果返回给你的浏览器。我们不会在服务端存储诊断目标的查询内容或查询历史记录。"
                : "OpsKitPro network tools make requests from the browser, public DNS, Cloudflare Edge or server-side probes depending on the tool, returning results to your browser. We do not store diagnostic query content or query history on the server."}
            </p>
            <p className="mt-3">
              {isZh
                ? "我们通过 Nginx 日志收集标准的访问日志（IP 地址、请求路径、响应状态、User-Agent），用于服务运维和流量分析。日志保留 90 个完整日及当前日。"
                : "We collect standard access logs via Nginx (IP address, request path, response status, User-Agent) for service operations and traffic analysis. Logs are retained for 90 complete days plus the current day."}
            </p>
          </section>

          <section className="space-y-3" id="local-data">
            <h2 className="text-base font-semibold">{isZh ? "本地工具与浏览器存储" : "Local tools and browser storage"}</h2>
            <p className="text-sm leading-7 text-[var(--text-secondary)]">{isZh ? "标注本地处理的工具在浏览器中处理输入，不上传工具内容。网站检测历史和偏好可能存储在当前浏览器；清除站点数据会移除这些本地记录。联网工具的请求目标及数据路径以各工具提交处和数据处理说明为准。" : "Tools labeled local process inputs in your browser without uploading tool content. Website Check history and preferences may be stored in this browser; clearing site data removes these local records. Network request destinations and data paths are described at each tool and in the data handling guide."}</p>
            <a className="text-sm text-[var(--accent-text)] underline" href={`/${lang}/tools/docs`}>{isZh ? "逐工具数据处理说明" : "Data handling by tool"}</a>
          </section>
          {/* Cookies */}
          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {isZh ? "Cookie 使用" : "Cookies"}
            </h2>
            <p className="mt-3">
              {isZh
                ? "我们使用少量 Cookie 用于以下目的："
                : "We use a small number of cookies for the following purposes:"}
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-[var(--text-primary)]">
                  {isZh ? "语言偏好" : "Language preference"}
                </span>
                {" — "}
                {isZh
                  ? "记录你选择的界面语言（NEXT_LOCALE），仅在首次访问时通过跳转设置，不在正常页面加载时写入。"
                  : "Stores your selected UI language (NEXT_LOCALE), only set during the initial locale redirect, not written on normal page loads."}
              </li>
              <li>
                <span className="font-medium text-[var(--text-primary)]">
                  {isZh ? "主题偏好" : "Theme preference"}
                </span>
                {" — "}
                {isZh
                  ? "通过 localStorage 记录深色/浅色模式选择，存储在你的浏览器本地，不传输至服务器。"
                  : "Stores your dark/light mode preference via localStorage, kept locally in your browser and not transmitted to the server."}
              </li>
              <li>
                <span className="font-medium text-[var(--text-primary)]">
                  {isZh ? "Google AdSense Cookie" : "Google AdSense cookies"}
                </span>
                {" — "}
                {isZh
                  ? "本站展示 Google AdSense 广告。Google 会使用 Cookie 根据你之前对 Google 服务和合作伙伴网站的访问记录展示个性化广告。"
                  : "This site displays Google AdSense advertisements. Google uses cookies to serve ads based on your prior visits to Google services and partner websites."}
              </li>
            </ul>
          </section>

          {/* Google AdSense */}
          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {isZh ? "Google AdSense 广告" : "Google AdSense Advertising"}
            </h2>
            <p className="mt-3">
              {isZh
                ? "本站通过 Google AdSense（发布商 ID：ca-pub-3793455361566383）展示广告。AdSense 使用 Cookie 和类似技术在本站及其他网站上为你提供个性化广告。Google 是本站广告展示的授权销售方（详见 ads.txt）。"
                : "This site uses Google AdSense (Publisher ID: ca-pub-3793455361566383) to display advertisements. AdSense uses cookies and similar technologies to serve personalized ads on this and other websites. Google is an authorized seller of ad inventory on this site (see ads.txt)."}
            </p>
            <p className="mt-3">
              {isZh ? (
                <>
                  你可以通过{" "}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--accent-text)] hover:text-emerald-500"
                  >
                    Google 广告设置
                  </a>{" "}
                  选择退出个性化广告，或访问{" "}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--accent-text)] hover:text-emerald-500"
                  >
                    aboutads.info
                  </a>{" "}
                  了解更多选项。
                </>
              ) : (
                <>
                  You can opt out of personalized advertising via{" "}
                  <a
                    href="https://adssettings.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--accent-text)] hover:text-emerald-500"
                  >
                    Google Ad Settings
                  </a>
                  , or learn more at{" "}
                  <a
                    href="https://www.aboutads.info/choices/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-[var(--accent-text)] hover:text-emerald-500"
                  >
                    aboutads.info
                  </a>
                  .
                </>
              )}
            </p>
            <p className="mt-3">
              {isZh
                ? "更多关于 Google 如何使用数据的信息，请参阅 Google 隐私政策。"
                : "For more information on how Google uses data, see the Google Privacy Policy."}
              {" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent-text)] hover:text-emerald-500"
              >
                {isZh ? "查看 Google 隐私政策 →" : "Google Privacy Policy →"}
              </a>
            </p>
          </section>

          {/* Third-party links */}
          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {isZh ? "第三方链接" : "Third-Party Links"}
            </h2>
            <p className="mt-3">
              {isZh
                ? "本站可能包含指向第三方网站的链接。我们对这些网站的隐私做法不承担责任，建议你在访问前查阅其各自的隐私政策。"
                : "This site may contain links to third-party websites. We are not responsible for the privacy practices of those sites and encourage you to review their privacy policies before visiting."}
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">
              {isZh ? "联系方式" : "Contact"}
            </h2>
            <p className="mt-3">
              {isZh
                ? "如有隐私相关问题，请通过 GitHub Issues 联系我们："
                : "For privacy-related questions, please contact us via GitHub Issues:"}
              {" "}
              <a
                href="https://github.com/will-opz/opskitpro/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent-text)] hover:text-emerald-500"
              >
                github.com/will-opz/opskitpro/issues
              </a>
            </p>
          </section>
        </div>
      </main>
      <SiteFooter dict={dict} lang={lang} />
    </>
  );
}
