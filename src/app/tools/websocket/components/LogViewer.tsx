'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { Trash2, History, Copy, Check, Download, Filter, ArrowDown, ArrowUp, FileJson, Binary } from 'lucide-react'
import type { LogEntry, MessageType } from '../hooks'

interface LogViewerProps {
  logs: LogEntry[]
  onClear: () => void
}

type FilterType = 'all' | 'sent' | 'received' | 'info' | 'error'

export function LogViewer({ logs, onClear }: LogViewerProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)
  const [autoScroll, setAutoScroll] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // Auto-scroll
  useEffect(() => {
    if (autoScroll) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filter !== 'all' && log.type !== filter) return false
      if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) return false
      return true
    })
  }, [logs, filter, searchQuery])

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const formatJson = (text: string): string => {
    try {
      return JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      return text
    }
  }

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  const exportLogs = () => {
    const content = filteredLogs.map(log => 
      `[${log.time}] [${log.type.toUpperCase()}] ${log.message}`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ws-logs-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const stats = useMemo(() => ({
    total: logs.length,
    sent: logs.filter(l => l.type === 'sent').length,
    received: logs.filter(l => l.type === 'received').length,
    errors: logs.filter(l => l.type === 'error').length
  }), [logs])

  const getTypeStyles = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return { badge: 'bg-blue-500/20 text-blue-400', text: 'text-zinc-500' }
      case 'error': return { badge: 'bg-red-500/20 text-red-400', text: 'text-red-400' }
      case 'sent': return { badge: 'bg-cyan-500/20 text-cyan-400', text: 'text-cyan-300' }
      case 'received': return { badge: 'bg-emerald-500/20 text-emerald-400', text: 'text-emerald-300' }
      default: return { badge: 'bg-zinc-500/20 text-zinc-400', text: 'text-zinc-400' }
    }
  }

  const getTypeLabel = (type: LogEntry['type']) => {
    switch (type) {
      case 'info': return 'SYS'
      case 'error': return 'ERR'
      case 'sent': return 'SENT'
      case 'received': return 'RECV'
      default: return type.toUpperCase()
    }
  }

  const getMessageTypeIcon = (msgType: MessageType) => {
    switch (msgType) {
      case 'json': return <FileJson className="w-3 h-3 text-amber-400" />
      case 'binary': return <Binary className="w-3 h-3 text-purple-400" />
      default: return null
    }
  }

  return (
    <div className="glass-card rounded-2xl border border-black/5 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="bg-zinc-900 p-4 border-b border-white/5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Traffic Monitor</h3>
            <span className="text-[10px] text-zinc-500">{filteredLogs.length} / {logs.length}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Stats */}
            <div className="hidden sm:flex items-center gap-3 text-[9px] font-mono mr-3">
              <span className="text-cyan-400">↑{stats.sent}</span>
              <span className="text-emerald-400">↓{stats.received}</span>
              {stats.errors > 0 && <span className="text-red-400">⚠{stats.errors}</span>}
            </div>

            {/* Auto-scroll toggle */}
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-lg transition-all ${
                autoScroll ? 'bg-cyan-500/20 text-cyan-400' : 'text-zinc-500 hover:text-white'
              }`}
              title={autoScroll ? 'Auto-scroll ON' : 'Auto-scroll OFF'}
            >
              <ArrowDown className="w-4 h-4" />
            </button>

            {/* Export */}
            <button
              onClick={exportLogs}
              disabled={logs.length === 0}
              className="p-1.5 text-zinc-500 hover:text-white transition-colors disabled:opacity-30"
              title="Export logs"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Clear */}
            <button
              onClick={onClear}
              disabled={logs.length === 0}
              className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-30"
              title="Clear logs"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
            {(['all', 'sent', 'received', 'info', 'error'] as FilterType[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all ${
                  filter === f 
                    ? 'bg-zinc-700 text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="flex-1 max-w-[200px] px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Log List */}
      <div className="flex-grow overflow-y-auto p-4 space-y-1 font-mono scrollbar-thin scrollbar-thumb-zinc-800">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 py-20">
            <History className="w-12 h-12 opacity-10" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-light">
              {logs.length === 0 ? 'No data streams detected' : 'No matching logs'}
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const styles = getTypeStyles(log.type)
            const isJson = log.messageType === 'json'
            const isExpanded = expandedIds.has(log.id)
            
            return (
              <div
                key={log.id}
                className="group border-b border-white/[0.03] pb-2 last:border-0 hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2"
              >
                <div className="flex gap-3">
                  {/* Time */}
                  <div className="text-[10px] text-zinc-600 mt-1 whitespace-nowrap w-16 shrink-0">
                    {log.time}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${styles.badge}`}>
                        {getTypeLabel(log.type)}
                      </span>
                      {getMessageTypeIcon(log.messageType)}
                      <span className="text-[9px] text-zinc-600">{log.size}B</span>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        {isJson && (
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="text-zinc-500 hover:text-amber-400 transition-colors"
                            title="Expand JSON"
                          >
                            {isExpanded ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          </button>
                        )}
                        <button
                          onClick={() => copyMessage(log.message, log.id)}
                          className="text-zinc-500 hover:text-white transition-colors"
                          title="Copy"
                        >
                          {copiedId === log.id ? (
                            <Check className="w-3 h-3 text-emerald-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Message */}
                    <div className={`text-xs break-all leading-relaxed ${styles.text} ${
                      log.type === 'error' ? 'italic' : ''
                    }`}>
                      {isJson && isExpanded ? (
                        <pre className="whitespace-pre-wrap bg-zinc-900/50 p-2 rounded mt-1 text-[11px]">
                          {formatJson(log.message)}
                        </pre>
                      ) : (
                        <span className="whitespace-pre-wrap">{log.message}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  )
}
