'use client'

import { useState, useEffect, useCallback } from 'react'
import { Terminal, Play, Clock, Hash, Zap, ChevronDown } from 'lucide-react'
import { useJqQuery, JQ_SNIPPETS } from '../hooks'
import type { JqResult } from '../hooks'

interface JqQueryPanelProps {
  inputJson: string
  onOutputChange?: (output: string) => void
  dict: any
}

export function JqQueryPanel({ inputJson, onOutputChange, dict }: JqQueryPanelProps) {
  const [filter, setFilter] = useState('.')
  const [result, setResult] = useState<JqResult | null>(null)
  const [showSnippets, setShowSnippets] = useState(false)
  const { runQuery, isLoading, isReady } = useJqQuery()

  // Auto-run query when input or filter changes (debounced)
  useEffect(() => {
    if (!isReady || !inputJson.trim()) return

    const timer = setTimeout(async () => {
      const res = await runQuery(inputJson, filter)
      setResult(res)
      if (!res.error && onOutputChange) {
        onOutputChange(res.output)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [inputJson, filter, isReady, runQuery, onOutputChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl + Enter to run immediately
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      runQuery(inputJson, filter).then(res => {
        setResult(res)
        if (!res.error && onOutputChange) {
          onOutputChange(res.output)
        }
      })
    }
  }

  const applySnippet = (snippetFilter: string) => {
    setFilter(snippetFilter)
    setShowSnippets(false)
  }

  return (
    <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50/80 to-white">
      {/* Query Input */}
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal className="w-4 h-4" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">JQ</span>
          </div>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter JQ filter (e.g., .items[].name)"
              className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-lg font-mono text-sm text-zinc-900 placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all"
              spellCheck={false}
            />
            {!isReady && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-zinc-200 border-t-emerald-500 rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Snippets dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSnippets(!showSnippets)}
              className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Snippets</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            
            {showSnippets && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="max-h-64 overflow-y-auto">
                  {JQ_SNIPPETS.map((snippet, i) => (
                    <button
                      key={i}
                      onClick={() => applySnippet(snippet.filter)}
                      className="w-full px-3 py-2 text-left hover:bg-emerald-50 transition-colors border-b border-zinc-50 last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-700">{snippet.label}</span>
                        <code className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {snippet.filter.length > 20 ? snippet.filter.slice(0, 20) + '...' : snippet.filter}
                        </code>
                      </div>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{snippet.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => runQuery(inputJson, filter).then(setResult)}
            disabled={!isReady || isLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            <Play className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Run</span>
          </button>
        </div>

        {/* Result stats */}
        {result && (
          <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
            {result.error ? (
              <span className="text-red-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                {result.error}
              </span>
            ) : (
              <>
                <span className="text-emerald-600 flex items-center gap-1">
                  <Hash className="w-3 h-3" />
                  {result.matchCount} {result.matchCount === 1 ? 'match' : 'matches'}
                </span>
                <span className="text-zinc-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {result.duration.toFixed(1)}ms
                </span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
