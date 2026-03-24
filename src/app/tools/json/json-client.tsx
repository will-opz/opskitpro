'use client'

import { useState, useCallback, useMemo } from 'react'
import { Braces, Copy, Check, Trash2, AlertTriangle, CheckCircle2, Minimize2, Download, Upload, BookOpen, Wrench, Eye, Code } from 'lucide-react'
import Link from 'next/link'

// Components
import { JsonEditor, JsonTreeNode, DiffView, computeDiff } from './components'
import type { DiffLine } from './components'

// Hooks
import { repairJson, getJsonStats } from './hooks/useJsonRepair'

const SAMPLE_JSON = `{
  "project": "OpsKitPro",
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

type ViewMode = 'editor' | 'tree' | 'diff'

export default function JSONClient({ dict }: { dict: any }) {
  const [json, setJson] = useState('')
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('editor')
  const [diffData, setDiffData] = useState<DiffLine[] | null>(null)
  const [repairFixes, setRepairFixes] = useState<string[]>([])

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

  const handleJsonChange = (value: string) => {
    setJson(value)
    // Reset diff view if user edits
    if (viewMode === 'diff') setViewMode('editor')
  }

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
      const parsed = JSON.parse(repaired)
      const formatted = JSON.stringify(parsed, null, 2)
      const diff = computeDiff(originalFormatted, formatted)

      setRepairFixes(fixes)
      setDiffData(diff)
      setJson(formatted)
      setStatus('valid')
      setErrorMsg('')
      setViewMode('diff')
    } catch (e: any) {
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
    a.download = `opskitpro-json-${Date.now()}.json`
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
        <nav className="flex items-center gap-2 mb-8 text-[11px] font-mono uppercase tracking-widest text-zinc-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-emerald-600 transition-colors">HOME</Link>
          <span className="text-zinc-300" aria-hidden="true">/</span>
          <Link href="/services" className="hover:text-emerald-600 transition-colors">MATRIX</Link>
          <span className="text-zinc-300" aria-hidden="true">/</span>
          <span className="text-zinc-900 border-b border-emerald-500/30 font-bold uppercase" aria-current="page">OPSKIT-NODE</span>
        </nav>

        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 group transition-all">
              <Braces className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3 italic">
                {dict.tools.json_title}
              </h1>
              <p className="text-zinc-500 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-1">{dict.tools.json_desc}</p>
            </div>
          </div>
        </header>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6" role="toolbar" aria-label="JSON actions">
          <button onClick={loadSample}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-all active:scale-95">
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            {dict.tools.json.sample || 'Sample'}
          </button>
          <button onClick={handleFileUpload}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all active:scale-95">
            <Upload className="w-3.5 h-3.5" aria-hidden="true" />
            {dict.tools.json.upload || 'Upload'}
          </button>
          <button onClick={downloadJSON} disabled={!json || status === 'invalid'}
            aria-disabled={!json || status === 'invalid'}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            {dict.tools.json.download || 'Download'}
          </button>

          <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-1" aria-hidden="true"></div>

          <button onClick={smartRepair} disabled={!json || status !== 'invalid'}
            aria-disabled={!json || status !== 'invalid'}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
            <Wrench className="w-3.5 h-3.5" aria-hidden="true" />
            {dict.tools.json.repair || 'Repair'}
          </button>

          <div className="hidden sm:block h-5 w-px bg-zinc-200 mx-1" aria-hidden="true"></div>

          <button onClick={copyToClipboard} disabled={!json}
            aria-disabled={!json}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:border-emerald-300 hover:text-emerald-700 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
            {copied ? dict.tools.json.copied : (dict.tools.json.copy || 'Copy')}
          </button>
          <button onClick={clearAll} disabled={!json}
            aria-disabled={!json}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-mono text-zinc-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed">
            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
            {dict.tools.json.clear}
          </button>
        </div>

        {/* Main Editor Card */}
        <main className="glass-card rounded-2xl border border-zinc-200/50 shadow-2xl overflow-hidden relative">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-zinc-100 bg-white/40">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5 items-center" aria-hidden="true">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/40"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/40"></div>
              </div>

              {/* View mode tabs */}
              <div className="flex gap-1 bg-zinc-100 rounded-lg p-0.5" role="tablist" aria-label="View mode">
                <button
                  role="tab"
                  aria-selected={viewMode === 'editor'}
                  onClick={() => setViewMode('editor')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${viewMode === 'editor' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Code className="w-3 h-3" aria-hidden="true" />
                  <span className="hidden sm:inline">Editor</span>
                </button>
                <button
                  role="tab"
                  aria-selected={viewMode === 'tree'}
                  aria-disabled={status !== 'valid'}
                  onClick={() => setViewMode('tree')}
                  disabled={status !== 'valid'}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed ${viewMode === 'tree' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Eye className="w-3 h-3" aria-hidden="true" />
                  <span className="hidden sm:inline">Tree</span>
                </button>
                {diffData && (
                  <button
                    role="tab"
                    aria-selected={viewMode === 'diff'}
                    onClick={() => setViewMode('diff')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${viewMode === 'diff' ? 'bg-white text-amber-700 shadow-sm' : 'text-amber-400 hover:text-amber-600'}`}
                  >
                    <Wrench className="w-3 h-3" aria-hidden="true" />
                    <span className="hidden sm:inline">Diff</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={formatJSON} disabled={!json}
                aria-disabled={!json}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-emerald-500/10">
                {dict.tools.json.format}
              </button>
              <button onClick={minifyJSON} disabled={!json}
                aria-disabled={!json}
                className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1.5"
                title={dict.tools.json.minify}>
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span className="hidden sm:inline">{dict.tools.json.minify}</span>
              </button>
            </div>
          </div>

          {/* Editor View */}
          {viewMode === 'editor' && (
            <JsonEditor
              value={json}
              onChange={handleJsonChange}
              onValidate={validate}
              placeholder={dict.tools.json.placeholder}
            />
          )}

          {/* Tree View */}
          {viewMode === 'tree' && parsedJson !== null && (
            <div className="min-h-[300px] sm:min-h-[400px] max-h-[600px] overflow-auto p-6 font-mono text-[13px] leading-relaxed">
              <JsonTreeNode value={parsedJson} defaultOpen={true} />
            </div>
          )}

          {/* Diff View */}
          {viewMode === 'diff' && diffData && (
            <DiffView diffData={diffData} repairFixes={repairFixes} dict={dict} />
          )}

          {/* Stats + Validation Footer */}
          <footer className={`px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t transition-colors ${
            status === 'valid' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' :
            status === 'invalid' ? 'bg-red-50/50 border-red-100 text-red-600' :
            'bg-zinc-50/50 border-zinc-100 text-zinc-400'
          }`} role="status" aria-live="polite">
            <div className="flex items-center gap-3 min-w-0">
              {status === 'valid' ? <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" /> :
               status === 'invalid' ? <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" /> :
               <Braces className="w-4 h-4 shrink-0" aria-hidden="true" />}
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
                <span className="text-emerald-300" aria-hidden="true">•</span>
                <span>{stats.keys} keys</span>
                <span className="text-emerald-300" aria-hidden="true">•</span>
                <span>depth {stats.depth}</span>
                <span className="text-emerald-300" aria-hidden="true">•</span>
                <span>{stats.size}</span>
              </div>
            )}
          </footer>
        </main>
      </div>
    </div>
  )
}
