"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Check,
  ChevronDown,
  Copy,
  Globe,
  Fingerprint,
  MapPin,
  Search,
  Server,
  SignalHigh,
  Terminal,
} from "lucide-react";
import type { IpLookupResponse, IpLookupSource } from "@/lib/api-contracts";

type Lang = "zh" | "en";
type CopyKind = "ip" | "geo" | "json";

const PAGE_COPY: Record<
  Lang,
  {
    badge: string;
    title: string;
    subtitle: string;
    helper: string;
    loading: string;
    summary: string;
    fallbackTitle: string;
    fallbackDesc: string;
    errorTitle: string;
    errorDesc: string;
    emptyTitle: string;
    emptyDesc: string;
    direct: string;
    proxy: string;
    unknown: string;
    lookupComplete: string;
    countryLevel: string;
    networkAttribution: string;
    dataCoverage: string;
    organization: string;
    organizationDomain: string;
    continent: string;
    includedData: string;
    excludedData: string;
    includedDataDesc: string;
    excludedDataDesc: string;
    rawJsonDesc: string;
    rawJson: string;
    showRaw: string;
    hideRaw: string;
    copyIp: string;
    copyGeo: string;
    copyAll: string;
    insights: string;
    source: string;
    sourceCloudflareContext: string;
    sourceIpinfoLite: string;
    sourceExternalLookup: string;
    sourceLocalFallback: string;
    sourceCloudflareEdge: string;
  }
> = {
  zh: {
    badge: "IP 洞察",
    title: "IP 确认",
    subtitle:
      "查看 IP 所在地、运营商、ASN 与代理线索，先拿到可用结论，再决定下一步。",
    helper: "支持输入 IP，也可以留空查看当前访问信息。",
    loading: "正在确认路由信息...",
    summary: "快速摘要",
    fallbackTitle: "只拿到部分信息",
    fallbackDesc: "上游定位库暂时不可用，当前只展示可确认的 IP 基本信息。",
    errorTitle: "查询服务暂时不可用",
    errorDesc: "无法连接到查询接口，稍后重试或切换其它 IP。",
    emptyTitle: "还没有结果",
    emptyDesc: "输入一个 IP 地址后点击查询，或留空查看当前访问信息。",
    direct: "直连",
    proxy: "代理 / VPN",
    unknown: "未知",
    lookupComplete: "查询成功",
    countryLevel: "国家级定位",
    networkAttribution: "网络归属",
    dataCoverage: "数据覆盖范围",
    organization: "网络组织",
    organizationDomain: "组织域名",
    continent: "所在洲",
    includedData: "本次已确认",
    excludedData: "本数据源不提供",
    includedDataDesc: "国家、洲、ASN、网络组织与组织域名。",
    excludedDataDesc: "城市、坐标、时区、网络类型及代理 / VPN 判断。",
    rawJsonDesc: "供接口调试和自动化使用，默认收起以保持页面重点清晰。",
    rawJson: "原始 JSON",
    showRaw: "展开原始数据",
    hideRaw: "收起原始数据",
    copyIp: "复制 IP",
    copyGeo: "复制位置",
    copyAll: "复制全部",
    insights: "观察要点",
    source: "数据来源",
    sourceCloudflareContext: "Cloudflare 上下文",
    sourceIpinfoLite: "IPinfo Lite 本地库",
    sourceExternalLookup: "外部查询",
    sourceLocalFallback: "本地回退",
    sourceCloudflareEdge: "Cloudflare 边缘",
  },

  en: {
    badge: "IP Insight",
    title: "IP Lookup",
    subtitle:
      "Check location, ISP, ASN, and proxy signals in one glance, then decide your next step.",
    helper:
      "You can search an IP, or leave it blank to inspect the current visit.",
    loading: "Checking route metadata...",
    summary: "Quick Summary",
    fallbackTitle: "Partial data returned",
    fallbackDesc:
      "The upstream geo source is temporarily unavailable, so only confirmed IP details are shown.",
    errorTitle: "Lookup service unavailable",
    errorDesc:
      "We could not reach the lookup endpoint. Try again or switch to another IP.",
    emptyTitle: "No result yet",
    emptyDesc:
      "Enter an IP address and search, or leave it blank to view the current visit.",
    direct: "Direct",
    proxy: "Proxy / VPN",
    unknown: "Unknown",
    lookupComplete: "Lookup complete",
    countryLevel: "Country-level data",
    networkAttribution: "Network attribution",
    dataCoverage: "Data coverage",
    organization: "Network organization",
    organizationDomain: "Organization domain",
    continent: "Continent",
    includedData: "Confirmed in this result",
    excludedData: "Not provided by this source",
    includedDataDesc:
      "Country, continent, ASN, network organization, and organization domain.",
    excludedDataDesc:
      "City, coordinates, timezone, network type, and proxy or VPN classification.",
    rawJsonDesc:
      "For API debugging and automation. Collapsed by default to keep the result focused.",
    rawJson: "Raw JSON",
    showRaw: "Show raw data",
    hideRaw: "Hide raw data",
    copyIp: "Copy IP",
    copyGeo: "Copy location",
    copyAll: "Copy all",
    insights: "Key Signals",
    source: "Data Source",
    sourceCloudflareContext: "Cloudflare Context",
    sourceIpinfoLite: "Local IPinfo Lite",
    sourceExternalLookup: "External Lookup",
    sourceLocalFallback: "Local Fallback",
    sourceCloudflareEdge: "Cloudflare Edge",
  },
};

