import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGuide } from "@/components/ToolGuide";
import { CodeBlock } from "@/components/CodeBlock";
import { getDictionary } from "@/dictionaries";
import { buildPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ lang: string }> };
export async function generateMetadata({ params }: Props) {
  const lang = (await params).lang === "zh" ? "zh" : "en";
  return buildPageMetadata(lang === "zh" ? "公开 JSON API：DNS、IP 与 HTTP 检测" : "Public JSON API for DNS, IP and HTTP Checks", lang === "zh" ? "使用 curl 或脚本调用诊断工具，查看参数、响应和使用限制。" : "Diagnostic tools for curl and scripts. Parameters, responses and limits.", lang, "/tools/api");
}

export default async function ApiDocsPage({ params }: Props) {
  const lang = (await params).lang === "zh" ? "zh" : "en";
  const zh = lang === "zh";
  const dict = await getDictionary(lang);
  const endpoints = [
    { id: "dns", title: zh ? "DNS 查询" : "DNS Lookup", path: "dns-lookup", params: zh ? "domain 必填；type 可选，默认 all。查询 A、AAAA、MX、TXT、CNAME、NS 等记录。" : "domain is required; type is optional and defaults to all. Query A, AAAA, MX, TXT, CNAME, NS and other records.", query: "domain=example.com" },
    { id: "ip", title: zh ? "IP 查询" : "IP Lookup", path: "ip-lookup", params: zh ? "ip 可选，默认请求者 IP。支持 IPv4 / IPv6，返回地区、ASN 和网络服务商信息。" : "ip is optional and defaults to the requester's IP. Supports IPv4 / IPv6 and returns location, ASN and provider context.", query: "ip=8.8.8.8" },
    { id: "http", title: zh ? "HTTP 检测" : "HTTP Check", path: "http-check", params: zh ? "url 必填，以 http:// 或 https:// 开头。通过 GET 检查状态码、响应头和重定向链。" : "url is required and must begin with http:// or https://. Sends GET to inspect status, headers and redirects.", query: "url=https://example.com" },
  ];
  return <><SiteHeader dict={dict} lang={lang} />
    <main className="tool-page max-w-4xl space-y-6">
      <header><h1 className="text-2xl font-semibold sm:text-3xl">{zh ? "公开 JSON API" : "Public JSON API"} <span className="text-base text-[var(--text-muted)]">v0</span></h1>
        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{zh ? "从终端、脚本或自动化流程调用 DNS、IP 和 HTTP 检测。无需注册或 API 密钥。" : "Call DNS, IP and HTTP checks from your terminal, scripts or automation. No registration or API key required."}</p>
        <Link href={`/${lang}/mcp`} className="mt-3 inline-block text-sm font-semibold text-[var(--accent-text)]">{zh ? "AI 客户端：查看 MCP 接入 →" : "AI clients: MCP setup →"}</Link>
      </header>
      <nav aria-label={zh ? "API 目录" : "API contents"} className="flex flex-wrap gap-2">
        {[...endpoints, {id:"limits",title:zh?"限流":"Rate limits"},{id:"responses",title:zh?"响应与错误":"Responses & errors"},{id:"security",title:zh?"安全与 CORS":"Security & CORS"}].map(e=><a className="ui-button-secondary" href={`#${e.id}`} key={e.id}>{e.title}</a>)}
      </nav>
      {endpoints.map(e=><section key={e.id} id={e.id} className="scroll-mt-24 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5">
        <h2 className="text-xl font-semibold">{e.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{e.params}</p>
        <CodeBlock lang={lang}>{`curl -s "https://opskitpro.com/api/tools/${e.path}?${e.query}" | jq`}</CodeBlock>
      </section>)}
      <section id="limits" className="scroll-mt-24 space-y-3"><h2 className="text-xl font-semibold">{zh ? "限流" : "Rate limits"}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{zh ? "按请求 IP 和查询成本分级，每分钟：DNS/IP 60 次，HTTP/Trace 15 次，完整网站诊断 3 次。" : "Tiered per-IP limits per minute: DNS/IP 60 requests; HTTP/Trace 15; full Website Check 3."}</p>
        <p className="text-sm leading-6 break-words">{zh ? "超限返回 429 Too Many Requests。请读取以下响应头后重试：" : "A rate limit returns 429 Too Many Requests. Read these headers before retrying:"} <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, <code>X-RateLimit-Reset</code>, <code>Retry-After</code>.</p>
      </section>
      <section id="responses" className="scroll-mt-24"><h2 className="text-xl font-semibold">{zh ? "响应与错误" : "Responses & errors"}</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{zh ? "以下为简化结构示例，字段值并非实时数据。失败时返回 error.code 和 error.message。" : "Simplified examples below are not live results. Failures return error.code and error.message."}</p>
        <CodeBlock lang={lang}>{JSON.stringify({ok:true,tool:"dns-lookup",input:{domain:"example.com",type:"all"},result:{},meta:{durationMs:142,timestamp:"2026-06-23T00:00:00.000Z"}},null,2)}</CodeBlock>
        <CodeBlock lang={lang}>{JSON.stringify({ok:false,tool:"http-check",input:{},error:{code:"SSRF_BLOCKED",message:"Private IP addresses are not allowed."},meta:{}},null,2)}</CodeBlock>
      </section>
      <section id="security" className="scroll-mt-24"><h2 className="text-xl font-semibold">{zh ? "安全与 CORS" : "Security & CORS"}</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--text-secondary)]">
          <li>{zh ? "外部探测禁止私网、环回和链路本地地址，并防范 DNS 重绑定。" : "Outbound probes reject private, loopback and link-local addresses and guard against DNS rebinding."}</li>
          <li>{zh ? "HTTP 检测仅允许端口 80、443、8080、8443；最多跟随 5 次重定向，每次重新验证目标。" : "HTTP checks allow ports 80, 443, 8080 and 8443, follow up to 5 redirects and validate every target."}</li>
          <li>{zh ? "公开 API 返回 Access-Control-Allow-Origin: *，可从浏览器调用。请求目标由 OpsKitPro 服务处理，结果不代表你的浏览器网络观测。" : "Public APIs return Access-Control-Allow-Origin: * for browser clients. Targets are processed by OpsKitPro; results are not observations of your browser's network."}</li>
        </ul>
      </section>
    </main><ToolGuide id="api" lang={lang} /><SiteFooter dict={dict} lang={lang} /></>;
}
