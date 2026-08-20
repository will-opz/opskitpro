import { expect, test } from '@playwright/test'

function collectStructuredDataTypes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap(collectStructuredDataTypes)
  }

  if (!value || typeof value !== 'object') return []

  const record = value as Record<string, unknown>
  const currentType = record['@type']
  return [
    ...(typeof currentType === 'string' ? [currentType] : []),
    ...Object.values(record).flatMap(collectStructuredDataTypes),
  ]
}

test.describe('Diagnostics Hub Closed-Loop', () => {

  test('1. SEO / JSON-LD Tests - tools have correct schema', async ({ page }) => {
    const pagesToCheck = [
      '/tools/website-check',
      '/tools/dns-lookup',
      '/tools/cloudflare-trace'
    ]

    for (const url of pagesToCheck) {
      await page.goto(url)
      const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
      const types = jsonLd.flatMap((content) =>
        collectStructuredDataTypes(JSON.parse(content)),
      )
      expect(types).toEqual(
        expect.arrayContaining(['WebApplication', 'WebPage', 'BreadcrumbList']),
      )
      expect(types).not.toContain('FAQPage')
    }

    // Verify Error page specifically
    await page.goto('/errors/522')
    const errorJsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
    const errorTypes = errorJsonLd.flatMap((content) =>
      collectStructuredDataTypes(JSON.parse(content)),
    )
    expect(errorTypes).toEqual(
      expect.arrayContaining(['TechArticle', 'FAQPage', 'BreadcrumbList']),
    )
  })

  test('2. Internal Link Closed-Loop Tests - error page CTAs', async ({ page }) => {
    await page.goto('/errors/522')

    const diagnoseLink = page.getByRole('link', { name: /Diagnose Your Site|诊断你的站点|サイトを診断する/i })
    const traceLink = page.getByRole('link', { name: /Check Cloudflare Trace|追踪边缘连接|接続をトレース/i })

    await expect(diagnoseLink).toBeVisible()
    await expect(traceLink).toBeVisible()

    // Test transition to website-check
    await diagnoseLink.click()
    await expect(page).toHaveURL(/\/tools\/website-check/)
  })

  test('3. Diagnostic Banners render independently without short-circuiting', async ({ page }) => {
    await page.route('**/api/diagnostic**', async route => {
      await route.fulfill({
        json: {
          domain: 'example.com',
          target: 'example.com',
          status: 'success',
          isActuallyIp: false,
          isPrivate: false,
          http: {
            success: false,
            status_code: 522,
            page_title: 'Error 522 Ray ID',
            cf_ray: 'abc123-NRT',
            headers: {
              server: 'cloudflare',
            },
            timing: { total_time: 5000 },
          },
          cdn: {
            is_provider: true,
            provider: 'Cloudflare',
            server: 'cloudflare'
          },
          dns: {
            success: true,
            resolved_ip: '104.21.1.1',
            latency: '42ms',
            records: {
              A: [{ value: '104.21.1.1' }],
              MX: [{ value: 'mail.example.com' }],
              TXT: [{ value: 'v=spf1 include:_spf.example.com ~all' }],
            },
          },
          ssl: {
            valid: true,
            grade: 'A',
            factors: ['HSTS_ENABLED'],
          },
          securityHeaders: {
            score: 100,
            grade: 'A',
            checks: [],
          },
          subdomains: [],
          meta: {
            checkedAt: '2026-08-20T00:00:00.000Z',
            totalMs: 5000,
            coreMs: 5000,
            cfRay: 'abc123-NRT',
          },
        },
      })
    })

    await page.goto('/tools/website-check')

    // Fill domain and submit
    await page.getByPlaceholder(/example\.com/i).first().fill('example.com')
    await page.getByRole('button', { name: /Start website check|开始网站检测/i }).click()

    // The component will eventually render the banners.
    // 1. Cloudflare Error Encyclopedia link
    await expect(page.getByText(/Cloudflare Error 522/i)).toBeVisible({ timeout: 10000 })
    // 2. DNS Security Audit banner
    await expect(page.getByText(/Email & DNS Security Validation Available/i)).toBeVisible()
    // 3. Cloudflare Edge CDN banner
    await expect(page.getByRole('heading', { name: /Cloudflare Edge/i })).toBeVisible()
  })

  test('4. Sitemap includes dynamic routes', async ({ page }) => {
    const res = await page.goto('/sitemap.xml')
    expect(res?.ok()).toBeTruthy()

    const body = await res?.text() || ''
    // Error routes
    expect(body).toContain('/errors/522')
    expect(body).toContain('/errors/1020')
    expect(body).toContain('/errors/525')
    // Tools
    expect(body).toContain('/tools/cloudflare-trace')
    expect(body).toContain('/tools/website-check')
    expect(body).toContain('/tools/dns-lookup')
  })

})