function normalizeLookupTarget(value: string) {
  const raw = value.trim();
  if (!raw) return "";

  const candidate = raw.replace(/\s+/g, "");

  try {
    if (/^[a-z]+:\/\//i.test(candidate)) {
      return new URL(candidate).hostname;
    }

    if (
      candidate.includes("/") ||
      candidate.includes("?") ||
      candidate.includes("#")
    ) {
      return new URL(`https://${candidate}`).hostname;
    }

    return new URL(`https://${candidate}`).hostname;
  } catch {
    return candidate;
  }
}

function toSourceLabel(source: IpLookupSource, copy: (typeof PAGE_COPY)[Lang]) {
  switch (source) {
    case "cloudflare-context":
      return copy.sourceCloudflareContext;
    case "ipinfo-lite":
      return copy.sourceIpinfoLite;
    case "external-lookup":
      return copy.sourceExternalLookup;
    case "local-fallback":
      return copy.sourceLocalFallback;
    case "cloudflare-edge-default":
      return copy.sourceCloudflareEdge;
    default:
      return source;
  }
}

function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-[1.75rem] border border-zinc-100 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
          {label}
        </p>
        <span className="text-zinc-300">{icon}</span>
      </div>
      <p className="mt-3 text-base font-semibold text-zinc-900 break-words">
        {value}
      </p>
      {note ? <p className="mt-1 text-[11px] text-zinc-500">{note}</p> : null}
    </div>
  );
}

