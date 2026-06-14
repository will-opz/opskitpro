'use client'

import { useState, useMemo } from 'react'
import { GitCompare, Upload, Trash2, ChevronRight, ChevronDown, Equal, Plus, Minus, RefreshCw } from 'lucide-react'

interface DiffResult {
  path: string
  type: 'added' | 'removed' | 'changed' | 'same'
  leftValue?: any
  rightValue?: any
}

function deepDiff(left: any, right: any, path = ''): DiffResult[] {
  const results: DiffResult[] = []

  // Both null/undefined
  if (left === right) {
    return [{ path: path || '(root)', type: 'same', leftValue: left, rightValue: right }]
  }

  // Type mismatch
  if (typeof left !== typeof right) {
    return [{ path: path || '(root)', type: 'changed', leftValue: left, rightValue: right }]
  }

  // Arrays
  if (Array.isArray(left) && Array.isArray(right)) {
    const maxLen = Math.max(left.length, right.length)
    for (let i = 0; i < maxLen; i++) {
      const itemPath = path ? `${path}[${i}]` : `[${i}]`
      if (i >= left.length) {
        results.push({ path: itemPath, type: 'added', rightValue: right[i] })
      } else if (i >= right.length) {
        results.push({ path: itemPath, type: 'removed', leftValue: left[i] })
      } else {
        results.push(...deepDiff(left[i], right[i], itemPath))
      }
    }
    return results
  }

  // Objects
  if (typeof left === 'object' && left !== null && typeof right === 'object' && right !== null) {
    const allKeys = new Set([...Object.keys(left), ...Object.keys(right)])
    for (const key of allKeys) {
      const keyPath = path ? `${path}.${key}` : key
      if (!(key in left)) {
        results.push({ path: keyPath, type: 'added', rightValue: right[key] })
      } else if (!(key in right)) {
        results.push({ path: keyPath, type: 'removed', leftValue: left[key] })
      } else {
        results.push(...deepDiff(left[key], right[key], keyPath))
      }
    }
    return results
  }

  // Primitives
  if (left !== right) {
    return [{ path: path || '(root)', type: 'changed', leftValue: left, rightValue: right }]
  }

  return [{ path: path || '(root)', type: 'same', leftValue: left, rightValue: right }]
}

interface JsonDiffPanelProps {
  leftJson: string
  dict: any
}

