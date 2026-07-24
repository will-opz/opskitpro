import { expect, test } from "@playwright/test";

test("homepage and public catalog keep the approved core order", async ({
  page,
}) => {
  await page.goto("/en");

  const featured = page.locator("main h3").filter({
    hasText: /Website Check|Network Doctor|DNS Security/,
  });
  await expect(featured).toHaveText([
    "Website Check",
    "Network Doctor",
    "DNS Security",
  ]);

  await page.goto("/en/tools");
  await expect(page.locator("main h2").filter({ hasText: "Website Check" })).toBeVisible();
  await expect(page.locator("main h2").filter({ hasText: "Network Doctor" })).toBeVisible();
  await expect(page.locator("main h2").filter({ hasText: "DNS Security" })).toBeVisible();
  await expect(page.getByText("OpsKitPro Probe (AWS Lightsail)").first()).toBeVisible();
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
