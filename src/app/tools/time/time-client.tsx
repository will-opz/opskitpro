'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, Clock3, Copy, RefreshCw, TimerReset } from 'lucide-react'

type Lang = 'zh' | 'en' | 'ja' | 'tw'

const zones = [
  { label: 'Local', value: 'local' },
  { label: 'UTC', value: 'UTC' },
  { label: 'Tokyo', value: 'Asia/Tokyo' },
  { label: 'Shanghai', value: 'Asia/Shanghai' },
  { label: 'Singapore', value: 'Asia/Singapore' },
  { label: 'London', value: 'Europe/London' },
  { label: 'New York', value: 'America/New_York' },
  { label: 'Los Angeles', value: 'America/Los_Angeles' },
]

const copy = {
  zh: {
    home: '首页',
    tools: '工具',
    badge: '时间工具',
    title: '时间与时区转换',
    desc: 'Unix 时间戳、ISO 时间和常用时区快速互转。',
    input: '输入时间',
    placeholder: 'Unix 秒/毫秒或 ISO 时间，例如 1714200000',
    now: '当前时间',
    invalid: '无法解析这个时间，请输入 Unix 秒、毫秒或 ISO 字符串。',
    unixSeconds: 'Unix 秒',
    unixMs: 'Unix 毫秒',
    iso: 'ISO 时间',
    utc: 'UTC',
    timezone: '常用时区',
    copy: '复制',
    copied: '已复制',
  },
  en: {
    home: 'Home',
    tools: 'Tools',
    badge: 'Time Toolkit',
    title: 'Time & Time Zone Converter',
    desc: 'Convert Unix timestamps, ISO strings, and common time zones quickly.',
    input: 'Input time',
    placeholder: 'Unix seconds/ms or ISO time, e.g. 1714200000',
    now: 'Use current time',
    invalid: 'Unable to parse this time. Use Unix seconds, milliseconds, or an ISO string.',
    unixSeconds: 'Unix seconds',
    unixMs: 'Unix milliseconds',
    iso: 'ISO time',
    utc: 'UTC',
    timezone: 'Common time zones',
    copy: 'Copy',
    copied: 'Copied',
  },
  ja: {
    home: 'ホーム',
    tools: 'ツール',
    badge: '時間ツール',
    title: '時刻・タイムゾーン変換',
    desc: 'Unix タイムスタンプ、ISO 時刻、主要タイムゾーンをすばやく変換します。',
    input: '入力時刻',
    placeholder: 'Unix 秒/ミリ秒、または ISO 時刻。例: 1714200000',
    now: '現在時刻',
    invalid: '時刻を解析できません。Unix 秒、ミリ秒、ISO 文字列を入力してください。',
    unixSeconds: 'Unix 秒',
    unixMs: 'Unix ミリ秒',
    iso: 'ISO 時刻',
    utc: 'UTC',
    timezone: '主要タイムゾーン',
    copy: 'コピー',
    copied: 'コピー済み',
  },
  tw: {
    home: '首頁',
    tools: '工具',
    badge: '時間工具',
    title: '時間與時區轉換',
    desc: 'Unix 時間戳、ISO 時間和常用時區快速互轉。',
    input: '輸入時間',
    placeholder: 'Unix 秒/毫秒或 ISO 時間，例如 1714200000',
    now: '目前時間',
    invalid: '無法解析這個時間，請輸入 Unix 秒、毫秒或 ISO 字串。',
    unixSeconds: 'Unix 秒',
    unixMs: 'Unix 毫秒',
    iso: 'ISO 時間',
    utc: 'UTC',
    timezone: '常用時區',
    copy: '複製',
    copied: '已複製',
  },
} satisfies Record<Lang, Record<string, string>>

function parseInput(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/^-?\d+$/.test(trimmed)) {
    const raw = Number(trimmed)
    const ms = Math.abs(raw) < 100000000000 ? raw * 1000 : raw
    const date = new Date(ms)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const date = new Date(trimmed)
  return Number.isNaN(date.getTime()) ? null : date
}

function formatInZone(date: Date, timeZone: string, locale: string) {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }

  return new Intl.DateTimeFormat(locale, timeZone === 'local' ? options : { ...options, timeZone }).format(date)
}

