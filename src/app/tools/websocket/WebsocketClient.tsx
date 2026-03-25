'use client'

import Link from 'next/link'
import { Zap } from 'lucide-react'
import { useWebSocket } from './hooks'
import { ConnectionPanel, MessageComposer, LogViewer, StatsPanel } from './components'

export default function WebsocketClient() {
  const {
    status,
    logs,
    stats,
    config,
    connect,
    disconnect,
    send,
    clearLogs,
    setConfig
  } = useWebSocket()

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 font-sans selection:bg-cyan-500/20 selection:text-zinc-900 pb-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-grid-zinc-900/[0.03] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      <main className="w-full max-w-7xl mx-auto px-6 mt-12 z-20 relative font-mono">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-[11px] font-mono uppercase tracking-widest text-zinc-500">
          <Link href="/" className="hover:text-cyan-600 transition-colors">HOME</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/services" className="hover:text-cyan-600 transition-colors">MATRIX</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 border-b border-cyan-500/30 font-bold uppercase">WS-PROBE</span>
        </nav>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 group transition-all">
              <Zap className="w-7 h-7 text-cyan-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight italic">
                WebSocket Workbench
              </h1>
              <p className="text-zinc-500 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-1">
                Full-Duplex Protocol Debugger • Templates • Auto-Reconnect
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
            status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
            status === 'connecting' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600 animate-pulse' :
            status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
            'bg-zinc-100 border-zinc-200 text-zinc-500'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
              status === 'connecting' ? 'bg-amber-500' :
              status === 'error' ? 'bg-red-500' :
              'bg-zinc-400'
            }`} />
            {status === 'connected' ? 'Connected' :
             status === 'connecting' ? 'Connecting...' :
             status === 'error' ? 'Error' : 'Disconnected'}
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Connection Panel */}
          <div className="lg:col-span-8">
            <ConnectionPanel
              status={status}
              config={config}
              onConnect={connect}
              onDisconnect={disconnect}
              onConfigChange={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
            />
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-4">
            <StatsPanel status={status} stats={stats} />
          </div>

          {/* Message Composer */}
          <div className="lg:col-span-12">
            <MessageComposer
              status={status}
              onSend={send}
            />
          </div>

          {/* Log Viewer */}
          <div className="lg:col-span-12">
            <LogViewer
              logs={logs}
              onClear={clearLogs}
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