export default function IPLookupClient({
  dict,
  lang,
}: {
  dict: any;
  lang: Lang;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const copy = PAGE_COPY[lang];
  const labels = dict?.tools?.ip ?? {};

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IpLookupResponse | null>(null);
  const [inputIp, setInputIp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState<CopyKind | null>(null);
  const copyTimer = useRef<number | null>(null);

  const queryFromUrl = normalizeLookupTarget(searchParams.get("q") || "");

  const flashCopied = useCallback((kind: CopyKind) => {
    setCopied(kind);
    if (copyTimer.current) {
      window.clearTimeout(copyTimer.current);
    }
    copyTimer.current = window.setTimeout(() => setCopied(null), 1500);
  }, []);

  const copyText = useCallback(
    async (text: string, kind: CopyKind) => {
      try {
        await navigator.clipboard.writeText(text);
        flashCopied(kind);
      } catch {
        // Clipboard can be blocked in some browsers; keep the UI quiet.
      }
    },
    [flashCopied],
  );

  const fetchIP = useCallback(
    async (target?: string) => {
      setLoading(true);
      setError(null);
      setNotice(null);
      setData(null);

      try {
        const url = target
          ? `/api/ip?q=${encodeURIComponent(target)}`
          : "/api/ip";
        const res = await fetch(url, { cache: "no-store" });
        const result = (await res.json()) as IpLookupResponse & {
          message?: string;
        };

        if (!res.ok) {
          throw new Error(result?.message || copy.errorDesc);
        }

        setData(result);
        if (target && result.country_name === "Unknown") {
          setNotice(copy.fallbackDesc);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.errorDesc);
      } finally {
        setLoading(false);
      }
    },
    [copy.errorDesc, copy.fallbackDesc],
  );

  useEffect(() => {
    setInputIp(queryFromUrl);
    void fetchIP(queryFromUrl || undefined);
  }, [fetchIP, queryFromUrl]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) {
        window.clearTimeout(copyTimer.current);
      }
    };
  }, []);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeLookupTarget(inputIp);
    setInputIp(normalized);

    const nextPath = normalized
      ? `${pathname}?q=${encodeURIComponent(normalized)}`
      : pathname;
    const shouldRefetchImmediately = normalized === queryFromUrl;

    router.replace(nextPath);
    if (shouldRefetchImmediately) {
      void fetchIP(normalized || undefined);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-24 font-sans">
      <div className="fixed inset-0 -z-10 bg-[#fafafa]" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 h-[540px] w-[960px] rounded-full bg-emerald-500/5 blur-[140px] -z-10" />

      <div className="text-center lg:text-left">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {copy.badge}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-5 justify-center lg:justify-start">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tighter text-zinc-900 leading-none">
            {copy.title}
          </h1>
          <Link
            href={`/${lang}/tools/api`}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 text-xs font-semibold tracking-wide transition-colors border border-emerald-500/20 w-max mx-auto sm:mx-0"
          >
            <Terminal className="w-3.5 h-3.5" />
            JSON API Available
          </Link>
        </div>
        <p className="mt-4 max-w-3xl text-sm sm:text-base leading-7 text-zinc-500 mx-auto lg:mx-0">
          {copy.subtitle}
        </p>
      </div>

      <form
        onSubmit={handleSearch}
        className="mt-10 rounded-[2rem] border border-zinc-100 bg-white/90 p-3 shadow-sm backdrop-blur"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={inputIp}
              onChange={(event) => setInputIp(event.target.value)}
              placeholder={labels.ip_placeholder || "Enter IP address"}
              className="h-14 w-full rounded-[1.25rem] border border-zinc-100 bg-zinc-50/80 pl-11 pr-4 text-[15px] text-zinc-900 outline-none transition focus:border-emerald-300 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-[1.25rem] bg-emerald-500 px-6 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <Activity className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {labels.ip_btn || "Search"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
          <span>{copy.helper}</span>
          <span className="hidden sm:inline">·</span>
          <span>
            {loading
              ? copy.loading
              : data
                ? `${copy.summary} · ${toSourceLabel(data._source, copy)}`
                : copy.summary}
          </span>
        </div>
      </form>

      {(error || notice) && (
        <div
          className={`mt-6 rounded-[1.75rem] border px-5 py-4 shadow-sm ${error ? "border-amber-200 bg-amber-50 text-amber-900" : "border-zinc-200 bg-white/80 text-zinc-600"}`}
        >
          <div className="flex items-start gap-3">
            <AlertCircle
              className={`mt-0.5 h-5 w-5 shrink-0 ${error ? "text-amber-600" : "text-zinc-400"}`}
            />
            <div className="min-w-0">
              <div className="text-sm font-semibold">
                {error ? copy.errorTitle : copy.fallbackTitle}
              </div>
              <div className="mt-1 text-sm leading-6">
                {error || notice || copy.fallbackDesc}
              </div>
            </div>
          </div>
        </div>
      )}

      {loading && !data ? (
        <div className="mt-8 space-y-6 animate-pulse">
          <div className="rounded-[2rem] border border-zinc-100 bg-white/80 p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-6 w-20 rounded-full bg-zinc-100" />
              <div className="h-6 w-28 rounded-full bg-zinc-100" />
              <div className="h-6 w-36 rounded-full bg-zinc-100" />
            </div>
            <div className="mt-6 h-12 w-72 rounded-2xl bg-zinc-100" />
            <div className="mt-4 h-5 w-full max-w-2xl rounded bg-zinc-100" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="h-24 rounded-[1.75rem] bg-zinc-50" />
              <div className="h-24 rounded-[1.75rem] bg-zinc-50" />
              <div className="h-24 rounded-[1.75rem] bg-zinc-50" />
              <div className="h-24 rounded-[1.75rem] bg-zinc-50" />
            </div>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="h-56 rounded-[2rem] border border-zinc-100 bg-white/70" />
            <div className="h-56 rounded-[2rem] border border-zinc-100 bg-white/70" />
            <div className="h-56 rounded-[2rem] border border-zinc-100 bg-white/70" />
          </div>
        </div>
      ) : data ? (
        <div className="mt-8 space-y-6">
          <section className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-emerald-700"
                  >
                    {copy.lookupComplete}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-sky-700">
                    {copy.countryLevel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-zinc-500">
                    {toSourceLabel(data._source, copy)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold tracking-[0.16em] text-zinc-500">
                    {data.provider}
                  </span>
                </div>

                <h2 className="mt-4 break-words text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tighter text-zinc-900">
                  {data.ip}
                </h2>
                <p className="mt-3 max-w-3xl text-sm sm:text-base leading-7 text-zinc-500">
                  {data.country_name !== "Unknown"
                    ? `${data.country_name}${data.city !== "Unknown" ? ` · ${data.city}` : ""}${data.region !== "Unknown" ? ` · ${data.region}` : ""}`
                    : copy.fallbackDesc}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void copyText(data.ip, "ip")}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-emerald-200 hover:text-emerald-700"
                >
                  {copied === "ip" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copy.copyIp}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      data.city !== "Unknown"
                        ? `${data.city}, ${data.country_name}`
                        : data.country_name,
                      "geo",
                    )
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-emerald-200 hover:text-emerald-700"
                >
                  {copied === "geo" ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <MapPin className="h-4 w-4" />
                  )}
                  {copy.copyGeo}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(JSON.stringify(data, null, 2), "json")
                  }
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                >
                  {copied === "json" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copy.copyAll}
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label={labels.country || "Country"}
                value={data.country_name}
                note={data.country_code || "—"}
                icon={<Globe className="h-4 w-4" />}
              />
              <StatCard
                label={copy.continent}
                value={data.continent || copy.unknown}
                note={data.continent_code || "—"}
                icon={<MapPin className="h-4 w-4" />}
              />
              <StatCard
                label={labels.asn || "ASN"}
                value={String(data.asn || "—")}
                note={data.org || "—"}
                icon={<SignalHigh className="h-4 w-4" />}
              />
              <StatCard
                label={copy.organization}
                value={data.org || data.isp || copy.unknown}
                note={data.as_domain || "—"}
                icon={<Server className="h-4 w-4" />}
              />
            </div>
          </section>

          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <section className="min-w-0 rounded-[2rem] border border-zinc-100 bg-white/90 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                    {copy.summary}
                  </p>
                  <h3 className="mt-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900">
                    <Fingerprint className="h-5 w-5 text-emerald-500" />
                    {copy.networkAttribution}
                  </h3>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <dt className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                    {labels.asn || "ASN"}
                  </dt>
                  <dd className="mt-2 break-words text-sm font-semibold text-zinc-900">
                    {String(data.asn || "—")}
                  </dd>
                </div>
                <div className="min-w-0 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <dt className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                    {copy.organization}
                  </dt>
                  <dd className="mt-2 break-words text-sm font-semibold text-zinc-900">
                    {data.org || data.isp || copy.unknown}
                  </dd>
                </div>
                <div className="min-w-0 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 sm:col-span-2">
                  <dt className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                    {copy.organizationDomain}
                  </dt>
                  <dd className="mt-2 break-all text-sm font-semibold text-zinc-900">
                    {data.as_domain || "—"}
                  </dd>
                </div>
              </dl>
            </section>

            <section className="min-w-0 rounded-[2rem] border border-zinc-100 bg-white/90 p-6 shadow-sm">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                  {copy.insights}
                </p>
                <h3 className="mt-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900">
                  <Globe className="h-5 w-5 text-emerald-500" />
                  {copy.dataCoverage}
                </h3>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                    {copy.includedData}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    {copy.includedDataDesc}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                    {copy.excludedData}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-zinc-700">
                    {copy.excludedDataDesc}
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-zinc-400">
                    {copy.source}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-zinc-900">
                    {data.provider}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {toSourceLabel(data._source, copy)}
                  </p>
                  {data._source === "ipinfo-lite" ? (
                    <a
                      href="https://ipinfo.io"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-medium text-emerald-700 underline decoration-emerald-200 underline-offset-4"
                    >
                      IP address data powered by IPinfo
                    </a>
                  ) : null}
                  {data.data_notice ? (
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {lang === "zh"
                        ? "免费数据仅覆盖国家级位置和 ASN；不包含城市、坐标、时区、网络类型或代理状态。"
                        : data.data_notice}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

          </div>

          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-zinc-100 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                  {copy.rawJson}
                </p>
                <h3 className="mt-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-900">
                  <Copy className="h-5 w-5 text-emerald-500" />
                  {labels.ip_json_toggle || "JSON"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowJson((value) => !value)}
                aria-expanded={showJson}
                aria-controls="ip-lookup-raw-json"
                className="inline-flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:border-emerald-200 hover:text-emerald-700"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showJson ? "rotate-180" : ""}`}
                />
                {showJson ? copy.hideRaw : copy.showRaw}
              </button>
            </div>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-500">
              {copy.rawJsonDesc}
            </p>

            {showJson ? (
              <div
                id="ip-lookup-raw-json"
                data-testid="ip-lookup-raw-json"
                className="mt-6 min-w-0 max-w-full overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-zinc-950 p-4 text-[11px] leading-6 text-zinc-300"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold tracking-[0.16em] text-zinc-500">
                    {labels.copy_json || "Copy JSON"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      void copyText(JSON.stringify(data, null, 2), "json")
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-white/10"
                  >
                    {copied === "json" ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copy.copyAll}
                  </button>
                </div>
                <pre className="max-h-[30rem] max-w-full overflow-auto font-mono">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            ) : null}
          </section>
        </div>
      ) : (
        <div className="mt-8 rounded-[2rem] border border-dashed border-zinc-200 bg-white/70 p-10 text-center shadow-sm">
          <Globe className="mx-auto h-14 w-14 text-emerald-300" />
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-900">
            {copy.emptyTitle}
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            {copy.emptyDesc}
          </p>
        </div>
      )}
    </div>
  );
}
