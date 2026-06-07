import { useState } from 'react'

export type AuditStatus = 'pass' | 'warning' | 'fail' | 'info'

export interface SecurityAuditResult {
  domain: string
  score: 'A' | 'B' | 'C' | 'F'
  spf: {
    status: AuditStatus
    records: string[]
    message: string
  }
  dmarc: {
    status: AuditStatus
    record: string | null
    message: string
    hasRua: boolean
    hasRuf: boolean
  }
  caa: {
    status: AuditStatus
    records: string[]
    message: string
  }
}

export function useSecurityAudit() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<SecurityAuditResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runAudit = async (domain: string) => {
    setLoading(true)
    setError(null)
    setResult(null)

    // normalize domain
    let cleanDomain = domain.trim().toLowerCase()
    cleanDomain = cleanDomain.replace(/^https?:\/\//, '').split('/')[0]

    try {
      // Run the 3 queries concurrently
      const fetchApi = async (url: string) => {
        const res = await fetch(url)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'DNS lookup failed')
        return data
      }

      const [spfRes, dmarcRes, caaRes] = await Promise.all([
        fetchApi(`/api/dns?domain=${encodeURIComponent(cleanDomain)}&type=TXT`),
        fetchApi(`/api/dns?domain=_dmarc.${encodeURIComponent(cleanDomain)}&type=TXT`),
        fetchApi(`/api/dns?domain=${encodeURIComponent(cleanDomain)}&type=CAA`)
      ])

      // 1. Parse SPF
      const txtAnswers = spfRes.answers || []
      const spfRecords = txtAnswers.map((a: any) => a.data).filter((txt: string) => txt.includes('v=spf1'))
      
      let spfStatus: AuditStatus = 'fail'
      let spfMessage = ''
      
      if (spfRecords.length === 0) {
        spfStatus = 'fail'
        spfMessage = 'No SPF record found.'
      } else if (spfRecords.length > 1) {
        spfStatus = 'fail'
        spfMessage = 'Multiple SPF records found. This will cause authentication to fail.'
      } else {
        const spf = spfRecords[0].toLowerCase()
        if (spf.includes('-all')) {
          spfStatus = 'pass'
          spfMessage = 'Strict SPF policy (-all) is configured.'
        } else if (spf.includes('~all')) {
          spfStatus = 'warning'
          spfMessage = 'Soft fail (~all) is configured. This is common but less strict than -all.'
        } else if (spf.includes('?all') || spf.includes('+all')) {
          spfStatus = 'fail'
          spfMessage = 'Weak SPF policy (?all or +all). This provides little to no protection against spoofing.'
        } else {
          spfStatus = 'warning'
          spfMessage = 'SPF record exists, but default policy (all) is unclear or missing.'
        }
      }

      // 2. Parse DMARC
      const dmarcAnswers = dmarcRes.answers || []
      const dmarcRecords = dmarcAnswers.map((a: any) => a.data).filter((txt: string) => txt.includes('v=DMARC1'))
      
      let dmarcStatus: AuditStatus = 'fail'
      let dmarcMessage = ''
      let hasRua = false
      let hasRuf = false
      let dmarcRecord = null

      if (dmarcRecords.length === 0) {
        dmarcStatus = 'fail'
        dmarcMessage = 'No DMARC record found on _dmarc subdomain.'
      } else {
        const dmarc = dmarcRecords[0] // take first
        dmarcRecord = dmarc
        const dmarcLower = dmarc.toLowerCase()
        
        hasRua = dmarcLower.includes('rua=')
        hasRuf = dmarcLower.includes('ruf=')

        if (dmarcLower.includes('p=reject')) {
          dmarcStatus = 'pass'
          dmarcMessage = 'Strict DMARC policy (p=reject) is active.'
        } else if (dmarcLower.includes('p=quarantine')) {
          dmarcStatus = 'warning' // marked as Acceptable / Warning in UI logic
          dmarcMessage = 'DMARC is set to quarantine. Suspicious emails may go to spam.'
        } else if (dmarcLower.includes('p=none')) {
          dmarcStatus = 'info'
          dmarcMessage = 'Monitoring mode (p=none) is active. Recommend reviewing RUA reports and upgrading to quarantine/reject.'
        } else {
          dmarcStatus = 'warning'
          dmarcMessage = 'DMARC record exists but policy (p=) is unclear.'
        }
        
        if (hasRua && dmarcStatus === 'info') {
          dmarcMessage += ' Good that RUA reporting is enabled.'
        }
      }

      // 3. Parse CAA
      const caaAnswers = caaRes.answers || []
      const caaRecords = caaAnswers.map((a: any) => a.data)
      let caaStatus: AuditStatus = 'info'
      let caaMessage = ''
      
      if (caaRecords.length === 0) {
        caaStatus = 'info' // user instructed: CAA missing is not critical
        caaMessage = 'No CAA records found. Any CA can issue certificates for this domain.'
      } else {
        caaStatus = 'pass'
        caaMessage = `CAA records are present. Issuance restricted to defined CAs.`
      }

      // Calculate Score
      let score: 'A' | 'B' | 'C' | 'F' = 'C'
      
      const fails = [spfStatus, dmarcStatus].filter(s => s === 'fail').length
      const passes = [spfStatus, dmarcStatus].filter(s => s === 'pass').length

      if (fails > 0) {
        score = 'F'
      } else if (passes === 2) {
        score = 'A'
      } else if (passes === 1) {
        score = 'B'
      } else {
        score = 'C'
      }



      setResult({
        domain: cleanDomain,
        score,
        spf: { status: spfStatus, records: spfRecords, message: spfMessage },
        dmarc: { status: dmarcStatus, record: dmarcRecord, message: dmarcMessage, hasRua, hasRuf },
        caa: { status: caaStatus, records: caaRecords, message: caaMessage }
      })
      
    } catch (err: any) {
      setError(err.message || 'Audit failed due to network error.')
    } finally {
      setLoading(false)
    }
  }

  return { loading, result, error, runAudit }
}
