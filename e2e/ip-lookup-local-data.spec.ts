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
  await expect(page.getByText("未知").first()).toBeVisible();
  await expect(
    page.getByText(/免费数据仅覆盖国家级位置和 ASN/),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "IP address data powered by IPinfo" }),
  ).toHaveAttribute("href", "https://ipinfo.io");
  await expect(page.getByText("直连", { exact: true })).toHaveCount(0);
});
