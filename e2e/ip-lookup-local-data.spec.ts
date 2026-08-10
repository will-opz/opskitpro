import { expect, test } from "@playwright/test";

const ipinfoResponse = {
  ip: "172.67.139.20",
  country: "United States",
  country_name: "United States",
  country_code: "US",
  region: "Unknown",
  city: "Unknown",
  latitude: "",
  longitude: "",
  lat: "",
  lon: "",
  org: "Cloudflare, Inc.",
  isp: "Cloudflare, Inc.",
  asn: "AS13335",
  as_domain: "cloudflare.com",
  continent: "North America",
  continent_code: "NA",
  timezone: "Unknown",
  network_type: "Unknown",
  proxy: false,
  proxy_known: false,
  provider: "IPinfo Lite",
  _source: "ipinfo-lite",
  data_notice:
    "Country-level geolocation and ASN data only. City, coordinates, timezone, network type, and proxy status are not provided by IPinfo Lite.",
};

test("IP lookup labels local Lite data without inventing privacy evidence", async ({
  page,
}) => {
  await page.route("**/api/ip?q=172.67.139.20", async (route) => {
    await route.fulfill({ json: ipinfoResponse });
  });

  await page.goto("/zh/tools/ip-lookup?q=172.67.139.20");

  await expect(page.getByText("IPinfo Lite 本地库").first()).toBeVisible();
  await expect(page.getByText("Cloudflare, Inc.").first()).toBeVisible();
  await expect(page.getByText("AS13335").first()).toBeVisible();
  await expect(page.getByText("查询成功")).toBeVisible();
  await expect(page.getByText("国家级定位")).toBeVisible();
  await expect(page.getByText("North America").first()).toBeVisible();
  await expect(page.getByText("cloudflare.com").first()).toBeVisible();
  await expect(
    page.getByText(/免费数据仅覆盖国家级位置和 ASN/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "IP address data powered by IPinfo" }),
  ).toHaveAttribute("href", "https://ipinfo.io");
  await expect(page.getByText("直连", { exact: true })).toHaveCount(0);
});

test("IP lookup keeps raw JSON collapsed and never widens the page", async ({
  page,
}) => {
  await page.route("**/api/ip?q=172.67.139.20", async (route) => {
    await route.fulfill({ json: ipinfoResponse });
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/zh/tools/ip-lookup?q=172.67.139.20");

    const rawToggle = page.getByRole("button", { name: "展开原始数据" });
    await expect(rawToggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByTestId("ip-lookup-raw-json")).toHaveCount(0);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    await rawToggle.click();
    await expect(page.getByTestId("ip-lookup-raw-json")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "收起原始数据" }),
    ).toHaveAttribute("aria-expanded", "true");

    const expandedOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(expandedOverflow).toBeLessThanOrEqual(1);
  }
});
