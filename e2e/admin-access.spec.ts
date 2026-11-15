import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
const fixturePath = process.env.ADMIN_ACCESS_FIXTURE;
const fixture = fixturePath ? JSON.parse(readFileSync(fixturePath, 'utf8')) as { token: string; email: string; expired: string; wrongAudience: string } : null;
test.skip(!fixture, 'Requires local ephemeral Access fixture, never a real token');
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => /^(localhost|127\.0\.0\.1)$/.test(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});

test('legacy identity cannot open any management page or session', async ({ request }) => {
  const headers = { 'cf-access-authenticated-user-email': 'admin@example.com', cookie: 'opskitpro_admin=legacy-token' };
  for (const path of ['/admin', '/admin/profile', '/admin/analytics']) {
    const response = await request.get(path, { headers, maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(response.headers().location).toContain('/nav?admin=1');
  }
  const session = await request.get('/api/admin/session', { headers });
  expect(await session.json()).toMatchObject({ authenticated: false, passwordConfigured: false });
  expect(session.headers()['set-cookie']).toContain('Max-Age=0');
  expect((await request.get('/admin/auth', { headers })).status()).toBe(401);
  expect((await request.post('/api/admin/session', { data: { email: 'admin@example.com', password: 'old-password' } })).status()).toBe(403);
});

test('signed administrator works; expired/wrong audience requests do not', async ({ request }) => {
  const response = await request.get('/api/admin/session', { headers: { 'cf-access-jwt-assertion': fixture!.token } });
  expect(await response.json()).toMatchObject({ authenticated: true, email: fixture!.email, provider: 'cloudflare_access' });
  expect(response.headers()['cache-control']).toContain('no-store');
  for (const token of [fixture!.expired, fixture!.wrongAudience]) {
    expect(await (await request.get('/api/admin/session', { headers: { 'cf-access-jwt-assertion': token } })).json()).toMatchObject({ authenticated: false });
  }
});

test('admin language switches both ways in place without reloading or losing identity', async ({ page, context }) => {
  await context.setExtraHTTPHeaders({ 'x-forwarded-proto': 'https', 'cf-access-jwt-assertion': fixture!.token });
  await context.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: test.info().project.use.baseURL as string }]);
  await page.goto('/admin/profile?view=account#details');
  const url = page.url();
  await expect(page.getByRole('heading', { name: 'User profile', exact: true })).toBeVisible();
  for (const [from, to, lang, heading, privacy] of [
    ['English', '简体中文', 'zh', '用户资料', '隐私政策'],
    ['简体中文', 'English', 'en', 'User profile', 'Privacy'],
  ]) {
    let toggle = page.getByRole('button', { name: from, exact: true }).filter({ visible: true });
    if (await toggle.count() === 0) {
      await page.getByLabel(from === 'English' ? 'Navigation menu' : '导航菜单', { exact: true }).click();
      toggle = page.getByRole('button', { name: from, exact: true }).filter({ visible: true });
    }
    await toggle.click();
    await page.getByRole('button', { name: to, exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.getByRole('link', { name: privacy, exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'OpsKitPro', exact: true })).toHaveAttribute('href', `/${lang}`);
    await expect(page).toHaveURL(url);
    const response = await context.request.get('/api/admin/session');
    expect(await response.json()).toMatchObject({ authenticated: true, email: fixture!.email });
  }
});

for (const lang of ['en', 'zh']) {
  test(`${lang} profile renders and logout navigates to Access without erasing tool storage`, async ({ page, context }) => {
    await context.setExtraHTTPHeaders({ 'x-forwarded-proto': 'https', 'cf-access-jwt-assertion': fixture!.token });
    await context.addCookies([{ name: 'NEXT_LOCALE', value: lang, url: test.info().project.use.baseURL as string }]);
    await page.route('**/*', async route => {
      if (!new URL(route.request().url()).hostname.match(/^(localhost|127\.0\.0\.1)$/)) return route.abort();
      if (new URL(route.request().url()).pathname === '/cdn-cgi/access/logout') return route.fulfill({ contentType: 'text/html', body: '<h1>Local Access logout fixture</h1>' });
      return route.continue();
    });
    await page.goto('/admin/profile');
    await expect(page.getByRole('heading', { name: lang === 'zh' ? '用户资料' : 'User profile' })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath(`admin-profile-${lang}.png`), fullPage: true });
    await page.evaluate(() => localStorage.setItem('audit-local-tool-preference', 'keep'));
    await page.getByRole('button', { name: lang === 'zh' ? '退出登录' : 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(/\/cdn-cgi\/access\/logout$/);
    expect(await page.evaluate(() => localStorage.getItem('audit-local-tool-preference'))).toBe('keep');
  });
}

test('public catalog and MCP stay machine-readable without identity', async ({ request }) => {
  const catalog = await request.get('/api/tools');
  expect(catalog.status()).toBe(200);
  expect(catalog.headers()['content-type']).toContain('application/json');
  const preflight = await request.fetch('/mcp', { method: 'OPTIONS' });
  expect(preflight.status()).toBe(204);
  const result = await request.post('/mcp', { headers: { accept: 'application/json, text/event-stream' }, data: {
    jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 'local-acceptance', version: '1' } },
  } });
  expect(result.status()).toBe(200);
  expect(await result.json()).toMatchObject({ jsonrpc: '2.0', result: { serverInfo: { name: 'opskitpro-website-check' } } });
});

for (const lang of ['en', 'zh']) {
  test(`${lang} session challenge keeps full-page Access sign-in available`, async ({ page }) => {
    await page.route('**/api/admin/session', route => route.fulfill({ status: 403, contentType: 'text/html', body: '<h1>Access challenge fixture</h1>' }));
    await page.route('**/admin/auth?*', route => route.fulfill({ contentType: 'text/html', body: '<h1>Local Access sign-in fixture</h1>' }));
    await page.goto(`/${lang}/nav?admin=1`);
    await page.getByRole('button', { name: lang === 'zh' ? '登录编辑' : 'Sign in to edit', exact: true }).click();
    const button = page.getByRole('button', { name: lang === 'zh' ? '使用 Cloudflare Zero Trust 登录' : 'Continue with Cloudflare Zero Trust', exact: false });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page).toHaveURL(/\/admin\/auth\?next=/);
    await expect(page.getByRole('heading', { name: 'Local Access sign-in fixture' })).toBeVisible();
  });
}
