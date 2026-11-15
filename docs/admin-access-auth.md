# Administrator authentication

Administrator requests use Cloudflare Access JWT assertions. Public tools, APIs,
and MCP remain anonymous. The application does not authenticate the unsigned
`Cf-Access-Authenticated-User-Email` header or the old `opskitpro_admin` cookie.

Configure server-only variables:

- `OPSKITPRO_ACCESS_ISSUER`: exact `https://<team>.cloudflareaccess.com`, no trailing slash.
- `OPSKITPRO_ACCESS_AUDIENCE`: the administrator Access application's AUD.
- `OPSKITPRO_ADMIN_EMAILS`: comma-separated allowed administrator emails.

Missing or invalid configuration fails closed. The verifier accepts RS256 app
JWTs only, validates signature/issuer/audience/expiration/not-before, requires
issued-at/subject/email, and checks the signed email against the allowlist.
JWKS are fetched only from the configured issuer, with a 3-second timeout,
10-minute cache, and 30-second rotation cooldown. An unavailable key service
cannot grant a new identity; usable cached keys remain valid until cache expiry.
Revocation at Cloudflare is enforced at the edge; offline JWT verification alone
cannot detect revocation before token expiry. Keep the origin inaccessible to
untrusted direct callers and protect every management path with Access.

## Migration

This intentionally invalidates **all** old administrator cookies, including the
password fallback. `OPSKITPRO_ADMIN_PASSWORD` and `OPSKITPRO_ADMIN_SECRET` no
longer enable application login. No new application bearer cookie is minted.
Session/auth endpoints expire the retired host-only cookie; deletion is cleanup,
not the security boundary. Every request must carry a valid Access assertion.
Do not reintroduce a password bypass for JWKS failures or missing configuration.

Before a separately authorized release, protect `/admin`, `/admin/*`,
`/api/admin`, and `/api/admin/*` in the same Access application with the configured
AUD. Verify the existing reverse proxy forwards `Cf-Access-Jwt-Assertion`.
`/api/admin/session` must receive the assertion for the navigation UI to recognize
an administrator. This repository change does not edit any edge configuration.
Do not extend Access or a JavaScript challenge to public `/api/*` or `/mcp`.

The session query intentionally returns HTTP200 with `authenticated: false`
for anonymous callers; that is not permission to read administrator data.
Password POST returns403. The authenticated callback only redirects to a safe
local path. Every admin page checks identity independently of its shared layout.

Sign-out clears the obsolete cookie and performs a full navigation to the fixed
`/cdn-cgi/access/logout` endpoint. Only Cloudflare can end its SSO session; the
application's DELETE response alone does not revoke an Access token. The local
server cannot emulate remote SSO revocation. No credentials are kept in browser
storage; logout preserves users' unrelated local tool history and preferences.

## Verification

Run `npx vitest run src/lib/__tests__/admin-auth.test.ts src/proxy.test.ts
src/app/mcp/access-boundary.test.ts src/app/mcp/route.test.ts --maxWorkers=2`
as a single command. These tests use ephemeral RSA keys and fake JWKS responses;
they do not contact Cloudflare or execute diagnostic measurements.

`e2e/admin-access.spec.ts` is a local production-server acceptance suite. It
requires a local-only test fixture supplied through `ADMIN_ACCESS_FIXTURE`; never
supply production assertions. The fixture and JWKS interception must live outside
application source and must not be packaged into a release. Use a fresh browser
context and block external requests. No infrastructure apply/deploy command is
part of this change, so there is no production dry-run/apply path.
