import {test,expect} from '@playwright/test';

test('Tools and palette share bilingual task ranking and truthful limitations',async({page})=>{
  await page.goto('/zh/tools');
  const input=page.getByRole('searchbox',{name:'查找工具或任务'});
  for(const [query,id] of [['ssl','website-check'],['证书过期','website-check'],['网站打不开','website-check'],['解析慢','network-doctor'],['json format','json'],['脱敏','sensitive-data'],['查 ip 属地','ip-lookup']]){
    await input.fill(query);await expect(page.locator('[data-tool-id]').first()).toHaveAttribute('data-tool-id',id);
  }
  await input.fill('format');
  const catalog=await page.locator('[data-tool-id]').evaluateAll(elements=>elements.map(e=>e.getAttribute('data-tool-id')));
  await page.getByRole('button',{name:'搜索工具',exact:true}).click();
  const palette=page.getByRole('dialog');
  await palette.getByRole('textbox').fill('format');
  expect(await palette.locator('[data-search-tool]').evaluateAll(elements=>elements.map(e=>e.getAttribute('data-search-tool')))).toEqual(catalog);
  await palette.getByRole('textbox').fill('dnssec');await expect(palette).toContainText('不支持 DNSSEC 验证');
  await palette.getByRole('textbox').fill('quantum-banana-xyz');await expect(palette.getByRole('status')).toBeVisible();
  await page.keyboard.press('Escape');await expect(palette).not.toBeVisible();
  await expect(page.getByRole('button',{name:'搜索工具',exact:true})).toBeFocused();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('URL query and filters survive tool navigation, Back and reload',async({page})=>{
  await page.goto('/zh/tools?keep=1');
  await page.getByRole('button',{name:'本地处理',exact:true}).click();
  await page.getByRole('button',{name:'格式化与转换',exact:true}).click();
  const input=page.getByRole('searchbox',{name:'查找工具或任务'});await input.fill('json 格式化');
  await expect(page).toHaveURL(/keep=1/);
  await page.locator('[data-tool-id="json"]').click();await expect(page).toHaveURL(/\/tools\/json$/);
  await page.goBack();await expect(input).toHaveValue('json 格式化');
  await expect(page.getByRole('button',{name:'本地处理',exact:true})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'格式化与转换',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.reload();await expect(input).toHaveValue('json 格式化');await expect(page.locator('[data-tool-id]')).toHaveCount(1);
});

test('home palette uses same index, arrow/Enter navigation, and English accepts Chinese tasks',async({page})=>{
  await page.goto('/en');
  await page.getByRole('button',{name:'Search tools',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Close search'}).click();
  await page.keyboard.press('Control+k');
  const palette=page.getByRole('dialog');await expect(palette).toBeVisible();
  await palette.getByRole('textbox').fill('json 格式化');
  await page.keyboard.press('ArrowDown');await expect(palette.locator('[data-search-tool="json"]')).toBeFocused();
  await page.keyboard.press('ArrowUp');await expect(palette.getByRole('textbox')).toBeFocused();
  await page.keyboard.press('Enter');await expect(page).toHaveURL(/\/en\/tools\/json$/);
  await page.keyboard.press('Control+k');await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.goto('/en/tools?q='+encodeURIComponent('证书过期'));
  await expect(page.locator('[data-tool-id]').first()).toHaveAttribute('data-tool-id','website-check');
});

 test('discovery navigation fits light/dark mobile and desktop',async({page})=>{
  await page.goto('/zh/tools?q='+encodeURIComponent('证书过期'));
  await expect(page.locator('[data-tool-id]')).toHaveCount(1);
  const output=process.env.DISCOVERY_SCREENSHOTS;
  if(output) await page.screenshot({path:`${output}/tools-${test.info().project.name}.png`,style:'nextjs-portal{display:none}'});
  await page.getByRole('button',{name:'Theme: Light',exact:true}).click();
  await page.getByRole('button',{name:'搜索工具',exact:true}).click();
  await page.getByRole('dialog').getByRole('textbox').fill('ip归属');
  await expect(page.getByRole('dialog').locator('[data-search-tool]').first()).toHaveAttribute('data-search-tool','ip-lookup');
  await expect(page.locator('html')).toHaveClass(/dark/);
  if(output) await page.screenshot({path:`${output}/palette-dark-${test.info().project.name}.png`,style:'nextjs-portal{display:none}'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 });

test('navigation remains usable at the tablet breakpoint',async({page})=>{
 await page.setViewportSize({width:768,height:900});await page.goto('/zh/tools');
 await expect(page.getByRole('button',{name:'搜索工具',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
