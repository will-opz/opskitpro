'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Check, ClipboardCheck, Copy, FileText, RefreshCw, Sparkles } from 'lucide-react'

type Lang = 'zh' | 'en' | 'ja' | 'tw'

type FormState = {
  goal: string
  scope: string
  constraints: string
  avoid: string
  verification: string
  notes: boolean
  publicBoundary: boolean
}

const copy = {
  zh: {
    home: '首页',
    tools: '工具',
    badge: 'AI 工程工作流',
    title: 'Prompt Builder',
    desc: '把任务目标、边界、验证方式整理成可直接交给 AI Coding Agent 的工程 prompt。所有内容只在本地生成。',
    goal: '任务目标',
    goalPlaceholder: '例如：优化 /tools 的 AI Engineering 区块，让入口更清晰。',
    scope: '目标页面 / 模块',
    scopePlaceholder: '例如：src/app/services/ServicesClient.tsx、/tools/prompt-builder',
    constraints: '必须遵守的约束',
    constraintsPlaceholder: '例如：最小改动、不加依赖、先读 Obsidian、保持 public/private 边界。',
    avoid: '不要改什么',
    avoidPlaceholder: '例如：不要重构全站，不要改无关页面，不要提交草稿内容。',
    verification: '验证命令',
    verificationPlaceholder: 'npm test\nnpx tsc --noEmit\nnpm run build',
    notes: '需要写回 Obsidian',
    publicBoundary: '严格检查公开 / 私有边界',
    output: '生成的 Prompt',
    copy: '复制',
    copied: '已复制',
    reset: '重置',
  },
  en: {
    home: 'Home',
    tools: 'Tools',
    badge: 'AI Engineering Workflow',
    title: 'Prompt Builder',
    desc: 'Turn goals, scope, guardrails, and checks into a scoped prompt for AI coding agents. Everything runs locally.',
    goal: 'Task goal',
    goalPlaceholder: 'Example: polish the AI Engineering section on /tools.',
    scope: 'Target page / module',
    scopePlaceholder: 'Example: src/app/services/ServicesClient.tsx, /tools/prompt-builder',
    constraints: 'Required constraints',
    constraintsPlaceholder: 'Example: minimal changes, no new dependencies, read Obsidian first, preserve public/private boundaries.',
    avoid: 'Do not change',
    avoidPlaceholder: 'Example: do not refactor the whole site, do not touch unrelated pages, do not publish draft content.',
    verification: 'Verification commands',
    verificationPlaceholder: 'npm test\nnpx tsc --noEmit\nnpm run build',
    notes: 'Write results back to Obsidian',
    publicBoundary: 'Check public/private boundaries strictly',
    output: 'Generated Prompt',
    copy: 'Copy',
    copied: 'Copied',
    reset: 'Reset',
  },
  ja: {
    home: 'ホーム',
    tools: 'ツール',
    badge: 'AI エンジニアリング',
    title: 'Prompt Builder',
    desc: '目的、範囲、制約、検証を AI Coding Agent 向けの prompt に整理します。処理はすべてローカルです。',
    goal: 'タスクの目的',
    goalPlaceholder: '例: /tools の AI Engineering 区画を整理する。',
    scope: '対象ページ / モジュール',
    scopePlaceholder: '例: src/app/services/ServicesClient.tsx、/tools/prompt-builder',
    constraints: '必ず守る制約',
    constraintsPlaceholder: '例: 最小変更、新規依存なし、Obsidian を先に読む、public/private 境界を守る。',
    avoid: '変更しないもの',
    avoidPlaceholder: '例: 全体リファクタ禁止、無関係ページ禁止、草稿公開禁止。',
    verification: '検証コマンド',
    verificationPlaceholder: 'npm test\nnpx tsc --noEmit\nnpm run build',
    notes: 'Obsidian に結果を書く',
    publicBoundary: '公開 / 非公開境界を厳密に確認',
    output: '生成された Prompt',
    copy: 'コピー',
    copied: 'コピー済み',
    reset: 'リセット',
  },
  tw: {
    home: '首頁',
    tools: '工具',
    badge: 'AI 工程工作流',
    title: 'Prompt Builder',
    desc: '把任務目標、邊界與驗證方式整理成可交給 AI Coding Agent 的工程 prompt。全部在本機生成。',
    goal: '任務目標',
    goalPlaceholder: '例如：優化 /tools 的 AI Engineering 區塊。',
    scope: '目標頁面 / 模組',
    scopePlaceholder: '例如：src/app/services/ServicesClient.tsx、/tools/prompt-builder',
    constraints: '必須遵守的約束',
    constraintsPlaceholder: '例如：最小改動、不加依賴、先讀 Obsidian、保持 public/private 邊界。',
    avoid: '不要改什麼',
    avoidPlaceholder: '例如：不要重構全站，不要改無關頁面，不要提交草稿內容。',
    verification: '驗證命令',
    verificationPlaceholder: 'npm test\nnpx tsc --noEmit\nnpm run build',
    notes: '需要寫回 Obsidian',
    publicBoundary: '嚴格檢查公開 / 私有邊界',
    output: '生成的 Prompt',
    copy: '複製',
    copied: '已複製',
    reset: '重置',
  },
} satisfies Record<Lang, Record<string, string>>

