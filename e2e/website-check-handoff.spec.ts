import { test, expect } from '@playwright/test';
import { resultFixture } from '../src/app/[lang]/tools/website-check/_lib/result-fixtures';

test('DNS handoff uses diagnosed target; Back restores failure, draft, details and retry', async ({page}) => {
  let runs = 0;
  await page.route('**/api/diagnostic?**', route => { runs++; return route.fulfill({status:400,json:{status:'error',message:'Target did not resolve to a public A or AAAA address.'}}); });
  await page.route(/https:\/\/(dns.google|cloudflare-dns.com|dns.alidns.com)\//,route=>route.fulfill({json:{}}));
  await page.goto('/zh/tools/website-check');
  await page.getByLabel('域名或 URL',{exact:true}).fill('dns-fail.fixture.test');
  await page.getByRole('button',{name:'开始网站检测',exact:true}).click();
  const result=page.locator('[data-website-result]');
  await expect(result.getByRole('heading',{name:'异常',exact:true})).toBeVisible();
  await page.getByLabel('域名或 URL',{exact:true}).fill('different-draft.fixture.test');
  await result.getByText('详情 · 原始数据与导出',{exact:true}).click();
  const action=result.getByRole('link',{name:'查询 DNS',exact:true});
  await action.focus();
  const returnScroll = await page.evaluate(()=>scrollY);
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/dns-lookup\?q=dns-fail.fixture.test/);
  await expect(page.getByRole('textbox').first()).toHaveValue('dns-fail.fixture.test');
  await page.goBack();
  await expect(result.getByRole('heading',{name:'异常',exact:true})).toBeVisible();
  await expect(page.getByLabel('域名或 URL',{exact:true})).toHaveValue('different-draft.fixture.test');
  await expect(result.locator('details').first()).toHaveAttribute('open','');
  await expect(action).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThanOrEqual(Math.max(0,returnScroll-48));
  await expect.poll(()=>page.evaluate(()=>scrollY)).toBeLessThanOrEqual(returnScroll+48);
  expect(runs).toBe(1);
  const retry=page.waitForRequest(r=>r.url().includes('/api/diagnostic?'));
  await result.getByRole('button',{name:'重新验证',exact:true}).click();
  expect(new URL((await retry).url()).searchParams.get('domain')).toBe('dns-fail.fixture.test');
});

test('current-network action passes no domain and Back preserves observation', async ({page}) => {
  let runs=0;
  await page.route('**/api/diagnostic?**',route=>{runs++;return route.fulfill({json:resultFixture('normal',new Date().toISOString())});});
  await page.goto('/zh/tools/website-check?q=normal.fixture.test');
  const result=page.locator('[data-website-result]');
  await expect(result.getByRole('heading',{name:'正常',exact:true})).toBeVisible();
  const observation=await result.locator('time').first().getAttribute('datetime');
  const action=result.getByRole('link',{name:'检查当前网络',exact:true});
  await expect(action).toHaveAttribute('href','/zh/tools/network-check');
  await expect(result).toContainText('不会继续检测此域名');
  await action.click();await expect(page).toHaveURL(/\/zh\/tools\/network-check$/);
  await page.goBack();
  await expect(result.getByRole('heading',{name:'正常',exact:true})).toBeVisible();
  await expect(result.locator('time').first()).toHaveAttribute('datetime',observation!);
  await expect(action).toBeFocused();expect(runs).toBe(1);
});
