# OpsKitPro Product Roadmap

OpsKitPro is evolving from a diagnostics-led site into a focused tool collection.
Website Check remains the professional anchor, while frequent, browser-first
utilities broaden everyday usefulness. AI is an enhancement inside specific
tasks, not a separate general chat product.

This public roadmap describes product direction only. Dates, private analytics,
promotion experiments, infrastructure operations, and internal decision logs
remain in the private Control Plane.

## Completed Foundations

- ✅ Next.js 16 standalone Node.js deployment on AWS Lightsail behind Cloudflare.
- ✅ English and Simplified Chinese public routes with SSG where practical.
- ✅ Website Check with DNS, HTTP, TLS, CDN, redirect, security-header, and
  multi-observation evidence.
- ✅ Network Doctor, DNS Security, IP Lookup, Cloudflare Trace, JSON, WebSocket,
  QR, encoding, time, and Prompt Builder tools.
- ✅ Tool-first homepage and catalog; public Blog module retired with controlled
  redirects for known legacy URLs.
- ✅ Answer-ready bilingual tool guidance, consistent structured data,
  `/api/tools`, and `/llms.txt` discovery surfaces.
- ✅ Privacy-minimal tool funnel and AI-referral classification boundaries.

## Password Security — Completed

### P0: Better generation

- ✅ Homepage secure generator.
- ✅ Account, Wi-Fi, API, and easy-to-type presets.
- ✅ Ambiguous and custom character exclusions.
- ✅ 4–8 word passphrases with separators and optional digits.

### P1: Evidence and exposure lookup

- ✅ Local strength findings for length, diversity, repetitions, sequences,
  keyboard patterns, and common-password indicators.
- ✅ Explicit-click HIBP k-anonymity lookup using only a five-character SHA-1
  prefix with padded responses.
- ✅ Bounded found/not-found/unavailable copy without a "guaranteed safe" claim.

### P2: Browser-local encrypted vault MVP

- ✅ Versioned PBKDF2 + AES-GCM encrypted IndexedDB envelope.
- ✅ Local entry create/edit/search/copy/delete.
- ✅ Manual, inactivity, and page-hidden locking.
- ✅ Clipboard-clear delay, encrypted import/export, and typed reset.
- ✅ Recovery and unaudited-MVP warnings.

The next password milestone is observation and hardening, not cloud sync. Account
recovery, sharing, TOTP, autofill, browser extensions, and cross-device sync
require separate security models and are not implied by this roadmap.

## Current Focus

### Make Website Check exceptional

- Improve explanations, remediation, mobile ergonomics, report quality, and
  browser/edge/origin comparison.
- Add AI-crawler visibility evidence and AI-search readiness checks only when
  they reuse the diagnostic core and remain understandable without a score.
- Prefer in-context modes and remediation entry points over more global
  navigation items.

### Improve the small-tool experience

- Keep the homepage and global navigation concise.
- Prioritize browser-local, no-login tools that work well on phones and average
  networks.
- Evaluate practical Chinese-user scenarios such as image compression and
  conversion, OCR/text extraction, PDF/document handling, QR workflows, and
  date/unit/text conversion.
- Promote a tool only after real usage shows repeat demand.

### Task-specific AI assistance

Near-term candidates must have bounded inputs and outputs:

- AI crawler policy checker and remediation snippets.
- AI search readiness evidence.
- `llms.txt` generation and validation.
- Page-scoped metadata/schema assistance.
- Chinese scenarios such as WeChat titles/summaries, merchant copy, OCR
  structuring, and image-alt assistance.

General AI chat, AI detectors, humanizers, and generic article generators are
out of scope because they dilute the tool position and create avoidable accuracy,
cost, and compliance risks.

## Distribution and China Readiness

- Chinese education and promotion move toward WeChat Official Account tool
  demonstrations, before/after examples, short checklists, and direct tool links.
- Product pages should remain mobile-first, low-friction, and understandable to
  users outside specialist engineering roles without reducing capability.
- A separate China site is discovery-only until domain, hosting/CDN, ICP,
  privacy, data residency, compliant AI providers, content labeling, operations,
  and support responsibilities are explicitly approved.

## Investment Gates

Before adding major navigation items, server costs, or model-backed features:

1. Observe opens, runs, success/error, and repeat use without collecting secret
   content.
2. Confirm the feature fits an existing user task and can explain its limits.
3. Define processing location, external requests, quotas, and rollback.
4. Prefer local/deterministic processing before adding a model dependency.
5. Release security-sensitive stages independently with tests and production
   smoke checks.
