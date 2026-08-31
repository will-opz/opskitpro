import { expect, test } from "@playwright/test";

test("homepage and public catalog expose the current privacy-first tool groups", async ({
  page,
}) => {
  await page.goto("/en");

  const localTools = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Local security tools" }),
  });
  await expect(localTools.getByRole("link", { name: /Password Generator/ })).toBeVisible();
  await expect(localTools.getByRole("link", { name: /Hash/ })).toBeVisible();

  const diagnostics = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Website & network diagnostics" }),
  });
  await expect(diagnostics.getByRole("link", { name: /Website Check/ })).toBeVisible();

  await page.goto("/en/tools");
  await expect(page.getByRole("heading", { name: "Tools", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: /Data handling guide/ })).toHaveAttribute("href", "/en/tools/docs");
  await expect(page.getByRole("heading", { name: "Security & privacy tooling" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Ops & network diagnostics" })).toBeVisible();
  await expect(page.locator('main a[href="/en/tools/passgen"]')).toBeVisible();
  await expect(page.getByRole("link", { name: /QR Generator/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Encode \/ Decode/i })).toBeVisible();
});

test("personal navigation is separate from the public catalog", async ({
  page,
}) => {
  await page.goto("/en/nav");
  await expect(page.getByRole("heading", { name: "My Navigation" })).toBeVisible();

  await page.goto("/zh/tools");
  await expect(page.getByRole("heading", { name: "常用工具" })).toBeVisible();
  await expect(page.locator("html")).not.toHaveCSS("overflow-x", "scroll");
});

test("localized pages keep metadata aligned and expose the homepage trust story", async ({
  page,
}) => {
  await page.goto("/zh/tools");

  await expect(page).toHaveTitle("安全与本地工具 | OpsKitPro");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "密码、编码和数据尽可能在浏览器本地处理；联网诊断明确说明发送内容和观测点。",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    "密码、编码和数据尽可能在浏览器本地处理；联网诊断明确说明发送内容和观测点。",
  );
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
    "content",
    "密码、编码和数据尽可能在浏览器本地处理；联网诊断明确说明发送内容和观测点。",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://opskitpro.com/zh/tools",
  );
  for (const [hreflang, href] of [
    ["en-US", "https://opskitpro.com/en/tools"],
    ["zh-CN", "https://opskitpro.com/zh/tools"],
    ["x-default", "https://opskitpro.com/en/tools"],
  ]) {
    await expect(
      page.locator(`link[rel="alternate"][hreflang="${hreflang}"]`),
    ).toHaveAttribute("href", href);
  }

  await page.goto("/zh");
  await expect(
    page.getByText("敏感输入只在当前浏览器处理，不会上传到 OpsKitPro。"),
  ).toBeVisible();
  await expect(page.getByText(/网站目标会发送给 OpsKitPro 探针/)).toBeVisible();
  await expect(page.getByRole("link", { name: "查看隐私说明" })).toHaveAttribute(
    "href",
    "/zh/privacy",
  );
});

test("funnel endpoint accepts only approved core tool dimensions", async ({
  request,
}) => {
  const accepted = await request.post("/api/event", {
    data: {
      event: "core_tool_open",
      tool: "website-check",
      placement: "home",
      page: "/en/?domain=not-logged.example",
    },
  });
  expect(accepted.status()).toBe(200);

  const rejected = await request.post("/api/event", {
    data: {
      event: "core_tool_open",
      tool: "ip-lookup",
      placement: "home",
    },
  });
  expect(rejected.status()).toBe(400);
});
