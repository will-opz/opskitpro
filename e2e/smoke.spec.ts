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
    lookupTarget: 'opskitpro.com',
    source: 'rdap',
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

const needsReviewResult = {
  ...diagnosticResult,
  cdn: {
    is_provider: false,
    provider: 'Origin',
    server: 'BWS/1.1',
  },
  securityHeaders: {
    score: 22,
    grade: 'F',
    passed: 1,
    total: 6,
    checks: [
      {
        key: 'content-security-policy',
        label: 'Content-Security-Policy',
        present: false,
      },
    ],
  },
  whois: {
    registered: 'Unknown',
    registrar: 'Unknown',
    status: 'Unknown',
    success: false,
    expires: 'Unknown',
    lookupTarget: 'example.com',
    source: 'rdap',
    errorCode: 'not_found',
    error: 'No RDAP registration record was found for this target.',
    httpStatus: 404,
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

test('invalid locale-like paths return 404 instead of 500', async ({ request }) => {
  for (const path of ['/config.json', '/docker-compose.yml', '/unknown']) {
    const response = await request.get(path)
    expect(response.status(), `${path} should be a not-found response`).toBe(404)
  }
})

test('unknown paths return a direct 404 while known public paths localize', async ({ request }) => {
  for (const path of ['/contact', '/pricing', '/graphql']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status(), `${path} should not redirect before 404`).toBe(404)
    expect(response.headers()['set-cookie']).toBeUndefined()
  }

  const knownRoute = await request.get('/tools/website-check', {
    maxRedirects: 0,
  })
  expect(knownRoute.status()).toBe(307)
  expect(knownRoute.headers().location).toBe('/en/tools/website-check')
})

test('localized pages link directly to the current locale', async ({ page }) => {
  await page.goto('/en/tools/website-check')

  await expect(page.locator('a[href^="/en/tools/"]')).not.toHaveCount(0)
  await expect(page.locator('a[href^="/tools"]')).toHaveCount(0)
})

test('tool API snippets and website-check metadata follow the active locale', async ({ page }) => {
  await page.goto('/zh/tools/website-check')

  await expect(page).toHaveTitle('网站诊断 | DNS · HTTP · TLS · CDN 检测与 JSON API | OpsKitPro')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    '网站诊断 | DNS · HTTP · TLS · CDN 检测与 JSON API | OpsKitPro',
  )
  await expect(page.getByRole('heading', { name: '开发者 API' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '接口' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '请求示例' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '响应示例' })).toBeVisible()
  await expect(page.getByText('GET https://opskitpro.com/api/diagnostic')).toBeVisible()
  await expect(page.getByText(/domain 参数支持域名、完整 URL 或 IP 地址/)).toBeVisible()
  await expect(page.getByRole('link', { name: /查看限流与错误契约/ })).toHaveAttribute(
    'href',
    '/zh/tools/api',
  )

  await page.goto('/zh/tools/dns-lookup')
  await expect(page.getByRole('heading', { name: '开发者 API' })).toBeVisible()

  await page.goto('/zh/tools/ip-lookup')
  await expect(page.getByRole('heading', { name: '开发者 API' })).toBeVisible()
})

