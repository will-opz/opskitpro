import { test, expect } from '@playwright/test';
const session = { authenticated: false, configured: true, accessConfigured: true, passwordConfigured: false };
test.beforeEach(async ({ context }) => {
  await context.route('**/*', route => /^(localhost|127\.0\.0\.1)$/.test(new URL(route.request().url()).hostname) ? route.continue() : route.abort());
});
for (const lang of ['en', 'zh']) {
  const triggerName = lang === 'zh' ? '登录编辑' : 'Sign in to edit';
  const closeName = lang === 'zh' ? '关闭登录' : 'Close sign-in';
  const accessName = lang === 'zh' ? '使用 Cloudflare Zero Trust 登录' : 'Continue with Cloudflare Zero Trust';
  test(`${lang} native modal contains focus, closes and returns focus in dark/narrow layouts`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.route('**/api/admin/session', route => route.fulfill({ json: session }));
    await page.goto(`/${lang}/nav?admin=1`);
    const trigger = page.getByRole('button', { name: triggerName, exact: true });
    await trigger.focus();
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: lang === 'zh' ? '管理员登录' : 'Admin sign in', exact: true });
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(el => el.matches(':modal'))).toBe(true);
    await expect(dialog.getByRole('button', { name: closeName })).toBeFocused();
    await expect(dialog.getByRole('button', { name: accessName, exact: false })).toBeVisible();
    for (let i = 0; i < 7; i++) {
      await page.keyboard.press(i % 2 ? 'Shift+Tab' : 'Tab');
      expect(await dialog.evaluate(el => document.activeElement === document.body || el.contains(document.activeElement))).toBe(true);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const box = await dialog.boundingBox();
    expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await page.screenshot({ path: info.outputPath('admin-native-dialog.png') });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(trigger).toBeFocused();
    await trigger.focus();
    await page.keyboard.press('Enter');
    await dialog.getByRole('button', { name: closeName }).click();
    await expect(trigger).toBeFocused();
  });
  test(`${lang} challenge is retryable and full-page Access navigation remains available`, async ({ page }) => {
    let count = 0;
    await page.route('**/api/admin/session', route => ++count === 1 ? route.fulfill({ status: 403, contentType: 'text/html', body: '<h1>Challenge fixture</h1>' }) : route.fulfill({ json: session }));
    await page.route('**/admin/auth?*', route => route.fulfill({ contentType: 'text/html', body: '<h1>Access navigation fixture</h1>' }));
    await page.goto(`/${lang}/nav?admin=1`);
    await page.getByRole('button', { name: triggerName, exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
    await page.getByRole('button', { name: lang === 'zh' ? '重试' : 'Retry', exact: true }).click();
    await expect(page.getByRole('dialog').getByRole('alert')).toHaveCount(0);
    await page.getByRole('button', { name: accessName, exact: false }).click();
    await expect(page.getByRole('heading', { name: 'Access navigation fixture' })).toBeVisible();
    expect(new URL(page.url()).searchParams.get('next')).toBe(`/${lang}/nav?admin=1`);
    expect(count).toBe(2);
  });
}

test('pending session can be dismissed; a late response cannot reopen it', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/admin/session', async route => { await gate; await route.fulfill({ json: session }).catch(() => {}); });
  await page.goto('/en/nav?admin=1');
  await page.getByRole('button', { name: 'Sign in to edit', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toHaveText('Checking sign-in status…');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  release();
  await expect(page.getByRole('button', { name: 'Sign in to edit', exact: true })).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
