'use client'

import { Clock, Trash2, RotateCw, CheckCircle, XCircle } from 'lucide-react'
import type { LookupHistory, DnsRecordType, DnsProvider } from '../hooks'

interface DnsHistoryProps {
  history: LookupHistory[]
  onRerun: (domain: string, type: DnsRecordType, provider: DnsProvider) => void
  onClear: () => void
}

export function DnsHistory({ history, onRerun, onClear }: DnsHistoryProps) {
  if (history.length === 0) return null

  return (
    <div className="glass-card rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-400" />
          <h3 className="text-sm font-semibold text-zinc-700 tracking-[0.18em]">Query History</h3>
          <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-[10px] font-semibold text-zinc-500">
            {history.length}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="divide-y divide-zinc-50 max-h-64 overflow-auto">
        {history.map(entry => (
          <div
            key={entry.id}
            className="px-6 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              {entry.error ? (
                <XCircle className="w-4 h-4 text-red-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-700 truncate">{entry.domain}</span>
                  <span className="px-1.5 py-0.5 bg-cyan-100 text-cyan-700 rounded text-[9px] font-semibold tracking-[0.18em] shrink-0">
                    {entry.type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                  <span>{entry.provider}</span>
                  <span>•</span>
                  <span>{formatTime(entry.timestamp)}</span>
                  {entry.result && (
                    <>
                      <span>•</span>
                      <span>{entry.result.responseTime}ms</span>
                      <span>•</span>
                      <span>{entry.result.answers.length} records</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onRerun(entry.domain, entry.type, entry.provider)}
              className="p-2 text-zinc-300 hover:text-cyan-600 opacity-0 group-hover:opacity-100 transition-all"
              title="Rerun query"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return new Date(timestamp).toLocaleDateString()
}
