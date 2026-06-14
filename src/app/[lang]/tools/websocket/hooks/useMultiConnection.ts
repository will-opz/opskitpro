'use client'

import { useState, useCallback, useRef } from 'react'
import type { ConnectionStatus, LogEntry, WebSocketConfig } from './useWebSocket'

export interface ConnectionTab {
  id: string
  name: string
  url: string
  status: ConnectionStatus
  logs: LogEntry[]
  stats: {
    messagesSent: number
    messagesReceived: number
    bytesSent: number
    bytesReceived: number
    connectedAt: number | null
    latency: number | null
  }
  config: WebSocketConfig
}

const MAX_TABS = 5

export function useMultiConnection() {
  const [tabs, setTabs] = useState<ConnectionTab[]>([
    {
      id: 'default',
      name: 'Connection 1',
      url: 'wss://echo.websocket.org',
      status: 'disconnected',
      logs: [],
      stats: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        connectedAt: null,
        latency: null
      },
      config: {
        url: '',
        autoReconnect: false,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        binaryType: 'arraybuffer'
      }
    }
  ])
  const [activeTabId, setActiveTabId] = useState('default')
  
  const socketsRef = useRef<Map<string, WebSocket>>(new Map())
  const reconnectTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const reconnectAttemptsRef = useRef<Map<string, number>>(new Map())

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0]

  const updateTab = useCallback((tabId: string, updates: Partial<ConnectionTab>) => {
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, ...updates } : t
    ))
  }, [])

  const addLog = useCallback((tabId: string, type: LogEntry['type'], message: string, options?: { messageType?: LogEntry['messageType'] }) => {
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2, 11),
      type,
      message,
      messageType: options?.messageType || 'text',
      size: new Blob([message]).size,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      timestamp: Date.now()
    }
    setTabs(prev => prev.map(t => 
      t.id === tabId ? { ...t, logs: [...t.logs, entry].slice(-500) } : t
    ))
  }, [])

  const connect = useCallback((tabId: string, url: string, config?: Partial<WebSocketConfig>) => {
    const existingSocket = socketsRef.current.get(tabId)
    if (existingSocket?.readyState === WebSocket.OPEN) {
      existingSocket.close()
    }

    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return

    const fullConfig = { ...tab.config, ...config, url }
    updateTab(tabId, { url, status: 'connecting', config: fullConfig })
    addLog(tabId, 'info', `Connecting to ${url}...`)

    try {
      const ws = new WebSocket(url)
      ws.binaryType = fullConfig.binaryType
      socketsRef.current.set(tabId, ws)

      ws.onopen = () => {
        updateTab(tabId, { 
          status: 'connected',
          stats: { ...tab.stats, connectedAt: Date.now() }
        })
        reconnectAttemptsRef.current.set(tabId, 0)
        addLog(tabId, 'info', 'Connection established')
      }

      ws.onmessage = (event) => {
        const isJson = typeof event.data === 'string' && 
          (event.data.startsWith('{') || event.data.startsWith('['))
        
        const size = event.data instanceof ArrayBuffer 
          ? event.data.byteLength 
          : new Blob([event.data]).size

        setTabs(prev => prev.map(t => 
          t.id === tabId ? {
            ...t,
            stats: {
              ...t.stats,
              messagesReceived: t.stats.messagesReceived + 1,
              bytesReceived: t.stats.bytesReceived + size
            }
          } : t
        ))

        addLog(tabId, 'received', 
          event.data instanceof ArrayBuffer ? `[Binary: ${event.data.byteLength} bytes]` : event.data,
          { messageType: event.data instanceof ArrayBuffer ? 'binary' : (isJson ? 'json' : 'text') }
        )
      }

      ws.onclose = (event) => {
        updateTab(tabId, { 
          status: 'disconnected',
          stats: { ...tab.stats, connectedAt: null }
        })
        socketsRef.current.delete(tabId)
        addLog(tabId, 'info', `Connection closed (${event.code})`)

        // Auto-reconnect
        if (fullConfig.autoReconnect) {
          const attempts = reconnectAttemptsRef.current.get(tabId) || 0
          if (attempts < fullConfig.maxReconnectAttempts) {
            reconnectAttemptsRef.current.set(tabId, attempts + 1)
            addLog(tabId, 'info', `Reconnecting in ${fullConfig.reconnectInterval / 1000}s...`)
            const timer = setTimeout(() => connect(tabId, url, fullConfig), fullConfig.reconnectInterval)
            reconnectTimersRef.current.set(tabId, timer)
          }
        }
      }

      ws.onerror = () => {
        updateTab(tabId, { status: 'error' })
        addLog(tabId, 'error', 'WebSocket error')
      }
    } catch (e: any) {
      updateTab(tabId, { status: 'error' })
      addLog(tabId, 'error', `Failed to connect: ${e.message}`)
    }
  }, [tabs, updateTab, addLog])

  const disconnect = useCallback((tabId: string) => {
    const timer = reconnectTimersRef.current.get(tabId)
    if (timer) {
      clearTimeout(timer)
      reconnectTimersRef.current.delete(tabId)
    }
    reconnectAttemptsRef.current.set(tabId, 999) // Prevent auto-reconnect

    const socket = socketsRef.current.get(tabId)
    if (socket) {
      socket.close(1000, 'User disconnected')
    }
  }, [])

  const send = useCallback((tabId: string, data: string | ArrayBuffer) => {
    const socket = socketsRef.current.get(tabId)
    if (socket?.readyState !== WebSocket.OPEN) {
      addLog(tabId, 'error', 'Not connected')
      return false
    }

    try {
      socket.send(data)
      const size = data instanceof ArrayBuffer ? data.byteLength : new Blob([data]).size
      const isJson = typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))

      setTabs(prev => prev.map(t => 
        t.id === tabId ? {
          ...t,
          stats: {
            ...t.stats,
            messagesSent: t.stats.messagesSent + 1,
            bytesSent: t.stats.bytesSent + size
          }
        } : t
      ))

      addLog(tabId, 'sent', 
        typeof data === 'string' ? data : `[Binary: ${size} bytes]`,
        { messageType: data instanceof ArrayBuffer ? 'binary' : (isJson ? 'json' : 'text') }
      )
      return true
    } catch (e: any) {
      addLog(tabId, 'error', `Send failed: ${e.message}`)
      return false
    }
  }, [addLog])

  const addTab = useCallback(() => {
    if (tabs.length >= MAX_TABS) return null
    
    const newTab: ConnectionTab = {
      id: Date.now().toString(36),
      name: `Connection ${tabs.length + 1}`,
      url: 'wss://echo.websocket.org',
      status: 'disconnected',
      logs: [],
      stats: {
        messagesSent: 0,
        messagesReceived: 0,
        bytesSent: 0,
        bytesReceived: 0,
        connectedAt: null,
        latency: null
      },
      config: {
        url: '',
        autoReconnect: false,
        reconnectInterval: 3000,
        maxReconnectAttempts: 5,
        binaryType: 'arraybuffer'
      }
    }
    
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    return newTab
  }, [tabs.length])

  const removeTab = useCallback((tabId: string) => {
    if (tabs.length <= 1) return
    
    disconnect(tabId)
    setTabs(prev => prev.filter(t => t.id !== tabId))
    
    if (activeTabId === tabId) {
      const remaining = tabs.filter(t => t.id !== tabId)
      setActiveTabId(remaining[0]?.id || '')
    }
  }, [tabs, activeTabId, disconnect])

  const renameTab = useCallback((tabId: string, name: string) => {
    updateTab(tabId, { name })
  }, [updateTab])

  const clearLogs = useCallback((tabId: string) => {
    updateTab(tabId, { logs: [] })
  }, [updateTab])

  return {
    tabs,
    activeTab,
    activeTabId,
    setActiveTabId,
    connect,
    disconnect,
    send,
    addTab,
    removeTab,
    renameTab,
    clearLogs,
    canAddTab: tabs.length < MAX_TABS
  }
}
