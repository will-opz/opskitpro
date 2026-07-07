import { describe, expect, it } from 'vitest'
import { createSafeDiagnosticResult } from '../_hooks/helpers'
import { buildWebsiteCheckMarkdown, buildWebsiteCheckReport, WEBSITE_CHECK_REPORT_FORMAT_VERSION } from './report'

const healthyResult = () => createSafeDiagnosticResult({
  domain: 'opskitpro.com',
  dns: {
    success: true,
    resolved_ip: '104.21.1.1',
    latency: '22ms',
    all_ips: ['104.21.1.1'],
    records: {
      A: ['104.21.1.1'],
      AAAA: [],
    },
  },
  http: {
    success: true,
    status_code: 200,
    latency: '180ms',
    is_https: true,
    final_url: 'https://opskitpro.com/tools/website-check',
  },
  ssl: {
    valid: true,
    issuer: 'Google Trust Services',
    expiry: '2099-01-01T00:00:00.000Z',
    grade: 'A',
    factors: ['HSTS_ENABLED'],
  },
  securityHeaders: {
    score: 100,
    grade: 'A',
    passed: 4,
    total: 4,
    checks: [
      { key: 'strict-transport-security', label: 'HSTS', present: true },
      { key: 'content-security-policy', label: 'Content-Security-Policy', present: true },
    ],
  },
  cdn: {
    is_provider: true,
    provider: 'Cloudflare',
    server: 'cloudflare',
  },
  meta: {
    checkedAt: '2026-07-07T00:00:00.000Z',
    edgeColo: 'NRT',
  },
}, 'opskitpro.com')

describe('website check report builder', () => {
  it('builds a stable healthy report object', () => {
    const report = buildWebsiteCheckReport(healthyResult(), {
      generatedAt: '2026-07-07T00:00:00.000Z',
    })

    expect(report.formatVersion).toBe(WEBSITE_CHECK_REPORT_FORMAT_VERSION)
    expect(report.status).toBe('healthy')
    expect(report.score).toBe(100)
    expect(report.findings.every((finding) => finding.severity !== 'critical')).toBe(true)
    expect(report.findings.find((finding) => finding.key === 'dns')?.recommendedFix).toContain('Continue normal monitoring')
  })

  it('prioritizes HTTP reachability failures with actionable repair fields', () => {
    const result = createSafeDiagnosticResult({
      ...healthyResult(),
      http: {
        success: false,
        status_code: 522,
        latency: '5000ms',
        cf_ray: 'abc-NRT',
        page_title: 'Error 522',
      },
      cdn: {
        is_provider: true,
        provider: 'Cloudflare',
        server: 'cloudflare',
      },
    }, 'down.example.com')

    const report = buildWebsiteCheckReport(result)
    const httpFinding = report.findings.find((finding) => finding.key === 'http')

    expect(report.status).toBe('critical')
    expect(report.suspectedCause).toContain('Cloudflare 522')
    expect(httpFinding?.severity).toBe('critical')
    expect(httpFinding?.evidence.join(' ')).toContain('Cloudflare 522')
    expect(httpFinding?.recommendedFix).toContain('origin')
    expect(httpFinding?.verificationSteps.length).toBeGreaterThan(1)
  })

  it('reports missing security headers as warnings without overclaiming availability impact', () => {
    const result = createSafeDiagnosticResult({
      ...healthyResult(),
      securityHeaders: {
        score: 60,
        grade: 'C',
        passed: 1,
        total: 3,
        checks: [
          { key: 'strict-transport-security', label: 'HSTS', present: true },
          { key: 'content-security-policy', label: 'Content-Security-Policy', present: false },
          { key: 'x-frame-options', label: 'X-Frame-Options', present: false },
        ],
      },
    }, 'headers.example.com')

    const report = buildWebsiteCheckReport(result)
    const headersFinding = report.findings.find((finding) => finding.key === 'headers')

    expect(report.status).toBe('degraded')
    expect(headersFinding?.severity).toBe('warning')
    expect(headersFinding?.likelyCause).toContain('response policy')
    expect(headersFinding?.summary).toContain('Content-Security-Policy')
  })

  it('renders markdown with report summary and prioritized findings', () => {
    const result = healthyResult()
    const report = buildWebsiteCheckReport(result, {
      generatedAt: '2026-07-07T00:00:00.000Z',
    })
    const markdown = buildWebsiteCheckMarkdown(report, result)

    expect(markdown).toContain(`Report format: ${WEBSITE_CHECK_REPORT_FORMAT_VERSION}`)
    expect(markdown).toContain('## Executive Summary')
    expect(markdown).toContain('## Prioritized Findings')
    expect(markdown).toContain('Recommended fix')
  })
})
