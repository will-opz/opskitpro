import Link from "next/link";
import { Globe, Activity, ShieldCheck, MapPin } from "lucide-react";
import { resolveLocalizedHref } from "@/lib/localized-href";

interface RelatedToolsProps {
  currentTool:
    "website-check" | "cloudflare-trace" | "dns-lookup" | "ip-lookup";
  lang: "en" | "zh";
}

export function RelatedTools({ currentTool, lang }: RelatedToolsProps) {
  const isZh = lang === "zh";
  const isJa = false;

  const sectionTitle = isJa
    ? "関連ツール"
    : isZh
      ? "关联诊断工具"
      : "Related Diagnostics";

  const allTools = [
    {
      id: "website-check",
      href: "/tools/website-check",
      icon: <Globe className="h-5 w-5 text-emerald-600" />,
      title: isJa
        ? "Webサイト診断"
        : isZh
          ? "网站综合诊断"
          : "Website Check",
      desc: isJa
        ? "DNS、SSL、レスポンスの総合チェック"
        : isZh
          ? "DNS、SSL、连通性综合检测"
          : "Comprehensive DNS, SSL, & latency check",
      color: "emerald",
    },
    {
      id: "cloudflare-trace",
      href: "/tools/cloudflare-trace",
      icon: <Activity className="h-5 w-5 text-sky-600" />,
      title: isJa
        ? "Cloudflare トレース"
        : isZh
          ? "边缘追踪 (Trace)"
          : "Cloudflare Trace",
      desc: isJa
        ? "エッジノードのルーティング分析"
        : isZh
          ? "边缘节点路由与请求分析"
          : "Edge node routing & request analysis",
      color: "sky",
    },
    {
      id: "dns-lookup",
      href: "/tools/dns-lookup?tab=security",
      icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />,
      title: isJa
        ? "DNS セキュリティ監査"
        : isZh
          ? "DNS 安全审计"
          : "DNS Security Audit",
      desc: isJa
        ? "SPF、DMARC、CAA の検証"
        : isZh
          ? "验证 SPF、DMARC、CAA 记录"
          : "Verify SPF, DMARC, and CAA records",
      color: "indigo",
    },
    {
      id: "ip-lookup",
      href: "/tools/ip-lookup",
      icon: <MapPin className="h-5 w-5 text-amber-600" />,
      title: isJa
        ? "IP アドレス検索"
        : isZh
          ? "IP 归属查询"
          : "IP Lookup",
      desc: isJa
        ? "IPの地理的位置とASN情報"
        : isZh
          ? "IP 地理位置与 ASN 信息"
          : "Geolocation and ASN details",
      color: "amber",
    },
  ];

  const relatedTools = allTools.filter((t) => t.id !== currentTool);

  const colorStyles: Record<string, { bg: string; hoverBorder: string }> = {
    emerald: { bg: "bg-emerald-50", hoverBorder: "hover:border-emerald-500" },
    sky: { bg: "bg-sky-50", hoverBorder: "hover:border-sky-500" },
    indigo: { bg: "bg-indigo-50", hoverBorder: "hover:border-indigo-500" },
    amber: { bg: "bg-amber-50", hoverBorder: "hover:border-amber-500" },
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-12 border-t border-zinc-100 mt-12">
      <h2 className="text-lg font-black text-zinc-900 mb-6">{sectionTitle}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {relatedTools.map((tool) => (
          <Link
            key={tool.id}
            href={resolveLocalizedHref(lang, tool.href)}
            className={`group relative flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-all hover:shadow-md ${colorStyles[tool.color].hoverBorder}`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorStyles[tool.color].bg}`}
            >
              {tool.icon}
            </div>
            <div>
              <h3 className="font-bold text-zinc-900 group-hover:text-zinc-900">
                {tool.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-500 leading-relaxed">
                {tool.desc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
