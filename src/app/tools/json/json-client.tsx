'use client'

import { useState, useCallback } from 'react'
import { FileCode, Braces, Copy, Check, Trash2, Info, AlertTriangle, CheckCircle2, Minimize2 } from 'lucide-react'
import Link from 'next/link'

export default function JSONClient({ dict }: { dict: any }) {
  const [json, setJson] = useState('')
  const [status, setStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [copied, setCopied] = useState(false)

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

  const formatJSON = () => {
    try {
      const parsed = JSON.parse(json)
      const formatted = JSON.stringify(parsed, null, 2)
      setJson(formatted)
      setStatus('valid')
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(json)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 group transition-all">
              <Braces className="w-7 h-7 text-emerald-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3 italic">
                {dict.tools.json_title}
              </h1>
              <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] mt-1">{dict.tools.json_desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={copyToClipboard}
              disabled={!json}
              className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-700 hover:border-emerald-500/30 hover:bg-emerald-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-sm active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-zinc-400 group-hover:text-emerald-600" />}
              {copied ? dict.tools.json.copied : "COPY DATA"}
            </button>
            <button 
              onClick={clearAll}
              className="p-2.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90"
              title={dict.tools.json.clear}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Interface */}
        <div className="grid grid-cols-1 gap-6 relative">
          
          {/* Editor Area */}
          <div className="glass-card rounded-3xl border border-zinc-200/50 shadow-2xl overflow-hidden relative">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-white/40">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5 items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/30"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/30"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/30"></div>
                </div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <FileCode className="w-3 h-3" /> Input.json
                </span>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={formatJSON}
                  disabled={!json}
                  className="px-3 py-1.5 bg-emerald-600 text-zinc-900 rounded-lg text-xs font-bold hover:bg-emerald-500 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-emerald-500/10"
                >
                  {dict.tools.json.format}
                </button>
                <button 
                  onClick={minifyJSON}
                  disabled={!json}
                  className="px-3 py-1.5 bg-zinc-900 text-white rounded-lg text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-30"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={json}
                onChange={handleInput}
                placeholder={dict.tools.json.placeholder}
                spellCheck={false}
                className="w-full h-96 sm:h-[500px] p-8 bg-white/10 text-zinc-900 font-mono text-[13px] leading-relaxed focus:outline-none resize-none placeholder:text-zinc-300 selection:bg-emerald-100"
              />
              
              {/* Overlay Line Numbers simulation or decoration */}
              <div className="absolute top-0 right-0 p-4 pointer-events-none">
                 <Braces className="w-32 h-32 text-emerald-500 opacity-[0.03] absolute -top-8 -right-8 rotate-12" />
              </div>
            </div>

            {/* Validation Banner */}
            <div className={`px-8 py-3 flex items-center justify-between border-t transition-colors ${
              status === 'valid' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-700' :
              status === 'invalid' ? 'bg-red-50/50 border-red-100 text-red-600' :
              'bg-zinc-50/50 border-zinc-100 text-zinc-400'
            }`}>
              <div className="flex items-center gap-3">
                {status === 'valid' ? <CheckCircle2 className="w-4 h-4" /> :
                 status === 'invalid' ? <AlertTriangle className="w-4 h-4" /> :
                 <Info className="w-4 h-4" />}
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider">
                  {status === 'valid' ? dict.tools.json.valid : 
                   status === 'invalid' ? dict.tools.json.invalid : "Idle State"}
                </span>
              </div>
              
              {status === 'invalid' && (
                <span className="text-[10px] font-mono opacity-80 break-all max-w-sm truncate text-right">
                  Error: {errorMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
