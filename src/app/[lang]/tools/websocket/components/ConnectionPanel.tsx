'use client'

import { useState } from 'react'
import { Play, Square, RefreshCw, History, Trash2, Clock, ChevronDown, Settings, Wifi, WifiOff } from 'lucide-react'
import { useConnectionHistory } from '../hooks'
import type { ConnectionStatus, WebSocketConfig } from '../hooks'

interface ConnectionPanelProps {
  status: ConnectionStatus
  config: WebSocketConfig
  onConnect: (url: string, options?: Partial<WebSocketConfig>) => void
  onDisconnect: () => void
  onConfigChange: (config: Partial<WebSocketConfig>) => void
}

const SAMPLE_URLS = [
  { url: 'wss://echo.websocket.org', name: 'Echo Server' },
  { url: 'wss://ws.postman-echo.com/raw', name: 'Postman Echo' },
  { url: 'wss://socketsbay.com/wss/v2/1/demo/', name: 'SocketsBay Demo' }
]

export function ConnectionPanel({ 
  status, 
  config, 
  onConnect, 
  onDisconnect, 
  onConfigChange 
}: ConnectionPanelProps) {
  const { history, addConnection, deleteConnection, clearHistory } = useConnectionHistory()
  
  const [url, setUrl] = useState(config.url || 'wss://echo.websocket.org')
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [autoReconnect, setAutoReconnect] = useState(config.autoReconnect)
  const [reconnectInterval, setReconnectInterval] = useState(config.reconnectInterval / 1000)

  const handleConnect = () => {
    if (!url.trim()) return
    addConnection(url, autoReconnect)
    onConnect(url, { 
      autoReconnect, 
      reconnectInterval: reconnectInterval * 1000 
    })
  }

  const handleQuickConnect = (connectUrl: string) => {
    setUrl(connectUrl)
    addConnection(connectUrl, autoReconnect)
    onConnect(connectUrl, { 
      autoReconnect, 
      reconnectInterval: reconnectInterval * 1000 
    })
    setShowHistory(false)
  }

  const isConnected = status === 'connected'
  const isConnecting = status === 'connecting'

  return (
    <div className="glass-card p-6 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest flex items-center gap-2">
          {isConnected ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-zinc-400" />}
          Target Endpoint
        </label>
        
        <div className="flex items-center gap-2">
          {/* History dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 px-2 py-1 text-zinc-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all text-[10px] font-mono"
            >
              <History className="w-3 h-3" />
              History
              {history.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-zinc-200 rounded-full text-[9px]">{history.length}</span>
              )}
            </button>
            
            {showHistory && (
              <div className="absolute top-full right-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 max-h-64 overflow-auto">
                {history.length === 0 ? (
                  <div className="p-4 text-center text-zinc-400 text-xs">No connection history</div>
                ) : (
                  <>
                    <div className="px-3 py-2 border-b border-zinc-100 flex items-center justify-between">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Recent Connections</span>
                      <button
                        onClick={clearHistory}
                        className="text-[9px] text-red-500 hover:text-red-600"
                      >
                        Clear All
                      </button>
                    </div>
                    {history.map(h => (
                      <div key={h.id} className="flex items-center hover:bg-cyan-50 transition-colors group">
                        <button
                          onClick={() => handleQuickConnect(h.url)}
                          disabled={isConnected || isConnecting}
                          className="flex-1 px-3 py-2 text-left disabled:opacity-50"
                        >
                          <div className="text-[11px] font-mono text-zinc-700 truncate">{h.name || h.url}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] text-zinc-400 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {new Date(h.lastConnectedAt).toLocaleDateString()}
                            </span>
                            <span className="text-[9px] text-zinc-400">×{h.connectCount}</span>
                            {h.autoReconnect && (
                              <span className="text-[9px] text-cyan-500">
                                <RefreshCw className="w-2.5 h-2.5" />
                              </span>
                            )}
                          </div>
                        </button>
                        <button
                          onClick={() => deleteConnection(h.id)}
                          className="p-2 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-1.5 rounded-lg transition-all ${
              showSettings ? 'bg-cyan-100 text-cyan-600' : 'text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* URL Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !isConnected && handleConnect()}
          placeholder="wss://your-websocket-server.com"
          className="flex-grow bg-white border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 shadow-sm transition-all font-mono text-sm"
          disabled={isConnected || isConnecting}
        />
        
        {!isConnected && !isConnecting ? (
          <button
            onClick={handleConnect}
            disabled={!url.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-3 rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all active:scale-95 flex items-center gap-2 font-bold shadow-lg shadow-cyan-500/30 disabled:opacity-50"
          >
            <Play className="w-4 h-4 fill-current" />
            Connect
          </button>
        ) : (
          <button
            onClick={onDisconnect}
            className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all active:scale-95 flex items-center gap-2 font-bold shadow-lg shadow-red-200"
          >
            <Square className="w-4 h-4 fill-current" />
            {isConnecting ? 'Cancel' : 'Disconnect'}
          </button>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => {
                  setAutoReconnect(e.target.checked)
                  onConfigChange({ autoReconnect: e.target.checked })
                }}
                className="w-4 h-4 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-xs text-zinc-600">Auto Reconnect</span>
            </label>
            
            {autoReconnect && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Interval:</span>
                <input
                  type="number"
                  value={reconnectInterval}
                  onChange={(e) => {
                    const val = Math.max(1, parseInt(e.target.value) || 3)
                    setReconnectInterval(val)
                    onConfigChange({ reconnectInterval: val * 1000 })
                  }}
                  className="w-16 px-2 py-1 text-xs font-mono bg-white border border-zinc-200 rounded focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  min={1}
                  max={60}
                />
                <span className="text-xs text-zinc-500">sec</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sample URLs */}
      <div className="mt-4 flex items-center gap-3 overflow-x-auto pb-1">
        <span className="text-[10px] text-zinc-400 whitespace-nowrap">Samples:</span>
        {SAMPLE_URLS.map(s => (
          <button
            key={s.url}
            onClick={() => setUrl(s.url)}
            disabled={isConnected || isConnecting}
            className="text-[10px] bg-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-600 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {s.name}
          </button>
        ))}
      </div>
    </div>
  )
}
