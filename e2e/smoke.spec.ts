import { expect, test } from '@playwright/test'

const diagnosticResult = {
  domain: 'opskitpro.com',
  status: 'success',
  isActuallyIp: false,
  isPrivate: false,
  dns: {
    success: true,
    resolved_ip: '104.21.1.1',
    latency: '42ms',
    ipv4: ['104.21.1.1'],
    ipv6: ['2606:4700:3030::6815:101'],
    dual_stack: true,
    ns: ['augustus.ns.cloudflare.com', 'hadlee.ns.cloudflare.com'],
    records: {
      A: ['104.21.1.1'],
      AAAA: ['2606:4700:3030::6815:101'],
      CNAME: [],
      MX: ['10 mail.example.com.'],
      TXT: ['v=spf1 include:_spf.example.com ~all'],
      CAA: ['0 issue "letsencrypt.org"'],
      SOA: ['augustus.ns.cloudflare.com. dns.cloudflare.com. 1 10000 2400 604800 1800'],
    },
    resolvers: [{
      resolver: 'Cloudflare',
      status: 'OK',
      latencyMs: 42,
      records: { A: ['104.21.1.1'], AAAA: ['2606:4700:3030::6815:101'] },
      data: { Status: 0 },
    }],
  },
  http: {
    success: true,
    status_code: 200,
    latency: '118ms',
    is_https: true,
    final_url: 'https://opskitpro.com/',
    redirect_count: 1,
    redirect_chain: [
      { url: 'http://opskitpro.com/', status: 301, location: 'https://opskitpro.com/' },
      { url: 'https://opskitpro.com/', status: 200 },
    ],
  },
  ssl: {
    valid: true,
    issuer: 'Mock CA',
    expiry: '2026-12-31',
    grade: 'A',
    factors: ['HTTPS_ENABLED'],
    tls_version: 'TLS 1.3',
    chain: [],
  },
  cdn: {
    is_provider: true,
    provider: 'Cloudflare',
    server: 'cloudflare',
  },
  securityHeaders: {
    score: 100,
    grade: 'A',
    passed: 6,
    total: 6,
    checks: [],
  },
  geo: {
    country: 'United States',
    city: 'San Francisco',
    asn: 'AS13335',
    isp: 'Cloudflare',
  },
  whois: {
    success: true,
    registered: '2026-01-01',
    registrar: 'Mock Registrar',
    status: 'active',
    expires: '2027-01-01',
    nameservers: ['ns1.example.com'],
  },
  meta: {
    checkedAt: '2026-06-04T00:00:00.000Z',
    totalMs: 320,
    coreMs: 120,
    enrichmentMs: 200,
    cacheStatus: 'MISS',
    edgeColo: 'NRT',
  },
}

test.beforeEach(async ({ context, page }) => {
  await context.addCookies([
    {
      name: 'NEXT_LOCALE',
      value: 'en',
      domain: '127.0.0.1',
      path: '/',
    },
  ])

  await page.route('https://pagead2.googlesyndication.com/**', (route) => route.abort())
})

test('home page exposes core navigation and tool entry points', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /DNS, IP & Site/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tools/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Knowledge Base/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Website Diagnostic/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /IP Lookup/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open DNS lookup' })).toBeVisible()
})

test('services dashboard can search first-party tools', async ({ page }) => {
  await page.goto('/services')

  await expect(page.getByRole('heading', { name: /Tool Navigator/i })).toBeVisible()
  await page.getByRole('button', { name: 'All' }).click()
  await page.getByRole('searchbox').fill('encode')
  await expect(page.getByRole('link', { name: /Encode Tool/i })).toBeVisible()
})

test('json formatter beautifies valid JSON', async ({ page }) => {
  await page.goto('/tools/json')

  const editor = page.locator('textarea').first()
  await editor.fill('{"name":"OpsKitPro","ok":true}')
  await page.getByRole('button', { name: /Beautify/i }).click()

  await expect(editor).toHaveValue(/"name": "OpsKitPro"/)
  await expect(page.getByText(/VALID JSON/i)).toBeVisible()
})