export default function TimeClient({ dict, lang }: { dict: any; lang: Lang }) {
  const t = copy[lang] || copy.zh
  const locale = lang === 'ja' ? 'ja-JP' : lang === 'en' ? 'en-US' : lang === 'tw' ? 'zh-TW' : 'zh-CN'
  const [input, setInput] = useState('')
  const [copied, setCopied] = useState('')

  useEffect(() => {
    setInput(String(Math.floor(Date.now() / 1000)))
  }, [])

  const parsedDate = useMemo(() => parseInput(input), [input])

  const rows = useMemo(() => {
    if (!parsedDate) return []
    return zones.map((zone) => ({
      ...zone,
      valueText: formatInZone(parsedDate, zone.value, locale),
    }))
  }, [locale, parsedDate])

  const setNow = () => setInput(String(Math.floor(Date.now() / 1000)))

  const copyValue = (label: string, value: string) => {
    navigator.clipboard.writeText(value)
    setCopied(label)
    setTimeout(() => setCopied(''), 1600)
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 pb-20 pt-8 text-zinc-700 sm:px-6 md:pt-12">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-8 flex items-center gap-2 text-[11px] text-zinc-500">
          <Link href="/" className="hover:text-emerald-600 transition-colors">{t.home}</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/services" className="hover:text-emerald-600 transition-colors">{t.tools}</Link>
          <span className="text-zinc-300">/</span>
          <span className="border-b border-emerald-500/30 font-semibold text-zinc-900">{dict.tools.time_title}</span>
        </nav>

        <section className="rounded-[2rem] border border-white/80 bg-white/85 p-5 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/8 px-4 py-1.5 text-[10px] font-semibold tracking-[0.28em] text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t.badge}
          </div>

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3.5 shadow-sm">
                <Clock3 className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-4xl">{t.title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-zinc-600">{t.desc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={setNow}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-bold text-zinc-700 shadow-sm transition hover:border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <RefreshCw className="h-4 w-4" />
              {t.now}
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-[1.5rem] border border-zinc-100 bg-white/90 p-5 shadow-sm">
            <label htmlFor="time-input" className="mb-3 block text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
              {t.input}
            </label>
            <input
              id="time-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={t.placeholder}
              className="h-12 w-full rounded-2xl border border-zinc-200 bg-white px-4 font-mono text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/60 focus:ring-4 focus:ring-emerald-500/10"
            />

            {!parsedDate && input.trim() && (
              <p className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{t.invalid}</p>
            )}

            {parsedDate && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  { label: t.unixSeconds, value: String(Math.floor(parsedDate.getTime() / 1000)) },
                  { label: t.unixMs, value: String(parsedDate.getTime()) },
                  { label: t.iso, value: parsedDate.toISOString() },
                  { label: t.utc, value: parsedDate.toUTCString() },
                ].map((item) => (
                  <OutputCard key={item.label} label={item.label} value={item.value} copied={copied === item.label} copyLabel={copied === item.label ? t.copied : t.copy} onCopy={() => copyValue(item.label, item.value)} />
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-[1.5rem] border border-zinc-100 bg-white/90 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <TimerReset className="h-4 w-4 text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-700">{t.timezone}</h2>
            </div>
            <div className="space-y-2">
              {rows.map((row) => (
                <button
                  key={row.value}
                  type="button"
                  onClick={() => copyValue(row.label, row.valueText)}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-zinc-100 bg-zinc-50/70 px-3 py-2.5 text-left transition hover:border-emerald-500/20 hover:bg-emerald-50"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-[0.16em] text-zinc-500">{row.label}</span>
                    <span className="mt-1 block truncate font-mono text-sm text-zinc-900">{row.valueText}</span>
                  </span>
                  {copied === row.label ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-emerald-600" />}
                </button>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </main>
  )
}

function OutputCard({ label, value, copied, copyLabel, onCopy }: { label: string; value: string; copied: boolean; copyLabel: string; onCopy: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">{label}</div>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-500 transition hover:bg-white hover:text-emerald-700"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          {copyLabel}
        </button>
      </div>
      <div className="break-all font-mono text-sm leading-6 text-zinc-900">{value}</div>
    </div>
  )
}
