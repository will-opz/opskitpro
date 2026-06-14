'use client'

import { useState } from 'react'
import { Plus, X, Wifi, WifiOff, AlertCircle, Loader2, Edit3, Check } from 'lucide-react'
import type { ConnectionTab } from '../hooks/useMultiConnection'

interface ConnectionTabsProps {
  tabs: ConnectionTab[]
  activeTabId: string
  onSelectTab: (id: string) => void
  onAddTab: () => void
  onRemoveTab: (id: string) => void
  onRenameTab: (id: string, name: string) => void
  canAddTab: boolean
}

export function ConnectionTabs({
  tabs,
  activeTabId,
  onSelectTab,
  onAddTab,
  onRemoveTab,
  onRenameTab,
  canAddTab
}: ConnectionTabsProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEdit = (tab: ConnectionTab, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingId(tab.id)
    setEditName(tab.name)
  }

  const confirmEdit = (id: string) => {
    if (editName.trim()) {
      onRenameTab(id, editName.trim())
    }
    setEditingId(null)
  }

  const getStatusIcon = (status: ConnectionTab['status']) => {
    switch (status) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-emerald-500" />
      case 'connecting':
        return <Loader2 className="w-3 h-3 text-amber-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-500" />
      default:
        return <WifiOff className="w-3 h-3 text-zinc-400" />
    }
  }

  const getStatusColor = (status: ConnectionTab['status'], isActive: boolean) => {
    if (!isActive) return 'border-transparent'
    switch (status) {
      case 'connected': return 'border-emerald-500'
      case 'connecting': return 'border-amber-500'
      case 'error': return 'border-red-500'
      default: return 'border-cyan-500'
    }
  }

  return (
    <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl overflow-x-auto">
      {tabs.map(tab => (
        <div
          key={tab.id}
          onClick={() => onSelectTab(tab.id)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all border-b-2 ${
            activeTabId === tab.id
              ? `bg-white shadow-sm ${getStatusColor(tab.status, true)}`
              : 'hover:bg-white/50 border-transparent'
          }`}
        >
          {getStatusIcon(tab.status)}
          
          {editingId === tab.id ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmEdit(tab.id)
                if (e.key === 'Escape') setEditingId(null)
              }}
              onBlur={() => confirmEdit(tab.id)}
              className="w-24 px-1 py-0.5 text-xs bg-zinc-50 border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className={`text-xs font-medium truncate max-w-[100px] ${
              activeTabId === tab.id ? 'text-zinc-800' : 'text-zinc-500'
            }`}>
              {tab.name}
            </span>
          )}

          {/* Message count badge */}
          {tab.logs.filter(l => l.type === 'sent' || l.type === 'received').length > 0 && (
            <span className="px-1.5 py-0.5 bg-zinc-200 rounded-full text-[9px] font-bold text-zinc-500">
              {tab.logs.filter(l => l.type === 'sent' || l.type === 'received').length}
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-0.5 ml-1">
            {editingId !== tab.id && (
              <button
                onClick={(e) => startEdit(tab, e)}
                className="p-0.5 text-zinc-300 hover:text-zinc-600 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
            
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemoveTab(tab.id)
                }}
                className="p-0.5 text-zinc-300 hover:text-red-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add tab button */}
      {canAddTab && (
        <button
          onClick={onAddTab}
          className="p-2 text-zinc-400 hover:text-cyan-600 hover:bg-white rounded-lg transition-all"
          title="Add connection"
        >
          <Plus className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
