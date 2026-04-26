'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Activity, Binary, ChevronDown, MessageSquare, Settings2, Zap } from 'lucide-react'
import { useMultiConnection } from './hooks'
import { 
  ConnectionPanel, 
  MessageComposer, 
  LogViewer, 
  StatsPanel,
  SessionManager,
  BinaryComposer,
  PingMonitor,
  ConnectionTabs
} from './components'

type ViewMode = 'text' | 'binary' | 'ping'

type Lang = 'zh' | 'en' | 'ja' | 'tw'

export default function WebsocketClient({ dict, lang }: { dict: any; lang: Lang }) {
  const {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    connect,
    disconnect,
    send,
    addTab,
    removeTab,
    renameTab,
    clearLogs,
    canAddTab
  } = useMultiConnection()

  const [viewMode, setViewMode] = useState<ViewMode>('text')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const shellText = {
    zh: {
      badge: '实时传输实验室',
      home: '首页',
      tools: '工具',
      title: dict.tools.websocket_title,
      desc: dict.tools.websocket_desc,
      text: '文本',
      binary: '二进制',
      ping: '心跳',
      connected: '已连接',
      connecting: '连接中...',
      error: '连接异常',
      disconnected: '未连接',
      advanced: '高级功能',
      simpleHint: '连接端点、发送消息、查看流量日志。',
    },
    tw: {
      badge: '即時傳輸實驗室',
      home: '首頁',
      tools: '工具',
      title: dict.tools.websocket_title,
      desc: dict.tools.websocket_desc,
      text: '文字',
      binary: '二進位',
      ping: '心跳',
      connected: '已連線',
      connecting: '連線中...',
      error: '連線異常',
      disconnected: '未連線',
      advanced: '進階功能',
      simpleHint: '連接端點、發送訊息、查看流量日誌。',
    },
    ja: {
      badge: 'リアルタイム通信',
      home: 'ホーム',
      tools: 'ツール',
      title: dict.tools.websocket_title,
      desc: dict.tools.websocket_desc,
      text: 'テキスト',
      binary: 'バイナリ',
      ping: 'Ping',
      connected: '接続済み',
      connecting: '接続中...',
      error: 'エラー',
      disconnected: '未接続',
      advanced: '詳細機能',
      simpleHint: 'エンドポイントへ接続し、メッセージ送信とログ確認を行います。',
    },
    en: {
      badge: 'Real-Time Transport Lab',
      home: 'Home',
      tools: 'Tools',
      title: dict.tools.websocket_title,
      desc: dict.tools.websocket_desc,
      text: 'Text',
      binary: 'Binary',
      ping: 'Ping',
      connected: 'Connected',
      connecting: 'Connecting...',
      error: 'Error',
      disconnected: 'Disconnected',
      advanced: 'Advanced',
      simpleHint: 'Connect an endpoint, send messages, and inspect traffic logs.',
    },
  }[lang]

  const handleConnect = (url: string, options?: any) => {
    connect(activeTabId, url, options)
  }

  const handleDisconnect = () => {
    disconnect(activeTabId)
  }

  const handleSend = (data: string | ArrayBuffer) => {
    send(activeTabId, data)
  }

  const handleSendPing = () => {
    send(activeTabId, JSON.stringify({ type: 'ping', timestamp: Date.now() }))
  }

  const handleLoadSession = (logs: any[]) => {
    // Would need to implement session loading into current tab
    console.log('Load session:', logs.length, 'messages')
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 font-sans selection:bg-cyan-500/20 selection:text-zinc-900 pb-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-zinc-900/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <main className="w-full max-w-6xl mx-auto px-6 mt-8 md:mt-12 z-20 relative font-sans">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-[11px] text-zinc-500">
          <Link href="/" className="hover:text-cyan-600 transition-colors">{shellText.home}</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/services" className="hover:text-cyan-600 transition-colors">{shellText.tools}</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 border-b border-cyan-500/30 font-semibold">
            {dict.tools.websocket_title}
          </span>
        </nav>

        {/* Header */}
        <header className="mb-6 rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl sm:p-7">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/8 border border-cyan-500/20 text-cyan-600 text-[10px] font-semibold tracking-[0.28em] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            {shellText.badge}
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
                <div className="p-3.5 bg-cyan-50 border border-cyan-100 rounded-2xl shadow-sm group transition-all">
                  <Zap className="w-7 h-7 text-cyan-600 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">
                  {shellText.title}
                </h1>
                <p className="text-zinc-600 text-sm mt-2 leading-relaxed max-w-xl">
                  {shellText.simpleHint}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
                activeTab.status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                activeTab.status === 'connecting' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 animate-pulse' :
                activeTab.status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
                'bg-zinc-100 border-zinc-200 text-zinc-500'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  activeTab.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                  activeTab.status === 'connecting' ? 'bg-amber-500' :
                  activeTab.status === 'error' ? 'bg-red-500' :
                  'bg-zinc-400'
                }`} />
                {activeTab.status === 'connected' ? shellText.connected :
                 activeTab.status === 'connecting' ? shellText.connecting :
                 activeTab.status === 'error' ? shellText.error : shellText.disconnected}
              </div>
              <button
                type="button"
                onClick={() => setShowAdvanced((value) => !value)}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-bold text-zinc-600 shadow-sm transition hover:border-cyan-500/30 hover:bg-cyan-50 hover:text-cyan-700"
              >
                <Settings2 className="h-4 w-4" />
                {shellText.advanced}
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        {showAdvanced && (
          <section className="mb-6 rounded-2xl border border-zinc-100 bg-white/80 p-4 shadow-sm backdrop-blur-xl">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <ConnectionTabs
                tabs={tabs}
                activeTabId={activeTabId}
                onSelectTab={setActiveTabId}
                onAddTab={addTab}
                onRemoveTab={removeTab}
                onRenameTab={renameTab}
                canAddTab={canAddTab}
              />
              <SessionManager
                currentUrl={activeTab.url}
                currentLogs={activeTab.logs}
                onLoadSession={handleLoadSession}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { mode: 'text' as ViewMode, label: shellText.text, icon: MessageSquare, tone: 'text-cyan-600' },
                { mode: 'binary' as ViewMode, label: shellText.binary, icon: Binary, tone: 'text-purple-600' },
                { mode: 'ping' as ViewMode, label: shellText.ping, icon: Activity, tone: 'text-amber-600' },
              ].map((item) => {
                const Icon = item.icon
                const active = viewMode === item.mode
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setViewMode(item.mode)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      active ? `border-zinc-200 bg-white shadow-sm ${item.tone}` : 'border-transparent bg-zinc-50 text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {item.label}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Connection Panel */}
          <div className="lg:col-span-12">
            <ConnectionPanel
              status={activeTab.status}
              config={activeTab.config}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onConfigChange={() => {}}
            />
          </div>

          {/* Stats Panel */}
          {showAdvanced && (
            <div className="lg:col-span-12">
              <StatsPanel status={activeTab.status} stats={activeTab.stats} />
            </div>
          )}

          {/* Message Composer based on view mode */}
          <div className="lg:col-span-12">
            {(!showAdvanced || viewMode === 'text') && (
              <MessageComposer
                status={activeTab.status}
                onSend={handleSend}
              />
            )}
            {showAdvanced && viewMode === 'binary' && (
              <BinaryComposer
                status={activeTab.status}
                onSend={handleSend}
              />
            )}
            {showAdvanced && viewMode === 'ping' && (
              <PingMonitor
                status={activeTab.status}
                onSendPing={handleSendPing}
              />
            )}
          </div>

          {/* Log Viewer */}
          <div className="lg:col-span-12">
            <LogViewer
              logs={activeTab.logs}
              onClear={() => clearLogs(activeTabId)}
            />
          </div>
        </div>
      </main>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .bg-grid-zinc-900\/\[0\.03\] {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%2318181b' fill-opacity='0.03'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41zM20 18.6l2.83-2.83 1.41 1.41L21.41 20l2.83 2.83-1.41 1.41L20 21.41l-2.83 2.83-1.41-1.41L18.59 20l-2.83-2.83 1.41-1.41L20 18.59z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  )
}
