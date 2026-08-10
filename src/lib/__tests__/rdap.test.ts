import { describe, expect, it, vi } from "vitest";

import { getRdapLookupTarget, lookupRdap } from "@/lib/rdap";

describe("RDAP lookup", () => {
  it("derives registrable domains with public-suffix awareness", () => {
    expect(getRdapLookupTarget("www.baidu.com", false)).toBe("baidu.com");
    expect(getRdapLookupTarget("service.example.co.uk", false)).toBe(
      "example.co.uk",
    );
    expect(getRdapLookupTarget("shop.example.com.cn", false)).toBe(
      "example.com.cn",
    );
    expect(getRdapLookupTarget("203.0.113.10", true)).toBe("203.0.113.10");
    expect(getRdapLookupTarget("localhost", false)).toBeNull();
  });

  it("queries the registrable domain instead of the subdomain", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ objectClassName: "domain" }),
    );

    const result = await lookupRdap("www.baidu.com", false, { fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://rdap.org/domain/baidu.com",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result).toMatchObject({
      ok: true,
      lookupTarget: "baidu.com",
      source: "rdap",
      httpStatus: 200,
    });
  });

  it("preserves not-found responses", async () => {
    const result = await lookupRdap("missing.example", false, {
      fetchImpl: vi.fn(async () => new Response(null, { status: 404 })),
    });

    expect(result).toMatchObject({
      ok: false,
      lookupTarget: "missing.example",
      errorCode: "not_found",
      httpStatus: 404,
    });
  });

  it("distinguishes timeout and parse failures", async () => {
    const timeout = await lookupRdap("example.com", false, {
      fetchImpl: vi.fn(async () => {
        throw new DOMException("Timed out", "TimeoutError");
      }),
    });
    const parseFailure = await lookupRdap("example.com", false, {
      fetchImpl: vi.fn(async () =>
        new Response("not json", {
          status: 200,
          headers: { "content-type": "application/rdap+json" },
        }),
      ),
    });

    expect(timeout).toMatchObject({ ok: false, errorCode: "timeout" });
    expect(parseFailure).toMatchObject({
      ok: false,
      errorCode: "parse_error",
      httpStatus: 200,
    });
  });
});
