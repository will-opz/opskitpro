import { expect, test } from "@playwright/test";

const compositionEvents = [
  { key: "Enter", code: "Enter", isComposing: true, keyCode: 13 },
  { key: "Enter", code: "Enter", isComposing: false, keyCode: 229 },
];

test("connections are keyboard selectable and rename safely with IME", async ({ page }, testInfo) => {
  await page.goto("/zh/tools/websocket");
  await page.getByRole("button", { name: "高级功能" }).click();
  const connections = page.getByRole("group", { name: "连接选择", exact: true });
  const first = connections.getByRole("button", { name: "连接 1", exact: true });
  await first.focus();
  await page.keyboard.press("Tab");
  await expect(connections.getByRole("button", { name: "重命名连接: 连接 1", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  const rename = page.getByRole("textbox", { name: "重命名连接: 连接 1", exact: true });
  await expect(rename).toBeFocused();
  await rename.fill("合成连接");
  for (const event of compositionEvents) {
    await rename.dispatchEvent("keydown", event);
    await expect(rename).toBeVisible();
    await expect(first).toBeVisible();
  }
  await rename.press("Enter");
  const renamed = connections.getByRole("button", { name: "合成连接", exact: true });
  await expect(renamed).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  const edit = page.getByRole("textbox", { name: "重命名连接: 合成连接" });
  await edit.fill("discard");
  await edit.press("Escape");
  await expect(renamed).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(connections.getByRole("button", { name: "添加连接" })).toBeFocused();
  await page.keyboard.press("Enter");
  const second = connections.getByRole("button", { name: "连接 2", exact: true });
  await expect(second).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Shift+Tab"); // Close connection 2
  await page.keyboard.press("Shift+Tab"); // Rename connection 2
  await page.keyboard.press("Shift+Tab"); // Select connection 2
  await expect(second).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(renamed).toBeFocused();
  await page.keyboard.press("Space");
  await expect(renamed).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("group", { name: "连接工作区：合成连接", exact: true })).toHaveAttribute("id", await renamed.getAttribute("aria-controls") as string);
  await page.screenshot({ path: testInfo.outputPath("keyboard-connections.png") });
  await connections.getByRole("button", { name: "关闭连接: 合成连接" }).focus();
  await page.keyboard.press("Enter");
  await expect(second).toBeFocused();
  await expect(second).toHaveAttribute("aria-pressed", "true");
});

test("endpoint, template and search Enter ignore IME confirmation", async ({ page }) => {
  let sockets = 0;
  await page.routeWebSocket("wss://example.com/test", socket => { sockets++; socket.onMessage(data => socket.send(data)); });
  await page.goto("/en/tools/websocket");
  const endpoint = page.getByLabel("Target endpoint", { exact: true });
  await endpoint.fill("wss://example.com/test");
  for (const event of compositionEvents) await endpoint.dispatchEvent("keydown", event);
  expect(sockets).toBe(0);
  await expect(page.getByRole("button", { name: "Connect", exact: true })).toBeVisible();
  await endpoint.press("Enter");
  await expect.poll(() => sockets).toBe(1);
  await expect(page.getByRole("button", { name: "Disconnect", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Save as template" }).click();
  const name = page.getByLabel("Template name", { exact: true });
  await name.fill("合成模板");
  for (const event of compositionEvents) {
    await name.dispatchEvent("keydown", event);
    await expect(name).toBeVisible();
  }
  await name.press("Enter");
  await expect(name).not.toBeVisible();
  await page.getByRole("button", { name: "Templates", exact: true }).click();
  await expect(page.getByText("合成模板", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Search tools", exact: true }).click();
  const search = page.getByLabel("Tool or task");
  await search.fill("YAML");
  for (const event of compositionEvents) {
    await search.dispatchEvent("keydown", event);
    await expect(search).toBeVisible();
    await expect(page).toHaveURL(/\/en\/tools\/websocket$/);
  }
  await search.press("Enter");
  await expect(page).toHaveURL(/\/en\/tools\/yaml$/);
});

test("errors remain readable, labeled and recover after correction", async ({ page }, testInfo) => {
  await page.goto("/en/tools/yaml");
  const yaml = page.getByLabel("YAML input");
  await yaml.fill("x".repeat(50_001));
  await page.getByRole("button", { name: "Validate only" }).click();
  await expect(yaml).toHaveAttribute("aria-invalid", "true");
  await expect(yaml).toHaveAccessibleDescription("Input is too long. Reduce it to 50,000 characters or fewer.");
  await expect(yaml).toBeFocused();
  await yaml.fill("a: 1");
  await expect(yaml).toHaveAttribute("aria-invalid", "false");
  await page.goto("/zh/tools/sql");
  const sql = page.getByLabel("SQL 输入", { exact: true });
  await sql.fill("select (");
  await page.getByRole("button", { name: "开始格式化" }).click();
  await page.waitForTimeout(2600); // Regression: the previous error expired at 2200 ms.
  await expect(sql).toHaveAccessibleDescription("括号不匹配。");
  await expect(sql).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath("persistent-sql-error.png"), fullPage: true });
  await sql.fill("select 1;");
  await expect(sql).toHaveAttribute("aria-invalid", "false");
  await page.getByRole("button", { name: "开始格式化" }).click();
  await expect(page.getByRole("status")).toHaveText("格式化完成。");
  await expect(page.getByRole("button", { name: "复制格式化 SQL" })).toBeEnabled();
});
