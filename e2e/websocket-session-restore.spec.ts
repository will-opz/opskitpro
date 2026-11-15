import { expect, test } from '@playwright/test';
const key = 'opskitpro_ws_sessions';
const saved = { id: 'legacy', name: 'Saved history', url: 'wss://example.com/history', createdAt: 1, messageCount: 1,
  logs: [{ id: 'history-log', type: 'sent', messageType: 'text', message: 'HISTORY: never replay', time: '12:00:00', timestamp: 1, size: 21 }],
  config: { autoReconnect: true },
};
for (const lang of ['en', 'zh'] as const) {
  const zh = lang === 'zh';
  const copy = { advanced: zh ? '高级功能' : 'Advanced', load: zh ? /^载入/ : /^Load/, list: zh ? '已保存会话' : 'Saved sessions', connect: zh ? '连接' : 'Connect', disconnect: zh ? '断开连接' : 'Disconnect', save: zh ? '保存' : 'Save', saveTitle: zh ? '保存会话' : 'Save session', name: zh ? '会话名称' : 'Session name', retry: zh ? '重新读取' : 'Reload saved sessions' };
  test(`${lang}: restore keeps live socket, history and draft separate; only explicit connect opens a socket`, async ({ page }, info) => {
    const sockets: string[] = [];
    const sends: string[] = [];
    await page.routeWebSocket(/wss:\/\/example.com\//, socket => {
      sockets.push(socket.url());
      socket.onMessage(message => { sends.push(String(message)); socket.send(message); });
    });
    await page.addInitScript(({ key, saved }) => localStorage.setItem(key, JSON.stringify([saved])), { key, saved });
    await page.goto(`/${lang}/tools/websocket`);
    await page.getByRole('button', { name: copy.advanced, exact: true }).click();
    const url = page.getByPlaceholder('wss://your-websocket-server.com');
    await url.fill('wss://example.com/live');
    await page.getByRole('button', { name: copy.connect, exact: true }).click();
    await expect(page.getByRole('button', { name: copy.disconnect, exact: true })).toBeVisible();
    const message = page.getByRole('textbox', { name: zh ? '消息内容' : 'Message content', exact: true });
    await message.fill('unsent draft');
    const load = page.getByRole('button', { name: copy.load });
    await load.focus(); await page.keyboard.press('Enter');
    const list = page.getByRole('dialog', { name: copy.list, exact: true });
    await list.getByRole('button', { name: /^Saved history/ }).click();
    await expect(list).not.toBeVisible();
    const restored = page.getByRole('button', { name: /^Saved history/ }).filter({ hasNot: page.locator('svg.lucide-x') });
    // Selection is a native button with aria-pressed; restoration transfers keyboard focus.
    const selected = page.locator('button[aria-pressed="true"]').filter({ hasText: 'Saved history' });
    await expect(selected).toBeFocused();
    await expect(restored.first()).toBeVisible();
    await expect(url).toHaveValue(saved.url);
    await expect(page.getByText('HISTORY: never replay', { exact: true })).toBeVisible();
    await expect(message).toHaveValue('unsent draft');
    await expect(page.getByRole('button', { name: copy.connect, exact: true })).toBeVisible();
    expect(sockets).toEqual(['wss://example.com/live']); expect(sends).toEqual([]);
    await page.locator('button[aria-pressed]').filter({ hasText: zh ? '连接 1' : 'Connection 1' }).click();
    await expect(url).toHaveValue('wss://example.com/live');
    await expect(page.getByRole('button', { name: copy.disconnect, exact: true })).toBeVisible();
    await expect(page.getByText('HISTORY: never replay', { exact: true })).not.toBeVisible();
    await message.fill('live continues');
    await message.press('Control+Enter');
    await expect.poll(() => sends).toEqual(['live continues']);
    await page.locator('button[aria-pressed]').filter({ hasText: 'Saved history' }).click();
    await page.getByRole('button', { name: copy.connect, exact: true }).click();
    await expect(page.getByRole('button', { name: copy.disconnect, exact: true })).toBeVisible();
    expect(sockets).toEqual(['wss://example.com/live', saved.url]);
    expect(sends).toEqual(['live continues']);
    await page.screenshot({ path: info.outputPath('restored-history.png'), fullPage: true });
  });

  test(`${lang}: full tabs, corrupt storage and failed saves remain recoverable without data loss`, async ({ page }) => {
    await page.addInitScript(({ key, saved }) => localStorage.setItem(key, JSON.stringify([saved])), { key, saved });
    await page.goto(`/${lang}/tools/websocket`);
    await page.getByRole('button', { name: copy.advanced, exact: true }).click();
    const load = page.getByRole('button', { name: copy.load });
    const list = page.getByRole('dialog', { name: copy.list, exact: true });
    for (let i = 0; i < 4; i++) {
      await load.click(); await list.getByRole('button', { name: /^Saved history/ }).click();
      await expect(list).not.toBeVisible();
    }
    await load.click(); await list.getByRole('button', { name: /^Saved history/ }).click();
    await expect(list).toBeVisible();
    await expect(list.getByRole('alert')).toContainText('5');
    expect(await page.locator('button[aria-pressed]').count()).toBe(5);
    await page.keyboard.press('Escape');
    await page.evaluate(key => localStorage.setItem(key, '{broken'), key);
    await load.click();
    await expect(list.getByRole('alert')).toContainText(zh ? '损坏' : 'damaged');
    await expect(list.getByRole('button', { name: /^Saved history/ })).toHaveCount(0);
    expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe('{broken');
    await page.evaluate(({ key, saved }) => localStorage.setItem(key, JSON.stringify([saved])), { key, saved });
    await list.getByRole('button', { name: copy.retry, exact: true }).click();
    await expect(list.getByRole('alert')).toBeEmpty();
    await expect(list.getByRole('button', { name: /^Saved history/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: copy.save, exact: true }).click();
    const save = page.getByRole('dialog', { name: copy.saveTitle, exact: true });
    await save.getByLabel(copy.name, { exact: true }).fill('Draft survives quota failure');
    await page.evaluate(key => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k, v) { if (k === key) throw new DOMException('quota', 'QuotaExceededError'); original.call(this, k, v); };
    }, key);
    await save.getByRole('button', { name: copy.save, exact: true }).click();
    await expect(save).toBeVisible();
    await expect(save.getByRole('alert')).toContainText(zh ? '存储' : 'storage');
    await expect(save.getByLabel(copy.name, { exact: true })).toHaveValue('Draft survives quota failure');
    expect(await page.evaluate(key => JSON.parse(localStorage.getItem(key)!).length, key)).toBe(1);
  });
}
