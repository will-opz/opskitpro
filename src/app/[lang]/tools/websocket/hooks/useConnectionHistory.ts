'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ConnectionRecord {
  id: string
  url: string
  name?: string
  lastConnectedAt: number
  connectCount: number
  autoReconnect: boolean
}

const STORAGE_KEY = 'opskitpro_ws_history'
const MAX_HISTORY = 20

export function useConnectionHistory() {
  const [history, setHistory] = useState<ConnectionRecord[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setHistory(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load history:', e)
    }
    setIsLoaded(true)
  }, [])

  const saveHistory = useCallback((records: ConnectionRecord[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
      setHistory(records)
    } catch (e) {
      console.error('Failed to save history:', e)
    }
  }, [])

  const addConnection = useCallback((url: string, autoReconnect: boolean = false) => {
    const existing = history.find(h => h.url === url)
    
    if (existing) {
      // Update existing
      saveHistory(history.map(h => 
        h.url === url 
          ? { ...h, lastConnectedAt: Date.now(), connectCount: h.connectCount + 1, autoReconnect }
          : h
      ).sort((a, b) => b.lastConnectedAt - a.lastConnectedAt))
    } else {
      // Add new
      const newRecord: ConnectionRecord = {
        id: Date.now().toString(36),
        url,
        lastConnectedAt: Date.now(),
        connectCount: 1,
        autoReconnect
      }
      saveHistory([newRecord, ...history.slice(0, MAX_HISTORY - 1)])
    }
  }, [history, saveHistory])

  const renameConnection = useCallback((id: string, name: string) => {
    saveHistory(history.map(h => 
      h.id === id ? { ...h, name } : h
    ))
  }, [history, saveHistory])

  const deleteConnection = useCallback((id: string) => {
    saveHistory(history.filter(h => h.id !== id))
  }, [history, saveHistory])

  const clearHistory = useCallback(() => {
    saveHistory([])
  }, [saveHistory])

  return {
    history,
    isLoaded,
    addConnection,
    renameConnection,
    deleteConnection,
    clearHistory
  }
}