test('home page exposes core navigation and tool entry points', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /DNS, IP & Site|DNS·IP·网站|DNS・IP・サイトを|DNS·IP·網站/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tools|工具|ツール/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Password Generator|密码生成器/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Knowledge Base|知识库/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /About|关于我们/i })).toHaveCount(0)
  await expect(page.getByRole('link', { name: /Website Diagnostic|网站综合诊断|網站綜合診斷|Webサイト診断/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /IP Lookup|IP 归属查询|IP 歸屬查詢|IP アドレス検索/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open DNS lookup' }).first()).toBeVisible()
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
  await page.getByPlaceholder(/Enter a domain/i).fill('opskitpro.com')
  await page.getByRole('button', { name: /Start website check/i }).click()

  await expect(page.getByPlaceholder(/Enter a domain/i)).toHaveValue('opskitpro.com')
  await expect(page.getByText('Healthy', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'AVAILABILITY VERDICT' })).toBeVisible()
  const attention = page.getByTestId('attention-findings')
  await expect(attention.getByText('Needs Attention')).toBeVisible()
  await expect(attention.getByText('Nothing needs action right now.')).toBeVisible()
  await expect(page.getByText('Technical Details')).toBeVisible()
  await expect(page.getByText('MULTI-VANTAGE VERIFICATION')).toBeHidden()
  await expect(page.getByText('Core Probe')).toBeHidden()
  await expect(page.getByRole('button', { name: /Copy Summary/i })).toHaveCount(1)
  await page.getByRole('button', { name: /Copy Summary/i }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Impact:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Evidence:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Assessment:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Guidance:')
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).not.toContain('Score:')
  await page.getByRole('button', { name: /Show Details/i }).click()
  await expect(page.getByText('MULTI-VANTAGE VERIFICATION')).toBeVisible()
  await expect(page.getByText('Your Browser', { exact: true })).toBeVisible()
  await expect(page.getByText('Cloudflare Edge', { exact: true })).toBeVisible()
  await expect(page.getByText('OpsKitPro Probe', { exact: true })).toBeVisible()
  await expect(page.getByText('Core Probe')).toBeVisible()
  await expect(page.getByText('Full Check')).toBeVisible()
  await expect(page.getByTestId('technical-summary').getByText('Passed Checks', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: /Export Markdown/i })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'DNS Records' })).toBeVisible()
  await page.getByRole('heading', { name: 'DNS Records' }).click()
  await expect(page.getByText('v=spf1 include:_spf.example.com ~all')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Redirect Chain' })).toBeVisible()
  await page.getByRole('heading', { name: 'Redirect Chain' }).click()
  await expect(page.getByText('https://opskitpro.com/').first()).toBeVisible()
})

test('website diagnostics puts needs-review findings ahead of technical detail', async ({ page }) => {
  await page.route('**/api/diagnostic**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(needsReviewResult),
    }),
  )

  await page.goto('/tools/website-check')
  await page.getByPlaceholder(/Enter a domain/i).fill('example.com')
  await page.getByRole('button', { name: /Start website check/i }).click()

  const attention = page.getByTestId('attention-findings')
  await expect(attention.getByText('1 item needs attention')).toBeVisible()
  await expect(attention.getByText('Security Headers')).toBeVisible()
  await expect(attention.getByText('CDN', { exact: true })).toBeVisible()
  await expect(attention.getByText('Informational')).toBeVisible()
  await expect(attention.getByText('DNS', { exact: true })).toHaveCount(0)
  await expect(attention.getByText('HTTP', { exact: true })).toHaveCount(0)
  await expect(attention.getByText('SSL', { exact: true })).toHaveCount(0)
  await expect(attention.getByText('CAUSE', { exact: true })).toHaveCount(0)
  await expect(page.getByTestId('technical-summary')).toHaveCount(0)
  await page.getByRole('button', { name: /Show Details/i }).click()
  await expect(page.getByText('Registration lookup target: example.com')).toBeVisible()
  await expect(page.getByText('No registration record was found for this domain.')).toBeVisible()
  await expect(page.getByText('RDAP HTTP 404')).toBeVisible()
})

test('website diagnostics separates a reachable browser from a blocked server probe', async ({ page }) => {
  let directThirdPartyRequests = 0
  await page.route('https://example.com/**', async (route) => {
    directThirdPartyRequests += 1
    await route.abort()
  })
  await page.route('**/api/diagnostic**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...diagnosticResult,
        domain: '127.0.0.1',
        http: {
          ...diagnosticResult.http,
          success: false,
          status_code: 403,
          classification: 'probe_blocked',
          challenge: true,
          redirect_count: 0,
          redirect_chain: [{ url: 'https://127.0.0.1/', status: 403 }],
        },
        observations: {
          edge: {
            source: 'cloudflare_edge',
            status: 'reachable',
            precision: 'full',
            colo: 'NRT',
            httpStatus: 200,
            latencyMs: 48,
            finalUrl: 'https://127.0.0.1/',
            checkedAt: '2026-07-25T00:00:00.000Z',
          },
          server: {
            source: 'opskitpro_probe',
            status: 'probe_blocked',
            precision: 'full',
            location: 'AWS Lightsail',
          },
        },
      }),
    }),
  )

  await page.goto('/tools/website-check')
  await page.getByPlaceholder(/Enter a domain/i).fill('127.0.0.1')
  await page.getByRole('button', { name: /Start website check/i }).click()

  await expect(page.getByText('Healthy', { exact: true })).toBeVisible()
  await expect(page.getByTestId('attention-findings').getByText(/Do not treat this as downtime/)).toBeVisible()
  await page.getByRole('button', { name: /Show Details/i }).click()
  await expect(page.getByText('Browser OK / Lightsail restricted')).toBeVisible()
  await expect(page.getByText('Your Browser · full')).toBeVisible()
  await expect(page.getByText('Cloudflare Edge Probe · NRT · full')).toBeVisible()
  await expect(page.getByText('OpsKitPro Probe · AWS Lightsail · full')).toBeVisible()
  expect(directThirdPartyRequests).toBe(0)
})

