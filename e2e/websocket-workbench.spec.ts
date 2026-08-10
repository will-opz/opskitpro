import { expect, test } from "@playwright/test";

test("Chinese WebSocket workbench has a clear three-step flow", async ({
  page,
}) => {
  await page.goto("/zh/tools/websocket");

  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeLessThan(20);

  await expect(page.getByText("01", { exact: true })).toBeVisible();
  await expect(page.getByText("02", { exact: true })).toBeVisible();
  await expect(page.getByText("03", { exact: true })).toBeVisible();
  await expect(page.getByText("连接端点", { exact: true })).toBeVisible();
  await expect(page.getByText("编写并发送消息", { exact: true })).toBeVisible();
  await expect(page.getByText("查看流量日志", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "连接", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "模板", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "格式化", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "搜索日志" })).toBeVisible();
  await expect(page.getByText("连接后，收发消息会显示在这里")).toBeVisible();
  await expect(page.getByRole("link", { name: "隐私政策" })).toHaveAttribute(
    "href",
    "/zh/privacy",
  );

  await page.getByRole("button", { name: "高级功能" }).click();
  await expect(page.getByText("连接 1", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "保存", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "载入", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "导出", exact: true })).toBeVisible();
  await expect(page.getByText("连接统计", { exact: true })).toBeVisible();

  const layout = await page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const selectors = [
      'button',
      'input',
      'textarea',
    ];
    const visibleControls = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll<HTMLElement>(selector)).filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      }),
    );
    return {
      viewportWidth,
      scrollWidth: document.documentElement.scrollWidth,
      controlsInsideViewport: visibleControls.every((element) => {
        const rect = element.getBoundingClientRect();
        return rect.left >= -1 && rect.right <= viewportWidth + 1;
      }),
    };
  });

  expect(layout.scrollWidth).toBe(layout.viewportWidth);
  expect(layout.controlsInsideViewport).toBe(true);
});

test("English WebSocket workbench keeps English action labels", async ({
  page,
}) => {
  await page.goto("/en/tools/websocket");

  await expect(page.getByText("Connect endpoint", { exact: true })).toBeVisible();
  await expect(page.getByText("Compose and send", { exact: true })).toBeVisible();
  await expect(page.getByText("Inspect traffic logs", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Search logs" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy" })).toHaveAttribute(
    "href",
    "/en/privacy",
  );
});
