import { describe, expect, it } from "vitest";

import {
  lookupIpinfoLite,
  mapIpinfoLiteRecord,
} from "@/lib/ipinfo-lite";

describe("IPinfo Lite local database", () => {
  it("maps the supported Lite fields without inventing city or privacy data", () => {
    expect(
      mapIpinfoLiteRecord("172.67.139.20", {
        asn: "AS13335",
        as_name: "Cloudflare, Inc.",
        as_domain: "cloudflare.com",
        country: "United States",
        country_code: "US",
        continent: "North America",
        continent_code: "NA",
      }),
    ).toEqual({
      ip: "172.67.139.20",
      asn: "AS13335",
      asName: "Cloudflare, Inc.",
      asDomain: "cloudflare.com",
      country: "United States",
      countryCode: "US",
      continent: "North America",
      continentCode: "NA",
    });
  });

  it("rejects invalid IP input before opening the database", async () => {
    await expect(lookupIpinfoLite("example.com")).resolves.toMatchObject({
      ok: false,
      errorCode: "invalid_ip",
    });
  });

  it("degrades cleanly when the configured database is unavailable", async () => {
    const previousPath = process.env.IPINFO_MMDB_PATH;
    process.env.IPINFO_MMDB_PATH = "/private/tmp/missing-ipinfo-lite.mmdb";
    try {
      await expect(lookupIpinfoLite("8.8.8.8")).resolves.toMatchObject({
        ok: false,
        errorCode: "database_unavailable",
      });
    } finally {
      if (previousPath === undefined) delete process.env.IPINFO_MMDB_PATH;
      else process.env.IPINFO_MMDB_PATH = previousPath;
    }
  });
});
