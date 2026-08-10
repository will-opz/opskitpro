import { expect, test } from "@playwright/test";

test("homepage exposes popular tools and the public catalog keeps the approved core order", async ({
  page,
}) => {
  await page.goto("/en");

  const popularTools = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Popular tools" }),
  });
  await expect(popularTools.getByRole("link", { name: /Password Generator/ })).toBeVisible();
  await expect(popularTools.getByRole("link", { name: /QR Generator/ })).toBeVisible();
  await expect(popularTools.getByRole("link", { name: /Website Check/ })).toBeVisible();

  await page.goto("/en/tools");
  await expect(page.locator("main h2").filter({ hasText: "Website Check" })).toBeVisible();
  await expect(page.locator("main h2").filter({ hasText: "Network Doctor" })).toBeVisible();
  await expect(page.locator("main h2").filter({ hasText: "DNS Security" })).toBeVisible();
  await expect(page.getByText("OpsKitPro Probe (AWS Lightsail)").first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Everyday utilities" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Password Generator.*Featured/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /QR Generator/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Encode \/ Decode/i })).toBeVisible();
});

test("personal navigation is separate from the public catalog", async ({
  page,
}) => {
  await page.goto("/en/nav");
  await expect(page.getByRole("heading", { name: "My Navigation" })).toBeVisible();

  await page.goto("/zh/tools");
  await expect(page.getByRole("heading", { name: "先从三个核心诊断开始" })).toBeVisible();
  await expect(page.locator("html")).not.toHaveCSS("overflow-x", "scroll");
});

test("localized pages keep metadata aligned and expose the homepage trust story", async ({
  page,
}) => {
  await page.goto("/zh/tools");

  await expect(page).toHaveTitle("SRE 诊断工具 | OpsKitPro");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "从网站、网络和 DNS 三个核心工作流开始，再按需使用专项诊断与开发工具。",
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    "content",
    "从网站、网络和 DNS 三个核心工作流开始，再按需使用专项诊断与开发工具。",
  );
  await expect(page.locator('meta[name="twitter:description"]')).toHaveAttribute(
    "content",
    "从网站、网络和 DNS 三个核心工作流开始，再按需使用专项诊断与开发工具。",
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
    page.getByText(/分别呈现浏览器、Cloudflare 边缘与 OpsKitPro 服务端探针的证据/),
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
