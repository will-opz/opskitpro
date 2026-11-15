import "server-only";

import { createRemoteJWKSet, jwtVerify } from "jose";
import type { NextRequest } from "next/server";

// Legacy cookies are deliberately never read as authentication credentials.
export const ADMIN_COOKIE_NAME = "opskitpro_admin";
export const ACCESS_JWT_HEADER = "cf-access-jwt-assertion";
export const ACCESS_LOGOUT_PATH = "/cdn-cgi/access/logout";
type HeaderReader = { get(name: string): string | null };
export type AdminIdentity = {
  authenticated: boolean;
  email: string;
  provider: "cloudflare_access" | null;
};

export function getAllowedAdminEmails() {
  return (process.env.OPSKITPRO_ADMIN_EMAILS || "")
    .split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
}

function allowedAdminDomains(): string[] | null {
  const domains = (process.env.OPSKITPRO_ADMIN_EMAIL_DOMAINS || "")
    .split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean);
  // Exact ASCII DNS names only: no @, wildcard, URL, suffix or subdomain matching.
  const label = "[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?";
  const domainPattern = new RegExp(`^${label}(?:\\.${label})+$`);
  return domains.every((domain) => domain.length <= 253 && domainPattern.test(domain))
    ? domains : null;
}

function emailAllowed(email: string, domains: string[]) {
  if (getAllowedAdminEmails().includes(email)) return true;
  const parts = email.split("@");
  if (parts.length !== 2 || email.length > 254 || parts[0].length > 64) return false;
  // A conservative dot-atom local part keeps malformed claims out of domain grants.
  const atom = "[a-z0-9!#$%&'*+/=?^_`{|}~-]+";
  return new RegExp(`^${atom}(?:\\.${atom})*$`).test(parts[0]) && domains.includes(parts[1]);
}

function accessConfiguration() {
  const issuer = process.env.OPSKITPRO_ACCESS_ISSUER?.trim() || "";
  const audience = process.env.OPSKITPRO_ACCESS_AUDIENCE?.trim() || "";
  const domains = allowedAdminDomains();
  // The issuer is operator configuration, never a URL supplied by a token.
  if (!/^https:\/\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/.test(issuer)
    || !audience || domains === null
    || (getAllowedAdminEmails().length === 0 && domains.length === 0)) return null;
  return { issuer, audience, domains };
}

export function isAdminConfigured() {
  return accessConfiguration() !== null;
}

let cached: { issuer: string; keys: ReturnType<typeof createRemoteJWKSet> } | undefined;
function signingKeys(issuer: string) {
  if (cached?.issuer !== issuer) {
    cached = {
      issuer,
      keys: createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), {
        timeoutDuration: 3000,
        cooldownDuration: 30_000,
        cacheMaxAge: 600_000,
      }),
    };
  }
  return cached.keys;
}

export async function getAdminIdentity(headers: HeaderReader): Promise<AdminIdentity> {
  const denied: AdminIdentity = { authenticated: false, email: "", provider: null };
  const config = accessConfiguration();
  const assertion = headers.get(ACCESS_JWT_HEADER);
  if (!config || !assertion || assertion.length > 16_384) return denied;
  try {
    const { payload } = await jwtVerify(assertion, signingKeys(config.issuer), {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ["RS256"],
      requiredClaims: ["iss", "aud", "exp", "iat", "sub", "email"],
      clockTolerance: 0,
    });
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.iat !== "number" || payload.iat > now
      || typeof payload.exp !== "number" || payload.exp <= payload.iat
      || typeof payload.sub !== "string" || !payload.sub
      || typeof payload.email !== "string" || payload.type !== "app") return denied;
    const email = payload.email.trim().toLowerCase();
    if (!emailAllowed(email, config.domains)) return denied;
    return { authenticated: true, email, provider: "cloudflare_access" };
  } catch {
    // Invalid tokens and unavailable/invalid JWKS fail closed. Never log tokens.
    return denied;
  }
}

export async function isAdminRequest(request: NextRequest) {
  return (await getAdminIdentity(request.headers)).authenticated;
}
