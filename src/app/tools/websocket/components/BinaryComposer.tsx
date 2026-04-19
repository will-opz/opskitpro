'use client'

import { useState, useMemo } from 'react'
import { Binary, Send, FileUp, Hash, Type } from 'lucide-react'
import type { ConnectionStatus } from '../hooks'

interface BinaryComposerProps {
  status: ConnectionStatus
  onSend: (data: ArrayBuffer) => void
}

type InputMode = 'hex' | 'base64' | 'text' | 'file'

export function BinaryComposer({ status, onSend }: BinaryComposerProps) {
  const [mode, setMode] = useState<InputMode>('hex')
  const [hexInput, setHexInput] = useState('')
  const [base64Input, setBase64Input] = useState('')
  const [textInput, setTextInput] = useState('')
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null)
  const [fileName, setFileName] = useState('')

  // Convert hex string to ArrayBuffer
  const hexToBuffer = (hex: string): ArrayBuffer | null => {
    const cleaned = hex.replace(/[\s-]/g, '')
    if (!/^[0-9a-fA-F]*$/.test(cleaned) || cleaned.length % 2 !== 0) return null
    const bytes = new Uint8Array(cleaned.length / 2)
    for (let i = 0; i < cleaned.length; i += 2) {
      bytes[i / 2] = parseInt(cleaned.substr(i, 2), 16)
    }
    return bytes.buffer as ArrayBuffer
  }

  // Convert base64 to ArrayBuffer
  const base64ToBuffer = (b64: string): ArrayBuffer | null => {
    try {
      const binary = atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      return bytes.buffer as ArrayBuffer
    } catch {
      return null
    }
  }

  // Convert text (UTF-8) to ArrayBuffer
  const textToBuffer = (text: string): ArrayBuffer => {
    return new TextEncoder().encode(text).buffer as ArrayBuffer
  }

  // Get current buffer based on mode
  const currentBuffer = useMemo((): ArrayBuffer | null => {
    switch (mode) {
      case 'hex': return hexToBuffer(hexInput)
      case 'base64': return base64ToBuffer(base64Input)
      case 'text': return textInput ? textToBuffer(textInput) : null
      case 'file': return fileData
    }
  }, [mode, hexInput, base64Input, textInput, fileData])

  const isValid = currentBuffer !== null && currentBuffer.byteLength > 0

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (ev) => {
      const result = ev.target?.result as ArrayBuffer
      setFileData(result)
      setFileName(file.name)
    }
    reader.readAsArrayBuffer(file)
  }

  const handleSend = () => {
    if (!isValid || status !== 'connected') return
    onSend(currentBuffer!)
  }

  // Preview hex of current buffer
  const previewHex = useMemo(() => {
    if (!currentBuffer) return ''
    const bytes = new Uint8Array(currentBuffer)
    const preview = Array.from(bytes.slice(0, 32))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ')
    return bytes.length > 32 ? `${preview} ... (${bytes.length} bytes)` : preview
  }, [currentBuffer])

  return (
    <div className="glass-card rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-white/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-500/10 flex items-center justify-center rounded-lg">
            <Binary className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-700">Binary Composer</h3>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 bg-zinc-100 rounded-lg p-0.5">
          {([
            { mode: 'hex' as InputMode, icon: Hash, label: 'Hex' },
            { mode: 'base64' as InputMode, icon: Type, label: 'Base64' },
            { mode: 'text' as InputMode, icon: Type, label: 'UTF-8' },
            { mode: 'file' as InputMode, icon: FileUp, label: 'File' },
          ]).map(m => (
            <button
              key={m.mode}
              onClick={() => setMode(m.mode)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all ${
                mode === m.mode
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <m.icon className="w-3 h-3" />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="p-4">
        {mode === 'hex' && (
          <div>
            <textarea
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="48 65 6c 6c 6f (space/dash separated hex bytes)"
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              spellCheck={false}
            />
            <p className="text-[10px] text-zinc-400 mt-1">Enter hex bytes separated by spaces or dashes</p>
          </div>
        )}

        {mode === 'base64' && (
          <div>
            <textarea
              value={base64Input}
              onChange={(e) => setBase64Input(e.target.value)}
              placeholder="SGVsbG8gV29ybGQ="
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              spellCheck={false}
            />
            <p className="text-[10px] text-zinc-400 mt-1">Enter base64 encoded data</p>
          </div>
        )}

        {mode === 'text' && (
          <div>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text to encode as UTF-8 binary"
              rows={3}
              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Text will be encoded as UTF-8</p>
          </div>
        )}

        {mode === 'file' && (
          <div>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <input
                type="file"
                className="hidden"
                onChange={handleFileUpload}
              />
              {fileName ? (
                <div className="text-center">
                  <div className="text-sm font-semibold text-zinc-700">{fileName}</div>
                  <div className="text-[10px] text-zinc-500 mt-1">
                    {fileData ? `${fileData.byteLength} bytes` : ''}
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-400">
                  <FileUp className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">Click to select file</span>
                </div>
              )}
            </label>
          </div>
        )}

        {/* Preview */}
        {currentBuffer && currentBuffer.byteLength > 0 && (
          <div className="mt-3 p-3 bg-zinc-900 rounded-xl">
            <div className="text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Preview ({currentBuffer.byteLength} bytes)</div>
            <div className="font-mono text-[11px] text-purple-400 break-all">{previewHex}</div>
          </div>
        )}

        {/* Send button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSend}
            disabled={!isValid || status !== 'connected'}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
          >
            <Send className="w-4 h-4" />
            Send Binary
          </button>
        </div>
      </div>
    </div>
  )
}
