'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

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
} from 'lucide-react'

type Lang = 'zh' | 'en' | 'ja' | 'tw'
type IconType = React.ComponentType<{ className?: string }>
type Scene = 'ops' | 'ai' | 'security' | 'dev' | 'knowledge'

type Tool = {
  name: string
  desc: string
  icon: IconType
  status: 'operational' | 'maintenance'
  url: string
  scene: Scene
  tags: string[]
  favorite?: boolean
  pinned?: boolean
  external?: boolean
  accent?: string
}

type ToolCategory = {
  category: string
  scene: Scene
  tools: Tool[]
}

const text = {
  zh: {
    badge: '个人运维工作台',
    title: 'OpsKitPro Dashboard',
    subtitle: '把日常运维、AI、账号安全和开发入口收进一个浏览器首页。',
    search: '搜索工具、场景或标签',
    quick: '自研工具',
    daily: '日常入口',
    all: '全部',
    open: '打开',
    noResult: '没有找到匹配的工具。',
    statusTitle: '今日状态',
    statusCopy: '静态仪表盘已就绪，真实告警与访问历史可在后续接入。',
    reminders: '提醒',
    reminderItems: ['优先检查域名、SSL、DNS 与边缘网络。', '高频 AI、密码、通信入口保持在首屏。', '外部工具默认适合作为新标签页跳转。'],
    extension: '预留扩展位',
    extensionCopy: '后续可接入真实状态、最近访问、待办和 Obsidian 快捷笔记。',
    scenes: {
      ops: '运维 Ops',
      ai: 'AI 中枢',
      security: '安全 / 账号',
      dev: '开发 / Git',
      knowledge: '知识库 / 文档',
    },
  },
  en: {
    badge: 'Personal Ops Workbench',
    title: 'OpsKitPro Dashboard',
    subtitle: 'A browser start page for ops, AI, account security, and developer tools.',
    search: 'Search tools, scenes, or tags',
    quick: 'OpsKitPro Tools',
    daily: 'Daily Launchers',
    all: 'All',
    open: 'Open',
    noResult: 'No matching tools found.',
    statusTitle: 'Today',
    statusCopy: 'Static dashboard is ready. Live alerts and history can be wired in later.',
    reminders: 'Notes',
    reminderItems: ['Start with domain, SSL, DNS, and edge checks.', 'Keep AI, password, and comms tools above the fold.', 'External tools are ready for new-tab workflows.'],
    extension: 'Reserved Slot',
    extensionCopy: 'Future data can include live status, recent visits, tasks, and Obsidian notes.',
    scenes: {
      ops: 'Ops',
      ai: 'AI Hub',
      security: 'Security',
      dev: 'Dev / Git',
      knowledge: 'Knowledge',
    },
  },
  ja: {
    badge: '個人運用ワークベンチ',
    title: 'OpsKitPro Dashboard',
    subtitle: '運用、AI、アカウント安全、開発ツールを集めたブラウザ開始ページです。',
    search: 'ツール、用途、タグを検索',
    quick: 'OpsKitPro ツール',
    daily: '日常入口',
    all: 'すべて',
    open: '開く',
    noResult: '該当するツールが見つかりませんでした。',
    statusTitle: '今日の状態',
    statusCopy: '静的ダッシュボードは利用可能です。実アラートと履歴は後で接続できます。',
    reminders: 'メモ',
    reminderItems: ['まずドメイン、SSL、DNS、エッジを確認。', 'AI、パスワード、通信入口をファーストビューに維持。', '外部ツールは新規タブ運用に向いています。'],
    extension: '拡張用スロット',
    extensionCopy: '今後、実ステータス、最近のアクセス、タスク、Obsidian メモを接続できます。',
    scenes: {
      ops: '運用 Ops',
      ai: 'AI ハブ',
      security: '安全 / アカウント',
      dev: '開発 / Git',
      knowledge: '知識 / 文書',
    },
  },
  tw: {
    badge: '個人維運工作台',
    title: 'OpsKitPro Dashboard',
    subtitle: '把日常維運、AI、帳號安全和開發入口收進一個瀏覽器首頁。',
    search: '搜尋工具、場景或標籤',
    quick: '自研工具',
    daily: '日常入口',
    all: '全部',
    open: '開啟',
    noResult: '沒有找到匹配的工具。',
    statusTitle: '今日狀態',
    statusCopy: '靜態儀表板已就緒，真實告警與瀏覽紀錄可在後續接入。',
    reminders: '提醒',
    reminderItems: ['優先檢查網域、SSL、DNS 與邊緣網路。', '高頻 AI、密碼、通訊入口保持在首屏。', '外部工具適合作為新分頁跳轉。'],
    extension: '預留擴充位',
    extensionCopy: '後續可接入真實狀態、最近訪問、待辦和 Obsidian 快捷筆記。',
    scenes: {
      ops: '維運 Ops',
      ai: 'AI 中樞',
      security: '安全 / 帳號',
      dev: '開發 / Git',
      knowledge: '知識庫 / 文件',
    },
  },
} satisfies Record<Lang, {
  badge: string
  title: string
  subtitle: string
  search: string
  quick: string
  daily: string
  all: string
  open: string
  noResult: string
  statusTitle: string
  statusCopy: string
  reminders: string
  reminderItems: string[]
  extension: string
  extensionCopy: string
  scenes: Record<Scene, string>
}>