test('website diagnostics labels edge-only corroboration without claiming browser reachability', async ({ page }) => {
  let directTargetRequests = 0
  await page.route('https://example.com/**', async (route) => {
    directTargetRequests += 1
    await route.abort()
  })
  await page.route('**/api/diagnostic**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...diagnosticResult,
        domain: 'example.com',
        http: {
          ...diagnosticResult.http,
          success: false,
          status_code: 403,
          classification: 'probe_blocked',
          challenge: true,
        },
        observations: {
          edge: {
            source: 'cloudflare_edge',
            status: 'reachable',
            precision: 'full',
            colo: 'NRT',
            httpStatus: 200,
            latencyMs: 35,
            finalUrl: 'https://example.com/',
            checkedAt: '2026-07-25T00:00:00.000Z',
          },
          server: {
            source: 'opskitpro_probe',
            status: 'probe_blocked',
            precision: 'full',
            location: 'AWS Lightsail',
          },
        },
      }),
    }),
  )

  await page.goto('/tools/website-check')
  await page.getByPlaceholder(/Enter a domain/i).fill('example.com')
  await page.getByRole('button', { name: /Start website check/i }).click()

  await expect(page.getByText('Healthy', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /Show Details/i }).click()
  await expect(page.getByText('Edge OK / Lightsail restricted')).toBeVisible()
  await expect(page.getByText('Cloudflare Edge Probe · NRT · full')).toBeVisible()
  await expect(page.getByText('Your Browser · full')).toHaveCount(0)
  expect(directTargetRequests).toBe(0)
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
  await page.getByPlaceholder(/Enter a domain/i).fill('down.example.com')
  await page.getByRole('button', { name: /Start website check/i }).click()

  await expect(page.getByText('Connection Timeout')).toBeVisible()
  await expect(page.getByText('Possible Cause · Low Confidence')).toBeVisible()
  await expect(page.getByText('Guidance').first()).toBeVisible()
  await page.getByRole('button', { name: /Copy Fault Summary/i }).click()
  await expect.poll(() => page.evaluate(() => (window as any).__copiedText)).toContain('Possible Cause (Confidence: Low):')
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
  await page.getByRole('tab', { name: /^PIN$/i }).click()
  await page.getByRole('button', { name: /Regenerate/i }).click()

  await expect(page.getByTestId('generated-password')).toHaveText(/^\d{6}$/)
})

test('qr generator renders a preview for input text', async ({ page }) => {
  await page.goto('/tools/qrgen')

  await expect(page.getByRole('heading', { name: /QR Generator/i })).toBeVisible()
  await page.getByPlaceholder(/Enter text or URL/i).fill('https://opskitpro.com/tools/qrgen')

  await expect(page.locator('#qr-code-svg')).toBeVisible()
  await expect(page.locator('#qr-code-svg')).toHaveAttribute('width', '320')
  await expect(page.locator('#qr-code-svg')).toHaveAttribute('height', '320')
  await expect(page.getByRole('button', { name: /Download QR/i })).toBeEnabled()
})

test('qr generator enforces a UTF-8 byte limit without crashing the page', async ({ page }) => {
  await page.goto('/zh/tools/qrgen')

  const input = page.locator('textarea')
  const download = page.getByRole('button', { name: '下载二维码' })

  await input.fill('a'.repeat(500))
  await expect(page.getByText('500 / 500 bytes')).toBeVisible()
  await expect(page.locator('#qr-code-svg')).toBeVisible()
  await expect(download).toBeEnabled()

  await input.fill('中'.repeat(166))
  await expect(page.getByText('498 / 500 bytes')).toBeVisible()
  await expect(page.locator('#qr-code-svg')).toBeVisible()

  await input.fill('中'.repeat(167))
  await expect(page.getByText('501 / 500 bytes')).toBeVisible()
  await expect(page.locator('#qr-payload-error')).toHaveText('内容过长，请缩短后再生成二维码。')
  await expect(input).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('#qr-code-svg')).toHaveCount(0)
  await expect(page.getByText('内容超过 500 字节，无法生成二维码。')).toBeVisible()
  await expect(download).toBeDisabled()
})

