'use client'

import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'

interface JsonTreeNodeProps {
  name?: string
  value: any
  depth?: number
  defaultOpen?: boolean
}

export function JsonTreeNode({ name, value, depth = 0, defaultOpen = true }: JsonTreeNodeProps) {
  const [open, setOpen] = useState(defaultOpen && depth < 3)

  const isObject = value !== null && typeof value === 'object' && !Array.isArray(value)
  const isArray = Array.isArray(value)
  const isExpandable = isObject || isArray

  const indent = depth * 20

  if (!isExpandable) {
    // Leaf node
    let displayValue: React.ReactNode
    let colorClass = 'text-zinc-800'
    if (typeof value === 'string') {
      colorClass = 'text-emerald-700'
      displayValue = `"${value}"`
    } else if (typeof value === 'number') {
      colorClass = 'text-blue-700'
      displayValue = String(value)
    } else if (typeof value === 'boolean') {
      colorClass = 'text-purple-700'
      displayValue = String(value)
    } else if (value === null) {
      colorClass = 'text-red-500'
      displayValue = 'null'
    } else {
      displayValue = String(value)
    }

    return (
      <div className="flex items-baseline py-[2px] hover:bg-zinc-50 rounded transition-colors" style={{ paddingLeft: indent + 24 }}>
        {name !== undefined && (
          <span className="text-zinc-500 font-semibold mr-1">&quot;{name}&quot;<span className="text-zinc-400">:</span> </span>
        )}
        <span className={`${colorClass} font-mono`}>{displayValue}</span>
      </div>
    )
  }

  const entries = isArray ? value.map((v: any, i: number) => [i, v]) : Object.entries(value)
  const bracket = isArray ? ['[', ']'] : ['{', '}']
  const count = entries.length

  return (
    <div>
      <div
        className="flex items-center py-[2px] hover:bg-zinc-50 rounded cursor-pointer select-none group transition-colors"
        style={{ paddingLeft: indent }}
        onClick={() => setOpen(!open)}
      >
        <span className="w-5 h-5 flex items-center justify-center shrink-0 text-zinc-400 group-hover:text-emerald-600 transition-colors">
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </span>
        {name !== undefined && (
          <span className="text-zinc-500 font-semibold mr-1">&quot;{name}&quot;<span className="text-zinc-400">:</span> </span>
        )}
        <span className="text-zinc-400 font-mono">{bracket[0]}</span>
        {!open && (
          <>
            <span className="text-zinc-300 font-mono mx-1">…</span>
            <span className="text-zinc-400 font-mono">{bracket[1]}</span>
            <span className="text-[10px] text-zinc-300 ml-2 font-mono">{count} {isArray ? 'items' : 'keys'}</span>
          </>
        )}
      </div>
      {open && (
        <>
          {entries.map((entry: any, idx: number) => {
            const key = entry[0]
            const val = entry[1]
            return (
              <JsonTreeNode
                key={isArray ? idx : key}
                name={isArray ? undefined : key}
                value={val}
                depth={depth + 1}
                defaultOpen={depth < 2}
              />
            )
          })}
          <div className="text-zinc-400 font-mono py-[2px]" style={{ paddingLeft: indent + 24 }}>
            {bracket[1]}
          </div>
        </>
      )}
    </div>
  )
}
