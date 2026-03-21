'use client'

import { useState } from 'react'
import { QrCode, Download, ArrowLeft, Info } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'

export default function QRClient({ lang, dict }: { lang: string, dict: any }) {
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
      downloadLink.download = `deops-qr-${Date.now()}.png`
      downloadLink.href = pngFile
      downloadLink.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-2 mb-8 text-sm font-mono">
          <Link href={`/${lang}`} className="text-zinc-500 hover:text-zinc-900 transition-colors">
            🏠 首页
          </Link>
          <span className="text-zinc-300">/</span>
          <Link href={`/${lang}/services`} className="text-emerald-700 hover:text-emerald-600 transition-colors">
            {dict.nav.services}
          </Link>
        </div>

        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <QrCode className="w-8 h-8 text-emerald-700" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-800 to-zinc-500">
              {dict.tools.qrgen_title}
            </h1>
            <p className="text-zinc-600 mt-1">{dict.tools.qrgen_desc}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
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
                className="w-full h-64 bg-[#fafafa]/50 border border-black/10 rounded-xl p-4 text-zinc-900 font-mono placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/50 transition-colors resize-none mb-4"
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
                <div className="w-[256px] h-[256px] border-2 border-dashed border-zinc-200 rounded-2xl flex items-center justify-center text-zinc-700 italic text-center px-8">
                  Wait data input...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