test('retired blog index sends visitors to the tool catalog', async ({ page }) => {
  await page.goto('/blog')

  await expect(page).toHaveURL(/\/en\/tools$/)
  await expect(page.getByRole('heading', { name: /First-party tools/i })).toBeVisible()
})

test('retired localized articles redirect to the matching tool and locale', async ({ page }) => {
  await page.goto('/zh/blog/tls-health-vs-https')

  await expect(page).toHaveURL(/\/zh\/tools\/website-check$/)
  await expect(page.getByRole('heading', { name: /网站检测|Website Check/i })).toBeVisible()
})

test('mobile menu opens and exposes primary navigation', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'Mobile menu is only visible on mobile viewports.')

  await page.goto('/')
  await page.getByRole('button', { name: /Open tools menu/i }).click()

  await expect(page.getByRole('link', { name: 'All tools', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Website Check', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Password Generator', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Knowledge Base', exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'About', exact: true })).toHaveCount(0)
})

test('website diagnostics detects Cloudflare errors and links to encyclopedia', async ({ page }) => {
  await page.route('**/api/diagnostic**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        domain: 'cloudflare-error.example.com',
        status: 'success',
        isActuallyIp: false,
        isPrivate: false,
        dns: {
          resolved_ip: '104.21.1.1',
          latency: '42ms',
          success: true,
          ipv4: ['104.21.1.1'],
          ipv6: [],
        },
        http: {
          success: false,
          status_code: 522,
          latency: '118ms',
          cf_ray: '8dfj2819dj29-NRT',
          page_title: 'Error 522 Connection timed out'
        },
        cdn: {
          is_provider: true,
          provider: 'Cloudflare',
          server: 'cloudflare'
        },
        meta: { checkedAt: '2026-06-04T00:00:00.000Z', totalMs: 320 }
      }),
    }),
  )

  await page.goto('/tools/website-check')
  await page.getByPlaceholder(/Enter a domain/i).fill('cloudflare-error.example.com')
  await page.getByRole('button', { name: /Start website check/i }).click()

  // Verify the CF Error banner is displayed
  await expect(page.getByText('Cloudflare Error 522 Detected')).toBeVisible()
  
  // Verify the link points to the encyclopedia
  const link = page.getByRole('link', { name: /Read 522 Troubleshooting Guide/i })
  await expect(link).toBeVisible()
  await expect(link).toHaveAttribute('href', '/errors/522')
})

test('cloudflare trace renders and analyzes local connection', async ({ page }) => {
  await page.route('**/cdn-cgi/trace**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'fl=234f2\nh=1.1.1.1\nip=203.0.113.5\nts=1717500000\nvisit_scheme=https\nuag=Mozilla/5.0\ncolo=NRT\nsliver=none\nhttp=http/2\nloc=JP\ntls=TLSv1.3\nsni=plaintext\nwarp=off\ngateway=off\nkex=X25519'
    }),
  )

  await page.goto('/tools/cloudflare-trace')
  await expect(page.getByRole('heading', { name: /Cloudflare Trace Center/i })).toBeVisible()

  // Wait for fetch to complete and render
  await expect(page.getByText('203.0.113.5')).toBeVisible()
  await expect(page.getByText('NRT', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('TLSv1.3', { exact: true })).toBeVisible()
})

