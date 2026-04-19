'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Zap, MessageSquare, Binary, Activity } from 'lucide-react'
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

export default function WebsocketClient() {
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

      <main className="w-full max-w-7xl mx-auto px-6 mt-8 md:mt-12 z-20 relative font-mono">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-[11px] font-mono uppercase tracking-widest text-zinc-500">
          <Link href="/" className="hover:text-cyan-600 transition-colors">HOME</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/services" className="hover:text-cyan-600 transition-colors">MATRIX</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 border-b border-cyan-500/30 font-bold uppercase">WS-WORKBENCH</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/8 border border-cyan-500/20 text-cyan-600 text-[10px] font-black uppercase tracking-[0.4em] mb-5">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
            Real-Time Transport Lab
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 bg-cyan-50 border border-cyan-100 rounded-2xl shadow-lg shadow-cyan-500/10 group transition-all">
                <Zap className="w-7 h-7 text-cyan-600 group-hover:scale-110 transition-transform" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight italic">
                  WebSocket Workbench
                </h1>
                <p className="text-zinc-600 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-1 leading-relaxed max-w-xl">
                  Multi-Tab • Binary • Templates • Sessions
                </p>
              </div>
            </div>

            {/* Session Manager */}
            <SessionManager
              currentUrl={activeTab.url}
              currentLogs={activeTab.logs}
              onLoadSession={handleLoadSession}
            />
          </div>
        </header>

        {/* Connection Tabs */}
        <div className="mb-6">
          <ConnectionTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSelectTab={setActiveTabId}
            onAddTab={addTab}
            onRemoveTab={removeTab}
            onRenameTab={renameTab}
            canAddTab={canAddTab}
          />
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6">
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
            {activeTab.status === 'connected' ? 'Connected' :
             activeTab.status === 'connecting' ? 'Connecting...' :
             activeTab.status === 'error' ? 'Error' : 'Disconnected'}
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'text' ? 'bg-white text-cyan-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Text
            </button>
            <button
              onClick={() => setViewMode('binary')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'binary' ? 'bg-white text-purple-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              Binary
            </button>
            <button
              onClick={() => setViewMode('ping')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                viewMode === 'ping' ? 'bg-white text-amber-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Ping
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Connection Panel */}
          <div className="lg:col-span-8">
            <ConnectionPanel
              status={activeTab.status}
              config={activeTab.config}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
              onConfigChange={() => {}}
            />
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-4">
            <StatsPanel status={activeTab.status} stats={activeTab.stats} />
          </div>

          {/* Message Composer based on view mode */}
          <div className="lg:col-span-12">
            {viewMode === 'text' && (
              <MessageComposer
                status={activeTab.status}
                onSend={handleSend}
              />
            )}
            {viewMode === 'binary' && (
              <BinaryComposer
                status={activeTab.status}
                onSend={handleSend}
              />
            )}
            {viewMode === 'ping' && (
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
