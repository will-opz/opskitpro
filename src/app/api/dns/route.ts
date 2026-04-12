import { NextRequest, NextResponse } from 'next/server'

// export const runtime = 'edge' // Removed to avoid 500 errors on Node.js runtime
export const dynamic = 'force-dynamic'

// DNS Record Types
type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA' | 'PTR' | 'SRV' | 'CAA'

// DNS Providers
const DNS_PROVIDERS = {
  google: {
    name: 'Google',
    url: 'https://dns.google/resolve'
  },
  cloudflare: {
    name: 'Cloudflare',
    url: 'https://cloudflare-dns.com/dns-query'
  },
  quad9: {
    name: 'Quad9',
    url: 'https://dns.quad9.net:5053/dns-query'
  }
}

interface DnsAnswer {
  name: string
  type: number
  TTL: number
  data: string
}

interface DnsResponse {
  Status: number
  TC: boolean
  RD: boolean
  RA: boolean
  AD: boolean
  CD: boolean
  Question: Array<{
    name: string
    type: number
  }>
  Answer?: DnsAnswer[]
  Authority?: DnsAnswer[]
  Comment?: string
}

// Type number to name mapping
const TYPE_MAP: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  257: 'CAA'
}

// Status codes
const STATUS_CODES: Record<number, string> = {
  0: 'NOERROR',
  1: 'FORMERR',
  2: 'SERVFAIL',
  3: 'NXDOMAIN',
  4: 'NOTIMP',
  5: 'REFUSED'
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  const type = (searchParams.get('type') || 'A').toUpperCase() as DnsRecordType
  const provider = searchParams.get('provider') || 'cloudflare'

  if (!domain) {
    return NextResponse.json(
      { error: 'Domain parameter is required' },
      { status: 400 }
    )
  }

  // Validate domain format
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
  if (!domainRegex.test(domain)) {
    return NextResponse.json(
      { error: 'Invalid domain format' },
      { status: 400 }
    )
  }

  const dnsProvider = DNS_PROVIDERS[provider as keyof typeof DNS_PROVIDERS] || DNS_PROVIDERS.cloudflare

  const startTime = Date.now()

  try {
    const url = new URL(dnsProvider.url)
    url.searchParams.set('name', domain)
    url.searchParams.set('type', type)

    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/dns-json'
      }
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`DNS server returned ${response.status}`)
    }

    const data: DnsResponse = await response.json()

    // Parse and format the response
    const result = {
      domain,
      type,
      provider: dnsProvider.name,
      status: STATUS_CODES[data.Status] || `UNKNOWN(${data.Status})`,
      statusCode: data.Status,
      responseTime,
      truncated: data.TC,
      recursionDesired: data.RD,
      recursionAvailable: data.RA,
      authenticData: data.AD,
      checkingDisabled: data.CD,
      question: data.Question?.map(q => ({
        name: q.name,
        type: TYPE_MAP[q.type] || q.type
      })),
      answers: data.Answer?.map(a => ({
        name: a.name,
        type: TYPE_MAP[a.type] || a.type,
        ttl: a.TTL,
        data: a.data,
        // Parse MX priority
        ...(a.type === 15 && {
          priority: parseInt(a.data.split(' ')[0]),
          exchange: a.data.split(' ').slice(1).join(' ')
        })
      })) || [],
      authority: data.Authority?.map(a => ({
        name: a.name,
        type: TYPE_MAP[a.type] || a.type,
        ttl: a.TTL,
        data: a.data
      })),
      comment: data.Comment,
      raw: data
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, max-age=60',
        'X-Response-Time': `${responseTime}ms`
      }
    })
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    
    return NextResponse.json(
      {
        error: error.message || 'DNS lookup failed',
        domain,
        type,
        provider: dnsProvider.name,
        responseTime
      },
      { status: 500 }
    )
  }
}

// Also support POST for batch queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { domain, types, provider = 'cloudflare' } = body

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      )
    }

    const recordTypes: DnsRecordType[] = types || ['A', 'AAAA', 'CNAME', 'MX', 'NS', 'TXT']
    const dnsProvider = DNS_PROVIDERS[provider as keyof typeof DNS_PROVIDERS] || DNS_PROVIDERS.cloudflare

    const startTime = Date.now()
    
    // Query all types in parallel
    const queries = recordTypes.map(async (type) => {
      const url = new URL(dnsProvider.url)
      url.searchParams.set('name', domain)
      url.searchParams.set('type', type)

      try {
        const response = await fetch(url.toString(), {
          headers: { 'Accept': 'application/dns-json' }
        })
        const data: DnsResponse = await response.json()
        
        return {
          type,
          status: STATUS_CODES[data.Status] || `UNKNOWN(${data.Status})`,
          answers: data.Answer?.map(a => ({
            name: a.name,
            type: TYPE_MAP[a.type] || a.type,
            ttl: a.TTL,
            data: a.data
          })) || []
        }
      } catch (e: any) {
        return {
          type,
          error: e.message,
          answers: []
        }
      }
    })

    const results = await Promise.all(queries)
    const responseTime = Date.now() - startTime

    return NextResponse.json({
      domain,
      provider: dnsProvider.name,
      responseTime,
      results
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Batch query failed' },
      { status: 500 }
    )
  }
}
