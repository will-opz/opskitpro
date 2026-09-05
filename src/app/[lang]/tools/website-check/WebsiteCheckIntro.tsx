import { Globe, Lock, Cloud, Activity } from "lucide-react";

/** An offline illustration, deliberately separate from live diagnostic state. */
export function WebsiteCheckIntro({ lang }: { lang: "zh" | "en" }) {
  const zh = lang === "zh";
  const checks = [
    { icon: Globe, title: "DNS", detail: zh ? "解析与记录" : "Resolution & records" },
    { icon: Lock, title: "SSL", detail: zh ? "证书与有效期" : "Certificate & expiry" },
    { icon: Cloud, title: "CDN", detail: zh ? "提供商与边缘线索" : "Provider & edge signals" },
    { icon: Activity, title: "HTTP", detail: zh ? "状态与安全响应头" : "Status & security headers" },
  ];
  return (
    <section aria-labelledby="check-coverage" className="mx-auto max-w-4xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] p-5">
      <h2 id="check-coverage" className="text-base font-semibold text-[var(--text-primary)]">{zh ? "将检查哪些项目" : "What we’ll check"}</h2>
      <ul className="my-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {checks.map(({ icon: Icon, title, detail }) => <li key={title}>
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><Icon aria-hidden="true" className="h-4 w-4 text-[var(--accent-text)]" />{title}</div>
          <p className="mt-1 text-[13px] leading-5 text-[var(--text-secondary)]">{detail}</p>
        </li>)}
      </ul>
      <details className="border-t border-[var(--border-subtle)] pt-3">
        <summary className="w-fit cursor-pointer rounded text-sm font-medium text-[var(--accent-text)]">
          {zh ? "查看示例报告 · 非实时数据" : "View example report · Not live data"}
        </summary>
        <div className="mt-4 rounded-xl bg-[var(--surface-secondary)] p-4 text-sm leading-6 text-[var(--text-secondary)]">
          <p className="font-semibold text-[var(--text-primary)]">{zh ? "example.com · 静态演示" : "example.com · Static illustration"}</p>
          <p className="mt-1">{zh ? "以下数值仅用于说明报告结构，不代表该域名的实际状态，也不会发起网络请求。" : "These illustrative values explain the report structure. They do not describe this domain’s actual status or initiate any network requests."}</p>
          <dl className="mt-3 space-y-2">
            <div><dt className="font-semibold">{zh ? "摘要：需要关注" : "Summary: Needs attention"}</dt><dd>{zh ? "示例中 DNS 正常、HTTP 返回 200，证书将在 7 天后到期。" : "In this example, DNS resolves, HTTP returns 200 and the certificate expires in 7 days."}</dd></div>
            <div><dt className="font-semibold">{zh ? "证据来源" : "Evidence source"}</dt><dd>{zh ? "OpsKitPro 服务端探针（演示）；浏览器与边缘观察单独展示。" : "OpsKitPro server probe (illustrative); browser and edge observations are shown separately."}</dd></div>
            <div><dt className="font-semibold">{zh ? "建议与复查" : "Action & verification"}</dt><dd>{zh ? "更新证书，检查自动续期任务；重新检测并核对证书有效期。" : "Renew the certificate and inspect automatic renewal. Run another check to verify its expiry date."}</dd></div>
          </dl>
        </div>
      </details>
    </section>
  );
}