test('network check renders network doctor trace and dns resolver diagnostics', async ({ page }) => {
  await page.route('**/api/network/info', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ip: '203.0.113.5',
        ipv6: null,
        asn: 13335,
        org: 'Cloudflare',
        country: 'JP',
        city: 'Tokyo',
        colo: 'NRT',
        timezone: 'Asia/Tokyo',
        ua: 'Playwright',
        trace: {
          http: 'http/3',
          tls: 'TLSv1.3',
          warp: 'plus',
          gateway: 'off',
          loc: 'JP',
          sni: 'plaintext',
          kex: 'X25519MLKEM768',
          ip: '203.0.113.5',
          colo: 'NRT',
        },
        _source: 'cloudflare-context',
      }),
    }),
  )
  await page.route('**/api/network/ping', (route) => route.fulfill({ status: 204, body: '' }))
  await page.route('**/api/network/download?size=*', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-length': '1024' },
      body: 'x'.repeat(1024),
    }),
  )
  await page.route('**/api/network/reachability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          { url: 'https://github.com', label: 'GitHub', reachable: true, latencyMs: 120, status: 'ok' },
          { url: 'https://web.telegram.org', label: 'Telegram', reachable: true, latencyMs: 1800, status: 'slow' },
        ],
      }),
    }),
  )
  await page.route('**/api/network/dns-latency', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          { resolver: '1.1.1.1', provider: 'Cloudflare', latencyMs: 11, status: 'ok' },
          { resolver: '8.8.8.8', provider: 'Google', latencyMs: 18, status: 'ok' },
          { resolver: '9.9.9.9', provider: 'Quad9', latencyMs: 25, status: 'ok' },
          { resolver: '208.67.222.222', provider: 'OpenDNS', latencyMs: 31, status: 'ok' },
        ],
      }),
    }),
  )
  await page.route('**/cdn-cgi/trace', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'ip=203.0.113.5\ncolo=NRT\nloc=JP\nhttp=http/3\ntls=TLSv1.3\nsni=plaintext\nwarp=plus\ngateway=off\nkex=X25519MLKEM768',
    }),
  )

  await page.goto('/tools/network-check')
  await page.getByRole('button', { name: /Start Check/i }).click()

  await expect(page.getByText('WARP+', { exact: true })).toBeVisible({ timeout: 15000 })
  await expect(page.getByText('Post-Quantum', { exact: true })).toBeVisible()
  await expect(page.getByText('DNS Resolver Latency')).toBeVisible()
  await expect(page.getByText('Cloudflare').first()).toBeVisible()
  await expect(page.getByText(/WARP\+ is enabled/)).toBeVisible()
})

test('network check falls back to cloudflare trace when network info fails', async ({ page }) => {
  await page.route('**/api/network/info', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'network info unavailable' }),
    }),
  )
  await page.route('**/api/network/ping', (route) => route.fulfill({ status: 204, body: '' }))
  await page.route('**/api/network/download?size=*', (route) =>
    route.fulfill({
      status: 200,
      headers: { 'content-length': '1024' },
      body: 'x'.repeat(1024),
    }),
  )
  await page.route('**/api/network/reachability', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    }),
  )
  await page.route('**/api/network/dns-latency', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ results: [] }),
    }),
  )
  await page.route('**/cdn-cgi/trace', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/plain',
      body: 'ip=2001:db8::5\ncolo=NRT\nloc=JP\nhttp=http/3\ntls=TLSv1.3\nsni=plaintext\nwarp=off\ngateway=off\nkex=X25519',
    }),
  )

  await page.goto('/tools/network-check')
  await page.getByRole('button', { name: /Start Check/i }).click()

  await expect(page.getByText('2001:db8::5', { exact: true }).first()).toBeVisible({ timeout: 15000 })
  await expect(page.getByText(/IPv6 dual-stack|IPv6 デュアルスタック|双栈|雙棧/i)).toBeVisible()
  await expect(page.getByText('NRT', { exact: true }).first()).toBeVisible()
})

test('dns security audit detects weak spf and missing dmarc', async ({ page }) => {
  // Mock SPF query
  await page.route('**/api/dns?domain=bad.example.com&type=TXT', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answers: [{ data: 'v=spf1 include:_spf.google.com ?all' }] })
    })
  })

  // Mock DMARC query
  await page.route('**/api/dns?domain=_dmarc.bad.example.com&type=TXT', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answers: [] })
    })
  })

  // Mock CAA query
  await page.route('**/api/dns?domain=bad.example.com&type=CAA', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ answers: [{ data: '0 issue "letsencrypt.org"' }] })
    })
  })

  await page.goto('/tools/dns-lookup')
  
  // Switch to Security Audit tab
  await page.getByRole('button', { name: /Security Audit/i }).click()
  
  // Fill and submit
  await page.getByPlaceholder(/Lookup domain/i).fill('bad.example.com')
  await page.getByRole('button', { name: /Run Audit/i }).click()

  // Verify scoring and text
  await expect(page.getByText('Weak SPF policy (?all or +all)')).toBeVisible()
  await expect(page.getByText('No DMARC record found on _dmarc subdomain.')).toBeVisible()
  await expect(page.getByText('F', { exact: true })).toBeVisible() // Score should be F
})
