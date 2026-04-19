export type DnsRecordType =
  | 'A'
  | 'AAAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'TXT'
  | 'SOA'
  | 'PTR'
  | 'SRV'
  | 'CAA'

export type DnsProvider = 'cloudflare' | 'google' | 'aliyun' | 'quad9'

export interface DnsAnswer {
  name: string
  type: string | number
  ttl: number
  data: string
  priority?: number
  exchange?: string
}

export interface DnsLookupResponse {
  domain: string
  type: DnsRecordType
  provider: string
  status: string
  statusCode: number
  responseTime: number
  truncated: boolean
  recursionDesired: boolean
  recursionAvailable: boolean
  authenticData: boolean
  checkingDisabled: boolean
  question?: Array<{
    name: string
    type: string | number
  }>
  answers: DnsAnswer[]
  authority?: DnsAnswer[]
  comment?: string
  raw: unknown
  error?: string
}

export interface DnsBatchResultItem {
  type: DnsRecordType
  status?: string
  answers: DnsAnswer[]
  error?: string
}

export interface DnsBatchResponse {
  domain: string
  provider: string
  responseTime: number
  results: DnsBatchResultItem[]
}

export interface DiagnosticHealthResponse {
  status: 'ready'
  service: 'diagnostic'
  timestamp: string
}

export interface DiagnosticDnsResolverResult {
  resolver: string
  data: unknown
}

export interface DiagnosticDnsSummary {
  resolved_ip: string
  latency: string
  success: boolean
  resolvers?: DiagnosticDnsResolverResult[]
}

export interface DiagnosticHttpSummary {
  success: boolean
  status_code: number
  latency: string
}

export interface DiagnosticSslSummary {
  valid: boolean
  issuer: string
  expiry: string
}

export interface DiagnosticCdnSummary {
  is_provider: boolean
  provider: string
  server: string
}

export interface DiagnosticGeoSummary {
  country: string
  isp: string
  city: string
  asn: string | number
}

export interface DiagnosticWhoisSummary {
  registered: string
  registrar: string
  status: string
  success: boolean
  expires: string
  error?: string
  nameservers?: string[]
}

export interface DiagnosticSuccessResponse {
  domain: string
  status: 'success'
  isActuallyIp: boolean
  isPrivate: boolean
  dns: DiagnosticDnsSummary
  http: DiagnosticHttpSummary
  ssl: DiagnosticSslSummary
  cdn: DiagnosticCdnSummary
  geo: DiagnosticGeoSummary
  whois: DiagnosticWhoisSummary
}

export interface DiagnosticPartialErrorResponse {
  domain: string
  status: 'partial_error'
  isActuallyIp: boolean
  isPrivate: boolean
  error: string
  dns: DiagnosticDnsSummary
}

export interface DiagnosticErrorResponse {
  status: 'error'
  message: string
}

export interface DiagnosticPostSuccessResponse {
  success: true
  data: {
    target: string
    status: 'online'
    timestamp: string
  }
}

export interface DiagnosticPostErrorResponse {
  error: string
}

export type DiagnosticResponse =
  | DiagnosticHealthResponse
  | DiagnosticSuccessResponse
  | DiagnosticPartialErrorResponse
  | DiagnosticErrorResponse

export type DiagnosticPostResponse =
  | DiagnosticPostSuccessResponse
  | DiagnosticPostErrorResponse

export type IpLookupSource =
  | 'cloudflare-context'
  | 'external-lookup'
  | 'local-fallback'
  | 'cloudflare-edge-default'

export interface IpLookupResponse {
  ip: string
  country: string
  country_name: string
  country_code: string
  region: string
  city: string
  latitude: string
  longitude: string
  lat: string | number
  lon: string | number
  org: string
  isp: string
  asn: string | number
  timezone: string
  network_type: string
  proxy: boolean
  provider: string
  _source: IpLookupSource
}
