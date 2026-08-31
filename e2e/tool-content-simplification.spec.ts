import { expect, test } from "@playwright/test";

test("local tool pages lead with the workbench and link to detailed documentation", async ({
  page,
}) => {
  await page.goto("/en/tools/jwt");

  await expect(page.getByRole("heading", { name: "JWT Decoder & Verifier" })).toBeVisible();
  await expect(page.getByText("Local processing · Token and secret never leave this browser")).toBeVisible();
  await expect(page.getByText("Local security tool")).toHaveCount(0);
  await expect(page.getByLabel("JWT token")).toBeVisible();
  await expect(page.getByRole("link", { name: /View data handling and limitations/ })).toHaveAttribute(
    "href",
    "/en/tools/docs#jwt",
  );
});

test("the centralized guide keeps full bilingual tool details", async ({ page }) => {
  await page.goto("/zh/tools/docs#jwt");

  await expect(page.getByRole("heading", { name: "工具数据处理与使用限制" })).toBeVisible();
  const jwt = page.locator("article#jwt");
  await expect(jwt.getByRole("heading", { name: "JWT 解码与校验" })).toBeVisible();
  await expect(jwt.getByText("处理位置")).toBeVisible();
  await expect(jwt.getByText("隐私", { exact: true })).toBeVisible();
  await expect(jwt.getByText("限制", { exact: true })).toBeVisible();
  await expect(jwt.getByRole("link", { name: /打开工具/ })).toHaveAttribute("href", "/zh/tools/jwt");
});

test("direct-target tools do not claim that destination traffic stays local", async ({ page }) => {
  await page.goto("/zh/tools/websocket");

  await expect(page.getByRole("heading", { name: "WebSocket 调试" })).toBeVisible();
  await expect(page.getByText("浏览器直连目标服务")).toBeVisible();
  await expect(page.getByText("本地处理 · 不上传")).toHaveCount(0);
});
