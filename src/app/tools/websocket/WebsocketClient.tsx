'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Terminal, 
  Trash2, 
  Play, 
  Square, 
  Send, 
  Wifi, 
  WifiOff, 
  Activity,
  History,
  Copy,
  Check,
  Zap,
  Cpu
} from 'lucide-react'
import { useParams } from 'next/navigation'

interface LogEntry {
  type: 'info' | 'error' | 'sent' | 'received';
  message: string;
  time: string;
  id: string;
}

export default function WebsocketClient() {
  const params = useParams()
  const lang = (params.lang as 'en' | 'zh') || 'en'
  
  const [url, setUrl] = useState('wss://echo.websocket.org')
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [inputMessage, setInputMessage] = useState('{"type": "ping", "timestamp": ' + Date.now() + '}')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [copied, setCopied] = useState(false)
  const [messageCopied, setMessageCopied] = useState<string | null>(null)

  const socketRef = useRef<WebSocket | null>(null)
  const logsEndRef = useRef<HTMLDivElement>(null)

  // Dictionary injection
  const dict = {
    zh: {
      title: "WebSocket 实时调试器",
      subtitle: "Full-Duplex 协议探测与流数据监控",
      back: "返回",
      placeholder: "输入 WebSocket 地址 (ws:// 或 wss://)",
      connect: "连接节点",
      disconnect: "断开连接",
      send: "发送载荷",
      send_placeholder: "在此输入消息载荷...",
      status: "状态",
      connected: "已就绪",
      disconnected: "未连接",
      connecting: "握手中...",
      error: "异常",
      logs: "通讯流量监测 (Live Logs)",
      clear: "清除",
      no_logs: "暂无数据流数据",
      sample: "示例地址",
      type: "流向",
      message: "数据内容",
      time: "时间",
      copied: "已复制",
      sent: "发出",
      received: "接收",
      info: "系统",
      error_type: "错误"
    },
    en: {
      title: "WebSocket Protocol Tester",
      subtitle: "Full-Duplex stream debugger & traffic monitor",
      back: "Back",
      placeholder: "Enter WebSocket URL (ws:// or wss://)",
      connect: "Connect",
      disconnect: "Disconnect",
      send: "Send Payload",
      send_placeholder: "Type message to send...",
      status: "State",
      connected: "Operational",
      disconnected: "Idle",
      connecting: "Handshaking...",
      error: "Fault",
      logs: "Traffic Monitor (Live Logs)",
      clear: "Clear",
      no_logs: "No data streams detected",
      sample: "Sample",
      type: "Direction",
      message: "Payload",
      time: "Time",
      copied: "Copied",
      sent: "SENT",
      received: "RECV",
      info: "SYS",
      error_type: "ERR"
    }
  }[lang]

  const scrollToBottom = useCallback(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [logs, scrollToBottom])

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [...prev, {
      type,
      message,
      time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      id: Math.random().toString(36).substr(2, 9)
    }].slice(-100)) // Keep last 100 logs
  }

  const connect = () => {
    if (!url) return
    
    try {
      setStatus('connecting')
      addLog('info', `Initiating connection to ${url}...`)
      
      const ws = new WebSocket(url)
      socketRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        addLog('info', `Connection established successfully.`)
      }

      ws.onmessage = (event) => {
        addLog('received', event.data.toString())
      }

      ws.onclose = (event) => {
        setStatus('disconnected')
        addLog('info', `Connection closed. Code: ${event.code}${event.reason ? ` (${event.reason})` : ''}`)
        socketRef.current = null
      }

      ws.onerror = (error) => {
        setStatus('error')
        addLog('error', `WebSocket Error detected. Terminal reset required.`)
      }
    } catch (e: any) {
      setStatus('error')
      addLog('error', `Failed to initialize WebSocket: ${e.message}`)
    }
  }

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close()
    }
  }

  const sendMessage = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(inputMessage)
      addLog('sent', inputMessage)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  const copyMessage = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setMessageCopied(id)
    setTimeout(() => setMessageCopied(null), 2000)
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-zinc-700 font-sans selection:bg-accent selection:text-zinc-900 pb-24 relative overflow-hidden">
      {/* Background Grid Layer */}
      <div className="absolute inset-0 bg-grid-zinc-900/[0.05] pointer-events-none"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <main className="w-full max-w-6xl mx-auto px-6 mt-12 z-20 relative font-mono">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-8 text-[11px] font-mono uppercase tracking-widest text-zinc-500">
          <Link href={`/`} className="hover:text-cyan-600 transition-colors">HOME</Link>
          <span className="text-zinc-300">/</span>
          <Link href={`/services`} className="hover:text-cyan-600 transition-colors">MATRIX</Link>
          <span className="text-zinc-300">/</span>
          <span className="text-zinc-900 border-b border-cyan-500/30 font-bold uppercase">WS-PROBE</span>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800 group transition-all">
              <Zap className="w-7 h-7 text-cyan-500 group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3 italic">
                {dict.title}
              </h1>
              <p className="text-zinc-500 font-mono text-[10px] sm:text-xs uppercase tracking-[0.2em] mt-1">{dict.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all ${
               status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
               status === 'connecting' ? 'bg-orange-500/10 border-orange-500/20 text-orange-600 animate-pulse' :
               status === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-600' :
               'bg-zinc-100 border-zinc-200 text-zinc-500'
             }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                  status === 'connecting' ? 'bg-orange-500' :
                  status === 'error' ? 'bg-red-500' :
                  'bg-zinc-400'
                }`}></div>
                {dict[status as keyof typeof dict]}
             </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* URL Input */}
          <div className="lg:col-span-8 glass-card p-6 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl">
             <label className="text-[10px] uppercase font-bold text-zinc-500 mb-2 block tracking-widest">Target Endpoint (WSS/WS)</label>
             <div className="flex gap-3">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder={dict.placeholder}
                  className="flex-grow bg-white border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500/50 shadow-sm transition-all"
                  disabled={status === 'connected' || status === 'connecting'}
                />
                {status === 'disconnected' || status === 'error' ? (
                  <button 
                    onClick={connect}
                    className="bg-zinc-900 text-white px-6 py-3 rounded-xl hover:bg-zinc-800 transition-all active:scale-95 flex items-center gap-2 font-bold shadow-lg shadow-zinc-200"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    {dict.connect}
                  </button>
                ) : (
                  <button 
                    onClick={disconnect}
                    className="bg-red-500 text-white px-6 py-3 rounded-xl hover:bg-red-600 transition-all active:scale-95 flex items-center gap-2 font-bold shadow-lg shadow-red-200"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    {status === 'connecting' ? 'CANCEL' : dict.disconnect}
                  </button>
                )}
             </div>
             <div className="mt-4 flex items-center gap-4 overflow-x-auto pb-2">
                <span className="text-[10px] text-zinc-400 whitespace-nowrap">{dict.sample}:</span>
                {['wss://echo.websocket.org', 'wss://ws.postman-echo.com/raw'].map(s => (
                  <button 
                    key={s} 
                    onClick={() => setUrl(s)}
                    className="text-[10px] bg-zinc-100 hover:bg-cyan-500/10 hover:text-cyan-600 px-2 py-1 rounded transition-colors whitespace-nowrap"
                  >
                    {s}
                  </button>
                ))}
             </div>
          </div>

          {/* Stats */}
          <div className="lg:col-span-4 glass-card p-6 rounded-2xl border border-black/5 bg-zinc-900 text-white relative overflow-hidden">
             <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between opacity-50">
                  <span className="text-[10px] uppercase tracking-tighter">System Engine</span>
                   <Cpu className="w-4 h-4" />
                </div>
                <div>
                   <div className="text-2xl font-black mb-1 italic text-cyan-400">V8_PROBE_X</div>
                   <div className="text-[9px] uppercase tracking-[0.3em] font-light">Latency: {status === 'connected' ? '<1ms (Edge)' : 'N/A'}</div>
                </div>
             </div>
             <Activity className="absolute bottom-0 right-0 w-32 h-32 text-cyan-500/10 -mb-8 -mr-8" />
          </div>
        </div>

        {/* Messaging Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Send Area */}
          <div className="lg:col-span-12 glass-card p-6 rounded-2xl border border-black/5 bg-white/50 backdrop-blur-xl">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 bg-cyan-500/10 flex items-center justify-center rounded-lg">
                      <Send className="w-4 h-4 text-cyan-600" />
                   </div>
                   <h3 className="text-xs font-bold uppercase tracking-widest">{dict.send}</h3>
                </div>
                <div className="flex gap-2">
                   {['{"ping": true}', '{"type": "message", "content": "Hello World"}'].map((s, i) => (
                     <button key={i} onClick={() => setInputMessage(s)} className="text-[10px] text-zinc-500 hover:text-cyan-600 border border-zinc-200 px-2 py-0.5 rounded">
                        Msg {i+1}
                     </button>
                   ))}
                </div>
             </div>
             <div className="relative">
                <textarea 
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder={dict.send_placeholder}
                  rows={4}
                  className="w-full bg-white border border-zinc-200 p-4 rounded-xl focus:outline-none focus:border-cyan-500/50 shadow-inner font-mono text-sm leading-relaxed"
                />
                <button 
                  onClick={sendMessage}
                  disabled={status !== 'connected'}
                  className="absolute bottom-4 right-4 bg-cyan-600 text-white pl-4 pr-6 py-2 rounded-lg hover:bg-cyan-700 transition-all active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-2 font-bold shadow-lg shadow-cyan-200"
                >
                  <Send className="w-4 h-4" />
                  {dict.send}
                </button>
             </div>
          </div>

          {/* Logs Area */}
          <div className="lg:col-span-12 glass-card rounded-2xl border border-black/5 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
             {/* Log Header */}
             <div className="bg-zinc-900 p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest">{dict.logs}</h3>
                   <span className="text-[10px] text-zinc-500 font-normal">{logs.length} Packets Recorded</span>
                </div>
                <button onClick={clearLogs} className="text-zinc-500 hover:text-white transition-colors">
                   <Trash2 className="w-4 h-4" />
                </button>
             </div>

             {/* Log List */}
             <div className="flex-grow overflow-y-auto p-4 space-y-2 font-mono scrollbar-thin scrollbar-thumb-zinc-800">
                {logs.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-4 py-20">
                      <History className="w-12 h-12 opacity-10" />
                      <p className="text-[10px] uppercase tracking-[0.3em] font-light">{dict.no_logs}</p>
                   </div>
                )}
                {logs.map((log) => (
                   <div key={log.id} className="group border-b border-white/[0.03] pb-2 last:border-0 hover:bg-white/[0.02] transition-colors rounded px-2 -mx-2 flex gap-4">
                      <div className="text-[10px] text-zinc-600 mt-1 whitespace-nowrap">{log.time}</div>
                      <div className="flex-grow">
                         <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded leading-none ${
                               log.type === 'info' ? 'bg-blue-500/20 text-blue-400' :
                               log.type === 'error' ? 'bg-red-500/20 text-red-400' :
                               log.type === 'sent' ? 'bg-cyan-500/20 text-cyan-400' :
                               'bg-emerald-500/20 text-emerald-400'
                            }`}>
                               {log.type === 'info' ? dict.info : log.type === 'error' ? dict.error_type : log.type === 'sent' ? dict.sent : dict.received}
                            </span>
                            <button 
                              onClick={() => copyMessage(log.message, log.id)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-white"
                            >
                               {messageCopied === log.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                         </div>
                         <div className={`text-xs break-all whitespace-pre-wrap leading-relaxed ${
                            log.type === 'error' ? 'text-red-400/80 italic' : 
                            log.type === 'info' ? 'text-zinc-500/80 font-light' : 
                            'text-zinc-300'
                         }`}>
                            {log.message}
                         </div>
                      </div>
                   </div>
                ))}
                <div ref={logsEndRef} />
             </div>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
    </div>
  )
}
