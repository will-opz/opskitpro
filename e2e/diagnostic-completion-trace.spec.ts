import { test, expect } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { resultFixture } from '../src/app/[lang]/tools/website-check/_lib/result-fixtures';
const trace = 'ip=2001:db8::1234\ncolo=NRT\nts=1794193200\nloc=JP\nhttp=http/2\ntls=TLSv1.3\nwarp=off\nsni=plaintext\nuag=private-marker\nh=private-host';
const output = process.env.DIAGNOSTIC_UI_SCREENSHOTS;
test.beforeEach(async ({page}) => {
  await page.route('**/cdn-cgi/trace', route => route.fulfill({contentType:'text/plain',body:trace}));
  await page.route(/https:\/\/(dns.google|cloudflare-dns.com|dns.alidns.com)\//, route => route.fulfill({json:{}}));
});
for (const lang of ['zh','en'] as const) {
  test(`Trace snapshot, redacted copy, TXT and mobile layout ${lang}`, async ({page}, info) => {
    await page.addInitScript(() => { Object.defineProperty(navigator,'clipboard',{value:{writeText:async (text:string) => { (window as any).__copy = text; }}}); });
    await page.route('**/api/trace?**', route => route.fulfill({contentType:'text/plain',body:trace}));
    await page.goto(`/${lang}/tools/cloudflare-trace`);
    await page.getByRole('button',{name:lang === 'zh' ? '目标域名':'Target domain',exact:true}).click();
    await page.getByLabel(lang==='zh'?'域名或 URL':'Domain or URL').fill('https://user:secret@submitted.example/private?token=secret');
    await page.getByRole('button',{name:lang==='zh'?'探测 Trace':'Trace target',exact:true}).click();
    const result=page.getByRole('region',{name:lang==='zh'?'Trace 结果':'Trace result'});
    await expect(result).toContainText('submitted.example');
    await page.getByLabel(lang==='zh'?'域名或 URL':'Domain or URL').fill('edited.example');
    await result.getByRole('button',{name:lang==='zh'?'复制脱敏摘要':'Copy redacted summary'}).click();
    await expect(result.getByRole('status')).toHaveText(lang==='zh'?'已复制':'Copied');
    const copied=await page.evaluate(()=>(window as any).__copy as string);
    expect(copied).not.toMatch(/2001:db8|submitted|edited|private-|secret/);
    const downloadPromise=page.waitForEvent('download');
    await result.getByRole('button',{name:lang==='zh'?'下载 TXT':'Download TXT'}).click();
    const download=await downloadPromise; expect(download.suggestedFilename()).toBe('opskitpro-cloudflare-trace.txt');
    expect(readFileSync((await download.path())!,'utf8')).toBe(copied);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if(output) {mkdirSync(output,{recursive:true});await page.screenshot({path:`${output}/trace-${lang}-${info.project.name}.png`,fullPage:true});}
    await page.getByText(lang==='zh'?'分享预览与选项':'Share preview and options',{exact:true}).click();
    await page.getByLabel(lang==='zh'?'包含目标域名':'Include target hostname').check();
    await expect(page.getByLabel(lang==='zh'?'分享摘要预览':'Share summary preview')).toHaveValue(/submitted.example/);
    await result.getByRole('button',{name:lang==='zh'?'复制工具地址':'Copy tool URL'}).click();
    expect(await page.evaluate(()=>(window as any).__copy)).toBe(`${new URL(page.url()).origin}/${lang}/tools/cloudflare-trace`);
    const disclosure=page.getByText(lang==='zh'?'如何理解结果':'About these results',{exact:true}); await disclosure.focus(); await page.keyboard.press('Enter');
    await expect(disclosure.locator('..')).toHaveAttribute('open','');
  });
}
test('Website cancel/retry, partial result and result before history', async ({page}, info) => {
  let calls=0;
  await page.route('**/api/diagnostic?**', async route => { calls++; if(calls===1) {await new Promise(resolve=>setTimeout(resolve,1500));} await route.fulfill({json:calls===1?resultFixture('normal',new Date().toISOString()): {...resultFixture('normal',new Date().toISOString()),status:'partial_error',error:'Synthetic missing TLS'}}).catch(()=>{}); });
  await page.goto('/zh/tools/website-check');
  await page.getByLabel('域名或 URL',{exact:true}).fill('normal.fixture.test');
  await page.getByRole('button',{name:'开始网站检测',exact:true}).click();
  await expect(page.getByRole('button',{name:'停止等待'})).toBeVisible();
  await page.getByRole('button',{name:'停止等待'}).click();
  await expect(page.getByText('已停止等待此次检测。')).toBeVisible();
  await page.getByRole('button',{name:'开始网站检测',exact:true}).click();
  await expect(page.getByText('已获得部分结果，可重新检测。')).toBeVisible();
  await expect(page.getByRole('button',{name:'复制结果摘要',exact:true})).toBeVisible();
  const result=page.locator('[data-website-result]'); const history=page.getByText('历史 / 收藏',{exact:true}).locator('..');
  expect((await result.boundingBox())!.y).toBeLessThan((await history.boundingBox())!.y);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if(output) {mkdirSync(output,{recursive:true});await page.screenshot({path:`${output}/website-${info.project.name}.png`,fullPage:true});}
});
