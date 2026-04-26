'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Braces, Check, Copy, FileCode2, RefreshCw } from 'lucide-react'

type Lang = 'zh' | 'en' | 'ja' | 'tw'
type Mode = 'base64-encode' | 'base64-decode' | 'url-encode' | 'url-decode' | 'jwt-decode'

const copy = {
  zh: {
    home: '首页',
    tools: '工具',
    badge: '编码工具',
    title: 'Encoding Toolkit',
    desc: 'Base64、URL 编码和 JWT payload 解码，全部在本地处理。',
    input: '输入',
    output: '输出',
    placeholder: '输入文本、Base64、URL 编码内容或 JWT...',
    copy: '复制',
    copied: '已复制',
    clear: '清空',
    error: '无法处理当前输入，请检查格式。',
  },
  en: {
    home: 'Home',
    tools: 'Tools',
    badge: 'Encoding Toolkit',
    title: 'Encoding Toolkit',
    desc: 'Base64, URL encoding, and JWT payload decoding. Everything runs locally.',
    input: 'Input',
    output: 'Output',
    placeholder: 'Paste text, Base64, URL-encoded content, or a JWT...',
    copy: 'Copy',
    copied: 'Copied',
    clear: 'Clear',
    error: 'Unable to process this input. Please check the format.',
  },
  ja: {
    home: 'ホーム',
    tools: 'ツール',
    badge: 'エンコードツール',
    title: 'Encoding Toolkit',
    desc: 'Base64、URL エンコード、JWT payload のデコードをローカルで行います。',
    input: '入力',
    output: '出力',
    placeholder: 'テキスト、Base64、URL エンコード文字列、JWT を入力...',
    copy: 'コピー',
    copied: 'コピー済み',
    clear: 'クリア',
    error: '入力を処理できません。形式を確認してください。',
  },
  tw: {
    home: '首頁',
    tools: '工具',
    badge: '編碼工具',
    title: 'Encoding Toolkit',
    desc: 'Base64、URL 編碼和 JWT payload 解碼，全部在本機處理。',
    input: '輸入',
    output: '輸出',
    placeholder: '輸入文字、Base64、URL 編碼內容或 JWT...',
    copy: '複製',
    copied: '已複製',
    clear: '清空',
    error: '無法處理目前輸入，請檢查格式。',
  },
} satisfies Record<Lang, Record<string, string>>

const modes: Array<{ id: Mode; label: string }> = [
  { id: 'base64-encode', label: 'Base64 Encode' },
  { id: 'base64-decode', label: 'Base64 Decode' },
  { id: 'url-encode', label: 'URL Encode' },
  { id: 'url-decode', label: 'URL Decode' },
  { id: 'jwt-decode', label: 'JWT Decode' },
]

function encodeBase64(value: string) {
  return btoa(unescape(encodeURIComponent(value)))
}

function decodeBase64(value: string) {
  return decodeURIComponent(escape(atob(value.trim())))
}

function decodeJwtPayload(value: string) {
  const parts = value.trim().split('.')
  if (parts.length < 2) throw new Error('Invalid JWT')
  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  const decoded = decodeBase64(padded)

  try {
    return JSON.stringify(JSON.parse(decoded), null, 2)
  } catch {
    return decoded
  }
}

function transform(mode: Mode, value: string) {
  if (!value) return ''

  switch (mode) {
    case 'base64-encode':
      return encodeBase64(value)
    case 'base64-decode':
      return decodeBase64(value)
    case 'url-encode':
      return encodeURIComponent(value)
    case 'url-decode':
      return decodeURIComponent(value)
    case 'jwt-decode':
      return decodeJwtPayload(value)
  }
}

async function writeClipboard(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    return
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    try {
      document.execCommand('copy')
    } finally {
      document.body.removeChild(textarea)
    }
  }
}

export default function EncodeClient({ dict, lang }: { dict: any; lang: Lang }) {
  const t = copy[lang] || copy.zh
  const [mode, setMode] = useState<Mode>('base64-decode')
  const [input, setInput] = useState('SGVsbG8sIE9wc0tpdFBybyE=')
  const [copied, setCopied] = useState(false)

  const result = useMemo(() => {
    try {
      return { value: transform(mode, input), error: '' }
    } catch {
      return { value: '', error: t.error }
    }
  }, [input, mode, t.error])

  const copyOutput = async () => {
    if (!result.value) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
    await writeClipboard(result.value)
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 pb-20 pt-8 text-zinc-700 sm:px-6 md:pt-12">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex items-center gap-2 text-[11px] text-zinc-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">{t.home}</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/services" className="hover:text-emerald-600 transition-colors">{t.tools}</Link>
          <span className="text-zinc-300">/</span>
          <span className="border-b border-emerald-500/30 font-semibold text-zinc-900">{dict.tools.encode_title}</span>
        </nav>

        <section className="op-card rounded-[2rem] p-5 sm:p-8">
          <div className="op-chip mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t.badge}
          </div>

          <div className="flex items-center gap-4">
            <div className="op-icon-box h-16 w-16">
              <FileCode2 className="h-7 w-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">{t.title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600">{t.desc}</p>
            </div>
          </div>
        </section>

        <section className="op-card rounded-[1.5rem] mt-6 p-4 sm:p-5">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {modes.map((item) => {
              const active = item.id === mode
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                    active
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-700'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="op-card rounded-[1.5rem] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label htmlFor="encode-input" className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                {t.input}
              </label>
              <button
                type="button"
                onClick={() => setInput('')}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-900"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t.clear}
              </button>
            </div>
            <textarea
              id="encode-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              className="min-h-[360px] w-full resize-y rounded-2xl border border-zinc-200 bg-white p-4 font-mono text-sm leading-6 text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
            />
          </div>

          <div className="op-card rounded-[1.5rem] p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
                <Braces className="h-4 w-4 text-emerald-600" />
                {t.output}
              </div>
              <button
                type="button"
                onClick={copyOutput}
                disabled={!result.value}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-500 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t.copied : t.copy}
              </button>
            </div>

            <pre className="min-h-[360px] whitespace-pre-wrap break-words rounded-2xl border border-zinc-100 bg-zinc-50/80 p-4 font-mono text-sm leading-6 text-zinc-900">
              {result.error || result.value}
            </pre>
          </div>
        </section>
      </div>
    </main>
  )
}
