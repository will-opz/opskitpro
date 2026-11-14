import { expect, test } from "@playwright/test";

async function choose(page: import("@playwright/test").Page, name: string | RegExp) {
  const settings = page.locator('summary[aria-label^="Theme settings"], summary[aria-label^="主题设置"]');
  if (!(await settings.evaluate(el => (el.parentElement as HTMLDetailsElement).open))) await settings.click();
  await page.getByRole("radio", { name, exact: typeof name === "string" }).check();
}

test("system, explicit overrides, keyboard and refresh stay consistent", async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/zh/tools/yaml");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("opskit-theme"))).toBeNull();
  await choose(page, "亮色");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.locator('meta[name="color-scheme"]')).toHaveAttribute("content", "light");
  await expect(page.getByRole("radio", { name: "跟随系统 (暗色)", exact: true })).toBeVisible();
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.getByRole("radio", { name: "跟随系统 (亮色)", exact: true })).toBeVisible();
  await page.emulateMedia({ colorScheme: "dark" });
  expect(await page.evaluate(() => localStorage.getItem("opskit-theme"))).toBe("light");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await choose(page, /^跟随系统/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await page.evaluate(() => localStorage.getItem("opskit-theme"))).toBeNull();
  await page.screenshot({ path: testInfo.outputPath("system-theme.png") });
  await page.getByRole("radio", { name: /^跟随系统/ }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByRole("radio", { name: "亮色", exact: true })).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.locator('summary[aria-label^="主题设置"]')).toBeFocused();
  await choose(page, /^跟随系统/);
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("localStorage update/remove/clear synchronize across tabs", async ({ page, context }) => {
  await context.addInitScript(() => { /* Fresh browser context, no seeded preference. */ });
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/en/tools/yaml");
  const other = await context.newPage();
  await other.emulateMedia({ colorScheme: "dark" });
  await other.goto("/en/tools/sql");
  await choose(page, "Light");
  await expect(other.locator("html")).toHaveAttribute("data-theme", "light");
  await choose(other, /^System/);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await choose(other, "Light");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await other.evaluate(() => localStorage.clear());
  await expect(page.locator("html")).toHaveAttribute("data-theme-preference", "system");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await other.close();
});

for (const failure of ["read", "write", "remove", "all"]) {
  test(`theme remains usable with storage ${failure} failure`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.addInitScript(failure => {
      localStorage.setItem("opskit-theme", "light");
      for (const method of failure === "all" ? ["getItem", "setItem", "removeItem"] : [failure === "read" ? "getItem" : failure === "write" ? "setItem" : "removeItem"]) {
        Object.defineProperty(Storage.prototype, method, { configurable: true, value() { throw new DOMException("blocked", "SecurityError"); } });
      }
    }, failure);
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto("/en/tools/yaml");
    await expect(page.locator("html")).toHaveAttribute("data-theme", failure === "read" || failure === "all" ? "dark" : "light");
    await choose(page, "Dark");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await choose(page, "Light");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await choose(page, /^System/);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    // A client-side navigation must not reread an old stored override after a failed write/remove.
    await page.getByRole("link", { name: "OpsKitPro", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    await page.emulateMedia({ colorScheme: "light" });
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(errors).toEqual([]);
  });
}

test("early script and global 404 share system and stored overrides", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  // Block hydration scripts: the inline resolver must apply before client JS is available.
  await page.route('**/_next/static/**/*.js', route => route.abort());
  await page.goto("/en/tools/yaml");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.unrouteAll();
  await page.goto("/en/not-a-real-route-phase-c");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.evaluate(() => localStorage.setItem("opskit-theme", "dark"));
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("without JavaScript the system dark theme still has matching tokens", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, colorScheme: "dark", extraHTTPHeaders: { "x-forwarded-proto": "https" } });
  const page = await context.newPage();
  await page.goto("/en/tools/yaml");
  expect(await page.locator("html").evaluate(el => getComputedStyle(el).getPropertyValue("--bg-primary").trim())).toBe("#0a0a0a");
  await context.close();
});

test("large JSON has a bounded editor and synchronized line-number scrolling", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/tools/json");
  const input = page.locator("textarea").first();
  const text = JSON.stringify(Array.from({ length: 10000 }, (_, i) => ({ id: i })), null, 2);
  // Exercise actual paste; CDP insertText (used by fill) stalls on many newlines in Chrome.
  await page.evaluate(text => navigator.clipboard.writeText(text), text);
  await input.focus();
  await page.keyboard.press("ControlOrMeta+V");
  await expect(input).toHaveValue(text);
  expect((await input.boundingBox())!.height).toBeLessThan(700);
  expect(await page.locator("body").locator("*").count()).toBeLessThan(1000);
  await input.evaluate(el => { el.scrollTop = 800; el.dispatchEvent(new Event("scroll")); });
  const scroll = await input.evaluate(el => ({ input: el.scrollTop, gutter: el.parentElement?.querySelector('[aria-hidden="true"]')?.scrollTop }));
  if (testInfo.project.name === "desktop") expect(scroll.gutter).toBe(scroll.input);
  else await expect(input.locator("..").locator('[aria-hidden="true"]')).toBeHidden();
  await page.getByRole("button", { name: "Beautify", exact: true }).click();
  await expect(page.getByTestId("json-output")).toContainText('"id": 9999');
  await page.screenshot({ path: testInfo.outputPath("bounded-json-editor.png") });
});
