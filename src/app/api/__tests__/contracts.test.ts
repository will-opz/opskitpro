import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({
    success: true,
    limit: 100,
    remaining: 99,
    resetAt: Date.now() + 60000,
    retryAfterSeconds: 0,
    ipHash: "12345678"
  })),
  createRateLimitHeaders: vi.fn(() => ({
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": "99",
    "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 60)
  })),
  rateLimitResponse: vi.fn()
}));
import { NextRequest } from "next/server";
import {
  GET as diagnosticGET,
  POST as diagnosticPOST,
} from "../diagnostic/route";
import { GET as ipGET } from "../ip/route";
import { GET as dnsGET, POST as dnsPOST } from "../dns/route";

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

function makeFetchStub() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;

    if (
      url.includes("cloudflare-dns.com/dns-query?name=example.com&type=AAAA")
    ) {
      return jsonResponse({
        Status: 0,
        Answer: [
          {
            name: "example.com",
            type: 28,
            TTL: 300,
            data: "2606:2800:220:1:248:1893:25c8:1946",
          },
        ],
      });
    }

    if (url.includes("cloudflare-dns.com/dns-query?name=example.com&type=A")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          { name: "example.com", type: 1, TTL: 300, data: "93.184.216.34" },
        ],
      });
    }

    if (url.includes("dns.google/resolve?name=example.com&type=AAAA")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          {
            name: "example.com",
            type: 28,
            TTL: 300,
            data: "2606:2800:220:1:248:1893:25c8:1946",
          },
        ],
      });
    }

    if (url.includes("dns.google/resolve?name=example.com&type=A")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          { name: "example.com", type: 1, TTL: 300, data: "93.184.216.34" },
        ],
      });
    }

    if (url.includes("dns.alidns.com/resolve?name=example.com&type=AAAA")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          {
            name: "example.com",
            type: 28,
            TTL: 300,
            data: "2606:2800:220:1:248:1893:25c8:1946",
          },
        ],
      });
    }

    if (url.includes("dns.alidns.com/resolve?name=example.com&type=A")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          { name: "example.com", type: 1, TTL: 300, data: "93.184.216.34" },
        ],
      });
    }

    if (url.includes("cloudflare-dns.com/dns-query?name=example.com&type=NS")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          { name: "example.com", type: 2, TTL: 300, data: "ns1.example.com" },
        ],
      });
    }

    if (url.includes("https://example.com")) {
      return new Response("<html></html>", {
        status: 200,
        headers: {
          server: "cloudflare",
          "cf-ray": "abc123",
        },
      });
    }

    if (url.includes("crt.sh/?q=example.com&output=json")) {
      return jsonResponse([]);
    }

    if (url.includes("rdap.org/domain/example.com")) {
      return jsonResponse({
        entities: [
          {
            roles: ["registrar"],
            vcardArray: ["vcard", [["fn", {}, "text", "Example Registrar"]]],
          },
        ],
        events: [
          { eventAction: "registration", eventDate: "2020-01-01T00:00:00Z" },
          { eventAction: "expiration", eventDate: "2030-01-01T00:00:00Z" },
        ],
        status: ["active"],
      });
    }

    if (url.includes("ipapi.co/93.184.216.34/json/")) {
      return jsonResponse({
        country_name: "United States",
        city: "Los Angeles",
        org: "Example ISP",
        asn: 64500,
      });
    }

    if (url.includes("dns.quad9.net/dns-query?name=example.com&type=MX")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          {
            name: "example.com",
            type: 15,
            TTL: 300,
            data: "10 mail.example.com",
          },
        ],
      });
    }

    if (url.includes("dns.quad9.net/dns-query?name=example.com&type=A")) {
      return jsonResponse({
        Status: 0,
        Answer: [
          { name: "example.com", type: 1, TTL: 300, data: "93.184.216.34" },
        ],
      });
    }

    throw new Error(`Unexpected fetch: ${url}`);
  });
}

async function createAdminCookie() {
  const input = new TextEncoder().encode("test-password:test-secret");
  const hash = await crypto.subtle.digest("SHA-256", input);
  const token = Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `opskitpro_admin=${token}`;
}

