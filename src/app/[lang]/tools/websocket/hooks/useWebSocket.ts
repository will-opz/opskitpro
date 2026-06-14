'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'
export type MessageType = 'text' | 'json' | 'binary'

export interface LogEntry {
  id: string
  type: 'info' | 'error' | 'sent' | 'received' | 'ping' | 'pong'
  message: string
  rawData?: ArrayBuffer
  messageType: MessageType
  size: number
  time: string
  timestamp: number
}

export interface WebSocketConfig {
  url: string
  autoReconnect: boolean
  reconnectInterval: number
  maxReconnectAttempts: number
  binaryType: 'arraybuffer' | 'blob'
}

const DEFAULT_CONFIG: WebSocketConfig = {
  url: '',
  autoReconnect: false,
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  binaryType: 'arraybuffer'
}

export function useWebSocket() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [config, setConfig] = useState<WebSocketConfig>(DEFAULT_CONFIG)
  const [stats, setStats] = useState({
    messagesSent: 0,
    messagesReceived: 0,
    bytesSent: 0,
    bytesReceived: 0,
    connectedAt: null as number | null,
    latency: null as number | null
  })

  const socketRef = useRef<WebSocket | null>(null)
  const reconnectAttemptRef = useRef(0)
  const reconnectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastPingRef = useRef<number | null>(null)

  const addLog = useCallback((
    type: LogEntry['type'], 
    message: string, 
    options?: { rawData?: ArrayBuffer; messageType?: MessageType }
  ) => {
    const size = options?.rawData?.byteLength ?? new Blob([message]).size
    const entry: LogEntry = {
      id: Math.random().toString(36).slice(2, 11),
      type,
      message,
      rawData: options?.rawData,
      messageType: options?.messageType ?? 'text',
      size,
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      timestamp: Date.now()
    }
    setLogs(prev => [...prev, entry].slice(-500)) // Keep last 500 logs
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  const connect = useCallback((url: string, options?: Partial<WebSocketConfig>) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.close()
    }

    const newConfig = { ...config, ...options, url }
    setConfig(newConfig)

    try {
      setStatus('connecting')
      addLog('info', `Connecting to ${url}...`)
      
      const ws = new WebSocket(url)
      ws.binaryType = newConfig.binaryType
      socketRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        reconnectAttemptRef.current = 0
        setStats(prev => ({ ...prev, connectedAt: Date.now() }))
        addLog('info', `Connection established`)
      }

      ws.onmessage = (event) => {
        const isJson = typeof event.data === 'string' && 
          (event.data.startsWith('{') || event.data.startsWith('['))
        
        let displayMessage = event.data
        let messageType: MessageType = 'text'

        if (event.data instanceof ArrayBuffer) {
          displayMessage = `[Binary: ${event.data.byteLength} bytes]`
          messageType = 'binary'
        } else if (isJson) {
          try {
            JSON.parse(event.data)
            messageType = 'json'
          } catch {}
        }

        const size = event.data instanceof ArrayBuffer 
          ? event.data.byteLength 
          : new Blob([event.data]).size

        setStats(prev => ({
          ...prev,
          messagesReceived: prev.messagesReceived + 1,
          bytesReceived: prev.bytesReceived + size
        }))

        addLog('received', displayMessage, { 
          rawData: event.data instanceof ArrayBuffer ? event.data : undefined,
          messageType 
        })
      }

      ws.onclose = (event) => {
        setStatus('disconnected')
        setStats(prev => ({ ...prev, connectedAt: null, latency: null }))
        addLog('info', `Connection closed (${event.code})${event.reason ? `: ${event.reason}` : ''}`)
        socketRef.current = null

        // Auto-reconnect logic
        if (newConfig.autoReconnect && reconnectAttemptRef.current < newConfig.maxReconnectAttempts) {
          reconnectAttemptRef.current++
          addLog('info', `Reconnecting in ${newConfig.reconnectInterval / 1000}s (attempt ${reconnectAttemptRef.current}/${newConfig.maxReconnectAttempts})...`)
          reconnectTimerRef.current = setTimeout(() => {
            connect(url, newConfig)
          }, newConfig.reconnectInterval)
        }
      }

      ws.onerror = () => {
        setStatus('error')
        addLog('error', `WebSocket error occurred`)
      }
    } catch (e: any) {
      setStatus('error')
      addLog('error', `Failed to connect: ${e.message}`)
    }
  }, [config, addLog])

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }
    reconnectAttemptRef.current = config.maxReconnectAttempts // Prevent auto-reconnect
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'User disconnected')
    }
  }, [config.maxReconnectAttempts])

  const send = useCallback((data: string | ArrayBuffer) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) {
      addLog('error', 'Cannot send: Not connected')
      return false
    }

    try {
      socketRef.current.send(data)
      
      const size = data instanceof ArrayBuffer ? data.byteLength : new Blob([data]).size
      const isJson = typeof data === 'string' && (data.startsWith('{') || data.startsWith('['))
      
      setStats(prev => ({
        ...prev,
        messagesSent: prev.messagesSent + 1,
        bytesSent: prev.bytesSent + size
      }))

      addLog('sent', typeof data === 'string' ? data : `[Binary: ${size} bytes]`, {
        messageType: data instanceof ArrayBuffer ? 'binary' : (isJson ? 'json' : 'text')
      })
      return true
    } catch (e: any) {
      addLog('error', `Send failed: ${e.message}`)
      return false
    }
  }, [addLog])

  const sendPing = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      lastPingRef.current = Date.now()
      send(JSON.stringify({ type: 'ping', timestamp: lastPingRef.current }))
    }
  }, [send])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      if (pingTimerRef.current) clearInterval(pingTimerRef.current)
      socketRef.current?.close()
    }
  }, [])

  return {
    status,
    logs,
    stats,
    config,
    connect,
    disconnect,
    send,
    sendPing,
    clearLogs,
    setConfig
  }
}
