"use client"

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BrainCircuit, Search, Terminal, Loader2, SendHorizontal, AlertCircle } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function KbClient({ lang, dict }: { lang: 'en'|'zh', dict: any }) {
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    const userMessage: Message = { id: Date.now().toString(), role: 'user', content: query }
    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsLoading(true)

    const aiMessageId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, { id: aiMessageId, role: 'assistant', content: '' }])

    try {
      const response = await fetch('/api/kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage.content }),
      })

      if (!response.ok) {
        throw new Error('API Execution Failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done && reader) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring(6).trim()
              if (!dataStr || dataStr === '[DONE]') continue
              try {
                const data = JSON.parse(dataStr)
                if (data.event === 'message') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === aiMessageId ? { ...msg, content: msg.content + data.answer } : msg
                  ))
                }
              } catch(e) { /* ignore parse errors for partial chunks */ }
            }
          }
        }
      }
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMessageId ? { ...msg, content: `_ERR_ CONNECTION_LOST: Could not relay signal to Dify Node._` } : msg
      ))
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative w-full">
      {/* Header */}
      <header className="w-full max-w-4xl mx-auto px-6 py-8 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/${lang}`} className="text-zinc-500 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="font-mono text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span className="text-zinc-500">deops /</span> kb<span className="text-accent animate-pulse">_</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-800 text-xs font-mono text-zinc-400 shadow-md backdrop-blur-sm cursor-default">
          <BrainCircuit className="w-4 h-4 text-emerald-500" />
          {dict.kb.kb_active}
        </div>
      </header>

      {/* Main Dynamic Area */}
      <main className="flex-grow w-full max-w-4xl mx-auto px-6 z-10 flex flex-col mb-8 overflow-hidden">
        
        {messages.length === 0 ? (
          /* Empty State - Centered Search Layout */
          <div className="flex-grow flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 rounded-2xl bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <Terminal className="w-10 h-10 text-emerald-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight mb-4">
              {dict.kb.title_part1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500 font-mono italic">{dict.kb.title_part2}</span>
            </h1>
            <p className="text-zinc-400 max-w-lg leading-relaxed mb-12">
              {dict.kb.subtitle}
            </p>
          </div>
        ) : (
          /* Chat History Layout */
          <div className="flex-grow overflow-y-auto w-full pr-2 space-y-8 pb-4 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-md bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mr-4 mt-1">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                  </div>
                )}
                
                <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                  msg.role === 'user' 
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/50 rounded-tr-sm' 
                    : 'bg-zinc-900/60 text-zinc-300 border border-emerald-500/20 rounded-tl-sm glass-card'
                }`}>
                  {msg.content ? (
                    <div className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> {dict.kb.loading}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Form Floating at bottom */}
        <div className="w-full shrink-0 pt-4">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            <div className="relative glass-card rounded-2xl border border-zinc-700/80 bg-zinc-900/90 shadow-2xl p-2 flex items-end gap-2 focus-within:border-emerald-500/50 transition-colors">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={dict.kb.placeholder}
                className="w-full bg-transparent text-zinc-100 placeholder:text-zinc-600 outline-none resize-none font-sans text-base py-3 px-4 max-h-[200px] min-h-[56px]"
                rows={1}
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
                }}
              />
              <button 
                type="submit" 
                disabled={isLoading || !query.trim()}
                className="shrink-0 w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-400 transition-all cursor-pointer mb-1 mr-1"
                title={dict.kb.btn_search}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <SendHorizontal className="w-5 h-5" />}
              </button>
            </div>
            
            {!process.env.NEXT_PUBLIC_DIFY_API_URL && (
              <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
                <AlertCircle className="w-3 h-3 text-amber-500" />
                 Local Dify Tunnel disconnected. Awaiting .env credentials.
              </div>
            )}
          </form>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
          border-radius: 20px;
        }
      `}</style>
    </div>
  )
}
