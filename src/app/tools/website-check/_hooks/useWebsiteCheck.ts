import { useState, useCallback, useRef, useEffect } from 'react'
import { normalizeTargetInput, createSafeDiagnosticResult } from './helpers'
import { useDiagnosticHistory } from './useDiagnosticHistory'

export function useWebsiteCheck() {
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [localResolvers, setLocalResolvers] = useState<Record<string, any>>({})
  
  const { upsertHistory } = useDiagnosticHistory()
  const domainRef = useRef(domain)

  useEffect(() => {
    domainRef.current = domain
  }, [domain])

  const runDiagnostic = useCallback(async (target?: string, skipCache: boolean = false) => {
    const d = normalizeTargetInput(target !== undefined ? target : domainRef.current)
    
    setLoading(true)
    setError(null)
    setCurrentStep(1)
    setLocalResolvers({})
    
    const expectedStepCount = 3

    const dnsResolvers = [
      { id: 'system', name: 'SYSTEM DNS', url: d ? `https://${d}/favicon.ico` : 'https://google.com/favicon.ico', type: 'native' },
      { id: 'google', name: 'GOOGLE (LOCAL)', url: `https://dns.google/resolve?name=${d || 'google.com'}&type=A`, type: 'doh' },
      { id: 'cf', name: 'CLOUDFLARE (LOCAL)', url: `https://cloudflare-dns.com/dns-query?name=${d || 'google.com'}&type=A`, type: 'doh' },
      { id: 'ali', name: 'ALIDNS (LOCAL)', url: `https://dns.alidns.com/resolve?name=${d || 'google.com'}&type=A`, type: 'doh' }
    ]

    dnsResolvers.forEach(async (r) => {
      const start = Date.now()
      try {
        if (r.type === 'native') {
           const controller = new AbortController()
           const tid = setTimeout(() => controller.abort(), 3000)
           try {
             await fetch(r.url, { mode: 'no-cors', signal: controller.signal })
             setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip: 'Native_OK', latency: `${Date.now() - start}ms`, status: 'OK' }}))
           } catch {
             setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip: 'No_Link', latency: '---', status: 'FAILED' }}))
           } finally { clearTimeout(tid) }
           return
        }

        const res = await fetch(r.url, { 
          headers: { 'accept': 'application/dns-json' }, 
          signal: AbortSignal.timeout(5000) 
        })
        const data = await res.json()
        const ip = data.Answer?.find((a: any) => a.type === 1)?.data || data.answer?.find((a: any) => a.type === 1)?.data || null
        setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip, latency: `${Date.now() - start}ms`, status: ip ? 'OK' : 'EMPTY' }}))
      } catch (e) {
        setLocalResolvers(prev => ({ ...prev, [r.id]: { ...r, ip: null, latency: 'ERR', status: 'FAILED' }}))
      }
    })

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < expectedStepCount ? prev + 1 : prev))
    }, 800)

    try {
      const res = await fetch(`/api/diagnostic?domain=${encodeURIComponent(d || '')}${skipCache ? '&_nocache=' + Date.now() : ''}`)
      const contentType = res.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        throw new Error(`Platform error (${res.status}): Received non-JSON response from server.`)
      }

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Diagnostic failed with status ${res.status}`)

      if (data?.status === 'partial_error') {
        const safeResult = createSafeDiagnosticResult(data, d, data.error)
        setError(data.error || 'Partial diagnostic failure')
        setResult(safeResult)
        if (safeResult.domain) {
          await upsertHistory(safeResult.domain, false).catch(() => null)
        }
        return
      }
      
      const safeResult = createSafeDiagnosticResult(data, d)
      setResult(safeResult)
      if (safeResult.domain) {
        await upsertHistory(safeResult.domain, false).catch(() => null)
      }
    } catch (err: any) {
      console.error('Forensics Engine Error:', err)
      setError(err.message || 'Unknown forensic engine failure')
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }, [upsertHistory])

  return {
    domain,
    setDomain,
    loading,
    currentStep,
    result,
    setResult,
    error,
    localResolvers,
    runDiagnostic
  }
}
