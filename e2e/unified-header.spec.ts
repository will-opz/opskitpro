import {test,expect} from '@playwright/test';

test('home and interior pages share navigation, actions and correct active link',async({page},testInfo)=>{
 const mobile=testInfo.project.name==='mobile-chrome';
 for(const [path,active] of [['/zh',null],['/zh/tools/website-check','诊断'],['/zh/tools','工具'],['/zh/tools/docs','文档']] as const){
  await page.goto(path);
  const header=page.locator('header').first();
  await expect(header.getByRole('button',{name:'搜索工具',exact:true})).toBeVisible();
  if(mobile) await header.getByLabel('导航菜单',{exact:true}).click();
  const nav=header.getByRole('navigation',{name:mobile?'移动导航':'主导航',exact:true});
  await expect(nav.getByRole('link')).toHaveText(['诊断','工具','文档','API / MCP']);
  if(active) await expect(nav.getByRole('link',{name:active,exact:true})).toHaveAttribute('aria-current','page');
  else await expect(nav.locator('[aria-current]')).toHaveCount(0);
  await expect(nav.getByRole('link',{name:'API / MCP',exact:true})).toHaveAttribute('href',path==='/zh'?'#automate':'/zh#automate');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(mobile){await page.keyboard.press('Escape');await expect(header.getByLabel('导航菜单',{exact:true})).toBeFocused();}
  if(process.env.HEADER_SCREENSHOTS && (path==='/zh' || path==='/zh/tools/website-check')) await header.screenshot({path:`${process.env.HEADER_SCREENSHOTS}/header-${path==='/zh'?'home':'website'}-${testInfo.project.name}.png`});
 }
 const output=process.env.HEADER_SCREENSHOTS;
 if(output)await page.screenshot({path:`${output}/header-${testInfo.project.name}.png`,style:'nextjs-portal{display:none}'});
 const header=page.locator('header').first();
 if(mobile)await header.getByLabel('导航菜单',{exact:true}).click();
 await header.getByRole('navigation',{name:mobile?'移动导航':'主导航',exact:true}).getByRole('link',{name:'API / MCP'}).click();
 await expect(page).toHaveURL(/\/zh#automate$/);await expect(page.locator('#automate')).toBeInViewport();
});
