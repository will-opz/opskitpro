'use client'

import { useState } from 'react'
import { Save, FolderOpen, Trash2, Download, FileJson, FileSpreadsheet, Clock, MessageSquare, X } from 'lucide-react'
import { useMessageHistory } from '../hooks/useMessageHistory'
import type { LogEntry } from '../hooks'

interface SessionManagerProps {
  currentUrl: string
  currentLogs: LogEntry[]
  onLoadSession: (logs: LogEntry[]) => void
}

export function SessionManager({ currentUrl, currentLogs, onLoadSession }: SessionManagerProps) {
  const { 
    sessions, 
    saveSession, 
    deleteSession, 
    clearSessions,
    exportToJson,
    exportToCsv,
    exportToHar
  } = useMessageHistory()
  
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [sessionName, setSessionName] = useState('')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)

  const handleSave = () => {
    if (currentLogs.length === 0) return
    saveSession(sessionName || '', currentUrl, currentLogs)
    setSessionName('')
    setShowSaveDialog(false)
  }

  const handleLoad = (logs: LogEntry[]) => {
    onLoadSession(logs)
    setShowSessions(false)
  }

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString()
  }

  return (
    <div className="flex items-center gap-2">
      {/* Save Button */}
      <button
        onClick={() => setShowSaveDialog(true)}
        disabled={currentLogs.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Save className="w-3.5 h-3.5" />
        Save
      </button>

      {/* Load Button */}
      <button
        onClick={() => setShowSessions(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-lg text-[11px] font-bold transition-all"
      >
        <FolderOpen className="w-3.5 h-3.5" />
        Load
        {sessions.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 rounded-full text-[9px]">{sessions.length}</span>
        )}
      </button>

      {/* Export Dropdown */}
      <div className="relative">
        <button
          onClick={() => setExportMenuOpen(!exportMenuOpen)}
          disabled={currentLogs.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 rounded-lg text-[11px] font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          Export
        </button>
        
        {exportMenuOpen && (
          <div className="absolute top-full right-0 mt-1 w-40 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden">
            <button
              onClick={() => { exportToJson(currentLogs); setExportMenuOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 text-xs"
            >
              <FileJson className="w-4 h-4 text-amber-500" />
              JSON
            </button>
            <button
              onClick={() => { exportToCsv(currentLogs); setExportMenuOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 text-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              CSV
            </button>
            <button
              onClick={() => { exportToHar(currentLogs, currentUrl); setExportMenuOpen(false) }}
              className="w-full px-3 py-2 text-left hover:bg-zinc-50 flex items-center gap-2 text-xs"
            >
              <FileJson className="w-4 h-4 text-blue-500" />
              HAR
            </button>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-zinc-900">Save Session</h3>
              <button onClick={() => setShowSaveDialog(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Session Name</label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="My WebSocket Session"
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400"
                autoFocus
              />
            </div>

            <div className="text-xs text-zinc-500 mb-4 p-3 bg-zinc-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{currentLogs.filter(l => l.type === 'sent' || l.type === 'received').length} messages</span>
              </div>
              <div className="font-mono text-[10px] text-zinc-400 truncate">{currentUrl}</div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      {showSessions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSessions(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-zinc-100">
              <h3 className="text-lg font-bold text-zinc-900">Saved Sessions</h3>
              <div className="flex items-center gap-2">
                {sessions.length > 0 && (
                  <button
                    onClick={clearSessions}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Clear All
                  </button>
                )}
                <button onClick={() => setShowSessions(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {sessions.length === 0 ? (
                <div className="text-center py-12 text-zinc-400">
                  <FolderOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No saved sessions</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sessions.map(session => (
                    <div
                      key={session.id}
                      className="p-4 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors group"
                    >
                      <div className="flex items-start justify-between">
                        <button
                          onClick={() => handleLoad(session.logs)}
                          className="flex-1 text-left"
                        >
                          <div className="font-semibold text-zinc-800">{session.name}</div>
                          <div className="text-[11px] font-mono text-zinc-400 truncate mt-1">{session.url}</div>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(session.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              {session.messageCount} msgs
                            </span>
                          </div>
                        </button>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => exportToJson(session.logs, `${session.name}.json`)}
                            className="p-1.5 text-zinc-400 hover:text-amber-600"
                            title="Export JSON"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteSession(session.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
