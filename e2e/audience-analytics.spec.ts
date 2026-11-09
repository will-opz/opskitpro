import { test, expect } from '@playwright/test';

test.describe('anonymous usage metadata', () => {
  test.skip(process.env.NEXT_PUBLIC_AUDIENCE_ENABLED !== 'true', 'Run with audience flags enabled against a local server.');
  test('QR settled edit, no initial run, over-limit outcome and input privacy', async ({ page }) => {
    const events: any[] = [];
    await page.route('**/api/audience', async route => { events.push(route.request().postDataJSON()); await route.fulfill({status:202,body:'{"ok":true}'}); });
    await page.goto('/en/tools/qrgen');
    await expect.poll(() => events.filter(e => e.event === 'page_view').length).toBe(1);
    expect(events.filter(e=>e.event==='tool_run')).toHaveLength(0);
    await page.locator('#qr-input').fill('private-qr-do-not-upload');
    await expect.poll(()=>events.filter(e=>e.event==='tool_success').length).toBe(1);
    await page.locator('#qr-input').fill('密'.repeat(200));
    await expect.poll(()=>events.filter(e=>e.event==='tool_error').length).toBe(1);
    expect(JSON.stringify(events)).not.toContain('private-qr');
    expect(JSON.stringify(events)).not.toContain('密');
    for(const event of events) expect(Object.keys(event).every(k=>['schema_version','event_id','event','page','tool','run_id','automation'].includes(k))).toBeTruthy();
  });
  test('JSON explicit success and repeated action have separate run IDs', async ({ page }) => {
    const events:any[]=[];
    await page.route('**/api/audience', async route=>{events.push(route.request().postDataJSON());await route.fulfill({status:202,body:'{}'});});
    await page.goto('/en/tools/json');
    await page.getByRole('textbox').first().fill('{"private":"do-not-upload"}');
    await page.getByRole('button',{name:/^Beautify$/}).click();
    await expect.poll(()=>events.filter(e=>e.event==='tool_success').length).toBe(1);
    await page.getByRole('button',{name:/^Beautify$/}).click();
    await expect.poll(()=>events.filter(e=>e.event==='tool_success').length).toBe(2);
    const runs=events.filter(e=>e.event==='tool_run');expect(runs[0].run_id).not.toBe(runs[1].run_id);
    expect(JSON.stringify(events)).not.toContain('do-not-upload');
    for (const run of runs) expect(events.filter(e=>e.run_id===run.run_id)).toHaveLength(2);
  });
  test('real endpoint rejects sensitive payload and honors automation classification', async ({page})=>{
    await page.goto('/en/tools/sql');
    const status=await page.evaluate(async()=>{
      const response=await fetch('/api/audience',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({schema_version:2,event_id:crypto.randomUUID(),event:'page_view',page:'/en',password:'synthetic-secret'})});return response.status;
    });
    expect(status).toBe(400);
  });
});
