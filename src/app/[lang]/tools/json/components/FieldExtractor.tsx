'use client'

import { useState, useMemo } from 'react'
import { Table, Plus, Trash2, Copy, Check, Download, GripVertical } from 'lucide-react'

interface FieldExtractorProps {
  inputJson: string
  dict: any
}

interface FieldConfig {
  id: string
  path: string
  label: string
}

function extractValue(obj: any, path: string): any {
  if (!path) return obj
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.')
  let current = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = current[part]
  }
  return current
}

function getAllPaths(obj: any, prefix = ''): string[] {
  const paths: string[] = []
  
  if (Array.isArray(obj)) {
    if (obj.length > 0) {
      const itemPaths = getAllPaths(obj[0], '')
      paths.push(...itemPaths.map(p => `[]${p ? '.' + p : ''}`))
    }
  } else if (typeof obj === 'object' && obj !== null) {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = prefix ? `${prefix}.${key}` : key
      paths.push(currentPath)
      if (typeof value === 'object' && value !== null) {
        paths.push(...getAllPaths(value, currentPath))
      }
    }
  }
  
  return paths
}

export function FieldExtractor({ inputJson, dict }: FieldExtractorProps) {
  const [fields, setFields] = useState<FieldConfig[]>([
    { id: '1', path: '', label: 'Column 1' }
  ])
  const [copied, setCopied] = useState<'csv' | 'md' | null>(null)

  const parsedData = useMemo(() => {
    try {
      return JSON.parse(inputJson)
    } catch {
      return null
    }
  }, [inputJson])

  const availablePaths = useMemo(() => {
    if (!parsedData) return []
    return getAllPaths(parsedData)
  }, [parsedData])

  // Get the array to iterate over
  const dataArray = useMemo(() => {
    if (!parsedData) return []
    if (Array.isArray(parsedData)) return parsedData
    // If it's an object with an array property, find it
    for (const value of Object.values(parsedData)) {
      if (Array.isArray(value)) return value as any[]
    }
    return [parsedData]
  }, [parsedData])

  // Extract table data
  const tableData = useMemo(() => {
    return dataArray.map((item, idx) => {
      const row: Record<string, any> = { _idx: idx }
      for (const field of fields) {
        if (field.path) {
          // Handle [] prefix for array items
          const actualPath = field.path.startsWith('[]') 
            ? field.path.slice(2).replace(/^\./, '')
            : field.path
          row[field.id] = extractValue(item, actualPath)
        }
      }
      return row
    })
  }, [dataArray, fields])

  const addField = () => {
    setFields([...fields, { 
      id: String(Date.now()), 
      path: '', 
      label: `Column ${fields.length + 1}` 
    }])
  }

  const removeField = (id: string) => {
    if (fields.length <= 1) return
    setFields(fields.filter(f => f.id !== id))
  }

  const updateField = (id: string, updates: Partial<FieldConfig>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f))
  }

  const formatValue = (val: any): string => {
    if (val === undefined || val === null) return ''
    if (typeof val === 'object') return JSON.stringify(val)
    return String(val)
  }

  const exportCSV = () => {
    const headers = fields.map(f => f.label).join(',')
    const rows = tableData.map(row => 
      fields.map(f => {
        const val = formatValue(row[f.id])
        // Escape quotes and wrap in quotes if contains comma
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`
        }
        return val
      }).join(',')
    )
    return [headers, ...rows].join('\n')
  }

  const exportMarkdown = () => {
    const headers = `| ${fields.map(f => f.label).join(' | ')} |`
    const separator = `| ${fields.map(() => '---').join(' | ')} |`
    const rows = tableData.map(row => 
      `| ${fields.map(f => formatValue(row[f.id])).join(' | ')} |`
    )
    return [headers, separator, ...rows].join('\n')
  }

  const copyAs = (format: 'csv' | 'md') => {
    const content = format === 'csv' ? exportCSV() : exportMarkdown()
    navigator.clipboard.writeText(content)
    setCopied(format)
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadCSV = () => {
    const csv = exportCSV()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extract-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2 text-blue-600">
          <Table className="w-4 h-4" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider">Field Extractor</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => copyAs('csv')}
            disabled={tableData.length === 0}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-mono text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-30"
          >
            {copied === 'csv' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            CSV
          </button>
          <button
            onClick={() => copyAs('md')}
            disabled={tableData.length === 0}
            className="flex items-center gap-1 px-2 py-1 bg-white border border-zinc-200 rounded text-[10px] font-mono text-zinc-600 hover:bg-zinc-50 transition-all disabled:opacity-30"
          >
            {copied === 'md' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            Markdown
          </button>
          <button
            onClick={downloadCSV}
            disabled={tableData.length === 0}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded text-[10px] font-mono font-bold hover:bg-blue-500 transition-all disabled:opacity-30"
          >
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>
      </div>

      {/* Field configuration */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Fields</span>
          <button
            onClick={addField}
            className="p-1 text-zinc-400 hover:text-emerald-600 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {fields.map((field, idx) => (
            <div key={field.id} className="flex items-center gap-1 bg-white border border-zinc-200 rounded-lg p-1.5">
              <input
                type="text"
                value={field.label}
                onChange={(e) => updateField(field.id, { label: e.target.value })}
                className="w-20 px-1.5 py-0.5 text-[10px] font-mono bg-zinc-50 border border-zinc-100 rounded focus:outline-none focus:border-blue-300"
                placeholder="Label"
              />
              <select
                value={field.path}
                onChange={(e) => updateField(field.id, { path: e.target.value })}
                className="w-32 px-1.5 py-0.5 text-[10px] font-mono bg-zinc-50 border border-zinc-100 rounded focus:outline-none focus:border-blue-300"
              >
                <option value="">Select path...</option>
                {availablePaths.map(path => (
                  <option key={path} value={path}>{path}</option>
                ))}
              </select>
              {fields.length > 1 && (
                <button
                  onClick={() => removeField(field.id)}
                  className="p-0.5 text-zinc-300 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table preview */}
      <div className="flex-1 overflow-auto">
        {tableData.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <Table className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[11px] font-mono">No data to extract</p>
          </div>
        ) : (
          <table className="w-full text-[11px] font-mono">
            <thead className="bg-zinc-50 sticky top-0">
              <tr>
                <th className="px-3 py-2 text-left text-zinc-400 font-bold border-b border-zinc-100">#</th>
                {fields.map(field => (
                  <th key={field.id} className="px-3 py-2 text-left text-zinc-600 font-bold border-b border-zinc-100">
                    {field.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-3 py-2 text-zinc-300 border-b border-zinc-50">{idx + 1}</td>
                  {fields.map(field => (
                    <td key={field.id} className="px-3 py-2 text-zinc-700 border-b border-zinc-50 max-w-[200px] truncate">
                      {formatValue(row[field.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Stats footer */}
      <div className="px-4 py-2 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between text-[10px] font-mono text-zinc-400">
        <span>{tableData.length} row{tableData.length !== 1 ? 's' : ''}</span>
        <span>{fields.filter(f => f.path).length} field{fields.filter(f => f.path).length !== 1 ? 's' : ''} selected</span>
      </div>
    </div>
  )
}
