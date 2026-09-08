import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { resultFixture } from '../src/app/[lang]/tools/website-check/_lib/result-fixtures';
const output=process.env.WEBSITE_RESULT_SCREENSHOTS;
test.describe('Website Check result experience',()=>{
 for(const scenario of ['normal','dns-fail','tls-fail','timeout','conflict']) {
  test(`${scenario}: evidence, assessment and relevant action`,async({page})=>{
   await page.route('**/api/diagnostic?**',route=>route.fulfill({json:resultFixture(scenario,new Date().toISOString())}));
   await page.route('https://dns.google/**',route=>route.fulfill({json:{}}));
   await page.route('https://cloudflare-dns.com/**',route=>route.fulfill({json:{}}));
   await page.route('https://dns.alidns.com/**',route=>route.fulfill({json:{}}));
   await page.goto(`/zh/tools/website-check?q=${scenario}.fixture.test`);
   const result=page.getByRole('region',{name:'诊断结果',exact:true});
   await expect(result).toBeVisible();
   await expect(result.getByRole('heading',{name:scenario==='normal'?'正常':scenario==='conflict'?'部分可用':'异常',exact:true})).toBeVisible();
   await expect(result.getByText('详情 · 原始数据与导出')).toBeVisible();
   expect(await result.locator('details').first().getAttribute('open')).toBeNull();
   await expect(result.getByRole('heading',{name:'关键证据',exact:true})).toBeVisible();
   if(scenario==='conflict') {await expect(result.getByText('HTTP 200',{exact:true})).toBeVisible();await expect(result.getByText('HTTP 403',{exact:true})).toBeVisible();}
   if(scenario==='dns-fail') await expect(result.getByRole('link',{name:'查询 DNS'})).toHaveAttribute('href','/zh/tools/dns-lookup?q=dns-fail.fixture.test');
   if(output){mkdirSync(output,{recursive:true});await result.screenshot({style:"nextjs-portal{display:none}",path:`${output}/fixture-${scenario}-${test.info().project.name}.png`});}
   if(scenario==='tls-fail') {await result.getByRole('button',{name:'查看证书详情'}).click();await expect(result.locator('#result-tls')).toHaveAttribute('open','');await expect(result.locator('#result-tls > summary')).toBeFocused();}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
   if(scenario==='dns-fail') {await result.getByRole('link',{name:'查询 DNS'}).click();await expect(page).toHaveURL(/dns-lookup\?q=dns-fail.fixture.test/);await expect(page.getByRole('textbox').first()).toHaveValue('dns-fail.fixture.test');}
  });
 }
 test('dark conflict and keyboard',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('opskit-theme','dark'));
  await page.route('**/api/diagnostic?**',route=>route.fulfill({json:resultFixture('conflict',new Date().toISOString())}));
  await page.goto('/zh/tools/website-check?q=conflict.fixture.test');
  const result=page.getByRole('region',{name:'诊断结果',exact:true});await expect(result).toBeVisible();
  await expect(page.locator('html')).toHaveClass(/dark/);
  await result.getByText('详情 · 原始数据与导出').focus();await page.keyboard.press('Enter');
  await expect(result.locator('details').first()).toHaveAttribute('open','');
  await page.keyboard.press('Enter');
  if(output) await result.screenshot({style:"nextjs-portal{display:none}",path:`${output}/fixture-conflict-dark-${test.info().project.name}.png`});
 });
});
