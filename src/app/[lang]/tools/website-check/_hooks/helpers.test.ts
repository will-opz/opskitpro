import { describe, expect, it } from 'vitest'
import { calculateScore, createSafeDiagnosticResult, isBlockedHttpStatus } from './helpers'

describe('website check helpers', () => {
  it('treats blocked visitor IP probes as degraded instead of fully failed', () => {
    const result = createSafeDiagnosticResult({
      domain: '2404:7a80:8120:1400:68fd:29b8:2abb:5bc1',
      isVisitor: true,
      isActuallyIp: true,
      dns: {
        resolved_ip: '2404:7a80:8120:1400:68fd:29b8:2abb:5bc1',
        latency: '0ms',
        success: true,
      },
      http: {
        success: false,
        status_code: 403,
        latency: '561ms',
      },
      ssl: {
        valid: false,
        grade: 'F',
      },
      securityHeaders: {
        score: 0,
        grade: 'F',
      },
      cdn: {
        is_provider: false,
        provider: 'Unknown',
      },
    }, '')

    expect(isBlockedHttpStatus(result.http.status_code)).toBe(true)
    expect(calculateScore(result)).toBe(75)
  })
})
