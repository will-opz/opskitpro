'use client'

import { useState } from 'react'
import { QrCode, Download, Info } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

type Lang = 'zh' | 'en' | 'ja' | 'tw'

export default function QRClient({ dict, lang }: { dict: any; lang: Lang }) {
  const isJapanese = lang === 'ja'
  const [text, setText] = useState('')

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx?.drawImage(img, 0, 0)
      const pngFile = canvas.toDataURL('image/png')
      const downloadLink = document.createElement('a')
      downloadLink.download = `opskitpro-qr-${Date.now()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 pt-8 md:pt-12 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 text-[10px] font-semibold tracking-[0.28em] mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          {dict.tools.qrgen_title}
        </div>

        <div className="flex items-center gap-2 mb-8 text-[11px] text-zinc-500">
          <Link href={`/`} className="hover:text-emerald-600 transition-colors">{isJapanese ? 'ホーム' : 'Home'}</Link>
          <span className="text-zinc-300">/</span>
          <Link href={`/services`} className="hover:text-emerald-600 transition-colors">{isJapanese ? 'ツール' : 'Tools'}</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 border-b border-emerald-500/30 font-semibold">{dict.tools.qrgen_title}</span>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-lg shadow-emerald-500/10 group transition-all">
            <QrCode className="w-7 h-7 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              {dict.tools.qrgen_title}
            </h1>
            <p className="text-zinc-600 text-[10px] sm:text-xs tracking-[0.18em] mt-1 leading-relaxed">{dict.tools.qrgen_desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Input Side */}
          <div className="space-y-6">
            <div className="bg-zinc-100 rounded-2xl border border-black/10 p-6 backdrop-blur-sm">
              <label className="block text-sm font-medium text-zinc-600 mb-4 flex items-center gap-2">
                <Info className="w-4 h-4" />
                {dict.tools.qrgen.helper}
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={dict.tools.qrgen.placeholder}
                className="w-full h-48 sm:h-64 bg-[#fafafa]/50 border border-black/10 rounded-xl p-4 text-zinc-900 font-mono placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mb-4"
              />
              <button
                onClick={downloadQR}
                disabled={!text}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {dict.tools.qrgen.download}
              </button>
            </div>
          </div>

          {/* Preview Side */}
          <div className="flex flex-col items-center justify-start py-8">
            <div className="relative group p-8 bg-white rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.1)] transition-transform hover:scale-[1.02]">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/5 to-transparent pointer-events-none" />
              {text ? (
                <QRCodeSVG
                  id="qr-code-svg"
                  value={text}
                  size={256}
                  level="H"
                  includeMargin={false}
                  className="relative z-10"
                />
              ) : (
                  <div className="w-[256px] h-[256px] border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-600 italic text-center px-8">
                  {isJapanese ? '内容を入力すると QR を表示できます。' : lang === 'zh' ? '输入内容后即可预览二维码。' : 'Enter content to preview QR.'}
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
