'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { Braces, Copy, Check, Trash2, AlertTriangle, CheckCircle2, Minimize2, Download, Upload, BookOpen, Wrench, ChevronRight, ChevronDown, Eye, Code } from 'lucide-react'
import Link from 'next/link'

const SAMPLE_JSON = `{
  "project": "deops",
  "version": "2.4.0",
  "infrastructure": {
    "provider": "cloudflare",
    "type": "edge-workers",
    "regions": ["ap-east-1", "us-west-2", "eu-central-1"]
  },
  "services": [
    {
      "name": "monitoring",
      "status": "operational",
      "uptime": 99.97
    },
    {
      "name": "ci-pipeline",
      "status": "operational",
      "uptime": 99.85
    }
  ],
  "ai_config": {
    "model": "gpt-4-turbo",
    "auto_remediation": true,
    "alert_threshold": 0.85
  }
}`

// ─── Smart JSON Repair ───
function repairJson(input: string): { repaired: string; fixes: string[] } {
  const fixes: string[] = []
  let s = input.trim()

  // Remove JS-style single-line comments (// ...)
  const commentSingle = s.match(/\/\/.*/g)
  if (commentSingle && commentSingle.length > 0) {
    s = s.replace(/\/\/.*/g, '')
    fixes.push(`Removed ${commentSingle.length} single-line comment(s)`)
  }

  // Remove JS-style multi-line comments (/* ... */)
  const commentMulti = s.match(/\/\*[\s\S]*?\*\//g)
  if (commentMulti && commentMulti.length > 0) {
    s = s.replace(/\/\*[\s\S]*?\*\//g, '')
    fixes.push(`Removed ${commentMulti.length} multi-line comment(s)`)
  }

  // Replace single quotes with double quotes (for strings)
  if (s.includes("'")) {
    // Carefully replace single-quoted strings
    s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"')
    fixes.push('Converted single quotes → double quotes')
  }

  // Add quotes to unquoted keys: {key: value} → {"key": value}
  const unquotedKeyPattern = /(?<=[\{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g
  const unquotedMatches = s.match(unquotedKeyPattern)
  if (unquotedMatches && unquotedMatches.length > 0) {
    s = s.replace(unquotedKeyPattern, '"$1":')
    fixes.push(`Quoted ${unquotedMatches.length} unquoted key(s)`)
  }

  // Remove trailing commas before } or ]
  const trailingBefore = s
  s = s.replace(/,\s*([}\]])/g, '$1')
  if (s !== trailingBefore) {
    fixes.push('Removed trailing comma(s)')
  }

  // Replace undefined/NaN/Infinity with null
  const specialValuesBefore = s
  s = s.replace(/\bundefined\b/g, 'null')
  s = s.replace(/\bNaN\b/g, 'null')
  s = s.replace(/\bInfinity\b/g, 'null')
  if (s !== specialValuesBefore) {
    fixes.push('Replaced undefined/NaN/Infinity → null')
  }

  // Replace Python types with JSON types
  const pythonTypesBefore = s
  s = s.replace(/\bTrue\b/g, 'true')
  s = s.replace(/\bFalse\b/g, 'false')
  s = s.replace(/\bNone\b/g, 'null')
  if (s !== pythonTypesBefore) {
    fixes.push('Replaced Python-style True/False/None → true/false/null')
  }

  // Add missing commas between objects/arrays (e.g., } { -> }, {)
  const missingCommaObjPattern = /([}\]])\s+([{\[])/g
  const missingCommasObj = s.match(missingCommaObjPattern)
  if (missingCommasObj && missingCommasObj.length > 0) {
    s = s.replace(missingCommaObjPattern, '$1, $2')
    fixes.push(`Added ${missingCommasObj.length} missing comma(s) between structures`)
  }

  // Add missing commas between key-value pairs (e.g., "a": 1 "b": 2 -> "a": 1, "b": 2)
  const missingCommaValPattern = /([}\]"el0-9])\s+(?=")/g
  const missingCommasVal = s.match(missingCommaValPattern)
  if (missingCommasVal && missingCommasVal.length > 0) {
    s = s.replace(missingCommaValPattern, '$1, ')
    fixes.push(`Added ${missingCommasVal.length} missing comma(s) before keys/values`)
  }

  // Convert template literals (backticks) to double quotes
  if (s.includes('`')) {
    s = s.replace(/`([^`\\]*(?:\\.[^`\\]*)*)`/g, '"$1"')
    fixes.push('Converted template literals (backticks) → double quotes')
  }

  // Fix numbers with leading zeros (but not decimals like 0.1)
  const leadingZeroPattern = /(?<=[:[,]\s*)0+(?=[1-9]\d*(\.|$|[^.]))/g
  if (s.match(leadingZeroPattern)) {
    s = s.replace(leadingZeroPattern, '')
    fixes.push('Removed leading zeros from number(s)')
  }

  // Convert hex to decimal
  const hexPattern = /(?<=[:[,]\s*)0x([0-9a-fA-F]+)/g
  const hexMatches = s.match(hexPattern)
  if (hexMatches) {
    s = s.replace(hexPattern, (_match, hex) => parseInt(hex, 16).toString())
    fixes.push(`Converted ${hexMatches.length} hex number(s) → decimal`)
  }

  // Fix unquoted word values (excluding booleans and null)
  const unquotedValPattern = /(?<=:\s*)(?!(?:true|false|null|undefined|NaN))([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*[,}\]])/g
  const unquotedValMatches = s.match(unquotedValPattern)
  if (unquotedValMatches) {
    s = s.replace(unquotedValPattern, '"$1"')
    fixes.push(`Quoted ${unquotedValMatches.length} unquoted string value(s)`)
  }

  // ─── Bracket Balancing (position-tracked, handles both missing & extra) ───
  const openerStack: { ch: string; pos: number }[] = []
  const unmatchedClosers: number[] = [] // positions of extra ] or }
  let inString = false
  let escaped = false

  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\' && inString) { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue

    if (ch === '{' || ch === '[') {
      openerStack.push({ ch, pos: i })
    } else if (ch === '}') {
      if (openerStack.length > 0 && openerStack[openerStack.length - 1].ch === '{') {
        openerStack.pop()
      } else {
        unmatchedClosers.push(i)
      }
    } else if (ch === ']') {
      if (openerStack.length > 0 && openerStack[openerStack.length - 1].ch === '[') {
        openerStack.pop()
      } else {
        unmatchedClosers.push(i)
      }
    }
  }

  if (unmatchedClosers.length > 0) {
    const removed = unmatchedClosers.map(p => s[p]).join('')
    for (let i = unmatchedClosers.length - 1; i >= 0; i--) {
      const pos = unmatchedClosers[i]
      s = s.substring(0, pos) + s.substring(pos + 1)
    }
    fixes.push(`Removed ${unmatchedClosers.length} extra bracket(s) "${removed}"`)
  }

  if (openerStack.length > 0) {
    const closers = openerStack.map(o => o.ch === '{' ? '}' : ']').reverse().join('')
    s += closers
    fixes.push(`Added ${openerStack.length} missing bracket(s) "${closers}"`)
  }

  s = s.trim()

  return { repaired: s, fixes }
}

// ─── Diff Engine ───
interface DiffLine {
  text: string
  type: 'same' | 'added' | 'removed'
}

function computeDiff(original: string, repaired: string): DiffLine[] {
  const origLines = original.split('\n')
  const repLines = repaired.split('\n')
  const result: DiffLine[] = []

  const maxLen = Math.max(origLines.length, repLines.length)

  // Simple line-by-line diff
  let oi = 0, ri = 0
  while (oi < origLines.length || ri < repLines.length) {
    const ol = oi < origLines.length ? origLines[oi] : undefined
    const rl = ri < repLines.length ? repLines[ri] : undefined

    if (ol === rl) {
      result.push({ text: rl!, type: 'same' })
      oi++; ri++
    } else if (ol !== undefined && rl !== undefined) {
      // Modified line: show as removed then added
      result.push({ text: ol, type: 'removed' })
      result.push({ text: rl, type: 'added' })
      oi++; ri++
    } else if (ol !== undefined) {
      result.push({ text: ol, type: 'removed' })
      oi++
    } else if (rl !== undefined) {
      result.push({ text: rl, type: 'added' })
      ri++
    }
  }
  return result
}

// ─── Collapsible Tree View ───
function JsonTreeNode({ name, value, depth = 0, defaultOpen = true }: {
  name?: string
  value: any
  depth?: number
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen && depth < 3)

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)
  const isExpandable = isObject || isArray

  const indent = depth * 20

  if (!isExpandable) {
    // Leaf node
    let displayValue: React.ReactNode
    let colorClass = 'text-zinc-800'
    if (typeof value === 'string') {
      colorClass = 'text-emerald-700'
      displayValue = `"${value}"`
    } else if (typeof value === 'number') {
      colorClass = 'text-blue-700'
      displayValue = String(value)
    } else if (typeof value === 'boolean') {
      colorClass = 'text-purple-700'
      displayValue = String(value)
    } else if (value === null) {
      colorClass = 'text-red-500'
      displayValue = 'null'
    } else {
      displayValue = String(value)
    }

    return (
      <div className="flex items-baseline py-[2px] hover:bg-zinc-50 rounded transition-colors" style={{ paddingLeft: indent + 24 }}>
        {name !== undefined && (
          <span className="text-zinc-500 font-semibold mr-1">&quot;{name}&quot;<span className="text-zinc-400">:</span> </span>
        )}
        <span className={`${colorClass} font-mono`}>{displayValue}</span>
      </div>
    )
  }

  const entries = isArray ? value.map((v: any, i: number) => [i, v]) : Object.entries(value)
  const bracket = isArray ? ['[', ']'] : ['{', '}']
  const count = entries.length

  return (
    <div>
      <div
        className="flex items-center py-[2px] hover:bg-zinc-50 rounded cursor-pointer select-none group transition-colors"
        style={{ paddingLeft: indent }}
        onClick={() => setOpen(!open)}
      >
        <span className="w-5 h-5 flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-emerald-600 transition-colors">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        {name !== undefined && (
          <span className="text-zinc-500 font-semibold mr-1">&quot;{name}&quot;<span className="text-zinc-400">:</span> </span>
        )}
        <span className="text-zinc-400 font-mono">{bracket[0]}</span>
        {!open && (
          <>
            <span className="text-zinc-300 font-mono mx-1">…</span>
            <span className="text-zinc-400 font-mono">{bracket[1]}</span>
            <span className="text-[10px] text-zinc-300 ml-2 font-mono">{count} {isArray ? 'items' : 'keys'}</span>
          </>
        )}
      </div>
      {open && (
        <>
          {entries.map((entry: any, idx: number) => {
            const key = entry[0]
            const val = entry[1]
            return (
              <JsonTreeNode
                key={isArray ? idx : key}
                name={isArray ? undefined : key}
                value={val}
                depth={depth + 1}
                defaultOpen={depth < 2}
              />
            )
          })}
          <div className="text-zinc-400 font-mono py-[2px]" style={{ paddingLeft: indent + 24 }}>
            {bracket[1]}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Stats ───
function getJsonStats(value: string): { keys: number; depth: number; size: string; type: string } | null {
  try {
    const parsed = JSON.parse(value)
    const bytes = new TextEncoder().encode(value).length
    const size = bytes > 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`
    let maxDepth = 0
    let keyCount = 0
    function walk(obj: any, depth: number) {
      if (depth > maxDepth) maxDepth = depth
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj)) {
          obj.forEach(item => walk(item, depth + 1))
        } else {
          const keys = Object.keys(obj)
          keyCount += keys.length
          keys.forEach(k => walk(obj[k], depth + 1))
        }
      }
    }
    walk(parsed, 0)
    const type = Array.isArray(parsed) ? 'Array' : typeof parsed === 'object' && parsed !== null ? 'Object' : typeof parsed
    return { keys: keyCount, depth: maxDepth, size, type }
  } catch {
    return null
  }
}

// ─── Main Component ───
type ViewMode = 'editor' | 'tree' | 'diff'

export default function JSONClient({ dict }: { dict: any }) {
  const [json, setJson] = useState('')
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('editor')
  const [diffData, setDiffData] = useState<DiffLine[] | null>(null)
  const [repairFixes, setRepairFixes] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumberRef = useRef<HTMLDivElement>(null)

  const validate = useCallback((value: string) => {
    if (!value.trim()) {
      setStatus('idle')
      setErrorMsg('')
      return
    }
    try {
      JSON.parse(value)
      setStatus('valid')
      setErrorMsg('')
    } catch (e: any) {
      setStatus('invalid')
      setErrorMsg(e.message)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setJson(value)
    validate(value)
    // Reset diff view if user edits
    if (viewMode === 'diff') setViewMode('editor')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const ta = textareaRef.current
      if (!ta) return
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const value = ta.value
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      setJson(newValue)
      validate(newValue)
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  const handleScroll = () => {
    if (textareaRef.current && lineNumberRef.current) {
      lineNumberRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const lineCount = useMemo(() => json ? json.split('\n').length : 1, [json])
  const stats = useMemo(() => getJsonStats(json), [json])
  const parsedJson = useMemo(() => {
    try { return JSON.parse(json) } catch { return null }
  }, [json])

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(json)
      const formatted = JSON.stringify(parsed, null, 2)
      setJson(formatted)
      setStatus('valid')
      setErrorMsg('')
    } catch (e: any) {
      setStatus('invalid')
      setErrorMsg(e.message)
    }
  }

  const minifyJSON = () => {
    try {
      const parsed = JSON.parse(json)
      const minified = JSON.stringify(parsed)
      setJson(minified)
      setStatus('valid')
      setErrorMsg('')
    } catch (e: any) {
      setStatus('invalid')
      setErrorMsg(e.message)
    }
  }

  const smartRepair = () => {
    if (!json.trim()) return
    const originalFormatted = json
    const { repaired, fixes } = repairJson(json)

    try {
      // Try to parse the repaired JSON
      const parsed = JSON.parse(repaired)
      const formatted = JSON.stringify(parsed, null, 2)

      // Compute diff between original input and formatted output
      const diff = computeDiff(originalFormatted, formatted)

      setRepairFixes(fixes)
      setDiffData(diff)
      setJson(formatted)
      setStatus('valid')
      setErrorMsg('')
      setViewMode('diff')
    } catch (e: any) {
      // Still invalid after repair
      setRepairFixes(fixes)
      setStatus('invalid')
      setErrorMsg(`Repair attempted (${fixes.length} fix${fixes.length !== 1 ? 'es' : ''}) but JSON is still invalid: ${e.message}`)
    }
  }

  const clearAll = () => {
    setJson('')
    setStatus('idle')
    setErrorMsg('')
    setDiffData(null)
    setRepairFixes([])
    setViewMode('editor')
  }

  const loadSample = () => {
    setJson(SAMPLE_JSON)
    setStatus('valid')
    setErrorMsg('')
    setViewMode('editor')
    setDiffData(null)
  }

  const copyToClipboard = () => {
    if (!json) return
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadJSON = () => {
    if (!json) return
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `deops-json-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.txt'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result as string
        setJson(content)
        validate(content)
        setViewMode('editor')
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-5xl mx-auto">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-[11px] font-mono uppercase tracking-widest text-zinc-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/services" className="hover:text-emerald-600 transition-colors">Matrix</Link>
          <span>/</span>
          <span className="text-zinc-900 border-b border-emerald-500/30 font-bold">JSON-NODE</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 group transition-all">
              <Braces className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3 italic">
                {dict.tools.json_title}
              </h1>
              <p className="text-zinc-500 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-1">{dict.tools.json_desc}</p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button onClick={loadSample}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all active:scale-95">
            <BookOpen className="w-3.5 h-3.5" />
            {dict.tools.json.sample || 'Sample'}
          </button>
          <button onClick={handleFileUpload}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all active:scale-95">
            <Upload className="w-3.5 h-3.5" />
            {dict.tools.json.upload || 'Upload'}
          </button>
          <button onClick={downloadJSON} disabled={!json || status === 'invalid'}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" />
            {dict.tools.json.download || 'Download'}
          </button>

          <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-1"></div>

          {/* Smart Repair Button */}
          <button onClick={smartRepair} disabled={!json || status !== 'invalid'}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
            <Wrench className="w-3.5 h-3.5" />
            {dict.tools.json.repair || 'Repair'}
          </button>

          <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-1"></div>

          <button onClick={copyToClipboard} disabled={!json}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? dict.tools.json.copied : (dict.tools.json.copy || 'Copy')}
          </button>
          <button onClick={clearAll} disabled={!json}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
            <Trash2 className="w-3.5 h-3.5" />
            {dict.tools.json.clear}
          </button>
        </div>

        {/* Main Editor Card */}
        <div className="glass-card rounded-2xl border border-zinc-200/50 shadow-2xl overflow-hidden relative">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-100 bg-white/40">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40"></div>
              </div>

              {/* View mode tabs */}
              <div className="flex gap-1 bg-zinc-100 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('editor')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${viewMode === 'editor' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Code className="w-3 h-3" />
                  <span className="hidden sm:inline">Editor</span>
                </button>
                <button
                  onClick={() => setViewMode('tree')}
                  disabled={status !== 'valid'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed ${viewMode === 'tree' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Eye className="w-3 h-3" />
                  <span className="hidden sm:inline">Tree</span>
                </button>
                {diffData && (
                  <button
                    onClick={() => setViewMode('diff')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${viewMode === 'diff' ? 'bg-white text-amber-700 shadow-sm' : 'text-amber-400 hover:text-amber-600'}`}
                  >
                    <Wrench className="w-3 h-3" />
                    <span className="hidden sm:inline">Diff</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={formatJSON} disabled={!json}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-emerald-500/10">
                {dict.tools.json.format}
              </button>
              <button onClick={minifyJSON} disabled={!json}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1.5"
                title={dict.tools.json.minify}>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.tools.json.minify}</span>
              </button>
            </div>
          </div>

          {/* ─── Editor View ─── */}
          {viewMode === 'editor' && (
            <div className="relative flex">
              <div ref={lineNumberRef}
                className="hidden sm:flex flex-col items-end px-3 py-6 bg-zinc-50/50 border-r border-zinc-100 text-[11px] font-mono text-zinc-300 select-none overflow-hidden leading-relaxed shrink-0 min-w-[3rem]"
                style={{ height: json ? undefined : '400px' }}>
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="leading-relaxed">{i + 1}</div>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                value={json}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                onScroll={handleScroll}
                placeholder={dict.tools.json.placeholder}
                spellCheck={false}
                className="w-full min-h-[300px] sm:min-h-[400px] p-6 bg-transparent text-zinc-900 font-mono text-[13px] leading-relaxed focus:outline-none resize-y placeholder:text-zinc-300 selection:bg-emerald-100"
                style={{ tabSize: 2 }}
              />
            </div>
          )}

          {/* ─── Tree View ─── */}
          {viewMode === 'tree' && parsedJson !== null && (
            <div className="min-h-[300px] sm:min-h-[400px] max-h-[600px] overflow-auto p-6 font-mono text-[13px] leading-relaxed">
              <JsonTreeNode value={parsedJson} defaultOpen={true} />
            </div>
          )}

          {/* ─── Diff View ─── */}
          {viewMode === 'diff' && diffData && (
            <div className="min-h-[300px] sm:min-h-[400px] max-h-[600px] overflow-auto">
              {/* Repair summary banner */}
              {repairFixes.length > 0 && (
                <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                      {dict.tools.json.repair_summary || `${repairFixes.length} fix(es) applied`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {repairFixes.map((fix, i) => (
                      <span key={i} className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        {fix}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Diff lines */}
              <div className="p-4 font-mono text-[12px] leading-[1.8]">
                {diffData.map((line, idx) => {
                  if (line.type === 'same') {
                    return (
                      <div key={idx} className="flex">
                        <span className="w-10 text-right pr-3 text-zinc-300 select-none shrink-0">{idx + 1}</span>
                        <span className="text-zinc-600 whitespace-pre">{line.text}</span>
                      </div>
                    )
                  }
                  if (line.type === 'removed') {
                    return (
                      <div key={idx} className="flex bg-red-50 border-l-2 border-red-400 rounded-r">
                        <span className="w-10 text-right pr-3 text-red-300 select-none shrink-0">−</span>
                        <span className="text-red-700 whitespace-pre line-through opacity-70">{line.text}</span>
                      </div>
                    )
                  }
                  // added
                  return (
                    <div key={idx} className="flex bg-emerald-50 border-l-2 border-emerald-400 rounded-r">
                      <span className="w-10 text-right pr-3 text-emerald-400 select-none shrink-0">+</span>
                      <span className="text-emerald-800 whitespace-pre font-semibold">{line.text}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Stats + Validation Footer */}
          <div className={`px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t transition-colors ${
            status === 'valid' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' :
            status === 'invalid' ? 'bg-red-50/50 border-red-100 text-red-600' :
            'bg-zinc-50/50 border-zinc-100 text-zinc-400'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              {status === 'valid' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
               status === 'invalid' ? <AlertTriangle className="w-4 h-4 shrink-0" /> :
               <Braces className="w-4 h-4 shrink-0" />}
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider shrink-0">
                {status === 'valid' ? dict.tools.json.valid :
                 status === 'invalid' ? dict.tools.json.invalid : "IDLE"}
              </span>
              {status === 'invalid' && errorMsg && (
                <span className="text-[10px] font-mono opacity-70 break-all line-clamp-2 min-w-0">
                  — {errorMsg}
                </span>
              )}
            </div>
            {stats && status === 'valid' && (
              <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-600/70 uppercase tracking-wider shrink-0">
                <span>{stats.type}</span>
                <span className="text-emerald-300">•</span>
                <span>{stats.keys} keys</span>
                <span className="text-emerald-300">•</span>
                <span>depth {stats.depth}</span>
                <span className="text-emerald-300">•</span>
                <span>{stats.size}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
