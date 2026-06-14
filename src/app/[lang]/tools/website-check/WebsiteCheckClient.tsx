'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Globe, 
  Zap, 
  Activity, 
  AlertCircle,
  ShieldCheck,
  Server,
  Cloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronDown,
  Info,
  ExternalLink,
  ShieldAlert,
  Search,
  Copy,
  Check,
  Cpu,
  Monitor,
  Lock,
  Calendar,
  Database,
  HelpCircle,
  LayoutGrid,
  Download,
  Star,
  Trash2,
  Link2,
  FileText,
  History
} from 'lucide-react'
import { TrackedLink } from '@/components/TrackedLink'
import { useAdminSession } from '@/components/AdminSessionProvider'

import { useDiagnosticHistory } from './_hooks/useDiagnosticHistory'
import { useWebsiteCheck } from './_hooks/useWebsiteCheck'
import { calculateScore, isBlockedHttpStatus, normalizeTargetInput, BatchDiagnosticResult, createSafeDiagnosticResult } from './_hooks/helpers'

export default function WebsiteCheckClient({ dict, lang }: { dict: any; lang: 'zh' | 'en' | 'ja' | 'tw' }) {
  const isAsianLanguage = lang !== 'en'
  const searchParams = useSearchParams()
  const { authenticated } = useAdminSession()
  const { history, upsertHistory, deleteHistory, togglePin } = useDiagnosticHistory()
  const { domain, setDomain, loading, currentStep, result, setResult, error, localResolvers, runDiagnostic } = useWebsiteCheck()
  const [showJson, setShowJson] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedAction, setCopiedAction] = useState<string | null>(null)
  const [showGradeInfo, setShowGradeInfo] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [batchInput, setBatchInput] = useState('')
  const [batchLoading, setBatchLoading] = useState(false)
  const [batchResults, setBatchResults] = useState<BatchDiagnosticResult[]>([])

  const localeText = useMemo(() => {
    switch (lang) {
      case 'ja':
        return {
          heroBadge: 'サイト診断',
          heroTitles: {
            visitor: '接続環境の確認',
            ip: 'IP 診断',
            site: 'サイト診断',
          },
          heroSubtitle: 'DNS・SSL・CDN・HTTP をまとめて診断します。',
          heroModeLabel: 'SRE 向け統合診断',
          analyzing: '診断中',
          errorTitle: '診断エラー',
          fault: {
            likelyCause: '想定原因',
            evidence: '根拠',
            nextAction: '次の対応',
            retry: '再診断',
            copy: '障害要約をコピー',
            dnsTitle: 'DNS 解決エラー',
            dnsCause: 'NS または A/AAAA レコードが正しく解決できていない可能性があります。',
            timeoutTitle: '接続タイムアウト',
            timeoutCause: 'オリジン、Firewall、CDN 経路のどこかで応答が止まっている可能性があります。',
            cloudflareTitle: 'Cloudflare / Origin エラー',
            cloudflareCause: 'Cloudflare からオリジンへ到達できていない、または Origin DNS が不正な可能性があります。',
            sslTitle: 'SSL / TLS エラー',
            sslCause: '証明書、SNI、証明書チェーン、TLS 設定に問題がある可能性があります。',
            genericTitle: '到達性エラー',
            genericCause: 'ネットワーク、オリジン、HTTP 設定のいずれかで診断が失敗しました。',
          },
          loading: {
            title: '診断フロー',
            headline: '進行中',
            desc: '対象を整理し、DNS・HTTP・SSL・CDN を並行で確認しています。',
            progress: '進行状況',
            current: '現在の工程',
            stages: [
              { id: 'normalize', title: '01 対象を整理', desc: 'ドメインや URL を正規化しています。' },
              { id: 'probe', title: '02 並行診断', desc: 'DNS・HTTP・SSL・CDN を同時に確認しています。' },
              { id: 'summarize', title: '03 結果を整形', desc: '要点をまとめ、見やすく表示します。' },
            ],
          },
          summaryScore: '総合スコア',
          summaryVerdict: '判定',
          detailsHint: '詳細は必要なときだけ展開できます',
          detailsOpen: '詳細を表示',
          detailsClose: '詳細を閉じる',
          geo: {
            step: '00',
            title: '地理確認',
            country: '国・地域',
            city: '都市・ノード',
            asn: 'AS 番号',
            isp: '回線事業者',
          },
          whois: {
            step: '01',
            title: 'WHOIS / 登録情報',
            diagException: '診断例外',
            noInfo: '情報なし',
            registrar: 'Registrar',
            registered: '登録日',
            allocated: '割り当て日',
            networkClass: '回線区分',
            expiry: '有効期限',
            status: '登録状態',
            privateIp: 'プライベート IPv4',
            publicIp: 'パブリック IPv4',
            assetTitle: '資産確認',
            assetCountSuffix: '件',
          },
          dns: {
            step: '02',
            title: 'DNS 解決',
            resolved: '解決済み IP',
            latency: '応答時間',
            nameservers: 'ネームサーバー',
            unknown: '不明',
            restricted: '制限あり',
            recordOverview: 'DNS レコード全覧',
            noRecords: '該当レコードなし',
            recordNotes: {
              A: 'IPv4 の到達先です。',
              AAAA: 'IPv6 の到達先です。',
              CNAME: '別名転送。チェーンが長いと遅延要因になります。',
              MX: 'メール配送用。Web 表示には直接影響しません。',
              TXT: 'SPF/DKIM や所有権確認で使われます。',
              CAA: '証明書を発行できる CA を制限します。',
              SOA: 'DNS ゾーンの権威情報です。',
            },
          },
          http: {
            step: '03',
            title: 'HTTP 応答',
            availability: '到達性',
            status: 'ステータス',
            protocol: 'プロトコル',
            responseTime: '応答速度',
            success: '正常',
            failure: '到達不可',
            redirects: 'リダイレクトチェーン',
            finalUrl: '最終 URL',
            noRedirects: 'リダイレクトなし',
            redirectHint: 'HTTP から HTTPS、www 有無、ループを確認できます。',
            redirectWarning: '注意',
          },
          security: {
            step: '04',
            title: 'Security Headers',
            score: 'Header Score',
            passed: '有効な項目',
            missing: '不足',
            recommendation: '推奨',
          },
          ssl: {
            step: '05',
            title: 'SSL セキュリティ',
            certStatus: '証明書状態',
            expiry: '有効期限',
            grade: 'SSL セキュリティ評価',
            grading: '評価基準',
            hsts: 'HSTS 有効化',
            cipher: '暗号スイート',
            chain: '証明書チェーン',
            chainUnavailable: 'チェーン情報なし',
          },
          cdn: {
            step: '06',
            title: 'CDN',
            provider: '提供元インフラ',
            edge: 'エッジ経由',
            header: 'サーバーヘッダー',
            proxied: '経由あり',
            direct: '直接',
          },
          advice: {
            title: '確認ポイント',
            subtitle: '今見るべき項目を、優先度順に整理しています。',
            itemLabel: '要対応項目',
            noneTitle: '問題のない構成です',
            noneDesc: '今すぐ対応が必要な項目はありません。',
            nextTitle: '次の確認候補',
            ip: 'IP を詳しく見る',
            dns: 'DNS レコードを確認',
            json: '生の診断 JSON',
          },
          copy: {
            copied: 'コピー完了',
            copy: 'コピー',
          },
          actions: {
            copySummary: '要約をコピー',
            copyJson: 'JSON をコピー',
            copyMarkdown: 'Markdown をコピー',
            exportJson: 'JSON 保存',
            exportMarkdown: 'Markdown 保存',
            share: '共有リンク',
            shareCopied: 'リンクコピー済み',
            favorite: '固定',
            unfavorite: '固定解除',
            history: '履歴 / 固定',
            noHistory: 'まだ履歴はありません',
            remove: '削除',
          },
          report: {
            keyFindings: '重要な所見',
            nextSteps: '次の対応',
            ok: '正常',
            warning: '注意',
            error: '要対応',
            noIssues: '重大な問題は見つかりませんでした。',
            dnsOk: 'DNS は応答しています。',
            dnsBad: 'DNS 解決に失敗しています。NS と A/AAAA レコードを確認してください。',
            httpOk: 'HTTP は到達可能です。',
            httpBad: 'HTTP 到達性に問題があります。源站、Firewall、CDN 設定を確認してください。',
            sslOk: 'SSL 証明書は有効です。',
            sslBad: 'SSL 証明書またはチェーンに問題があります。',
            headersOk: '主要なセキュリティヘッダーは揃っています。',
            headersBad: '不足しているセキュリティヘッダーがあります。',
            cdnOk: 'CDN/Edge 経由で配信されています。',
            cdnBad: 'CDN が検出されません。必要に応じて Edge 配信を検討してください。',
          },
          batch: {
            title: '一括診断',
            placeholder: 'example.com\napi.example.com\n1.1.1.1',
            run: '一括診断',
            running: '一括診断中',
            copy: '表をコピー',
            export: 'CSV 保存',
            target: '対象',
            http: 'HTTP',
            dns: 'DNS',
            ssl: 'SSL',
            latency: '応答',
            issue: '確認点',
            empty: '最大 10 件まで改行・カンマ・スペース区切りで診断できます。',
          },
          meta: {
            checkedAt: '確認時刻',
            totalMs: '完全診断',
            coreMs: 'コア診断',
            cacheAge: 'キャッシュ経過',
            edgeColo: 'Edge',
            cache: 'Cache',
          },
          emptyHint: 'Global Edge Probe • DNS 診断 • SSL 連鎖 • HTTP ヘッダー確認',
        }
      case 'zh':
        return {
          heroBadge: '网站诊断',
          heroTitles: {
            visitor: '连接环境检查',
            ip: 'IP 诊断',
            site: '网站诊断',
          },
          heroSubtitle: '将 DNS · SSL · CDN · HTTP 一次看清。',
          heroModeLabel: '面向 SRE 的统一诊断',
          analyzing: '诊断中',
          errorTitle: '诊断错误',
          fault: {
            likelyCause: '可能原因',
            evidence: '证据',
            nextAction: '下一步动作',
            retry: '重新检测',
            copy: '复制故障摘要',
            dnsTitle: 'DNS 解析异常',
            dnsCause: 'NS 或 A/AAAA 记录可能未正确解析。',
            timeoutTitle: '连接超时',
            timeoutCause: '源站、防火墙或 CDN 链路中可能存在响应阻塞。',
            cloudflareTitle: 'Cloudflare / 源站异常',
            cloudflareCause: 'Cloudflare 可能无法访问源站，或 Origin DNS 配置异常。',
            sslTitle: 'SSL / TLS 异常',
            sslCause: '证书、SNI、证书链或 TLS 配置可能存在问题。',
            genericTitle: '可达性异常',
            genericCause: '网络、源站或 HTTP 配置导致诊断失败。',
          },
          loading: {
            title: '诊断流程',
            headline: '进行中',
            desc: '正在整理目标，并行检查 DNS、HTTP、SSL 与 CDN。',
            progress: '进度',
            current: '当前阶段',
            stages: [
              { id: 'normalize', title: '01 整理目标', desc: '正在规范域名或 URL。' },
              { id: 'probe', title: '02 并行诊断', desc: 'DNS、HTTP、SSL、CDN 同时检查。' },
              { id: 'summarize', title: '03 汇总结果', desc: '提炼要点并整理成可读视图。' },
            ],
          },
          summaryScore: '总体评分',
          summaryVerdict: '判定',
          detailsHint: '仅在需要时展开详情',
          detailsOpen: '显示详情',
          detailsClose: '收起详情',
          geo: {
            step: '00',
            title: '地理确认',
            country: '国家 / 地区',
            city: '城市 / 节点',
            asn: 'AS 编号',
            isp: '运营商',
          },
          whois: {
            step: '01',
            title: 'WHOIS / 注册信息',
            diagException: '诊断异常',
            noInfo: '无信息',
            registrar: '注册商',
            registered: '注册日期',
            allocated: '分配日期',
            networkClass: '线路类型',
            expiry: '有效期限',
            status: '注册状态',
            privateIp: '私有 IPv4',
            publicIp: '公有 IPv4',
            assetTitle: '资产清单',
            assetCountSuffix: '项',
          },
          dns: {
            step: '02',
            title: 'DNS 解析',
            resolved: '已解析 IP',
            latency: '响应时间',
            nameservers: '名称服务器',
            unknown: '未知',
            restricted: '受限',
            recordOverview: 'DNS 记录全览',
            noRecords: '暂无记录',
            recordNotes: {
              A: 'IPv4 访问入口。',
              AAAA: 'IPv6 访问入口。',
              CNAME: '别名跳转，链路过长可能增加解析耗时。',
              MX: '邮件投递使用，不直接影响网站访问。',
              TXT: '常用于 SPF/DKIM 或站点所有权验证。',
              CAA: '限制哪些 CA 可以签发证书。',
              SOA: 'DNS Zone 的权威信息。',
            },
          },
          http: {
            step: '03',
            title: 'HTTP 响应',
            availability: '可达性',
            status: '状态码',
            protocol: '协议',
            responseTime: '响应速度',
            success: '正常',
            failure: '不可达',
            redirects: '重定向链',
            finalUrl: '最终 URL',
            noRedirects: '无重定向',
            redirectHint: '用于检查 HTTP 到 HTTPS、www 规范化与循环跳转。',
            redirectWarning: '注意',
          },
          security: {
            step: '04',
            title: '安全响应头',
            score: '响应头评分',
            passed: '已启用',
            missing: '缺失项',
            recommendation: '建议',
          },
          ssl: {
            step: '05',
            title: 'SSL 安全',
            certStatus: '证书状态',
            expiry: '有效期限',
            grade: 'SSL 安全评级',
            grading: '评级标准',
            hsts: 'HSTS 启用',
            cipher: '加密套件',
            chain: '证书链',
            chainUnavailable: '无链信息',
          },
          cdn: {
            step: '06',
            title: 'CDN',
            provider: '提供商基础设施',
            edge: '边缘转发',
            header: '服务器头',
            proxied: '经由',
            direct: '直连',
          },
          advice: {
            title: '确认重点',
            subtitle: '按优先级整理当前最值得关注的项目。',
            itemLabel: '待处理项',
            noneTitle: '当前配置没有明显问题',
            noneDesc: '暂无需要立即处理的项目。',
            nextTitle: '下一步检查',
            ip: '查看 IP 详情',
            dns: '查看 DNS 记录',
            json: '原始诊断 JSON',
          },
          copy: {
            copied: '已复制',
            copy: '复制',
          },
          actions: {
            copySummary: '复制摘要',
            copyJson: '复制 JSON',
            copyMarkdown: '复制 Markdown',
            exportJson: '导出 JSON',
            exportMarkdown: '导出 Markdown',
            share: '分享链接',
            shareCopied: '链接已复制',
            favorite: '收藏',
            unfavorite: '取消收藏',
            history: '历史 / 收藏',
            noHistory: '暂无历史记录',
            remove: '删除',
          },
          report: {
            keyFindings: '关键发现',
            nextSteps: '下一步建议',
            ok: '正常',
            warning: '警告',
            error: '异常',
            noIssues: '未发现明显高优先级问题。',
            dnsOk: 'DNS 已正常响应。',
            dnsBad: 'DNS 解析失败，请检查 NS 与 A/AAAA 记录。',
            httpOk: 'HTTP 可正常访问。',
            httpBad: 'HTTP 可达性异常，请检查源站、防火墙或 CDN 配置。',
            sslOk: 'SSL 证书有效。',
            sslBad: 'SSL 证书或证书链存在问题。',
            headersOk: '关键安全响应头已启用。',
            headersBad: '存在缺失的安全响应头。',
            cdnOk: '检测到 CDN / Edge 分发。',
            cdnBad: '未检测到 CDN，如需降低延迟可考虑启用边缘分发。',
          },
          batch: {
            title: '批量诊断',
            placeholder: 'example.com\napi.example.com\n1.1.1.1',
            run: '批量检测',
            running: '批量检测中',
            copy: '复制表格',
            export: '导出 CSV',
            target: '目标',
            http: 'HTTP',
            dns: 'DNS',
            ssl: 'SSL',
            latency: '响应',
            issue: '检查点',
            empty: '最多 10 个目标，支持换行、逗号或空格分隔。',
          },
          meta: {
            checkedAt: '检查时间',
            totalMs: '完整检测',
            coreMs: '核心探测',
            cacheAge: '缓存时间',
            edgeColo: 'Edge',
            cache: '缓存',
          },
          emptyHint: 'Global Edge Probe • DNS 诊断 • SSL 链路 • HTTP 头部分析',
        }
      case 'tw':
        return {
          heroBadge: '網站診斷',
          heroTitles: {
            visitor: '連線環境檢查',
            ip: 'IP 診斷',
            site: '網站診斷',
          },
          heroSubtitle: '將 DNS · SSL · CDN · HTTP 一次看清。',
          heroModeLabel: '面向 SRE 的統一診斷',
          analyzing: '診斷中',
          errorTitle: '診斷錯誤',
          fault: {
            likelyCause: '可能原因',
            evidence: '證據',
            nextAction: '下一步動作',
            retry: '重新檢測',
            copy: '複製故障摘要',
            dnsTitle: 'DNS 解析異常',
            dnsCause: 'NS 或 A/AAAA 記錄可能未正確解析。',
            timeoutTitle: '連線逾時',
            timeoutCause: '源站、防火牆或 CDN 鏈路中可能存在回應阻塞。',
            cloudflareTitle: 'Cloudflare / 源站異常',
            cloudflareCause: 'Cloudflare 可能無法訪問源站，或 Origin DNS 設定異常。',
            sslTitle: 'SSL / TLS 異常',
            sslCause: '憑證、SNI、憑證鏈或 TLS 設定可能存在問題。',
            genericTitle: '可達性異常',
            genericCause: '網路、源站或 HTTP 設定導致診斷失敗。',
          },
          loading: {
            title: '診斷流程',
            headline: '進行中',
            desc: '正在整理目標，並行檢查 DNS、HTTP、SSL 與 CDN。',
            progress: '進度',
            current: '目前階段',
            stages: [
              { id: 'normalize', title: '01 整理目標', desc: '正在正規化網域或 URL。' },
              { id: 'probe', title: '02 並行診斷', desc: 'DNS、HTTP、SSL、CDN 同時檢查。' },
              { id: 'summarize', title: '03 彙整結果', desc: '提煉重點並整理成可讀視圖。' },
            ],
          },
          summaryScore: '總體評分',
          summaryVerdict: '判定',
          detailsHint: '僅在需要時展開詳情',
          detailsOpen: '顯示詳情',
          detailsClose: '收起詳情',
          geo: {
            step: '00',
            title: '地理確認',
            country: '國家 / 地區',
            city: '城市 / 節點',
            asn: 'AS 編號',
            isp: '電信商',
          },
          whois: {
            step: '01',
            title: 'WHOIS / 註冊資訊',
            diagException: '診斷異常',
            noInfo: '無資訊',
            registrar: '註冊商',
            registered: '註冊日期',
            allocated: '分配日期',
            networkClass: '線路類型',
            expiry: '有效期限',
            status: '註冊狀態',
            privateIp: '私有 IPv4',
            publicIp: '公有 IPv4',
            assetTitle: '資產清單',
            assetCountSuffix: '項',
          },
          dns: {
            step: '02',
            title: 'DNS 解析',
            resolved: '已解析 IP',
            latency: '回應時間',
            nameservers: '名稱伺服器',
            unknown: '未知',
            restricted: '受限',
            recordOverview: 'DNS 記錄全覽',
            noRecords: '暫無記錄',
            recordNotes: {
              A: 'IPv4 訪問入口。',
              AAAA: 'IPv6 訪問入口。',
              CNAME: '別名跳轉，鏈路過長可能增加解析耗時。',
              MX: '郵件投遞使用，不直接影響網站訪問。',
              TXT: '常用於 SPF/DKIM 或站點所有權驗證。',
              CAA: '限制哪些 CA 可以簽發憑證。',
              SOA: 'DNS Zone 的權威資訊。',
            },
          },
          http: {
            step: '03',
            title: 'HTTP 回應',
            availability: '可達性',
            status: '狀態碼',
            protocol: '協定',
            responseTime: '回應速度',
            success: '正常',
            failure: '無法連線',
            redirects: '重定向鏈',
            finalUrl: '最終 URL',
            noRedirects: '無重定向',
            redirectHint: '用於檢查 HTTP 到 HTTPS、www 正規化與循環跳轉。',
            redirectWarning: '注意',
          },
          security: {
            step: '04',
            title: '安全回應標頭',
            score: '標頭評分',
            passed: '已啟用',
            missing: '缺失項',
            recommendation: '建議',
          },
          ssl: {
            step: '05',
            title: 'SSL 安全',
            certStatus: '憑證狀態',
            expiry: '有效期限',
            grade: 'SSL 安全評級',
            grading: '評級標準',
            hsts: 'HSTS 啟用',
            cipher: '加密套件',
            chain: '憑證鏈',
            chainUnavailable: '無鏈資訊',
          },
          cdn: {
            step: '06',
            title: 'CDN',
            provider: '提供商基礎設施',
            edge: '邊緣轉發',
            header: '伺服器標頭',
            proxied: '經由',
            direct: '直連',
          },
          advice: {
            title: '確認重點',
            subtitle: '按優先級整理目前最值得關注的項目。',
            itemLabel: '待處理項',
            noneTitle: '目前設定沒有明顯問題',
            noneDesc: '暫無需要立即處理的項目。',
            nextTitle: '下一步檢查',
            ip: '查看 IP 詳情',
            dns: '查看 DNS 記錄',
            json: '原始診斷 JSON',
          },
          copy: {
            copied: '已複製',
            copy: '複製',
          },
          actions: {
            copySummary: '複製摘要',
            copyJson: '複製 JSON',
            copyMarkdown: '複製 Markdown',
            exportJson: '匯出 JSON',
            exportMarkdown: '匯出 Markdown',
            share: '分享連結',
            shareCopied: '連結已複製',
            favorite: '收藏',
            unfavorite: '取消收藏',
            history: '歷史 / 收藏',
            noHistory: '暫無歷史紀錄',
            remove: '刪除',
          },
          report: {
            keyFindings: '關鍵發現',
            nextSteps: '下一步建議',
            ok: '正常',
            warning: '警告',
            error: '異常',
            noIssues: '未發現明顯高優先級問題。',
            dnsOk: 'DNS 已正常回應。',
            dnsBad: 'DNS 解析失敗，請檢查 NS 與 A/AAAA 記錄。',
            httpOk: 'HTTP 可正常訪問。',
            httpBad: 'HTTP 可達性異常，請檢查源站、防火牆或 CDN 設定。',
            sslOk: 'SSL 憑證有效。',
            sslBad: 'SSL 憑證或憑證鏈存在問題。',
            headersOk: '關鍵安全回應標頭已啟用。',
            headersBad: '存在缺失的安全回應標頭。',
            cdnOk: '檢測到 CDN / Edge 分發。',
            cdnBad: '未檢測到 CDN，如需降低延遲可考慮啟用邊緣分發。',
          },
          batch: {
            title: '批次診斷',
            placeholder: 'example.com\napi.example.com\n1.1.1.1',
            run: '批次檢測',
            running: '批次檢測中',
            copy: '複製表格',
            export: '匯出 CSV',
            target: '目標',
            http: 'HTTP',
            dns: 'DNS',
            ssl: 'SSL',
            latency: '回應',
            issue: '檢查點',
            empty: '最多 10 個目標，支援換行、逗號或空格分隔。',
          },
          meta: {
            checkedAt: '檢查時間',
            totalMs: '完整檢測',
            coreMs: '核心探測',
            cacheAge: '快取時間',
            edgeColo: 'Edge',
            cache: '快取',
          },
          emptyHint: 'Global Edge Probe • DNS 診斷 • SSL 鏈路 • HTTP 標頭分析',
        }
      default:
        return {
          heroBadge: 'SRE Diagnostic Suite',
          heroTitles: {
            visitor: 'Connection Check',
            ip: 'IP Diagnostics',
            site: 'Site Diagnostics',
          },
          heroSubtitle: 'Instant DNS · SSL · CDN · HTTP forensics.',
          heroModeLabel: 'Unified Diagnostics for SREs',
          analyzing: 'ANALYZING',
          errorTitle: 'SYSTEM_FAULT_DETECTED',
          fault: {
            likelyCause: 'Likely Cause',
            evidence: 'Evidence',
            nextAction: 'Next Action',
            retry: 'Retry Check',
            copy: 'Copy Fault Summary',
            dnsTitle: 'DNS Resolution Fault',
            dnsCause: 'NS or A/AAAA records may not be resolving correctly.',
            timeoutTitle: 'Connection Timeout',
            timeoutCause: 'The origin, firewall, or CDN path may be blocking the response.',
            cloudflareTitle: 'Cloudflare / Origin Fault',
            cloudflareCause: 'Cloudflare may not be able to reach the origin, or Origin DNS is misconfigured.',
            sslTitle: 'SSL / TLS Fault',
            sslCause: 'Certificate, SNI, chain, or TLS settings may be invalid.',
            genericTitle: 'Reachability Fault',
            genericCause: 'Network, origin, or HTTP configuration caused the diagnostic to fail.',
          },
          loading: {
            title: 'Diagnostic Flow',
            headline: 'In Progress',
            desc: 'Normalizing the target and probing in parallel.',
            progress: 'Progress',
            current: 'Current Stage',
            stages: [
              { id: 'normalize', title: '01 Normalizing Target', desc: 'Cleaning the input and resolving the host.' },
              { id: 'probe', title: '02 Parallel Probes', desc: 'DNS, HTTP, SSL, and CDN checks run in parallel.' },
              { id: 'summarize', title: '03 Result Assembly', desc: 'We build a concise audit summary.' },
            ],
          },
          summaryScore: 'Overall Score',
          summaryVerdict: 'Verdict',
          detailsHint: 'Expand details when needed',
          detailsOpen: 'Show Details',
          detailsClose: 'Hide Details',
          geo: {
            step: '00',
            title: 'Environment',
            country: 'Country/Region',
            city: 'City/Node',
            asn: 'AS Number',
            isp: 'ISP Service',
          },
          whois: {
            step: '01',
            title: 'WHOIS Registry',
            diagException: 'Diagnostic Exception',
            noInfo: 'NO_INFO',
            registrar: 'Registrar',
            registered: 'Registered On',
            allocated: 'Allocation date',
            networkClass: 'Network Class',
            expiry: 'Expires On',
            status: 'Registry Status',
            privateIp: 'PRIVATE_IPv4',
            publicIp: 'PUBLIC_IPv4',
            assetTitle: 'Digital Asset Census',
            assetCountSuffix: 'FOUND',
          },
          dns: {
            step: '02',
            title: 'DNS Resolution',
            resolved: 'Resolved IP(s)',
            latency: 'Lookup Latency',
            nameservers: 'Nameservers',
            unknown: 'Unknown',
            restricted: 'CORS_RESTRICTED',
            recordOverview: 'DNS Records',
            noRecords: 'No records found',
            recordNotes: {
              A: 'IPv4 entry points.',
              AAAA: 'IPv6 entry points.',
              CNAME: 'Alias chain. Long chains can add lookup latency.',
              MX: 'Mail routing. It does not directly affect website reachability.',
              TXT: 'Used for SPF/DKIM and ownership verification.',
              CAA: 'Limits which CAs can issue certificates.',
              SOA: 'Authority data for the DNS zone.',
            },
          },
          http: {
            step: '03',
            title: 'Server Response',
            availability: 'Availability',
            status: 'Response Code',
            protocol: 'Protocol',
            responseTime: 'Response Time',
            success: 'NOMINAL',
            failure: 'UNREACHABLE',
            redirects: 'Redirect Chain',
            finalUrl: 'Final URL',
            noRedirects: 'No redirects',
            redirectHint: 'Checks HTTP to HTTPS, www normalization, and redirect loops.',
            redirectWarning: 'Warning',
          },
          security: {
            step: '04',
            title: 'Security Headers',
            score: 'Header Score',
            passed: 'Enabled',
            missing: 'Missing',
            recommendation: 'Recommendation',
          },
          ssl: {
            step: '05',
            title: 'SSL Security',
            certStatus: 'Cert Status',
            expiry: 'Expiry Date',
            grade: 'SSL Security Grade',
            grading: 'Grading Algorithm:',
            hsts: 'HSTS Enforcement',
            cipher: 'Cipher Support',
            chain: 'Trust Chain Audit',
            chainUnavailable: 'Chain_Data_Unavailable',
          },
          cdn: {
            step: '06',
            title: 'Edge CDN',
            provider: 'Provider Infrastructure',
            edge: 'Edge Routing',
            header: 'Server Header',
            proxied: 'PROXIED',
            direct: 'DIRECT',
          },
          advice: {
            title: 'Recommendations',
            subtitle: 'SRE mitigation strategies',
            itemLabel: 'Critical Action Item',
            noneTitle: 'Optimal Configuration Detected',
            noneDesc: 'No immediate mitigation required.',
            nextTitle: 'Next Checks',
            ip: 'Review IP Details',
            dns: 'Check DNS Records',
            json: 'Raw Diagnostic JSON',
          },
          copy: {
            copied: 'COPIED',
            copy: 'COPY_AUDIT',
          },
          actions: {
            copySummary: 'Copy Summary',
            copyJson: 'Copy JSON',
            copyMarkdown: 'Copy Markdown',
            exportJson: 'Export JSON',
            exportMarkdown: 'Export Markdown',
            share: 'Share Link',
            shareCopied: 'Link copied',
            favorite: 'Pin',
            unfavorite: 'Unpin',
            history: 'History / Pins',
            noHistory: 'No recent targets yet',
            remove: 'Remove',
          },
          report: {
            keyFindings: 'Key Findings',
            nextSteps: 'Next Steps',
            ok: 'OK',
            warning: 'Warning',
            error: 'Action Needed',
            noIssues: 'No high-priority issues detected.',
            dnsOk: 'DNS is responding.',
            dnsBad: 'DNS resolution failed. Check NS and A/AAAA records.',
            httpOk: 'HTTP is reachable.',
            httpBad: 'HTTP reachability failed. Check origin, firewall, or CDN settings.',
            sslOk: 'SSL certificate is valid.',
            sslBad: 'SSL certificate or chain has a problem.',
            headersOk: 'Core security headers are enabled.',
            headersBad: 'Some security headers are missing.',
            cdnOk: 'CDN / Edge delivery detected.',
            cdnBad: 'No CDN detected. Consider edge delivery if latency matters.',
          },
          batch: {
            title: 'Batch Check',
            placeholder: 'example.com\napi.example.com\n1.1.1.1',
            run: 'Run Batch',
            running: 'Checking',
            copy: 'Copy Table',
            export: 'Export CSV',
            target: 'Target',
            http: 'HTTP',
            dns: 'DNS',
            ssl: 'SSL',
            latency: 'Latency',
            issue: 'Issue',
            empty: 'Check up to 10 targets separated by new lines, commas, or spaces.',
          },
          meta: {
            checkedAt: 'Checked At',
            totalMs: 'Full Check',
            coreMs: 'Core Probe',
            cacheAge: 'Cache Age',
            edgeColo: 'Edge',
            cache: 'Cache',
          },
          emptyHint: 'Global_Edge_Probe • DNS_Forensics • SSL_Chain • HTTP_Header_Analytics',
        }
    }
  }, [lang])

  const loadingStages = useMemo(() => localeText.loading.stages, [localeText])

  const activeLoadingStage = useMemo(() => {
    const index = Math.min(Math.max(currentStep - 1, 0), loadingStages.length - 1)
    return loadingStages[index] ?? loadingStages[0]
  }, [currentStep, loadingStages])

  const statusCopy = useMemo(() => ({
    zh: {
      blocked: '连接可达，但 HTTP 被拒绝',
      blockedAdvice: '目标拒绝了当前探测请求。若这是你的公网 IP，通常表示没有开放 Web 服务；若这是网站域名，请检查 Cloudflare WAF、Access、Bot Fight Mode、IP 访问规则或源站 Host/SNI 策略。',
      visitorSslNa: '公网 IP 检测不适用 SSL 证书评分。',
      visitorHeadersNa: 'HTTP 被拒绝时无法完整评估安全响应头。',
    },
    tw: {
      blocked: '連線可達，但 HTTP 被拒絕',
      blockedAdvice: '目標拒絕了目前探測請求。若這是你的公網 IP，通常表示沒有開放 Web 服務；若這是網站域名，請檢查 Cloudflare WAF、Access、Bot Fight Mode、IP 存取規則或源站 Host/SNI 策略。',
      visitorSslNa: '公網 IP 檢測不適用 SSL 憑證評分。',
      visitorHeadersNa: 'HTTP 被拒絕時無法完整評估安全回應標頭。',
    },
    en: {
      blocked: 'Reachable, but HTTP is blocked',
      blockedAdvice: 'The target rejected this probe. For a public IP, this usually means no web service is exposed. For a domain, check Cloudflare WAF, Access, Bot Fight Mode, IP rules, or origin Host/SNI policy.',
      visitorSslNa: 'SSL certificate grading is not applicable to a public IP check.',
      visitorHeadersNa: 'Security headers cannot be fully graded while HTTP is blocked.',
    },
    ja: {
      blocked: '到達可能ですが HTTP が拒否されました',
      blockedAdvice: '対象がこの探測リクエストを拒否しました。公開 IP の場合は Web サービス未公開の可能性が高く、ドメインの場合は Cloudflare WAF、Access、Bot Fight Mode、IP ルール、Origin の Host/SNI 設定を確認してください。',
      visitorSslNa: '公開 IP の確認では SSL 証明書スコアは対象外です。',
      visitorHeadersNa: 'HTTP が拒否されているため、セキュリティヘッダーは完全には評価できません。',
    },
  }[lang]), [lang])

  const getResultState = useCallback((data: any) => {
    const blocked = !data?.http?.success && isBlockedHttpStatus(data?.http?.status_code)
    const isIpOrVisitor = Boolean(data?.isVisitor || data?.isActuallyIp)
    const headersScore = data?.securityHeaders?.score ?? 100
    const whoisHold = data?.whois?.status?.toLowerCase().includes('hold')
    const healthy = data?.http?.success && headersScore >= 55 && !whoisHold
    const warning = blocked || (isIpOrVisitor && Number(data?.http?.status_code || 0) >= 400)

    return {
      blocked,
      isIpOrVisitor,
      healthy,
      warning,
      verdict: healthy
        ? dict.tools.website_check.summary_good
        : warning
          ? statusCopy.blocked
          : dict.tools.website_check.summary_bad,
      tone: healthy ? 'emerald' : warning ? 'orange' : 'red',
    }
  }, [dict.tools.website_check.summary_bad, dict.tools.website_check.summary_good, statusCopy])



  const summaryFacts = useMemo(() => {
    if (!result) return []

    const score = calculateScore(result)
    const state = getResultState(result)

    return [
      {
        label: localeText.summaryScore,
        value: score,
        tone: score >= 80 ? 'emerald' : score >= 50 ? 'orange' : 'red',
      },
      {
        label: localeText.summaryVerdict,
        value: state.verdict,
        tone: state.tone,
      },
      {
        label: localeText.dns.title,
        value: result.dns.latency,
        tone: 'zinc',
      },
      {
        label: localeText.http.title,
        value: `${result.http.status_code}`,
        tone: result.http.success ? 'emerald' : state.blocked ? 'orange' : 'red',
      },
      {
        label: localeText.ssl.title,
        value: state.isIpOrVisitor && !result.ssl.valid ? 'N/A' : (result.ssl.grade || 'A'),
        tone: result.ssl.valid ? 'emerald' : state.isIpOrVisitor ? 'zinc' : 'red',
      },
      {
        label: localeText.security.title,
        value: state.blocked ? 'N/A' : (result.securityHeaders?.grade || '—'),
        tone: state.blocked ? 'zinc' : (result.securityHeaders?.score ?? 0) >= 75 ? 'emerald' : (result.securityHeaders?.score ?? 0) >= 55 ? 'orange' : 'red',
      },
      {
        label: localeText.cdn.title,
        value: result.cdn.provider,
        tone: result.cdn.is_provider ? 'emerald' : 'orange',
      },
    ]
  }, [getResultState, localeText, result])



  // Tracks the last run query to avoid infinite loops in useEffect
  const lastProcessedQuery = React.useRef<string | undefined>(null as any)

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('domain') || searchParams.get('target') || undefined
    const normalizedQuery = q ? normalizeTargetInput(q) : undefined

    if (!normalizedQuery) {
      lastProcessedQuery.current = undefined
      return
    }
    
    // Check if we already processed this exact query
    if (normalizedQuery !== lastProcessedQuery.current) {
        lastProcessedQuery.current = normalizedQuery
        setDomain(normalizedQuery)
        runDiagnostic(normalizedQuery)
    }
  }, [searchParams, runDiagnostic])




  const buildMarkdownReport = useCallback(() => {
    if (!result) return
    const score = calculateScore(result)
    const advice = getAdvice(result)
    const findings = buildDiagnosticFindings(result)
    return [
      `# OpsKitPro Diagnostic Report: ${result.domain}`,
      '',
      `- Verdict: ${result.http.success && (result.securityHeaders?.score ?? 100) >= 55 && !result.whois?.status?.toLowerCase().includes('hold') ? dict.tools.website_check.summary_good : dict.tools.website_check.summary_bad}`,
      `- Score: ${score}/100`,
      `- Checked at: ${result.meta?.checkedAt || new Date().toISOString()}`,
      `- Core probe: ${result.meta?.coreMs ? `${result.meta.coreMs}ms` : 'Unknown'}`,
      `- Full check: ${result.meta?.totalMs ? `${result.meta.totalMs}ms` : 'Unknown'}`,
      `- Cache: ${result.meta?.cacheStatus || 'MISS'}${result.meta?.cacheAgeSeconds ? ` (${result.meta.cacheAgeSeconds}s old)` : ''}`,
      `- Cloudflare Edge: ${result.meta?.edgeColo || 'Unknown'}`,
      '',
      '## Key Findings',
      ...findings.map((item) => `- ${item.status.toUpperCase()} ${item.title}: ${item.description}`),
      '',
      '## DNS',
      `- Resolved IP: ${result.dns.resolved_ip}`,
      `- All IPs: ${result.dns.all_ips?.length ? result.dns.all_ips.join(', ') : result.dns.resolved_ip}`,
      `- IPv4: ${result.dns.ipv4?.length ? result.dns.ipv4.join(', ') : 'None'}`,
      `- IPv6: ${result.dns.ipv6?.length ? result.dns.ipv6.join(', ') : 'None'}`,
      `- Dual stack: ${result.dns.dual_stack ? 'Yes' : 'No'}`,
      `- Nameservers: ${result.dns.ns?.length ? result.dns.ns.join(', ') : 'Unknown'}`,
      `- Lookup latency: ${result.dns.latency}`,
      `- CNAME: ${result.dns.records?.CNAME?.length ? result.dns.records.CNAME.join(', ') : 'None'}`,
      `- MX: ${result.dns.records?.MX?.length ? result.dns.records.MX.join(', ') : 'None'}`,
      `- TXT: ${result.dns.records?.TXT?.length ? `${result.dns.records.TXT.length} record(s)` : 'None'}`,
      `- CAA: ${result.dns.records?.CAA?.length ? result.dns.records.CAA.join(', ') : 'None'}`,
      `- SOA: ${result.dns.records?.SOA?.length ? result.dns.records.SOA.join(', ') : 'None'}`,
      ...(result.dns.resolvers || []).map((resolver: any) => `- ${resolver.resolver}: ${resolver.status || 'Unknown'} · ${resolver.latencyMs ?? '—'}ms`),
      '',
      '## HTTP',
      `- Reachable: ${result.http.success ? 'Yes' : 'No'}`,
      `- Status: ${result.http.status_code || 'Error'}`,
      `- Protocol: ${result.http.is_https ? 'HTTPS' : 'HTTP/TCP'}`,
      `- Response time: ${result.http.latency}`,
      `- Final URL: ${result.http.final_url || 'Unknown'}`,
      `- Redirects: ${result.http.redirect_count ?? 0}${result.http.redirect_warning ? ` (${result.http.redirect_warning})` : ''}`,
      ...(result.http.redirect_chain || []).map((hop: any, index: number) => `- Hop ${index + 1}: ${hop.status} ${hop.url}${hop.location ? ` -> ${hop.location}` : ''}`),
      '',
      '## Security Headers',
      `- Grade: ${result.securityHeaders?.grade || 'Unknown'}`,
      `- Score: ${result.securityHeaders?.score ?? 0}/100`,
      `- Enabled: ${result.securityHeaders?.passed ?? 0}/${result.securityHeaders?.total ?? 0}`,
      ...(result.securityHeaders?.checks || []).map((check: any) => `- ${check.present ? 'OK' : 'Missing'} ${check.label}${check.value ? `: ${check.value}` : ''}`),
      '',
      '## SSL',
      `- Valid: ${result.ssl.valid ? 'Yes' : 'No'}`,
      `- Grade: ${result.ssl.grade || 'Unknown'}`,
      `- Expiry: ${result.ssl.expiry}`,
      `- Issuer: ${result.ssl.issuer}`,
      '',
      '## CDN',
      `- Provider: ${result.cdn.provider}`,
      `- Server: ${result.cdn.server}`,
      '',
      '## Recommendations',
      ...advice.map((item) => `- ${item}`),
    ].join('\n')
  }, [dict.tools.website_check.summary_bad, dict.tools.website_check.summary_good, result])

  const buildDiagnosticFindings = (data: any) => {
    const missingHeaders = data.securityHeaders?.checks?.filter((check: any) => !check.present) || []
    const state = getResultState(data)
    const findings = [
      {
        key: 'dns',
        title: localeText.dns.title,
        status: data.dns.success ? 'ok' : 'error',
        description: data.dns.success ? localeText.report.dnsOk : localeText.report.dnsBad,
      },
      {
        key: 'http',
        title: localeText.http.title,
        status: data.http.success ? 'ok' : state.blocked ? 'warning' : 'error',
        description: data.http.success
          ? `${localeText.report.httpOk} HTTP ${data.http.status_code || 'ERR'} · ${data.http.latency}`
          : state.blocked
            ? `${statusCopy.blocked} · HTTP ${data.http.status_code || 'ERR'} · ${data.http.latency}`
            : localeText.report.httpBad,
      },
      {
        key: 'ssl',
        title: localeText.ssl.title,
        status: data.ssl.valid ? 'ok' : state.isIpOrVisitor ? 'warning' : 'error',
        description: data.ssl.valid
          ? `${localeText.report.sslOk} ${data.ssl.grade || 'OK'} · ${data.ssl.expiry}`
          : state.isIpOrVisitor
            ? statusCopy.visitorSslNa
            : localeText.report.sslBad,
      },
      {
        key: 'headers',
        title: localeText.security.title,
        status: state.blocked ? 'warning' : (data.securityHeaders?.score ?? 0) >= 75 ? 'ok' : (data.securityHeaders?.score ?? 0) >= 55 ? 'warning' : 'error',
        description: state.blocked
          ? statusCopy.visitorHeadersNa
          : missingHeaders.length
          ? `${localeText.report.headersBad} ${missingHeaders.map((check: any) => check.label).join(' / ')}`
          : localeText.report.headersOk,
      },
      {
        key: 'cdn',
        title: localeText.cdn.title,
        status: data.cdn.is_provider || state.isIpOrVisitor ? 'ok' : 'warning',
        description: data.cdn.is_provider ? `${localeText.report.cdnOk} ${data.cdn.provider}` : localeText.report.cdnBad,
      },
    ]

    return findings
  }

  const buildTicketSummarySections = (data: any, findings: ReturnType<typeof buildDiagnosticFindings>, advice: string[]) => {
    const criticalFindings = findings.filter((item) => item.status === 'error')
    const warningFindings = findings.filter((item) => item.status === 'warning')
    const missingHeaders = data.securityHeaders?.checks?.filter((check: any) => !check.present) || []
    const redirectCount = data.http.redirect_count ?? 0
    const state = getResultState(data)

    const impact = criticalFindings.length > 0
      ? 'User-facing availability or trust may be affected.'
      : warningFindings.length > 0
      ? 'Service is reachable, but configuration risk or performance drift exists.'
      : 'No immediate user impact detected.'

    let suspectedCause = 'No obvious fault. Continue normal monitoring.'
    if (!data.dns.success) {
      suspectedCause = 'DNS resolution failure or missing A/AAAA records.'
    } else if (state.blocked) {
      suspectedCause = data.isVisitor || data.isActuallyIp
        ? 'The public IP is reachable, but HTTP access is blocked or no web service is exposed.'
        : `HTTP access is blocked${data.http.status_code ? `, status ${data.http.status_code}` : ''}; check WAF, Access, bot rules, or origin policy.`
    } else if (!data.http.success) {
      suspectedCause = `HTTP reachability issue${data.http.status_code ? `, status ${data.http.status_code}` : ''}.`
    } else if (data.http.redirect_warning) {
      suspectedCause = data.http.redirect_warning
    } else if (!data.ssl.valid) {
      suspectedCause = 'Invalid, expired, or incomplete SSL certificate chain.'
    } else if (missingHeaders.length > 0) {
      suspectedCause = `Security header hardening gap: ${missingHeaders.map((check: any) => check.label).join(', ')}.`
    } else if (!data.cdn.is_provider) {
      suspectedCause = 'Direct origin delivery; CDN/Edge layer not detected.'
    }

    const evidence = [
      `DNS: ${data.dns.success ? 'OK' : 'FAIL'} · ${data.dns.latency} · ${data.dns.resolved_ip}`,
      `DNS Records: A ${data.dns.records?.A?.length || 0}, AAAA ${data.dns.records?.AAAA?.length || 0}, CNAME ${data.dns.records?.CNAME?.length || 0}, MX ${data.dns.records?.MX?.length || 0}, TXT ${data.dns.records?.TXT?.length || 0}, CAA ${data.dns.records?.CAA?.length || 0}`,
      `HTTP: ${data.http.success ? 'OK' : state.blocked ? 'BLOCKED' : 'FAIL'} · ${data.http.status_code || 'ERR'} · ${data.http.latency}`,
      `Redirects: ${redirectCount} · final ${data.http.final_url || 'Unknown'}`,
      `SSL: ${data.ssl.valid ? 'OK' : 'FAIL'} · ${data.ssl.grade || 'Unknown'} · expires ${data.ssl.expiry}`,
      `Security Headers: ${data.securityHeaders?.passed ?? 0}/${data.securityHeaders?.total ?? 0} · ${data.securityHeaders?.grade || 'Unknown'}`,
      `CDN: ${data.cdn.is_provider ? data.cdn.provider : 'Not detected'} · server ${data.cdn.server || 'Unknown'}`,
    ]

    return {
      impact,
      suspectedCause,
      evidence,
      nextAction: advice.length ? advice : [localeText.report.noIssues],
    }
  }

  const buildFaultGuide = useCallback((message: string, data?: any) => {
    const normalized = `${message || ''} ${data?.http?.status_code || ''}`.toLowerCase()
    const faultCopy = localeText.fault
    let title = faultCopy.genericTitle
    let cause = faultCopy.genericCause

    if (/nxdomain|enotfound|dns|name_not_resolved/.test(normalized) || data?.dns?.success === false) {
      title = faultCopy.dnsTitle
      cause = faultCopy.dnsCause
    } else if (/530|origin dns|cloudflare/.test(normalized) || data?.http?.status_code === 530) {
      title = faultCopy.cloudflareTitle
      cause = faultCopy.cloudflareCause
    } else if (/ssl|tls|cert|certificate|handshake/.test(normalized)) {
      title = faultCopy.sslTitle
      cause = faultCopy.sslCause
    } else if (/timeout|abort|aborted|timed out|fetch failed|network/.test(normalized)) {
      title = faultCopy.timeoutTitle
      cause = faultCopy.timeoutCause
    }

    const evidence = [
      `Target: ${data?.domain || result?.domain || domain || 'opskitpro.com'}`,
      `Error: ${message || data?.error || 'Unknown error'}`,
      data?.dns?.latency ? `DNS latency: ${data.dns.latency}` : '',
      data?.dns?.resolved_ip ? `Resolved IP: ${data.dns.resolved_ip}` : '',
      data?.http?.status_code ? `HTTP status: ${data.http.status_code}` : '',
      data?.meta?.checkedAt ? `Checked at: ${data.meta.checkedAt}` : '',
    ].filter(Boolean)

    const nextAction = getAdvice(data || {
      http: { success: false, status_code: 0 },
      ssl: { valid: true, factors: [] },
      securityHeaders: { score: 100, checks: [] },
      cdn: { is_provider: true },
    }).slice(0, 3)

    return { title, cause, evidence, nextAction }
  }, [domain, localeText.fault, result])

  const buildPlainSummary = useCallback(() => {
    if (!result) return ''
    const score = calculateScore(result)
    const verdict = getResultState(result).verdict
    const findings = buildDiagnosticFindings(result)
    const advice = getAdvice(result)
    const ticket = buildTicketSummarySections(result, findings, advice)
    const notableFindings = findings
      .filter((item) => item.status !== 'ok')
      .map((item) => `- ${item.title}: ${item.description}`)

    return [
      `OpsKitPro Website Check: ${result.domain}`,
      `Verdict: ${verdict}`,
      `Score: ${score}/100`,
      `Checked at: ${result.meta?.checkedAt || new Date().toISOString()}`,
      '',
      'Impact:',
      ticket.impact,
      '',
      'Suspected Cause:',
      ticket.suspectedCause,
      '',
      'Evidence:',
      ...ticket.evidence.map((item) => `- ${item}`),
      '',
      'Key Findings:',
      ...(notableFindings.length ? notableFindings : [`- ${localeText.report.noIssues}`]),
      '',
      'Next Action:',
      ...ticket.nextAction.map((item) => `- ${item}`),
    ].filter(Boolean).join('\n')
  }, [getResultState, localeText, result])

  const writeClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', 'true')
      textarea.style.position = 'fixed'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      textarea.select()
      const copiedByFallback = document.execCommand('copy')
      document.body.removeChild(textarea)
      return copiedByFallback
    }
  }

  const copyText = async (value: string, action: string = 'default') => {
    await writeClipboard(value)
    setCopied(true)
    setCopiedAction(action)
    setTimeout(() => {
      setCopied(false)
      setCopiedAction(null)
    }, 2000)
  }

  const copyResult = () => {
    if (!result) return
    copyText(JSON.stringify(result, null, 2), 'json')
  }

  const copyMarkdown = () => {
    const report = buildMarkdownReport()
    if (report) copyText(report, 'markdown')
  }

  const copySummary = () => {
    const summary = buildPlainSummary()
    if (summary) copyText(summary, 'summary')
  }

  const copyFaultSummary = () => {
    if (!error) return
    const guide = buildFaultGuide(error, result)
    copyText([
      `OpsKitPro Website Check Fault: ${result?.domain || domain || 'opskitpro.com'}`,
      '',
      'Likely Cause:',
      guide.cause,
      '',
      'Evidence:',
      ...guide.evidence.map((item: string) => `- ${item}`),
      '',
      'Next Action:',
      ...guide.nextAction.map((item: string) => `- ${item}`),
    ].join('\n'), 'fault')
  }

  const downloadText = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const exportJson = () => {
    if (!result) return
    downloadText(`opskitpro-${result.domain}.json`, JSON.stringify(result, null, 2), 'application/json')
  }

  const exportMarkdown = () => {
    const report = buildMarkdownReport()
    if (!result || !report) return
    downloadText(`opskitpro-${result.domain}.md`, report, 'text/markdown')
  }

  const copyShareLink = () => {
    const target = result?.domain || normalizeTargetInput(domain)
    if (!target) return
    const url = new URL(window.location.href)
    url.searchParams.set('q', target)
    writeClipboard(url.toString()).then(() => {
      setShareCopied(true)
      setTimeout(() => setShareCopied(false), 2000)
    })
  }

  const parseBatchTargets = (value: string) => {
    return Array.from(new Set(
      value
        .split(/[\s,，]+/)
        .map(normalizeTargetInput)
        .filter(Boolean)
    )).slice(0, 10)
  }

  const getPrimaryIssue = (data?: ReturnType<typeof createSafeDiagnosticResult>, fallback?: string) => {
    if (!data) return fallback || 'Error'
    if (!data.dns.success) return 'DNS'
    if (!data.http.success) return data.http.status_code ? `HTTP ${data.http.status_code}` : 'HTTP'
    if (!data.ssl.valid) return 'SSL'
    if (data.ssl.grade === 'C') return 'SSL expiring'
    if ((data.securityHeaders?.score ?? 100) < 55) return 'Headers'
    if (data.whois?.status?.toLowerCase().includes('hold')) return 'Domain hold'
    if (!data.cdn.is_provider) return 'No CDN'
    return 'OK'
  }

  const buildBatchMarkdown = (items: BatchDiagnosticResult[]) => {
    return [
      `| ${localeText.batch.target} | ${localeText.batch.http} | ${localeText.batch.dns} | ${localeText.batch.ssl} | ${localeText.batch.latency} | ${localeText.batch.issue} |`,
      '| --- | --- | --- | --- | --- | --- |',
      ...items.map((item) => {
        const row = item.result
        return [
          item.target,
          row ? String(row.http.status_code || 'ERR') : 'ERR',
          row ? row.dns.resolved_ip : '---',
          row ? (row.ssl.grade || (row.ssl.valid ? 'OK' : 'ERR')) : '---',
          row ? row.http.latency : '---',
          getPrimaryIssue(row, item.error),
        ].map((value) => String(value).replace(/\|/g, '/')).join(' | ')
      }).map((line) => `| ${line} |`),
    ].join('\n')
  }

  const buildBatchCsv = (items: BatchDiagnosticResult[]) => {
    const rows = [
      [localeText.batch.target, localeText.batch.http, localeText.batch.dns, localeText.batch.ssl, localeText.batch.latency, localeText.batch.issue],
      ...items.map((item) => {
        const row = item.result
        return [
          item.target,
          row ? String(row.http.status_code || 'ERR') : 'ERR',
          row ? row.dns.resolved_ip : '',
          row ? (row.ssl.grade || (row.ssl.valid ? 'OK' : 'ERR')) : '',
          row ? row.http.latency : '',
          getPrimaryIssue(row, item.error),
        ]
      }),
    ]

    return rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n')
  }

  const copyBatchTable = () => {
    if (batchResults.length === 0) return
    copyText(buildBatchMarkdown(batchResults))
  }

  const exportBatchCsv = () => {
    if (batchResults.length === 0) return
    downloadText('opskitpro-website-check-batch.csv', buildBatchCsv(batchResults), 'text/csv')
  }

  const runBatchDiagnostics = async () => {
    const targets = parseBatchTargets(batchInput || domain)
    if (targets.length === 0) return

    setBatchLoading(true)
    setBatchResults([])
    try {
      const settled = await Promise.all(targets.map(async (target) => {
        try {
          const cacheMode = authenticated ? 'kv' : '0'
          const noCacheParam = authenticated ? '' : `&_nocache=${Date.now()}`
          const res = await fetch(`/api/diagnostic?domain=${encodeURIComponent(target)}&cache=${cacheMode}${noCacheParam}`)
          const data = await res.json()
          if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
          const safeResult = createSafeDiagnosticResult(data, target, data.error)
          await upsertHistory(safeResult.domain, false).catch(() => null)
          return { target, result: safeResult }
        } catch (err: any) {
          return { target, error: err?.message || 'Unknown error' }
        }
      }))
      setBatchResults(settled)
    } finally {
      setBatchLoading(false)
    }
  }

  const toggleFavorite = async (target: string) => {
    const current = history.find((entry) => entry.target === target)
    if (current) {
      await togglePin(current)
    } else {
      await upsertHistory(target, true)
    }
  }

  const removeHistory = async (target: string) => {
    await deleteHistory(target)
  }

  const getAdvice = (data: any) => {
    const advice = []
    const copy = {
      ja: {
        http530: 'Cloudflare 530: オリジン DNS エラーです。CDN が接続先の IP を見つけられていません。',
        blocked: statusCopy.blockedAdvice,
        gateway: 'ゲートウェイのタイムアウトです。オリジンサービスが停止しているか、応答に失敗しています。',
        connectivity: '接続障害の可能性があります。ファイアウォールや 80/443 番ポートを確認してください。',
        sslExpired: 'SSL 証明書の有効性に問題があります。現在、ブラウザ側で警告が出る状態です。',
        sslSoon: '証明書の更新期限が近い可能性があります。15 日以内に更新計画を立ててください。',
        hsts: 'HSTS が無効です。Strict-Transport-Security を有効化すると SSL ストリップを防ぎやすくなります。',
        csp: 'Content-Security-Policy が未設定です。XSS や外部スクリプト混入への耐性を高めるため CSP を追加してください。',
        securityHeaders: '重要なセキュリティヘッダーが不足しています。HSTS、CSP、nosniff、frame 制御を優先してください。',
        cdn: 'エッジ CDN ではなく直接配信の可能性があります。遅延削減のため CDN 化を検討してください。',
        subdomains: 'サブドメイン数が多めです。検証用や放置された環境がないか確認すると安心です。',
        ok: '現時点では大きな問題は見当たりません。可用性・性能・セキュリティは良好です。',
      },
      zh: {
        http530: 'Cloudflare 530：源站 DNS 出错，CDN 未能找到上游服务器 IP。',
        blocked: statusCopy.blockedAdvice,
        gateway: '网关超时：源站服务可能已停止，或响应失败。',
        connectivity: '可能存在连接故障。请检查防火墙与 80/443 端口。',
        sslExpired: 'SSL 证书存在问题，当前会触发浏览器警告。',
        sslSoon: '证书可能即将到期，请在 15 天内安排更新。',
        hsts: 'HSTS 处于关闭状态。启用 Strict-Transport-Security 可减少 SSL Strip 风险。',
        csp: 'Content-Security-Policy 未设置。建议添加 CSP，降低 XSS 与第三方脚本注入风险。',
        securityHeaders: '关键安全响应头不足。建议优先补齐 HSTS、CSP、nosniff 与 frame 控制。',
        cdn: '当前可能是直连而非边缘 CDN。建议启用 CDN 以降低延迟。',
        subdomains: '子域名数量偏多，建议排查是否存在遗留的测试或临时环境。',
        ok: '目前没有明显问题，可用性、性能与安全性表现良好。',
      },
      tw: {
        http530: 'Cloudflare 530：源站 DNS 發生錯誤，CDN 無法找到上游伺服器 IP。',
        blocked: statusCopy.blockedAdvice,
        gateway: '閘道逾時：源站服務可能已停止，或回應失敗。',
        connectivity: '可能存在連線故障。請檢查防火牆與 80/443 連接埠。',
        sslExpired: 'SSL 憑證存在問題，目前會觸發瀏覽器警告。',
        sslSoon: '憑證可能即將到期，請在 15 天內安排更新。',
        hsts: 'HSTS 目前關閉。啟用 Strict-Transport-Security 可降低 SSL Strip 風險。',
        csp: 'Content-Security-Policy 未設定。建議加入 CSP，降低 XSS 與第三方腳本注入風險。',
        securityHeaders: '關鍵安全回應標頭不足。建議優先補齊 HSTS、CSP、nosniff 與 frame 控制。',
        cdn: '目前可能是直連而非邊緣 CDN。建議啟用 CDN 以降低延遲。',
        subdomains: '子網域數量偏多，建議排查是否有遺留的測試或臨時環境。',
        ok: '目前沒有明顯問題，可用性、效能與安全性表現良好。',
      },
      en: {
        http530: 'Cloudflare 530: Origin DNS error. The CDN cannot find your upstream IP.',
        blocked: statusCopy.blockedAdvice,
        gateway: 'Gateway timeout: The origin service may be down or failing to respond.',
        connectivity: 'Connectivity fault: Check your firewall and ports 80/443.',
        sslExpired: 'SSL certificate problem: browser warnings are likely right now.',
        sslSoon: 'Certificate expiring soon. Plan a renewal within 15 days.',
        hsts: 'HSTS is disabled. Enable Strict-Transport-Security to reduce SSL stripping risk.',
        csp: 'Content-Security-Policy is missing. Add CSP to reduce XSS and third-party script injection risk.',
        securityHeaders: 'Important security headers are missing. Prioritize HSTS, CSP, nosniff, and frame controls.',
        cdn: 'This looks like direct delivery, not edge CDN. Consider enabling CDN to reduce latency.',
        subdomains: 'A high subdomain count can hide forgotten staging or test environments.',
        ok: 'No major issues detected. Availability, performance, and security look healthy.',
      },
    }[lang]

    const state = getResultState(data)

    if (!data.http.success) {
      if (isBlockedHttpStatus(data.http.status_code)) {
        advice.push(copy.blocked)
      } else if (data.http.status_code === 530) {
        advice.push(copy.http530)
      } else if (data.http.status_code === 502 || data.http.status_code === 504) {
        advice.push(copy.gateway)
      } else {
        advice.push(copy.connectivity)
      }
    }

    const isExpired = data.ssl?.expiry && new Date(data.ssl.expiry) < new Date()
    if (!state.isIpOrVisitor && (isExpired || !data.ssl.valid)) {
      advice.push(copy.sslExpired)
    } else if (data.ssl.grade === 'C') {
      advice.push(copy.sslSoon)
    }
    
    if (data.ssl.valid && !data.ssl.factors?.includes('HSTS_ENABLED')) {
      advice.push(copy.hsts)
    }

    const missingHeaders = data.securityHeaders?.checks?.filter((check: any) => !check.present) || []
    if (state.blocked) {
      advice.push(statusCopy.visitorHeadersNa)
    } else if (missingHeaders.some((check: any) => check.key === 'content-security-policy')) {
      advice.push(copy.csp)
    } else if ((data.securityHeaders?.score ?? 100) < 75) {
      advice.push(copy.securityHeaders)
    }

    if (!state.isIpOrVisitor && !data.cdn.is_provider) {
      advice.push(copy.cdn)
    }

    if (data.subdomains && data.subdomains.length > 20) {
      advice.push(copy.subdomains)
    }

    if (advice.length === 0) {
      advice.push(copy.ok)
    }

    return advice
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const normalized = normalizeTargetInput(domain)
    if (!normalized) return
    setDomain(normalized)
    runDiagnostic(normalized)
  }

  const detectCloudflareErrorMatch = (data: any) => {
    if (!data?.http) return null
    const status = data.http.status_code
    const cfRay = data.http.cf_ray
    const isCfCdn = data.cdn?.provider === 'Cloudflare' || String(data.cdn?.server || '').toLowerCase().includes('cloudflare')
    const pageTitle = data.http.page_title?.toLowerCase() || ''

    let code: string | null = null

    if (status >= 520 && status <= 530 && (cfRay || isCfCdn || pageTitle.includes('cloudflare'))) {
      code = String(status)
    } else if (status === 403 && (cfRay || isCfCdn)) {
      if (pageTitle.includes('access denied') || pageTitle.includes('1020')) code = '1020'
      if (pageTitle.includes('1006')) code = '1006'
    } else if (status === 429 && (cfRay || isCfCdn)) {
      if (pageTitle.includes('rate limit') || pageTitle.includes('1015')) code = '1015'
    }

    if (!code && pageTitle) {
      if (pageTitle.includes('error 522')) code = '522'
      else if (pageTitle.includes('error 520')) code = '520'
      else if (pageTitle.includes('error 521')) code = '521'
      else if (pageTitle.includes('error 523')) code = '523'
      else if (pageTitle.includes('error 524')) code = '524'
      else if (pageTitle.includes('error 525')) code = '525'
      else if (pageTitle.includes('error 526')) code = '526'
      else if (pageTitle.includes('error 1020')) code = '1020'
      else if (pageTitle.includes('error 1015')) code = '1015'
      else if (pageTitle.includes('error 1006')) code = '1006'
    }
    return code
  }

  // Memoize advice to avoid computing it twice in render
  const adviceList = useMemo(() => (result ? getAdvice(result) : []), [result])
  const diagnosticFindings = useMemo(() => (result ? buildDiagnosticFindings(result) : []), [result])
  const faultGuide = useMemo(() => (error ? buildFaultGuide(error, result) : null), [buildFaultGuide, error, result])
  const displayedTarget = result?.domain || domain || 'opskitpro.com'
  const resultState = result ? getResultState(result) : null

  return (
    <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 mt-6 sm:mt-12 mb-24 sm:mb-28 z-20 relative font-sans">
      {/* Background Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[600px] bg-emerald-500/6 blur-[150px] rounded-full pointer-events-none -z-10"></div>

      {/* Hero Header */}
      <div className="text-center mb-12 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.18em] mb-6 shadow-sm backdrop-blur-md">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {localeText.heroBadge}
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-zinc-900 tracking-tighter mb-5 break-words">
           {result?.isVisitor
             ? localeText.heroTitles.visitor
             : result?.isActuallyIp
             ? localeText.heroTitles.ip
             : localeText.heroTitles.site}
        </h1>
        <p className="max-w-2xl mx-auto mb-4 leading-relaxed text-zinc-600 text-sm sm:text-base font-medium tracking-normal">
           {localeText.heroSubtitle}
        </p>
        <div className="mb-9 flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
          <span className="rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 shadow-sm">{localeText.heroModeLabel}</span>
          <span className="hidden sm:inline rounded-full border border-zinc-200/80 bg-white/70 px-3 py-1.5 shadow-sm">{localeText.emptyHint}</span>
        </div>

        {/* Input Bar */}
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-emerald-500/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="relative flex flex-col sm:flex-row sm:items-center bg-white/95 border border-zinc-100 p-3 sm:p-2 rounded-[1.35rem] shadow-xl shadow-zinc-200/70 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all gap-3 sm:gap-0">
               <div className="w-10 sm:w-12 h-10 sm:h-12 flex items-center justify-center text-zinc-400 self-start sm:self-auto">
                  <Globe className="w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
               </div>
               <input 
                 type="text" 
                 value={domain}
                 onChange={(e) => setDomain(e.target.value)}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     e.preventDefault()
                     const normalized = normalizeTargetInput(domain)
                     if (!normalized) return
                     setDomain(normalized)
                     runDiagnostic(normalized)
                   }
                 }}
                 placeholder={dict.home.diagnostics_placeholder}
                 className="min-w-0 w-full flex-grow bg-transparent border-none outline-none text-zinc-900 text-base sm:text-lg px-1 sm:px-2 py-1.5 sm:py-0"
               />
               <button 
                 type="button"
                 onClick={() => {
                   const normalized = normalizeTargetInput(domain)
                   if (!normalized) return
                   setDomain(normalized)
                   runDiagnostic(normalized, true)
                 }}
                 disabled={loading || !normalizeTargetInput(domain)}
                 className="shrink-0 w-full sm:w-auto justify-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white px-5 sm:px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50"
                 >
                 {loading ? <Activity className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
                 <span className="whitespace-nowrap text-sm sm:text-base">{loading ? localeText.analyzing : dict.home.diagnostics_btn}</span>
               </button>
            </div>
          </form>
          <div className="mt-4 rounded-3xl border border-zinc-100 bg-white/75 p-3 shadow-sm backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                <History className="h-3.5 w-3.5 text-emerald-500" />
                {localeText.actions.history}
              </div>
              {history.length === 0 && (
                <span className="text-[10px] font-medium text-zinc-400">{localeText.actions.noHistory}</span>
              )}
            </div>
            {history.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {history.map((entry) => (
                  <div key={entry.target} className="flex shrink-0 items-center overflow-hidden rounded-full border border-zinc-200 bg-white shadow-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setDomain(entry.target)
                        runDiagnostic(entry.target)
                      }}
                      className="max-w-[180px] truncate px-3 py-2 text-left text-xs font-semibold text-zinc-700 hover:text-emerald-600"
                    >
                      {entry.target}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(entry.target)}
                      className={`border-l border-zinc-100 px-2 py-2 ${entry.pinned ? 'text-amber-500' : 'text-zinc-300 hover:text-amber-500'}`}
                      aria-label={entry.pinned ? localeText.actions.unfavorite : localeText.actions.favorite}
                    >
                      <Star className={`h-3.5 w-3.5 ${entry.pinned ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHistory(entry.target)}
                      className="border-l border-zinc-100 px-2 py-2 text-zinc-300 hover:text-red-500"
                      aria-label={localeText.actions.remove}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="mt-4 rounded-3xl border border-zinc-100 bg-white/80 p-3 sm:p-4 shadow-sm backdrop-blur-md">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.18em] text-zinc-400">
                <LayoutGrid className="h-3.5 w-3.5 text-emerald-500" />
                {localeText.batch.title}
              </div>
              <span className="text-left text-[10px] font-medium text-zinc-400 sm:text-right">{localeText.batch.empty}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr,auto]">
              <textarea
                value={batchInput}
                onChange={(event) => setBatchInput(event.target.value)}
                placeholder={localeText.batch.placeholder}
                rows={3}
                className="min-h-[88px] w-full resize-y rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/10"
              />
              <button
                type="button"
                onClick={runBatchDiagnostics}
                disabled={batchLoading}
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-5 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-zinc-800 disabled:opacity-50"
              >
                {batchLoading ? <Activity className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {batchLoading ? localeText.batch.running : localeText.batch.run}
              </button>
            </div>
            {batchResults.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-100 bg-white">
                <div className="flex flex-col gap-2 border-b border-zinc-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">{localeText.batch.title}</div>
                  <div className="grid grid-cols-2 gap-2 sm:flex">
                    <button
                      type="button"
                      onClick={copyBatchTable}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-[10px] font-semibold text-zinc-600 hover:text-zinc-900"
                    >
                      <Copy className="h-3 w-3" />
                      {localeText.batch.copy}
                    </button>
                    <button
                      type="button"
                      onClick={exportBatchCsv}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-zinc-200 px-3 py-2 text-[10px] font-semibold text-zinc-600 hover:text-zinc-900"
                    >
                      <Download className="h-3 w-3" />
                      {localeText.batch.export}
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
                      <tr>
                        <th className="px-4 py-3">{localeText.batch.target}</th>
                        <th className="px-4 py-3">{localeText.batch.http}</th>
                        <th className="px-4 py-3">{localeText.batch.dns}</th>
                        <th className="px-4 py-3">{localeText.batch.ssl}</th>
                        <th className="px-4 py-3">{localeText.batch.latency}</th>
                        <th className="px-4 py-3">{localeText.batch.issue}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {batchResults.map((item) => {
                        const row = item.result
                        const issue = getPrimaryIssue(row, item.error)
                        return (
                          <tr key={item.target} className="text-zinc-700">
                            <td className="px-4 py-3 font-semibold">
                              <button
                                type="button"
                                onClick={() => {
                                  setDomain(item.target)
                                  if (row) setResult(row)
                                }}
                                className="max-w-[180px] truncate text-left hover:text-emerald-600"
                              >
                                {item.target}
                              </button>
                            </td>
                            <td className={`px-4 py-3 font-semibold ${row?.http.success ? 'text-emerald-600' : 'text-red-500'}`}>{row ? row.http.status_code || 'ERR' : 'ERR'}</td>
                            <td className="px-4 py-3 text-zinc-500">{row?.dns.resolved_ip || '---'}</td>
                            <td className={`px-4 py-3 font-semibold ${row?.ssl.valid ? 'text-emerald-600' : 'text-red-500'}`}>{row?.ssl.grade || '---'}</td>
                            <td className="px-4 py-3 text-zinc-500">{row?.http.latency || '---'}</td>
                            <td className={`px-4 py-3 font-semibold ${issue === 'OK' ? 'text-emerald-600' : 'text-orange-500'}`}>{issue}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Loading Progress State */}
      {loading && (
        <div className="max-w-3xl mx-auto rounded-3xl border border-emerald-100 bg-white/90 shadow-sm p-5 sm:p-6 animate-in fade-in duration-300">
           <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                 <div className="text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">
                   {localeText.loading.title}
                 </div>
                 <h3 className="mt-2 text-lg font-semibold text-zinc-900 tracking-[-0.01em]">
                   {localeText.loading.headline}
                 </h3>
                 <p className="mt-1 text-sm text-zinc-600 tracking-normal">
                   {localeText.loading.desc}
                 </p>
              </div>
              <div className="shrink-0 text-right">
                 <div className="text-[10px] font-semibold text-zinc-400 tracking-[0.24em]">{localeText.loading.progress}</div>
                 <div className="mt-2 text-lg font-semibold text-zinc-900 tabular-nums">{currentStep}/3</div>
                 <div className="mt-1 text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">
                   {activeLoadingStage.title}
                 </div>
              </div>
           </div>

           <div className="mt-4 h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
             <div
               className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
               style={{ width: `${Math.min((currentStep / 3) * 100, 100)}%` }}
             />
           </div>

           <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 px-4 py-3">
             <div className="flex items-start gap-3">
               <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm shadow-emerald-500/20">
                 <Activity className="w-4 h-4 animate-pulse" />
               </div>
               <div className="min-w-0">
                 <div className="text-[10px] font-semibold text-emerald-600 tracking-[0.18em]">
                   {localeText.loading.current}
                 </div>
                 <div className="mt-1 text-sm font-semibold text-zinc-900">{activeLoadingStage.title}</div>
                 <p className="mt-1 text-sm text-zinc-600">{activeLoadingStage.desc}</p>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && faultGuide && (
        <div className="mx-auto max-w-4xl rounded-[2.5rem] border border-red-100 bg-red-50/80 p-6 text-red-700 shadow-sm animate-in fade-in slide-in-from-top-4 sm:p-8">
           <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
             <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-500 shadow-sm">
               <AlertCircle className="h-6 w-6" />
             </div>
             <div className="min-w-0 flex-1">
               <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                 <div>
                   <p className="text-[10px] font-semibold tracking-[0.18em] text-red-400">{localeText.errorTitle}</p>
                   <h3 className="mt-1 text-xl font-semibold tracking-tight text-red-700">{faultGuide.title}</h3>
                 </div>
                 <div className="flex flex-wrap gap-2">
                   <button onClick={() => runDiagnostic(result?.domain || domain, true)} className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-[10px] font-semibold tracking-[0.14em] text-red-600 transition-colors hover:bg-red-50">
                     <Activity className="h-3.5 w-3.5" />
                     {localeText.fault.retry}
                   </button>
                   <button onClick={copyFaultSummary} className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-[10px] font-semibold tracking-[0.14em] text-red-600 transition-colors hover:bg-red-50">
                     {copiedAction === 'fault' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                     {copiedAction === 'fault' ? localeText.copy.copied : localeText.fault.copy}
                   </button>
                 </div>
               </div>

               <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-[0.9fr,1.1fr]">
                 <div className="rounded-2xl border border-red-100 bg-white/80 p-4">
                   <p className="text-[10px] font-semibold tracking-[0.16em] text-red-400">{localeText.fault.likelyCause}</p>
                   <p className="mt-2 text-sm leading-6 text-zinc-800">{faultGuide.cause}</p>
                 </div>
                 <div className="rounded-2xl border border-red-100 bg-white/80 p-4">
                   <p className="text-[10px] font-semibold tracking-[0.16em] text-red-400">{localeText.fault.evidence}</p>
                   <div className="mt-2 space-y-1.5">
                     {faultGuide.evidence.map((item: string) => (
                       <p key={item} className="break-all text-xs leading-5 text-zinc-700">- {item}</p>
                     ))}
                   </div>
                 </div>
               </div>

               <div className="mt-3 rounded-2xl border border-red-100 bg-white/80 p-4">
                 <p className="text-[10px] font-semibold tracking-[0.16em] text-red-400">{localeText.fault.nextAction}</p>
                 <div className="mt-2 space-y-2">
                   {faultGuide.nextAction.map((item: string) => (
                     <p key={item} className="text-xs leading-5 text-zinc-700">- {item}</p>
                   ))}
                 </div>
               </div>
             </div>
           </div>
        </div>
      )}

      {/* Results Presentation */}
      {result && !loading && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
           
           {/* Cloudflare Error Banner */}
           {(() => {
             const cfErrorMatch = detectCloudflareErrorMatch(result)
             if (!cfErrorMatch) return null;
             return (
               <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                 <div className="flex items-center gap-3 relative z-10">
                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
                     <AlertCircle className="h-5 w-5" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-red-800">Cloudflare Error {cfErrorMatch} Detected</h3>
                     <p className="text-xs font-medium text-red-600/80 mt-0.5">We found a matching troubleshooting guide in our knowledge base.</p>
                   </div>
                 </div>
                 <Link href={`/errors/${cfErrorMatch}`} className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm">
                   Read {cfErrorMatch} Troubleshooting Guide
                   <ArrowRight className="h-4 w-4" />
                 </Link>
               </div>
             )
           })()}

           {/* DNS Security Banner */}
           {(() => {
             const records = result.dns?.records || {}
             const hasDnsSecurityRecords = (records.MX && records.MX.length > 0) || (records.TXT && records.TXT.length > 0)
             if (!hasDnsSecurityRecords) return null;
             return (
               <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                 <div className="flex items-center gap-3 relative z-10">
                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                     <ShieldCheck className="h-5 w-5" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-emerald-800">Email & DNS Security Validation Available</h3>
                     <p className="text-xs font-medium text-emerald-600/80 mt-0.5">We detected MX/TXT records. Audit your SPF, DMARC, and CAA configurations.</p>
                   </div>
                 </div>
                 <TrackedLink eventName="website_check_to_dns_audit" targetName={result.target} href={`/tools/dns-lookup?tab=security&domain=${encodeURIComponent(result.target)}`} className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm">
                   Run Security Audit
                   <ArrowRight className="h-4 w-4" />
                 </TrackedLink>
               </div>
             )
           })()}

           {/* Cloudflare CDN Banner */}
           {(() => {
             const isCfCdn = result.cdn?.provider === 'Cloudflare' || String(result.cdn?.server || '').toLowerCase().includes('cloudflare') || !!result.meta?.cfRay
             if (!isCfCdn) return null;
             return (
               <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 blur-[50px] rounded-full pointer-events-none"></div>
                 <div className="flex items-center gap-3 relative z-10">
                   <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
                     <Zap className="h-5 w-5" />
                   </div>
                   <div>
                     <h3 className="text-sm font-bold text-sky-800">Cloudflare Edge Detected</h3>
                     <p className="text-xs font-medium text-sky-600/80 mt-0.5">This domain is routed through Cloudflare's global network.</p>
                   </div>
                 </div>
                 <TrackedLink eventName="website_check_to_trace" targetName={result.target} href={`/tools/cloudflare-trace`} className="relative z-10 shrink-0 inline-flex items-center gap-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white px-4 py-2.5 text-xs font-bold transition-colors shadow-sm">
                   Analyze Cloudflare Trace
                   <ArrowRight className="h-4 w-4" />
                 </TrackedLink>
               </div>
             )
           })()}

           {/* Overall Status Bar */}
           <div className={`mb-6 p-4 sm:p-7 rounded-[2rem] border shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 sm:gap-5 relative overflow-hidden ${
             resultState?.healthy
               ? 'bg-white/90 border-emerald-100/80'
               : resultState?.warning
                 ? 'bg-orange-50 border-orange-100'
                 : 'bg-red-50 border-red-100'
           }`}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="flex items-center gap-5 z-10 w-full min-w-0">
                 {/* Score Ring */}
                 {(() => {
                   const score = calculateScore(result)
                   const radius = 30
                   const circumference = 2 * Math.PI * radius
                   const offset = circumference - (score / 100) * circumference
                   const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
                   return (
                     <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                       <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                         <circle cx="50" cy="50" r={radius} fill="none" stroke="#f4f4f5" strokeWidth="6" />
                         <circle cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)' }} />
                       </svg>
                       <div className="relative z-10 flex flex-col items-center">
                          <span className="text-xl font-semibold text-zinc-900 leading-none">{score}</span>
                       </div>
                     </div>
                   )
                 })()}
                 <div className="min-w-0">
                   <h2 className="text-[10px] font-semibold text-zinc-400 mb-1 tracking-[0.18em]">{localeText.summaryScore}</h2>
                  <h1 className={`text-2xl sm:text-3xl font-semibold tracking-[-0.02em] ${
                    resultState?.healthy ? 'text-zinc-900' : resultState?.warning ? 'text-orange-600' : 'text-red-600'
                  }`}>
                     {resultState?.verdict}
                   </h1>
                   <div className="mt-3 flex flex-wrap items-center gap-2">
                     <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-zinc-500">
                       <Monitor className="h-3 w-3 shrink-0 text-zinc-400" />
                       <span className="truncate">{displayedTarget}</span>
                     </span>
                     <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] ${
                       result.http.success
                         ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                         : resultState?.blocked
                           ? 'border-orange-100 bg-orange-50 text-orange-600'
                           : 'border-red-100 bg-red-50 text-red-600'
                     }`}>
                       <CheckCircle2 className="h-3 w-3" />
                       {result.http.status_code || 'ERR'}
                     </span>
                   </div>
                 </div>
              </div>
              <div className="relative z-10 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:justify-end">
                <button onClick={copySummary} className="flex items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-3 text-[10px] font-semibold tracking-[0.16em] text-emerald-700 transition-colors hover:bg-emerald-100 hover:text-emerald-900">
                  {copiedAction === 'summary' ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedAction === 'summary' ? localeText.copy.copied : localeText.actions.copySummary}
                </button>
                <button onClick={copyMarkdown} className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/90 px-4 py-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                  {copiedAction === 'markdown' ? <Check className="h-3 w-3 text-emerald-500" /> : <FileText className="h-3 w-3" />}
                  {copiedAction === 'markdown' ? localeText.copy.copied : localeText.actions.copyMarkdown}
                </button>
                <button onClick={copyResult} className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/90 px-4 py-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                  {copiedAction === 'json' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedAction === 'json' ? localeText.copy.copied : localeText.actions.copyJson}
                </button>
                <button onClick={copyShareLink} className="flex items-center justify-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/90 px-4 py-3 text-[10px] font-semibold tracking-[0.16em] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900">
                  {shareCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Link2 className="h-3 w-3" />}
                  {shareCopied ? localeText.actions.shareCopied : localeText.actions.share}
                </button>
                <button onClick={() => toggleFavorite(result.domain)} className={`flex items-center justify-center gap-2 rounded-full border px-4 py-3 text-[10px] font-semibold tracking-[0.16em] transition-colors ${
                  history.find((entry) => entry.target === result.domain)?.pinned
                    ? 'border-amber-200 bg-amber-50 text-amber-600'
                    : 'border-zinc-200 bg-zinc-50/90 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}>
                  <Star className={`h-3 w-3 ${history.find((entry) => entry.target === result.domain)?.pinned ? 'fill-current' : ''}`} />
                  {history.find((entry) => entry.target === result.domain)?.pinned ? localeText.actions.unfavorite : localeText.actions.favorite}
                </button>
              </div>
           </div>

           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
             {summaryFacts.slice(2).map((fact) => (
               <div key={fact.label} className="rounded-2xl border border-zinc-100 bg-white/85 backdrop-blur-md px-4 py-3 shadow-sm">
                 <div className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">{fact.label}</div>
                 <div className={`mt-2 truncate text-sm font-semibold ${
                   fact.tone === 'emerald'
                     ? 'text-emerald-600'
                     : fact.tone === 'orange'
                     ? 'text-orange-500'
                     : fact.tone === 'red'
                     ? 'text-red-500'
                     : 'text-zinc-900'
                 }`}>
                   {fact.value}
                 </div>
               </div>
             ))}
           </div>

           <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
             {[
               { label: localeText.meta.coreMs, value: result.meta?.coreMs ? `${result.meta.coreMs}ms` : '---' },
               { label: localeText.meta.totalMs, value: result.meta?.totalMs ? `${result.meta.totalMs}ms` : '---' },
               {
                 label: localeText.meta.cacheAge,
                 value: result.meta?.cacheStatus === 'HIT'
                   ? `${result.meta.cacheAgeSeconds || 0}s`
                   : 'Live',
               },
               { label: localeText.meta.edgeColo, value: result.meta?.edgeColo || 'Unknown' },
               { label: localeText.meta.cache, value: result.meta?.cacheStatus || 'MISS' },
               { label: localeText.meta.checkedAt, value: result.meta?.checkedAt ? new Date(result.meta.checkedAt).toLocaleString() : '---' },
             ].map((item) => (
               <div key={item.label} className="rounded-2xl border border-zinc-100 bg-white/80 px-4 py-3 shadow-sm">
                 <div className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">{item.label}</div>
                 <div className="mt-2 truncate text-xs font-semibold text-zinc-800">{item.value}</div>
               </div>
             ))}
           </div>

           <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
             <button onClick={exportMarkdown} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-700">
               <Download className="h-4 w-4" />
               {localeText.actions.exportMarkdown}
             </button>
             <button onClick={exportJson} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-xs font-semibold text-zinc-700 shadow-sm transition-colors hover:border-emerald-200 hover:text-emerald-700">
               <Download className="h-4 w-4" />
               {localeText.actions.exportJson}
             </button>
           </div>

           <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-[1.15fr,0.85fr]">
             <section className="rounded-[2rem] border border-zinc-100 bg-white/90 p-5 shadow-sm sm:p-6">
               <div className="mb-4 flex items-center justify-between gap-3">
                 <div>
                   <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">{localeText.report.keyFindings}</p>
                   <h3 className="mt-1 text-lg font-semibold text-zinc-900">{displayedTarget}</h3>
                 </div>
                 <div className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] ${
                   diagnosticFindings.some((item: any) => item.status === 'error')
                     ? 'border-red-100 bg-red-50 text-red-600'
                     : diagnosticFindings.some((item: any) => item.status === 'warning')
                     ? 'border-orange-100 bg-orange-50 text-orange-600'
                     : 'border-emerald-100 bg-emerald-50 text-emerald-700'
                 }`}>
                   {diagnosticFindings.some((item: any) => item.status === 'error')
                     ? localeText.report.error
                     : diagnosticFindings.some((item: any) => item.status === 'warning')
                     ? localeText.report.warning
                     : localeText.report.ok}
                 </div>
               </div>
               <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                 {diagnosticFindings.map((item: any) => (
                   <div key={item.key} className={`rounded-2xl border px-4 py-3 ${
                     item.status === 'ok'
                       ? 'border-emerald-100 bg-emerald-50/40'
                       : item.status === 'warning'
                       ? 'border-orange-100 bg-orange-50/50'
                       : 'border-red-100 bg-red-50/60'
                   }`}>
                     <div className="flex items-start gap-3">
                       <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                         item.status === 'ok' ? 'bg-emerald-500' : item.status === 'warning' ? 'bg-orange-400' : 'bg-red-500'
                       }`} />
                       <div className="min-w-0">
                         <p className={`text-xs font-semibold ${
                           item.status === 'ok' ? 'text-emerald-700' : item.status === 'warning' ? 'text-orange-700' : 'text-red-700'
                         }`}>
                           {item.title}
                         </p>
                         <p className="mt-1 text-xs leading-5 text-zinc-600">{item.description}</p>
                       </div>
                     </div>
                   </div>
                 ))}
               </div>
             </section>

             <section className="rounded-[2rem] border border-zinc-100 bg-white/90 p-5 shadow-sm sm:p-6">
               <p className="text-[10px] font-semibold tracking-[0.18em] text-zinc-400">{localeText.report.nextSteps}</p>
               <div className="mt-4 space-y-3">
                 {adviceList.slice(0, 3).map((advice, index) => (
                   <div key={index} className="flex gap-3 rounded-2xl border border-zinc-100 bg-zinc-50/80 px-4 py-3">
                     <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                     <p className="text-xs leading-5 text-zinc-700">{advice}</p>
                   </div>
                 ))}
               </div>
             </section>
           </div>

           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 rounded-3xl sm:rounded-full border border-zinc-100 bg-white/70 px-4 py-3 sm:py-2 shadow-sm backdrop-blur-md">
             <p className="text-[10px] font-semibold text-zinc-400 tracking-[0.18em]">
               {localeText.detailsHint}
             </p>
             <button
               type="button"
               onClick={() => setShowDetails((value) => !value)}
                 className={`inline-flex items-center gap-2 rounded-full border bg-white/90 px-4 py-2 text-[10px] font-semibold shadow-sm transition-all ${
                   isAsianLanguage
                     ? 'border-zinc-200 text-zinc-700 tracking-[0.18em] hover:text-zinc-900 hover:border-emerald-300'
                   : 'border-black/5 tracking-[0.22em] text-zinc-500 hover:text-zinc-900 hover:border-emerald-200'
               }`}
             >
               <ChevronDown className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''} ${isAsianLanguage ? 'text-emerald-500' : ''}`} />
               {showDetails ? localeText.detailsClose : localeText.detailsOpen}
              </button>
           </div>

           {showDetails && (
           <div className="space-y-4 mb-10">
              
              {/* Step: Geo-Location (Shown first for IPs) */}
              {result.isActuallyIp && (
                <div className="bg-emerald-50/30 border border-emerald-100 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
                  <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                    <span className="text-[10px] font-semibold text-emerald-600 tracking-[0.22em]">{localeText.geo.step}</span>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">{localeText.geo.title}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.geo.country}</p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">{result.geo.country}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.geo.city}</p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">{result.geo.city}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.geo.asn}</p>
                      <p className="text-sm font-semibold text-emerald-600">{result.geo.asn}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.geo.isp}</p>
                      <p className="text-sm font-semibold text-zinc-900 truncate">{result.geo.isp}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 1: WHOIS */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">{localeText.whois.step}</span>
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">{localeText.whois.title}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  {!result.whois?.success && result.whois?.error ? (
                    <div className="w-full h-full flex flex-col justify-center">
                       <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.whois.diagException}</p>
                       <p className="text-sm font-semibold text-red-500">
                         RDAP_FAULT: {result.whois.error}
                       </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{result.isActuallyIp ? 'Network Owner' : 'Registrar'}</p>
                        <p className={`text-sm font-semibold truncate ${result.whois?.success ? 'text-zinc-900' : 'text-zinc-400'}`}>
                          {result.whois?.success ? result.whois.registrar : (result.isActuallyIp ? result.geo.isp : localeText.whois.noInfo)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{result.isActuallyIp ? localeText.whois.allocated : localeText.whois.registered}</p>
                        <p className="text-sm text-zinc-700">{result.whois?.success ? result.whois.registered : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{result.isActuallyIp ? localeText.whois.networkClass : localeText.whois.expiry}</p>
                        <p className="text-sm text-zinc-700">{result.isActuallyIp ? (result.isPrivate ? localeText.whois.privateIp : localeText.whois.publicIp) : (result.whois?.success ? result.whois.expires : 'N/A')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.whois.status}</p>
                        <p className={`text-sm font-semibold truncate ${
                            result.whois?.status?.toLowerCase().includes('hold') ? 'text-red-500' : 'text-emerald-500'
                        }`} title={result.whois?.status || 'Unknown'}>
                            {result.whois?.status || (lang === 'en' ? 'OK' : '正常')}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Subdomain Discovery Add-on */}
                  {result.subdomains && result.subdomains.length > 0 && (
                    <details className="mt-6 rounded-2xl border border-zinc-100 bg-zinc-50/50 px-4 py-3 group">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="w-3 h-3 text-zinc-400" />
                          <h4 className="text-[10px] font-semibold text-zinc-500 tracking-[0.18em]">{localeText.whois.assetTitle}</h4>
                        </div>
                        <span className="text-[9px] text-zinc-400">{result.subdomains.length} {localeText.whois.assetCountSuffix}</span>
                      </summary>
                      <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-2">
                        {result.subdomains.map((sub: string) => (
                          <button
                            key={sub}
                            onClick={() => {
                              setDomain(sub);
                              runDiagnostic(sub);
                            }}
                            className="text-left px-3 py-2 bg-white border border-zinc-100 rounded-lg text-[10px] text-zinc-600 hover:border-emerald-500 hover:text-emerald-600 transition-all hover:shadow-sm truncate group"
                          >
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span> {sub}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>

              {/* Step 2: DNS */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">{localeText.dns.step}</span>
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">{localeText.dns.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.dns.resolved}</p>
                     <p className="text-[12px] font-semibold text-zinc-800 break-all leading-tight" title={result.dns.all_ips?.join(', ')}>
                          {result.dns.all_ips && result.dns.all_ips.length > 0 
                            ? result.dns.all_ips.join(' / ')
                            : result.dns.resolved_ip}
                     </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${
                        result.dns.ipv4?.length ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                      }`}>
                        IPv4 {result.dns.ipv4?.length ? `${result.dns.ipv4.length} OK` : 'None'}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${
                        result.dns.ipv6?.length ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-50 text-zinc-400'
                      }`}>
                        IPv6 {result.dns.ipv6?.length ? `${result.dns.ipv6.length} OK` : 'None'}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] ${
                        result.dns.dual_stack ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-amber-200 bg-amber-50 text-amber-700'
                      }`}>
                        {result.dns.dual_stack ? 'Dual stack' : 'Single stack'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-4 pt-4 border-t border-zinc-50/50">
                        {/* REGIONAL LOCAL NODES (Client Perspective) - Deduped by Map */}
                        {Object.values(localResolvers).map((node: any) => (
                           <div key={node.id} className="flex items-center gap-2 group cursor-help transition-all hover:scale-105" title={`Direct from your locally configured network via ${node.id}`}>
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                node.status === 'OK' ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 
                                node.status === 'RESOLVING' ? 'bg-zinc-200 animate-pulse' : 'bg-red-400'
                              }`}></div>
                              <div className="flex flex-col">
                                <span className="text-[9px] font-semibold text-zinc-800 leading-none tracking-[0.18em]">{node.name}</span>
                                <span className="text-[8px] text-zinc-400 mt-1 font-semibold">
                                  {node.status === 'FAILED' ? localeText.dns.restricted : (node.ip ? (node.ip.length > 15 ? node.ip.slice(0, 12) + '...' : node.ip) : 'NXDOMAIN')} • {node.latency}
                                </span>
                              </div>
                           </div>
                        ))}

                        {/* GLOBAL CLOUD NODES (Worker Perspective) */}
                        <div className="w-full flex flex-wrap items-center gap-4 mt-1">
                          {result.dns.resolvers?.map((r: any) => (
                           <div key={r.resolver} className="flex items-center gap-1.5" title={`${r.resolver}: ${r.status || 'Unknown'} · ${r.latencyMs ?? '—'}ms`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'OK' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                              <span className="text-[9px] font-semibold text-zinc-400 tracking-[0.12em]">{r.resolver} {r.latencyMs ?? '—'}ms</span>
                           </div>
                        ))}
                        </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.dns.latency}</p>
                    <p className="text-sm text-emerald-600 flex items-center gap-1 font-semibold">
                      <Activity className="w-3 h-3" /> {result.dns.latency}
                    </p>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.dns.nameservers}</p>
                    <div className="flex flex-col gap-2 max-h-[100px] overflow-y-auto pr-1 overflow-x-hidden">
                        {result.dns.ns && result.dns.ns.length > 0 
                          ? result.dns.ns.map((ns: string) => (
                              <p key={ns} className="text-[10px] text-zinc-500 truncate leading-tight" title={ns}>{ns}</p>
                            ))
                          : <p className="text-[10px] text-zinc-400 font-semibold">{localeText.dns.unknown}</p>
                        }
                    </div>
                  </div>
                  <details className="col-span-2 lg:col-span-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <h4 className="truncate text-[10px] font-semibold tracking-[0.18em] text-zinc-500">{localeText.dns.recordOverview}</h4>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                      {(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'CAA', 'SOA'] as const).map((recordType) => {
                        const values = result.dns.records?.[recordType] || []
                        return (
                          <div key={recordType} className="rounded-2xl border border-white bg-white/90 px-4 py-3 shadow-sm">
                            <div className="mb-2 flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold text-zinc-900">{recordType}</p>
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                values.length ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-400'
                              }`}>
                                {values.length}
                              </span>
                            </div>
                            <p className="mb-3 text-[10px] leading-4 text-zinc-500">{localeText.dns.recordNotes[recordType]}</p>
                            <div className="space-y-1.5">
                              {values.length ? values.slice(0, 8).map((value: string) => (
                                <p key={value} className="rounded-lg bg-zinc-50 px-2.5 py-1.5 font-mono text-[10px] leading-4 text-zinc-700 break-all">
                                  {value}
                                </p>
                              )) : (
                                <p className="rounded-lg bg-zinc-50 px-2.5 py-1.5 text-[10px] font-semibold text-zinc-400">{localeText.dns.noRecords}</p>
                              )}
                              {values.length > 8 && (
                                <p className="text-[10px] font-semibold text-zinc-400">+{values.length - 8}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 3: Server HTTP */}
              <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all ${result.http.success ? 'bg-white border-black/5' : 'bg-red-50 border-red-100'}`}>
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">{localeText.http.step}</span>
                  <div className="flex items-center gap-2">
                    <Server className={`w-4 h-4 ${result.http.success ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">{localeText.http.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.http.availability}</p>
                    <p className={`text-sm font-semibold ${result.http.success ? 'text-emerald-500' : 'text-red-500'}`}>
                      {result.http.success ? localeText.http.success : localeText.http.failure}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.http.status}</p>
                    <p className={`text-sm font-semibold ${result.http.success ? 'text-zinc-900' : 'text-red-500'}`}>
                      {result.http.status_code || 'Err'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.http.protocol}</p>
                    <p className="text-sm text-zinc-700">{result.http.is_https ? 'HTTPS' : 'HTTP/TCP'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.http.responseTime}</p>
                    <p className="text-sm text-zinc-900 flex items-center gap-1 font-semibold">
                      <Zap className="w-3 h-3 text-emerald-500" /> {result.http.latency}
                     </p>
                  </div>
                  <details className="col-span-2 lg:col-span-4 rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4 group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-2">
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <div className="min-w-0">
                          <h4 className="truncate text-[10px] font-semibold tracking-[0.18em] text-zinc-500">{localeText.http.redirects}</h4>
                          <p className="mt-1 truncate text-[10px] text-zinc-400">
                            {(result.http.redirect_count ?? 0) > 0 ? `${result.http.redirect_count} hop(s)` : localeText.http.noRedirects}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-300 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-3">
                      <p className="text-[10px] leading-4 text-zinc-500">{localeText.http.redirectHint}</p>
                      {result.http.redirect_warning && (
                        <div className="flex items-start gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-[10px] text-orange-700">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                          <span><span className="font-semibold">{localeText.http.redirectWarning}:</span> {result.http.redirect_warning}</span>
                        </div>
                      )}
                      <div className="rounded-2xl border border-white bg-white/90 p-3 shadow-sm">
                        <p className="mb-2 text-[10px] font-semibold tracking-[0.16em] text-zinc-400">{localeText.http.finalUrl}</p>
                        <p className="break-all font-mono text-[10px] leading-4 text-zinc-700">{result.http.final_url || 'Unknown'}</p>
                      </div>
                      <div className="space-y-2">
                        {(result.http.redirect_chain || []).length ? (result.http.redirect_chain || []).map((hop: any, index: number) => (
                          <div key={`${hop.url}-${index}`} className="rounded-2xl border border-white bg-white/90 px-3 py-2 shadow-sm">
                            <div className="mb-1 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                                hop.status >= 300 && hop.status < 400 ? 'bg-orange-50 text-orange-700' : hop.status < 400 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                              }`}>
                                {hop.status}
                              </span>
                              <span className="text-[9px] font-semibold tracking-[0.14em] text-zinc-400">HOP {index + 1}</span>
                            </div>
                            <p className="break-all font-mono text-[10px] leading-4 text-zinc-700">{hop.url}</p>
                            {hop.location && (
                              <p className="mt-1 break-all font-mono text-[10px] leading-4 text-zinc-400">→ {hop.location}</p>
                            )}
                          </div>
                        )) : (
                          <p className="rounded-xl bg-white px-3 py-2 text-[10px] font-semibold text-zinc-400">{localeText.http.noRedirects}</p>
                        )}
                      </div>
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 4: Security Headers */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">{localeText.security.step}</span>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${(result.securityHeaders?.score ?? 0) >= 75 ? 'text-emerald-500' : 'text-orange-500'}`} />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">{localeText.security.title}</span>
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.security.score}</p>
                      <p className={`text-sm font-semibold ${(result.securityHeaders?.score ?? 0) >= 75 ? 'text-emerald-600' : (result.securityHeaders?.score ?? 0) >= 55 ? 'text-orange-500' : 'text-red-500'}`}>
                        {result.securityHeaders?.grade || '—'} / {result.securityHeaders?.score ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.security.passed}</p>
                      <p className="text-sm font-semibold text-zinc-900">{result.securityHeaders?.passed ?? 0}/{result.securityHeaders?.total ?? 0}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.security.missing}</p>
                      <p className="text-sm font-semibold text-zinc-700">
                        {(result.securityHeaders?.checks || []).filter((check: any) => !check.present).map((check: any) => check.label).join(' / ') || 'OK'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-2">
                    {(result.securityHeaders?.checks || []).map((check: any) => (
                      <div key={check.key} className={`rounded-2xl border px-4 py-3 ${check.present ? 'border-emerald-100 bg-emerald-50/40' : 'border-orange-100 bg-orange-50/50'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-xs font-semibold ${check.present ? 'text-emerald-700' : 'text-orange-700'}`}>{check.label}</p>
                            <p className="mt-1 truncate text-[10px] text-zinc-500" title={check.value || check.recommendation}>
                              {check.present ? check.value || 'enabled' : check.recommendation}
                            </p>
                          </div>
                          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${check.present ? 'bg-emerald-500' : 'bg-orange-400'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 5: SSL */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">{localeText.ssl.step}</span>
                  <div className="flex items-center gap-2">
                    <Lock className={`w-4 h-4 ${result.ssl.valid ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">{localeText.ssl.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 flex-grow">
                  {/* Col 1: Status & Expiry */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.ssl.certStatus}</p>
                      <p className={`text-sm font-semibold ${result.ssl.valid ? 'text-emerald-500' : 'text-red-500'}`}>
                        {result.ssl.valid ? (lang === 'en' ? 'PROVEN_SECURE' : '有效') : (lang === 'en' ? 'VALIDATION_FAULT' : '驗證失敗')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.ssl.expiry}</p>
                      <p className="text-sm text-zinc-700">{result.ssl.expiry}</p>
                    </div>
                  </div>

                  {/* Col 2: Security Grade */}
                  <div className="flex flex-col items-center justify-center bg-zinc-50 rounded-2xl p-4 border border-black/5 relative">
                    <button 
                      onClick={() => setShowGradeInfo(!showGradeInfo)}
                      className="flex items-center gap-1 group"
                    >
                      <p className="text-[9px] font-semibold text-zinc-400 mb-2 group-hover:text-zinc-600 transition-colors tracking-[0.18em]">{localeText.ssl.grade}</p>
                      <HelpCircle className="w-2.5 h-2.5 text-zinc-300 mb-2 group-hover:text-emerald-500 transition-colors" />
                    </button>

                    {showGradeInfo && (
                      <div className="absolute z-50 bottom-full mb-2 w-64 bg-zinc-900 text-white p-4 rounded-xl shadow-2xl text-[10px] space-y-2 border border-white/10">
                        <p className="font-semibold text-emerald-400 tracking-[0.18em]">{localeText.ssl.grading}</p>
                        <div className="space-y-1 text-zinc-300">
                          <p><span className="text-white font-bold">A+ :</span> {lang === 'en' ? 'Fully Secure (HTTPS + HSTS Active)' : '極為安全（HTTPS + HSTS 已啟用）'}</p>
                          <p><span className="text-white font-bold">A  :</span> {lang === 'en' ? 'Secure (HTTPS Enabled)' : '安全（HTTPS 已啟用）'}</p>
                          <p><span className="text-white font-bold">B  :</span> {lang === 'en' ? 'Warning (HTTPS but Missing HSTS)' : '提醒（HTTPS 可用，但缺少 HSTS）'}</p>
                          <p><span className="text-white font-bold">C  :</span> {lang === 'en' ? 'Urgent (Expiring within 15 days)' : '即將到期（15 天內）'}</p>
                          <p><span className="text-white font-bold">F  :</span> {lang === 'en' ? 'Critical (HTTP only or Invalid Cert)' : '需要處理（僅 HTTP 或憑證無效）'}</p>
                        </div>
                        <div className="pt-2 border-t border-white/5 text-[8px] text-zinc-500">
                          {lang === 'en' ? 'Based on Qualys SSL Labs & Mozilla Security standards.' : '參考 Qualys SSL Labs 與 Mozilla 的標準。'}
                        </div>
                      </div>
                    )}
                    <div className={`text-4xl font-semibold ${
                      result.ssl.grade?.startsWith('A') ? 'text-emerald-500' : 
                      result.ssl.grade === 'B' ? 'text-orange-500' : 'text-red-500'
                    }`}>
                      {result.ssl.grade || 'A'}
                    </div>
                    <div className="mt-2 flex gap-1">
                       {result.ssl.factors?.map((f: string) => (
                         <div key={f} className="w-1.5 h-1.5 rounded-full bg-zinc-200" title={f}></div>
                       ))}
                    </div>
                  </div>

                  {/* Col 3: Headers & Tech */}
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.ssl.hsts}</p>
                      <p className={`text-[11px] font-semibold ${result.ssl.factors?.includes('HSTS_ENABLED') ? 'text-emerald-500' : 'text-orange-500'}`}>
                        {result.ssl.factors?.includes('HSTS_ENABLED') ? (lang === 'en' ? 'STRICT_ACTIVE' : '有效') : (lang === 'en' ? 'OPTIONAL_NONE' : '無效')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.ssl.cipher}</p>
                      <p className="text-[11px] text-zinc-600">{result.ssl.tls_version || 'TLS 1.3'}</p>
                    </div>
                  </div>

                  {/* Col 4: Cert Chain View */}
                  <details className="bg-zinc-50/50 rounded-2xl p-4 border border-zinc-100 relative overflow-hidden group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                      <p className="text-[9px] font-semibold text-zinc-400 tracking-[0.18em]">{localeText.ssl.chain}</p>
                      <ShieldCheck className="w-4 h-4 text-emerald-500 opacity-60 group-open:opacity-100 transition-opacity" />
                    </summary>
                    <div className="space-y-3 relative mt-4">
                       {result.ssl.chain && result.ssl.chain.length > 0 ? (
                         result.ssl.chain.map((link: any, idx: number) => (
                           <div key={idx} className="flex items-center gap-3">
                              <div className="flex flex-col items-center">
                                 <div className={`w-2 h-2 rounded-full ${link.status === 'Trusted' || link.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                 {idx < (result.ssl.chain.length - 1) && <div className="w-px h-3 bg-zinc-200"></div>}
                              </div>
                              <div className="min-w-0">
                                 <p className="text-[9px] text-zinc-400 leading-none mb-1 tracking-[0.18em]">{link.level}</p>
                                 <p className="text-[10px] text-zinc-700 font-semibold truncate max-w-[120px]" title={link.name}>{link.name}</p>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="flex flex-col items-center justify-center h-full py-4 opacity-30">
                            <ShieldAlert className="w-6 h-6 mb-2 text-zinc-400" />
                            <p className="text-[9px] text-center tracking-[0.18em] text-zinc-500">{localeText.ssl.chainUnavailable}</p>
                         </div>
                       )}
                    </div>
                  </details>
                </div>
              </div>

              {/* Step 5: CDN */}
              <div className="bg-white border border-black/5 p-5 sm:p-6 rounded-3xl flex flex-col md:flex-row gap-5 lg:gap-8 shadow-sm hover:shadow-md transition-all">
                <div className="md:w-40 shrink-0 flex flex-row md:flex-col items-center md:items-start gap-3 md:gap-2 md:border-r border-zinc-100 pr-5">
                  <span className="text-[10px] font-semibold text-zinc-300 tracking-[0.22em]">{localeText.cdn.step}</span>
                  <div className="flex items-center gap-2">
                    <Cloud className={`w-4 h-4 ${result.cdn.is_provider ? 'text-emerald-500' : 'text-zinc-400'}`} />
                    <span className="text-sm font-semibold text-zinc-900 tracking-[0.18em]">{localeText.cdn.title}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
                  <div className="col-span-2">
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.cdn.provider}</p>
                    <p className="text-sm font-semibold text-zinc-900 truncate">{result.cdn.provider}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.cdn.edge}</p>
                    <p className={`text-sm font-semibold ${result.cdn.is_provider ? 'text-orange-500' : 'text-zinc-400'}`}>
                      {result.cdn.is_provider ? localeText.cdn.proxied : localeText.cdn.direct}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-semibold mb-2 tracking-[0.18em]">{localeText.cdn.header}</p>
                    <p className="text-sm text-zinc-700 truncate">{result.cdn.server}</p>
                  </div>
                </div>
              </div>

           </div>
           )}

           {/* Suggestions & Advice Section */}
           {showDetails && (
           <div className="rounded-[2.5rem] border border-zinc-200/70 bg-white shadow-sm p-6 sm:p-10 md:p-12">
              <div className="flex items-start justify-between gap-6 mb-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                       <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-semibold text-zinc-900 tracking-[-0.02em]">{localeText.advice.title}</h3>
                       <p className="text-xs text-zinc-500 mt-1 tracking-[0.16em]">
                         {localeText.advice.subtitle}
                       </p>
                    </div>
                 </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr,0.9fr] gap-6">
                 <div className="space-y-3">
                    {adviceList.length > 0 ? adviceList.map((advice, i) => (
                      <div key={i} className="flex gap-4 p-5 bg-zinc-50/80 rounded-2xl border border-zinc-200/70 shadow-sm group overflow-hidden">
                         <div className="mt-1 h-2.5 w-2.5 rounded-full bg-orange-500 shrink-0" />
                         <div className="flex-grow">
                            <p className="text-sm sm:text-[15px] font-medium text-zinc-800 leading-relaxed">{advice}</p>
                            <p className="mt-2 text-[10px] text-zinc-400 tracking-[0.16em]">{localeText.advice.itemLabel}</p>
                         </div>
                      </div>
                    )) : (
                      <div className="p-8 bg-emerald-50/60 border border-emerald-100 rounded-2xl text-emerald-700">
                         <div className="flex items-center gap-3">
                           <CheckCircle2 className="w-6 h-6 opacity-60 shrink-0" />
                           <div>
                             <span className="text-sm font-bold block">{localeText.advice.noneTitle}</span>
                             <span className="text-[10px] opacity-70 mt-1 block tracking-[0.16em]">{localeText.advice.noneDesc}</span>
                           </div>
                         </div>
                      </div>
                    )}
                 </div>
                 <div className="rounded-2xl border border-zinc-200/70 bg-zinc-50/80 p-5 sm:p-6">
                    <h5 className="text-[10px] font-semibold text-zinc-400 mb-5 tracking-[0.18em]">{localeText.advice.nextTitle}</h5>
                    <div className="space-y-3">
                       <Link href={`/tools/ip-lookup?q=${result.dns.resolved_ip}`} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/70 hover:border-emerald-300 hover:-translate-y-0.5 transition-all group shadow-sm">
                          <span className="text-sm font-semibold text-zinc-900">{localeText.advice.ip}</span>
                          <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                       </Link>
                       <Link href={`/tools/dns-lookup?q=${domain}`} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-zinc-200/70 hover:border-emerald-300 hover:-translate-y-0.5 transition-all group shadow-sm">
                          <span className="text-sm font-semibold text-zinc-900">{localeText.advice.dns}</span>
                          <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                       </Link>
                    </div>
                </div>
              </div>
           </div>
           )}

           {/* JSON Audit View */}
           {showDetails && (
           <div className="mt-20">
              <button 
                 onClick={() => setShowJson(!showJson)}
                 className="flex items-center gap-2 text-[10px] font-semibold text-zinc-400 hover:text-zinc-900 transition-colors tracking-[0.18em] mb-6"
              >
                 <ChevronDown className={`w-3 h-3 transition-transform ${showJson ? 'rotate-180' : ''}`} />
                 {localeText.advice.json}
              </button>
              {showJson && (
                 <div className="bg-zinc-900 rounded-[2.5rem] p-6 sm:p-10 text-[11px] text-zinc-400 overflow-x-auto border border-zinc-800 shadow-2xl relative">
                    <div className="absolute top-4 right-4 sm:top-8 sm:right-8">
                      <button onClick={copyResult} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors border border-white/10">
                         {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                   </div>
                   <pre className="font-mono leading-relaxed pt-4">
                      {JSON.stringify(result, null, 2)}
                   </pre>
                </div>
              )}
           </div>
           )}
        </div>
      )}

      {/* Hero-State Empty View */}
      {!result && !loading && (
        <div className="max-w-2xl mx-auto mt-24 p-16 rounded-[3rem] border border-dashed border-zinc-200 bg-white/60 text-center animate-in fade-in duration-1000">
            <Search className="w-16 h-16 text-zinc-100 mx-auto mb-8 animate-pulse" />
            <p className="text-zinc-500 text-xs leading-relaxed tracking-[0.18em] opacity-40">
              {localeText.emptyHint}
            </p>
        </div>
      )}
    </main>
  )
}
