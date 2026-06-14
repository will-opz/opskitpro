'use client'

import { Wrench } from 'lucide-react'

export interface DiffLine {
  text: string
  type: 'same' | 'added' | 'removed'
}

export function computeDiff(original: string, repaired: string): DiffLine[] {
  const origLines = original.split('\n')
  const repLines = repaired.split('\n')
  const result: DiffLine[] = []

  // Simple line-by-line diff
  let oi = 0, ri = 0
  while (oi < origLines.length || ri < repLines.length) {
    const ol = oi < origLines.length ? origLines[oi] : undefined
    const rl = ri < repLines.length ? repLines[ri] : undefined

    if (ol === rl) {
      result.push({ text: rl!, type: 'same' })
      oi++; ri++
    } else if (ol !== undefined && rl !== undefined) {
      // Modified line: show as removed then added
      result.push({ text: ol, type: 'removed' })
      result.push({ text: rl, type: 'added' })
      oi++; ri++
    } else if (ol !== undefined) {
      result.push({ text: ol, type: 'removed' })
      oi++
    } else if (rl !== undefined) {
      result.push({ text: rl, type: 'added' })
      ri++
    }
  }
  return result
}

interface DiffViewProps {
  diffData: DiffLine[]
  repairFixes: string[]
  dict: any
}

export function DiffView({ diffData, repairFixes, dict }: DiffViewProps) {
  return (
    <div className="min-h-[300px] sm:min-h-[400px] max-h-[600px] overflow-auto">
      {/* Repair summary banner */}
      {repairFixes.length > 0 && (
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-100 flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wider">
              {dict.tools.json.repair_summary || `${repairFixes.length} fix(es) applied`}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {repairFixes.map((fix, i) => (
              <span key={i} className="text-[10px] font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                {fix}
              </span>
            ))}
          </div>
        </div>
      )}
      {/* Diff lines */}
      <div className="p-4 font-mono text-[12px] leading-[1.8]">
        {diffData.map((line, idx) => {
          if (line.type === 'same') {
            return (
              <div key={idx} className="flex">
                <span className="w-10 text-right pr-3 text-zinc-300 select-none shrink-0">{idx + 1}</span>
                <span className="text-zinc-600 whitespace-pre">{line.text}</span>
              </div>
            )
          }
          if (line.type === 'removed') {
            return (
              <div key={idx} className="flex bg-red-50 border-l-2 border-red-400 rounded-r">
                <span className="w-10 text-right pr-3 text-red-300 select-none shrink-0">−</span>
                <span className="text-red-700 whitespace-pre line-through opacity-70">{line.text}</span>
              </div>
            )
          }
          // added
          return (
            <div key={idx} className="flex bg-emerald-50 border-l-2 border-emerald-400 rounded-r">
              <span className="w-10 text-right pr-3 text-emerald-400 select-none shrink-0">+</span>
              <span className="text-emerald-800 whitespace-pre font-semibold">{line.text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
