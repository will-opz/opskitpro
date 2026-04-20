'use client'

import { useState, useCallback, useEffect } from 'react'
import { KeyRound, RefreshCw, Copy, QrCode, Check, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

type Lang = 'zh' | 'en' | 'ja' | 'tw'

export default function PassClient({ dict, lang }: { dict: any; lang: Lang }) {
  const isJapanese = lang === 'ja'
  const [password, setPassword] = useState('')
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    uuid: false,
    pin6: false,
    pin8: false,
  })

  // Helper to toggle options correctly
  const toggleOption = (key: string) => {
    setOptions(prev => {
      const next = { ...prev }
      if (key === 'uuid' || key === 'pin6' || key === 'pin8') {
        const val = !prev[key as keyof typeof prev]
        // Reset all special modes first
        next.uuid = false
        next.pin6 = false
        next.pin8 = false
        next[key as keyof typeof next] = val
      } else {
        next[key as keyof typeof next] = !prev[key as keyof typeof next]
        // If we are enabling a character set, disable special modes
        next.uuid = false
        next.pin6 = false
        next.pin8 = false
      }
      return next
    })
  }
  const [copied, setCopied] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [history, setHistory] = useState<string[]>([])

  useEffect(() => {
    const saved = localStorage.getItem('opskitpro_pass_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse history', e)
      }
    }
  }, [])

  const generatePassword = useCallback((saveToHistory = true) => {
    let generated = ''

    if (options.uuid) {
      // UUID v4 generation using cryptographically secure API
      generated = crypto.randomUUID()
    } else if (options.pin6 || options.pin8) {
      const pinLength = options.pin6 ? 6 : 8
      const array = new Uint32Array(pinLength)
      window.crypto.getRandomValues(array)
      for (let i = 0; i < pinLength; i++) {
        generated += (array[i] % 10).toString()
      }
    } else {
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

      const array = new Uint32Array(length)
      window.crypto.getRandomValues(array)
      for (let i = 0; i < length; i++) {
        generated += characters[array[i] % characters.length]
      }
    }

    setPassword(generated)

    if (saveToHistory) {
      setHistory(prev => {
        const newHistory = [generated, ...prev].slice(0, 5)
        localStorage.setItem('opskitpro_pass_history', JSON.stringify(newHistory))
        return newHistory
      })
    }
  }, [length, options])

  // Initial generation on mount
  useEffect(() => {
    generatePassword(false)
  }, [])

  const regenerate = () => generatePassword(true)

  // Password strength calculation (entropy-based)
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' }
    let charsetSize = 0
    if (/[a-z]/.test(pwd)) charsetSize += 26
    if (/[A-Z]/.test(pwd)) charsetSize += 26
    if (/[0-9]/.test(pwd)) charsetSize += 10
    if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 32
    const entropy = pwd.length * Math.log2(Math.max(charsetSize, 1))
    if (entropy < 28) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (entropy < 36) return { score: 2, label: 'Fair', color: 'bg-orange-400' }
    if (entropy < 60) return { score: 3, label: 'Good', color: 'bg-yellow-400' }
    if (entropy < 80) return { score: 4, label: 'Strong', color: 'bg-emerald-400' }
    return { score: 5, label: 'Very Strong', color: 'bg-emerald-600' }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('opskitpro_pass_history')
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 pt-8 md:pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.28em] mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {dict.tools.passgen_title}
        </div>

        <div className="flex items-center gap-2 mb-8 text-[11px] text-zinc-500">
          <Link href={`/`} className="hover:text-emerald-600 transition-colors">
            {isJapanese ? 'ホーム' : 'Home'}
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href={`/services`} className="hover:text-emerald-600 transition-colors">
            {isJapanese ? 'ツール' : 'Tools'}
          </Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 border-b border-emerald-500/30 font-semibold">
            {dict.tools.passgen_title}
          </span>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-lg shadow-emerald-500/10 group transition-all">
            <KeyRound className="w-7 h-7 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              {dict.tools.passgen_title}
            </h1>
            <p className="text-zinc-600 text-[10px] sm:text-xs tracking-[0.18em] mt-1 leading-relaxed">{dict.tools.passgen_desc}</p>
          </div>
        </div>

        <div className="mt-8 space-y-6">
          {/* Result Box */}
          <div className="bg-zinc-100 rounded-3xl border border-black/10 p-2 backdrop-blur-md relative group overflow-hidden">
            <div className="p-8 text-center bg-[#fafafa]/40 rounded-2xl border border-black/5">
              <span className="text-2xl sm:text-4xl font-mono text-zinc-900 tracking-widest break-all select-all selection:bg-emerald-500/30">
                {password}
              </span>
            </div>
            {/* Strength indicator */}
            {password && (() => {
              const { score, label, color } = getStrength(password)
              return (
                <div className="px-4 pt-2 pb-1 flex items-center gap-3">
                  <div className="flex gap-1 flex-1">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= score ? color : 'bg-zinc-200'}`} />
                    ))}
                  </div>
                  <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                    score <= 2 ? 'text-red-500' : score === 3 ? 'text-yellow-500' : 'text-emerald-600'
                  }`}>{label}</span>
                </div>
              )
            })()}
            
            <div className="flex flex-col sm:flex-row p-2 gap-2">
              <div className="flex flex-1 gap-2">
                <button
                  onClick={regenerate}
                  className="flex-1 py-4 bg-white hover:bg-emerald-50 border border-black/5 hover:border-emerald-200 text-zinc-900 hover:text-emerald-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group shadow-sm active:scale-95"
                >
                  <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
                  <span className="text-sm sm:text-base !text-zinc-900 group-hover:!text-white">{dict.tools.passgen.generate}</span>
                </button>
              </div>
              <div className="flex flex-1 gap-2">
                <button
                  onClick={() => copyToClipboard(password)}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 active:scale-95"
                >
                  {copied ? <Check className="w-5 h-5 animate-bounce" /> : <Copy className="w-5 h-5" />}
                  <span className="text-sm sm:text-base text-white">{copied ? dict.tools.passgen.copied : dict.tools.passgen.copy}</span>
                </button>
                <button
                  onClick={() => setShowQR(!showQR)}
                  className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 border shadow-sm active:scale-95 ${
                    showQR ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-500/20' : 'bg-white text-zinc-900 hover:bg-emerald-50 hover:text-emerald-700 border-black/5'
                  }`}
                  aria-label="Show QR Code"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
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
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] px-1">
                  {dict.tools.passgen.options}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {['uppercase', 'lowercase', 'numbers', 'symbols'].map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleOption(key)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        options[key as keyof typeof options]
                          ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-900 shadow-sm'
                          : 'bg-zinc-100/50 border-black/5 text-zinc-400'
                      }`}
                    >
                      <span className="font-medium text-xs uppercase tracking-[0.18em]">{dict.tools.passgen[key]}</span>
                      <div className={`w-10 h-6 rounded-full relative transition-colors ${
                          options[key as keyof typeof options] ? 'bg-emerald-500' : 'bg-zinc-200'
                        }`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${
                            options[key as keyof typeof options] ? 'left-5' : 'left-1'
                          }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.24em] px-1">
                  {isJapanese ? '特別形式' : lang === 'zh' ? '特殊格式' : 'Special Formats'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {['uuid', 'pin6', 'pin8'].map((key) => (
                    <button
                      key={key}
                      onClick={() => toggleOption(key)}
                      className={`flex items-center justify-between sm:justify-center flex-row sm:flex-col gap-3 p-4 rounded-xl border transition-all ${
                        options[key as keyof typeof options]
                          ? 'bg-cyan-500/5 border-cyan-500/20 text-zinc-900 shadow-sm'
                          : 'bg-zinc-100/50 border-black/5 text-zinc-400'
                      }`}
                    >
                      <span className="font-bold text-[10px] uppercase tracking-[0.18em]">{dict.tools.passgen[key]}</span>
                      <div className={`w-8 h-4 rounded-full relative transition-colors ${
                          options[key as keyof typeof options] ? 'bg-cyan-500' : 'bg-zinc-200'
                        }`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${
                            options[key as keyof typeof options] ? 'left-4.5' : 'left-0.5'
                          }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
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
                    <span className="font-mono text-zinc-600 group-hover:text-zinc-900 transition-colors truncate mr-4">
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
                {isJapanese ? '安全な共有' : lang === 'zh' ? '安全传输' : 'Secure Transfer'}
              </p>
              <p className="text-sm text-zinc-600 leading-relaxed px-2">
                {isJapanese
                  ? 'モバイル端末で読み取ると、クリップボードを使わずに安全に共有できます。'
                  : lang === 'zh'
                    ? '使用移动设备扫描即可安全传输密码，无需使用剪贴板。'
                    : 'Scan with your mobile device to securely transfer this password without using the clipboard.'}
              </p>
            </div>
            <button 
              onClick={() => setShowQR(false)}
              className="mt-4 w-full py-3 bg-zinc-100 hover:bg-zinc-800 text-zinc-700 hover:text-white rounded-xl transition-colors font-medium"
            >
              {isJapanese ? '閉じる' : lang === 'zh' ? '关闭' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
