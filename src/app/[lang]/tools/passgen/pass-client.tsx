'use client'

import { useState, useCallback, useEffect } from 'react'
import { KeyRound, RefreshCw, Copy, QrCode, ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function PassClient({ lang, dict }: { lang: string, dict: any }) {
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('deops_pass_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse history', e)
      }
    }
  }, [])

  const generatePassword = useCallback((saveToHistory = true) => {
    const charset: Record<string, string> = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    }

    let characters = ''
    if (options.uppercase) characters += charset.uppercase
    if (options.lowercase) characters += charset.lowercase
    if (options.numbers) characters += charset.numbers
    if (options.symbols) characters += charset.symbols

    if (characters.length === 0) return ''

    let generated = ''
    const array = new Uint32Array(length)
    window.crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      generated += characters[array[i] % characters.length]
    }
    setPassword(generated)

    if (saveToHistory) {
      setHistory(prev => {
        const newHistory = [generated, ...prev].slice(0, 5)
        localStorage.setItem('deops_pass_history', JSON.stringify(newHistory))
        return newHistory
      })
    }
  }, [length, options])

  // Initial generation on mount
  useEffect(() => {
    generatePassword(false)
  }, [])

  const regenerate = () => generatePassword(true)

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('deops_pass_history')
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link 
          href={`/${lang}/services`}
          className="inline-flex items-center text-emerald-700 hover:text-emerald-600 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {dict.nav.services}
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <KeyRound className="w-8 h-8 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500">
              {dict.tools.passgen_title}
            </h1>
            <p className="text-zinc-600 mt-1">{dict.tools.passgen_desc}</p>
          </div>
        </div>

        <div className="mt-12 space-y-8">
          {/* Result Box */}
          <div className="bg-zinc-100 rounded-3xl border border-black/10 p-2 backdrop-blur-md relative group overflow-hidden">
            <div className="p-8 text-center bg-[#fafafa]/40 rounded-2xl border border-black/5">
              <span className="text-2xl sm:text-4xl font-mono text-zinc-900 tracking-widest break-all select-all selection:bg-emerald-500/30">
                {password}
              </span>
            </div>
            
            <div className="flex p-2 gap-2">
              <button
                onClick={regenerate}
                className="flex-1 py-4 bg-zinc-100 hover:bg-zinc-700 text-zinc-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
                {dict.tools.passgen.generate}
              </button>
              <button
                onClick={() => copyToClipboard(password)}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-zinc-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-5 h-5 animate-bounce" /> : <Copy className="w-5 h-5" />}
                {copied ? dict.tools.passgen.copied : dict.tools.passgen.copy}
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  showQR ? 'bg-white text-black' : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-700'
                }`}
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white/30 rounded-3xl border border-zinc-200/50 p-8 space-y-10">
            {/* Length Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-zinc-600 font-medium">{dict.tools.passgen.length}</label>
                <span className="text-3xl font-mono text-emerald-700">{length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 transition-all"
              />
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['uppercase', 'lowercase', 'numbers', 'symbols'].map((key) => (
                <button
                  key={key}
                  onClick={() => setOptions({ ...options, [key]: !options[key as keyof typeof options] })}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    options[key as keyof typeof options]
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-900'
                      : 'bg-zinc-100 border-black/5 text-zinc-600'
                  }`}
                >
                  <span className="font-medium text-sm uppercase tracking-wider">{dict.tools.passgen[key]}</span>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${
                      options[key as keyof typeof options] ? 'bg-emerald-500' : 'bg-zinc-100'
                    }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        options[key as keyof typeof options] ? 'left-5' : 'left-1'
                      }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* History Section */}
          <div className="bg-white/30 rounded-3xl border border-zinc-200/50 p-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-zinc-600 font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                {dict.tools.passgen.history}
              </h3>
              {history.length > 0 && (
                <button 
                  onClick={clearHistory}
                  className="text-xs text-zinc-600 hover:text-red-400 transition-colors"
                >
                  {dict.tools.passgen.clear_history}
                </button>
              )}
            </div>

            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((h, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between p-3 bg-[#fafafa]/30 rounded-xl border border-black/5 group hover:border-emerald-500/30 transition-colors"
                  >
                    <span className="font-mono text-zinc-600 group-hover:text-zinc-200 transition-colors truncate mr-4">
                      {h}
                    </span>
                    <button
                      onClick={() => copyToClipboard(h)}
                      className="p-2 text-zinc-600 hover:text-emerald-700 hover:bg-emerald-500/10 rounded-lg transition-all"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-700 italic text-sm">
                  {dict.tools.passgen.history_empty}
                </div>
              )}
            </div>

            <p className="mt-6 text-[11px] text-zinc-600 flex items-center gap-1.5 justify-center">
              <ShieldCheck className="w-3.5 h-3.5" />
              {dict.tools.passgen.history_helper}
            </p>
          </div>
        </div>
      </div>

      {/* Global Fixed Modal */}
      {showQR && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#fafafa]/90 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={() => setShowQR(false)}
        >
          <div 
            className="bg-white border border-black/10 p-10 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-white rounded-2xl shadow-xl">
              <QRCodeSVG value={password} size={220} level="M" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-zinc-900 font-medium flex items-center justify-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-700" />
                Security Transfer
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed px-2">
                Scan with your mobile device to securely transfer this password without using the clipboard.
              </p>
            </div>
            <button 
              onClick={() => setShowQR(false)}
              className="mt-4 w-full py-3 bg-zinc-100 hover:bg-zinc-700 text-zinc-900 rounded-xl transition-colors font-medium hover:text-zinc-900"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
