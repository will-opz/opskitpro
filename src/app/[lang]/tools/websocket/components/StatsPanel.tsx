'use client'

import { useMemo } from 'react'
import { Activity, ArrowUp, ArrowDown, Clock, Zap, Cpu } from 'lucide-react'
import type { ConnectionStatus } from '../hooks'

interface StatsPanelProps {
  status: ConnectionStatus
  stats: {
    messagesSent: number
    messagesReceived: number
    bytesSent: number
    bytesReceived: number
    connectedAt: number | null
    latency: number | null
  }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

export function StatsPanel({ status, stats }: StatsPanelProps) {
  const uptime = useMemo(() => {
    if (!stats.connectedAt) return null
    return Date.now() - stats.connectedAt
  }, [stats.connectedAt])

  const isConnected = status === 'connected'

  return (
    <div className="glass-card p-6 rounded-2xl border border-black/5 bg-zinc-900 text-white relative overflow-hidden">
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-zinc-400">
            <Cpu className="w-4 h-4" />
            <span className="text-[10px] uppercase tracking-wider">System Monitor</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-zinc-600'
          }`} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Messages Sent */}
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <ArrowUp className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-wider">Sent</span>
            </div>
            <div className="text-xl font-black text-cyan-400">{stats.messagesSent}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{formatBytes(stats.bytesSent)}</div>
          </div>

          {/* Messages Received */}
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-emerald-400 mb-1">
              <ArrowDown className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-wider">Received</span>
            </div>
            <div className="text-xl font-black text-emerald-400">{stats.messagesReceived}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{formatBytes(stats.bytesReceived)}</div>
          </div>

          {/* Uptime */}
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-amber-400 mb-1">
              <Clock className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-wider">Uptime</span>
            </div>
            <div className="text-lg font-bold text-amber-400">
              {uptime ? formatDuration(uptime) : '--'}
            </div>
          </div>

          {/* Latency */}
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="flex items-center gap-2 text-purple-400 mb-1">
              <Zap className="w-3 h-3" />
              <span className="text-[9px] uppercase tracking-wider">Latency</span>
            </div>
            <div className="text-lg font-bold text-purple-400">
              {stats.latency ? `${stats.latency}ms` : '<1ms'}
            </div>
          </div>
        </div>

        {/* Total Traffic */}
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-zinc-500 uppercase tracking-wider">Total Traffic</span>
            <span className="text-zinc-300 font-mono">
              {formatBytes(stats.bytesSent + stats.bytesReceived)}
            </span>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <Activity className="absolute bottom-0 right-0 w-32 h-32 text-cyan-500/5 -mb-8 -mr-8" />
    </div>
  )
}
