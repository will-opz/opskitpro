'use client'

import { useState, useMemo } from 'react'
import { ArrowRightLeft, FileJson, FileCode, Copy, Check } from 'lucide-react'
import { jsonToYaml, yamlToJson, jsonToToml, tomlToJson, detectFormat } from '../hooks'
import type { ConvertFormat } from '../hooks'

interface FormatConverterProps {
  inputValue: string
  onConvert?: (output: string, format: ConvertFormat) => void
  dict: any
}

const FORMAT_ICONS: Record<ConvertFormat, any> = {
  json: FileJson,
  yaml: FileCode,
  toml: FileCode,
}

const FORMAT_LABELS: Record<ConvertFormat, string> = {
  json: 'JSON',
  yaml: 'YAML',
  toml: 'TOML',
}

const FORMAT_COLORS: Record<ConvertFormat, string> = {
  json: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  yaml: 'text-blue-600 bg-blue-50 border-blue-200',
  toml: 'text-purple-600 bg-purple-50 border-purple-200',
}

export function FormatConverter({ inputValue, onConvert, dict }: FormatConverterProps) {
  const [targetFormat, setTargetFormat] = useState<ConvertFormat>('yaml')
  const [copied, setCopied] = useState(false)

  const sourceFormat = useMemo(() => detectFormat(inputValue), [inputValue])

  const convertedOutput = useMemo(() => {
    if (!inputValue.trim()) return { output: '', error: null }

    // JSON → other
    if (sourceFormat === 'json') {
      if (targetFormat === 'yaml') return jsonToYaml(inputValue)
      if (targetFormat === 'toml') return jsonToToml(inputValue)
      return { output: inputValue, error: null }
    }

    // YAML → other
    if (sourceFormat === 'yaml') {
      const jsonResult = yamlToJson(inputValue)
      if (jsonResult.error) return jsonResult
      if (targetFormat === 'json') return jsonResult
      if (targetFormat === 'toml') return jsonToToml(jsonResult.output)
      return { output: inputValue, error: null }
    }

    // TOML → other
    if (sourceFormat === 'toml') {
      const jsonResult = tomlToJson(inputValue)
      if (jsonResult.error) return jsonResult
      if (targetFormat === 'json') return jsonResult
      if (targetFormat === 'yaml') return jsonToYaml(jsonResult.output)
      return { output: inputValue, error: null }
    }

    return { output: '', error: 'Unknown format' }
  }, [inputValue, sourceFormat, targetFormat])

  const handleCopy = () => {
    if (!convertedOutput.output) return
    navigator.clipboard.writeText(convertedOutput.output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const availableFormats: ConvertFormat[] = ['json', 'yaml', 'toml'].filter(
    f => f !== sourceFormat
  ) as ConvertFormat[]

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <ArrowRightLeft className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
            Format Convert
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Source format badge */}
          <span className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border ${FORMAT_COLORS[sourceFormat]}`}>
            {FORMAT_LABELS[sourceFormat]}
          </span>
          
          <span className="text-zinc-300">→</span>

          {/* Target format selector */}
          <div className="flex gap-1">
            {availableFormats.map(fmt => (
              <button
                key={fmt}
                onClick={() => setTargetFormat(fmt)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono font-bold border transition-all ${
                  targetFormat === fmt
                    ? FORMAT_COLORS[fmt]
                    : 'text-zinc-400 bg-white border-zinc-200 hover:border-zinc-300'
                }`}
              >
                {FORMAT_LABELS[fmt]}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            disabled={!convertedOutput.output || !!convertedOutput.error}
            className="flex items-center gap-1 px-2 py-1 bg-zinc-100 border border-zinc-200 rounded-md text-[10px] font-mono text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-30 disabled:cursor-not-allowed ml-2"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="relative">
        {convertedOutput.error ? (
          <div className="p-4 text-sm text-red-600 bg-red-50">
            <span className="font-semibold">Error:</span> {convertedOutput.error}
          </div>
        ) : (
          <pre className="p-4 max-h-[300px] overflow-auto font-mono text-[12px] leading-relaxed text-zinc-700 bg-zinc-50/30 selection:bg-blue-100">
            {convertedOutput.output || <span className="text-zinc-300 italic">No input</span>}
          </pre>
        )}
      </div>
    </div>
  )
}
