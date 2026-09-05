"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  Activity,
  ArrowUp,
  BarChart,
  Box,
  Braces,
  Brain,
  Bug,
  CheckCircle2,
  Code2,
  Cloud,
  Command,
  Crosshair,
  Database,
  DoorOpen,
  ExternalLink,
  Eye,
  FileCode,
  Fingerprint,
  GitMerge,
  Globe,
  History,
  KeyRound,
  KeySquare,
  Layers,
  Lock,
  Mail,
  Map,
  MessageSquare,
  MonitorCheck,
  Network,
  QrCode,
  Radar,
  Rocket,
  Scan,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Star,
  Terminal,
  Clock3,
  Vault,
  Workflow,
  Wrench,
  Zap,
} from "lucide-react";

type Lang = "zh" | "en";
type IconType = React.ComponentType<{ className?: string }>;
type Scene = "ops" | "ai" | "security" | "dev" | "knowledge";

type Tool = {
  name: string;
  desc: string;
  icon: IconType;
  status: "operational" | "maintenance";
  url: string;
  scene: Scene;
  tags: string[];
  favorite?: boolean;
  pinned?: boolean;
  external?: boolean;
  accent?: string;
};

type ToolCategory = {
  category: string;
  scene: Scene;
  tools: Tool[];
};

const text = {
  zh: {
    badge: "个人运维工作台",
    title: "OpsKitPro 工具",
    subtitle: "把日常运维、AI、账号安全和开发入口收进一个浏览器首页。",
    search: "搜索工具、场景或标签",
    quick: "自研工具",
    daily: "日常入口",
    all: "全部",
    open: "打开",
    builtIn: "站内工具",
    available: "可用入口",
    noResult: "没有找到匹配的工具。",
    statusTitle: "快捷栏",
    statusCopy: "常用入口，一键直达。",
    reminders: "提醒",
    reminderItems: [
      "优先检查域名、SSL、DNS 与边缘网络。",
      "高频 AI、密码、通信入口保持在首屏。",
      "外部工具默认适合作为新标签页跳转。",
    ],
    extension: "预留扩展位",
    extensionCopy: "后续可接入真实状态、最近访问、待办和 Obsidian 快捷笔记。",
    extensionItems: ["实时状态来源", "最近访问", "Obsidian 快捷笔记"],
    scenesTitle: "场景",
    scenes: {
      ops: "运维 Ops",
      ai: "AI 中枢",
      security: "安全 / 账号",
      dev: "开发 / Git",
      knowledge: "知识库 / 文档",
    },
  },
  en: {
    badge: "Personal Ops Workbench",
    title: "OpsKitPro Tools",
    subtitle:
      "A browser start page for ops, AI, account security, and developer tools.",
    search: "Search tools, scenes, or tags",
    quick: "OpsKitPro Tools",
    daily: "Daily Launchers",
    all: "All",
    open: "Open",
    builtIn: "Built in",
    available: "Available",
    noResult: "No matching tools found.",
    statusTitle: "Quick Launch",
    statusCopy: "Common tools, one click away.",
    reminders: "Notes",
    reminderItems: [
      "Start with domain, SSL, DNS, and edge checks.",
      "Keep AI, password, and comms tools above the fold.",
      "External tools are ready for new-tab workflows.",
    ],
    extension: "Reserved Slot",
    extensionCopy:
      "Future data can include live status, recent visits, tasks, and Obsidian notes.",
    extensionItems: [
      "Live status source",
      "Recent visits",
      "Obsidian quick note",
    ],
    scenesTitle: "Scenes",
    scenes: {
      ops: "Ops",
      ai: "AI Hub",
      security: "Security",
      dev: "Dev / Git",
      knowledge: "Knowledge",
    },
  },
} satisfies Record<
  Lang,
  {
    badge: string;
    title: string;
    subtitle: string;
    search: string;
    quick: string;
    daily: string;
    all: string;
    open: string;
    builtIn: string;
    available: string;
    noResult: string;
    statusTitle: string;
    statusCopy: string;
    reminders: string;
    reminderItems: string[];
    extension: string;
    extensionCopy: string;
    extensionItems: string[];
    scenesTitle: string;
    scenes: Record<Scene, string>;
  }
>;

const sceneOrder: Scene[] = ["ops", "ai", "security", "dev", "knowledge"];

const getExternal = (url: string) => /^https?:\/\//.test(url);

