# OpsKitPro Architecture and Trust Boundaries

This document describes the current public Product architecture. It intentionally
omits credentials, private analytics, origin details, and operational procedures.

## System Overview

```mermaid
flowchart TD
    U["Browser"] --> C["Cloudflare: DNS, TLS, CDN, WAF"]
    C --> N["Nginx on AWS Lightsail"]
    N --> P["Next.js 16 standalone Node.js"]
    P --> S["Static EN/ZH pages"]
    P --> A["Dynamic public APIs"]
    P --> M["Private admin surface"]
    P --> E["Authenticated Cloudflare edge probe"]
```

- Cloudflare is the public edge and private-admin Access layer.
- Nginx is the Lightsail origin proxy.
- Next.js runs as a standalone Node.js service.
- Cloudflare Workers and Workers KV are not the Product runtime.
- Public pages are localized under `/en` and `/zh` and statically generated
  where possible. APIs and admin routes are dynamic.

## Product Layers

### Quick utility layer

Browser-first tools complete a bounded task with minimal input. Examples include
password generation, QR codes, encoding, time conversion, and JSON operations.
These tools should process data locally unless their purpose inherently requires
a network observation.

### Professional diagnostic layer

Website Check, Network Doctor, DNS Security, IP Lookup, and Cloudflare Trace
combine browser observations with bounded server or edge probes. Every finding
must identify its observation point; a server probe must not be presented as the
user's local network result.

### Task-specific assistance layer

Deterministic analysis and future model-backed assistance belong inside a clear
tool workflow. OpsKitPro does not use a general chat interface as its product
center. Model-backed features require an explicit data-flow, cost, quota, and
privacy review before release.

## Password Security Data Flows

```mermaid
flowchart LR
    G["Password or passphrase"] --> L["Local generation and strength analysis"]
    G --> S["Current page session history"]
    L --> C["Copy or QR transfer"]
```

### Generation and strength

- Random passwords and passphrases use Web Crypto in the browser.
- Strength evidence is computed locally.
- Password content and strength findings are not sent to OpsKitPro analytics,
  APIs, URLs, or logs.
- Generated history is kept only in React page memory, limited to five entries,
  and is not written to localStorage, IndexedDB, or a server.
- The Product intentionally does not provide breach checking, password vaults,
  user accounts, long-term password storage, or cloud synchronization.

## Diagnostic Boundaries

- Target parsing rejects unsupported protocols, credentials, ports, private and
  reserved destinations, and unsafe redirect targets.
- Live diagnostics bypass application caching and expose bounded evidence rather
  than claiming a universal view.
- Browser, Cloudflare Edge, and Lightsail probe results remain separate
  observations.
- Public APIs use route-appropriate quotas and stable error contracts.

## Localization and Discovery

- Maintained locales: English (`en`) and Simplified Chinese (`zh`).
- Retired `ja` and `tw` routes redirect to maintained equivalents.
- The tool catalog is the source for localized discovery, structured data,
  `/api/tools`, and `/llms.txt`.
- Tool pages expose visible purpose, inputs, outputs, processing location,
  privacy, limitations, examples, and related tools.
- The former Blog module is retired; known valuable URLs redirect to tools and
  unknown routes return 404.

## Repository and Data Ownership

| Area | Owner | Public? |
|---|---|---|
| Product UI, public APIs, tests | `opskitpro` | Yes |
| Operations, analytics, automation, AI memory | `opskitpro-ops` | No |
| Finished static knowledge material | `opskitpro-public` | Yes |

The Product repository must not contain production credentials, private traffic
data, publishing queues, internal reports, or copied `.ai` memory.

## Release Gates

- `npm run verify:fast` runs import checks, lint, application/test type checks,
  production build, and unit/component tests.
- `npm run test:e2e` covers browser workflows when the change warrants it.
- `npm run package:standalone` verifies the Lightsail artifact.
- Security-sensitive features receive focused contract tests, browser checks,
  production smoke tests, and an independently reversible release.
