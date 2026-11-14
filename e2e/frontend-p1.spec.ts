import { expect, test } from "@playwright/test";

test("YAML and SQL only copy results for the current input/options", async ({ page, context }, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/en/tools/yaml");
  const yaml = page.getByLabel("YAML input");
  const format = page.getByRole("button", { name: "Format YAML", exact: true });
  const copy = page.getByRole("button", { name: "Copy result", exact: true });
  await yaml.fill("service:\n  name: before");
  await format.click();
  await yaml.fill("service:\n  name: after");
  await expect(copy).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Run again");
  await page.screenshot({ path: testInfo.outputPath("yaml-stale.png"), fullPage: true });
  await format.click();
  await page.getByRole("button", { name: "4", exact: true }).click();
  await expect(copy).toBeDisabled();
  await format.click();
  await copy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe("service:\n    name: after");
  await page.getByRole("button", { name: "Load sample" }).click();
  await expect(copy).toBeDisabled();
  await format.click();
  await expect(copy).toBeEnabled();

  await page.goto("/zh/tools/sql");
  const sql = page.getByLabel("SQL 输入", { exact: true });
  const sqlFormat = page.getByRole("button", { name: "开始格式化" });
  const sqlCopy = page.getByRole("button", { name: "复制格式化 SQL" });
  await sql.fill("select before from sample;");
  await sqlFormat.click();
  await sql.fill("select after from sample;");
  await expect(sqlCopy).toBeDisabled();
  await expect(page.getByTestId("sql-output")).toContainText("before");
  await expect(page.getByRole("status")).toContainText("输入已变化");
  await sqlFormat.click();
  await sqlCopy.click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain("after");
});

test("session dialogs use the top layer, contain focus, dismiss safely and preserve drafts", async ({ page }, testInfo) => {
  await page.routeWebSocket("wss://example.com/test", socket => {
    socket.onMessage(message => socket.send(message));
  });
  await page.addInitScript(() => {
    localStorage.setItem("opskit-theme", "dark");
    localStorage.setItem("opskitpro_ws_sessions", JSON.stringify(Array.from({ length: 10 }, (_, i) => ({
      id: `test-${i}`, name: `Synthetic session ${i}`, url: "wss://example.com/test",
      logs: [{ id: "test-log", time: "12:00:00", timestamp: 1, type: "received", message: "synthetic", size: 9, messageType: "text" }],
      createdAt: 1, messageCount: 1,
    }))));
  });
  await page.goto("/zh/tools/websocket");
  await page.getByRole("button", { name: "高级功能" }).click();
  const load = page.getByRole("button", { name: /^载入/ });
  await load.click();
  const list = page.getByRole("dialog", { name: "已保存会话" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("button", { name: "关闭", exact: true })).toBeFocused();
  expect(await list.evaluate(el => el.matches(":modal"))).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("sessions-modal.png") });
  const bounds = await list.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
  // The native top layer must not inherit the blurred toolbar's containing block.
  expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(2);
  for (let i = 0; i < 35; i++) {
    await page.keyboard.press("Tab");
    const focus = await list.evaluate(el => ({ inside: el.contains(document.activeElement), tag: document.activeElement?.tagName, text: document.activeElement?.getAttribute("aria-label") }));
    // A native modal may cycle through browser chrome (activeElement = body),
    // but must never focus an interactive control in the underlying page.
    expect(focus.inside || focus.tag === "BODY", JSON.stringify(focus)).toBe(true);
  }
  await page.keyboard.press("Shift+Tab");
  expect(await list.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(list).not.toBeVisible();
  await expect(load).toBeFocused();
  await load.click();
  await list.getByRole("button", { name: /Synthetic session 0/ }).click();
  await expect(list).not.toBeVisible();
  // The existing load callback is a placeholder; create logs using an intercepted
  // local test socket rather than changing that unrelated application behavior.
  await page.getByPlaceholder("wss://your-websocket-server.com").fill("wss://example.com/test");
  await page.getByRole("button", { name: "连接", exact: true }).click();
  const save = page.getByRole("button", { name: "保存", exact: true });
  await save.click();
  const dialog = page.getByRole("dialog", { name: "保存会话", exact: true });
  const name = dialog.getByLabel("会话名称");
  await expect(name).toBeFocused();
  await name.fill("Draft to preserve");
  const nameBounds = await name.boundingBox();
  await page.mouse.move(nameBounds!.x + 8, nameBounds!.y + 8);
  await page.mouse.down();
  await page.mouse.move(4, 4);
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(save).toBeFocused();
  await save.click();
  await expect(name).toHaveValue("Draft to preserve");
  await dialog.getByRole("button", { name: "取消" }).click();
  await expect(save).toBeFocused();
  await save.click();
  await dialog.getByRole("button", { name: "保存", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await load.click();
  await expect(list.getByRole("button", { name: /Draft to preserve/ })).toBeVisible();
  await page.mouse.click(4, 4);
  await expect(list).not.toBeVisible();
  await expect(load).toBeFocused();
});
