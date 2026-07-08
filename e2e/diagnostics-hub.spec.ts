import { expect, test } from '@playwright/test'

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
      const jsonString = jsonLd.join('\n')
      expect(jsonString).toContain('WebApplication')
      expect(jsonString).toContain('FAQPage')
      expect(jsonString).toContain('BreadcrumbList')
    }

    // Verify Error page specifically
    await page.goto('/errors/522')
    const errorJsonLd = await page.locator('script[type="application/ld+json"]').allTextContents()
    const errorJsonString = errorJsonLd.join('\n')
    expect(errorJsonString).toContain('TechArticle')
    expect(errorJsonString).toContain('FAQPage')
    expect(errorJsonString).toContain('BreadcrumbList')
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
            records: {
              A: [{ value: '104.21.1.1' }],
              MX: [{ value: 'mail.example.com' }],
              TXT: [{ value: 'v=spf1 include:_spf.example.com ~all' }],
            },
          },
        },
      })
    })

    await page.goto('/tools/website-check')

    // Fill domain and submit
    await page.getByPlaceholder(/example\.com/i).first().fill('example.com')
    await page.getByRole('button', { name: /Analyze|检测|診断|檢測/i }).first().click()

    // The component will eventually render the banners.
    // 1. Cloudflare Error Encyclopedia link
    await expect(page.getByText(/Cloudflare Error 522/i)).toBeVisible({ timeout: 10000 })
    // 2. DNS Security Audit banner
    await expect(page.getByText(/DNS Security Audit/i)).toBeVisible()
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
