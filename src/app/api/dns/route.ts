// No Next.js imports at all
// export const runtime = 'edge'

// DNS Record Types
type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'NS' | 'TXT' | 'SOA' | 'PTR' | 'SRV' | 'CAA'

const DNS_PROVIDERS = {
  google: { name: 'Google', url: 'https://dns.google/resolve' },
  cloudflare: { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query' }
}

const TYPE_MAP: Record<number, string> = { 1: 'A', 2: 'NS', 5: 'CNAME', 6: 'SOA', 12: 'PTR', 15: 'MX', 16: 'TXT', 28: 'AAAA', 33: 'SRV', 257: 'CAA' }
const STATUS_CODES: Record<number, string> = { 0: 'NOERROR', 1: 'FORMERR', 2: 'SERVFAIL', 3: 'NXDOMAIN', 4: 'NOTIMP', 5: 'REFUSED' }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = searchParams.get('domain')
  const type = (searchParams.get('type') || 'A').toUpperCase() as DnsRecordType
  
  if (!domain) return new Response(JSON.stringify({ error: 'Missing domain' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

  const dnsProvider = DNS_PROVIDERS.cloudflare
  const startTime = Date.now()

  try {
    const url = new URL(dnsProvider.url)
    url.searchParams.set('name', domain)
    url.searchParams.set('type', type)

    const response = await fetch(url.toString(), { headers: { 'Accept': 'application/dns-json' } })
    const responseTime = Date.now() - startTime
    const data: any = await response.json()

    const result = {
      domain,
      type,
      provider: dnsProvider.name,
      status: STATUS_CODES[data.Status] || `UNKNOWN(${data.Status})`,
      responseTime,
      answers: data.Answer || []
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'X-Response-Time': `${responseTime}ms` }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
