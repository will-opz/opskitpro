// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { generateKeyPair, exportJWK, SignJWT, type JWTPayload } from "jose";
import { NextRequest } from "next/server";

const issuer = "https://test-team.cloudflareaccess.com";
const audience = "test-admin-audience";
const email = "admin@example.com";
const key1 = await generateKeyPair("RS256");
const key2 = await generateKeyPair("RS256");
const jwk1 = { ...await exportJWK(key1.publicKey), kid: "key-1", alg: "RS256", use: "sig" };
const jwk2 = { ...await exportJWK(key2.publicKey), kid: "key-2", alg: "RS256", use: "sig" };
let fetchMock: ReturnType<typeof vi.fn>;
let auth: typeof import("@/lib/admin-auth");

async function token(overrides: JWTPayload = {}, key = key1.privateKey, kid = "key-1") {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: issuer, aud: [audience], sub: "user-123", email,
    type: "app", iat: now - 1, exp: now + 120, ...overrides })
    .setProtectedHeader({ alg: "RS256", kid }).sign(key);
}
function headers(assertion?: string, extra: Record<string, string> = {}) {
  return new Headers({ ...(assertion ? { "cf-access-jwt-assertion": assertion } : {}), ...extra });
}

beforeEach(async () => {
  vi.resetModules();
  vi.stubEnv("OPSKITPRO_ACCESS_ISSUER", issuer);
  vi.stubEnv("OPSKITPRO_ACCESS_AUDIENCE", audience);
  vi.stubEnv("OPSKITPRO_ADMIN_EMAILS", email);
  vi.stubEnv("OPSKITPRO_ADMIN_EMAIL_DOMAINS", "");
  fetchMock = vi.fn().mockImplementation(async () => Response.json({ keys: [jwk1] }));
  vi.stubGlobal("fetch", fetchMock);
  auth = await import("@/lib/admin-auth");
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Access admin trust boundary", () => {
  it.each(["operator@example.org", "operator@example.net", "Operator+admin@EXAMPLE.ORG", email])("accepts approved exact email or domain: %s", async (identityEmail) => {
    vi.stubEnv("OPSKITPRO_ADMIN_EMAIL_DOMAINS", " example.org,EXAMPLE.NET ");
    const result = await auth.getAdminIdentity(headers(await token({ email: identityEmail })));
    expect(result).toEqual({ authenticated: true, email: identityEmail.toLowerCase(), provider: "cloudflare_access" });
  });
  it.each([
    "other@gmail.com", "admin@sub.example.org", "admin@notexample.org",
    "admin@example.org.evil.test", "admin@example.org.", "admin@@example.org",
    "@example.org", "a b@example.org", "a..b@example.org", ".a@example.org",
    "a.@example.org", "a\n@example.org", '"a"@example.org',
  ])("rejects domain lookalikes and malformed email: %s", async (identityEmail) => {
    vi.stubEnv("OPSKITPRO_ADMIN_EMAIL_DOMAINS", "example.org,example.net");
    expect((await auth.getAdminIdentity(headers(await token({ email: identityEmail })))).authenticated).toBe(false);
  });
  it.each(["*.example.org", "@example.org", "example.org.", "https://example.org", "example..org", "-example.org", "example", "éxample.org"])("fails closed on invalid domain config: %s", async (domain) => {
    vi.stubEnv("OPSKITPRO_ADMIN_EMAIL_DOMAINS", `example.org,${domain}`);
    expect(auth.isAdminConfigured()).toBe(false);
    expect((await auth.getAdminIdentity(headers(await token()))).authenticated).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("allows a domain-only configuration but still requires a valid signed JWT", async () => {
    vi.stubEnv("OPSKITPRO_ADMIN_EMAILS", "");
    vi.stubEnv("OPSKITPRO_ADMIN_EMAIL_DOMAINS", "example.org");
    expect(auth.isAdminConfigured()).toBe(true);
    const claims = { email: "operator@example.org" };
    expect((await auth.getAdminIdentity(headers(await token(claims)))).authenticated).toBe(true);
    for (const assertion of [await token(claims, key2.privateKey), await token({ ...claims, aud: "wrong" }), await token({ ...claims, exp: 1 })]) {
      expect((await auth.getAdminIdentity(headers(assertion))).authenticated).toBe(false);
    }
    expect((await auth.getAdminIdentity(headers(undefined, { "cf-access-authenticated-user-email": claims.email }))).authenticated).toBe(false);
  });
  it("verifies a signed app JWT and uses signed email, not an email header", async () => {
    const identity = await auth.getAdminIdentity(headers(await token(), { "cf-access-authenticated-user-email": "attacker@example.com" }));
    expect(identity).toEqual({ authenticated: true, email, provider: "cloudflare_access" });
    expect(fetchMock.mock.calls[0][0]).toBe(`${issuer}/cdn-cgi/access/certs`);
    expect(fetchMock.mock.calls[0][1].redirect).toBe("manual");
  });
  it("rejects forged email and every old deterministic cookie without fetching keys", async () => {
    vi.stubEnv("OPSKITPRO_ADMIN_PASSWORD", "old-password");
    vi.stubEnv("OPSKITPRO_ADMIN_SECRET", "old-secret");
    for (const input of [`cloudflare-access:${email}:old-secret`, `password:${email}:old-secret`, "old-password:old-secret"]) {
      const cookie = createHash("sha256").update(input).digest("hex");
      const request = new NextRequest("https://opskitpro.com/api/admin/session", { headers: headers(undefined, {
        "cf-access-authenticated-user-email": email, cookie: `opskitpro_admin=${cookie}`,
      }) });
      expect(await auth.isAdminRequest(request)).toBe(false);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it.each([
    ["issuer", { iss: "https://attacker.example" }], ["audience", { aud: "other-app" }],
    ["expired", { exp: 1 }], ["not yet valid", { nbf: 4_000_000_000 }],
    ["future issued", { iat: 4_000_000_000 }], ["missing expiry", { exp: undefined }],
    ["missing issued", { iat: undefined }], ["empty subject", { sub: "" }],
    ["email allowlist", { email: "attacker@example.com" }], ["missing email", { email: undefined }],
    ["service token", { type: "service" }], ["missing type", { type: undefined }],
  ])("rejects %s", async (_name, payload) => {
    expect((await auth.getAdminIdentity(headers(await token(payload)))).authenticated).toBe(false);
  });
  it("rejects a wrong signature, unsigned token and symmetric algorithm", async () => {
    const good = await token();
    const unsigned = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${good.split('.')[1]}.`;
    const symmetric = await new SignJWT({ email }).setProtectedHeader({ alg: "HS256" }).sign(new Uint8Array(32));
    for (const value of [await token({}, key2.privateKey), unsigned, symmetric, "bad", "x".repeat(16385)]) {
      expect((await auth.getAdminIdentity(headers(value))).authenticated).toBe(false);
    }
  });
  it.each(["", "http://test-team.cloudflareaccess.com", "https://attacker.example", `${issuer}/`, `${issuer}@attacker.example`])("fails closed for invalid configuration %s", async (value) => {
    vi.stubEnv("OPSKITPRO_ACCESS_ISSUER", value);
    expect(auth.isAdminConfigured()).toBe(false);
    expect((await auth.getAdminIdentity(headers(await token()))).authenticated).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("fails closed for missing audience or allowlist", async () => {
    vi.stubEnv("OPSKITPRO_ACCESS_AUDIENCE", "");
    expect(auth.isAdminConfigured()).toBe(false);
    vi.stubEnv("OPSKITPRO_ACCESS_AUDIENCE", audience);
    vi.stubEnv("OPSKITPRO_ADMIN_EMAILS", "");
    expect(auth.isAdminConfigured()).toBe(false);
  });
  it("caches keys and reloads on rotation after bounded cooldown", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const first = await token();
    expect((await auth.getAdminIdentity(headers(first))).authenticated).toBe(true);
    expect((await auth.getAdminIdentity(headers(first))).authenticated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockImplementation(async () => Response.json({ keys: [jwk2] }));
    expect((await auth.getAdminIdentity(headers(await token({}, key2.privateKey, "key-2")))).authenticated).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 31_000);
    expect((await auth.getAdminIdentity(headers(await token({}, key2.privateKey, "key-2")))).authenticated).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("does not keep accepting an expired token with cached keys", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const value = await token();
    expect((await auth.getAdminIdentity(headers(value))).authenticated).toBe(true);
    vi.setSystemTime(Date.now() + 121_000);
    expect((await auth.getAdminIdentity(headers(value))).authenticated).toBe(false);
  });
  it.each(["offline", "malformed", "redirect"])("fails closed on JWKS %s", async (kind) => {
    fetchMock.mockImplementation(async () => {
      if (kind === "offline") throw new Error("offline");
      if (kind === "redirect") return new Response(null, { status: 302, headers: { location: "https://attacker.example" } });
      return Response.json({ keys: "bad" });
    });
    expect((await auth.getAdminIdentity(headers(await token()))).authenticated).toBe(false);
  });
  it("requires fresh usable keys after cache expiry, even on an outage", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    expect((await auth.getAdminIdentity(headers(await token()))).authenticated).toBe(true);
    vi.setSystemTime(Date.now() + 601_000);
    fetchMock.mockRejectedValue(new Error("offline"));
    expect((await auth.getAdminIdentity(headers(await token()))).authenticated).toBe(false);
  });
});

describe("admin HTTP routes use the real verifier", () => {
  it("reports signed identity, never caches it, and expires the legacy cookie", async () => {
    const { GET } = await import("@/app/api/admin/session/route");
    const result = await GET(new NextRequest("https://opskitpro.com/api/admin/session", { headers: headers(await token()) }));
    expect(await result.json()).toMatchObject({ authenticated: true, email, passwordConfigured: false, accessConfigured: true });
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(result.cookies.get("opskitpro_admin")?.maxAge).toBe(0);
  });
  it("rejects password fallback even with old environment configured; logout points to Access", async () => {
    vi.stubEnv("OPSKITPRO_ADMIN_PASSWORD", "old-password");
    const { GET, POST, DELETE } = await import("@/app/api/admin/session/route");
    expect((await POST()).status).toBe(403);
    const result = await GET(new NextRequest("https://opskitpro.com/api/admin/session", { headers: headers(undefined, { "cf-access-authenticated-user-email": email, cookie: "opskitpro_admin=old" }) }));
    expect(await result.json()).toMatchObject({ authenticated: false, email: "", provider: null });
    expect(await (await DELETE()).json()).toEqual({ authenticated: false, logoutUrl: "/cdn-cgi/access/logout" });
  });
  it("auth callback rejects email-only identity", async () => {
    const { GET } = await import("@/app/admin/auth/route");
    const result = await GET(new NextRequest("https://opskitpro.com/admin/auth", { headers: headers(undefined, { "cf-access-authenticated-user-email": email }) }));
    expect(result.status).toBe(401);
    expect(result.headers.get("location")).toBeNull();
  });
  it.each(["//evil.example", "/\\evil.example", "/\tevil.example", "/api/admin/session", "/_next/data"])("auth callback refuses unsafe next %s", async (next) => {
    const { GET } = await import("@/app/admin/auth/route");
    const result = await GET(new NextRequest(`https://opskitpro.com/admin/auth?next=${encodeURIComponent(next)}`, { headers: headers(await token()) }));
    expect(result.headers.get("location")).toBe("https://opskitpro.com/admin");
    expect(result.cookies.get("opskitpro_admin")?.maxAge).toBe(0);
  });
  it("auth callback keeps valid local navigation without minting a bearer cookie", async () => {
    const { GET } = await import("@/app/admin/auth/route");
    const result = await GET(new NextRequest("https://opskitpro.com/admin/auth?next=/zh/nav", { headers: headers(await token()) }));
    expect(result.headers.get("location")).toBe("https://opskitpro.com/zh/nav");
    expect(result.cookies.get("opskitpro_admin")?.value).toBe("");
  });
});