const sceneOrder: Scene[] = ['ops', 'ai', 'security', 'dev', 'knowledge']

const getExternal = (url: string) => /^https?:\/\//.test(url)

export default function ServicesClient({ dict, lang }: { dict: any, lang: Lang }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeScene, setActiveScene] = useState<Scene | 'all'>('all')
  const [showScrollTop, setShowScrollTop] = useState(false)
  const isJapanese = lang === 'ja'
  const copy = text[lang] || text.zh

  const categorizedServices: ToolCategory[] = useMemo(() => [
    {
      category: dict.tools.cat_cyber,
      scene: 'ops',
      tools: [
        { name: dict.tools.diagnostic_title, desc: dict.tools.diagnostic_desc, icon: Activity, status: 'operational', url: '/tools/website-check', scene: 'ops', tags: ['SSL', 'CDN', 'HTTP'], favorite: true, pinned: true, accent: 'emerald' },
        { name: dict.tools.dns_lookup_title || dict.tools.dns.btn, desc: dict.tools.dns_lookup_desc || (isJapanese ? 'DNS レコードと解決状態を確認できます。' : 'Check DNS records and resolution status.'), icon: Search, status: 'operational', url: '/tools/dns-lookup', scene: 'ops', tags: ['A', 'MX', 'TXT'], favorite: true, pinned: true, accent: 'cyan' },
        { name: dict.tools.ip_title, desc: dict.tools.ip_desc, icon: Globe, status: 'operational', url: '/tools/ip-lookup', scene: 'ops', tags: ['ASN', 'ISP', 'Geo'], favorite: true, pinned: true, accent: 'sky' },
        { name: dict.tools.websocket_title, desc: dict.tools.websocket_desc, icon: Zap, status: 'operational', url: '/tools/websocket', scene: 'dev', tags: ['Socket', 'Debug'], favorite: true, pinned: true, accent: 'cyan' },
        { name: dict.tools.json_title, desc: dict.tools.json_desc, icon: Braces, status: 'operational', url: '/tools/json', scene: 'dev', tags: ['Format', 'Validate'], favorite: true, pinned: true, accent: 'violet' },
        { name: dict.tools.passgen_title, desc: dict.tools.passgen_desc, icon: KeyRound, status: 'operational', url: '/tools/passgen', scene: 'security', tags: ['Generate', 'Copy'], favorite: true, pinned: true, accent: 'amber' },
        { name: dict.tools.qrgen_title, desc: dict.tools.qrgen_desc, icon: QrCode, status: 'operational', url: '/tools/qrgen', scene: 'dev', tags: ['Encode', 'Share'], favorite: true, pinned: true, accent: 'zinc' },
        { name: dict.tools.time_title, desc: dict.tools.time_desc, icon: Clock3, status: 'operational', url: '/tools/time', scene: 'dev', tags: ['Unix', 'Timezone'], favorite: true, pinned: true, accent: 'emerald' },
        { name: dict.tools.encode_title, desc: dict.tools.encode_desc, icon: Code2, status: 'operational', url: '/tools/encode', scene: 'dev', tags: ['Base64', 'URL', 'JWT'], favorite: true, pinned: true, accent: 'emerald' },
        { name: dict.tools.matrix_title, desc: dict.tools.matrix_desc, icon: MessageSquare, status: 'operational', url: 'https://matrix.org', scene: 'knowledge', tags: ['chat', 'secure'], favorite: true, external: true, accent: 'emerald' },
      ],
    },
    {
      category: isJapanese ? 'SRE ステータス' : (lang === 'zh' ? 'SRE 状态面板' : lang === 'tw' ? 'SRE 狀態面板' : 'SRE Status'),
      scene: 'ops',
      tools: [
        { name: 'Cloudflare Status', desc: 'Edge, DNS, WAF, Workers status', icon: Shield, status: 'operational', url: 'https://www.cloudflarestatus.com/', scene: 'ops', tags: ['edge', 'status'], favorite: true, pinned: true, external: true, accent: 'orange' },
        { name: 'AWS Health', desc: 'AWS service health and events', icon: Cloud, status: 'operational', url: 'https://health.aws.amazon.com/health/status', scene: 'ops', tags: ['cloud', 'status'], favorite: true, pinned: true, external: true, accent: 'amber' },
        { name: 'GitHub Status', desc: 'GitHub incidents and component health', icon: GitMerge, status: 'operational', url: 'https://www.githubstatus.com/', scene: 'dev', tags: ['git', 'status'], favorite: true, pinned: true, external: true, accent: 'zinc' },
        { name: 'OpenAI Status', desc: 'API, ChatGPT, model platform health', icon: Brain, status: 'operational', url: 'https://status.openai.com/', scene: 'ai', tags: ['ai', 'status'], favorite: true, pinned: true, external: true, accent: 'emerald' },
        { name: 'Cloudflare Radar', desc: 'Internet traffic, outages, attacks', icon: Radar, status: 'operational', url: 'https://radar.cloudflare.com/', scene: 'ops', tags: ['radar', 'traffic'], favorite: true, pinned: true, external: true, accent: 'orange' },
      ],
    },
    {
      category: isJapanese ? 'パスワード管理・認証情報' : (lang === 'zh' ? '密码管理与凭证' : lang === 'tw' ? '密碼管理與憑證' : 'Password Management'),
      scene: 'security',
      tools: [
        { name: '1Password', desc: 'Enterprise Password Manager', icon: KeySquare, status: 'operational', url: 'https://1password.com', scene: 'security', tags: ['password', 'vault'], favorite: true, pinned: true, external: true, accent: 'blue' },
        { name: 'Enpass', desc: 'Offline Password Manager', icon: Vault, status: 'operational', url: 'https://www.enpass.io', scene: 'security', tags: ['offline', 'vault'], external: true, accent: 'orange' },
        { name: 'Bitwarden', desc: 'Open Source Vault', icon: ShieldCheck, status: 'operational', url: 'https://bitwarden.com', scene: 'security', tags: ['vault', 'open-source'], external: true, accent: 'blue' },
      ],
    },
    {
      category: dict.services.cat_monitoring,
      scene: 'ops',
      tools: [
        { name: 'Grafana', desc: 'Metrics & Visualization', icon: BarChart, status: 'operational', url: 'https://grafana.com', scene: 'ops', tags: ['metrics', 'dashboard'], favorite: true, external: true, accent: 'orange' },
        { name: 'Prometheus', desc: 'Time-series Database', icon: Activity, status: 'operational', url: 'https://prometheus.io', scene: 'ops', tags: ['metrics', 'alert'], external: true, accent: 'orange' },
        { name: 'Elasticsearch', desc: 'Log Analytics Engine', icon: Database, status: 'operational', url: 'https://www.elastic.co', scene: 'ops', tags: ['log', 'search'], external: true, accent: 'yellow' },
        { name: 'Zabbix', desc: 'Enterprise Monitoring', icon: MonitorCheck, status: 'operational', url: 'https://www.zabbix.com', scene: 'ops', tags: ['monitoring', 'alert'], external: true, accent: 'red' },
      ],
    },
    {
      category: isJapanese ? 'IT 自動化・IaC' : (lang === 'zh' ? '自动化与配置管理' : lang === 'tw' ? '自動化與配置管理' : 'IT Automation & IaC'),
      scene: 'ops',
      tools: [
        { name: 'Ansible', desc: 'Agentless IT Automation', icon: Wrench, status: 'operational', url: 'https://www.ansible.com', scene: 'ops', tags: ['automation', 'config'], external: true, accent: 'red' },
        { name: 'SaltStack', desc: 'Event-driven Infra', icon: Zap, status: 'operational', url: 'https://saltproject.io', scene: 'ops', tags: ['automation', 'infra'], external: true, accent: 'cyan' },
        { name: 'Terraform', desc: 'Infrastructure as Code', icon: Layers, status: 'operational', url: 'https://www.terraform.io', scene: 'ops', tags: ['iac', 'cloud'], favorite: true, external: true, accent: 'violet' },
      ],
    },
    {
      category: dict.services.cat_infra,
      scene: 'ops',
      tools: [
        { name: 'AWS Console', desc: 'Primary Cloud Provider', icon: Cloud, status: 'operational', url: 'https://aws.amazon.com/console/', scene: 'ops', tags: ['cloud', 'console'], favorite: true, pinned: true, external: true, accent: 'amber' },
        { name: 'Cloudflare', desc: 'Edge Network & WAF', icon: Shield, status: 'operational', url: 'https://dash.cloudflare.com', scene: 'ops', tags: ['edge', 'waf'], favorite: true, pinned: true, external: true, accent: 'orange' },
        { name: 'Kubernetes', desc: 'Container Orchestration', icon: Server, status: 'operational', url: 'https://kubernetes.io', scene: 'ops', tags: ['container', 'cluster'], external: true, accent: 'blue' },
      ],
    },
    {
      category: dict.services.cat_cicd,
      scene: 'dev',
      tools: [
        { name: 'GitHub Actions', desc: 'Automated Workflows', icon: GitMerge, status: 'operational', url: 'https://github.com/features/actions', scene: 'dev', tags: ['ci', 'github'], favorite: true, external: true, accent: 'zinc' },
        { name: 'ArgoCD', desc: 'GitOps Delivery', icon: Workflow, status: 'operational', url: 'https://argoproj.github.io/cd/', scene: 'dev', tags: ['gitops', 'deploy'], external: true, accent: 'red' },
        { name: 'Jenkins', desc: 'Legacy Automation', icon: Terminal, status: 'operational', url: 'https://www.jenkins.io', scene: 'dev', tags: ['ci', 'pipeline'], external: true, accent: 'slate' },
      ],
    },
    {
      category: isJapanese ? 'ゼロトラスト・トンネル' : (lang === 'zh' ? '安全通道与零信任' : lang === 'tw' ? '安全通道與零信任' : 'Zero Trust & Tunnels'),
      scene: 'security',
      tools: [
        { name: 'JumpServer', desc: 'Open Source Bastion Host', icon: DoorOpen, status: 'operational', url: 'https://www.jumpserver.org', scene: 'security', tags: ['bastion', 'access'], external: true, accent: 'emerald' },
        { name: 'Tailscale', desc: 'Mesh VPN Network', icon: Network, status: 'operational', url: 'https://tailscale.com', scene: 'security', tags: ['vpn', 'mesh'], favorite: true, external: true, accent: 'zinc' },
        { name: 'WireGuard', desc: 'Fast & Modern VPN', icon: Lock, status: 'operational', url: 'https://www.wireguard.com', scene: 'security', tags: ['vpn', 'tunnel'], external: true, accent: 'blue' },
        { name: 'Pritunl', desc: 'Enterprise VPN Server', icon: Shield, status: 'operational', url: 'https://pritunl.com', scene: 'security', tags: ['vpn', 'server'], external: true, accent: 'green' },
        { name: 'Proton Mail', desc: 'Encrypted Email Service', icon: Mail, status: 'operational', url: 'https://proton.me/mail', scene: 'security', tags: ['mail', 'privacy'], favorite: true, external: true, accent: 'violet' },
      ],
    },
    {
      category: isJapanese ? 'AI・情報活用' : (lang === 'zh' ? '人工智能体中枢' : lang === 'tw' ? '人工智慧中樞' : 'AI & Intelligence'),
      scene: 'ai',
      tools: [
        { name: 'OpenClaw', desc: 'AI Inference & Bypass', icon: Brain, status: 'operational', url: 'https://openclaw.ai/', scene: 'ai', tags: ['ai', 'inference'], external: true, accent: 'fuchsia' },
        { name: 'OpenAI', desc: 'GPT-4 / O1 Inference', icon: Brain, status: 'operational', url: 'https://chat.openai.com', scene: 'ai', tags: ['ai', 'chat'], favorite: true, pinned: true, external: true, accent: 'emerald' },
        { name: 'Claude', desc: 'Anthropic Opus/Sonnet', icon: MessageSquare, status: 'operational', url: 'https://claude.ai', scene: 'ai', tags: ['ai', 'writing'], favorite: true, pinned: true, external: true, accent: 'orange' },
        { name: 'Gemini3', desc: 'Google Advanced Gemini', icon: Sparkles, status: 'operational', url: 'https://gemini.google.com', scene: 'ai', tags: ['ai', 'google'], favorite: true, external: true, accent: 'blue' },
        { name: 'Grok', desc: 'xAI Unfiltered Model', icon: Rocket, status: 'operational', url: 'https://twitter.com/i/grok', scene: 'ai', tags: ['ai', 'x'], external: true, accent: 'zinc' },
      ],
    },
    {
      category: isJapanese ? '脅威インテリジェンス・偵察' : (lang === 'zh' ? '威胁情报与资产探测' : lang === 'tw' ? '威脅情報與資產探測' : 'Threat Intel & Recon'),
      scene: 'security',
      tools: [
        { name: 'Nmap', desc: 'Network Discovery & Auditing', icon: Search, status: 'operational', url: 'https://nmap.org', scene: 'security', tags: ['scan', 'network'], external: true, accent: 'blue' },
        { name: 'Masscan', desc: 'Mass IP Port Scanner', icon: Crosshair, status: 'operational', url: 'https://github.com/robertdavidgraham/masscan', scene: 'security', tags: ['scan', 'port'], external: true, accent: 'red' },
        { name: 'Shodan', desc: 'IoT Search Engine', icon: Radar, status: 'operational', url: 'https://www.shodan.io', scene: 'security', tags: ['recon', 'iot'], favorite: true, external: true, accent: 'red' },
        { name: 'FOFA', desc: 'Cyber Space Mapping', icon: Scan, status: 'operational', url: 'https://fofa.info', scene: 'security', tags: ['recon', 'asset'], external: true, accent: 'cyan' },
        { name: 'VirusTotal', desc: 'Malware Intelligence', icon: ShieldAlert, status: 'operational', url: 'https://www.virustotal.com', scene: 'security', tags: ['malware', 'intel'], favorite: true, external: true, accent: 'emerald' },
      ],
    },
    {
      category: isJapanese ? 'トラフィック解析・テスト' : (lang === 'zh' ? '渗透拦截与防御抓包' : lang === 'tw' ? '滲透攔截與防禦抓包' : 'Offensive & Traffic'),
      scene: 'security',
      tools: [
        { name: 'Burp Suite', desc: 'Web Vuln Scanner', icon: Crosshair, status: 'operational', url: 'https://portswigger.net/burp', scene: 'security', tags: ['web', 'proxy'], external: true, accent: 'orange' },
        { name: 'Wireshark', desc: 'Packet Capture Analysis', icon: Activity, status: 'operational', url: 'https://www.wireshark.org', scene: 'security', tags: ['packet', 'traffic'], external: true, accent: 'blue' },
        { name: 'Nuclei', desc: 'Fast Vulnerability Scanner', icon: Bug, status: 'operational', url: 'https://github.com/projectdiscovery/nuclei', scene: 'security', tags: ['vuln', 'scan'], external: true, accent: 'violet' },
      ],
    },
    {
      category: isJapanese ? 'クラウド・DevSecOps' : (lang === 'zh' ? '云原生安全与审计' : lang === 'tw' ? '雲原生安全與稽核' : 'Cloud & DevSecOps'),
      scene: 'dev',
      tools: [
        { name: 'Trivy', desc: 'Container Security Scanner', icon: Box, status: 'operational', url: 'https://aquasecurity.github.io/trivy', scene: 'dev', tags: ['container', 'security'], external: true, accent: 'cyan' },
        { name: 'Checkov', desc: 'IaC Security Misconfigs', icon: FileCode, status: 'operational', url: 'https://www.checkov.io', scene: 'dev', tags: ['iac', 'security'], external: true, accent: 'violet' },
        { name: 'Wazuh', desc: 'Open Source XDR & SIEM', icon: Shield, status: 'operational', url: 'https://wazuh.com', scene: 'security', tags: ['siem', 'xdr'], external: true, accent: 'blue' },
      ],
    },
    {
      category: isJapanese ? 'DNS・診断' : (lang === 'zh' ? '网络与域名诊断' : lang === 'tw' ? '網路與網域診斷' : 'DNS & Diagnostics'),
      scene: 'ops',
      tools: [
        { name: 'MXToolBox', desc: 'DNS & Mail Health Check', icon: Mail, status: 'operational', url: 'https://mxtoolbox.com', scene: 'ops', tags: ['dns', 'mail'], favorite: true, external: true, accent: 'red' },
        { name: 'DNSDumpster', desc: 'DNS Topology Mapping', icon: Map, status: 'operational', url: 'https://dnsdumpster.com', scene: 'security', tags: ['dns', 'recon'], external: true, accent: 'green' },
        { name: 'SecurityTrails', desc: 'Historical DNS Records', icon: History, status: 'operational', url: 'https://securitytrails.com', scene: 'security', tags: ['dns', 'history'], external: true, accent: 'blue' },
        { name: 'ViewDNS', desc: 'Reverse IP & Network Utils', icon: Eye, status: 'operational', url: 'https://viewdns.info', scene: 'ops', tags: ['dns', 'reverse'], external: true, accent: 'zinc' },
        { name: 'ICANN Lookup', desc: 'Global WHOIS Registry', icon: Fingerprint, status: 'operational', url: 'https://lookup.icann.org', scene: 'ops', tags: ['whois', 'domain'], external: true, accent: 'slate' },
      ],
    },
    {
      category: isJapanese ? 'ネットワーク調査' : (lang === 'zh' ? '网络取证' : lang === 'tw' ? '網路取證' : 'Network Forensics'),
      scene: 'ops',
      tools: [
        { name: 'SSL Labs', desc: 'Deep TLS certificate and protocol test', icon: Lock, status: 'operational', url: 'https://www.ssllabs.com/ssltest/', scene: 'security', tags: ['tls', 'ssl'], favorite: true, external: true, accent: 'red' },
        { name: 'BGP.Tools', desc: 'ASN, prefix, routing visibility', icon: Network, status: 'operational', url: 'https://bgp.tools/', scene: 'ops', tags: ['bgp', 'asn'], favorite: true, external: true, accent: 'blue' },
        { name: 'RIPEstat', desc: 'IP, ASN, routing and registry data', icon: Globe, status: 'operational', url: 'https://stat.ripe.net/', scene: 'ops', tags: ['ripe', 'asn'], favorite: true, external: true, accent: 'emerald' },
        { name: 'crt.sh', desc: 'Certificate transparency search', icon: Search, status: 'operational', url: 'https://crt.sh/', scene: 'security', tags: ['cert', 'ct'], external: true, accent: 'zinc' },
        { name: 'DNSViz', desc: 'DNSSEC and delegation visualization', icon: Workflow, status: 'operational', url: 'https://dnsviz.net/', scene: 'ops', tags: ['dnssec', 'dns'], external: true, accent: 'cyan' },
      ],
    },
  ], [dict, isJapanese, lang])

  const allTools = useMemo(() => categorizedServices.flatMap((cat) => cat.tools), [categorizedServices])
  const firstPartyTools = useMemo(() => allTools.filter((tool) => tool.url.startsWith('/tools/')), [allTools])
  const primaryTools = useMemo(() => firstPartyTools.slice(0, 3), [firstPartyTools])
  const secondaryTools = useMemo(() => firstPartyTools.slice(3), [firstPartyTools])
  const dailyLaunchers = useMemo(() => allTools.filter((tool) => tool.pinned && !tool.url.startsWith('/tools/')).slice(0, 8), [allTools])

  const filteredServices = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return categorizedServices
      .map((cat) => {
        const matchedTools = cat.tools.filter((tool) => {
          const sceneMatches = activeScene === 'all' || tool.scene === activeScene
          const queryMatches = !query || [
            tool.name,
            tool.desc,
            cat.category,
            copy.scenes[tool.scene],
            ...tool.tags,
          ].some((item) => item.toLowerCase().includes(query))

          return sceneMatches && queryMatches
        })

        return { ...cat, tools: matchedTools }
      })
      .filter((cat) => cat.tools.length > 0)
  }, [activeScene, categorizedServices, copy.scenes, searchTerm])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.getElementById('dashboard-search')?.focus()
      }
    }

    const handleScroll = () => setShowScrollTop(window.scrollY > 480)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <main className="w-full flex-grow text-zinc-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-20 pt-8 sm:px-6 md:pt-10">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl sm:p-7">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  {copy.badge}
                </div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-5xl">
                  {copy.title}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-600">
                  {copy.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 xl:w-[360px]">
                {[
                  { label: copy.scenes.ops, value: categorizedServices.length, icon: MonitorCheck },
                  { label: copy.quick, value: firstPartyTools.length, icon: Star },
                  { label: dict.services.status_operational, value: allTools.length, icon: CheckCircle2 },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.label} className="rounded-2xl border border-zinc-100 bg-zinc-50/80 p-3">
                      <Icon className="mb-3 h-4 w-4 text-emerald-600" />
                      <div className="text-2xl font-black text-zinc-900">{item.value}</div>
                      <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-400">{item.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-7 grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
              <label htmlFor="dashboard-search" className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  id="dashboard-search"
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={copy.search}
                  className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-11 pr-16 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-zinc-400">
                  ⌘K
                </span>
              </label>

              <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
                {(['all', ...sceneOrder] as Array<Scene | 'all'>).map((scene) => {
                  const isActive = activeScene === scene
                  const label = scene === 'all' ? copy.all : copy.scenes[scene]
                  return (
                    <button
                      key={scene}
                      type="button"
                      onClick={() => setActiveScene(scene)}
                      className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                          : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-700'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <section aria-labelledby="quick-launch" className="order-2 rounded-[1.5rem] border border-zinc-100 bg-white/90 p-4 shadow-sm backdrop-blur-md sm:p-5 lg:order-3 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="quick-launch" className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-400">
                {copy.quick}
              </h2>
              <span className="text-xs text-zinc-500">{firstPartyTools.length} / {allTools.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {primaryTools.map((tool) => (
                <ToolLink key={tool.name} tool={tool} openLabel={copy.open} statusLabel={dict.services.status_operational} featured />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
              {secondaryTools.map((tool) => (
                <ToolLink key={tool.name} tool={tool} compact />
              ))}
            </div>
          </section>

          <aside className="order-3 grid gap-4 lg:order-2">
            <Panel title={copy.statusTitle} icon={Activity}>
              <p className="text-sm leading-6 text-zinc-600">{copy.statusCopy}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <StatusPill label="DNS" value={dict.services.status_operational} />
                <StatusPill label="AI" value={dict.services.status_operational} />
                <StatusPill label="Vault" value={dict.services.status_operational} />
                <StatusPill label="Edge" value={dict.services.status_operational} />
              </div>
            </Panel>

            <Panel title={copy.reminders} icon={Command}>
              <ul className="space-y-3 text-sm leading-6 text-zinc-600">
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
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-zinc-200 bg-white/70 text-center">
                <Activity className="mb-4 h-8 w-8 text-zinc-300" />
                <p className="text-sm text-zinc-500">{copy.noResult}</p>
              </div>
            ) : (
              filteredServices.map((cat) => (
                <section key={cat.category} className="scroll-mt-24">
                  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-600">
                        {copy.scenes[cat.scene]}
                      </p>
                      <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-900">{cat.category}</h2>
                    </div>
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-500">
                      {cat.tools.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {cat.tools.map((tool) => (
                      <ToolLink key={`${cat.category}-${tool.name}`} tool={tool} openLabel={copy.open} statusLabel={dict.services.status_operational} />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
            <Panel title={copy.extension} icon={Layers}>
              <p className="text-sm leading-6 text-zinc-600">{copy.extensionCopy}</p>
              <div className="mt-4 space-y-2">
                {[
                  'Live status source',
                  'Recent visits',
                  'Obsidian quick note',
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/70 px-3 py-2 text-xs font-semibold text-zinc-500">
                    {item}
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Scenes" icon={Workflow}>
              <div className="space-y-2">
                {sceneOrder.map((scene) => {
                  const count = allTools.filter((tool) => tool.scene === scene).length
                  return (
                    <button
                      key={scene}
                      type="button"
                      onClick={() => setActiveScene(scene)}
                      className="flex w-full items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2 text-left text-sm text-zinc-700 transition hover:border-emerald-500/30 hover:bg-emerald-50"
                    >
                      <span>{copy.scenes[scene]}</span>
                      <span className="text-xs text-zinc-500">{count}</span>
                    </button>
                  )
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
          className="fixed bottom-6 right-4 z-50 rounded-full border border-zinc-100 bg-white/90 p-3 text-zinc-900 shadow-xl backdrop-blur transition hover:bg-emerald-500 hover:text-white sm:bottom-10 sm:right-10"
          aria-label={isJapanese ? 'ページ上部へ戻る' : 'Scroll to top'}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </main>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: IconType; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.5rem] border border-zinc-100 bg-white/90 p-5 shadow-sm backdrop-blur-md">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-emerald-500/8 text-emerald-600">
          <Icon className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-700">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function StatusPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/8 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">{label}</div>
      <div className="mt-1 text-xs font-semibold text-emerald-700">{value}</div>
    </div>
  )
}

function ToolLink({ tool, compact = false, featured = false, openLabel = 'Open', statusLabel = 'Operational' }: { tool: Tool; compact?: boolean; featured?: boolean; openLabel?: string; statusLabel?: string }) {
  const Icon = tool.icon
  const external = tool.external || getExternal(tool.url)
  const target = external ? '_blank' : undefined
  const rel = external ? 'noreferrer' : undefined

  if (compact) {
    return (
      <Link
        href={tool.url}
        target={target}
        rel={rel}
        className="group flex min-h-28 flex-col justify-between rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-100 bg-emerald-500/8 text-emerald-600">
            <Icon className="h-4 w-4" />
          </div>
          {external && <ExternalLink className="h-3.5 w-3.5 text-zinc-300 transition group-hover:text-emerald-600" />}
        </div>
        <div>
          <h3 className="truncate text-sm font-bold text-zinc-900">{tool.name}</h3>
          <p className="mt-1 truncate text-xs text-zinc-500">{tool.tags.slice(0, 2).join(' / ')}</p>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={tool.url}
      target={target}
      rel={rel}
      className={`group flex flex-col justify-between rounded-[1.25rem] border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-500/30 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-emerald-500/10 ${featured ? 'min-h-[190px] p-5' : 'min-h-[168px] p-4'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex shrink-0 items-center justify-center rounded-2xl border border-zinc-100 bg-zinc-50 text-zinc-700 transition group-hover:border-emerald-500/20 group-hover:bg-emerald-500/8 group-hover:text-emerald-600 ${featured ? 'h-12 w-12' : 'h-11 w-11'}`}>
            <Icon className={featured ? 'h-6 w-6' : 'h-5 w-5'} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-zinc-900">{tool.name}</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{tool.desc}</p>
          </div>
        </div>
        {external && <ExternalLink className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-emerald-600" />}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {tool.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full border border-zinc-100 bg-zinc-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
              {tag}
            </span>
          ))}
        </div>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {tool.status === 'operational' ? statusLabel : openLabel}
        </span>
      </div>
    </Link>
  )
}

function DailyLauncherLink({ tool }: { tool: Tool }) {
  const Icon = tool.icon
  const external = tool.external || getExternal(tool.url)

  return (
    <Link
      href={tool.url}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-emerald-50 focus:outline-none focus:ring-4 focus:ring-emerald-500/10"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-100 bg-zinc-50 text-zinc-600 transition group-hover:border-emerald-500/20 group-hover:bg-white group-hover:text-emerald-600">
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-zinc-800">{tool.name}</span>
          <span className="block truncate text-xs text-zinc-500">{tool.tags.slice(0, 2).join(' / ')}</span>
        </span>
      </span>
      {external && <ExternalLink className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition group-hover:text-emerald-600" />}
    </Link>
  )
}
