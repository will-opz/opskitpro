"use client";

import { useState, useCallback, useRef } from "react";
import {
  Wifi,
  Globe,
  Gauge,
  Download,
  Clock,
  Radio,
  Layers,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Play,
  Shield,
  Zap,
  Activity,
  Server,
  ChevronRight,
} from "lucide-react";
import type {
  NetworkInfoResponse,
  PingResult,
  SpeedResult,
  DnsPerfResult,
  DnsLatencyItem,
  ReachabilityItem,
  NetworkAnalysis,
} from "@/lib/api-contracts";
import { sendAnalyticsEvent } from "@/components/AnalyticsEvent";

// ─── Types ──────────────────────────────────────────────────────────────────

type CardPhase = "idle" | "loading" | "done" | "error";

interface CfTrace {
  http: string;
  tls: string;
  warp: string;
  gateway?: string;
  loc?: string;
  sni?: string;
  kex?: string;
  ip: string;
  colo: string;
}

function parseCfTrace(text: string): CfTrace {
  return Object.fromEntries(
    text
      .trim()
      .split("\n")
      .map((l) => l.split("="))
      .filter((p) => p.length === 2)
      .map(([k, v]) => [k.trim(), v.trim()]),
  ) as unknown as CfTrace;
}

function buildNetworkInfoFromTrace(
  trace: CfTrace,
  ua: string,
): NetworkInfoResponse {
  const ip = trace.ip || "Unknown";
  return {
    ip,
    ipv6: ip.includes(":") ? ip : null,
    asn: null,
    org: "Unknown",
    country: trace.loc || "Unknown",
    city: "Unknown",
    colo: trace.colo || "Unknown",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    ua,
    trace: {
      http: trace.http || "Unknown",
      tls: trace.tls || "Unknown",
      warp: trace.warp || "off",
      gateway: trace.gateway || "off",
      loc: trace.loc || "Unknown",
      sni: trace.sni || "Unknown",
      kex: trace.kex || "Unknown",
      ip,
      colo: trace.colo || "Unknown",
    },
    _source: "fallback",
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PING_SAMPLES = 10;
// ─── AI Analysis engine ──────────────────────────────────────────────────────

function analyzeNetwork(
  info: NetworkInfoResponse | null,
  ping: PingResult | null,
  speed: SpeedResult | null,
  trace: CfTrace | null,
  dnsLatency: DnsLatencyItem[],
  reachability: ReachabilityItem[],
  lang: string,
): NetworkAnalysis {
  let score = 0;

  // Latency (30 pts)
  if (ping) {
    if (ping.avg < 50) score += 30;
    else if (ping.avg < 100) score += 24;
    else if (ping.avg < 200) score += 16;
    else if (ping.avg < 300) score += 8;
  }

  // Download (40 pts)
  if (speed?.downloadMbps != null) {
    const dl = speed.downloadMbps;
    if (dl > 100) score += 40;
    else if (dl > 50) score += 30;
    else if (dl > 20) score += 20;
    else if (dl > 5) score += 10;
    else score += 2;
  }

  // Jitter (15 pts)
  if (ping) {
    if (ping.jitter < 5) score += 15;
    else if (ping.jitter < 15) score += 10;
    else if (ping.jitter < 30) score += 5;
  }

  // IPv6 (10 pts)
  const hasIPv6 = info?.ipv6 != null;
  if (hasIPv6) score += 10;

  // Reachability (5 pts)
  if (reachability.length > 0) {
    const okCount = reachability.filter((r) => r.reachable).length;
    const ratio = okCount / reachability.length;
    if (ratio >= 1) score += 5;
    else if (ratio >= 0.75) score += 3;
    else if (ratio >= 0.5) score += 1;
  }

  score = Math.min(100, Math.max(0, score));

  const grade: NetworkAnalysis["grade"] =
    score >= 85
      ? "A"
      : score >= 70
        ? "B"
        : score >= 55
          ? "C"
          : score >= 40
            ? "D"
            : "F";

  const ipVersion: NetworkAnalysis["ipVersion"] = info?.ipv6
    ? info?.ip
      ? "dual-stack"
      : "ipv6-only"
    : "ipv4-only";

  const isCN = lang === "zh" || false;
  const isJA = false;

  const colo = info?.colo || "—";
  const avgMs = ping ? `${ping.avg.toFixed(0)} ms` : "—";
  const dlMbps = speed?.downloadMbps
    ? `${speed.downloadMbps.toFixed(1)} Mbps`
    : "—";
  const traceData = trace || info?.trace || null;
  const edgeColo = traceData?.colo || colo;
  const warp = traceData?.warp || "off";
  const gateway = traceData?.gateway || "off";
  const kex = traceData?.kex || "";
  const hasPostQuantumKex = /mlkem|kyber/i.test(kex);
  const slowReachability = reachability.filter(
    (item) => item.status === "slow" || item.status === "failed",
  );
  const fastestDns = dnsLatency
    .filter((item) => item.status === "ok" && item.latencyMs !== null)
    .sort((a, b) => Number(a.latencyMs) - Number(b.latencyMs))[0];

  // Summary
  const summaries: Record<string, string[]> = {
    zh: [
      `当前 Cloudflare Trace 显示连接命中 ${edgeColo} 节点。`,
      warp === "plus"
        ? `WARP+ 已开启，Gateway ${gateway === "on" ? "已启用" : "未启用"}。`
        : warp === "on"
          ? `WARP 已开启，Gateway ${gateway === "on" ? "已启用" : "未启用"}。`
          : "WARP 未开启。",
      hasPostQuantumKex
        ? "已启用后量子密钥交换，首次 TLS 握手可能略有额外耗时。"
        : "",
      ping
        ? `平均延迟 ${avgMs}，${ping.avg < 80 ? "延迟优秀，非常适合实时应用。" : ping.avg < 150 ? "延迟正常，适合日常使用。" : "延迟偏高，可能影响实时通信。"}`
        : "",
      speed?.downloadMbps ? `下载速度 ${dlMbps}。` : "",
      fastestDns
        ? `服务器侧公共 DNS 探测中，最快的是 ${fastestDns.provider}（${fastestDns.latencyMs} ms）。`
        : "",
      ping && ping.avg < 100 && slowReachability.length > 0
        ? "基础延迟正常，但部分目标可达性较慢，实时通信或长连接体验可能受路由影响。"
        : "",
      hasIPv6
        ? "你的网络已启用 IPv6 双栈，支持新一代互联网服务。"
        : "你的网络尚未启用 IPv6。",
    ],
    en: [
      `Cloudflare Trace reports the ${edgeColo} edge node for this connection.`,
      warp === "plus"
        ? `WARP+ is enabled and Gateway is ${gateway === "on" ? "on" : "off"}.`
        : warp === "on"
          ? `WARP is enabled and Gateway is ${gateway === "on" ? "on" : "off"}.`
          : "WARP is not enabled.",
      hasPostQuantumKex
        ? "Post-quantum key exchange is enabled; first TLS handshakes may carry slight extra cost."
        : "",
      ping
        ? `Average latency ${avgMs} — ${ping.avg < 80 ? "excellent for real-time applications." : ping.avg < 150 ? "good for everyday use." : "latency is elevated, may impact real-time communication."}`
        : "",
      speed?.downloadMbps ? `Download speed: ${dlMbps}.` : "",
      fastestDns
        ? `Fastest server-side public DNS probe: ${fastestDns.provider} (${fastestDns.latencyMs} ms).`
        : "",
      ping && ping.avg < 100 && slowReachability.length > 0
        ? "Baseline latency is healthy, but some targets are slow; real-time apps or long-lived connections may be affected by routing."
        : "",
      hasIPv6
        ? "Your network supports IPv6 dual-stack."
        : "IPv6 is not yet enabled on your network.",
    ],
  };

  const summary = (summaries[isCN ? "zh" : "en"] || summaries.en)
    .filter(Boolean)
    .join(" ");

  // Suitable for
  const suitableMap = {
    zh: {
      videoConf: "视频会议",
      remoteWork: "远程办公",
      cloudOps: "云端运维",
      streaming4K: "4K 流媒体",
      gaming: "在线游戏",
      browsing: "日常浏览",
    },
    en: {
      videoConf: "Video Conferencing",
      remoteWork: "Remote Work",
      cloudOps: "Cloud Operations",
      streaming4K: "4K Streaming",
      gaming: "Online Gaming",
      browsing: "Web Browsing",
    },
  };

  const sm = isCN ? suitableMap.zh : suitableMap.en;
  const suitableFor: string[] = [];
  if (ping && speed) {
    if (ping.avg < 100 && ping.jitter < 15 && (speed.downloadMbps ?? 0) > 5)
      suitableFor.push(sm.videoConf);
    if (score >= 60) suitableFor.push(sm.remoteWork);
    if (score >= 75 && hasIPv6) suitableFor.push(sm.cloudOps);
    if ((speed.downloadMbps ?? 0) > 25) suitableFor.push(sm.streaming4K);
    if (ping.avg < 80 && ping.jitter < 10) suitableFor.push(sm.gaming);
  }
  if (suitableFor.length === 0) suitableFor.push(sm.browsing);

  // Potential issues
  const issueMap = {
    zh: {
      highLatency: "延迟偏高（可能为物理距离或网络拥塞）",
      highJitter: "抖动较大（不稳定，影响实时通信）",
      slowDl: "下载速度较慢",
      slowUl: "上传速度较慢",
      noIPv6: "未启用 IPv6（可能影响部分服务）",
      lowReach: "部分网站不可达（可能存在网络限制）",
    },
    en: {
      highLatency: "High latency (distance or congestion)",
      highJitter: "High jitter (unstable connection)",
      slowDl: "Slow download speed",
      slowUl: "Slow upload speed",
      noIPv6: "No IPv6 (may affect some modern services)",
      lowReach: "Some sites unreachable (possible restrictions)",
    },
  };
  const im = isCN ? issueMap.zh : issueMap.en;
  const potentialIssues: string[] = [];
  if (ping && ping.avg > 150) potentialIssues.push(im.highLatency);
  if (ping && ping.jitter > 20) potentialIssues.push(im.highJitter);
  if (speed?.downloadMbps != null && speed.downloadMbps < 10)
    potentialIssues.push(im.slowDl);
  if (!hasIPv6) potentialIssues.push(im.noIPv6);
  const unreachableCount = reachability.filter((r) => !r.reachable).length;
  if (unreachableCount > 2) potentialIssues.push(im.lowReach);
  if (hasPostQuantumKex) {
    potentialIssues.push(
      isCN
        ? "后量子密钥交换已启用，首次连接握手可能略慢"
        : isJA
          ? "ポスト量子鍵交換が有効で、初回接続がわずかに遅くなる可能性"
          : "Post-quantum key exchange may add slight first-connection latency",
    );
  }
  if (
    (warp === "on" || warp === "plus") &&
    ping &&
    ping.avg < 100 &&
    slowReachability.length > 0
  ) {
    potentialIssues.push(
      isCN
        ? "WARP 路由下部分目标较慢，可能影响即时通讯/长连接"
        : isJA
          ? "WARP ルーティングで一部ターゲットが遅く、長時間接続に影響する可能性"
          : "Some targets are slow under WARP routing; realtime or long-lived connections may suffer",
    );
  }

  // Recommendations
  const recMap = {
    zh: {
      wifi5: "尽量使用 5GHz Wi-Fi，减少干扰",
      ipv6svc: "优先选择支持 IPv6 的服务",
      wiredConn: "改用有线连接以降低延迟和抖动",
      vpn: "考虑使用 Cloudflare WARP 加速跨区流量",
      reboot: "尝试重启路由器以改善网络质量",
      contactISP: "联系 ISP 升级宽带套餐",
    },
    en: {
      wifi5: "Use 5GHz Wi-Fi to reduce interference",
      ipv6svc: "Prefer IPv6-capable services when available",
      wiredConn: "Switch to wired Ethernet for lower latency and jitter",
      vpn: "Consider Cloudflare WARP to accelerate cross-region traffic",
      reboot: "Try rebooting your router to improve network quality",
      contactISP: "Contact your ISP to upgrade your bandwidth plan",
    },
  };
  const rm = isCN ? recMap.zh : recMap.en;
  const recommendations: string[] = [rm.wifi5];
  if (!hasIPv6) recommendations.push(rm.ipv6svc);
  if (ping && ping.jitter > 15) recommendations.push(rm.wiredConn);
  if (unreachableCount > 0) recommendations.push(rm.vpn);
  if (speed?.downloadMbps != null && speed.downloadMbps < 10)
    recommendations.push(rm.contactISP);
  if (
    (warp === "on" || warp === "plus") &&
    gateway === "off" &&
    slowReachability.length > 0
  ) {
    recommendations.push(
      isCN
        ? "日常使用可考虑 DNS Only，需要 Zero Trust 应用时再开启 WARP"
        : isJA
          ? "普段は DNS Only を使い、Zero Trust が必要なときだけ WARP を有効化"
          : "Use DNS Only for daily browsing; enable WARP when Zero Trust access is needed",
    );
  }
  if (recommendations.length < 2) recommendations.push(rm.reboot);

  return {
    score,
    grade,
    ipVersion,
    summary,
    suitableFor,
    potentialIssues,
    recommendations,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  phase,
  pendingText,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  phase: CardPhase;
  pendingText?: string;
  children?: React.ReactNode;
}) {
  const isPending = phase === "idle" || (phase !== "done" && !children);

  return (
    <div className="op-card rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-4 border-b border-[var(--border-subtle)]">
        <span className="text-[var(--accent-text)]">{icon}</span>
        <h2 className="text-sm font-semibold text-[var(--text-primary)] flex-1">
          {title}
        </h2>
        {phase === "loading" && (
          <Loader2 className="w-4 h-4 text-[var(--accent-text)] animate-spin" />
        )}
        {phase === "done" && (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        )}
        {phase === "error" && (
          <AlertCircle className="w-4 h-4 text-amber-500" />
        )}
      </div>
      <div className="p-4 sm:p-5">
        {phase === "error" && !children ? (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs font-medium text-[var(--text-muted)]">
              {pendingText || "Check failed. Try again later."}
            </p>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-soft)]/50 px-3 py-3">
            {phase === "loading" ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[var(--accent-text)]" />
            ) : (
              <div className="h-2 w-2 shrink-0 rounded-full bg-[var(--text-faint)]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-[var(--text-muted)]">
                {pendingText ||
                  (phase === "loading" ? "Checking..." : "Waiting for check")}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--border-subtle)]">
                <div
                  className={`h-full rounded-full bg-[var(--accent-color)] ${
                    phase === "loading"
                      ? "w-2/3 animate-pulse"
                      : "w-1/4 opacity-30"
                  }`}
                />
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <span
        className={`text-xs font-semibold text-[var(--text-primary)] ${mono ? "font-mono" : ""}`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function StatBox({
  label,
  value,
  unit,
  quality,
}: {
  label: string;
  value: string | null;
  unit?: string;
  quality?: "good" | "ok" | "bad";
}) {
  const colors = {
    good: "text-emerald-500",
    ok: "text-amber-500",
    bad: "text-red-500",
  };
  return (
    <div className="op-card-soft rounded-xl p-3 text-center sm:p-4">
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)] sm:mb-2 sm:tracking-[0.18em]">
        {label}
      </p>
      {value !== null ? (
        <p
          className={`text-xl font-bold leading-tight sm:text-2xl ${quality ? colors[quality] : "text-[var(--text-primary)]"}`}
        >
          {value}
          {unit && (
            <span className="text-xs ml-1 text-[var(--text-muted)]">
              {unit}
            </span>
          )}
        </p>
      ) : (
        <div className="h-7 sm:h-8 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-[var(--border-subtle)] border-t-[var(--accent-color)] animate-spin" />
        </div>
      )}
    </div>
  );
}

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 100) * circumference;
  const gradeColor =
    grade === "A"
      ? "#10b981"
      : grade === "B"
        ? "#34d399"
        : grade === "C"
          ? "#f59e0b"
          : grade === "D"
            ? "#f97316"
            : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-28 h-28">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={gradeColor}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="text-center z-10">
        <p className="text-3xl font-semibold" style={{ color: gradeColor }}>
          {grade}
        </p>
        <p className="text-xs font-semibold text-[var(--text-muted)]">
          {score}/100
        </p>
      </div>
    </div>
  );
}

