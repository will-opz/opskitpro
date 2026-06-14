import { useState, useCallback, useEffect, useRef } from 'react'

export interface JqResult {
  output: string
  error: string | null
  duration: number
  matchCount: number
}

export function useJqQuery() {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const jqRef = useRef<any>(null)

  // Load jq-web dynamically (it's a large WASM module, client-side only)
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return
    
    const loadJq = async () => {
      try {
        // Use dynamic import with webpackIgnore to avoid SSR bundling
        const jqModule = await (Function('return import("jq-web")')() as Promise<any>)
        jqRef.current = jqModule.default || jqModule
        setIsReady(true)
      } catch (err) {
        console.error('Failed to load jq-web:', err)
        // Fallback: try loading from CDN
        try {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/jq-web@0.5.1/jq.min.js'
          script.onload = () => {
            jqRef.current = (window as any).jq
            setIsReady(true)
          }
          document.head.appendChild(script)
        } catch (cdnErr) {
          console.error('CDN fallback also failed:', cdnErr)
        }
      }
    }
    loadJq()
  }, [])

  const runQuery = useCallback(async (json: string, filter: string): Promise<JqResult> => {
    if (!isReady || !jqRef.current) {
      return { output: '', error: 'JQ engine not ready', duration: 0, matchCount: 0 }
    }

    if (!json.trim()) {
      return { output: '', error: null, duration: 0, matchCount: 0 }
    }

    if (!filter.trim()) {
      return { output: json, error: null, duration: 0, matchCount: 0 }
    }

    setIsLoading(true)
    const start = performance.now()

    try {
      const parsed = JSON.parse(json)
      const result = await jqRef.current.json(parsed, filter)
      const duration = performance.now() - start

      // Format output
      let output: string
      let matchCount = 0

      if (Array.isArray(result)) {
        output = JSON.stringify(result, null, 2)
        matchCount = result.length
      } else if (result === null || result === undefined) {
        output = 'null'
        matchCount = 0
      } else {
        output = JSON.stringify(result, null, 2)
        matchCount = 1
      }

      setIsLoading(false)
      return { output, error: null, duration, matchCount }
    } catch (err: any) {
      setIsLoading(false)
      const duration = performance.now() - start
      return { 
        output: '', 
        error: err.message || 'JQ query failed', 
        duration, 
        matchCount: 0 
      }
    }
  }, [isReady])

  return { runQuery, isLoading, isReady }
}

// Common JQ snippets for quick access
export const JQ_SNIPPETS = [
  { label: 'Keys', filter: 'keys', desc: 'Get all keys' },
  { label: 'Length', filter: 'length', desc: 'Array/object length' },
  { label: 'First', filter: 'first', desc: 'First element' },
  { label: 'Last', filter: 'last', desc: 'Last element' },
  { label: 'Flatten', filter: 'flatten', desc: 'Flatten nested arrays' },
  { label: 'Unique', filter: 'unique', desc: 'Remove duplicates' },
  { label: 'Sort', filter: 'sort', desc: 'Sort array' },
  { label: 'Reverse', filter: 'reverse', desc: 'Reverse array' },
  { label: 'Map names', filter: '.[].name', desc: 'Extract name field' },
  { label: 'Select', filter: '.[] | select(.status == "active")', desc: 'Filter by condition' },
  { label: 'Group by', filter: 'group_by(.type)', desc: 'Group array elements' },
  { label: 'Count', filter: '[.[] | .type] | group_by(.) | map({key: .[0], count: length})', desc: 'Count by field' },
]
