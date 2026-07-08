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

  await expect(page.getByRole('heading', { name: /DNS, IP & Site|DNS·IP·网站|DNS・IP・サイトを|DNS·IP·網站/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /Tools|工具|ツール/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Knowledge Base|知识库|知識庫|ナレッジベース/i }).first()).toBeVisible()
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
  await expect(page.getByRole('link', { name: /AI engineering/i }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: /Vibe Coding in practice/i }).first()).toBeVisible()
})

test('mobile menu opens and exposes primary navigation', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) >= 768, 'Mobile menu is only visible on mobile viewports.')

  await page.goto('/')
  await page.getByRole('button', { name: /Toggle Menu/i }).click()

  await expect(page.getByRole('link', { name: /^Tools$/i })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Knowledge Base', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'About', exact: true })).toBeVisible()
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
  await page.getByPlaceholder(/Enter domain/i).fill('cloudflare-error.example.com')
  await page.getByRole('button', { name: /Analyze/i }).click()

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