function PingChart({ samples }: { samples: number[] }) {
  if (samples.length === 0) return null;
  const max = Math.max(...samples);
  return (
    <div className="flex items-end gap-1 h-10 mt-3">
      {samples.map((s, i) => {
        const h = Math.max(4, Math.round((s / max) * 40));
        const color =
          s < 100 ? "bg-emerald-500" : s < 200 ? "bg-amber-400" : "bg-red-400";
        return (
          <div
            key={i}
            title={`${s}ms`}
            className={`flex-1 rounded-sm ${color}`}
            style={{ height: h }}
          />
        );
      })}
    </div>
  );
}

function StatusDot({ status }: { status: "ok" | "slow" | "failed" }) {
  const map = {
    ok: "bg-emerald-500",
    slow: "bg-amber-400",
    failed: "bg-red-400",
  };
  return (
    <span className={`inline-block w-2.5 h-2.5 rounded-full ${map[status]}`} />
  );
}

function SpeedBar({
  value,
  max = 200,
}: {
  value: number | null;
  max?: number;
}) {
  const pct = value != null ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden mt-2">
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
        style={{ width: `${pct}%`, transition: "width 0.8s ease-out" }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NetworkCheckClient({
  dict,
  lang,
}: {
  dict: any;
  lang: "zh" | "en";
}) {
  const nc = dict.tools.network_check;
  const waitingText = false
    ? "前のチェックを待っています"
    : lang === "zh"
      ? "等待前序检测"
      : false
        ? "等待前序檢測"
        : "Waiting for previous check";

  // State
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [currentStep, setCurrentStep] = useState("");

  const [netInfo, setNetInfo] = useState<NetworkInfoResponse | null>(null);
  const [netInfoPhase, setNetInfoPhase] = useState<CardPhase>("idle");

  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pingPhase, setPingPhase] = useState<CardPhase>("idle");

  const [speedResult, setSpeedResult] = useState<SpeedResult | null>(null);
  const [speedPhase, setSpeedPhase] = useState<CardPhase>("idle");
  const [selectedSizeMb, setSelectedSizeMb] = useState<1 | 10 | 50>(10);
  const [dlProgress, setDlProgress] = useState(0);

  const [dnsPerfResult, setDnsPerfResult] = useState<DnsPerfResult | null>(
    null,
  );
  const [dnsPerfPhase, setDnsPerfPhase] = useState<CardPhase>("idle");
  const [dnsLatency, setDnsLatency] = useState<DnsLatencyItem[]>([]);
  const [dnsLatencyPhase, setDnsLatencyPhase] = useState<CardPhase>("idle");

  const [reachability, setReachability] = useState<ReachabilityItem[]>([]);
  const [reachPhase, setReachPhase] = useState<CardPhase>("idle");

  const [cfTrace, setCfTrace] = useState<CfTrace | null>(null);
  const [tracePhase, setTracePhase] = useState<CardPhase>("idle");

  const [analysis, setAnalysis] = useState<NetworkAnalysis | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const runPing = useCallback(async (): Promise<PingResult> => {
    const samples: number[] = [];
    for (let i = 0; i < PING_SAMPLES; i++) {
      const t0 = performance.now();
      try {
        await fetch("/api/network/ping", { cache: "no-store" });
      } catch {
        // ignore
      }
      samples.push(Math.round(performance.now() - t0));
      // Update state progressively
      setPingResult({
        samples: [...samples],
        min: Math.min(...samples),
        avg: Math.round(samples.reduce((a, b) => a + b, 0) / samples.length),
        max: Math.max(...samples),
        jitter: Math.round(
          samples
            .slice(1)
            .reduce((acc, s, i) => acc + Math.abs(s - samples[i]), 0) /
            Math.max(1, samples.length - 1),
        ),
      });
    }
    const min = Math.min(...samples);
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    const max = Math.max(...samples);
    const jitter = Math.round(
      samples
        .slice(1)
        .reduce((acc, s, i) => acc + Math.abs(s - samples[i]), 0) /
        Math.max(1, samples.length - 1),
    );
    return { min, avg, max, jitter, samples };
  }, []);

  const runDownload = useCallback(
    async (
      sizeMb: number,
    ): Promise<{ mbps: number; bytes: number; durationMs: number }> => {
      setDlProgress(0);
      const t0 = performance.now();
      const response = await fetch(`/api/network/download?size=${sizeMb}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error(`download failed: ${response.status}`);
      }
      const contentLength = parseInt(
        response.headers.get("content-length") ?? "0",
        10,
      );
      const reader = response.body!.getReader();
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value?.byteLength ?? 0;
        if (contentLength > 0)
          setDlProgress(Math.round((received / contentLength) * 100));
      }
      const durationMs = performance.now() - t0;
      const mbps = (received * 8) / (durationMs / 1000) / 1_000_000;
      setDlProgress(100);
      return { mbps, bytes: received, durationMs };
    },
    [],
  );

  const getDnsPerf = useCallback((): DnsPerfResult => {
    try {
      const entries = performance.getEntriesByType(
        "navigation",
      ) as PerformanceNavigationTiming[];
      const nav = entries[0];
      if (!nav) return { dnsMs: null, tcpMs: null, tlsMs: null, ttfbMs: null };
      const dnsMs = Math.round(nav.domainLookupEnd - nav.domainLookupStart);
      const tcpMs = Math.round(nav.connectEnd - nav.connectStart);
      const tlsMs =
        nav.secureConnectionStart > 0
          ? Math.round(nav.connectEnd - nav.secureConnectionStart)
          : null;
      const ttfbMs = Math.round(nav.responseStart - nav.requestStart);
      return { dnsMs, tcpMs, tlsMs, ttfbMs };
    } catch {
      return { dnsMs: null, tcpMs: null, tlsMs: null, ttfbMs: null };
    }
  }, []);

  // ── Main flow ──────────────────────────────────────────────────────────────

  const startCheck = useCallback(async () => {
    sendAnalyticsEvent({ event: "core_tool_run", tool: "network-doctor" });
    abortRef.current = new AbortController();
    setPhase("running");
    setNetInfo(null);
    setNetInfoPhase("idle");
    setPingResult(null);
    setPingPhase("idle");
    setSpeedResult(null);
    setSpeedPhase("idle");
    setDlProgress(0);
    setDnsPerfResult(null);
    setDnsPerfPhase("idle");
    setDnsLatency([]);
    setDnsLatencyPhase("idle");
    setReachability([]);
    setReachPhase("idle");
    setCfTrace(null);
    setTracePhase("idle");
    setAnalysis(null);

    let finalNetInfo: NetworkInfoResponse | null = null;
    let finalPing: PingResult | null = null;
    let finalSpeed: SpeedResult | null = null;
    let finalReach: ReachabilityItem[] = [];
    let finalTrace: CfTrace | null = null;
    let finalDnsLatency: DnsLatencyItem[] = [];

    // Step 1 — Network info
    setCurrentStep(nc.info_title);
    setNetInfoPhase("loading");
    try {
      const res = await fetch("/api/network/info", { cache: "no-store" });
      if (!res.ok) throw new Error(`network info failed: ${res.status}`);
      finalNetInfo = await res.json();
      setNetInfo(finalNetInfo);
      setNetInfoPhase("done");
    } catch {
      try {
        const traceRes = await fetch("/cdn-cgi/trace", { cache: "no-store" });
        const traceText = await traceRes.text();
        finalTrace = parseCfTrace(traceText);
        finalNetInfo = buildNetworkInfoFromTrace(
          finalTrace,
          navigator.userAgent || "Unknown",
        );
        setCfTrace(finalTrace);
        setNetInfo(finalNetInfo);
        setNetInfoPhase("done");
      } catch {
        setNetInfoPhase("error");
      }
    }

    // Step 2 — DNS perf (from page load timing)
    setDnsPerfPhase("loading");
    const dnsPerf = getDnsPerf();
    setDnsPerfResult(dnsPerf);
    setDnsPerfPhase(dnsPerf.dnsMs !== null ? "done" : "error");

    // Step 2b — Public resolver latency from edge/server perspective
    setDnsLatencyPhase("loading");
    try {
      const res = await fetch("/api/network/dns-latency", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`dns latency failed: ${res.status}`);
      const data = await res.json();
      finalDnsLatency = data.results ?? [];
      setDnsLatency(finalDnsLatency);
      setDnsLatencyPhase(finalDnsLatency.length > 0 ? "done" : "error");
    } catch {
      setDnsLatencyPhase("error");
    }

    // Step 3 — Ping
    setCurrentStep(nc.ping_title);
    setPingPhase("loading");
    try {
      finalPing = await runPing();
      setPingResult(finalPing);
      setPingPhase("done");
    } catch {
      setPingPhase("error");
    }

    // Step 4 — Download
    setCurrentStep(nc.speed_title);
    setSpeedPhase("loading");
    let dlMbps: number | null = null;
    let dlBytes = 0;
    let dlDuration = 0;

    try {
      const dl = await runDownload(selectedSizeMb);
      dlMbps = parseFloat(dl.mbps.toFixed(2));
      dlBytes = dl.bytes;
      dlDuration = dl.durationMs;
    } catch {
      // ignore
    }

    finalSpeed = {
      downloadMbps: dlMbps,
      downloadDurationMs: dlDuration,
      downloadBytes: dlBytes,
    };
    setSpeedResult(finalSpeed);
    setSpeedPhase(dlMbps !== null ? "done" : "error");

    // Step 5 — Reachability
    setCurrentStep(nc.reach_title);
    setReachPhase("loading");
    try {
      const res = await fetch("/api/network/reachability", {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`reachability failed: ${res.status}`);
      const data = await res.json();
      finalReach = data.results ?? [];
      setReachability(finalReach);
      setReachPhase("done");
    } catch {
      setReachPhase("error");
    }

    // Step 6 — CF Trace
    setCurrentStep(nc.trace_title);
    setTracePhase("loading");
    try {
      const res = await fetch("/cdn-cgi/trace");
      const text = await res.text();
      const parsed = parseCfTrace(text);
      finalTrace = parsed;
      setCfTrace(parsed);
      setTracePhase("done");
    } catch {
      setTracePhase("error");
    }

    // Step 7 — Analysis
    setCurrentStep(nc.ai_title);
    const result = analyzeNetwork(
      finalNetInfo,
      finalPing,
      finalSpeed,
      finalTrace,
      finalDnsLatency,
      finalReach,
      lang,
    );
    setAnalysis(result);

    setCurrentStep("");
    setPhase("done");
    sendAnalyticsEvent({ event: "core_tool_success", tool: "network-doctor" });
  }, [nc, selectedSizeMb, lang, runPing, runDownload, getDnsPerf]);

  // ── Metric quality helpers ─────────────────────────────────────────────────

  const latencyQuality = (ms: number): "good" | "ok" | "bad" =>
    ms < 80 ? "good" : ms < 200 ? "ok" : "bad";

  const speedQuality = (mbps: number): "good" | "ok" | "bad" =>
    mbps > 50 ? "good" : mbps > 10 ? "ok" : "bad";

  const jitterQuality = (ms: number): "good" | "ok" | "bad" =>
    ms < 10 ? "good" : ms < 25 ? "ok" : "bad";

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <main className="w-full flex-grow">
      <div className="glow" aria-hidden />

      <section className="mx-auto w-full max-w-3xl px-4 pt-8 pb-5 sm:px-6 sm:pt-8 sm:pb-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 ui-chip mb-4 sm:mb-5">
          <Radio className="w-3.5 h-3.5" />
          <span>{nc.badge}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--text-primary)] mb-2 sm:mb-3">
          {nc.title}
        </h1>
        <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-xl mx-auto mb-6 sm:mb-8 leading-7">
          {nc.subtitle}
        </p>

        {/* Size selector (visible before run) */}
        {phase === "idle" && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xs text-[var(--text-muted)]">
              {nc.speed_select}:
            </span>
            {([1, 10, 50] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSizeMb(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  selectedSizeMb === s
                    ? "border-[var(--accent-color)] bg-[var(--accent-soft)] text-[var(--accent-text)]"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--accent-color)]/50"
                }`}
              >
                {s} MB
              </button>
            ))}
          </div>
        )}

        {phase === "idle" && <p className="mb-4 text-sm leading-6 text-[var(--text-secondary)]">{lang === "zh" ? `测速将下载约 ${selectedSizeMb} MB，并请求 Cloudflare、公共 DNS 与可达性检测服务。浏览器、边缘与探针结果分别标明。` : `The speed test downloads about ${selectedSizeMb} MB and contacts Cloudflare, public DNS and reachability services. Browser, Edge and Probe results are labeled separately.`}</p>}
        {/* CTA */}
        {phase === "idle" && (
          <button
            id="start-network-check"
            onClick={startCheck}
            className="ui-button-primary gap-3 px-8 py-4 text-base rounded-2xl shadow-lg hover:-translate-y-1 transition-transform"
          >
            <Play className="w-5 h-5" />
            {nc.start}
          </button>
        )}

        {phase === "running" && (
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-[var(--accent-text)] animate-spin" />
              <span className="text-sm font-semibold text-[var(--text-secondary)]">
                {nc.checking}
                {currentStep ? ` — ${currentStep}` : ""}
              </span>
            </div>
            {/* overall progress bar */}
            <div className="w-40 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--accent-color)] animate-pulse"
                style={{ width: "60%" }}
              />
            </div>
          </div>
        )}

        {phase === "done" && (
          <button
            id="recheck-network"
            onClick={startCheck}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-[var(--border-strong)] text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--accent-color)]/40 hover:text-[var(--text-primary)] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {nc.recheck}
          </button>
        )}
      </section>

      {/* Cards grid */}
      {(phase === "running" || phase === "done") && (
        <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-16 grid gap-3 sm:gap-4">
          {/* 1. Network Info */}
          <SectionCard
            title={nc.info_title}
            icon={<Globe className="w-4 h-4" />}
            phase={netInfoPhase}
            pendingText={
              currentStep === nc.info_title ? nc.checking : waitingText
            }
          >
            {netInfo ? (
              <div className="grid sm:grid-cols-2 gap-x-8">
                <div>
                  <MetaRow label={nc.info_ip} value={netInfo.ip} mono />
                  {netInfo.ipv6 && (
                    <MetaRow label={nc.info_ipv6} value={netInfo.ipv6} mono />
                  )}
                  <MetaRow
                    label={nc.info_asn}
                    value={netInfo.asn ? `AS${netInfo.asn}` : "—"}
                    mono
                  />
                  <MetaRow label={nc.info_org} value={netInfo.org} />
                  <MetaRow label={nc.info_country} value={netInfo.country} />
                </div>
                <div>
                  <MetaRow label={nc.info_city} value={netInfo.city} />
                  <MetaRow label={nc.info_colo} value={netInfo.colo} mono />
                  <MetaRow label={nc.info_timezone} value={netInfo.timezone} />
                  <MetaRow
                    label={nc.info_ua}
                    value={netInfo.ua.split("/")[0] ?? netInfo.ua}
                  />
                </div>
              </div>
            ) : null}
          </SectionCard>

          {/* 2. IPv6 Status */}
          <SectionCard
            title={nc.ipv6_title}
            icon={<Layers className="w-4 h-4" />}
            phase={netInfoPhase}
            pendingText={
              currentStep === nc.info_title ? nc.checking : waitingText
            }
          >
            {netInfo ? (
              <div className="flex items-start gap-4">
                <div
                  className={`flex shrink-0 items-center justify-center w-12 h-12 rounded-2xl ${
                    netInfo.ipv6
                      ? "bg-emerald-500/10 text-emerald-500"
                      : "bg-[var(--bg-tertiary)] dark:bg-zinc-800 text-[var(--text-muted)]"
                  }`}
                >
                  {netInfo.ipv6 ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] mb-1">
                    {netInfo.ipv6 ? nc.ipv6_dual : nc.ipv6_ipv4only}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {netInfo.ipv6 ? nc.ipv6_dual_desc : nc.ipv6_ipv4only_desc}
                  </p>
                </div>
              </div>
            ) : null}
          </SectionCard>

          {/* 3. Latency */}
          <SectionCard
            title={nc.ping_title}
            icon={<Activity className="w-4 h-4" />}
            phase={pingPhase}
            pendingText={
              currentStep === nc.ping_title ? nc.checking : waitingText
            }
          >
            {pingResult ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox
                    label={nc.ping_min}
                    value={`${pingResult.min}`}
                    unit="ms"
                    quality={latencyQuality(pingResult.min)}
                  />
                  <StatBox
                    label={nc.ping_avg}
                    value={`${pingResult.avg}`}
                    unit="ms"
                    quality={latencyQuality(pingResult.avg)}
                  />
                  <StatBox
                    label={nc.ping_max}
                    value={`${pingResult.max}`}
                    unit="ms"
                    quality={latencyQuality(pingResult.max)}
                  />
                  <StatBox
                    label={nc.ping_jitter}
                    value={`${pingResult.jitter}`}
                    unit="ms"
                    quality={jitterQuality(pingResult.jitter)}
                  />
                </div>
                <div className="mt-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--text-faint)] mb-1">
                    {nc.ping_samples} ({pingResult.samples.length})
                  </p>
                  <PingChart samples={pingResult.samples} />
                </div>
              </>
            ) : null}
          </SectionCard>

          {/* 4. Speed */}
          <SectionCard
            title={nc.speed_title}
            icon={<Gauge className="w-4 h-4" />}
            phase={speedPhase}
            pendingText={
              currentStep === nc.speed_title ? nc.checking : waitingText
            }
          >
            <div className="space-y-5">
              {/* Download */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-[var(--accent-text)]" />
                    <span className="text-xs font-semibold text-[var(--text-secondary)]">
                      {nc.speed_download}
                    </span>
                  </div>
                  {speedResult?.downloadMbps != null ? (
                    <span
                      className={`text-lg font-semibold ${speedQuality(speedResult.downloadMbps) === "good" ? "text-emerald-500" : speedQuality(speedResult.downloadMbps) === "ok" ? "text-amber-500" : "text-red-400"}`}
                    >
                      {speedResult.downloadMbps.toFixed(1)}
                      <span className="text-xs font-semibold text-[var(--text-muted)] ml-1">
                        Mbps
                      </span>
                    </span>
                  ) : speedPhase === "loading" ? (
                    <span className="text-xs text-[var(--text-muted)] animate-pulse">
                      {nc.speed_testing_dl}
                    </span>
                  ) : null}
                </div>
                <SpeedBar value={speedResult?.downloadMbps ?? null} max={200} />
                {speedPhase === "loading" &&
                  dlProgress > 0 &&
                  dlProgress < 100 && (
                    <p className="text-xs text-right mt-1 text-[var(--text-faint)]">
                      {dlProgress}%
                    </p>
                  )}
              </div>
            </div>
          </SectionCard>

          {/* 5. DNS / TLS Perf */}
          <SectionCard
            title={nc.dns_perf_title}
            icon={<Clock className="w-4 h-4" />}
            phase={dnsPerfPhase}
            pendingText={nc.checking}
          >
            {dnsPerfResult ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox
                    label={nc.dns_perf_dns}
                    value={
                      dnsPerfResult.dnsMs != null
                        ? `${dnsPerfResult.dnsMs}`
                        : null
                    }
                    unit="ms"
                    quality={
                      dnsPerfResult.dnsMs != null
                        ? latencyQuality(dnsPerfResult.dnsMs)
                        : undefined
                    }
                  />
                  <StatBox
                    label={nc.dns_perf_tcp}
                    value={
                      dnsPerfResult.tcpMs != null
                        ? `${dnsPerfResult.tcpMs}`
                        : null
                    }
                    unit="ms"
                    quality={
                      dnsPerfResult.tcpMs != null
                        ? latencyQuality(dnsPerfResult.tcpMs)
                        : undefined
                    }
                  />
                  <StatBox
                    label={nc.dns_perf_tls}
                    value={
                      dnsPerfResult.tlsMs != null
                        ? `${dnsPerfResult.tlsMs}`
                        : null
                    }
                    unit="ms"
                    quality={
                      dnsPerfResult.tlsMs != null
                        ? latencyQuality(dnsPerfResult.tlsMs)
                        : undefined
                    }
                  />
                  <StatBox
                    label={nc.dns_perf_ttfb}
                    value={
                      dnsPerfResult.ttfbMs != null
                        ? `${dnsPerfResult.ttfbMs}`
                        : null
                    }
                    unit="ms"
                    quality={
                      dnsPerfResult.ttfbMs != null
                        ? latencyQuality(dnsPerfResult.ttfbMs)
                        : undefined
                    }
                  />
                </div>
                <p className="mt-3 text-xs text-[var(--text-faint)]">
                  {nc.dns_perf_note}
                </p>
              </>
            ) : null}
          </SectionCard>

          {/* 6. Reachability */}
          <SectionCard
            title={nc.reach_title}
            icon={<Globe className="w-4 h-4" />}
            phase={reachPhase}
            pendingText={
              currentStep === nc.reach_title ? nc.checking : waitingText
            }
          >
            {reachability.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-x-6">
                {reachability.map((item) => (
                  <div
                    key={item.url}
                    className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-0"
                  >
                    <div className="flex items-center gap-2.5">
                      <StatusDot status={item.status} />
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.latencyMs != null && (
                        <span className="text-xs text-[var(--text-muted)]">
                          {item.latencyMs}ms
                        </span>
                      )}
                      <span
                        className={`text-xs font-semibold uppercase tracking-wider ${
                          item.status === "ok"
                            ? "text-emerald-500"
                            : item.status === "slow"
                              ? "text-amber-500"
                              : "text-red-400"
                        }`}
                      >
                        {item.status === "ok"
                          ? nc.reach_ok
                          : item.status === "slow"
                            ? nc.reach_slow
                            : nc.reach_failed}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </SectionCard>

          {/* 7. Cloudflare Trace */}
          <SectionCard
            title={nc.trace_title}
            icon={<Server className="w-4 h-4" />}
            phase={tracePhase}
            pendingText={
              currentStep === nc.trace_title ? nc.checking : waitingText
            }
          >
            {cfTrace ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox
                    label={nc.trace_warp}
                    value={
                      cfTrace.warp === "plus"
                        ? "WARP+"
                        : cfTrace.warp === "on"
                          ? nc.trace_warp_on
                          : nc.trace_warp_off
                    }
                    quality={
                      cfTrace.warp === "plus" || cfTrace.warp === "on"
                        ? "good"
                        : "ok"
                    }
                  />
                  <StatBox
                    label={nc.trace_gateway || "Gateway"}
                    value={cfTrace.gateway === "on" ? "On" : "Off"}
                    quality={cfTrace.gateway === "on" ? "good" : "ok"}
                  />
                  <StatBox
                    label={nc.trace_colo}
                    value={cfTrace.colo || "—"}
                    quality="good"
                  />
                  <StatBox
                    label={nc.trace_kex || "TLS/KEX"}
                    value={
                      cfTrace.kex && /mlkem|kyber/i.test(cfTrace.kex)
                        ? "Post-Quantum"
                        : cfTrace.kex || cfTrace.tls || "—"
                    }
                    quality={
                      cfTrace.kex && /mlkem|kyber/i.test(cfTrace.kex)
                        ? "ok"
                        : "good"
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <MetaRow label={nc.info_ip} value={cfTrace.ip} mono />
                  <MetaRow label={nc.trace_http} value={cfTrace.http} mono />
                  <MetaRow label={nc.trace_tls} value={cfTrace.tls} mono />
                  <MetaRow
                    label={nc.trace_sni || "SNI"}
                    value={cfTrace.sni || "—"}
                    mono
                  />
                  <MetaRow
                    label={nc.info_country}
                    value={cfTrace.loc || "—"}
                    mono
                  />
                  <MetaRow
                    label={nc.trace_kex || "KEX"}
                    value={cfTrace.kex || "—"}
                    mono
                  />
                </div>
                <p className="text-xs leading-5 text-[var(--text-faint)]">
                  {lang === "zh" || false
                    ? "Cloudflare Trace 反映当前请求经过 Cloudflare 时看到的连接信息；在非 Cloudflare 环境下会使用页面侧回退数据。"
                    : false
                      ? "Cloudflare Trace は、このリクエストが Cloudflare を通過した時点の接続情報です。Cloudflare 以外ではページ側のフォールバックデータを使います。"
                      : "Cloudflare Trace reflects connection details observed as this request passes through Cloudflare; non-Cloudflare paths use page-side fallback data."}
                </p>
              </div>
            ) : null}
          </SectionCard>

          {/* 8. DNS Resolver Latency */}
          <SectionCard
            title={nc.dns_latency_title || "DNS Resolver Latency"}
            icon={<Radio className="w-4 h-4" />}
            phase={dnsLatencyPhase}
            pendingText={nc.checking}
          >
            {dnsLatency.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {dnsLatency.map((item) => (
                  <div
                    key={item.resolver}
                    className="flex items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-primary)] px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {item.provider}
                      </p>
                      <p className="font-mono text-xs text-[var(--text-muted)]">
                        {item.resolver}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${item.status === "ok" ? "text-emerald-500" : "text-red-400"}`}
                      >
                        {item.latencyMs !== null
                          ? `${item.latencyMs} ms`
                          : "ERR"}
                      </p>
                      <p className="text-xs uppercase tracking-[0.12em] text-[var(--text-faint)]">
                        {item.status}
                      </p>
                    </div>
                  </div>
                ))}
                <p className="sm:col-span-2 text-xs leading-5 text-[var(--text-faint)]">
                  {lang === "zh" || false
                    ? "这里展示的是 OpsKitPro 服务器侧到公共 DoH 解析器的延迟，不等同于你本机或手机当前 DNS 的真实延迟。"
                    : false
                      ? "ここに表示されるのは OpsKitPro サーバー側から Public DoH リゾルバーへの遅延で、端末ローカル DNS の実測値ではありません。"
                      : "These values are measured from the OpsKitPro server to public DoH resolvers, not from your local device DNS path."}
                </p>
              </div>
            ) : null}
          </SectionCard>

          {/* 9. AI Analysis */}
          <div className="op-card rounded-2xl overflow-hidden border-[var(--accent-color)]/20 shadow-[0_0_40px_-10px_rgba(16,185,129,0.15)]">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--border-subtle)] bg-[var(--accent-soft)]">
              <Zap className="w-4 h-4 text-[var(--accent-text)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)] flex-1">
                {nc.ai_title}
              </h2>
              {!analysis && phase === "running" && (
                <Loader2 className="w-4 h-4 text-[var(--accent-text)] animate-spin" />
              )}
              {analysis && (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
            </div>

            <div className="p-5">
              {analysis ? (
                <div className="space-y-6">
                  {/* Score + Summary */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="flex flex-col items-center gap-1 shrink-0">
                      <ScoreRing
                        score={analysis.score}
                        grade={analysis.grade}
                      />
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {nc.ai_score}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed text-center sm:text-left">
                      {analysis.summary}
                    </p>
                  </div>

                  {/* Grid: suitable / issues / recs */}
                  <div className="grid sm:grid-cols-3 gap-4">
                    {/* Suitable for */}
                    <div className="op-card-soft rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-text)] mb-3">
                        {nc.ai_suitable}
                      </p>
                      <ul className="space-y-1.5">
                        {analysis.suitableFor.map((s) => (
                          <li
                            key={s}
                            className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Potential issues */}
                    <div className="op-card-soft rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-500 mb-3">
                        {nc.ai_issues}
                      </p>
                      {analysis.potentialIssues.length > 0 ? (
                        <ul className="space-y-1.5">
                          {analysis.potentialIssues.map((s) => (
                            <li
                              key={s}
                              className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                            >
                              <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-xs text-emerald-500">
                          ✓ 未发现明显问题
                        </p>
                      )}
                    </div>

                    {/* Recommendations */}
                    <div className="op-card-soft rounded-xl p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-500 mb-3">
                        {nc.ai_recs}
                      </p>
                      <ul className="space-y-1.5">
                        {analysis.recommendations.map((s) => (
                          <li
                            key={s}
                            className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"
                          >
                            <ChevronRight className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-[var(--text-muted)]">
                  {phase === "running" ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-6 h-6 text-[var(--accent-text)] animate-spin" />
                      <span>{nc.checking}...</span>
                    </div>
                  ) : (
                    <span>{nc.no_data}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Landing placeholder when idle */}
      {phase === "idle" && (
        <section className="mx-auto w-full max-w-3xl px-4 sm:px-6 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <Wifi className="w-5 h-5" />,
                label: lang === "zh" ? "下载速度" : "Download",
                desc:
                  lang === "zh"
                    ? "实时速度测量"
                    : "Real-time speed measurement",
              },
              {
                icon: <Activity className="w-5 h-5" />,
                label: lang === "zh" ? "延迟 & 抖动" : "Latency & Jitter",
                desc:
                  lang === "zh"
                    ? "10次采样精准测量"
                    : "10-sample precision ping",
              },
              {
                icon: <Shield className="w-5 h-5" />,
                label: lang === "zh" ? "IPv6 & 安全" : "IPv6 & Security",
                desc:
                  lang === "zh"
                    ? "网络配置全面检测"
                    : "Full network configuration audit",
              },
              {
                icon: <Globe className="w-5 h-5" />,
                label: lang === "zh" ? "可达性检测" : "Reachability",
                desc:
                  lang === "zh" ? "8个全球站点探测" : "8 global site probes",
              },
              {
                icon: <BarChart3 className="w-5 h-5" />,
                label: lang === "zh" ? "DNS / TLS 性能" : "DNS / TLS Perf",
                desc:
                  lang === "zh"
                    ? "Performance API 数据"
                    : "Performance API data",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                label: lang === "zh" ? "诊断建议" : "Diagnostic advice",
                desc:
                  lang === "zh" ? "评分 + 优化建议" : "Score + recommendations",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="glass-card rounded-2xl p-5 flex gap-4"
              >
                <div className="op-icon-box w-10 h-10 shrink-0">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                    {item.label}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