async function createCloudflareAccessAdminCookie(email: string) {
  const input = new TextEncoder().encode(
    `cloudflare-access:${email}:test-secret`,
  );
  const hash = await crypto.subtle.digest("SHA-256", input);
  const token = Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `opskitpro_admin=${token}`;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API contract integration", () => {
  it("returns the diagnostic health contract when called without a request", async () => {
    const res = await diagnosticGET(undefined as any);
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({
      status: "ready",
      service: "diagnostic",
    });
  });

  it("returns a diagnostic success contract for a real domain lookup", async () => {
    vi.stubGlobal("fetch", makeFetchStub());

    const res = await diagnosticGET(
      new Request("http://localhost/api/diagnostic?domain=example.com") as any,
    );
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      domain: "example.com",
      status: "success",
      isActuallyIp: false,
      isPrivate: false,
      http: {
        success: true,
        status_code: 200,
      },
      cdn: {
        provider: "Cloudflare",
        is_provider: true,
      },
      whois: {
        success: true,
        registrar: "Example Registrar",
      },
    });
    expect(body.dns.resolved_ip).toBe("93.184.216.34");
    expect(body.dns.ipv4).toEqual(["93.184.216.34"]);
    expect(body.dns.ipv6).toEqual(["2606:2800:220:1:248:1893:25c8:1946"]);
    expect(body.dns.dual_stack).toBe(true);
    expect(body.dns.resolvers).toHaveLength(3);
    expect(body.dns.resolvers[0]).toMatchObject({
      resolver: "Cloudflare",
      status: "OK",
      records: {
        A: ["93.184.216.34"],
        AAAA: ["2606:2800:220:1:248:1893:25c8:1946"],
      },
    });
    expect(body.meta).toMatchObject({
      cacheStatus: "BYPASS",
    });
    expect(body.meta.coreMs).toBeTypeOf("number");
    expect(body.meta.enrichmentMs).toBeTypeOf("number");
    expect(body.geo.country).toBe("United States");
  });

  it("returns the ip lookup contract from Cloudflare metadata", async () => {
    const req = new Request("http://localhost/api/ip", {
      headers: {
        "cf-connecting-ip": "1.2.3.4",
      },
    }) as Request & { cf?: Record<string, any> };

    req.cf = {
      country: "JP",
      city: "Tokyo",
      latitude: "35.6895",
      longitude: "139.6917",
      region: "Tokyo",
      asn: 2516,
      asOrganization: "KDDI",
    };

    const res = await ipGET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body).toMatchObject({
      ip: "1.2.3.4",
      country: "JP",
      city: "Tokyo",
      lat: "35.6895",
      lon: "139.6917",
      region: "Tokyo",
      asn: 2516,
      isp: "KDDI",
      provider: "Cloudflare Edge",
      _source: "cloudflare-context",
    });
  });

  it("returns the DNS lookup contract for GET and POST routes", async () => {
    vi.stubGlobal("fetch", makeFetchStub());

    const getRes = await dnsGET(
      new Request(
        "http://localhost/api/dns?domain=example.com&type=MX&provider=quad9",
      ) as any,
    );
    expect(getRes.status).toBe(200);

    const getBody = await getRes.json();
    expect(getBody).toMatchObject({
      domain: "example.com",
      type: "MX",
      provider: "Quad9",
      status: "NOERROR",
      statusCode: 0,
    });
    expect(getBody.answers[0]).toMatchObject({
      priority: 10,
      exchange: "mail.example.com",
    });

    const postRes = await dnsPOST(
      new Request("http://localhost/api/dns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: "example.com",
          types: ["A", "MX"],
          provider: "quad9",
        }),
      }) as any,
    );
    expect(postRes.status).toBe(200);

    const postBody = await postRes.json();
    expect(postBody).toMatchObject({
      domain: "example.com",
      provider: "Quad9",
    });
    expect(postBody.results).toHaveLength(2);
    expect(postBody.results[0].type).toBe("A");
    expect(postBody.results[1].answers[0]).toMatchObject({
      priority: 10,
      exchange: "mail.example.com",
    });
  });

  it("returns the diagnostic POST contract", async () => {
    const res = await diagnosticPOST(
      new Request("http://localhost/api/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "example.com" }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({
      success: true,
      data: {
        target: "example.com",
        status: "online",
      },
    });
  });

  it("bypasses KV reads and writes for nocache diagnostic requests", async () => {
    vi.stubGlobal("fetch", makeFetchStub());
    const kv = {
      get: vi.fn(),
      put: vi.fn(),
    };
    (globalThis as any).KV = kv;

    const res = await diagnosticGET(
      new Request(
        "http://localhost/api/diagnostic?domain=example.com&_nocache=1",
      ) as any,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("BYPASS");
    expect(kv.get).not.toHaveBeenCalled();
    expect(kv.put).not.toHaveBeenCalled();

    delete (globalThis as any).KV;
  });

  it("bypasses KV reads and writes by default for diagnostic requests", async () => {
    vi.stubGlobal("fetch", makeFetchStub());
    const kv = {
      get: vi.fn(),
      put: vi.fn(),
    };
    (globalThis as any).KV = kv;

    const res = await diagnosticGET(
      new Request("http://localhost/api/diagnostic?domain=example.com") as any,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("BYPASS");
    expect(kv.get).not.toHaveBeenCalled();
    expect(kv.put).not.toHaveBeenCalled();

    const body = await res.json();
    expect(body.meta.cacheStatus).toBe("BYPASS");

    delete (globalThis as any).KV;
  });

  it("rejects metadata and private diagnostic targets before probing HTTP", async () => {
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);

    const res = await diagnosticGET(
      new Request(
        "http://localhost/api/diagnostic?domain=169.254.169.254",
      ) as any,
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toContain("private or reserved");
    expect(fetchStub).not.toHaveBeenCalled();
  });

  it("rejects domains that resolve to private addresses", async () => {
    const fetchStub = vi.fn(async (input: RequestInfo | URL) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;

      if (url.includes("type=A")) {
        return jsonResponse({
          Status: 0,
          Answer: [
            { name: "internal.example", type: 1, TTL: 300, data: "10.0.0.5" },
          ],
        });
      }
      if (url.includes("type=AAAA")) {
        return jsonResponse({ Status: 0, Answer: [] });
      }
      return jsonResponse({ Status: 0, Answer: [] });
    });
    vi.stubGlobal("fetch", fetchStub);

    const res = await diagnosticGET(
      new Request(
        "http://localhost/api/diagnostic?domain=internal.example",
      ) as any,
    );
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.message).toContain("private or reserved");
    expect(fetchStub).not.toHaveBeenCalledWith(
      expect.stringContaining("https://internal.example"),
      expect.anything(),
    );
  });

  it("ignores explicit KV cache requests from unauthenticated diagnostic requests", async () => {
    vi.stubGlobal("fetch", makeFetchStub());
    const kv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    (globalThis as any).KV = kv;

    const res = await diagnosticGET(
      new NextRequest(
        "http://localhost/api/diagnostic?domain=example.com&cache=kv",
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("BYPASS");
    expect(kv.get).not.toHaveBeenCalled();
    expect(kv.put).not.toHaveBeenCalled();

    const body = await res.json();
    expect(body.meta.cacheStatus).toBe("BYPASS");

    delete (globalThis as any).KV;
  });

  it("uses KV only for authenticated explicit diagnostic cache requests", async () => {
    vi.stubGlobal("fetch", makeFetchStub());
    const kv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    (globalThis as any).KV = kv;
    process.env.OPSKITPRO_ADMIN_PASSWORD = "test-password";
    process.env.OPSKITPRO_ADMIN_SECRET = "test-secret";

    const res = await diagnosticGET(
      new NextRequest(
        "http://localhost/api/diagnostic?domain=example.com&cache=kv",
        {
          headers: {
            cookie: await createAdminCookie(),
          },
        },
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(kv.get).toHaveBeenCalled();
    expect(kv.put).toHaveBeenCalled();

    delete (globalThis as any).KV;
    delete process.env.OPSKITPRO_ADMIN_PASSWORD;
    delete process.env.OPSKITPRO_ADMIN_SECRET;
  });

  it("uses KV for Cloudflare Access whitelisted diagnostic cache requests", async () => {
    vi.stubGlobal("fetch", makeFetchStub());
    const kv = {
      get: vi.fn().mockResolvedValue(null),
      put: vi.fn().mockResolvedValue(undefined),
    };
    (globalThis as any).KV = kv;
    process.env.OPSKITPRO_ADMIN_EMAILS = "will@example.com";
    process.env.OPSKITPRO_ADMIN_SECRET = "test-secret";

    const res = await diagnosticGET(
      new NextRequest(
        "http://localhost/api/diagnostic?domain=example.com&cache=kv",
        {
          headers: {
            cookie: await createCloudflareAccessAdminCookie("will@example.com"),
          },
        },
      ),
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(kv.get).toHaveBeenCalled();
    expect(kv.put).toHaveBeenCalled();

    delete (globalThis as any).KV;
    delete process.env.OPSKITPRO_ADMIN_EMAILS;
    delete process.env.OPSKITPRO_ADMIN_SECRET;
  });
});