export default function ServicesClient({
  dict,
  lang,
}: {
  dict: any;
  lang: Lang;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeScene, setActiveScene] = useState<Scene | "all">("all");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const copy = text[lang] || text.zh;

  const categorizedServices: ToolCategory[] = useMemo(
    () => [
      {
        category: dict.tools.cat_cyber,
        scene: "ops",
        tools: [
          {
            name: dict.tools.diagnostic_title,
            desc: dict.tools.diagnostic_desc,
            icon: Activity,
            status: "operational",
            url: "/tools/website-check",
            scene: "ops",
            tags: ["SSL", "CDN", "HTTP"],
            favorite: true,
            pinned: true,
            accent: "emerald",
          },
          {
            name: dict.tools.dns_lookup_title || dict.tools.dns.btn,
            desc:
              dict.tools.dns_lookup_desc ||
              ("Check DNS records and resolution status."),
            icon: Search,
            status: "operational",
            url: "/tools/dns-lookup",
            scene: "ops",
            tags: ["A", "MX", "TXT"],
            favorite: true,
            pinned: true,
            accent: "cyan",
          },
          {
            name: dict.tools.ip_title,
            desc: dict.tools.ip_desc,
            icon: Globe,
            status: "operational",
            url: "/tools/ip-lookup",
            scene: "ops",
            tags: ["ASN", "ISP", "Geo"],
            favorite: true,
            pinned: true,
            accent: "sky",
          },
          {
            name: dict.tools.websocket_title,
            desc: dict.tools.websocket_desc,
            icon: Zap,
            status: "operational",
            url: "/tools/websocket",
            scene: "dev",
            tags: ["Socket", "Debug"],
            favorite: true,
            pinned: true,
            accent: "cyan",
          },
          {
            name: dict.tools.json_title,
            desc: dict.tools.json_desc,
            icon: Braces,
            status: "operational",
            url: "/tools/json",
            scene: "dev",
            tags: ["Format", "Validate"],
            favorite: true,
            pinned: true,
            accent: "violet",
          },
          {
            name: dict.tools.passgen_title,
            desc: dict.tools.passgen_desc,
            icon: KeyRound,
            status: "operational",
            url: "/tools/passgen",
            scene: "security",
            tags: ["Generate", "Copy"],
            favorite: true,
            pinned: true,
            accent: "amber",
          },
          {
            name: dict.tools.qrgen_title,
            desc: dict.tools.qrgen_desc,
            icon: QrCode,
            status: "operational",
            url: "/tools/qrgen",
            scene: "dev",
            tags: ["Encode", "Share"],
            favorite: true,
            pinned: true,
            accent: "zinc",
          },
          {
            name: dict.tools.time_title,
            desc: dict.tools.time_desc,
            icon: Clock3,
            status: "operational",
            url: "/tools/time",
            scene: "dev",
            tags: ["Unix", "Timezone"],
            favorite: true,
            pinned: true,
            accent: "emerald",
          },
          {
            name: dict.tools.encode_title,
            desc: dict.tools.encode_desc,
            icon: Code2,
            status: "operational",
            url: "/tools/encode",
            scene: "dev",
            tags: ["Base64", "URL", "JWT"],
            favorite: true,
            pinned: true,
            accent: "emerald",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "通信与协作协议"
            : "Communication Protocols",
        scene: "knowledge",
        tools: [
          {
            name: dict.tools.matrix_title,
            desc: dict.tools.matrix_desc,
            icon: MessageSquare,
            status: "operational",
            url: "https://matrix.org",
            scene: "knowledge",
            tags: ["chat", "secure", "federation"],
            favorite: true,
            external: true,
            accent: "emerald",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "AI 工程工作流"
            : "AI Engineering",
        scene: "ai",
        tools: [
          {
            name: dict.tools.prompt_builder_title,
            desc: dict.tools.prompt_builder_desc,
            icon: Sparkles,
            status: "operational",
            url: "/tools/prompt-builder",
            scene: "ai",
            tags: ["prompt", "agent", "local"],
            favorite: true,
            pinned: true,
            accent: "emerald",
          },
          {
            name: "Vibe Coding Workflow",
            desc: lang === "zh"
                ? "把 AI 辅助开发整理成有边界、有测试、有记录的工程流程。"
                : "A guarded workflow for AI-assisted changes, checks, notes, and deployment.",
            icon: Workflow,
            status: "operational",
            url: "/tools/prompt-builder",
            scene: "knowledge",
            tags: ["vibe", "workflow", "kb"],
            favorite: true,
            accent: "zinc",
          },
          {
            name: "Review & Deploy Checklist",
            desc: lang === "zh"
                ? "提交和部署前检查 public/private 边界、测试、构建和记录。"
                : "Public/private boundary, tests, build, notes, and deployment checks.",
            icon: CheckCircle2,
            status: "operational",
            url: "/tools/prompt-builder",
            scene: "knowledge",
            tags: ["review", "deploy", "safety"],
            favorite: true,
            accent: "emerald",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "SRE 状态面板"
            : "SRE Status",
        scene: "ops",
        tools: [
          {
            name: "Cloudflare Status",
            desc: "Edge, DNS, WAF status",
            icon: Shield,
            status: "operational",
            url: "https://www.cloudflarestatus.com/",
            scene: "ops",
            tags: ["edge", "status"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "orange",
          },
          {
            name: "AWS Health",
            desc: "AWS service health and events",
            icon: Cloud,
            status: "operational",
            url: "https://health.aws.amazon.com/health/status",
            scene: "ops",
            tags: ["cloud", "status"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "amber",
          },
          {
            name: "GitHub Status",
            desc: "GitHub incidents and component health",
            icon: GitMerge,
            status: "operational",
            url: "https://www.githubstatus.com/",
            scene: "dev",
            tags: ["git", "status"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "zinc",
          },
          {
            name: "OpenAI Status",
            desc: "API, ChatGPT, model platform health",
            icon: Brain,
            status: "operational",
            url: "https://status.openai.com/",
            scene: "ai",
            tags: ["ai", "status"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "emerald",
          },
          {
            name: "Cloudflare Radar",
            desc: "Internet traffic, outages, attacks",
            icon: Radar,
            status: "operational",
            url: "https://radar.cloudflare.com/",
            scene: "ops",
            tags: ["radar", "traffic"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "orange",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "密码管理与凭证"
            : "Password Management",
        scene: "security",
        tools: [
          {
            name: "1Password",
            desc: "Enterprise Password Manager",
            icon: KeySquare,
            status: "operational",
            url: "https://1password.com",
            scene: "security",
            tags: ["password", "vault"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "blue",
          },
          {
            name: "Enpass",
            desc: "Offline Password Manager",
            icon: Vault,
            status: "operational",
            url: "https://www.enpass.io",
            scene: "security",
            tags: ["offline", "vault"],
            external: true,
            accent: "orange",
          },
          {
            name: "Bitwarden",
            desc: "Open Source Vault",
            icon: ShieldCheck,
            status: "operational",
            url: "https://bitwarden.com",
            scene: "security",
            tags: ["vault", "open-source"],
            external: true,
            accent: "blue",
          },
        ],
      },
      {
        category: dict.services.cat_monitoring,
        scene: "ops",
        tools: [
          {
            name: "Grafana",
            desc: "Metrics & Visualization",
            icon: BarChart,
            status: "operational",
            url: "https://grafana.com",
            scene: "ops",
            tags: ["metrics", "dashboard"],
            favorite: true,
            external: true,
            accent: "orange",
          },
          {
            name: "Prometheus",
            desc: "Time-series Database",
            icon: Activity,
            status: "operational",
            url: "https://prometheus.io",
            scene: "ops",
            tags: ["metrics", "alert"],
            external: true,
            accent: "orange",
          },
          {
            name: "Elasticsearch",
            desc: "Log Analytics Engine",
            icon: Database,
            status: "operational",
            url: "https://www.elastic.co",
            scene: "ops",
            tags: ["log", "search"],
            external: true,
            accent: "yellow",
          },
          {
            name: "Zabbix",
            desc: "Enterprise Monitoring",
            icon: MonitorCheck,
            status: "operational",
            url: "https://www.zabbix.com",
            scene: "ops",
            tags: ["monitoring", "alert"],
            external: true,
            accent: "red",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "自动化与配置管理"
            : "IT Automation & IaC",
        scene: "ops",
        tools: [
          {
            name: "Ansible",
            desc: "Agentless IT Automation",
            icon: Wrench,
            status: "operational",
            url: "https://www.ansible.com",
            scene: "ops",
            tags: ["automation", "config"],
            external: true,
            accent: "red",
          },
          {
            name: "SaltStack",
            desc: "Event-driven Infra",
            icon: Zap,
            status: "operational",
            url: "https://saltproject.io",
            scene: "ops",
            tags: ["automation", "infra"],
            external: true,
            accent: "cyan",
          },
          {
            name: "Terraform",
            desc: "Infrastructure as Code",
            icon: Layers,
            status: "operational",
            url: "https://www.terraform.io",
            scene: "ops",
            tags: ["iac", "cloud"],
            favorite: true,
            external: true,
            accent: "violet",
          },
        ],
      },
      {
        category: dict.services.cat_infra,
        scene: "ops",
        tools: [
          {
            name: "AWS Console",
            desc: "Primary Cloud Provider",
            icon: Cloud,
            status: "operational",
            url: "https://aws.amazon.com/console/",
            scene: "ops",
            tags: ["cloud", "console"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "amber",
          },
          {
            name: "Cloudflare",
            desc: "Edge, DNS & WAF",
            icon: Shield,
            status: "operational",
            url: "https://dash.cloudflare.com",
            scene: "ops",
            tags: ["edge", "waf"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "orange",
          },
          {
            name: "Kubernetes",
            desc: "Container Orchestration",
            icon: Server,
            status: "operational",
            url: "https://kubernetes.io",
            scene: "ops",
            tags: ["container", "cluster"],
            external: true,
            accent: "blue",
          },
        ],
      },
      {
        category: dict.services.cat_cicd,
        scene: "dev",
        tools: [
          {
            name: "GitHub Actions",
            desc: "Automated Workflows",
            icon: GitMerge,
            status: "operational",
            url: "https://github.com/features/actions",
            scene: "dev",
            tags: ["ci", "github"],
            favorite: true,
            external: true,
            accent: "zinc",
          },
          {
            name: "ArgoCD",
            desc: "GitOps Delivery",
            icon: Workflow,
            status: "operational",
            url: "https://argoproj.github.io/cd/",
            scene: "dev",
            tags: ["gitops", "deploy"],
            external: true,
            accent: "red",
          },
          {
            name: "Jenkins",
            desc: "Legacy Automation",
            icon: Terminal,
            status: "operational",
            url: "https://www.jenkins.io",
            scene: "dev",
            tags: ["ci", "pipeline"],
            external: true,
            accent: "slate",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "安全通道与零信任"
            : "Zero Trust & Tunnels",
        scene: "security",
        tools: [
          {
            name: "JumpServer",
            desc: "Open Source Bastion Host",
            icon: DoorOpen,
            status: "operational",
            url: "https://www.jumpserver.org",
            scene: "security",
            tags: ["bastion", "access"],
            external: true,
            accent: "emerald",
          },
          {
            name: "Tailscale",
            desc: "Mesh VPN Network",
            icon: Network,
            status: "operational",
            url: "https://tailscale.com",
            scene: "security",
            tags: ["vpn", "mesh"],
            favorite: true,
            external: true,
            accent: "zinc",
          },
          {
            name: "WireGuard",
            desc: "Fast & Modern VPN",
            icon: Lock,
            status: "operational",
            url: "https://www.wireguard.com",
            scene: "security",
            tags: ["vpn", "tunnel"],
            external: true,
            accent: "blue",
          },
          {
            name: "Pritunl",
            desc: "Enterprise VPN Server",
            icon: Shield,
            status: "operational",
            url: "https://pritunl.com",
            scene: "security",
            tags: ["vpn", "server"],
            external: true,
            accent: "green",
          },
          {
            name: "Proton Mail",
            desc: "Encrypted Email Service",
            icon: Mail,
            status: "operational",
            url: "https://proton.me/mail",
            scene: "security",
            tags: ["mail", "privacy"],
            favorite: true,
            external: true,
            accent: "violet",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "人工智能体中枢"
            : "AI & Intelligence",
        scene: "ai",
        tools: [
          {
            name: "OpenClaw",
            desc: "AI Inference & Bypass",
            icon: Brain,
            status: "operational",
            url: "https://openclaw.ai/",
            scene: "ai",
            tags: ["ai", "inference"],
            external: true,
            accent: "fuchsia",
          },
          {
            name: "OpenAI",
            desc: "GPT-4 / O1 Inference",
            icon: Brain,
            status: "operational",
            url: "https://chat.openai.com",
            scene: "ai",
            tags: ["ai", "chat"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "emerald",
          },
          {
            name: "Claude",
            desc: "Anthropic Opus/Sonnet",
            icon: MessageSquare,
            status: "operational",
            url: "https://claude.ai",
            scene: "ai",
            tags: ["ai", "writing"],
            favorite: true,
            pinned: true,
            external: true,
            accent: "orange",
          },
          {
            name: "Gemini3",
            desc: "Google Advanced Gemini",
            icon: Sparkles,
            status: "operational",
            url: "https://gemini.google.com",
            scene: "ai",
            tags: ["ai", "google"],
            favorite: true,
            external: true,
            accent: "blue",
          },
          {
            name: "Grok",
            desc: "xAI Unfiltered Model",
            icon: Rocket,
            status: "operational",
            url: "https://twitter.com/i/grok",
            scene: "ai",
            tags: ["ai", "x"],
            external: true,
            accent: "zinc",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "威胁情报与资产探测"
            : "Threat Intel & Recon",
        scene: "security",
        tools: [
          {
            name: "Nmap",
            desc: "Network Discovery & Auditing",
            icon: Search,
            status: "operational",
            url: "https://nmap.org",
            scene: "security",
            tags: ["scan", "network"],
            external: true,
            accent: "blue",
          },
          {
            name: "Masscan",
            desc: "Mass IP Port Scanner",
            icon: Crosshair,
            status: "operational",
            url: "https://github.com/robertdavidgraham/masscan",
            scene: "security",
            tags: ["scan", "port"],
            external: true,
            accent: "red",
          },
          {
            name: "Shodan",
            desc: "IoT Search Engine",
            icon: Radar,
            status: "operational",
            url: "https://www.shodan.io",
            scene: "security",
            tags: ["recon", "iot"],
            favorite: true,
            external: true,
            accent: "red",
          },
          {
            name: "FOFA",
            desc: "Cyber Space Mapping",
            icon: Scan,
            status: "operational",
            url: "https://fofa.info",
            scene: "security",
            tags: ["recon", "asset"],
            external: true,
            accent: "cyan",
          },
          {
            name: "VirusTotal",
            desc: "Malware Intelligence",
            icon: ShieldAlert,
            status: "operational",
            url: "https://www.virustotal.com",
            scene: "security",
            tags: ["malware", "intel"],
            favorite: true,
            external: true,
            accent: "emerald",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "渗透拦截与防御抓包"
            : "Offensive & Traffic",
        scene: "security",
        tools: [
          {
            name: "Burp Suite",
            desc: "Web Vuln Scanner",
            icon: Crosshair,
            status: "operational",
            url: "https://portswigger.net/burp",
            scene: "security",
            tags: ["web", "proxy"],
            external: true,
            accent: "orange",
          },
          {
            name: "Wireshark",
            desc: "Packet Capture Analysis",
            icon: Activity,
            status: "operational",
            url: "https://www.wireshark.org",
            scene: "security",
            tags: ["packet", "traffic"],
            external: true,
            accent: "blue",
          },
          {
            name: "Nuclei",
            desc: "Fast Vulnerability Scanner",
            icon: Bug,
            status: "operational",
            url: "https://github.com/projectdiscovery/nuclei",
            scene: "security",
            tags: ["vuln", "scan"],
            external: true,
            accent: "violet",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "云原生安全与审计"
            : "Cloud & DevSecOps",
        scene: "dev",
        tools: [
          {
            name: "Trivy",
            desc: "Container Security Scanner",
            icon: Box,
            status: "operational",
            url: "https://aquasecurity.github.io/trivy",
            scene: "dev",
            tags: ["container", "security"],
            external: true,
            accent: "cyan",
          },
          {
            name: "Checkov",
            desc: "IaC Security Misconfigs",
            icon: FileCode,
            status: "operational",
            url: "https://www.checkov.io",
            scene: "dev",
            tags: ["iac", "security"],
            external: true,
            accent: "violet",
          },
          {
            name: "Wazuh",
            desc: "Open Source XDR & SIEM",
            icon: Shield,
            status: "operational",
            url: "https://wazuh.com",
            scene: "security",
            tags: ["siem", "xdr"],
            external: true,
            accent: "blue",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "网络与域名诊断"
            : "DNS & Diagnostics",
        scene: "ops",
        tools: [
          {
            name: "MXToolBox",
            desc: "DNS & Mail Health Check",
            icon: Mail,
            status: "operational",
            url: "https://mxtoolbox.com",
            scene: "ops",
            tags: ["dns", "mail"],
            favorite: true,
            external: true,
            accent: "red",
          },
          {
            name: "DNSDumpster",
            desc: "DNS Topology Mapping",
            icon: Map,
            status: "operational",
            url: "https://dnsdumpster.com",
            scene: "security",
            tags: ["dns", "recon"],
            external: true,
            accent: "green",
          },
          {
            name: "SecurityTrails",
            desc: "Historical DNS Records",
            icon: History,
            status: "operational",
            url: "https://securitytrails.com",
            scene: "security",
            tags: ["dns", "history"],
            external: true,
            accent: "blue",
          },
          {
            name: "ViewDNS",
            desc: "Reverse IP & Network Utils",
            icon: Eye,
            status: "operational",
            url: "https://viewdns.info",
            scene: "ops",
            tags: ["dns", "reverse"],
            external: true,
            accent: "zinc",
          },
          {
            name: "ICANN Lookup",
            desc: "Global WHOIS Registry",
            icon: Fingerprint,
            status: "operational",
            url: "https://lookup.icann.org",
            scene: "ops",
            tags: ["whois", "domain"],
            external: true,
            accent: "slate",
          },
        ],
      },
      {
        category: lang === "zh"
            ? "网络取证"
            : "Network Forensics",
        scene: "ops",
        tools: [
          {
            name: "SSL Labs",
            desc: "Deep TLS certificate and protocol test",
            icon: Lock,
            status: "operational",
            url: "https://www.ssllabs.com/ssltest/",
            scene: "security",
            tags: ["tls", "ssl"],
            favorite: true,
            external: true,
            accent: "red",
          },
          {
            name: "BGP.Tools",
            desc: "ASN, prefix, routing visibility",
            icon: Network,
            status: "operational",
            url: "https://bgp.tools/",
            scene: "ops",
            tags: ["bgp", "asn"],
            favorite: true,
            external: true,
            accent: "blue",
          },
          {
            name: "RIPEstat",
            desc: "IP, ASN, routing and registry data",
            icon: Globe,
            status: "operational",
            url: "https://stat.ripe.net/",
            scene: "ops",
            tags: ["ripe", "asn"],
            favorite: true,
            external: true,
            accent: "emerald",
          },
          {
            name: "crt.sh",
            desc: "Certificate transparency search",
            icon: Search,
            status: "operational",
            url: "https://crt.sh/",
            scene: "security",
            tags: ["cert", "ct"],
            external: true,
            accent: "zinc",
          },
          {
            name: "DNSViz",
            desc: "DNSSEC and delegation visualization",
            icon: Workflow,
            status: "operational",
            url: "https://dnsviz.net/",
            scene: "ops",
            tags: ["dnssec", "dns"],
            external: true,
            accent: "cyan",
          },
        ],
      },
    ],
    [dict, lang],
  );

  const allTools = useMemo(
    () => categorizedServices.flatMap((cat) => cat.tools),
    [categorizedServices],
  );
  const firstPartyTools = useMemo(
    () => allTools.filter((tool) => tool.url.startsWith("/tools/")),
    [allTools],
  );
  const primaryTools = useMemo(
    () => firstPartyTools.slice(0, 3),
    [firstPartyTools],
  );
  const dailyLaunchers = useMemo(
    () =>
      allTools
        .filter((tool) => tool.pinned && !tool.url.startsWith("/tools/"))
        .slice(0, 8),
    [allTools],
  );
  const showPrimaryTools = activeScene === "all" && searchTerm.trim() === "";

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const promotedUrls = new Set(primaryTools.map((tool) => tool.url));

    return categorizedServices
      .map((cat) => {
        const matchedTools = cat.tools.filter((tool) => {
          if (showPrimaryTools && promotedUrls.has(tool.url)) return false;

          const sceneMatches =
            activeScene === "all" || tool.scene === activeScene;
          const queryMatches =
            !query ||
            [
              tool.name,
              tool.desc,
              cat.category,
              copy.scenes[tool.scene],
              ...tool.tags,
            ].some((item) => item.toLowerCase().includes(query));

          return sceneMatches && queryMatches;
        });

        return { ...cat, tools: matchedTools };
      })
      .filter((cat) => cat.tools.length > 0);
  }, [
    activeScene,
    categorizedServices,
    copy.scenes,
    primaryTools,
    searchTerm,
    showPrimaryTools,
  ]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("dashboard-search")?.focus();
      }
    };

    const handleScroll = () => setShowScrollTop(window.scrollY > 480);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <main className="w-full flex-grow text-[var(--text-primary)]">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-6 sm:px-6 md:pt-10">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="ui-surface-elevated rounded-[2rem] p-4 sm:p-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--accent-text)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {copy.badge}
                </div>
                <h1 className="text-3xl font-black tracking-tight text-[var(--text-primary)] sm:text-[2.8rem]">
                  {copy.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
                  {copy.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 xl:w-[330px]">
                {[
                  {
                    label: copy.scenes.ops,
                    value: categorizedServices.length,
                    icon: MonitorCheck,
                  },
                  {
                    label: copy.quick,
                    value: firstPartyTools.length,
                    icon: Star,
                  },
                  {
                    label: copy.available,
                    value: allTools.length,
                    icon: CheckCircle2,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-2.5"
                    >
                      <Icon className="mb-2 h-4 w-4 text-[var(--accent-text)]" />
                      <div className="text-xl font-black text-[var(--text-primary)]">
                        {item.value}
                      </div>
                      <div className="mt-1 truncate text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                        {item.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <label htmlFor="dashboard-search" className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  id="dashboard-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={copy.search}
                  className="h-11 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] pl-11 pr-16 text-sm text-[var(--text-primary)] shadow-sm outline-none transition placeholder:text-[var(--text-faint)] focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-1 text-xs font-semibold text-[var(--text-faint)]">
                  ⌘K
                </span>
              </label>

              <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
                {(["all", ...sceneOrder] as Array<Scene | "all">).map(
                  (scene) => {
                    const isActive = activeScene === scene;
                    const label =
                      scene === "all" ? copy.all : copy.scenes[scene];
                    return (
                      <button
                        key={scene}
                        type="button"
                        onClick={() => setActiveScene(scene)}
                        className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          isActive
                            ? "border-emerald-500 bg-[var(--accent-color)] text-[var(--accent-contrast)] shadow-sm"
                            : "border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] hover:border-emerald-500/30 hover:bg-[var(--accent-soft)] hover:text-[var(--accent-text)]"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  },
                )}
              </div>
            </div>
          </div>

          {showPrimaryTools && (
            <section
              aria-labelledby="quick-launch"
              className="ui-surface order-2 rounded-[1.5rem] p-4 sm:p-5 lg:order-3 lg:col-span-2"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2
                  id="quick-launch"
                  className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-faint)]"
                >
                  {copy.quick}
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                {primaryTools.map((tool) => (
                  <ToolLink
                    key={tool.name}
                    tool={tool}
                    openLabel={copy.open}
                    builtInLabel={copy.builtIn}
                    featured
                  />
                ))}
              </div>
            </section>
          )}

          <aside className="order-3 grid gap-3 lg:order-2">
            <Panel title={copy.reminders} icon={Command}>
              <ul className="space-y-3 text-sm leading-6 text-[var(--text-muted)]">
                {copy.reminderItems.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </aside>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            {filteredServices.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--border-subtle)] bg-[var(--surface-primary)] text-center">
                <Activity className="mb-4 h-8 w-8 text-[var(--text-faint)]" />
                <p className="text-sm text-[var(--text-muted)]">
                  {copy.noResult}
                </p>
              </div>
            ) : (
              filteredServices.map((cat) => (
                <section key={cat.category} className="scroll-mt-24">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--accent-text)]">
                        {copy.scenes[cat.scene]}
                      </p>
                      <h2 className="mt-1 text-xl font-black tracking-tight text-[var(--text-primary)]">
                        {cat.category}
                      </h2>
                    </div>
                    <span className="rounded-full border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
                      {cat.tools.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {cat.tools.map((tool) => (
                      <ToolLink
                        key={`${cat.category}-${tool.name}`}
                        tool={tool}
                        openLabel={copy.open}
                        builtInLabel={copy.builtIn}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <Panel title={copy.extension} icon={Layers}>
              <p className="text-sm leading-6 text-[var(--text-muted)]">
                {copy.extensionCopy}
              </p>
              <div className="mt-4 space-y-2">
                {copy.extensionItems.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-xs font-semibold text-[var(--text-muted)]"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title={copy.scenesTitle} icon={Workflow}>
              <div className="space-y-2">
                {sceneOrder.map((scene) => {
                  const count = allTools.filter(
                    (tool) => tool.scene === scene,
                  ).length;
                  return (
                    <button
                      key={scene}
                      type="button"
                      onClick={() => setActiveScene(scene)}
                      className="flex w-full items-center justify-between rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2 text-left text-sm text-[var(--text-secondary)] transition hover:border-emerald-500/30 hover:bg-[var(--accent-soft)]"
                    >
                      <span>{copy.scenes[scene]}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Panel>

            <Panel title={copy.daily} icon={Star}>
              <div className="space-y-2">
                {dailyLaunchers.map((tool) => (
                  <DailyLauncherLink key={tool.name} tool={tool} />
                ))}
              </div>
            </Panel>
          </aside>
        </div>
      </section>

      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="ui-surface fixed bottom-6 right-4 z-50 rounded-full p-3 text-[var(--text-primary)] transition hover:bg-[var(--accent-color)] hover:text-[var(--accent-contrast)] sm:bottom-10 sm:right-10"
          aria-label={"Scroll to top"}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </main>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: IconType;
  children: React.ReactNode;
}) {
  return (
    <section className="ui-surface rounded-[1.5rem] p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/8 text-emerald-500">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function ToolLink({
  tool,
  compact = false,
  featured = false,
  openLabel = "Open",
  builtInLabel = "Built in",
}: {
  tool: Tool;
  compact?: boolean;
  featured?: boolean;
  openLabel?: string;
  builtInLabel?: string;
}) {
  const Icon = tool.icon;
  const external = tool.external || getExternal(tool.url);
  const builtIn = tool.url.startsWith("/tools/");
  const target = external ? "_blank" : undefined;
  const rel = external ? "noreferrer" : undefined;

  if (compact) {
    return (
      <Link
        href={tool.url}
        target={target}
        rel={rel}
        className="group flex min-h-28 flex-col justify-between rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/15 bg-emerald-500/8 text-emerald-500">
            <Icon className="h-4 w-4" />
          </div>
          {external && (
            <ExternalLink className="h-3.5 w-3.5 text-[var(--text-faint)] transition group-hover:text-[var(--accent-text)]" />
          )}
        </div>
        <div>
          <h3 className="truncate text-sm font-bold text-[var(--text-primary)]">
            {tool.name}
          </h3>
          <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
            {tool.tags.slice(0, 2).join(" / ")}
          </p>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={tool.url}
      target={target}
      rel={rel}
      className={`group flex flex-col justify-between rounded-[1.25rem] border border-[var(--border-subtle)] bg-[var(--surface-secondary)] shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${featured ? "min-h-[190px] p-5" : "min-h-[168px] p-4"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition group-hover:border-emerald-500/20 group-hover:bg-emerald-500/8 group-hover:text-[var(--accent-text)] ${featured ? "h-12 w-12" : "h-11 w-11"}`}
          >
            <Icon className={featured ? "h-6 w-6" : "h-5 w-5"} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-[var(--text-primary)]">
              {tool.name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              {tool.desc}
            </p>
          </div>
        </div>
        {external && (
          <ExternalLink className="h-4 w-4 shrink-0 text-[var(--text-faint)] transition group-hover:text-[var(--accent-text)]" />
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-2 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]"
            >
              {tag}
            </span>
          ))}
        </div>
        <span
          className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
            builtIn
              ? "border-emerald-500/20 bg-emerald-500/8 text-[var(--accent-text)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
          }`}
        >
          {builtIn ? builtInLabel : openLabel}
        </span>
      </div>
    </Link>
  );
}

function DailyLauncherLink({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  const external = tool.external || getExternal(tool.url);

  return (
    <Link
      href={tool.url}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-[var(--accent-soft)] focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition group-hover:border-emerald-500/20 group-hover:text-[var(--accent-text)]">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-[var(--text-primary)]">
            {tool.name}
          </span>
          <span className="block truncate text-xs text-[var(--text-muted)]">
            {tool.tags.slice(0, 2).join(" / ")}
          </span>
        </span>
      </span>
      {external && (
        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[var(--text-faint)] transition group-hover:text-[var(--accent-text)]" />
      )}
    </Link>
  );
}
