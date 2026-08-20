import { expect, test } from "@playwright/test";

test("Text Diff compares locally with a real worker and keeps mobile layout bounded", async ({ page }) => {
  const requestsWithBodies: Array<{ url: string; body: string | null }> = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") requestsWithBodies.push({ url: request.url(), body: request.postData() });
  });

  await page.goto("/en/tools/diff");
  await expect(page).toHaveTitle("Text Diff | OpsKitPro");
  await expect(page.getByText("Local processing · Both texts and the result stay in this browser")).toBeVisible();

  await page.getByLabel("Original text").fill("token=private-old-value\nport=3000\nregion=nrt");
  await page.getByLabel("New text").fill("token=private-new-value\nport=8080\nregion=nrt\nhealth=/health");
  await page.getByRole("button", { name: "Compare texts" }).click();

  await expect(page.getByText("Added 3 · Deleted 2")).toBeVisible();
  await expect(page.locator("code", { hasText: "health=/health" }).first()).toBeVisible();
  await page.getByRole("tab", { name: "Side by side" }).click();
  await expect(page.getByRole("tab", { name: "Side by side" })).toHaveAttribute("aria-selected", "true");

  expect(requestsWithBodies.some(({ body }) => body?.includes("private-old-value") || body?.includes("private-new-value"))).toBe(false);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("Chinese Text Diff supports ignored differences and catalog discovery", async ({ page, request }) => {
  await page.goto("/zh/tools/diff");
  await page.getByLabel("原文本").fill("Hello   ");
  await page.getByLabel("新文本").fill("hello");
  await page.getByLabel("忽略字母大小写").check();
  await page.getByLabel("忽略行尾空格与 Tab").check();
  await page.getByRole("button", { name: "开始对比" }).click();
  await expect(page.getByText("按当前选项未发现行级差异。")).toBeVisible();

  await page.goto("/zh/tools");
  await page.getByRole("searchbox").fill("文本对比");
  await expect(page.getByRole("link", { name: /文本对比/ })).toBeVisible();

  const manifest = await request.get("/api/tools");
  expect(manifest.status()).toBe(200);
  const body = await manifest.json();
  expect(body.version).toBe("2.0.0");
  expect(body.tools.some((tool: { id: string }) => tool.id === "diff")).toBe(true);

  const sitemap = await request.get("/sitemap.xml");
  expect(await sitemap.text()).toContain("/zh/tools/diff");
});
