'use client'

import { useState } from 'react'
import { Copy, Check, Clock, Server, ChevronDown, ChevronRight, Layers } from 'lucide-react'
import type { BatchResult } from '../hooks'

interface DnsBatchResultProps {
  result: BatchResult | null
  loading: boolean
}

const TYPE_COLORS: Record<string, string> = {
  A: 'bg-blue-100 text-blue-700',
  AAAA: 'bg-indigo-100 text-indigo-700',
  CNAME: 'bg-purple-100 text-purple-700',
  MX: 'bg-pink-100 text-pink-700',
  NS: 'bg-amber-100 text-amber-700',
  TXT: 'bg-emerald-100 text-emerald-700',
  SOA: 'bg-cyan-100 text-cyan-700',
  CAA: 'bg-orange-100 text-orange-700',
}

export function DnsBatchResult({ result, loading }: DnsBatchResultProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set(['A', 'AAAA', 'MX', 'NS']))
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const toggleExpand = (type: string) => {
    const newExpanded = new Set(expandedTypes)
    if (newExpanded.has(type)) {
      newExpanded.delete(type)
    } else {
      newExpanded.add(type)
    }
    setExpandedTypes(newExpanded)
  }

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const copyAll = () => {
    if (!result) return
    const text = result.results
      .filter(r => r.answers.length > 0)
      .map(r => `${r.type}:\n${r.answers.map(a => `  ${a.data}`).join('\n')}`)
      .join('\n\n')
    copyToClipboard(text, 'all')
  }

  if (loading) {
    return (
      <div className="glass-card p-8 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
          <p className="text-sm text-zinc-500">Querying all record types...</p>
        </div>
      </div>
    )
  }

  if (!result) return null

  const totalRecords = result.results.reduce((sum, r) => sum + r.answers.length, 0)

  return (
    <div className="glass-card rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-purple-100 bg-purple-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-purple-600" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-800">{result.domain}</span>
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold tracking-[0.16em]">
                BATCH
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-500 mt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {result.responseTime}ms
              </span>
              <span className="flex items-center gap-1">
                <Server className="w-3 h-3" />
                {result.provider}
              </span>
              <span>{totalRecords} records found</span>
            </div>
          </div>
        </div>

          <button
          onClick={copyAll}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-medium hover:bg-zinc-50 transition-all"
        >
          {copiedField === 'all' ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-zinc-400" />
          )}
          Copy All
        </button>
      </div>

      {/* Results by Type */}
      <div className="divide-y divide-zinc-100">
        {result.results.map(typeResult => {
          const isExpanded = expandedTypes.has(typeResult.type)
          const hasRecords = typeResult.answers.length > 0
          const colorClass = TYPE_COLORS[typeResult.type] || 'bg-zinc-100 text-zinc-700'

          return (
            <div key={typeResult.type}>
              <button
                onClick={() => toggleExpand(typeResult.type)}
                className="w-full px-6 py-3 flex items-center justify-between hover:bg-zinc-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-zinc-400" />
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold tracking-[0.16em] ${colorClass}`}>
                    {typeResult.type}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {typeResult.answers.length} record{typeResult.answers.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                {typeResult.error && (
                  <span className="text-xs text-red-500">{typeResult.error}</span>
                )}
                {typeResult.status && typeResult.status !== 'NOERROR' && (
                  <span className="text-xs text-amber-500">{typeResult.status}</span>
                )}
              </button>

              {isExpanded && hasRecords && (
                <div className="px-6 pb-4 pl-12 space-y-2">
                  {typeResult.answers.map((answer, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-zinc-800 break-all">
                          {answer.data}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-zinc-400">
                          <span>TTL: {formatTTL(answer.ttl)}</span>
                          <span className="truncate">{answer.name}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => copyToClipboard(answer.data, `${typeResult.type}-${idx}`)}
                        className="p-2 text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        {copiedField === `${typeResult.type}-${idx}` ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="px-6 py-3 bg-zinc-50 border-t border-zinc-100 flex flex-wrap gap-2">
        {result.results.map(r => {
          const colorClass = TYPE_COLORS[r.type] || 'bg-zinc-100 text-zinc-700'
          return (
            <span
              key={r.type}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                r.answers.length > 0 ? colorClass : 'bg-zinc-200 text-zinc-400'
              }`}
            >
              {r.type}: {r.answers.length}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function formatTTL(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  return `${Math.floor(seconds / 86400)}d`
}
