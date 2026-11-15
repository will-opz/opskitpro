import { test, expect } from '@playwright/test';

for (const lang of ['en', 'zh']) {
  test(`${lang} deep JSON stats and capacity failure remain recoverable`, async ({ page }, info) => {
    await page.goto(`/${lang}/tools/json`);
    const input = page.getByRole('textbox');
    const minify = page.getByRole('button', { name: lang === 'zh' ? '压缩 JSON' : 'Minify', exact: true });
    const format = page.getByRole('button', { name: lang === 'zh' ? '美化 JSON' : 'Beautify', exact: true });
    const copy = page.getByRole('button', { name: lang === 'zh' ? '复制' : 'Copy', exact: true });
    const error = page.locator('#json-operation-error');
    // Confirm hydration through a harmless visible action before typing.
    await expect.poll(async () => {
      await page.getByRole('button', { name: lang === 'zh' ? '示例数据' : 'Sample', exact: true }).click();
      return input.inputValue();
    }).toContain('OpsKitPro');
    await input.fill('{"previous":true}');
    await format.click();
    const deep = '['.repeat(10000) + '0' + ']'.repeat(10000);
    await input.fill(deep);
    await expect(input.locator('..').locator('..')).toContainText(lang === 'zh' ? '深度 10000' : 'depth 10000');
    // Engines have different serialization limits. Probe compact serialization
    // only, avoiding an enormous indented result on engines that support it.
    const nativeFailure = await page.evaluate(text => {
      try { JSON.stringify(JSON.parse(text)); return false; } catch { return true; }
    }, deep);
    await info.attach('native-serialization.json', { body: JSON.stringify({ depth: 10000, nativeFailure }), contentType: 'application/json' });
    await minify.click();
    if (nativeFailure) {
      await expect(error).toContainText(lang === 'zh' ? '浏览器' : 'browser');
      await expect(copy).toBeDisabled();
    } else {
      await expect(page.getByTestId('json-output')).toHaveText(deep);
    }
    // Deterministic capacity failure exercises the same UI on every engine.
    await page.evaluate(() => {
      const original = JSON.stringify;
      JSON.stringify = ((value, replacer, space) => {
        let item = value;
        let depth = 0;
        while (Array.isArray(item) && item.length === 1 && depth <= 100) { item = item[0]; depth++; }
        if (depth > 100) throw new RangeError('Synthetic capacity failure');
        return original(value, replacer as never, space);
      }) as typeof JSON.stringify;
    });
    await format.click();
    await expect(error).toContainText(lang === 'zh' ? '原始输入未更改' : 'Your input is unchanged');
    await expect(input).toHaveValue(deep);
    await expect(input).toHaveAttribute('aria-describedby', 'json-operation-error');
    await expect(error).toHaveAttribute('aria-live', 'polite');
    await expect(copy).toBeDisabled();
    await expect(page.getByRole('button', { name: lang === 'zh' ? '用作输入' : 'Use as input', exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath('json-capacity-error.png') });
    await input.fill('{"recovered":true}');
    await expect(error).toBeEmpty();
    await format.click();
    await expect(page.getByTestId('json-output')).toContainText('"recovered": true');
    await expect(copy).toBeEnabled();
  });
}
