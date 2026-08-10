import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../route";

const { lookupIpinfoLiteMock } = vi.hoisted(() => ({
  lookupIpinfoLiteMock: vi.fn(),
}));

vi.mock("@/lib/ipinfo-lite", () => ({
  lookupIpinfoLite: lookupIpinfoLiteMock,
}));

function makeRequest(
  headers: Record<string, string> = {},
  cf?: Record<string, any>,
): NextRequest {
  const req = new NextRequest("http://localhost/api/ip", { headers });
  // Attach Cloudflare-specific `cf` object to simulate edge runtime data
  (req as any).cf = cf || {};
  return req;
}

describe("GET /api/ip — IP detection", () => {
  beforeEach(() => {
    lookupIpinfoLiteMock.mockImplementation(async (ip: string) => ({
      ok: true,
      data: {
        ip,
        country: "United States",
        countryCode: "US",
        continent: "North America",
        continentCode: "NA",
        asn: "AS13335",
        asName: "Cloudflare, Inc.",
        asDomain: "cloudflare.com",
      },
    }));
  });

  it("uses cf-connecting-ip header as primary IP source", async () => {
    const req = makeRequest({ "cf-connecting-ip": "1.2.3.4" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ip).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip when cf-connecting-ip is absent", async () => {
    const req = makeRequest({ "x-real-ip": "5.6.7.8" });
    const res = await GET(req);
    const body = await res.json();
    expect(body.ip).toBe("5.6.7.8");
  });

  it("falls back to 127.0.0.1 when no IP headers are present", async () => {
    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();
    expect(body.ip).toBe("127.0.0.1");
  });

  it("prefers cf-connecting-ip over x-real-ip", async () => {
    const req = makeRequest({
      "cf-connecting-ip": "11.22.33.44",
      "x-real-ip": "99.88.77.66",
    });
    const res = await GET(req);
    const body = await res.json();
    expect(body.ip).toBe("11.22.33.44");
  });

  it("returns a graceful fallback contract when the local database is unavailable", async () => {
    lookupIpinfoLiteMock.mockResolvedValueOnce({
      ok: false,
      errorCode: "database_unavailable",
      error: "The local IPinfo Lite database is unavailable.",
    });

    const res = await GET(
      new NextRequest("http://localhost/api/ip?q=172.67.176.41"),
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      ip: "172.67.176.41",
      country_name: "Unknown",
      region: "Unknown",
      city: "Unknown",
      provider: "IPinfo Lite",
      _source: "ipinfo-lite",
      proxy_known: false,
    });
  });

  it("returns country and ASN from IPinfo Lite without inventing unsupported fields", async () => {
    const res = await GET(
      new NextRequest("http://localhost/api/ip?q=172.67.139.20"),
    );
    const body = await res.json();

    expect(body).toMatchObject({
      country_name: "United States",
      country_code: "US",
      asn: "AS13335",
      isp: "Cloudflare, Inc.",
      as_domain: "cloudflare.com",
      city: "Unknown",
      timezone: "Unknown",
      network_type: "Unknown",
      proxy: false,
      proxy_known: false,
      provider: "IPinfo Lite",
      _source: "ipinfo-lite",
    });
    expect(body.latitude).toBe("");
    expect(body.longitude).toBe("");
  });
});

describe("GET /api/ip — Cloudflare geo data", () => {
  beforeEach(() => {
    lookupIpinfoLiteMock.mockImplementation(async (ip: string) => ({
      ok: true,
      data: {
        ip,
        country: "United States",
        countryCode: "US",
        continent: "North America",
        continentCode: "NA",
        asn: "AS13335",
        asName: "Cloudflare, Inc.",
        asDomain: "cloudflare.com",
      },
    }));
  });
  it("returns geo data from the cf object", async () => {
    const req = makeRequest(
      { "cf-connecting-ip": "1.2.3.4" },
      {
        country: "JP",
        city: "Tokyo",
        latitude: "35.6895",
        longitude: "139.6917",
        region: "Tokyo",
        asn: 2516,
        asOrganization: "KDDI",
      },
    );
    const res = await GET(req);
    const body = await res.json();
    expect(body.country).toBe("JP");
    expect(body.city).toBe("Tokyo");
    expect(body.lat).toBe("35.6895");
    expect(body.lon).toBe("139.6917");
    expect(body.region).toBe("Tokyo");
    expect(body.asn).toBe(2516);
    expect(body.isp).toBe("KDDI");
  });

  it("uses local country and ASN data when cf metadata is empty", async () => {
    const req = makeRequest({ "cf-connecting-ip": "1.2.3.4" }, {});
    const res = await GET(req);
    const body = await res.json();
    expect(body.country).toBe("United States");
    expect(body.city).toBe("Unknown");
    expect(body.region).toBe("Unknown");
    expect(body.isp).toBe("Cloudflare, Inc.");
  });

  it("reports IPinfo Lite when Cloudflare metadata is unavailable", async () => {
    const req = makeRequest();
    const res = await GET(req);
    const body = await res.json();
    expect(body.provider).toBe("IPinfo Lite");
  });

  it("reports Cloudflare Edge provider when cf metadata is available", async () => {
    const req = makeRequest(
      { "cf-connecting-ip": "1.2.3.4" },
      { country: "JP" },
    );
    const res = await GET(req);
    const body = await res.json();
    expect(body.provider).toBe("Cloudflare Edge");
  });

  it("does not invent coordinates when cf metadata is missing", async () => {
    const req = makeRequest({ "cf-connecting-ip": "1.2.3.4" }, {});
    const res = await GET(req);
    const body = await res.json();
    expect(body.lat).toBe("");
    expect(body.lon).toBe("");
  });
});

describe("GET /api/ip — response shape", () => {
  it("response contains all expected fields", async () => {
    const req = makeRequest({ "cf-connecting-ip": "8.8.8.8" });
    const res = await GET(req);
    const body = await res.json();
    const requiredFields = [
      "ip",
      "country",
      "city",
      "lat",
      "lon",
      "region",
      "asn",
      "isp",
      "provider",
    ];
    requiredFields.forEach((field) => {
      expect(body).toHaveProperty(field);
    });
  });
});