test('encoding toolkit transforms and copies output', async ({ context, page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Clipboard permissions are only checked in Chromium smoke tests.')
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.goto('/tools/encode')
  await expect(page.locator('pre')).toContainText('Hello, OpsKitPro!')

  await page.getByRole('button', { name: 'Base64 Encode' }).click()
  await page.getByLabel(/Input/i).fill('OpsKitPro')
  await expect(page.locator('pre')).toContainText('T3BzS2l0UHJv')

  await page.getByRole('button', { name: /^Copy$/i }).click()
  await expect(page.getByRole('button', { name: /Copied/i })).toBeVisible()
})

test('website diagnostics renders mocked result without external network dependency', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__copiedText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          ;(window as any).__copiedText = value
        },
      },
    })
  })

  await page.route('**/api/diagnostic**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(diagnosticResult),
    }),
  )

  await page.goto('/tools/website-check')
  await page.getByPlaceholder(/Enter domain/i).fill('opskitpro.com')
  await page.getByRole('button', { name: /Analyze/i }).click()

  await expect(page.getByPlaceholder(/Enter domain/i)).toHaveValue('opskitpro.com')
  await expect(page.getByText(/All Systems Green/i)).toBeVisible()
  await expect(page.getByText('Cloudflare').first()).toBeVisible()
  await expect(page.getByText('Core Probe')).toBeVisible()
  await expect(page.getByText('Full Check')).toBeVisible()
  await expect(page.getByText('Key Findings')).toBeVisible()
  await expect(page.getByRole('button', { name: /Copy Summary/i })).toBeVisible()
  await page.getByRole('button', { name: /Copy Summary/i }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Impact:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Suspected Cause:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Evidence:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Next Action:')
  await page.getByRole('button', { name: /Show Details/i }).click()
  await expect(page.getByRole('heading', { name: 'DNS Records' })).toBeVisible()
  await page.getByRole('heading', { name: 'DNS Records' }).click()
  await expect(page.getByText('v=spf1 include:_spf.example.com ~all')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Redirect Chain' })).toBeVisible()
  await page.getByRole('heading', { name: 'Redirect Chain' }).click()
  await expect(page.getByText('https://opskitpro.com/').first()).toBeVisible()
})

test('website diagnostics explains partial failures with next actions', async ({ page }) => {
  await page.addInitScript(() => {
    ;(window as any).__copiedText = ''
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value: string) => {
          ;(window as any).__copiedText = value
        },
      },
    })
  })

  await page.route('**/api/diagnostic**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        domain: 'down.example.com',
        status: 'partial_error',
        isActuallyIp: false,
        isPrivate: false,
        error: 'fetch failed',
        dns: {
          resolved_ip: '203.0.113.10',
          latency: '44ms',
          success: true,
          all_ips: ['203.0.113.10'],
          ipv4: ['203.0.113.10'],
          ipv6: [],
          dual_stack: false,
          ns: ['ns1.example.com'],
        },
        meta: {
          checkedAt: '2026-06-04T00:00:00.000Z',
          totalMs: 900,
          cacheStatus: 'MISS',
          edgeColo: 'NRT',
        },
      }),
    }),
  )

  await page.goto('/tools/website-check')
  await page.getByPlaceholder(/Enter domain/i).fill('down.example.com')
  await page.getByRole('button', { name: /Analyze/i }).click()

  await expect(page.getByText('Connection Timeout')).toBeVisible()
  await expect(page.getByText('Likely Cause')).toBeVisible()
  await expect(page.getByText('Next Action')).toBeVisible()
  await page.getByRole('button', { name: /Copy Fault Summary/i }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Likely Cause:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Evidence:')
})

test('time converter parses a Unix timestamp', async ({ page }) => {
  await page.goto('/tools/time')

  await expect(page.getByRole('heading', { name: /Time & Time Zone Converter/i })).toBeVisible()
  await page.getByLabel(/Input time/i).fill('1714200000')

  await expect(page.getByText(/Unix seconds/i)).toBeVisible()
  await expect(page.getByText('1714200000', { exact: true })).toBeVisible()
  await expect(page.getByText(/2024-/)).toBeVisible()
})

test('password generator supports PIN mode regeneration', async ({ page }) => {
  await page.goto('/tools/passgen')

  await expect(page.getByRole('heading', { name: /Password Generator/i })).toBeVisible()
  await page.getByRole('button', { name: /6-digit PIN/i }).click()
  await page.getByRole('button', { name: /Regenerate/i }).click()

  await expect(page.locator('.select-all')).toHaveText(/^\d{6}$/)
})

test('qr generator renders a preview for input text', async ({ page }) => {
  await page.goto('/tools/qrgen')

  await expect(page.getByRole('heading', { name: /QR Generator/i })).toBeVisible()
  await page.getByPlaceholder(/Enter text or URL/i).fill('https://opskitpro.com/tools/qrgen')

  await expect(page.locator('#qr-code-svg')).toBeVisible()
  await expect(page.getByRole('button', { name: /Download QR/i })).toBeEnabled()
})

test('knowledge base exposes public article groups and article links', async ({ page }) => {
  await page.goto('/blog')

  await expect(page.getByRole('heading', { name: /Knowledge Base/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /AI engineering/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Vibe Coding in practice/i })).toBeVisible()
})

test('mobile menu opens and exposes primary navigation', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'Mobile menu is only visible on mobile viewports.')

  await page.goto('/')
  await page.getByRole('button', { name: /Toggle Menu/i }).click()

  await expect(page.getByRole('link', { name: /^Tools$/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Knowledge Base', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible()
})
