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

  const generatePassword = useCallback(() => {
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
  }, [length, options])

  useEffect(() => {
    generatePassword()
  }, [generatePassword])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Link 
          href={`/${lang}/services`}
          className="inline-flex items-center text-emerald-500 hover:text-emerald-400 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          {dict.nav.services}
        </Link>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <KeyRound className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-500">
              {dict.tools.passgen_title}
            </h1>
            <p className="text-zinc-500 mt-1">{dict.tools.passgen_desc}</p>
          </div>
        </div>

        <div className="mt-12 space-y-8">
          {/* Result Box */}
          <div className="bg-zinc-900/50 rounded-3xl border border-white/10 p-2 backdrop-blur-md relative group overflow-hidden">
            <div className="p-8 text-center bg-black/40 rounded-2xl border border-white/5">
              <span className="text-2xl sm:text-4xl font-mono text-white tracking-widest break-all select-all selection:bg-emerald-500/30">
                {password}
              </span>
            </div>
            
            <div className="flex p-2 gap-2">
              <button
                onClick={generatePassword}
                className="flex-1 py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 group"
              >
                <RefreshCw className="w-5 h-5 group-active:rotate-180 transition-transform duration-500" />
                {dict.tools.passgen.generate}
              </button>
              <button
                onClick={copyToClipboard}
                className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-5 h-5 animate-bounce" /> : <Copy className="w-5 h-5" />}
                {copied ? dict.tools.passgen.copied : dict.tools.passgen.copy}
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className={`p-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                  showQR ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'
                }`}
              >
                <QrCode className="w-5 h-5" />
              </button>
            </div>

            {showQR && (
              <div className="absolute inset-x-0 bottom-[84px] p-8 flex flex-col items-center justify-center bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-bottom-4 duration-300 z-20">
                <div className="p-4 bg-white rounded-2xl mb-4">
                  <QRCodeSVG value={password} size={180} level="M" />
                </div>
                <p className="text-sm text-zinc-400 text-center px-8">
                  <ShieldCheck className="w-4 h-4 inline mr-1 text-emerald-500" />
                  Scan with your mobile device to securely transfer this password.
                </p>
                <button 
                  onClick={() => setShowQR(false)}
                  className="absolute top-4 right-4 text-zinc-500 hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4 rotate-90" />
                </button>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="bg-zinc-900/30 rounded-3xl border border-zinc-800/50 p-8 space-y-10">
            {/* Length Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-zinc-400 font-medium">{dict.tools.passgen.length}</label>
                <span className="text-3xl font-mono text-emerald-500">{length}</span>
              </div>
              <input
                type="range"
                min="8"
                max="64"
                value={length}
                onChange={(e) => setLength(parseInt(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
                      ? 'bg-emerald-500/5 border-emerald-500/20 text-white'
                      : 'bg-zinc-900/50 border-white/5 text-zinc-500'
                  }`}
                >
                  <span className="font-medium text-sm uppercase tracking-wider">{dict.tools.passgen[key]}</span>
                  <div className={`w-10 h-6 rounded-full relative transition-colors ${
                      options[key as keyof typeof options] ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}>
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                        options[key as keyof typeof options] ? 'left-5' : 'left-1'
                      }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
