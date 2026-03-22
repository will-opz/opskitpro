'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Braces, Copy, Check, Trash2, AlertTriangle, CheckCircle2, Minimize2, Download, Upload, BookOpen } from 'lucide-react'
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

export default function JSONClient({ dict }: { dict: any }) {
  const [json, setJson] = useState('')
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
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
      // restore cursor position after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2
      })
    }
  }

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineNumberRef.current) {
      lineNumberRef.current.scrollTop = textareaRef.current.scrollTop
    }
  }

  const lineCount = useMemo(() => {
    if (!json) return 1
    return json.split('\n').length
  }, [json])

  const stats = useMemo(() => getJsonStats(json), [json])

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

  const clearAll = () => {
    setJson('')
    setStatus('idle')
    setErrorMsg('')
  }

  const loadSample = () => {
    setJson(SAMPLE_JSON)
    setStatus('valid')
    setErrorMsg('')
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
      }
      reader.readAsText(file)
    }
    input.click()
  }

  return (
    <div className="min-h-screen pt-12 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
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
          <button
            onClick={loadSample}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {dict.tools.json.sample || 'Sample'}
          </button>
          <button
            onClick={handleFileUpload}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            {dict.tools.json.upload || 'Upload'}
          </button>
          <button
            onClick={downloadJSON}
            disabled={!json || status === 'invalid'}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Download className="w-3.5 h-3.5" />
            {dict.tools.json.download || 'Download'}
          </button>
          
          <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-1"></div>
          
          <button
            onClick={copyToClipboard}
            disabled={!json}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? dict.tools.json.copied : (dict.tools.json.copy || 'Copy')}
          </button>
          <button
            onClick={clearAll}
            disabled={!json}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {dict.tools.json.clear}
          </button>
        </div>

        {/* Main Editor */}
        <div className="glass-card rounded-2xl border border-zinc-200/50 shadow-2xl overflow-hidden relative">
          {/* Editor toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-100 bg-white/40">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 items-center">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40"></div>
              </div>
              <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest hidden sm:flex items-center gap-2">
                INPUT.JSON
                {json && <span className="text-zinc-300">• L{lineCount}</span>}
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={formatJSON}
                disabled={!json}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-emerald-500/10"
              >
                {dict.tools.json.format}
              </button>
              <button
                onClick={minifyJSON}
                disabled={!json}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1.5"
                title={dict.tools.json.minify}
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{dict.tools.json.minify}</span>
              </button>
            </div>
          </div>

          {/* Editor body with line numbers */}
          <div className="relative flex">
            {/* Line numbers */}
            <div
              ref={lineNumberRef}
              className="hidden sm:flex flex-col items-end px-3 py-6 bg-zinc-50/50 border-r border-zinc-100 text-[11px] font-mono text-zinc-300 select-none overflow-hidden leading-relaxed shrink-0 min-w-[3rem]"
              style={{ height: json ? undefined : '400px' }}
            >
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="leading-relaxed">{i + 1}</div>
              ))}
            </div>

            {/* Textarea */}
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

          {/* Stats + Validation Footer */}
          <div className={`px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t transition-colors ${
            status === 'valid' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' :
            status === 'invalid' ? 'bg-red-50/50 border-red-100 text-red-600' :
            'bg-zinc-50/50 border-zinc-100 text-zinc-400'
          }`}>
            <div className="flex items-center gap-3">
              {status === 'valid' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
               status === 'invalid' ? <AlertTriangle className="w-4 h-4 shrink-0" /> :
               <Braces className="w-4 h-4 shrink-0" />}
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                {status === 'valid' ? dict.tools.json.valid : 
                 status === 'invalid' ? dict.tools.json.invalid : "IDLE"}
              </span>
              {status === 'invalid' && errorMsg && (
                <span className="text-[10px] font-mono opacity-70 break-all line-clamp-2">
                  — {errorMsg}
                </span>
              )}
            </div>

            {/* JSON Stats */}
            {stats && status === 'valid' && (
              <div className="flex items-center gap-3 text-[10px] font-mono text-emerald-600/70 uppercase tracking-wider">
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