const initialState: FormState = {
  goal: 'Build the smallest useful version of an OpsKitPro feature.',
  scope: 'Target only the directly related page or component.',
  constraints: 'Keep changes minimal. Do not add dependencies. Preserve existing design patterns. Run tests and build checks.',
  avoid: 'Do not refactor unrelated pages. Do not publish private notes, drafts, credentials, or internal process details.',
  verification: 'npm test\nnpx tsc --noEmit\nnpm run build',
  notes: true,
  publicBoundary: true,
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
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

export default function PromptBuilderClient({ dict, lang }: { dict: any; lang: Lang }) {
  const t = copy[lang] || copy.zh
  const [form, setForm] = useState<FormState>(initialState)
  const [copied, setCopied] = useState(false)

  const prompt = useMemo(() => {
    const lines = [
      'You are Codex working inside an existing OpsKitPro Next.js project.',
      '',
      `Task goal:\n${form.goal.trim() || '(describe the goal)'}`,
      '',
      `Target scope:\n${form.scope.trim() || '(list pages, modules, or files)'}`,
      '',
      `Required constraints:\n${form.constraints.trim() || 'Keep changes minimal and follow existing patterns.'}`,
      '',
      `Do not change:\n${form.avoid.trim() || 'Do not touch unrelated files or publish private material.'}`,
      '',
      form.publicBoundary
        ? 'Public/private boundary:\nOnly use already-public content. Do not expose drafts, credentials, personal notes, internal paths, or unclear private material. If the boundary is uncertain, stop and explain the risk.'
        : '',
      form.notes
        ? 'Project memory:\nRead the relevant Obsidian project notes first, write a short plan before editing, and write results, changed files, verification, risks, and rollback points back to Obsidian.'
        : '',
      `Verification:\n${form.verification.trim() || 'Run the project test and build checks.'}`,
      '',
      'Execution rules:\nCreate the smallest safe implementation, avoid broad refactors, run verification, then summarize changed files and residual risks.',
    ].filter(Boolean)

    return lines.join('\n\n')
  }, [form])

  const update = (key: keyof FormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const copyPrompt = async () => {
    await writeClipboard(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <main className="min-h-screen bg-[#fafafa] px-4 pb-20 pt-8 text-zinc-700 sm:px-6 md:pt-12">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-8 flex items-center gap-2 text-[11px] text-zinc-500">
          <Link href="/" className="transition-colors hover:text-emerald-600">{t.home}</Link>
          <span className="text-zinc-300">/</span>
          <Link href="/tools" className="transition-colors hover:text-emerald-600">{t.tools}</Link>
          <span className="text-zinc-300">/</span>
          <span className="border-b border-emerald-500/30 font-semibold text-zinc-900">{dict.tools.prompt_builder_title}</span>
        </nav>

        <section className="op-card rounded-[2rem] p-5 sm:p-8">
          <div className="op-chip mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t.badge}
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 sm:text-5xl">{t.title}</h1>
              <p className="mt-4 text-sm leading-7 text-zinc-600 sm:text-base">{t.desc}</p>
            </div>
            <div className="op-icon-box h-16 w-16">
              <Sparkles className="h-7 w-7" />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_0.95fr]">
          <div className="op-card-soft rounded-[2rem] p-5 sm:p-6">
            <div className="grid gap-4">
              <Field label={t.goal} value={form.goal} placeholder={t.goalPlaceholder} onChange={(value) => update('goal', value)} />
              <Field label={t.scope} value={form.scope} placeholder={t.scopePlaceholder} onChange={(value) => update('scope', value)} />
              <Field label={t.constraints} value={form.constraints} placeholder={t.constraintsPlaceholder} rows={5} onChange={(value) => update('constraints', value)} />
              <Field label={t.avoid} value={form.avoid} placeholder={t.avoidPlaceholder} rows={4} onChange={(value) => update('avoid', value)} />
              <Field label={t.verification} value={form.verification} placeholder={t.verificationPlaceholder} rows={4} onChange={(value) => update('verification', value)} />

              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle checked={form.notes} label={t.notes} onChange={(value) => update('notes', value)} />
                <Toggle checked={form.publicBoundary} label={t.publicBoundary} onChange={(value) => update('publicBoundary', value)} />
              </div>
            </div>
          </div>

          <div className="op-card rounded-[2rem] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="op-icon-box h-10 w-10 rounded-xl">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-700">{t.output}</h2>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => setForm(initialState)} className="op-action px-3 py-2 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t.reset}
                </button>
                <button type="button" onClick={copyPrompt} className="op-action px-3 py-2 text-xs">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t.copied : t.copy}
                </button>
              </div>
            </div>
            <pre className="max-h-[680px] overflow-auto whitespace-pre-wrap rounded-2xl border border-zinc-100 bg-zinc-950 p-5 text-xs leading-6 text-zinc-200 shadow-inner">
              {prompt}
            </pre>
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({ label, value, placeholder, rows = 3, onChange }: { label: string; value: string; placeholder: string; rows?: number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">{label}</span>
      <textarea
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm leading-6 text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500/40 focus:ring-4 focus:ring-emerald-500/10"
      />
    </label>
  )
}

function Toggle({ checked, label, onChange }: { checked: boolean; label: string; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-zinc-100 bg-white px-4 py-3 text-sm font-semibold text-zinc-700 shadow-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
      />
      <ClipboardCheck className="h-4 w-4 text-emerald-600" />
      {label}
    </label>
  )
}