export function JsonDiffPanel({ leftJson, dict }: JsonDiffPanelProps) {
  const [rightJson, setRightJson] = useState('')
  const [showSame, setShowSame] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

  const diffResults = useMemo(() => {
    if (!leftJson.trim() || !rightJson.trim()) return null
    try {
      const left = JSON.parse(leftJson)
      const right = JSON.parse(rightJson)
      return deepDiff(left, right)
    } catch {
      return null
    }
  }, [leftJson, rightJson])

  const stats = useMemo(() => {
    if (!diffResults) return null
    return {
      added: diffResults.filter(d => d.type === 'added').length,
      removed: diffResults.filter(d => d.type === 'removed').length,
      changed: diffResults.filter(d => d.type === 'changed').length,
      same: diffResults.filter(d => d.type === 'same').length,
    }
  }, [diffResults])

  const filteredResults = useMemo(() => {
    if (!diffResults) return []
    return showSame ? diffResults : diffResults.filter(d => d.type !== 'same')
  }, [diffResults, showSame])

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        setRightJson(ev.target?.result as string)
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const swapSides = () => {
    // This would require parent component cooperation
    // For now, just clear right side
    setRightJson(leftJson)
  }

  const formatValue = (val: any): string => {
    if (val === undefined) return 'undefined'
    if (typeof val === 'string') return `"${val}"`
    if (typeof val === 'object') return JSON.stringify(val, null, 2)
    return String(val)
  }

  const getTypeIcon = (type: DiffResult['type']) => {
    switch (type) {
      case 'added': return <Plus className="w-3.5 h-3.5 text-emerald-600" />
      case 'removed': return <Minus className="w-3.5 h-3.5 text-red-600" />
      case 'changed': return <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
      case 'same': return <Equal className="w-3.5 h-3.5 text-zinc-400" />
    }
  }

  const getTypeBg = (type: DiffResult['type']) => {
    switch (type) {
      case 'added': return 'bg-emerald-50 border-emerald-200'
      case 'removed': return 'bg-red-50 border-red-200'
      case 'changed': return 'bg-amber-50 border-amber-200'
      case 'same': return 'bg-zinc-50 border-zinc-100'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white">
        <div className="flex items-center gap-2 text-zinc-500">
          <GitCompare className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Semantic Diff</span>
        </div>
        
        {stats && (
          <div className="flex items-center gap-3 text-[10px] font-mono">
            <span className="text-emerald-600 flex items-center gap-1">
              <Plus className="w-3 h-3" /> {stats.added}
            </span>
            <span className="text-red-600 flex items-center gap-1">
              <Minus className="w-3 h-3" /> {stats.removed}
            </span>
            <span className="text-amber-600 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> {stats.changed}
            </span>
            <label className="flex items-center gap-1 text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showSame}
                onChange={(e) => setShowSame(e.target.checked)}
                className="w-3 h-3 rounded border-zinc-300"
              />
              Show same ({stats.same})
            </label>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-zinc-100 overflow-hidden">
        {/* Left side - from parent */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">LEFT (Original)</span>
          </div>
          <pre className="flex-1 p-4 overflow-auto font-mono text-[11px] leading-relaxed text-zinc-600 bg-white">
            {leftJson || <span className="text-zinc-300 italic">Input JSON in editor</span>}
          </pre>
        </div>

        {/* Right side - comparison target */}
        <div className="flex flex-col overflow-hidden">
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">RIGHT (Compare)</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleFileUpload}
                className="flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-[10px] font-mono text-blue-600 hover:bg-blue-50 transition-all"
              >
                <Upload className="w-3 h-3" /> Load
              </button>
              <button
                onClick={() => setRightJson('')}
                disabled={!rightJson}
                className="p-1 text-zinc-400 hover:text-red-500 disabled:opacity-30 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <textarea
            value={rightJson}
            onChange={(e) => setRightJson(e.target.value)}
            placeholder="Paste JSON to compare, or load a file..."
            className="flex-1 p-4 font-mono text-[11px] leading-relaxed text-zinc-600 bg-white resize-none focus:outline-none placeholder:text-zinc-300"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Diff Results */}
      {diffResults && filteredResults.length > 0 && (
        <div className="border-t border-zinc-200 max-h-[300px] overflow-auto">
          <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100 sticky top-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              {filteredResults.length} Difference{filteredResults.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="divide-y divide-zinc-50">
            {filteredResults.map((diff, idx) => (
              <div key={idx} className={`px-4 py-2 ${getTypeBg(diff.type)} border-l-2`}>
                <div className="flex items-start gap-2">
                  {getTypeIcon(diff.type)}
                  <div className="flex-1 min-w-0">
                    <code className="text-[11px] font-mono font-semibold text-zinc-700">{diff.path}</code>
                    {diff.type === 'changed' && (
                      <div className="mt-1 grid grid-cols-2 gap-2 text-[10px] font-mono">
                        <div className="p-1.5 bg-red-100 rounded text-red-700 overflow-auto max-h-20">
                          {formatValue(diff.leftValue)}
                        </div>
                        <div className="p-1.5 bg-emerald-100 rounded text-emerald-700 overflow-auto max-h-20">
                          {formatValue(diff.rightValue)}
                        </div>
                      </div>
                    )}
                    {diff.type === 'added' && (
                      <div className="mt-1 p-1.5 bg-emerald-100 rounded text-[10px] font-mono text-emerald-700 overflow-auto max-h-20">
                        {formatValue(diff.rightValue)}
                      </div>
                    )}
                    {diff.type === 'removed' && (
                      <div className="mt-1 p-1.5 bg-red-100 rounded text-[10px] font-mono text-red-700 overflow-auto max-h-20">
                        {formatValue(diff.leftValue)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No diff state */}
      {leftJson && rightJson && diffResults && filteredResults.length === 0 && (
        <div className="border-t border-zinc-200 px-4 py-8 text-center">
          <Equal className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm text-zinc-500 font-mono">No differences found</p>
        </div>
      )}
    </div>
  )
}
