# OpsKitPro — Practical Browser Tools and Website Diagnostics

[English](./README.md) | [简体中文](./README_zh.md)

OpsKitPro is a bilingual collection of focused online tools. It combines quick,
no-login utilities for everyday tasks with deeper website and network
diagnostics for developers, site owners, and operations teams.

The product is intentionally tool-first:

- one task, one clear result;
- useful on phones and slower networks;
- browser-local processing whenever practical;
- no public account required;
- AI is used only where it materially improves a specific workflow.

Website Check remains the professional anchor, while password security, QR,
JSON, encoding, time, network, and other small tools provide frequent everyday
value. The former public Blog module has been retired; valuable legacy URLs are
redirected to relevant tools.

> [!IMPORTANT]
> This public repository contains the user-facing product only. Private
> analytics, operational automation, publishing workflows, server notes, and
> project memory belong in the private `opskitpro-ops` repository.

## Product Direction

OpsKitPro is designed around three layers:

1. **Quick utilities** — complete a common task immediately without signing in.
2. **Professional checks** — explain website, DNS, TLS, CDN, and network behavior
   with evidence and observation points.
3. **Task-specific assistance** — add deterministic or AI-assisted help inside a
   tool, rather than building a general chat product.

English and Simplified Chinese are the maintained public languages. Retired
Japanese and Traditional Chinese URLs redirect to the closest maintained
locale. Chinese distribution is shifting toward practical demonstrations and
checklists through the WeChat Official Account; this does not change the public
repository boundary.

## Main Tools

### Website and network

- **Website Check** (`/tools/website-check`) — DNS, HTTP, TLS, CDN, redirects,
  security headers, and multi-observation diagnostics.
- **Network Doctor** (`/tools/network-check`) — connectivity context, IPv6, DNS
  latency, reachability, and Cloudflare request information.
- **DNS Security** (`/tools/dns-lookup`) — DNS records and SPF, DMARC, and CAA
  policy signals.
- **IP Lookup** and **Cloudflare Trace** — network and edge context.
- **Cloudflare Error Encyclopedia** (`/errors/*`) — evidence-led explanations
  for common Cloudflare failures.

### Password security

- A compact secure password generator is available directly on the homepage.
- The full tool provides account, Wi-Fi, API, and easy-to-type presets;
  ambiguous/custom character exclusions; UUID/PIN modes; and 4–8 word
  passphrases.
- Strength findings are calculated locally and explain length, diversity,
  repetitions, sequences, keyboard patterns, and common-password indicators.
- The focused workbench keeps the result, strength feedback, presets, length,
  and character controls together; low-frequency settings and the current-page
  history stay collapsed until needed.

### Everyday and developer utilities

- QR code generation
- JSON formatting, repair, comparison, conversion, and validation
- WebSocket testing
- Encoding and decoding
- Time conversion
- Prompt Builder

## Privacy Model

- Generated passwords and strength findings are not sent to OpsKitPro.
- Password history exists only in the current page session and is cleared after
  a refresh or when the page is closed.
- The tool does not provide password management, breach checks, accounts, or
  cloud synchronization.
- Clipboard managers and browser extensions may still observe copied content.
- Public diagnostics that require server-side observation clearly distinguish
  the OpsKitPro probe from the user's own browser.

## Runtime Architecture

```text
Browser
   │
Cloudflare (DNS, TLS, CDN, WAF, Access for private admin)
   │
Nginx on AWS Lightsail
   │
Next.js 16 standalone Node.js product
   ├── /en and /zh static public pages
   ├── /api dynamic diagnostic endpoints
   └── /admin private convenience surface
```

Cloudflare Workers and Workers KV are not Product runtime dependencies. See
[`docs/architecture.md`](./docs/architecture.md) for data flows and trust
boundaries.

## Repository Model

| Repository | Visibility | Responsibility |
|---|---|---|
| `opskitpro` | Public | Product UI, public tools/APIs, tests, and deployment workflow |
| `opskitpro-ops` | Private | Django control plane, analytics, automation, reports, and canonical AI memory |
| `opskitpro-public` | Public | Finished static knowledge-base material; no private drafts or operations state |

Do not add credentials, production traffic data, private plans, publishing
queues, or `.ai` project memory to this repository.

## Technology

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Runtime | Standalone Node.js on AWS Lightsail |
| Edge | Cloudflare |
| Styling | Tailwind CSS 3 |
| Tests | Vitest + Playwright |
| Deployment | GitHub Actions → AWS Lightsail |

## Development

```bash
git clone https://github.com/will-opz/opskitpro.git
cd opskitpro
npm install
npm run dev
```

Useful checks:

```bash
npm run verify:fast
npm run test:e2e
npm run package:standalone
```

The standalone archive is written to
`.deploy/opskitpro-standalone.tar.gz`. Deployment details are in
[`deploy/lightsail/README.md`](./deploy/lightsail/README.md).

Runtime admin variables:

```bash
OPSKITPRO_ADMIN_PASSWORD=
OPSKITPRO_ADMIN_SECRET=
OPSKITPRO_ADMIN_EMAILS=
```

Keep real values in server environment files or GitHub Secrets. Public tools do
not require these variables and must remain usable without login.

## Documentation

- [Architecture and trust boundaries](./docs/architecture.md)
- [Product roadmap](./docs/roadmap.md)
- [Release history](./CHANGELOG.md)
- [Lightsail deployment](./deploy/lightsail/README.md)

## Contact

- Website: [opskitpro.com](https://opskitpro.com)
- Email: [admin@opskitpro.com](mailto:admin@opskitpro.com)
- X: [@OpsKitPro](https://x.com/OpsKitPro)
