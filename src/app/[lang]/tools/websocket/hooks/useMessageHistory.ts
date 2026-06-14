'use client'

import { useState, useEffect, useCallback } from 'react'
import type { LogEntry } from './useWebSocket'

export interface SavedSession {
  id: string
  name: string
  url: string
  logs: LogEntry[]
  createdAt: number
  messageCount: number
}

const STORAGE_KEY = 'opskitpro_ws_sessions'
const MAX_SESSIONS = 10

export function useMessageHistory() {
  const [sessions, setSessions] = useState<SavedSession[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setSessions(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load sessions:', e)
    }
    setIsLoaded(true)
  }, [])

  const saveSessions = useCallback((newSessions: SavedSession[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSessions))
      setSessions(newSessions)
    } catch (e) {
      console.error('Failed to save sessions:', e)
    }
  }, [])

  const saveSession = useCallback((name: string, url: string, logs: LogEntry[]) => {
    const session: SavedSession = {
      id: Date.now().toString(36),
      name: name || `Session ${new Date().toLocaleString()}`,
      url,
      logs,
      createdAt: Date.now(),
      messageCount: logs.filter(l => l.type === 'sent' || l.type === 'received').length
    }
    saveSessions([session, ...sessions.slice(0, MAX_SESSIONS - 1)])
    return session
  }, [sessions, saveSessions])

  const deleteSession = useCallback((id: string) => {
    saveSessions(sessions.filter(s => s.id !== id))
  }, [sessions, saveSessions])

  const clearSessions = useCallback(() => {
    saveSessions([])
  }, [saveSessions])

  // Export functions
  const exportToJson = useCallback((logs: LogEntry[], filename?: string) => {
    const data = logs.map(log => ({
      time: log.time,
      timestamp: log.timestamp,
      type: log.type,
      messageType: log.messageType,
      message: log.message,
      size: log.size
    }))
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `ws-session-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportToCsv = useCallback((logs: LogEntry[], filename?: string) => {
    const headers = ['Time', 'Timestamp', 'Type', 'Message Type', 'Message', 'Size (bytes)']
    const rows = logs.map(log => [
      log.time,
      log.timestamp,
      log.type,
      log.messageType,
      `"${log.message.replace(/"/g, '""')}"`,
      log.size
    ])
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `ws-session-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportToHar = useCallback((logs: LogEntry[], wsUrl: string, filename?: string) => {
    // HAR format for WebSocket
    const har = {
      log: {
        version: '1.2',
        creator: { name: 'OpsKitPro WebSocket Workbench', version: '1.0' },
        entries: [{
          startedDateTime: new Date(logs[0]?.timestamp || Date.now()).toISOString(),
          time: 0,
          request: {
            method: 'GET',
            url: wsUrl,
            httpVersion: 'HTTP/1.1',
            headers: [{ name: 'Upgrade', value: 'websocket' }],
            queryString: [],
            cookies: [],
            headersSize: -1,
            bodySize: -1
          },
          response: {
            status: 101,
            statusText: 'Switching Protocols',
            httpVersion: 'HTTP/1.1',
            headers: [],
            cookies: [],
            content: { size: 0, mimeType: 'application/octet-stream' },
            redirectURL: '',
            headersSize: -1,
            bodySize: -1
          },
          cache: {},
          timings: { send: 0, wait: 0, receive: 0 },
          _webSocketMessages: logs.map(log => ({
            type: log.type === 'sent' ? 'send' : 'receive',
            time: log.timestamp,
            opcode: log.messageType === 'binary' ? 2 : 1,
            data: log.message
          }))
        }]
      }
    }
    
    const blob = new Blob([JSON.stringify(har, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename || `ws-session-${Date.now()}.har`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  return {
    sessions,
    isLoaded,
    saveSession,
    deleteSession,
    clearSessions,
    exportToJson,
    exportToCsv,
    exportToHar
  }
}
