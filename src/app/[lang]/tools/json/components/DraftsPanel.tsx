'use client'

import { useState } from 'react'
import { FileJson, Trash2, Edit3, Check, X, Clock, Link2, Loader2 } from 'lucide-react'
import { useJsonStorage, useUrlLoader } from '../hooks/useJsonStorage'
import type { JsonDraft } from '../hooks/useJsonStorage'

interface DraftsPanelProps {
  currentContent: string
  onLoad: (content: string) => void
  onSave: () => void
  dict: any
}

export function DraftsPanel({ currentContent, onLoad, onSave, dict }: DraftsPanelProps) {
  const { drafts, isLoaded, saveDraft, deleteDraft, renameDraft } = useJsonStorage()
  const { loadFromUrl, isLoading: urlLoading, error: urlError } = useUrlLoader()
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [saveName, setSaveName] = useState('')
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const handleSave = () => {
    if (!currentContent.trim()) return
    saveDraft(saveName || '', currentContent)
    setSaveName('')
    setShowSaveDialog(false)
  }

  const handleLoadUrl = async () => {
    if (!urlInput.trim()) return
    const content = await loadFromUrl(urlInput)
    if (content) {
      onLoad(content)
      setUrlInput('')
    }
  }

  const startEdit = (draft: JsonDraft) => {
    setEditingId(draft.id)
    setEditName(draft.name)
  }

  const confirmEdit = (id: string) => {
    renameDraft(id, editName)
    setEditingId(null)
  }

  const formatDate = (ts: number) => {
    const date = new Date(ts)
    const now = new Date()
    const diffMs = now.getTime() - ts
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="h-full flex flex-col">
      {/* URL Loader */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-gradient-to-r from-blue-50 to-white">
        <div className="flex items-center gap-2 mb-2">
          <Link2 className="w-4 h-4 text-blue-500" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600">Load from URL</span>
        </div>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoadUrl()}
            placeholder="https://api.example.com/data.json"
            className="flex-1 px-3 py-2 text-[11px] font-mono bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
          <button
            onClick={handleLoadUrl}
            disabled={!urlInput.trim() || urlLoading}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-[11px] font-bold hover:bg-blue-500 transition-all disabled:opacity-50 flex items-center gap-1"
          >
            {urlLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Fetch'}
          </button>
        </div>
        {urlError && (
          <p className="mt-1.5 text-[10px] text-red-500 font-mono">{urlError}</p>
        )}
      </div>

      {/* Save current */}
      <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
        {showSaveDialog ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              placeholder="Draft name (optional)"
              className="flex-1 px-3 py-2 text-[11px] font-mono bg-white border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-500"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="px-3 py-2 bg-zinc-200 text-zinc-600 rounded-lg text-[11px] font-bold hover:bg-zinc-300"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowSaveDialog(true)}
            disabled={!currentContent.trim()}
            className="w-full px-3 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-bold hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            Save Current as Draft
          </button>
        )}
      </div>

      {/* Drafts list */}
      <div className="flex-1 overflow-auto">
        <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100 sticky top-0">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
            Saved Drafts ({drafts.length}/10)
          </span>
        </div>

        {!isLoaded ? (
          <div className="p-8 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-300 mx-auto" />
          </div>
        ) : drafts.length === 0 ? (
          <div className="p-8 text-center text-zinc-400">
            <FileJson className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[11px] font-mono">No saved drafts</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-50">
            {drafts.map(draft => (
              <div
                key={draft.id}
                className="px-4 py-3 hover:bg-zinc-50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    {editingId === draft.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmEdit(draft.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="flex-1 px-2 py-1 text-[11px] font-mono bg-white border border-blue-300 rounded focus:outline-none"
                          autoFocus
                        />
                        <button onClick={() => confirmEdit(draft.id)} className="p-1 text-emerald-600">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-zinc-400">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onLoad(draft.content)}
                          className="text-left w-full"
                        >
                          <p className="text-[12px] font-semibold text-zinc-700 truncate hover:text-blue-600 transition-colors">
                            {draft.name}
                          </p>
                          <p className="text-[10px] font-mono text-zinc-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {formatDate(draft.updatedAt)}
                            <span className="text-zinc-300">•</span>
                            {Math.round(draft.content.length / 1024 * 10) / 10} KB
                          </p>
                        </button>
                      </>
                    )}
                  </div>

                  {editingId !== draft.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(draft)}
                        className="p-1.5 text-zinc-400 hover:text-blue-600 transition-colors"
                        title="Rename"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteDraft(draft.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
