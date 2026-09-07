import { Cloud, Monitor, Server, Globe2 } from "lucide-react";
import { InlineExplanation } from "./InlineExplanation";
import styles from "./home.module.css";

export type ProcessingLocation = "local" | "edge" | "remote";
const locations = {
  local: { label: "LOCAL", icon: Monitor, en: "Location · Runs in your browser.", zh: "处理位置 · 在你的浏览器本地执行。" },
  edge: { label: "EDGE", icon: Cloud, en: "Location · Observed by a Cloudflare edge probe, when enabled.", zh: "观察位置 · 启用时，由 Cloudflare 边缘探针观察。" },
  remote: { label: "REMOTE", icon: Server, en: "Location · Observed by the OpsKitPro server probe.", zh: "观察位置 · 由 OpsKitPro 服务端探针观察。" },
};

export function ProcessingBadge({ location, lang, link = true }: { location: ProcessingLocation; lang: "en" | "zh"; link?: boolean }) {
  const item = locations[location];
  const Icon = item.icon;
  const content = <><Icon size={14} aria-hidden="true" /><span>{item.label}</span></>;
  return link ? <InlineExplanation description={item[lang]} alignEnd={location === "remote"}>{content}</InlineExplanation> : <span className={styles.badge}>{content}</span>;
}

/** DNS names a service, not a fourth processing location. */
export function DnsSourceBadge({ lang, explain = true }: { lang: "en" | "zh"; explain?: boolean }) {
  const content = <><Globe2 size={14} aria-hidden="true" /><span>{explain ? "DNS" : "DNS Resolver"}</span></>;
  return explain ? <InlineExplanation alignEnd description={lang === "zh" ? "来源服务 · DNS 查询使用 Google、Cloudflare、阿里公共解析器；它们是第三方接收方，不是处理位置。" : "Source service · DNS queries use Google, Cloudflare and Ali public resolvers. These are third-party recipients, not a processing location."}>{content}</InlineExplanation> : <span className={styles.badge}>{content}</span>;
}
